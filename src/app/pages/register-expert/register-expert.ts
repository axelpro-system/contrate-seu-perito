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
    selector: 'app-register-expert',
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
    templateUrl: './register-expert.html',
    styleUrl: './register-expert.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterExpert {
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
                profile_type: ProfileType.PERITO,
                profile_visible: true,
            };
            const { data, error } = await this.supabaseService.signUp(email, password, sanitized);
            if (error) {
                console.error('SignUp error details:', error);
                throw error;
            }

            if (data?.user?.identities?.length === 0) {
                this.snackBar.open('Este email já está cadastrado.', 'Fechar', { duration: 5000 });
                this.submitting = false;
                return;
            }

            this.snackBar.open('Cadastro realizado! Verifique seu e-mail para ativar a conta.', 'Fechar', { duration: 5000 });
            this.router.navigate(['/register-expert/success']);
        } catch (error: any) {
            const msg = error?.message || error?.error_description || 'Erro ao cadastrar. Tente novamente.';
            this.snackBar.open(msg, 'Fechar', { duration: 5000 });
            console.error('Registration error:', error);
        } finally {
            this.submitting = false;
        }
    }
}
