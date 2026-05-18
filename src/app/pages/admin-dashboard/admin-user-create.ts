import { Component, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatSlideToggleModule, MatProgressSpinnerModule],
    template: `
    <div class="admin-page">
      <div class="header">
        <h1>Novo Usuário</h1>
        <button mat-stroked-button routerLink="/admin/users"><mat-icon>arrow_back</mat-icon> Voltar</button>
      </div>

      <div class="form-card">
        <div class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Nome</mat-label>
            <input matInput [(ngModel)]="firstName" placeholder="Nome">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Sobrenome</mat-label>
            <input matInput [(ngModel)]="lastName" placeholder="Sobrenome">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" [(ngModel)]="email" placeholder="email@exemplo.com">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Senha</mat-label>
            <input matInput type="password" [(ngModel)]="password" placeholder="Mínimo 6 caracteres">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Tipo de Perfil</mat-label>
            <mat-select [(ngModel)]="profileType">
              <mat-option value="CONTRATANTE">Contratante</mat-option>
              <mat-option value="PERITO">Perito</mat-option>
              <mat-option value="ADMIN">Admin</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Status da Conta</mat-label>
            <mat-select [(ngModel)]="accountStatus">
              <mat-option value="ACTIVE">Ativo</mat-option>
              <mat-option value="PENDING">Pendente</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="toggles">
          <mat-slide-toggle [(ngModel)]="profileVisible">Perfil visível</mat-slide-toggle>
        </div>

        <div class="actions">
          <button mat-stroked-button routerLink="/admin/users">Cancelar</button>
          <button mat-flat-button color="primary" (click)="createUser()" [disabled]="saving || !isValid()">
            <mat-icon>person_add</mat-icon> {{ saving ? 'Criando...' : 'Criar Usuário' }}
          </button>
        </div>
      </div>
    </div>
  `,
    styles: [`
      .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; }
      .header h1 { margin:0; }
      .form-card { max-width:600px; background:#fff; padding:24px; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.08); }
      .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
      .toggles { margin:20px 0; }
      .actions { display:flex; gap:12px; margin-top:24px; }
      @media (max-width:768px) { .form-grid { grid-template-columns:1fr; } }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUserCreate {
    private supabase = inject(SupabaseService);
    private notify = inject(NotificationService);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);

    firstName = '';
    lastName = '';
    email = '';
    password = '';
    profileType = 'CONTRATANTE';
    accountStatus = 'ACTIVE';
    profileVisible = true;
    saving = false;

    isValid(): boolean {
        return this.email.trim().length > 0 && this.password.trim().length >= 6;
    }

    async createUser() {
        if (!this.isValid()) return;
        this.saving = true;
        this.cdr.detectChanges();

        try {
            const { data, error } = await this.supabase.client.functions.invoke('create-user', {
                body: {
                    email: this.email.trim(),
                    password: this.password,
                    firstName: this.firstName.trim(),
                    lastName: this.lastName.trim(),
                    profileType: this.profileType,
                    accountStatus: this.accountStatus,
                    profileVisible: this.profileVisible,
                }
            });

            if (error) throw error;
            if (!data?.success) throw new Error(data?.error || 'Erro ao criar usuário');

            this.notify.success('Usuário criado com sucesso!');
            this.router.navigate(['/admin/users', data.userId, 'edit']);
        } catch (err: any) {
            console.error('Error creating user:', err);
            const msg = err?.message || err?.error_description || err?.details || 'Erro ao criar usuário';
            this.notify.error(msg);
        } finally {
            this.saving = false;
            this.cdr.detectChanges();
        }
    }
}
