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
    template: `
    <div class="reports-container">
      <h1>Relatórios</h1>

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
        @for (report of reports; track report.key) {
          <mat-card>
            <mat-card-header>
              <mat-icon mat-card-avatar>{{ report.icon }}</mat-icon>
              <mat-card-title>{{ report.title }}</mat-card-title>
              <mat-card-subtitle>{{ report.subtitle }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="total-count">{{ report.count ?? '—' }} registros</div>
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
        }
      </div>
    </div>
    `,
    styles: [`
    .reports-container { padding: 24px; max-width: 900px; margin: 0 auto; }
    h1 { font-size: 24px; font-weight: 600; margin: 0 0 16px; }
    .period-filter { width: 240px; margin-bottom: 24px; }
    .report-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
    .total-count { font-size: 28px; font-weight: 700; color: #1976d2; padding: 8px 0; }
    mat-card-actions { padding: 8px 16px 16px; }
    `],
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
            count: r.key === 'users' ? (usersCount ?? undefined)
                 : r.key === 'experts' ? (expertsCount ?? undefined)
                 : r.key === 'quotes' ? (quotesCount ?? undefined)
                 : r.key === 'tickets' ? (ticketsCount ?? undefined)
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
