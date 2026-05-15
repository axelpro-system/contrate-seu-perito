import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormService } from '../../services/form.service';
import { ProfileType } from '../../types';

@Component({
    selector: 'app-register',
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
    templateUrl: './register.html',
    styleUrl: './register.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
    registerForm: import('@angular/forms').FormGroup;
    loading = false;
    submitting = false;

    constructor(
        private formService: FormService,
        private supabaseService: SupabaseService,
        private router: Router,
        private snackBar: MatSnackBar
    ) {
        this.registerForm = this.formService.createRegisterForm();
    }

    async onSubmit() {
        if (!this.formService.validateForm(this.registerForm) || this.submitting) return;
        this.submitting = true;
        const { name, email, password } = this.registerForm.value;
        try {
            const sanitized = {
                full_name: this.formService.sanitizeString(name),
                profile_type: ProfileType.CONTRATANTE,
                profile_visible: true,
            };
            const { error } = await this.supabaseService.signUp(email, password, sanitized);
            if (error) throw error;

            this.snackBar.open('Cadastro realizado! Verifique seu email para confirmar.', 'Fechar', { duration: 5000 });
            this.router.navigate(['/login']);
        } catch (error: any) {
            this.snackBar.open(error.message || 'Erro ao cadastrar', 'Fechar', { duration: 3000 });
        } finally {
            this.submitting = false;
        }
    }
}
