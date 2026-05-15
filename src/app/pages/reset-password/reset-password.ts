import { Component, OnInit, ChangeDetectionStrategy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SupabaseService } from '../../services/supabase.service';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatSnackBarModule
    ],
    template: `
    <div class="reset-container">
      <mat-card class="reset-card">
        @if (showForm) {
          <mat-card-header>
            <mat-card-title>Redefinir Senha</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="resetForm">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nova senha</mat-label>
                <input matInput formControlName="password" type="password" placeholder="Nova senha">
                <mat-error *ngIf="resetForm.get('password')?.hasError('required')">Senha é obrigatória</mat-error>
                <mat-error *ngIf="resetForm.get('password')?.hasError('minlength')">Mínimo 6 caracteres</mat-error>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Confirmar nova senha</mat-label>
                <input matInput formControlName="confirmPassword" type="password" placeholder="Confirmar nova senha">
                <mat-error *ngIf="resetForm.get('confirmPassword')?.hasError('required')">Confirmação é obrigatória</mat-error>
                <mat-error *ngIf="resetForm.hasError('passwordMismatch')">As senhas não coincidem</mat-error>
              </mat-form-field>
            </form>
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-button routerLink="/login">Cancelar</button>
            <button mat-raised-button color="primary" [disabled]="resetForm.invalid || loading" (click)="onSubmit()">
              {{ loading ? 'Salvando...' : 'Salvar nova senha' }}
            </button>
          </mat-card-actions>
        } @else {
          <mat-card-content class="success-content">
            <mat-icon class="success-icon">check_circle</mat-icon>
            <h2>Senha atualizada!</h2>
            <p>Sua senha foi redefinida com sucesso.</p>
            <button mat-raised-button color="primary" (click)="goToLogin()">Ir para login</button>
          </mat-card-content>
        }
      </mat-card>
    </div>
  `,
    styles: [`
    .reset-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      background: #f5f5f5;
    }
    .reset-card {
      max-width: 420px;
      width: 100%;
      padding: 24px;
    }
    .full-width { width: 100%; }
    mat-card-actions { padding: 16px 0 0; gap: 8px; }
    .success-content {
      text-align: center;
      padding: 24px 0;
    }
    .success-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #4caf50;
      margin-bottom: 16px;
    }
    h2 { margin: 0 0 8px; color: #1a1a1a; }
    p { margin: 0 0 24px; color: #666; }
    @media (max-width: 480px) {
      .reset-card { padding: 16px; }
    }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPassword implements OnInit {
    private fb = inject(FormBuilder);
    private supabaseService = inject(SupabaseService);
    private snackBar = inject(MatSnackBar);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);

    resetForm!: FormGroup;
    loading = false;
    showForm = true;

    ngOnInit() {
        this.resetForm = this.fb.group({
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required],
        }, { validators: this.passwordMatchValidator });

        this.handleRecoveryToken();
    }

    private async handleRecoveryToken() {
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        if (type !== 'recovery' || !accessToken) {
            this.snackBar.open('Link de redefinição inválido ou expirado.', 'Fechar', { duration: 5000 });
            this.router.navigate(['/forgot-password']);
        }
    }

    private passwordMatchValidator(group: FormGroup) {
        const password = group.get('password')?.value;
        const confirmPassword = group.get('confirmPassword')?.value;
        return password === confirmPassword ? null : { passwordMismatch: true };
    }

    async onSubmit() {
        if (this.resetForm.invalid || this.loading) return;
        this.loading = true;
        try {
            const { error } = await this.supabaseService.client.auth.updateUser({
                password: this.resetForm.value.password
            });
            if (error) throw error;
            this.showForm = false;
            this.cdr.detectChanges();
        } catch (err: any) {
            this.snackBar.open('Erro ao redefinir: ' + err.message, 'Fechar', { duration: 5000 });
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    goToLogin() {
        this.router.navigate(['/login']);
    }
}
