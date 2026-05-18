import { Component, inject, ChangeDetectorRef, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { SupportTicketService } from '../../services/support-ticket.service';

interface FaqItem {
    question: string;
    answer: string;
}

@Component({
    selector: 'app-support',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ReactiveFormsModule, RouterModule,
        MatCardModule, MatExpansionModule, MatFormFieldModule, MatInputModule,
        MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSelectModule, MatChipsModule,
    ],
    template: `
    <div class="support-page">
      <div class="hero">
        <h1>Central de Ajuda</h1>
        <p>Como podemos ajudar você?</p>
        <div class="search-box">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Buscar na central de ajuda..." [(ngModel)]="searchTerm" (input)="filterFaqs()">
        </div>
      </div>

      <div class="content">
        @if (isAuthenticated()) {
          <section class="tickets-section">
            <h2>Meus Tickets</h2>
            <p class="subtitle">Acompanhe seus chamados de suporte</p>

            @if (ticketService.tickets().length > 0) {
              <div class="ticket-list">
                @for (t of ticketService.tickets(); track t.id) {
                  <mat-card class="ticket-card" (click)="openTicket(t.id)">
                    <mat-card-content>
                      <div class="ticket-header">
                        <strong>{{ t.subject }}</strong>
                        <div class="ticket-meta">
                          <span class="status-chip status-{{t.status}}">{{ statusLabel(t.status) }}</span>
                          <span class="priority-chip priority-{{t.priority}}">{{ priorityLabel(t.priority) }}</span>
                        </div>
                      </div>
                      <p class="ticket-date">{{ t.created_at | date:'dd/MM/yyyy HH:mm' }}</p>
                    </mat-card-content>
                  </mat-card>
                }
              </div>
            } @else {
              <p class="empty">Nenhum ticket encontrado.</p>
            }

            <button mat-flat-button color="primary" (click)="showNewTicket = true" class="btn-new">
              <mat-icon>add</mat-icon> Novo Ticket
            </button>
          </section>
        }

        @if (showNewTicket) {
          <section class="new-ticket-section">
            <h2>{{ isAuthenticated() ? 'Abrir Chamado' : 'Fale Conosco' }}</h2>
            <mat-card>
              <mat-card-content>
                <form [formGroup]="ticketForm" (ngSubmit)="onSubmit()">
                  @if (!isAuthenticated()) {
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Nome</mat-label>
                      <input matInput formControlName="name" placeholder="Seu nome">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Email</mat-label>
                      <input matInput formControlName="email" type="email" placeholder="seu@email.com">
                    </mat-form-field>
                  }
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Assunto</mat-label>
                    <input matInput formControlName="subject" placeholder="Resumo do problema">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Prioridade</mat-label>
                    <mat-select formControlName="priority">
                      <mat-option value="low">Baixa</mat-option>
                      <mat-option value="medium">Média</mat-option>
                      <mat-option value="high">Alta</mat-option>
                      <mat-option value="urgent">Urgente</mat-option>
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Descrição</mat-label>
                    <textarea matInput formControlName="description" rows="5" placeholder="Descreva seu problema em detalhes..."></textarea>
                  </mat-form-field>
                  <button mat-flat-button color="primary" type="submit" [disabled]="ticketForm.invalid || loading">
                    @if (loading) { <mat-spinner diameter="20"></mat-spinner> }
                    @else { {{ isAuthenticated() ? 'Abrir Chamado' : 'Enviar Mensagem' }} }
                  </button>
                </form>
              </mat-card-content>
            </mat-card>
          </section>
        }

        <section class="faq-section">
          <h2>Perguntas Frequentes</h2>
          <mat-accordion>
            @for (faq of filteredFaqs; track faq.question) {
              <mat-expansion-panel>
                <mat-expansion-panel-header>
                  <mat-panel-title>{{ faq.question }}</mat-panel-title>
                </mat-expansion-panel-header>
                <p>{{ faq.answer }}</p>
              </mat-expansion-panel>
            }
          </mat-accordion>
        </section>
      </div>
    </div>

    @if (selectedTicket) {
      <div class="modal-overlay" (click)="closeTicket()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ selectedTicket.subject }}</h3>
            <button mat-icon-button (click)="closeTicket()"><mat-icon>close</mat-icon></button>
          </div>
          <div class="modal-body">
            <p class="ticket-description">{{ selectedTicket.description }}</p>
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
            @if (selectedTicket.status !== 'closed') {
              <form class="reply-form" (ngSubmit)="sendReply()">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Sua resposta</mat-label>
                  <textarea matInput [(ngModel)]="replyText" [ngModelOptions]="{standalone: true}" rows="3" placeholder="Digite sua resposta..."></textarea>
                </mat-form-field>
                <button mat-flat-button color="primary" type="submit" [disabled]="!replyText.trim()">Enviar</button>
              </form>
            }
          </div>
        </div>
      </div>
    }
  `,
    styles: [`
    .support-page { max-width:900px; margin:0 auto; padding:32px 24px; }
    .hero { text-align:center; margin-bottom:40px; }
    .hero h1 { font-size:2rem; color:#1a237e; margin-bottom:8px; }
    .hero p { color:#666; margin-bottom:24px; }
    .search-box { display:flex; align-items:center; gap:12px; max-width:500px; margin:0 auto; background:white; border:1px solid #e0e0e0; border-radius:8px; padding:8px 16px; }
    .search-box input { border:none; outline:none; flex:1; font-size:1rem; }
    .search-box mat-icon { color:#666; }
    .content { display:flex; flex-direction:column; gap:40px; }
    .subtitle { color:#666; margin-bottom:16px; }
    .ticket-list { display:flex; flex-direction:column; gap:8px; margin-bottom:16px; }
    .ticket-card { cursor:pointer; transition:box-shadow .2s; }
    .ticket-card:hover { box-shadow:0 4px 12px rgba(0,0,0,.15); }
    .ticket-header { display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap; }
    .ticket-meta { display:flex; gap:8px; }
    .ticket-date { color:#999; font-size:.85rem; margin:4px 0 0; }
    .status-chip, .priority-chip { padding:2px 10px; border-radius:12px; font-size:.75rem; font-weight:600; text-transform:uppercase; }
    .status-open { background:#e3f2fd; color:#1565c0; }
    .status-in_progress { background:#fff3e0; color:#e65100; }
    .status-waiting_client { background:#fce4ec; color:#c62828; }
    .status-resolved { background:#e8f5e9; color:#2e7d32; }
    .status-closed { background:#f5f5f5; color:#616161; }
    .priority-low { background:#e8f5e9; color:#2e7d32; }
    .priority-medium { background:#fff3e0; color:#e65100; }
    .priority-high, .priority-urgent { background:#fce4ec; color:#c62828; }
    .empty { color:#999; font-style:italic; }
    .btn-new { margin-top:8px; }
    section h2 { font-size:1.5rem; color:#1a237e; margin-bottom:8px; }
    .full-width { width:100%; }
    mat-card-content { padding:24px; }
    button[type=submit] { margin-top:16px; }
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center; z-index:1000; }
    .modal { background:white; border-radius:12px; width:90%; max-width:600px; max-height:80vh; display:flex; flex-direction:column; }
    .modal-header { display:flex; justify-content:space-between; align-items:center; padding:16px 24px; border-bottom:1px solid #e0e0e0; }
    .modal-header h3 { margin:0; }
    .modal-body { padding:24px; overflow-y:auto; flex:1; }
    .ticket-description { background:#f5f5f5; padding:12px; border-radius:8px; margin-bottom:16px; }
    .messages { display:flex; flex-direction:column; gap:12px; margin-bottom:16px; }
    .message { padding:12px; border-radius:8px; background:#f0f4ff; }
    .message.admin-msg { background:#e8f5e9; }
    .message.internal { background:#fff3e0; opacity:.7; }
    .msg-header { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
    .msg-header small { color:#999; }
    .internal-badge { font-size:.7rem; background:#e65100; color:white; padding:1px 8px; border-radius:8px; }
    .reply-form { border-top:1px solid #e0e0e0; padding-top:16px; }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportPage implements OnInit {
    private supabase = inject(SupabaseService);
    private notify = inject(NotificationService);
    private fb = inject(FormBuilder);
    private cdr = inject(ChangeDetectorRef);
    private auth = inject(AuthService);
    ticketService = inject(SupportTicketService);

    searchTerm = '';
    loading = false;
    showNewTicket = true;
    selectedTicket: any = null;
    messages: any[] = [];
    replyText = '';

    isAuthenticated = this.auth.authenticated;

    ticketForm = this.fb.group({
        name: [''],
        email: ['', [Validators.email]],
        subject: ['', Validators.required],
        priority: ['medium'],
        description: ['', [Validators.required, Validators.minLength(10)]],
    });

    faqs: FaqItem[] = [
        { question: 'Como solicito uma cotação?', answer: 'Busque um perito na página de busca e clique em "Solicitar Cotação". Preencha os detalhes do seu caso e envie.' },
        { question: 'Como me cadastro como perito?', answer: 'Clique em "Sou Perito" na página de cadastro. Após criar sua conta, complete seu perfil com suas especialidades e certificações.' },
        { question: 'Como funciona o pagamento?', answer: 'O pagamento é combinado diretamente entre você e o perito. A plataforma facilita a comunicação e proposta de valores.' },
        { question: 'Posso avaliar um perito?', answer: 'Sim! Após a conclusão do serviço, você pode deixar uma avaliação com nota de 1 a 5 e um comentário.' },
        { question: 'Como altero meu perfil?', answer: 'Acesse o dashboard e clique em "Editar Perfil". Lá você pode atualizar suas informações, foto e certificações.' },
        { question: 'É seguro usar a plataforma?', answer: 'Sim. Utilizamos criptografia de ponta a ponta e todos os dados são protegidos conforme a LGPD.' },
    ];

    filteredFaqs: FaqItem[] = [...this.faqs];

    filterFaqs() {
        const term = this.searchTerm.toLowerCase();
        this.filteredFaqs = this.faqs.filter(f =>
            f.question.toLowerCase().includes(term) || f.answer.toLowerCase().includes(term)
        );
    }

    statusLabel(s: string) { return s === 'in_progress' ? 'Em Andamento' : s === 'waiting_client' ? 'Aguardando' : s === 'open' ? 'Aberto' : s === 'resolved' ? 'Resolvido' : 'Fechado'; }
    priorityLabel(p: string) { return p === 'low' ? 'Baixa' : p === 'medium' ? 'Média' : p === 'high' ? 'Alta' : 'Urgente'; }

    async ngOnInit() {
        if (this.isAuthenticated()) {
            const user = this.auth.userProfile();
            if (user?.id) {
                this.showNewTicket = false;
                await this.ticketService.loadMyTickets(user.id);
                this.cdr.detectChanges();
            }
        }
    }

    async onSubmit() {
        if (this.ticketForm.invalid || this.loading) return;
        this.loading = true;
        try {
            const user = this.auth.userProfile();
            if (this.isAuthenticated() && user?.id) {
                await this.ticketService.create(
                    user.id,
                    this.ticketForm.value.subject!,
                    this.ticketForm.value.description!,
                    this.ticketForm.value.priority as any,
                );
                this.notify.success('Chamado aberto com sucesso!');
                this.showNewTicket = false;
                this.ticketForm.reset();
                this.ticketForm.patchValue({ priority: 'medium' });
            } else {
                await this.supabase.submitContact({
                    name: this.ticketForm.value.name!,
                    email: this.ticketForm.value.email!,
                    subject: this.ticketForm.value.subject!,
                    message: this.ticketForm.value.description!,
                });
                this.notify.success('Mensagem enviada com sucesso!');
                this.ticketForm.reset();
                this.ticketForm.patchValue({ priority: 'medium' });
            }
        } catch {
            this.notify.error('Erro ao enviar. Tente novamente.');
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    async openTicket(ticketId: string) {
        const ticket = this.ticketService.tickets().find(t => t.id === ticketId);
        if (!ticket) return;
        this.selectedTicket = ticket;
        try {
            this.messages = await this.ticketService.getMessages(ticketId);
        } catch (e) {
            console.error('Erro ao carregar mensagens:', JSON.stringify(e));
            this.notify.error('Erro ao carregar mensagens.');
        }
        this.cdr.detectChanges();
    }

    closeTicket() {
        this.selectedTicket = null;
        this.messages = [];
        this.replyText = '';
    }

    async sendReply() {
        if (!this.replyText.trim() || !this.selectedTicket) return;
        const user = this.auth.userProfile();
        if (!user?.id) return;
        try {
            await this.ticketService.sendMessage(this.selectedTicket.id, user.id, this.replyText);
            this.replyText = '';
            this.messages = await this.ticketService.getMessages(this.selectedTicket.id);
        } catch (e) {
            console.error('Erro ao enviar resposta:', e);
            this.notify.error('Erro ao enviar resposta.');
        }
        this.cdr.detectChanges();
    }
}
