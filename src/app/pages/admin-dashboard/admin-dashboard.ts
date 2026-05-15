import { Component, OnInit, ChangeDetectorRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupabaseService } from '../../services/supabase.service';

@Component({
    standalone: true,
    imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
    template: `
    <h1>Dashboard Admin</h1>
    @if (loading) {
      <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
    } @else {
      <div class="stats-grid">
        @for (stat of stats; track stat.label) {
          <mat-card class="stat-card">
            <mat-card-content style="text-align:center;padding:24px;">
              <mat-icon style="font-size:40px;width:40px;height:40px;color:#1a237e;">{{ stat.icon }}</mat-icon>
              <h2 style="font-size:2rem;margin:8px 0 0;font-weight:700;">{{ stat.value }}</h2>
              <p style="color:#5a6072;margin:4px 0 0;">{{ stat.label }}</p>
            </mat-card-content>
          </mat-card>
        }
      </div>

      <h2 style="margin-top:40px;">Métricas de Conversão</h2>
      @if (metrics) {
      <div class="metrics-grid">
        <mat-card class="metric-card">
          <mat-card-content>
            <h3>Cotações/Mês</h3>
            <p class="metric-value">{{ metrics.monthlyQuotes }}</p>
            <p class="metric-target">Meta: &gt; 50</p>
          </mat-card-content>
        </mat-card>
        <mat-card class="metric-card">
          <mat-card-content>
            <h3>Taxa de Conversão</h3>
            <p class="metric-value">{{ metrics.conversionRate }}%</p>
            <p class="metric-target">Meta: &gt; 30%</p>
          </mat-card-content>
        </mat-card>
        <mat-card class="metric-card">
          <mat-card-content>
            <h3>Tempo Médio Resposta</h3>
            <p class="metric-value">{{ metrics.avgResponseHours }}h</p>
            <p class="metric-target">Meta: &lt; 24h</p>
          </mat-card-content>
        </mat-card>
        <mat-card class="metric-card">
          <mat-card-content>
            <h3>Taxa de Avaliação</h3>
            <p class="metric-value">{{ metrics.reviewRate }}%</p>
            <p class="metric-target">Meta: &gt; 80%</p>
          </mat-card-content>
        </mat-card>
      </div>
      }
    }
  `,
    styles: [`.stats-grid { display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;margin-top:20px;}.loading{display:flex;justify-content:center;padding:40px;}.metrics-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-top:16px;}.metric-card{text-align:center;}.metric-value{font-size:2rem;font-weight:700;color:#1a237e;margin:8px 0;}.metric-target{color:#829AB1;font-size:0.85rem;}`],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboard implements OnInit {
    private supabase = inject(SupabaseService);
    private cdr = inject(ChangeDetectorRef);
    stats: any[] = [];
    metrics: any = null;
    loading = true;

    ngOnInit() {
        setTimeout(() => this.loadStats(), 0);
    }

    async loadStats() {
        try {
            const [stats, metrics] = await Promise.all([
                this.supabase.getAdminStats(),
                this.supabase.getConversionMetrics(),
            ]);
            this.stats = [
                { icon: 'person', label: 'Peritos', value: stats.peritos },
                { icon: 'people', label: 'Contratantes', value: stats.contratantes },
                { icon: 'rate_review', label: 'Cotações', value: stats.quotes },
                { icon: 'visibility', label: 'Perfil Visível', value: stats.visiveis },
                { icon: 'star', label: 'Avaliações', value: stats.reviews },
                { icon: 'how_to_reg', label: 'Leads', value: stats.leads },
                { icon: 'pending', label: 'Peritos Pendentes', value: stats.pending },
            ];
            this.metrics = metrics;
        } catch (err) {
            console.error('Error loading admin stats:', err);
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }
}
