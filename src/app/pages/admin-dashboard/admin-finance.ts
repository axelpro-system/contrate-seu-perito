import { Component, OnInit, ChangeDetectorRef, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatFormFieldModule, MatInputModule, MatTooltipModule, MatTabsModule],
    template: `
    <div class="admin-page">
      <h1>Financeiro</h1>

      @if (loading) { <div class="loading"><mat-spinner diameter="40"></mat-spinner></div> }
      @else {
        <div class="stats-grid">
          <mat-card class="stat-card">
            <mat-card-content>
              <mat-icon>receipt_long</mat-icon>
              <h2>{{ quotes.length }}</h2>
              <p>Total de Cotações</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <mat-icon>check_circle</mat-icon>
              <h2>{{ approvedCount }}</h2>
              <p>Aprovadas</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <mat-icon>attach_money</mat-icon>
              <h2>{{ totalValue | currency:'BRL' }}</h2>
              <p>Valor Total Aprovado</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <mat-icon>account_balance</mat-icon>
              <h2>{{ estimatedCommission | currency:'BRL' }}</h2>
              <p>Comissão Estimada (10%)</p>
            </mat-card-content>
          </mat-card>
        </div>

        <mat-tab-group style="margin-top:32px;">
          <mat-tab label="Cotações">
            <table mat-table [dataSource]="quotes" class="full-width" style="margin-top:16px;">
              <ng-container matColumnDef="created_at">
                <th mat-header-cell *matHeaderCellDef>Data</th>
                <td mat-cell *matCellDef="let q">{{ q.created_at | date:'dd/MM/yyyy' }}</td>
              </ng-container>
              <ng-container matColumnDef="requester_name">
                <th mat-header-cell *matHeaderCellDef>Cliente</th>
                <td mat-cell *matCellDef="let q">{{ q.requester_name }}</td>
              </ng-container>
              <ng-container matColumnDef="proposed_value">
                <th mat-header-cell *matHeaderCellDef>Valor</th>
                <td mat-cell *matCellDef="let q">{{ q.proposed_value | currency:'BRL' }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let q"><span class="status-badge" [class]="q.status">{{ statusLabel(q.status) }}</span></td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="quoteCols"></tr>
              <tr mat-row *matRowDef="let row; columns: quoteCols;"></tr>
            </table>
          </mat-tab>

          <mat-tab label="Comissões">
            <div style="margin-top:16px;">
              <p style="color:#6B7280;margin-bottom:16px;">Configure a taxa de comissão para cada perito.</p>
              <table mat-table [dataSource]="experts" class="full-width">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Perito</th>
                  <td mat-cell *matCellDef="let e">{{ e.full_name || e.first_name + ' ' + e.last_name }}</td>
                </ng-container>
                <ng-container matColumnDef="commission">
                  <th mat-header-cell *matHeaderCellDef>Comissão (%)</th>
                  <td mat-cell *matCellDef="let e">
                    <mat-form-field appearance="outline" style="width:100px;">
                      <input matInput type="number" [(ngModel)]="e.commission_percentage" (blur)="saveCommission(e)" min="0" max="100">
                    </mat-form-field>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="commCols"></tr>
                <tr mat-row *matRowDef="let row; columns: commCols;"></tr>
              </table>
            </div>
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
    styles: [`
    .full-width { width:100%; }
    .loading { display:flex; justify-content:center; padding:60px; }
    .stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; }
    .stat-card mat-card-content { text-align:center; padding:24px; }
    .stat-card mat-icon { font-size:36px; width:36px; height:36px; color:#1a237e; }
    .stat-card h2 { font-size:1.8rem; margin:8px 0 0; font-weight:700; }
    .stat-card p { color:#5a6072; margin:4px 0 0; }
    .status-badge { display:inline-block; padding:2px 10px; border-radius:999px; font-size:0.8rem; font-weight:500; }
    .status-badge.approved { background:#DCFCE7; color:#16A34A; }
    .status-badge.pending { background:#FEF3C7; color:#D97706; }
    .status-badge.rejected { background:#FEE2E2; color:#DC2626; }
  `],
})
export class AdminFinance implements OnInit {
    private supabase = inject(SupabaseService);
    private notify = inject(NotificationService);
    private cdr = inject(ChangeDetectorRef);

    loading = true;
    quotes: any[] = [];
    experts: any[] = [];
    quoteCols = ['created_at', 'requester_name', 'proposed_value', 'status'];
    commCols = ['name', 'commission'];

    get approvedCount() { return this.quotes.filter(q => q.status === 'approved').length; }
    get totalValue() { return this.quotes.filter(q => q.status === 'approved').reduce((s, q) => s + (q.proposed_value || 0), 0); }
    get estimatedCommission() { return this.totalValue * 0.1; }

    ngOnInit() { setTimeout(() => this.load(), 0); }

    async load() {
        this.loading = true;
        try {
            const [quotesRes, expertsRes, commissionsRes] = await Promise.all([
                this.supabase.client.from('quotes').select('*').order('created_at', { ascending: false }).limit(500),
                this.supabase.client.from('profiles').select('id, first_name, last_name, full_name').eq('profile_type', 'PERITO').order('full_name'),
                this.supabase.client.from('commission_rates').select('*'),
            ]);

            this.quotes = quotesRes.data ?? [];

            const commissions = commissionsRes.data ?? [];
            const commMap = new Map(commissions.map((c: any) => [c.expert_id, c.percentage]));

            this.experts = (expertsRes.data ?? []).map((e: any) => ({
                ...e,
                commission_percentage: commMap.get(e.id) ?? 10,
                _original: commMap.get(e.id) ?? 10,
            }));
        } catch { this.notify.error('Erro ao carregar dados financeiros.'); }
        finally { this.loading = false; this.cdr.detectChanges(); }
    }

    async saveCommission(expert: any) {
        const pct = Number(expert.commission_percentage);
        if (isNaN(pct) || pct < 0 || pct > 100) {
            expert.commission_percentage = expert._original;
            this.notify.error('Percentual inválido (0-100).');
            return;
        }

        await this.supabase.client.from('commission_rates').upsert({
            expert_id: expert.id,
            percentage: pct,
        }, { onConflict: 'expert_id' });

        expert._original = pct;
        this.notify.success('Comissão salva.');
    }

    statusLabel(s: string): string {
        const map: Record<string, string> = { approved: 'Aprovado', pending: 'Pendente', rejected: 'Recusado' };
        return map[s] || s;
    }
}
