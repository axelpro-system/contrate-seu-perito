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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LeadNotificationService } from '../../services/lead-notification.service';
import { AvailabilityService } from '../../services/availability.service';
import { PortfolioService } from '../../services/portfolio.service';
import { ExpertServiceService, PRICE_UNIT_LABELS } from '../../services/expert-service.service';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';
import { AppointmentService } from '../../services/appointment.service';
import { NotificationService } from '../../services/notification.service';
import { ExpertStatsService } from '../../services/expert-stats.service';
import { APPOINTMENT_STATUS_LABELS } from '../../types';

@Component({
    selector: 'app-expert-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatBadgeModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatDialogModule, RouterLink, MatTooltipModule, MatProgressSpinnerModule],
    template: `
    <div class="dashboard">
      <h1>Área do Perito</h1>

      @if (statsService.loading()) {
        <div class="stats-loading"><mat-spinner diameter="40" /></div>
      } @else if (statsService.stats(); as stats) {
        <section class="stats-section">
          <div class="stats-grid">
            <mat-card class="stat-card">
              <mat-icon>mail</mat-icon>
              <div class="stat-value">{{ stats.totalLeads }}</div>
              <div class="stat-label">Leads Recebidos</div>
            </mat-card>
            <mat-card class="stat-card accent">
              <mat-icon>trending_up</mat-icon>
              <div class="stat-value">{{ stats.conversionRate }}%</div>
              <div class="stat-label">Taxa de Conversão</div>
            </mat-card>
            <mat-card class="stat-card">
              <mat-icon>star</mat-icon>
              <div class="stat-value">{{ stats.avgRating }}</div>
              <div class="stat-label">Avaliação Média</div>
            </mat-card>
            <mat-card class="stat-card accent">
              <mat-icon>payments</mat-icon>
              <div class="stat-value">{{ stats.monthlyRevenue | currency:'BRL' }}</div>
              <div class="stat-label">Receita no Mês</div>
            </mat-card>
          </div>

          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>Leads por Mês</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="bar-chart">
                @for (item of stats.leadsByMonth; track item.month) {
                  <div class="bar-group">
                    <div class="bar-container">
                      <div class="bar total" [style.height.%]="maxBarHeight(item.count, stats.leadsByMonth)">
                        <span class="bar-label">{{ item.count }}</span>
                      </div>
                      <div class="bar accepted" [style.height.%]="maxBarHeight(item.accepted, stats.leadsByMonth)">
                      </div>
                    </div>
                    <div class="bar-month">{{ item.month }}</div>
                  </div>
                }
              </div>
              <div class="chart-legend">
                <span><span class="dot total-dot"></span> Total</span>
                <span><span class="dot accepted-dot"></span> Aceitos</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="recent-leads-card">
            <mat-card-header>
              <mat-card-title>Últimos Leads</mat-card-title>
              <a mat-button routerLink="/expert/quotes">Ver todos</a>
            </mat-card-header>
            <mat-card-content>
              @if (recentLeads.length > 0) {
                <table class="leads-table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Data</th>
                      <th>Status</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (lead of recentLeads; track lead.created_at) {
                      <tr>
                        <td>{{ lead.requester_name }}</td>
                        <td>{{ lead.created_at | date:'dd/MM' }}</td>
                        <td><span class="status-badge" [class]="'status-' + lead.status">{{ lead.status }}</span></td>
                        <td>{{ lead.proposed_value | currency:'BRL' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              } @else {
                <div class="empty-table">Nenhum lead recebido ainda.</div>
              }
            </mat-card-content>
          </mat-card>
        </section>
      }

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
            <mat-icon mat-card-avatar>calendar_month</mat-icon>
            <mat-card-title>Agendamentos</mat-card-title>
            <mat-card-subtitle>Consultas marcadas</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (apptSvc.loading()) {
              <p style="color:#9CA3AF;text-align:center;padding:12px;">Carregando...</p>
            } @else {
              <div class="appt-summary">
                <div class="appt-stat" (click)="filterApptTab = 'pending'"
                     [class.active]="filterApptTab === 'pending'">
                  <strong>{{ pendingAppts.length }}</strong>
                  <span>Pendentes</span>
                </div>
                <div class="appt-stat" (click)="filterApptTab = 'confirmed'"
                     [class.active]="filterApptTab === 'confirmed'">
                  <strong>{{ confirmedAppts.length }}</strong>
                  <span>Confirmados</span>
                </div>
                <div class="appt-stat" (click)="filterApptTab = 'today'"
                     [class.active]="filterApptTab === 'today'">
                  <strong>{{ todayAppts.length }}</strong>
                  <span>Hoje</span>
                </div>
              </div>
              <div class="appt-list">
                @for (appt of filteredAppointments(); track appt.id) {
                  <div class="appt-row" [class.appt-row--urgent]="appt.status === 'pending'">
                    <div class="appt-row-info">
                      <span class="appt-row-date">{{ appt.appointment_date | date:'dd/MM' }}</span>
                      <span class="appt-row-time">{{ appt.start_time.slice(0,5) }}</span>
                      <span class="appt-row-client">{{ appt.client?.full_name || 'Cliente' }}</span>
                    </div>
                    <div class="appt-row-actions">
                      @if (appt.status === 'pending') {
                        <button mat-icon-button (click)="confirmAppt(appt)" matTooltip="Confirmar" aria-label="Confirmar">
                          <mat-icon style="color:#4CAF50">check_circle</mat-icon>
                        </button>
                      }
                      @if (appt.status === 'confirmed') {
                        <button mat-icon-button (click)="completeAppt(appt)" matTooltip="Realizar" aria-label="Realizar">
                          <mat-icon style="color:#1976d2">task_alt</mat-icon>
                        </button>
                      }
                      @if (appt.status !== 'cancelled' && appt.status !== 'no_show') {
                        <button mat-icon-button (click)="cancelAppt(appt)" matTooltip="Cancelar" aria-label="Cancelar">
                          <mat-icon color="warn">cancel</mat-icon>
                        </button>
                      }
                    </div>
                  </div>
                } @empty {
                  <p class="appt-empty">Nenhum agendamento {{ filterApptTab === 'today' ? 'para hoje' : 'nesta categoria' }}.</p>
                }
              </div>
            }
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
    .appt-summary { display:flex; gap:8px; margin-bottom:12px; }
    .appt-stat { flex:1; text-align:center; padding:8px; border-radius:8px; background:#F9FAFB; cursor:pointer; transition:background .15s; }
    .appt-stat:hover { background:#E5F0FF; }
    .appt-stat.active { background:#E3F2FD; outline:2px solid #1976d2; }
    .appt-stat strong { display:block; font-size:1.2rem; color:#1976d2; }
    .appt-stat span { font-size:0.75rem; color:#6B7280; }
    .appt-list { display:flex; flex-direction:column; gap:4px; max-height:280px; overflow-y:auto; }
    .appt-row { display:flex; align-items:center; justify-content:space-between; padding:6px 8px; border-radius:6px; background:#F9FAFB; font-size:0.85rem; }
    .appt-row--urgent { background:#FFF3E0; }
    .appt-row-info { display:flex; align-items:center; gap:8px; flex:1; }
    .appt-row-date { font-weight:600; min-width:36px; }
    .appt-row-time { color:#6B7280; }
    .appt-row-client { color:#374151; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .appt-row-actions { display:flex; gap:2px; }
    .appt-empty { color:#9CA3AF; font-size:0.8rem; text-align:center; padding:16px 0; }
    .stats-loading { display:flex; justify-content:center; padding:48px; }
    .stats-section { margin-bottom:32px; }
    .stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; margin-bottom:24px; }
    .stat-card { text-align:center; padding:20px; }
    .stat-card mat-icon { font-size:32px; width:32px; height:32px; margin-bottom:8px; color:#1976d2; }
    .stat-card.accent mat-icon { color:#ff9800; }
    .stat-card .stat-value { font-size:28px; font-weight:700; line-height:1.2; }
    .stat-card .stat-label { font-size:12px; color:#666; margin-top:4px; text-transform:uppercase; letter-spacing:0.5px; }
    .chart-card { margin-bottom:24px; }
    .bar-chart { display:flex; align-items:flex-end; gap:16px; height:200px; padding:16px 0; }
    .bar-group { flex:1; display:flex; flex-direction:column; align-items:center; height:100%; }
    .bar-container { flex:1; width:100%; display:flex; flex-direction:column; justify-content:flex-end; gap:2px; }
    .bar { width:100%; border-radius:4px 4px 0 0; min-height:4px; transition:height .3s ease; position:relative; }
    .bar.total { background:#1976d2; }
    .bar.accepted { background:#4caf50; }
    .bar-label { position:absolute; top:-20px; left:50%; transform:translateX(-50%); font-size:11px; font-weight:600; }
    .bar-month { font-size:11px; color:#666; margin-top:8px; }
    .chart-legend { display:flex; gap:16px; justify-content:center; margin-top:8px; font-size:12px; }
    .chart-legend .dot { display:inline-block; width:10px; height:10px; border-radius:2px; margin-right:4px; }
    .chart-legend .total-dot { background:#1976d2; }
    .chart-legend .accepted-dot { background:#4caf50; }
    .recent-leads-card mat-card-header { display:flex; align-items:center; justify-content:space-between; }
    .leads-table { width:100%; border-collapse:collapse; }
    .leads-table th,.leads-table td { text-align:left; padding:8px 12px; border-bottom:1px solid #eee; }
    .leads-table th { font-size:12px; color:#666; text-transform:uppercase; }
    .leads-table td { font-size:14px; }
    .empty-table { text-align:center; padding:24px 0; color:#9CA3AF; font-size:0.9rem; }
    .status-badge { display:inline-block; padding:2px 8px; border-radius:999px; font-size:12px; font-weight:500; }
    .status-badge.status-pending { background:#FFF3E0; color:#E65100; }
    .status-badge.status-approved { background:#E8F5E9; color:#2E7D32; }
    .status-badge.status-rejected { background:#FFEBEE; color:#C62828; }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpertDashboard implements OnInit {
    leadNotify = inject(LeadNotificationService);
    avail = inject(AvailabilityService);
    portfolio = inject(PortfolioService);
    expertService = inject(ExpertServiceService);
    apptSvc = inject(AppointmentService);
    statsService = inject(ExpertStatsService);
    private supabase = inject(SupabaseService);
    private auth = inject(AuthService);
    private notify = inject(NotificationService);
    private cdr = inject(ChangeDetectorRef);

    filterApptTab: 'pending' | 'confirmed' | 'today' = 'today';
    statusLabel = APPOINTMENT_STATUS_LABELS;
    recentLeads: any[] = [];

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

    get allAppts() { return this.apptSvc.appointments(); }

    get pendingAppts() { return this.allAppts.filter(a => a.status === 'pending'); }

    get confirmedAppts() { return this.allAppts.filter(a => a.status === 'confirmed'); }

    get todayAppts() {
        const today = new Date().toISOString().split('T')[0];
        return this.allAppts.filter(a =>
            a.appointment_date === today &&
            ['pending', 'confirmed'].includes(a.status)
        );
    }

    filteredAppointments() {
        if (this.filterApptTab === 'today') return this.todayAppts;
        return this.allAppts.filter(a => a.status === this.filterApptTab);
    }

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
            this.statsService.loadStats(user.id);
            await this.loadRecentLeads(user.id);
            const today = new Date().toISOString().split('T')[0];
            this.apptSvc.loadForRange(user.id, today, '');
            this.apptSvc.subscribeToUpdates(user.id);
        }
        await this.startListening();
    }

    async loadRecentLeads(expertId: string) {
        const { data } = await this.supabase.client
            .from('quotes')
            .select('requester_name, created_at, status, proposed_value')
            .eq('expert_id', expertId)
            .order('created_at', { ascending: false })
            .limit(5);
        this.recentLeads = data ?? [];
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

    async confirmAppt(appt: any) {
        if (!confirm(`Confirmar agendamento de ${appt.client?.full_name || 'cliente'} dia ${appt.appointment_date} às ${appt.start_time.slice(0, 5)}?`)) return;
        try {
            await this.apptSvc.updateStatus(appt.id, 'confirmed');
            this.notify.success('Agendamento confirmado!');
            this.cdr.detectChanges();
        } catch (e: any) {
            this.notify.error(e?.message || 'Erro ao confirmar.');
        }
    }

    async completeAppt(appt: any) {
        if (!confirm(`Marcar como realizado o agendamento de ${appt.client?.full_name || 'cliente'}?`)) return;
        try {
            await this.apptSvc.updateStatus(appt.id, 'completed');
            this.notify.success('Agendamento concluído!');
            this.cdr.detectChanges();
        } catch (e: any) {
            this.notify.error(e?.message || 'Erro ao atualizar.');
        }
    }

    async cancelAppt(appt: any) {
        const reason = prompt('Motivo do cancelamento (opcional):');
        const user = this.auth.userProfile();
        if (!user) return;
        try {
            await this.apptSvc.cancel(appt.id, user.id, reason || undefined);
            this.notify.success('Agendamento cancelado.');
            this.cdr.detectChanges();
        } catch (e: any) {
            this.notify.error(e?.message || 'Erro ao cancelar.');
        }
    }

    async removeService(id: string) {
        const user = this.auth.userProfile();
        if (!user) return;
        await this.expertService.removeService(id, user.id);
        this.cdr.detectChanges();
    }

    maxBarHeight(value: number, all: { count: number }[]): number {
        const max = Math.max(...all.map(m => m.count), 1);
        return (value / max) * 100;
    }

    async startListening() {
        await this.leadNotify.startListening();
        this.cdr.detectChanges();
    }
}
