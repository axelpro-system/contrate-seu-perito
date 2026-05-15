import { Component, OnInit, ChangeDetectorRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { LeadNotificationService } from '../../services/lead-notification.service';
import { AvailabilityService } from '../../services/availability.service';
import { PortfolioService } from '../../services/portfolio.service';
import { ExpertServiceService, PRICE_UNIT_LABELS } from '../../services/expert-service.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-expert-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatBadgeModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatDialogModule, RouterLink],
    template: `
    <div class="dashboard">
      <h1>Área do Perito</h1>
      <div class="grid">
        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>person</mat-icon>
            <mat-card-title>Meu Perfil</mat-card-title>
            <mat-card-subtitle>Mantenha seus dados atualizados</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content><p>Edite suas informações e atraia mais clientes.</p></mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" routerLink="/expert/edit">
              <mat-icon>edit</mat-icon> Editar Perfil
            </button>
          </mat-card-actions>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>assignment</mat-icon>
            <mat-card-title>Leads Recebidos</mat-card-title>
            <mat-card-subtitle>
              Gerencie as solicitações de cotação
              @if (leadNotify.unreadCount() > 0) {
              <span class="badge">{{ leadNotify.unreadCount() }} nova{{ leadNotify.unreadCount() > 1 ? 's' : '' }}</span>
              }
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content><p>Veja os pedidos de cotação e responda com propostas.</p></mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="accent" routerLink="/expert/quotes" (click)="leadNotify.markAllRead()">
              <mat-icon>list</mat-icon> Ver Leads
            </button>
          </mat-card-actions>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>search</mat-icon>
            <mat-card-title>Buscar Peritos</mat-card-title>
            <mat-card-subtitle>Encontre outros profissionais</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content><p>Explore a rede de peritos disponíveis.</p></mat-card-content>
          <mat-card-actions>
            <button mat-stroked-button color="primary" routerLink="/search">
              <mat-icon>search</mat-icon> Buscar
            </button>
          </mat-card-actions>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>schedule</mat-icon>
            <mat-card-title>Disponibilidade</mat-card-title>
            <mat-card-subtitle>Defina seus horários de atendimento</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (availSlots.length === 0) {
            <p class="avail-empty">Nenhum horário cadastrado.</p>
            }
            <div class="avail-list">
              @for (slot of availSlots; track slot.id) {
              <div class="avail-slot" [class.avail-inactive]="!slot.active">
                <span class="avail-day">{{ days[slot.day_of_week] }}</span>
                <span class="avail-time">{{ slot.start_time.slice(0,5) }} — {{ slot.end_time.slice(0,5) }}</span>
                <button mat-icon-button (click)="avail.toggleSlot(slot.id, !slot.active)" [attr.aria-label]="slot.active ? 'Desativar' : 'Ativar'">
                  <mat-icon>{{ slot.active ? 'toggle_on' : 'toggle_off' }}</mat-icon>
                </button>
                <button mat-icon-button (click)="avail.removeSlot(slot.id)" aria-label="Remover">
                  <mat-icon color="warn">delete</mat-icon>
                </button>
              </div>
              }
            </div>
            <div class="avail-add">
              <mat-form-field appearance="outline" class="avail-field">
                <mat-label>Dia</mat-label>
                <mat-select [(ngModel)]="newDay">
                  @for (d of [0,1,2,3,4,5,6]; track d) {
                  <mat-option [value]="d">{{ days[d] }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="avail-field">
                <mat-label>Início</mat-label>
                <input matInput type="time" [(ngModel)]="newStart">
              </mat-form-field>
              <mat-form-field appearance="outline" class="avail-field">
                <mat-label>Fim</mat-label>
                <input matInput type="time" [(ngModel)]="newEnd">
              </mat-form-field>
              <button mat-flat-button color="primary" (click)="addSlot()" [disabled]="newDay === null || !newStart || !newEnd">
                <mat-icon>add</mat-icon> Adicionar
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>briefcase</mat-icon>
            <mat-card-title>Portfólio</mat-card-title>
            <mat-card-subtitle>Compartilhe seus trabalhos anteriores</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (portfolio.loading()) {
            <p style="color:#9CA3AF;text-align:center;padding:12px;">Carregando...</p>
            } @else if (portfolio.items().length === 0) {
            <p style="color:#9CA3AF;text-align:center;padding:16px 0;">Nenhum item no portfólio.</p>
            }
            <div class="portfolio-list">
              @for (item of portfolio.items(); track item.id) {
              <div class="portfolio-item">
                <div class="portfolio-info">
                  <strong>{{ item.title }}</strong>
                  @if (item.description) { <p>{{ item.description }}</p> }
                </div>
                <button mat-icon-button (click)="portfolio.removeItem(item.id)" aria-label="Remover">
                  <mat-icon color="warn">delete</mat-icon>
                </button>
              </div>
              }
            </div>
            <div class="portfolio-add">
              <mat-form-field appearance="outline" class="pf-field">
                <mat-label>Título</mat-label>
                <input matInput [(ngModel)]="pfTitle" placeholder="Nome do trabalho">
              </mat-form-field>
              <mat-form-field appearance="outline" class="pf-field">
                <mat-label>Descrição</mat-label>
                <textarea matInput [(ngModel)]="pfDesc" rows="2" placeholder="Breve descrição..."></textarea>
              </mat-form-field>
              <button mat-flat-button color="primary" (click)="addPortfolioItem()" [disabled]="!pfTitle.trim()">
                <mat-icon>add</mat-icon> Adicionar
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>request_quote</mat-icon>
            <mat-card-title>Serviços e Honorários</mat-card-title>
            <mat-card-subtitle>Cadastre seus serviços e preços</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (expertService.loading()) {
            <p style="color:#9CA3AF;text-align:center;padding:12px;">Carregando...</p>
            } @else if (services.length === 0) {
            <p style="color:#9CA3AF;text-align:center;padding:16px 0;">Nenhum serviço cadastrado.</p>
            }
            <div class="service-list">
              @for (svc of services; track svc.id) {
              <div class="service-item">
                <div class="service-info">
                  <strong>{{ svc.service_name }}</strong>
                  @if (svc.base_price) {
                  <span class="service-price">R$ {{ svc.base_price | number:'1.2-2' }} <small>{{ priceUnitLabels[svc.price_unit] }}</small></span>
                  } @else {
                  <span class="service-price">Sob consulta</span>
                  }
                  @if (svc.description) { <p>{{ svc.description }}</p> }
                </div>
                <button mat-icon-button (click)="removeService(svc.id)" aria-label="Remover">
                  <mat-icon color="warn">delete</mat-icon>
                </button>
              </div>
              }
            </div>
            <div class="service-add">
              <mat-form-field appearance="outline" class="svc-field">
                <mat-label>Nome do serviço</mat-label>
                <input matInput [(ngModel)]="svcName" placeholder="Ex: Laudo técnico">
              </mat-form-field>
              <mat-form-field appearance="outline" class="svc-field">
                <mat-label>Descrição</mat-label>
                <textarea matInput [(ngModel)]="svcDesc" rows="2" placeholder="Breve descrição..."></textarea>
              </mat-form-field>
              <div class="svc-row">
                <mat-form-field appearance="outline" class="svc-price">
                  <mat-label>Preço base (R$)</mat-label>
                  <input matInput type="number" [(ngModel)]="svcPrice" placeholder="0,00">
                </mat-form-field>
                <mat-form-field appearance="outline" class="svc-unit">
                  <mat-label>Unidade</mat-label>
                  <mat-select [(ngModel)]="svcUnit">
                    <mat-option value="hour">por hora</mat-option>
                    <mat-option value="report">por laudo</mat-option>
                    <mat-option value="consultation">por consulta</mat-option>
                    <mat-option value="document">por documento</mat-option>
                    <mat-option value="analysis">por análise</mat-option>
                    <mat-option value="fixed">preço fixo</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <button mat-flat-button color="primary" (click)="addService()" [disabled]="!svcName.trim()">
                <mat-icon>add</mat-icon> Adicionar Serviço
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>help</mat-icon>
            <mat-card-title>Central de Ajuda</mat-card-title>
            <mat-card-subtitle>Precisa de suporte?</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content><p>Acesse FAQ e fale conosco.</p></mat-card-content>
          <mat-card-actions>
            <button mat-stroked-button routerLink="/support">
              <mat-icon>contact_support</mat-icon> Ajuda
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
    styles: [`
    .dashboard { padding:32px; max-width:1200px; margin:0 auto; }
    h1 { font-size:1.5rem; font-weight:700; margin:0 0 24px; }
    .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:20px; }
    .badge { display:inline-block; background:#f44336; color:white; font-size:0.65rem; font-weight:700; padding:2px 8px; border-radius:999px; margin-left:6px; }
    mat-card-actions { padding:8px 16px 16px; gap:8px; }
    .avail-empty { color:#9CA3AF; font-size:0.9rem; text-align:center; padding:16px 0; }
    .avail-list { display:flex; flex-direction:column; gap:8px; margin-bottom:16px; }
    .avail-slot { display:flex; align-items:center; gap:8px; padding:8px 12px; background:#F9FAFB; border-radius:8px; font-size:0.9rem; }
    .avail-slot.avail-inactive { opacity:0.5; }
    .avail-day { font-weight:600; min-width:40px; }
    .avail-time { color:#6B7280; flex:1; }
    .avail-add { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
    .avail-field { flex:1; min-width:100px; margin-bottom:-1.25em; }
    .portfolio-list { display:flex; flex-direction:column; gap:8px; margin-bottom:12px; }
    .portfolio-item { display:flex; align-items:flex-start; gap:8px; padding:8px 12px; background:#F9FAFB; border-radius:8px; }
    .portfolio-info { flex:1; }
    .portfolio-info strong { font-size:0.9rem; display:block; }
    .portfolio-info p { font-size:0.8rem; color:#6B7280; margin:2px 0 0; }
    .portfolio-add { display:flex; flex-wrap:wrap; gap:8px; }
    .pf-field { flex:1; min-width:120px; margin-bottom:-1.25em; }
    .service-list { display:flex; flex-direction:column; gap:8px; margin-bottom:12px; }
    .service-item { display:flex; align-items:flex-start; gap:8px; padding:8px 12px; background:#F9FAFB; border-radius:8px; }
    .service-info { flex:1; }
    .service-info strong { font-size:0.9rem; display:block; }
    .service-info p { font-size:0.8rem; color:#6B7280; margin:2px 0 0; }
    .service-price { font-size:0.85rem; font-weight:600; color:#007AFF; }
    .service-price small { font-size:0.75rem; font-weight:500; color:#6B7280; }
    .service-add { display:flex; flex-direction:column; gap:8px; }
    .svc-field { width:100%; margin-bottom:-1.25em; }
    .svc-row { display:flex; gap:8px; }
    .svc-price { flex:1; margin-bottom:-1.25em; }
    .svc-unit { flex:1; margin-bottom:-1.25em; }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpertDashboard implements OnInit {
    leadNotify = inject(LeadNotificationService);
    avail = inject(AvailabilityService);
    portfolio = inject(PortfolioService);
    expertService = inject(ExpertServiceService);
    private auth = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);

    days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    priceUnitLabels = PRICE_UNIT_LABELS;
    newDay: number | null = null;
    newStart = '';
    newEnd = '';
    pfTitle = '';
    pfDesc = '';
    svcName = '';
    svcDesc = '';
    svcPrice: number | null = null;
    svcUnit: 'hour' | 'report' | 'consultation' | 'document' | 'analysis' | 'fixed' = 'hour';

    get availSlots() { return this.avail.slots(); }
    get services() { return this.expertService.items(); }

    ngOnInit() {
        setTimeout(() => this.init(), 0);
    }

    private async init() {
        await this.auth.initialized;
        const user = this.auth.userProfile();
        if (user) {
            this.avail.load(user.id);
            this.portfolio.load(user.id);
            this.expertService.load(user.id);
        }
        await this.startListening();
    }

    async addSlot() {
        const user = this.auth.userProfile();
        if (!user || this.newDay === null || !this.newStart || !this.newEnd) return;
        try {
            await this.avail.addSlot(user.id, this.newDay, this.newStart, this.newEnd);
            this.newDay = null;
            this.newStart = '';
            this.newEnd = '';
        } finally {
            this.cdr.detectChanges();
        }
    }

    async addPortfolioItem() {
        const user = this.auth.userProfile();
        if (!user || !this.pfTitle.trim()) return;
        try {
            await this.portfolio.addItem(user.id, this.pfTitle.trim(), this.pfDesc.trim());
            this.pfTitle = '';
            this.pfDesc = '';
        } finally {
            this.cdr.detectChanges();
        }
    }

    async addService() {
        const user = this.auth.userProfile();
        if (!user || !this.svcName.trim()) return;
        try {
            await this.expertService.addService(user.id, {
                service_name: this.svcName.trim(),
                description: this.svcDesc.trim() || null,
                base_price: this.svcPrice,
                price_unit: this.svcUnit,
            });
            this.svcName = '';
            this.svcDesc = '';
            this.svcPrice = null;
            this.svcUnit = 'hour';
        } finally {
            this.cdr.detectChanges();
        }
    }

    async removeService(id: string) {
        const user = this.auth.userProfile();
        if (!user) return;
        await this.expertService.removeService(id, user.id);
        this.cdr.detectChanges();
    }

    async startListening() {
        await this.leadNotify.startListening();
        this.cdr.detectChanges();
    }
}
