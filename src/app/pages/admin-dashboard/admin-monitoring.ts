import { Component, OnInit, ChangeDetectorRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { SupabaseService } from '../../services/supabase.service';

@Component({
    standalone: true,
    imports: [CommonModule, MatTableModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, MatTabsModule],
    template: `
    <div class="admin-page">
      <h1>Monitoramento</h1>

      <mat-tab-group>
        <mat-tab label="Emails Enviados">
          @if (loadingEmails) { <div class="loading"><mat-spinner diameter="40"></mat-spinner></div> }
          @else {
            <table mat-table [dataSource]="emails()" class="full-width" style="margin-top:16px;">
              <ng-container matColumnDef="created_at">
                <th mat-header-cell *matHeaderCellDef>Data</th>
                <td mat-cell *matCellDef="let e">{{ e.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
              </ng-container>
              <ng-container matColumnDef="to">
                <th mat-header-cell *matHeaderCellDef>Destinatário</th>
                <td mat-cell *matCellDef="let e">{{ e.to }}</td>
              </ng-container>
              <ng-container matColumnDef="subject">
                <th mat-header-cell *matHeaderCellDef>Assunto</th>
                <td mat-cell *matCellDef="let e">{{ e.subject }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let e">
                  <span class="status-dot" [class.success]="e.success" [class.fail]="!e.success"></span>
                  {{ e.success ? 'Enviado' : 'Falha' }}
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="emailCols"></tr>
              <tr mat-row *matRowDef="let row; columns: emailCols;"></tr>
            </table>
            @if (emails().length === 0) {
              <div class="empty"><mat-icon>email</mat-icon><p>Nenhum email enviado.</p></div>
            }
          }
        </mat-tab>

        <mat-tab label="Edge Functions">
          <div style="margin-top:16px;">
            <mat-card class="info-card">
              <mat-card-content>
                <h3>Functions Deployadas</h3>
                <ul class="func-list">
                  <li><code>send-email</code> — Envio de emails transacionais via Resend</li>
                  <li><code>create-user</code> — Criação de usuário auth + perfil (admin)</li>
                  <li><code>delete-user</code> — Exclusão de usuário auth (admin)</li>
                  <li><code>send-broadcast</code> — Notificação em massa para usuários</li>
                </ul>
                <p class="dashboard-link">
                  <mat-icon>open_in_new</mat-icon>
                  <a href="https://supabase.com/dashboard/project/oedgzprzkcvtiybhcckm/functions" target="_blank">
                    Abrir dashboard Supabase
                  </a>
                </p>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
    styles: [`
    .full-width { width:100%; }
    .loading { display:flex; justify-content:center; padding:40px; }
    .empty { text-align:center; padding:60px 20px; color:#9CA3AF; }
    .empty mat-icon { font-size:48px; width:48px; height:48px; }
    .status-dot { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:6px; }
    .status-dot.success { background:#16A34A; }
    .status-dot.fail { background:#DC2626; }
    .info-card { max-width:600px; }
    .info-card h3 { margin:0 0 12px; }
    .func-list { list-style:none; padding:0; margin:0; }
    .func-list li { padding:8px 0; border-bottom:1px solid #f3f4f6; }
    .func-list code { background:#f4f5f8; padding:2px 6px; border-radius:4px; font-size:0.85rem; }
    .dashboard-link { display:flex; align-items:center; gap:8px; margin-top:16px; padding-top:12px; border-top:1px solid #e5e7eb; }
    .dashboard-link a { color:#1a237e; text-decoration:none; font-weight:500; }
  `],
})
export class AdminMonitoring implements OnInit {
    private supabase = inject(SupabaseService);
    private cdr = inject(ChangeDetectorRef);

    loadingEmails = true;
    emails = signal<any[]>([]);
    emailCols = ['created_at', 'to', 'subject', 'status'];

    ngOnInit() { setTimeout(() => this.load(), 0); }

    async load() {
        this.loadingEmails = true;
        try {
            const { data } = await this.supabase.client.from('email_logs').select('*').order('created_at', { ascending: false }).limit(100);
            this.emails.set(data ?? []);
        } catch { /* table might not exist */ }
        finally { this.loadingEmails = false; this.cdr.detectChanges(); }
    }
}
