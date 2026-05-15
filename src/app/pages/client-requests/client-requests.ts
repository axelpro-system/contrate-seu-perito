import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { SupabaseService } from '../../services/supabase.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-client-requests',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatChipsModule, MatIconModule, MatButtonModule, RouterLink],
  template: `
    <div class="requests-container">
      <div class="header">
        <h1>Meus Pedidos Enviados</h1>
        <button mat-stroked-button routerLink="/client-dashboard">
          <mat-icon>arrow_back</mat-icon> Voltar
        </button>
      </div>
      
      <div class="empty-state" *ngIf="requests.length === 0">
        <mat-icon>send</mat-icon>
        <p>Você ainda não enviou nenhum pedido.</p>
        <button mat-raised-button color="primary" routerLink="/search">Buscar Peritos</button>
      </div>

      <div class="requests-grid" *ngIf="requests.length > 0">
        <mat-card *ngFor="let req of requests" class="request-card">
          <mat-card-header>
            <div mat-card-avatar class="expert-avatar" 
                 [style.background-image]="'url(' + (req.expert?.avatar_url || 'assets/default-avatar.png') + ')'"></div>
            <mat-card-title>{{ req.expert?.full_name }}</mat-card-title>
            <mat-card-subtitle>{{ req.expert?.specialty }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p class="message">"{{ req.message }}"</p>
            <div class="status-row">
              <span>Status:</span>
              <mat-chip-set>
                <mat-chip [highlighted]="true" [ngClass]="'status-' + req.status">
                  {{ getStatusText(req.status) }}
                </mat-chip>
              </mat-chip-set>
            </div>
            <p class="date">Enviado em: {{ req.created_at | date:'dd/MM/yyyy HH:mm' }}</p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .requests-container { padding: 20px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 12px; }
    .header h1 { margin: 0; font-size: 1.5rem; }
    .requests-grid { display: grid; gap: 20px; }
    .request-card { padding: 16px; }
    .expert-avatar { background-size: cover; background-position: center; }
    .message { font-style: italic; color: #555; margin: 16px 0; background: #f5f5f5; padding: 12px; border-radius: 8px; }
    .status-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .date { font-size: 0.8rem; color: #999; }
    .empty-state { 
      text-align: center; 
      padding: 60px 20px; 
      background: white;
      border-radius: 8px;
    }
    .empty-state mat-icon { font-size: 64px; height: 64px; width: 64px; color: #ccc; margin-bottom: 16px; }
    .empty-state p { color: #888; font-size: 1.1rem; margin-bottom: 20px; }
    .status-pending { background: #fff3e0 !important; color: #f57c00 !important; }
    .status-accepted { background: #e8f5e9 !important; color: #388e3c !important; }
    .status-rejected { background: #ffebee !important; color: #d32f2f !important; }
    @media (max-width:768px) { .requests-container { padding: 16px; } .header { flex-direction:column; align-items:stretch; } .header button { width:100%; } }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientRequests implements OnInit {
  requests: any[] = [];

  constructor(
    private supabaseService: SupabaseService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    setTimeout(() => this.loadRequests(), 0);
  }

  async loadRequests() {
    try {
      const { data: { user } } = await this.supabaseService.getUser();
      if (user) {
        const { data } = await this.supabaseService.getLeadsForClient(user.id);
        this.requests = data || [];
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      this.cdr.detectChanges();
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'accepted': return 'ACEITO';
      case 'rejected': return 'RECUSADO';
      default: return 'PENDENTE';
    }
  }
}
