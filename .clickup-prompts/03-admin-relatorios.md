# Feature: Admin — Relatórios e Exportação CSV

**Task ClickUp:** Admin Relatórios e Exportação CSV

---

## Business Context

**Problema:** Admins não conseguem exportar dados do sistema para análise externa (Excel, BI). Precisam copiar manualmente.

**Métrica:** Reduzir tempo gasto em tarefas manuais de report. Habilitar análise de dados offline.

**Stack:** Angular 21 (standalone, OnPush), Angular Material, Supabase

---

## Prompt 1: ExportService

**Arquivo:** `src/app/services/export.service.ts`

Service com métodos que buscam dados do Supabase e geram blob CSV para download.

```typescript
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class ExportService {
  private supabase = inject(SupabaseService);

  /**
   * Gera CSV a partir de array de objetos.
   * - Converte datas para pt-BR
   * - Adiciona BOM (\\uFEFF) para acentos no Excel
   * - Dispara download no browser
   */
  private downloadCSV(data: Record<string, any>[], filename: string, columns: { key: string; label: string }[]) {
    const header = columns.map(c => c.label).join(',');
    const rows = data.map(row =>
      columns.map(c => {
        const val = row[c.key] ?? '';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(',')
    );
    const csv = '\uFEFF' + [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async exportUsers(filters?: { type?: string; status?: string }) {
    let query = this.supabase.client
      .from('profiles')
      .select('id, full_name, email, profile_type, account_status, city, state, created_at')
      .order('created_at', { ascending: false });

    if (filters?.type) query = query.eq('profile_type', filters.type);
    if (filters?.status) query = query.eq('account_status', filters.status);

    const { data } = await query;
    if (!data) return;

    this.downloadCSV(data, 'usuarios', [
      { key: 'full_name', label: 'Nome' },
      { key: 'email', label: 'Email' },
      { key: 'profile_type', label: 'Tipo' },
      { key: 'account_status', label: 'Status' },
      { key: 'city', label: 'Cidade' },
      { key: 'state', label: 'Estado' },
      { key: 'created_at', label: 'Data Cadastro' },
    ]);
  }

  async exportExperts() {
    let query = this.supabase.client
      .from('profiles')
      .select('id, full_name, email, specialty, city, state, rating, reviews_count, hourly_rate, account_status, created_at')
      .eq('profile_type', 'PERITO')
      .order('created_at', { ascending: false });

    const { data } = await query;
    if (!data) return;

    this.downloadCSV(data, 'peritos', [
      { key: 'full_name', label: 'Nome' },
      { key: 'email', label: 'Email' },
      { key: 'specialty', label: 'Especialidade' },
      { key: 'city', label: 'Cidade' },
      { key: 'state', label: 'Estado' },
      { key: 'rating', label: 'Avaliação' },
      { key: 'reviews_count', label: 'Total Avaliações' },
      { key: 'hourly_rate', label: 'Valor Hora' },
      { key: 'account_status', label: 'Status' },
      { key: 'created_at', label: 'Data Cadastro' },
    ]);
  }

  async exportQuotes(dateFrom?: string, dateTo?: string) {
    let query = this.supabase.client
      .from('quotes')
      .select('*, expert:expert_id(full_name)')
      .order('created_at', { ascending: false });

    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo);

    const { data } = await query;
    if (!data) return;

    this.downloadCSV(data, 'cotacoes', [
      { key: 'created_at', label: 'Data' },
      { key: 'requester_name', label: 'Cliente' },
      { key: 'expert.full_name', label: 'Perito' },
      { key: 'status', label: 'Status' },
      { key: 'proposed_value', label: 'Valor Proposto' },
      { key: 'responded_at', label: 'Data Resposta' },
    ]);
  }

  async exportTickets(status?: string) {
    let query = this.supabase.client
      .from('support_tickets')
      .select('*, user:user_id(full_name, email)')
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data } = await query;
    if (!data) return;

    this.downloadCSV(data, 'tickets', [
      { key: 'subject', label: 'Assunto' },
      { key: 'status', label: 'Status' },
      { key: 'priority', label: 'Prioridade' },
      { key: 'user.full_name', label: 'Usuário' },
      { key: 'created_at', label: 'Data Abertura' },
      { key: 'updated_at', label: 'Última Atualização' },
    ]);
  }

  async exportAppointments(dateFrom?: string, dateTo?: string) {
    let query = this.supabase.client
      .from('appointments')
      .select('*, expert:expert_id(full_name), client:client_id(full_name)')
      .order('created_at', { ascending: false });

    if (dateFrom) query = query.gte('appointment_date', dateFrom);
    if (dateTo) query = query.lte('appointment_date', dateTo);

    const { data } = await query;
    if (!data) return;

    this.downloadCSV(data, 'agendamentos', [
      { key: 'appointment_date', label: 'Data' },
      { key: 'start_time', label: 'Início' },
      { key: 'end_time', label: 'Fim' },
      { key: 'client.full_name', label: 'Cliente' },
      { key: 'expert.full_name', label: 'Perito' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Data Criação' },
    ]);
  }
}
```

**Observação:** `downloadCSV` acessa propriedades aninhadas via string path (`'expert.full_name'`). Implementar helper `getNestedValue(obj, path)` para resolver.

---

## Prompt 2: Página Admin / Relatórios

**Arquivos:**
- `src/app/pages/admin-dashboard/admin-reports.ts`
- `src/app/pages/admin-dashboard/admin-reports.html`
- `src/app/pages/admin-dashboard/admin-reports.scss`

### Template

```html
<div class="reports-container">
  <h1>Relatórios</h1>

  <!-- Filtro de Período -->
  <mat-form-field appearance="outline" class="period-filter">
    <mat-label>Período</mat-label>
    <mat-select [(ngModel)]="selectedPeriod" (selectionChange)="onPeriodChange()">
      <mat-option value="7d">Últimos 7 dias</mat-option>
      <mat-option value="30d">Últimos 30 dias</mat-option>
      <mat-option value="90d">Últimos 90 dias</mat-option>
      <mat-option value="all">Todo período</mat-option>
    </mat-select>
  </mat-form-field>

  <div class="report-grid">
    <mat-card *ngFor="let report of reports">
      <mat-card-header>
        <mat-icon mat-card-avatar>{{ report.icon }}</mat-icon>
        <mat-card-title>{{ report.title }}</mat-card-title>
        <mat-card-subtitle>{{ report.subtitle }}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <div class="total-count" *ngIf="report.count !== undefined">
          {{ report.count }} registros
        </div>
      </mat-card-content>
      <mat-card-actions>
        <button mat-raised-button color="primary"
                [disabled]="exporting === report.key"
                (click)="exportReport(report.key)">
          <mat-icon>download</mat-icon>
          {{ exporting === report.key ? 'Exportando...' : 'Exportar CSV' }}
        </button>
      </mat-card-actions>
    </mat-card>
  </div>
</div>
```

### Component

```typescript
import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ExportService } from '../../services/export.service';
import { NotificationService } from '../../services/notification.service';
import { SupabaseService } from '../../services/supabase.service';

interface ReportConfig {
  key: string;
  title: string;
  subtitle: string;
  icon: string;
  count?: number;
}

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule,
  ],
  template: `...`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminReports implements OnInit {
  private exportSvc = inject(ExportService);
  private supabase = inject(SupabaseService);
  private notify = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  selectedPeriod = '30d';
  exporting: string | null = null;

  reports: ReportConfig[] = [
    { key: 'users', title: 'Usuários', subtitle: 'Todos os perfis cadastrados', icon: 'people' },
    { key: 'experts', title: 'Peritos', subtitle: 'Especialistas cadastrados', icon: 'verified' },
    { key: 'quotes', title: 'Cotações', subtitle: 'Solicitações de orçamento', icon: 'request_quote' },
    { key: 'tickets', title: 'Tickets de Suporte', subtitle: 'Chamados abertos', icon: 'support' },
    { key: 'appointments', title: 'Agendamentos', subtitle: 'Consultas agendadas', icon: 'calendar_month' },
  ];

  async ngOnInit() {
    await this.loadCounts();
  }

  private async loadCounts() {
    // Carregar totais de cada tabela para exibir nos cards
    const { count: usersCount } = await this.supabase.client
      .from('profiles').select('*', { count: 'exact', head: true });
    const { count: expertsCount } = await this.supabase.client
      .from('profiles').select('*', { count: 'exact', head: true }).eq('profile_type', 'PERITO');
    const { count: quotesCount } = await this.supabase.client
      .from('quotes').select('*', { count: 'exact', head: true });
    const { count: ticketsCount } = await this.supabase.client
      .from('support_tickets').select('*', { count: 'exact', head: true });

    this.reports = this.reports.map(r => ({
      ...r,
      count: r.key === 'users' ? usersCount
           : r.key === 'experts' ? expertsCount
           : r.key === 'quotes' ? quotesCount
           : r.key === 'tickets' ? ticketsCount
           : r.count,
    }));
    this.cdr.detectChanges();
  }

  onPeriodChange() {
    this.loadCounts();
  }

  async exportReport(key: string) {
    this.exporting = key;
    this.cdr.detectChanges();

    try {
      const dates = this.getDateRange();

      switch (key) {
        case 'users': await this.exportSvc.exportUsers(); break;
        case 'experts': await this.exportSvc.exportExperts(); break;
        case 'quotes': await this.exportSvc.exportQuotes(dates.from, dates.to); break;
        case 'tickets': await this.exportSvc.exportTickets(); break;
        case 'appointments': await this.exportSvc.exportAppointments(dates.from, dates.to); break;
      }
      this.notify.success(`${this.reports.find(r => r.key === key)?.title} exportado com sucesso!`);
    } catch (e) {
      console.error('Export error:', e);
      this.notify.error('Erro ao exportar. Tente novamente.');
    } finally {
      this.exporting = null;
      this.cdr.detectChanges();
    }
  }

  private getDateRange() {
    if (this.selectedPeriod === 'all') return { from: undefined, to: undefined };
    const days = parseInt(this.selectedPeriod);
    const to = new Date().toISOString();
    const from = new Date(Date.now() - days * 86400000).toISOString();
    return { from, to };
  }
}
```

### Roteamento

Adicionar em `src/app/app.routes.ts`:
```typescript
{ path: 'reports', loadComponent: () => import('./pages/admin-dashboard/admin-reports').then(m => m.AdminReports) },
```

Adicionar no sidebar do admin layout (`admin-layout.ts`):
```typescript
{ path: '/admin/reports', icon: 'assessment', label: 'Relatórios' }
```

### Edge Cases

- **0 registros:** card mostra "0 registros", export gera CSV só com header
- **Erro na query:** capturar e mostrar notificação de erro
- **Export duplicado:** desabilitar botão enquanto exporta
- **Período sem dados:** CSV vazio (só cabeçalho) — esperado
- **Navegador sem suporte a Blob download:** fallback (pouco provável, mas testar)

---

## Verification

1. Entrar em /admin/reports → ver 5 cards com totais
2. Clicar "Exportar CSV" em Usuários → download de arquivo válido
3. Abrir CSV no Excel → acentos funcionando, colunas corretas
4. Mudar período → counts atualizam (se tiver data range nos métodos que suportam)
5. Clicar em todos os tipos → cada um baixa com dados corretos
