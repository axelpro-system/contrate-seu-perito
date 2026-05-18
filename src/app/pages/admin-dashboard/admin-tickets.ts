import { Component, inject, ChangeDetectorRef, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { SupportTicketService } from '../../services/support-ticket.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
    selector: 'app-admin-tickets',
    standalone: true,
    imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
        MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule, MatMenuModule],
    template: `
    <div class="tickets-page">
      <div class="header">
        <h1>Tickets de Suporte</h1>
        <mat-form-field appearance="outline" class="filter-select">
          <mat-label>Filtrar</mat-label>
          <mat-select [(ngModel)]="statusFilter" (selectionChange)="applyFilter()">
            <mat-option value="">Todos</mat-option>
            <mat-option value="open">Aberto</mat-option>
            <mat-option value="in_progress">Em Andamento</mat-option>
            <mat-option value="waiting_client">Aguardando Cliente</mat-option>
            <mat-option value="resolved">Resolvido</mat-option>
            <mat-option value="closed">Fechado</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      @if (loading) {
        <div class="loading"><mat-spinner diameter="32"></mat-spinner></div>
      }

      <div class="ticket-list">
        @for (t of filteredTickets; track t.id) {
          <mat-card class="ticket-card" (click)="selectTicket(t.id)">
            <mat-card-content>
              <div class="ticket-row">
                <div class="ticket-info">
                  <strong>{{ t.subject }}</strong>
                  <p class="ticket-user">{{ t.user?.full_name || t.user?.email || 'Anônimo' }}</p>
                </div>
                <div class="ticket-badges">
                  <span class="status status-{{t.status}}">{{ statusLabel(t.status) }}</span>
                  <span class="priority priority-{{t.priority}}">{{ priorityLabel(t.priority) }}</span>
                  @if (t.assigned_to) { <span class="assigned-badge">Atribuído</span> }
                </div>
                <small class="ticket-date">{{ t.created_at | date:'dd/MM/yyyy' }}</small>
              </div>
            </mat-card-content>
          </mat-card>
        } @empty {
          <p class="empty">Nenhum ticket encontrado.</p>
        }
      </div>
    </div>

    @if (selectedTicket) {
      <div class="modal-overlay" (click)="closeTicket()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ selectedTicket.subject }}</h3>
            <div class="modal-actions">
              <button mat-flat-button color="primary" (click)="assignMe()" [disabled]="selectedTicket.assigned_to">
                <mat-icon>person_add</mat-icon> Assumir
              </button>
              <button mat-icon-button (click)="closeTicket()"><mat-icon>close</mat-icon></button>
            </div>
          </div>
          <div class="modal-body">
            <div class="meta-row">
              <span class="status status-{{selectedTicket.status}}">{{ statusLabel(selectedTicket.status) }}</span>
              <span class="priority priority-{{selectedTicket.priority}}">{{ priorityLabel(selectedTicket.priority) }}</span>
              <span>Usuário: {{ selectedTicket.user?.full_name || selectedTicket.user?.email || 'Anônimo' }}</span>
            </div>

            <div class="status-actions">
              <button mat-stroked-button (click)="changeStatus('open')" [class.active]="selectedTicket.status==='open'">Aberto</button>
              <button mat-stroked-button (click)="changeStatus('in_progress')" [class.active]="selectedTicket.status==='in_progress'">Em Andamento</button>
              <button mat-stroked-button (click)="changeStatus('waiting_client')" [class.active]="selectedTicket.status==='waiting_client'">Aguardando</button>
              <button mat-stroked-button (click)="changeStatus('resolved')" [class.active]="selectedTicket.status==='resolved'">Resolvido</button>
              <button mat-stroked-button (click)="changeStatus('closed')" [class.active]="selectedTicket.status==='closed'">Fechar</button>
            </div>

            <p class="ticket-desc">{{ selectedTicket.description }}</p>

            <div class="messages">
              @for (m of messages; track m.id) {
                <div class="message" [class.admin-msg]="m.sender?.profile_type === 'ADMIN'" [class.internal]="m.is_internal">
                  <div class="msg-header">
                    <strong>{{ m.sender?.full_name || 'Sistema' }}</strong>
                    @if (m.is_internal) { <span class="internal-badge">Interno</span> }
                    <small>{{ m.created_at | date:'dd/MM/yyyy HH:mm' }}</small>
                  </div>
                  <p>{{ m.message }}</p>
                </div>
              }
            </div>

            <div class="reply-section">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Resposta (visível ao cliente)</mat-label>
                <textarea matInput [(ngModel)]="replyText" rows="2" placeholder="Digite sua resposta..."></textarea>
              </mat-form-field>
              <div class="reply-actions">
                <button mat-flat-button color="primary" (click)="sendReply(false)" [disabled]="!replyText.trim()">Enviar Resposta</button>
                <button mat-stroked-button (click)="sendReply(true)" [disabled]="!replyText.trim()">Enviar como Interno</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
    styles: [`
    .tickets-page { }
    .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; }
    .header h1 { margin:0; font-size:1.5rem; }
    .filter-select { width:200px; }
    .loading { display:flex; justify-content:center; padding:40px; }
    .ticket-list { display:flex; flex-direction:column; gap:8px; }
    .ticket-card { cursor:pointer; transition:box-shadow .2s; }
    .ticket-card:hover { box-shadow:0 4px 12px rgba(0,0,0,.15); }
    .ticket-row { display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap; }
    .ticket-info { flex:1; min-width:200px; }
    .ticket-user { color:#666; margin:2px 0 0; font-size:.9rem; }
    .ticket-badges { display:flex; gap:6px; align-items:center; }
    .ticket-date { color:#bbb; white-space:nowrap; }
    .status,.priority { padding:2px 10px; border-radius:12px; font-size:.75rem; font-weight:600; }
    .status-open { background:#e3f2fd; color:#1565c0; }
    .status-in_progress { background:#fff3e0; color:#e65100; }
    .status-waiting_client { background:#fce4ec; color:#c62828; }
    .status-resolved { background:#e8f5e9; color:#2e7d32; }
    .status-closed { background:#f5f5f5; color:#616161; }
    .priority-low { background:#e8f5e9; color:#2e7d32; }
    .priority-medium { background:#fff3e0; color:#e65100; }
    .priority-high,.priority-urgent { background:#fce4ec; color:#c62828; }
    .assigned-badge { background:#e8eaf6; color:#283593; padding:2px 8px; border-radius:8px; font-size:.75rem; }
    .empty { color:#999; text-align:center; padding:40px; }
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center; z-index:1000; }
    .modal { background:white; border-radius:12px; width:90%; max-width:700px; max-height:85vh; display:flex; flex-direction:column; }
    .modal-header { display:flex; justify-content:space-between; align-items:center; padding:16px 24px; border-bottom:1px solid #e0e0e0; }
    .modal-header h3 { margin:0; }
    .modal-actions { display:flex; align-items:center; gap:8px; }
    .modal-body { padding:24px; overflow-y:auto; flex:1; }
    .meta-row { display:flex; gap:12px; align-items:center; margin-bottom:12px; flex-wrap:wrap; }
    .status-actions { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:16px; }
    .status-actions button.active { background:#1a237e; color:white; }
    .ticket-desc { background:#f5f5f5; padding:12px; border-radius:8px; margin-bottom:16px; }
    .messages { display:flex; flex-direction:column; gap:12px; margin-bottom:16px; }
    .message { padding:12px; border-radius:8px; background:#f0f4ff; }
    .message.admin-msg { background:#e8f5e9; margin-left:24px; }
    .message.internal { background:#fff3e0; opacity:.7; }
    .msg-header { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
    .msg-header small { color:#999; }
    .internal-badge { font-size:.7rem; background:#e65100; color:white; padding:1px 8px; border-radius:8px; }
    .full-width { width:100%; }
    .reply-section { border-top:1px solid #e0e0e0; padding-top:16px; }
    .reply-actions { display:flex; gap:8px; margin-top:8px; }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminTickets implements OnInit {
    private ticketService = inject(SupportTicketService);
    private auth = inject(AuthService);
    private notify = inject(NotificationService);
    private cdr = inject(ChangeDetectorRef);

    loading = false;
    statusFilter = '';
    allTickets: any[] = [];
    filteredTickets: any[] = [];
    selectedTicket: any = null;
    messages: any[] = [];
    replyText = '';

    async ngOnInit() {
        this.loading = true;
        this.cdr.detectChanges();
        await this.ticketService.loadAllTickets();
        this.allTickets = this.ticketService.tickets();
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
    }

    applyFilter() {
        this.filteredTickets = this.statusFilter
            ? this.allTickets.filter(t => t.status === this.statusFilter)
            : [...this.allTickets];
    }

    statusLabel(s: string) { return s === 'in_progress' ? 'Em Andamento' : s === 'waiting_client' ? 'Aguardando' : s === 'open' ? 'Aberto' : s === 'resolved' ? 'Resolvido' : 'Fechado'; }
    priorityLabel(p: string) { return p === 'low' ? 'Baixa' : p === 'medium' ? 'Média' : p === 'high' ? 'Alta' : 'Urgente'; }

    async selectTicket(ticketId: string) {
        const ticket = this.allTickets.find(t => t.id === ticketId);
        if (!ticket) return;
        this.selectedTicket = ticket;
        try {
            this.messages = await this.ticketService.getMessages(ticketId);
        } catch (e) {
            console.error('Erro ao carregar mensagens:', e);
            this.notify.error('Erro ao carregar mensagens.');
        }
        this.cdr.detectChanges();
    }

    closeTicket() {
        this.selectedTicket = null;
        this.messages = [];
        this.replyText = '';
    }

    async assignMe() {
        const admin = this.auth.userProfile();
        if (!admin?.id) return;
        await this.ticketService.assign(this.selectedTicket.id, admin.id);
        this.selectedTicket.assigned_to = admin.id;
        this.selectedTicket.status = 'in_progress';
        this.notify.success('Ticket atribuído a você');
        this.cdr.detectChanges();
    }

    async changeStatus(status: string) {
        await this.ticketService.updateStatus(this.selectedTicket.id, status);
        this.selectedTicket.status = status;
        this.cdr.detectChanges();
    }

    async sendReply(isInternal: boolean) {
        if (!this.replyText.trim()) return;
        const admin = this.auth.userProfile();
        if (!admin?.id) return;
        try {
            await this.ticketService.sendMessage(this.selectedTicket.id, admin.id, this.replyText, isInternal);
            this.replyText = '';
            this.messages = await this.ticketService.getMessages(this.selectedTicket.id);
            this.notify.success(isInternal ? 'Nota interna salva.' : 'Resposta enviada.');
        } catch (e) {
            console.error('Erro ao enviar resposta:', e);
            this.notify.error('Erro ao enviar resposta.');
        }
        this.cdr.detectChanges();
    }
}
