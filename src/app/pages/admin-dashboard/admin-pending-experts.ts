import { Component, OnInit, ChangeDetectorRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';
import { approvalEmail } from '../../services/email-templates';
import { AuthService } from '../../services/auth.service';

@Component({
    standalone: true,
    imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatChipsModule, MatDialogModule],
    template: `
    <div class="admin-page">
      <h1>Peritos Pendentes</h1>
      <p class="subtitle">Aprove ou rejeite cadastros de novos peritos</p>

      @if (loading) {
        <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (experts.length === 0) {
        <div class="empty-state">
          <mat-icon>check_circle</mat-icon>
          <h2>Nenhum perito pendente</h2>
          <p>Todos os cadastros foram revisados.</p>
        </div>
      } @else {
        <table mat-table [dataSource]="experts" class="full-width">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nome</th>
            <td mat-cell *matCellDef="let e">{{ e.first_name }} {{ e.last_name }}</td>
          </ng-container>
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let e">{{ e.contact_email }}</td>
          </ng-container>
          <ng-container matColumnDef="specialty">
            <th mat-header-cell *matHeaderCellDef>Especialidade</th>
            <td mat-cell *matCellDef="let e">{{ e.specialty || '-' }}</td>
          </ng-container>
          <ng-container matColumnDef="created_at">
            <th mat-header-cell *matHeaderCellDef>Data Cadastro</th>
            <td mat-cell *matCellDef="let e">{{ e.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Ações</th>
            <td mat-cell *matCellDef="let e">
              <button mat-icon-button color="primary" (click)="approve(e)" [disabled]="acting === e.id" matTooltip="Aprovar">
                <mat-icon>check</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="reject(e)" [disabled]="acting === e.id" matTooltip="Rejeitar">
                <mat-icon>close</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>
      }
    </div>
  `,
    styles: [`.full-width { width:100%; } h1 { margin-bottom:8px; }.subtitle{color:#666;margin-bottom:24px;}.loading{display:flex;justify-content:center;padding:40px;}.empty-state{text-align:center;padding:60px;}.empty-state mat-icon{font-size:64px;width:64px;height:64px;color:#4caf50;margin-bottom:16px;}`],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPendingExperts implements OnInit {
    private supabase = inject(SupabaseService);
    private auth = inject(AuthService);
    private notify = inject(NotificationService);
    private dialog = inject(MatDialog);
    private cdr = inject(ChangeDetectorRef);
    experts: any[] = [];
    columns = ['name', 'email', 'specialty', 'created_at', 'actions'];
    loading = false;
    acting: string | null = null;

    ngOnInit() {
        setTimeout(() => this.loadPendingExperts(), 0);
    }

    private async loadPendingExperts() {
        this.loading = true;
        try {
            const { data } = await this.supabase.getPendingExperts();
            this.experts = data ?? [];
        } catch {
            this.notify.error('Erro ao carregar peritos pendentes.');
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    async approve(expert: any) {
        this.acting = expert.id;
        try {
            const profile = this.auth.userProfile();
            await this.supabase.approveExpert(expert.id, profile?.id || '');
            this.notify.success(`${expert.first_name} aprovado com sucesso!`);
            this.experts = this.experts.filter(e => e.id !== expert.id);

            if (expert.contact_email) {
                const emailResult = await this.supabase.sendNotificationEmail(
                    expert.contact_email,
                    'Seu cadastro foi aprovado!',
                    approvalEmail({
                        expertName: `${expert.first_name || ''} ${expert.last_name || ''}`.trim(),
                        dashboardUrl: `${window.location.origin}/expert-dashboard`,
                    }),
                    'Contrate um Perito - Aprovação'
                );
                
                if (!emailResult.success) {
                    console.error('Falha ao enviar email de aprovação:', emailResult.error);
                    if (emailResult.code === 'BOUNCE_INVALID_RECIPIENT') {
                        this.notify.info('Email do perito está inválido ou inativo. Notificação interna enviada.');
                    }
                }
                
                if (expert.id) {
                    this.notify.createNotification(expert.id, 'approval',
                        'Cadastro aprovado!', 'Seu perfil de perito foi aprovado. Acesse seu painel.');
                }
            }
        } catch {
            this.notify.error('Erro ao aprovar perito.');
        } finally {
            this.acting = null;
            this.cdr.detectChanges();
        }
    }

    async reject(expert: any) {
        this.acting = expert.id;
        try {
            await this.supabase.rejectExpert(expert.id);
            this.notify.success(`${expert.first_name} rejeitado.`);
            this.experts = this.experts.filter(e => e.id !== expert.id);
        } catch {
            this.notify.error('Erro ao rejeitar perito.');
        } finally {
            this.acting = null;
            this.cdr.detectChanges();
        }
    }
}
