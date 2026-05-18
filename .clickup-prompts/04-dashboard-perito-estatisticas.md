# Feature: Dashboard do Perito com Estatísticas

**Task ClickUp:** Dashboard do Perito com Estatísticas

---

## Business Context

**Problema:** Peritos não têm visibilidade sobre seu desempenho na plataforma — quantas pessoas viram o perfil, quantos leads se convertem, quanto estão ganhando.

**Métrica:** Aumentar engajamento dos peritos com a plataforma (retorno ao dashboard), dar dados para que otimizem seus perfis.

**Stack:** Angular 21 (standalone, OnPush), Angular Material, Supabase, Chart.js ou ngx-charts

---

## Prompt 1: ExpertStatsService

**Arquivo:** `src/app/services/expert-stats.service.ts`

Serviço que agrega métricas do perito. Seguir o padrão signal-based dos outros services.

```typescript
import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface ExpertStats {
  totalLeads: number;
  respondedLeads: number;
  acceptedLeads: number;
  conversionRate: number;
  avgRating: number;
  totalReviews: number;
  reviewDistribution: Record<number, number>; // { 1: count, 2: count, ... }
  totalRevenue: number;
  monthlyRevenue: number;
  leadsByMonth: { month: string; count: number; accepted: number }[];
  avgResponseTimeHours: number;
}

@Injectable({ providedIn: 'root' })
export class ExpertStatsService {
  private supabase = inject(SupabaseService);
  stats = signal<ExpertStats | null>(null);
  loading = signal(false);

  async loadStats(expertId: string) {
    this.loading.set(true);

    // 1. Buscar cotações do perito
    const { data: quotes } = await this.supabase.client
      .from('quotes')
      .select('*')
      .eq('expert_id', expertId)
      .order('created_at', { ascending: false });

    // 2. Buscar reviews do perito
    const { data: reviews } = await this.supabase.client
      .from('reviews')
      .select('rating')
      .eq('expert_id', expertId);

    // 3. Buscar dados do perfil (rating, reviews_count)
    const { data: profile } = await this.supabase.client
      .from('profiles')
      .select('rating, reviews_count')
      .eq('id', expertId)
      .single();

    // Calcular métricas
    const totalLeads = quotes?.length ?? 0;
    const respondedLeads = quotes?.filter(q => q.responded_at).length ?? 0;
    const acceptedLeads = quotes?.filter(q => q.status === 'approved').length ?? 0;
    const conversionRate = totalLeads > 0 ? (acceptedLeads / totalLeads) * 100 : 0;

    // Reviews
    const allRatings = reviews ?? [];
    const totalReviews = allRatings.length;
    const avgRating = totalReviews > 0
      ? allRatings.reduce((s, r) => s + r.rating, 0) / totalReviews
      : 0;
    const reviewDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allRatings.forEach(r => { reviewDistribution[r.rating] = (reviewDistribution[r.rating] ?? 0) + 1; });

    // Receita (soma de proposed_value de quotes aprovados)
    const totalRevenue = quotes
      ?.filter(q => q.status === 'approved' && q.proposed_value)
      .reduce((s, q) => s + (q.proposed_value ?? 0), 0) ?? 0;

    // Receita no mês
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthlyRevenue = quotes
      ?.filter(q => q.status === 'approved' && q.proposed_value && q.created_at >= startOfMonth)
      .reduce((s, q) => s + (q.proposed_value ?? 0), 0) ?? 0;

    // Leads por mês (últimos 6 meses)
    const leadsByMonth: { month: string; count: number; accepted: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleDateString('pt-BR', { month: 'short' });
      const monthQuotes = quotes?.filter(q => q.created_at?.startsWith(monthKey)) ?? [];
      leadsByMonth.push({
        month: monthLabel,
        count: monthQuotes.length,
        accepted: monthQuotes.filter(q => q.status === 'approved').length,
      });
    }

    // Tempo médio de resposta (horas)
    const responseTimes = quotes
      ?.filter(q => q.responded_at)
      .map(q => {
        const created = new Date(q.created_at).getTime();
        const responded = new Date(q.responded_at!).getTime();
        return (responded - created) / 3600000;
      }) ?? [];
    const avgResponseTimeHours = responseTimes.length > 0
      ? responseTimes.reduce((s, t) => s + t, 0) / responseTimes.length
      : 0;

    this.stats.set({
      totalLeads, respondedLeads, acceptedLeads,
      conversionRate: Math.round(conversionRate * 10) / 10,
      avgRating: Math.round(avgRating * 10) / 10,
      totalReviews, reviewDistribution,
      totalRevenue, monthlyRevenue,
      leadsByMonth,
      avgResponseTimeHours: Math.round(avgResponseTimeHours * 10) / 10,
    });
    this.loading.set(false);
  }
}
```

---

## Prompt 2: Cards de Métricas + Gráficos no ExpertDashboard

**Arquivo:** Atualizar `src/app/pages/expert-dashboard/expert-dashboard.ts`

**Dependência de gráfico:**
- Opção A (simples): usar CSS + divs para barras horizontais simples
- Opção B (recomendado): `ngx-charts` — `npm install @swimlane/ngx-charts`

### Template — Seção de Métricas

Adicionar no início do dashboard (acima dos cards existentes):

```html
<!-- Estatísticas -->
@if (statsService.loading()) {
  <div class="stats-loading"><mat-spinner diameter="40" /></div>
} @else if (statsService.stats(); as stats) {
  <section class="stats-section">
    <h2>Suas Estatísticas</h2>

    <!-- Cards rápidos -->
    <div class="stats-grid">
      <mat-card class="stat-card">
        <mat-icon>visibility</mat-icon>
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

    <!-- Gráfico: Leads por Mês -->
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

    <!-- Tabela: Últimos Leads -->
    <mat-card class="recent-leads-card">
      <mat-card-header>
        <mat-card-title>Últimos Leads</mat-card-title>
        <a mat-button routerLink="/expert/quotes">Ver todos</a>
      </mat-card-header>
      <mat-card-content>
        <table class="leads-table" *ngIf="recentLeads.length > 0">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Data</th>
              <th>Status</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let lead of recentLeads">
              <td>{{ lead.requester_name }}</td>
              <td>{{ lead.created_at | date:'dd/MM' }}</td>
              <td><span class="status-badge" [class]="lead.status">{{ lead.status }}</span></td>
              <td>{{ lead.proposed_value | currency:'BRL' }}</td>
            </tr>
          </tbody>
        </table>
        <div class="empty-table" *ngIf="recentLeads.length === 0">
          Nenhum lead recebido ainda.
        </div>
      </mat-card-content>
    </mat-card>
  </section>
}
```

### Component Logic

```typescript
import { ExpertStatsService } from '../../services/expert-stats.service';
import { QuoteService } from '../../services/quote.service';

// No componente
statsService = inject(ExpertStatsService);
recentLeads: any[] = [];
selectedPeriod = signal<'7d' | '30d' | '90d' | 'all'>('30d');

async ngOnInit() {
  await this.auth.initialized;
  const user = this.auth.userProfile();
  if (!user) return;

  await this.statsService.loadStats(user.id);
  await this.loadRecentLeads(user.id);
  this.cdr.detectChanges();
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

// Helper para altura da barra
maxBarHeight(value: number, all: { count: number }[]): number {
  const max = Math.max(...all.map(m => m.count), 1);
  return (value / max) * 100;
}
```

### Estilos

```scss
.stats-section {
  margin-bottom: 32px;

  h2 {
    font-size: 20px;
    margin-bottom: 16px;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
  padding: 20px;

  mat-icon {
    font-size: 32px;
    width: 32px;
    height: 32px;
    margin-bottom: 8px;
    color: #1976d2;
  }

  &.accent mat-icon { color: #ff9800; }

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.2;
  }

  .stat-label {
    font-size: 12px;
    color: #666;
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.chart-card {
  margin-bottom: 24px;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  height: 200px;
  padding: 16px 0;
}

.bar-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bar-container {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 2px;
}

.bar {
  width: 100%;
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: height 0.3s ease;
  position: relative;

  &.total { background: #1976d2; }
  &.accepted { background: #4caf50; }
}

.bar-label {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  font-weight: 600;
}

.bar-month {
  font-size: 11px;
  color: #666;
  margin-top: 8px;
}

.chart-legend {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 8px;
  font-size: 12px;

  .dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 2px;
    margin-right: 4px;
  }
  .total-dot { background: #1976d2; }
  .accepted-dot { background: #4caf50; }
}

.leads-table {
  width: 100%;
  border-collapse: collapse;

  th, td {
    text-align: left;
    padding: 8px 12px;
    border-bottom: 1px solid #eee;
  }

  th { font-size: 12px; color: #666; text-transform: uppercase; }
  td { font-size: 14px; }
}
```

---

## Edge Cases

- **0 leads:** gráfico vazio com mensagem "Nenhum lead recebido ainda"
- **0 reviews:** rating mostra "-" em vez de 0
- **Receita zero:** R$ 0,00 como esperado
- **Perito recém-criado:** todas métricas zeradas, sem erro
- **Loading:** skeleton/spinner enquanto carrega
- **Erro na query:** capturar exception, mostrar "Erro ao carregar estatísticas"
- **Mês sem leads:** barra invisível (altura 0)

---

## Verification

1. Logar como perito com leads → ver cards e gráfico
2. Leads por mês → barras proporcionais, aceitos destacados
3. Tabela últimos leads → 5 registros mais recentes
4. Logar como perito novo → tudo zerado, sem erro
5. Mudar período (se implementar filtro) → métricas atualizam
