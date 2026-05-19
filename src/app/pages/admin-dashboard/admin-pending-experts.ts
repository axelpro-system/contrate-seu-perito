import { Component, OnInit, ChangeDetectorRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';
import { approvalEmail } from '../../services/email-templates';
import { AuthService } from '../../services/auth.service';

@Component({
    standalone: true,
    imports: [
        CommonModule, 
        MatTableModule, 
        MatButtonModule, 
        MatIconModule, 
        MatProgressSpinnerModule, 
        MatChipsModule, 
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule
    ],
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
          <ng-container matColumnDef="registration_status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let e">
              <span class="status-badge" [class]="e.registration_status">
                {{ getStatusLabel(e.registration_status) }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="submitted_at">
            <th mat-header-cell *matHeaderCellDef>Data Envio</th>
            <td mat-cell *matCellDef="let e">{{ e.registration_submitted_at | date:'dd/MM/yyyy HH:mm' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Ações</th>
            <td mat-cell *matCellDef="let e">
              <button mat-icon-button color="primary" (click)="openApproveDialog(e)" [disabled]="acting === e.id" matTooltip="Aprovar">
                <mat-icon>check</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="openRejectDialog(e)" [disabled]="acting === e.id" matTooltip="Rejeitar">
                <mat-icon>close</mat-icon>
              </button>
              <button mat-icon-button (click)="viewLogs(e)" [disabled]="acting === e.id" matTooltip="Ver histórico">
                <mat-icon>history</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>
      }
    </div>
  `,
    styles: [`
        .full-width { width:100%; } 
        h1 { margin-bottom:8px; }
        .subtitle{color:#666;margin-bottom:24px;}
        .loading{display:flex;justify-content:center;padding:40px;}
        .empty-state{text-align:center;padding:60px;}
        .empty-state mat-icon{font-size:64px;width:64px;height:64px;color:#4caf50;margin-bottom:16px;}
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .status-badge.submitted { background: #fff3e0; color: #e65100; }
        .status-badge.under_review { background: #e3f2fd; color: #1565c0; }
        .status-badge.approved { background: #e8f5e9; color: #2e7d32; }
        .status-badge.rejected { background: #ffebee; color: #c62828; }
        .status-badge.draft { background: #f5f5f5; color: #616161; }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPendingExperts implements OnInit {
    private supabase = inject(SupabaseService);
    private auth = inject(AuthService);
    private notify = inject(NotificationService);
    private dialog = inject(MatDialog);
    private cdr = inject(ChangeDetectorRef);
    experts: any[] = [];
    columns = ['name', 'email', 'specialty', 'registration_status', 'submitted_at', 'actions'];
    loading = false;
    acting: string | null = null;

    ngOnInit() {
        setTimeout(() => this.loadPendingExperts(), 0);
    }

    private async loadPendingExperts() {
        this.loading = true;
        try {
            // Usar a nova view de pendências
            const { data, error } = await this.supabase.getPendingRegistrations();
            if (error) throw error;
            this.experts = data ?? [];
        } catch (err: any) {
            console.error('Erro ao carregar peritos pendentes:', err);
            this.notify.error('Erro ao carregar peritos pendentes.');
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    getStatusLabel(status: string): string {
        const labels: { [key: string]: string } = {
            'draft': 'Rascunho',
            'submitted': 'Pendente',
            'under_review': 'Em Revisão',
            'approved': 'Aprovado',
            'rejected': 'Rejeitado'
        };
        return labels[status] || status;
    }

    openApproveDialog(expert: any) {
        const reason = window.prompt('Adicionar nota sobre a aprovação (opcional):');
        if (reason !== null) { // null = cancelado
            this.approve(expert, reason || undefined);
        }
    }

    openRejectDialog(expert: any) {
        const reason = window.prompt('Motivo da rejeição (obrigatório):');
        if (reason) {
            this.reject(expert, reason);
        } else if (reason === '') {
            this.notify.error('Motivo da rejeição é obrigatório');
        }
    }

    async approve(expert: any, notes?: string) {
        this.acting = expert.id;
        try {
            // Usar a nova função RPC
            const result = await this.supabase.reviewExpertRegistration(expert.id, true, notes);
            
            if (!result.success) {
                throw new Error(result.error);
            }

            this.notify.success(`${expert.first_name} aprovado com sucesso!`);
            this.experts = this.experts.filter(e => e.id !== expert.id);

            // Enviar notificação de atualização de status
            const statusResult = await this.supabase.sendStatusUpdateNotification(
                expert.id,
                'under_review',
                'approved',
                notes
            );

            if (!statusResult.success) {
                console.error('Falha ao enviar notificação de status:', statusResult.error);
            } else if (statusResult.emailSent) {
                this.notify.info('Email de atualização de status enviado ao perito.');
            }

            // Também enviar email de aprovação tradicional
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
        } catch (err: any) {
            console.error('Erro ao aprovar perito:', err);
            this.notify.error(err?.message || 'Erro ao aprovar perito.');
        } finally {
            this.acting = null;
            this.cdr.detectChanges();
        }
    }

    async reject(expert: any, reason: string) {
        this.acting = expert.id;
        try {
            // Usar a nova função RPC
            const result = await this.supabase.reviewExpertRegistration(expert.id, false, reason);
            
            if (!result.success) {
                throw new Error(result.error);
            }

            this.notify.success(`${expert.first_name} rejeitado.`);
            this.experts = this.experts.filter(e => e.id !== expert.id);

            // Enviar notificação de atualização de status
            const statusResult = await this.supabase.sendStatusUpdateNotification(
                expert.id,
                'under_review',
                'rejected',
                reason
            );

            if (!statusResult.success) {
                console.error('Falha ao enviar notificação de status:', statusResult.error);
            } else if (statusResult.emailSent) {
                this.notify.info('Email de atualização de status enviado ao perito.');
            }
        } catch (err: any) {
            console.error('Erro ao rejeitar perito:', err);
            this.notify.error(err?.message || 'Erro ao rejeitar perito.');
        } finally {
            this.acting = null;
            this.cdr.detectChanges();
        }
    }

    async viewLogs(expert: any) {
        try {
            const { data, error } = await this.supabase.getExpertRegistrationLogs(expert.id);
            if (error) throw error;
            
            // Formatar logs para exibição
            const logs = data || [];
            let message = `Histórico de ${expert.first_name} ${expert.last_name}:\n\n`;
            
            logs.forEach((log: any, index: number) => {
                const date = new Date(log.created_at).toLocaleString('pt-BR');
                const from = log.status_from || 'início';
                const to = log.status_to;
                message += `${index + 1}. ${date}\n   ${from} → ${to}\n   ${log.reason || ''}\n\n`;
            });
            
            if (logs.length === 0) {
                message += 'Nenhum registro encontrado.';
            }
            
            alert(message); // Substitua por um modal bonito depois
        } catch (err) {
            console.error('Erro ao carregar logs:', err);
            this.notify.error('Erro ao carregar histórico');
        }
    }
}
