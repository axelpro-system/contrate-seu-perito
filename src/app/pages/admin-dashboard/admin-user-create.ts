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
        <!-- Email Already Exists Alert -->
        <div *ngIf="emailExists" class="email-exists-alert">
          <mat-icon>warning</mat-icon>
          <div class="alert-content">
            <p><strong>Este email já está cadastrado no sistema.</strong></p>
            <p>Você pode:</p>
            <ul>
              <li>Usar um email diferente</li>
              <li>Buscar o usuário na <a routerLink="/admin/users">lista de usuários</a> para editá-lo</li>
              <li><strong>Ou deletar o usuário existente e recriar:</strong></li>
            </ul>
            <div class="delete-actions" *ngIf="existingUserId">
              <button mat-stroked-button color="warn" (click)="deleteExistingUser()" [disabled]="deleting">
                <mat-icon>{{ deleting ? 'hourglass_empty' : 'delete_forever' }}</mat-icon>
                {{ deleting ? 'Deletando...' : 'Deletar Usuário Existente' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Success Message after deletion -->
        <div *ngIf="justDeleted" class="success-alert">
          <mat-icon>check_circle</mat-icon>
          <div class="alert-content">
            <p><strong>Usuário deletado com sucesso!</strong></p>
            <p>Agora você pode criar um novo usuário com este email.</p>
          </div>
        </div>

        <div class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Nome</mat-label>
            <input matInput [(ngModel)]="firstName" placeholder="Nome">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Sobrenome</mat-label>
            <input matInput [(ngModel)]="lastName" placeholder="Sobrenome">
          </mat-form-field>
          <mat-form-field appearance="outline" [class.email-taken]="emailExists">
            <mat-label>Email</mat-label>
            <input matInput type="email" [(ngModel)]="email" (blur)="checkEmail()" placeholder="email@exemplo.com">
            <mat-icon matSuffix *ngIf="checkingEmail">hourglass_empty</mat-icon>
            <mat-icon matSuffix *ngIf="emailExists && !checkingEmail" class="error-icon">error</mat-icon>
            <mat-hint *ngIf="emailExists" class="error-text">Email já cadastrado</mat-hint>
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
          <button mat-flat-button color="primary" (click)="createUser()" [disabled]="saving || !isValid() || emailExists">
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
      
      .email-exists-alert {
        background: #fff3e0;
        border: 1px solid #ff9800;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 20px;
        display: flex;
        gap: 12px;
        align-items: flex-start;
      }
      .email-exists-alert mat-icon {
        color: #ff9800;
        font-size: 24px;
      }
      .alert-content { flex: 1; }
      .alert-content p { margin: 0 0 8px 0; }
      .alert-content ul { margin: 8px 0; padding-left: 20px; }
      .alert-content a { color: #1976d2; text-decoration: none; }
      .alert-content a:hover { text-decoration: underline; }
      
      .delete-actions {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px dashed #ff9800;
      }
      
      .success-alert {
        background: #e8f5e9;
        border: 1px solid #4caf50;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 20px;
        display: flex;
        gap: 12px;
        align-items: flex-start;
      }
      .success-alert mat-icon {
        color: #4caf50;
        font-size: 24px;
      }
      
      .email-taken { color: #d32f2f; }
      .error-icon { color: #d32f2f; }
      .error-text { color: #d32f2f; }
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
    deleting = false;
    emailExists = false;
    checkingEmail = false;
    existingUserId: string | null = null;
    justDeleted = false;

    isValid(): boolean {
        return this.email.trim().length > 0 && this.password.trim().length >= 6;
    }

    async checkEmail() {
        console.log('checkEmail called with:', this.email);
        
        if (!this.email.trim()) {
            console.log('Email is empty, resetting');
            this.emailExists = false;
            this.existingUserId = null;
            return;
        }
        
        this.checkingEmail = true;
        this.cdr.detectChanges();
        
        try {
            const emailToCheck = this.email.trim();
            console.log('Checking email via Edge Function:', emailToCheck);
            
            // Check if email exists in auth.users via Edge Function
            const { data, error } = await this.supabase.client.functions.invoke('check-email-exists', {
                body: { email: emailToCheck }
            });
            
            console.log('Check email result:', { data, error });
            
            if (error) {
                console.error('Error checking email:', error);
                this.emailExists = false;
                this.existingUserId = null;
            } else if (data?.exists) {
                console.log('Email exists in auth! User ID:', data.userId);
                this.emailExists = true;
                this.existingUserId = data.userId;
            } else {
                console.log('Email does not exist in auth');
                this.emailExists = false;
                this.existingUserId = null;
            }
        } catch (err) {
            console.error('Exception checking email:', err);
            this.emailExists = false;
            this.existingUserId = null;
        } finally {
            this.checkingEmail = false;
            console.log('Final state:', { emailExists: this.emailExists, existingUserId: this.existingUserId });
            this.cdr.detectChanges();
        }
    }

    async deleteExistingUser() {
        if (!this.existingUserId) return;
        
        const confirmed = window.confirm(
            `ATENÇÃO!\n\n` +
            `Você está prestes a DELETAR permanentemente o usuário com email: ${this.email}\n\n` +
            `Isso removerá:\n` +
            `- O usuário da autenticação\n` +
            `- Todos os dados do perfil\n` +
            `- Orçamentos, mensagens, avaliações e outros dados associados\n\n` +
            `Esta ação NÃO pode ser desfeita!\n\n` +
            `Deseja continuar?`
        );
        
        if (!confirmed) return;
        
        this.deleting = true;
        this.cdr.detectChanges();
        
        try {
            console.log('Deleting user with ID:', this.existingUserId);
            
            const result = await this.supabase.deleteUser(this.existingUserId);
            
            console.log('Delete result:', result);
            
            if (!result.success) {
                throw new Error(result.error || 'Erro ao deletar usuário');
            }
            
            this.emailExists = false;
            this.existingUserId = null;
            this.justDeleted = true;
            this.notify.success('Usuário deletado com sucesso! Agora você pode criar um novo.');
            
            // Hide success message after 5 seconds
            setTimeout(() => {
                this.justDeleted = false;
                this.cdr.detectChanges();
            }, 5000);
            
        } catch (err: any) {
            console.error('=== DELETE ERROR DETAILS ===');
            console.error('Error object:', err);
            console.error('Error message:', err?.message);
            console.error('Error context:', err?.context);
            
            if (err?.context) {
                try {
                    const text = await err.context?.text?.();
                    console.error('Error response text:', text);
                } catch (e) {
                    console.error('Could not read error text:', e);
                }
            }
            
            this.notify.error(err.message || 'Erro ao deletar usuário. Verifique o console para detalhes.');
        } finally {
            this.deleting = false;
            this.cdr.detectChanges();
        }
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
            console.error('=== ERROR DETAILS ===');
            console.error('Error object:', err);
            
            // Check if it's an Edge Function error with context
            if (err?.context && err?.context instanceof Response) {
                console.error('Response status:', err.context.status);
                console.error('Response statusText:', err.context.statusText);
                
                try {
                    // Clone the response to read it multiple times if needed
                    const clone = err.context.clone();
                    const text = await clone.text();
                    console.error('Raw response text:', text);
                    
                    try {
                        const json = JSON.parse(text);
                        console.error('Parsed JSON error:', json);
                        this.notify.error(json.error || json.message || `Erro ${err.context.status}: ${text}`);
                    } catch {
                        this.notify.error(`Erro ${err.context.status}: ${text || err.message}`);
                    }
                } catch (e) {
                    console.error('Failed to read response:', e);
                    this.notify.error(err.message || 'Erro ao criar usuário');
                }
            } else {
                const msg = err?.message || err?.error_description || err?.details || 'Erro ao criar usuário';
                this.notify.error(msg);
            }
        } finally {
            this.saving = false;
            this.cdr.detectChanges();
        }
    }
}
