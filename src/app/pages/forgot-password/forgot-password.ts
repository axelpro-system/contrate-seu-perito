import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSnackBarModule,
        RouterLink
    ],
    templateUrl: './forgot-password.html',
    styleUrl: './forgot-password.scss'
})
export class ForgotPassword {
    resetForm: FormGroup;
    loading = false;

    constructor(
        private fb: FormBuilder,
        private supabaseService: SupabaseService,
        private snackBar: MatSnackBar
    ) {
        this.resetForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]]
        });
    }

    async onSubmit() {
        if (this.resetForm.valid) {
            this.loading = true;
            const { email } = this.resetForm.value;
            try {
                const { error } = await this.supabaseService.resetPasswordForEmail(email);
                if (error) throw error;

                this.snackBar.open('Email de recuperação enviado!', 'Fechar', { duration: 5000 });
            } catch (error: any) {
                this.snackBar.open(error.message || 'Erro ao enviar email', 'Fechar', { duration: 3000 });
            } finally {
                this.loading = false;
            }
        }
    }
}
