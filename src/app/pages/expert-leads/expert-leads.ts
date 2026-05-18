import { Component, OnInit, Inject, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { QuoteService, QuoteResponse } from '../../services/quote.service';
import { SupabaseService } from '../../services/supabase.service';
import { ChatDialog } from '../../components/chat-dialog/chat-dialog';
import { quoteResponseEmail } from '../../services/email-templates';

@Component({
    standalone: true,
    imports: [CommonModule, MatCardModule, MatButtonModule, MatChipsModule, MatDividerModule, MatIconModule, MatDialogModule, RouterLink],
    template: `
    <div class="page">
      <div class="header">
        <h1>Leads Recebidos</h1>
        <button mat-stroked-button routerLink="/expert-dashboard"><mat-icon>arrow_back</mat-icon> Voltar</button>
      </div>

      @if (loading) {
      <div class="skeleton-grid">
        @for (_ of [1,2,3]; track _) {
        <div class="skeleton-card">
          <div class="skeleton-line skeleton-title"></div>
          <div class="skeleton-line skeleton-text"></div>
        </div>
        }
      </div>
      } @else if (quotes.length === 0) {
      <div class="empty-state">
        <mat-icon>assignment_turned_in</mat-icon>
        <h2>Nenhuma cotação recebida</h2>
        <p>As solicitações aparecerão aqui.</p>
      </div>
      } @else {
      <div class="quotes-list">
        @for (q of quotes; track q.id) {
        <mat-card class="quote-card" [class.responded]="q.status !== 'submitted'">
          <mat-card-header>
            <mat-card-title>{{ q.requester_name }}</mat-card-title>
            <mat-card-subtitle>{{ q.created_at | date:'dd/MM/yyyy HH:mm' }} — {{ q.requester_email }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p class="desc">{{ q.case_description }}</p>
            <mat-chip-set>
              <mat-chip [color]="statusColor(q.status)" highlighted>{{ statusLabel(q.status) }}</mat-chip>
            </mat-chip-set>
            @if (q.proposed_value) {
            <mat-divider></mat-divider>
            <div class="proposal">
              <span><strong>Valor:</strong> R$ {{ q.proposed_value | number:'1.2-2' }}</span>
              @if (q.proposed_deadline) { <span><strong>Prazo:</strong> {{ q.proposed_deadline }}</span> }
            </div>
            }
          </mat-card-content>
          <mat-card-actions>
            <button mat-stroked-button (click)="openChat(q)" class="chat-btn">
              <mat-icon>chat</mat-icon> Chat
            </button>
            @if (q.status === 'submitted') {
            <button mat-flat-button color="primary" (click)="openRespondDialog(q)">
              <mat-icon>reply</mat-icon> Responder
            </button>
            }
          </mat-card-actions>
        </mat-card>
        }
      </div>
      }
    </div>
  `,
    styles: [`
    .page { padding:32px; max-width:900px; margin:0 auto; }
    .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; }
    .header h1 { margin:0; }
    .quotes-list { display:grid; gap:20px; }
    .quote-card { border-radius:16px; }
    .quote-card.responded { opacity:0.8; }
    .desc { color:#334e68; line-height:1.6; margin:0 0 12px; }
    .proposal { display:flex; gap:24px; font-size:0.9rem; padding-top:12px; }
    mat-card-actions { padding:8px 16px 16px; gap:8px; }
    .chat-btn { color:#6B7280; }
    .empty-state { text-align:center; padding:80px 24px; background:white; border-radius:16px; border:2px dashed #D9E2EC; }
    .empty-state mat-icon { font-size:64px; width:64px; height:64px; color:#BCCCDC; margin-bottom:16px; }
    .empty-state h2 { font-weight:600; color:#102A43; }
    .empty-state p { color:#829AB1; }
    .skeleton-grid { display:grid; gap:20px; }
    .skeleton-card { background:white; border-radius:16px; padding:24px; display:flex; flex-direction:column; gap:12px; }
    .skeleton-line { background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:8px; height:14px; }
    .skeleton-title { height:20px; width:50%; }
    @keyframes shimmer { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpertLeads implements OnInit {
    private quoteService = inject(QuoteService);
    private auth = inject(AuthService);
    private dialog = inject(MatDialog);
    private notify = inject(NotificationService);
    private cdr = inject(ChangeDetectorRef);
    quotes: any[] = [];
    loading = true;

    ngOnInit() {
        setTimeout(() => this.loadLeads(), 0);
    }

    private async loadLeads() {
        await this.auth.initialized;
        const profile = this.auth.userProfile();
        if (!profile) { this.loading = false; this.cdr.detectChanges(); return; }
        try {
            const { data } = await this.quoteService.getReceivedQuotes(profile.id);
            const enriched = await this.quoteService.enrichQuotesWithRequesterNames(data ?? []);
            this.quotes = enriched;
        } catch { this.notify.error('Erro ao carregar leads.'); }
        finally { this.loading = false; this.cdr.detectChanges(); }
    }

    statusColor(s: string): string {
        switch (s) { case 'submitted': return ''; case 'under_review': return 'primary'; case 'approved': return 'accent'; case 'rejected': return 'warn'; default: return ''; }
    }
    statusLabel(s: string): string {
        switch (s) { case 'submitted': return 'Pendente'; case 'under_review': return 'Em Análise'; case 'approved': return 'Aceito'; case 'rejected': return 'Recusado'; default: return s; }
    }

    openChat(quote: any) {
        this.dialog.open(ChatDialog, {
            width: '460px',
            data: {
                quoteId: quote.id,
                otherName: quote.requester_name,
                expertId: quote.expert_id,
                requesterId: quote.requester_id,
            }
        });
    }

    openRespondDialog(quote: any) {
        const ref = this.dialog.open(RespondQuoteDialog, { data: { quote }, width: '500px' });
        ref.afterClosed().subscribe((updated: any) => {
            if (updated) Object.assign(quote, updated);
        });
    }
}

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
    template: `
    <h2 mat-dialog-title>Responder Cotação</h2>
    <mat-dialog-content>
      <p style="background:#f4f5f8;padding:12px;border-radius:8px;margin-bottom:16px;font-size:0.9rem;">
        <strong>Caso:</strong> {{ data.quote.case_description }}
      </p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Valor Proposto (R$)</mat-label>
        <input matInput type="number" [(ngModel)]="proposedValue" placeholder="0,00">
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Prazo Estimado</mat-label>
        <input matInput [(ngModel)]="deadline" placeholder="Ex: 15 dias úteis">
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Observações</mat-label>
        <textarea matInput rows="4" [(ngModel)]="notes" placeholder="Detalhes da proposta..."></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" (click)="submit()" [disabled]="!proposedValue || loading">
        {{ loading ? 'Enviando...' : 'Enviar Proposta' }}
      </button>
    </mat-dialog-actions>
  `,
    styles: [`.full-width { width:100%; margin-bottom:12px; } mat-dialog-actions { padding:16px 24px; gap:8px; }`],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RespondQuoteDialog {
    private quoteService = inject(QuoteService);
    private supabase = inject(SupabaseService);
    private auth = inject(AuthService);
    private notify = inject(NotificationService);
    private cdr = inject(ChangeDetectorRef);
    proposedValue: number | null = null;
    deadline = '';
    notes = '';
    loading = false;

    constructor(
        public dialogRef: MatDialogRef<RespondQuoteDialog>,
        @Inject(MAT_DIALOG_DATA) public data: { quote: any },
    ) { }

    async submit() {
        if (this.loading || !this.proposedValue) return;
        this.loading = true;
        try {
            const response: QuoteResponse = {
                proposedValue: this.proposedValue,
                deadline: this.deadline,
                notes: this.notes,
            };
            await this.quoteService.respondToQuote(this.data.quote.id, response);
            this.notify.success('Proposta enviada com sucesso!');

            const q = this.data.quote;
            const emailResult = await this.supabase.sendNotificationEmail(
                q.requester_email,
                'Você recebeu uma proposta!',
                quoteResponseEmail({
                    clientName: q.requester_name || 'Cliente',
                    proposedValue: String(this.proposedValue),
                    deadline: this.deadline || '—',
                    notes: this.notes || '—',
                    dashboardUrl: `${window.location.origin}/client-dashboard`,
                }),
                'Contrate um Perito - Proposta'
            );
            
            if (!emailResult.success) {
                console.error('Falha ao enviar email para o cliente:', emailResult.error);
                if (emailResult.code === 'BOUNCE_INVALID_RECIPIENT') {
                    this.notify.info('Email do cliente está inválido ou inativo. Notificação interna enviada.');
                }
            }
            
            if (q.requester_id) {
                this.notify.createNotification(q.requester_id, 'quote_response', 'Proposta recebida!',
                    `O perito respondeu sua cotação com uma proposta de R$ ${this.proposedValue}.`);
            }

            this.dialogRef.close({
                proposed_value: this.proposedValue,
                proposed_deadline: this.deadline,
                expert_notes: this.notes,
                responded_at: new Date().toISOString(),
                status: 'under_review'
            });
        } catch {
            this.notify.error('Erro ao enviar proposta.');
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }
}
