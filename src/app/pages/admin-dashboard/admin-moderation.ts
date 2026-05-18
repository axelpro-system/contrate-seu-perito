import { Component, OnInit, ChangeDetectorRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule],
    template: `
    <div class="admin-page">
      <h1>Moderação</h1>

      <h2>Avaliações ({{ reviews().length }})</h2>
      @if (loadingReviews) {
        <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <table mat-table [dataSource]="reviews()" class="full-width mb-32">
          <ng-container matColumnDef="reviewer_name">
            <th mat-header-cell *matHeaderCellDef>Cliente</th>
            <td mat-cell *matCellDef="let r">{{ r.reviewer_name }}</td>
          </ng-container>
          <ng-container matColumnDef="rating">
            <th mat-header-cell *matHeaderCellDef>Nota</th>
            <td mat-cell *matCellDef="let r">
              <span class="stars">★</span> {{ r.rating }}/5
            </td>
          </ng-container>
          <ng-container matColumnDef="comment">
            <th mat-header-cell *matHeaderCellDef>Comentário</th>
            <td mat-cell *matCellDef="let r" class="comment-cell">{{ r.comment || '-' }}</td>
          </ng-container>
          <ng-container matColumnDef="created_at">
            <th mat-header-cell *matHeaderCellDef>Data</th>
            <td mat-cell *matCellDef="let r">{{ r.created_at | date:'dd/MM/yyyy' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let r">
              <button mat-icon-button (click)="deleteReview(r)" color="warn" matTooltip="Excluir avaliação"><mat-icon>delete</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="revColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: revColumns;"></tr>
        </table>

        @if (reviews().length === 0) {
          <div class="empty"><mat-icon>rate_review</mat-icon><p>Nenhuma avaliação.</p></div>
        }
      }
    </div>
  `,
    styles: [`
    .full-width { width:100%; }
    .mb-32 { margin-bottom:32px; }
    h2 { font-size:1.2rem; color:#374151; margin-bottom:12px; }
    .loading { display:flex; justify-content:center; padding:40px; }
    .stars { color:#F59E0B; }
    .comment-cell { max-width:300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .empty { text-align:center; padding:60px 20px; color:#9CA3AF; }
    .empty mat-icon { font-size:48px; width:48px; height:48px; }
  `],
})
export class AdminModeration implements OnInit {
    private supabase = inject(SupabaseService);
    private notify = inject(NotificationService);
    private cdr = inject(ChangeDetectorRef);

    loadingReviews = true;
    reviews = signal<any[]>([]);
    revColumns = ['reviewer_name', 'rating', 'comment', 'created_at', 'actions'];

    ngOnInit() { setTimeout(() => this.load(), 0); }

    async load() {
        this.loadingReviews = true;
        try {
            const { data } = await this.supabase.client
                .from('reviews').select('*').order('created_at', { ascending: false }).limit(200);
            this.reviews.set(data ?? []);
        } catch { this.notify.error('Erro ao carregar avaliações.'); }
        finally { this.loadingReviews = false; this.cdr.detectChanges(); }
    }

    async deleteReview(r: any) {
        if (!window.confirm(`Excluir avaliação de "${r.reviewer_name}" (${r.rating}/5)?`)) return;
        await this.supabase.client.from('reviews').delete().eq('id', r.id);
        this.reviews.update(list => list.filter(x => x.id !== r.id));
        this.notify.success('Avaliação excluída.');
    }
}
