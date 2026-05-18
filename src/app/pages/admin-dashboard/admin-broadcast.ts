import { Component, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatCardModule, MatProgressSpinnerModule],
    template: `
    <div class="admin-page">
      <h1>Enviar Notificação</h1>
      <p class="subtitle">Envie uma notificação para todos os usuários da plataforma.</p>

      <mat-card class="form-card">
        <mat-card-content>
          <div class="form-grid">
            <mat-form-field appearance="outline" style="width:100%;">
              <mat-label>Título</mat-label>
              <input matInput [(ngModel)]="title" placeholder="Título da notificação" maxlength="100">
            </mat-form-field>
            <mat-form-field appearance="outline" style="width:100%;">
              <mat-label>Mensagem (opcional)</mat-label>
              <textarea matInput [(ngModel)]="body" rows="3" placeholder="Corpo da mensagem..." maxlength="500"></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline" style="width:100%;">
              <mat-label>Filtrar por tipo</mat-label>
              <mat-select [(ngModel)]="filterType">
                <mat-option value="">Todos os usuários</mat-option>
                <mat-option value="PERITO">Apenas Peritos</mat-option>
                <mat-option value="CONTRATANTE">Apenas Contratantes</mat-option>
                <mat-option value="ADMIN">Apenas Admins</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      @if (result) {
        <mat-card class="result-card">
          <mat-card-content>
            <mat-icon>check_circle</mat-icon>
            <p><strong>{{ result.sent }}</strong> de <strong>{{ result.total }}</strong> notificações enviadas.</p>
          </mat-card-content>
        </mat-card>
      }

      <div class="actions">
        <button mat-flat-button color="primary" (click)="send()" [disabled]="sending || !title.trim()">
          @if (sending) { <mat-spinner diameter="20" style="display:inline-block;margin-right:8px;"></mat-spinner> }
          <mat-icon>notifications_active</mat-icon> {{ sending ? 'Enviando...' : 'Enviar Notificação' }}
        </button>
      </div>
    </div>
  `,
    styles: [`
    .subtitle { color:#6B7280; margin-bottom:24px; }
    .form-card { max-width:600px; margin-bottom:20px; }
    .form-grid { display:flex; flex-direction:column; gap:12px; }
    .result-card { max-width:600px; margin-bottom:20px; background:#F0FDF4; }
    .result-card mat-card-content { display:flex; align-items:center; gap:12px; }
    .result-card mat-icon { color:#16A34A; }
    .actions { margin-top:16px; }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminBroadcast {
    private supabase = inject(SupabaseService);
    private notify = inject(NotificationService);
    private cdr = inject(ChangeDetectorRef);

    title = '';
    body = '';
    filterType = '';
    sending = false;
    result: { sent: number; total: number } | null = null;

    async send() {
        if (!this.title.trim() || this.sending) return;
        this.sending = true;
        this.result = null;
        this.cdr.detectChanges();

        try {
            const { data, error } = await this.supabase.client.functions.invoke('send-broadcast', {
                body: {
                    title: this.title.trim(),
                    body: this.body.trim() || undefined,
                    type: 'broadcast',
                    filterType: this.filterType || undefined,
                }
            });

            if (error) throw error;
            if (!data?.success) throw new Error(data?.error || 'Erro ao enviar');

            this.result = { sent: data.sent, total: data.total };
            this.notify.success(`Notificação enviada para ${data.sent} usuários.`);
            this.title = '';
            this.body = '';
        } catch (err: any) {
            console.error('Broadcast error:', err);
            this.notify.error(err?.message || 'Erro ao enviar notificação.');
        } finally {
            this.sending = false;
            this.cdr.detectChanges();
        }
    }
}
