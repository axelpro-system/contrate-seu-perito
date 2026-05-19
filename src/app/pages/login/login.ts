import { Component, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

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
        MatSnackBarModule,
        MatDialogModule,
        MatIconModule,
        CommonModule
    ],
    templateUrl: './login.html',
    styleUrl: './login.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
    private hotmartService = inject(HotmartService);
    private authService = inject(AuthService);
    private dialog = inject(MatDialog);
    loginForm: FormGroup;
    loading = false;
    failedAttempts = 0;
    showForgotPassword = false;
    resetEmail = '';
    sendingReset = false;

    constructor(
        private fb: FormBuilder,
        private supabaseService: SupabaseService,
        private router: Router,
        private snackBar: MatSnackBar,
        private cdr: ChangeDetectorRef
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
                    // Reset failed attempts on successful login
                    this.failedAttempts = 0;
                    this.showForgotPassword = false;
                    await this.authService.awaitProfile();
                    const redirectUrl = this.authService.getRedirectUrl();
                    this.router.navigate([redirectUrl]);
                }
            } catch (error: any) {
                this.failedAttempts++;
                
                // Show forgot password link after 3 failed attempts
                if (this.failedAttempts >= 3) {
                    this.showForgotPassword = true;
                }
                
                this.cdr.detectChanges();
                
                let errorMessage = error.message || 'Erro ao fazer login';
                if (this.failedAttempts >= 3) {
                    errorMessage += '. Esqueceu sua senha? Use o link abaixo.';
                }
                
                this.snackBar.open(errorMessage, 'Fechar', {
                    duration: 5000,
                });
            } finally {
                this.loading = false;
            }
        }
    }

    async sendPasswordReset() {
        const email = this.loginForm.get('email')?.value;
        
        if (!email) {
            this.snackBar.open('Digite seu email acima primeiro', 'Fechar', { duration: 3000 });
            return;
        }

        if (!this.loginForm.get('email')?.valid) {
            this.snackBar.open('Digite um email válido', 'Fechar', { duration: 3000 });
            return;
        }

        this.sendingReset = true;
        
        try {
            // Use Edge Function instead of built-in Supabase
            const { data, error } = await this.supabaseService.client.functions.invoke('send-password-reset', {
                body: { 
                    email: email,
                    redirectUrl: `${window.location.origin}/reset-password`
                }
            });
            
            if (error) {
                console.error('Password reset error:', error);
                // Try to get error details
                let errorMessage = 'Erro ao enviar email de recuperação';
                try {
                    const errorData = await error.context?.json?.();
                    errorMessage = errorData?.error || errorMessage;
                } catch (e) {
                    // Use default message
                }
                throw new Error(errorMessage);
            }
            
            this.snackBar.open(
                data?.message || 'Email de recuperação enviado! Verifique sua caixa de entrada.', 
                'Fechar', 
                { duration: 5000 }
            );
            
            // Reset failed attempts
            this.failedAttempts = 0;
            this.showForgotPassword = false;
            
        } catch (error: any) {
            console.error('Send password reset error:', error);
            this.snackBar.open(
                error.message || 'Erro ao enviar email de recuperação', 
                'Fechar', 
                { duration: 3000 }
            );
        } finally {
            this.sendingReset = false;
            this.cdr.detectChanges();
        }
    }

    loginWithHotmart() {
        this.hotmartService.redirectToAuth();
    }
}
