import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HotmartService } from '../../services/hotmart.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        RouterLink,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule,
        MatSnackBarModule
    ],
    templateUrl: './login.html',
    styleUrl: './login.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
    private hotmartService = inject(HotmartService);
    private authService = inject(AuthService);
    loginForm: FormGroup;
    loading = false;

    constructor(
        private fb: FormBuilder,
        private supabaseService: SupabaseService,
        private router: Router,
        private snackBar: MatSnackBar
    ) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    async onSubmit() {
        if (this.loginForm.valid) {
            this.loading = true;
            const { email, password } = this.loginForm.value;
            try {
                const { data: { user }, error } = await this.supabaseService.signIn(email, password);
                if (error) throw error;

                if (user) {
                    await this.authService.awaitProfile();
                    const redirectUrl = this.authService.getRedirectUrl();
                    this.router.navigate([redirectUrl]);
                }
            } catch (error: any) {
                this.snackBar.open(error.message || 'Erro ao fazer login', 'Fechar', {
                    duration: 3000,
                });
            } finally {
                this.loading = false;
            }
        }
    }

    loginWithHotmart() {
        this.hotmartService.redirectToAuth();
    }
}
