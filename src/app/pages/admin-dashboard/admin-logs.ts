import { Component, OnInit, ChangeDetectorRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';

@Component({
    standalone: true,
    imports: [CommonModule, MatTableModule, MatIconModule, MatProgressSpinnerModule],
    template: `
    <div class="admin-page">
      <h1>Logs de Auditoria</h1>
      @if (loading) {
        <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <table mat-table [dataSource]="logs" class="full-width">
          <ng-container matColumnDef="created_at">
            <th mat-header-cell *matHeaderCellDef>Data</th>
            <td mat-cell *matCellDef="let l">{{ l.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
          </ng-container>
          <ng-container matColumnDef="user_id">
            <th mat-header-cell *matHeaderCellDef>Usuário</th>
            <td mat-cell *matCellDef="let l">{{ l.user_id || 'Sistema' }}</td>
          </ng-container>
          <ng-container matColumnDef="action">
            <th mat-header-cell *matHeaderCellDef>Ação</th>
            <td mat-cell *matCellDef="let l">{{ l.action }}</td>
          </ng-container>
          <ng-container matColumnDef="details">
            <th mat-header-cell *matHeaderCellDef>Detalhes</th>
            <td mat-cell *matCellDef="let l"><pre class="details-json">{{ l.details | json }}</pre></td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="['created_at','user_id','action','details']"></tr>
          <tr mat-row *matRowDef="let row; columns: ['created_at','user_id','action','details'];"></tr>
        </table>
      }
    </div>
  `,
    styles: [`.full-width { width:100%; }.loading{display:flex;justify-content:center;padding:40px;}.details-json{max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.8rem;}`],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLogs implements OnInit {
    private supabase = inject(SupabaseService);
    private cdr = inject(ChangeDetectorRef);
    loading = true;
    logs: any[] = [];

    ngOnInit() {
        setTimeout(() => this.loadLogs(), 0);
    }

    async loadLogs() {
        this.loading = true;
        try {
            const { data } = await this.supabase.client.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
            this.logs = data ?? [];
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }
}
