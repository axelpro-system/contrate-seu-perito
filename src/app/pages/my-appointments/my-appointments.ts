import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { AppointmentService } from '../../services/appointment.service';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';
import { Appointment, APPOINTMENT_STATUS_LABELS } from '../../types';

@Component({
    selector: 'app-my-appointments',
    standalone: true,
    imports: [
        CommonModule, RouterLink, MatButtonModule, MatIconModule,
        MatCardModule, MatChipsModule, MatProgressSpinnerModule, MatTabsModule,
    ],
    template: `
    <div class="pp-page">
      <div class="pp-header">
        <h1>Meus Agendamentos</h1>
      </div>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="32" /></div>
      } @else if (appointments().length === 0) {
        <div class="empty">
          <mat-icon>calendar_today</mat-icon>
          <p>Nenhum agendamento encontrado.</p>
          <a mat-raised-button color="primary" routerLink="/search">Buscar Peritos</a>
        </div>
      } @else {
        <nav mat-tab-nav-bar [tabPanel]="tabPanel">
          @for (tab of tabs; track tab.key) {
            <a mat-tab-link [active]="activeTab === tab.key" (click)="activeTab = tab.key">
              {{ tab.label }} ({{ tab.count }})
            </a>
          }
        </nav>
        <mat-tab-nav-panel #tabPanel>
          <div class="appointments-list">
            @for (appt of filteredAppointments(); track appt.id) {
              <mat-card class="appt-card" [class.cancelled]="appt.status === 'cancelled'">
                <mat-card-content>
                  <div class="appt-header">
                    <div class="appt-expert">
                      <div class="appt-avatar">
                        @if (appt.expert?.avatar_url) {
                          <img [src]="appt.expert?.avatar_url" alt="" />
                        } @else {
                          <mat-icon>person</mat-icon>
                        }
                      </div>
                      <div class="appt-expert-info">
                        <strong>{{ appt.expert?.full_name || 'Perito' }}</strong>
                        <span class="appt-specialty">{{ appt.expert?.specialty || '' }}</span>
                      </div>
                    </div>
                    <mat-chip [color]="chipColor(appt.status)" highlighted>
                      {{ statusLabel(appt.status) }}
                    </mat-chip>
                  </div>

                  <div class="appt-details">
                    <div class="appt-detail">
                      <mat-icon>calendar_today</mat-icon>
                      <span>{{ appt.appointment_date | date:"dd 'de' MMMM 'de' yyyy" }}</span>
                    </div>
                    <div class="appt-detail">
                      <mat-icon>schedule</mat-icon>
                      <span>{{ appt.start_time.slice(0,5) }} às {{ appt.end_time.slice(0,5) }}</span>
                    </div>
                    @if (appt.notes) {
                      <div class="appt-detail">
                        <mat-icon>notes</mat-icon>
                        <span>{{ appt.notes }}</span>
                      </div>
                    }
                    @if (appt.status === 'confirmed' || appt.status === 'pending') {
                      <button mat-stroked-button color="warn" class="cancel-btn"
                              (click)="confirmCancel(appt)">
                        Cancelar Agendamento
                      </button>
                    }
                  </div>
                </mat-card-content>
              </mat-card>
            } @empty {
              <div class="empty">
                <mat-icon>event_busy</mat-icon>
                <p>Nenhum agendamento com este status.</p>
              </div>
            }
          </div>
        </mat-tab-nav-panel>
      }
    </div>
    `,
    styles: [`
    .pp-page { max-width: 800px; margin: 0 auto; padding: 24px 16px; }
    .pp-header { margin-bottom: 24px; }
    .pp-header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .loading { display: flex; justify-content: center; padding: 64px; }
    .empty { text-align: center; padding: 64px 16px; color: #666; }
    .empty mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; }
    .appointments-list { display: flex; flex-direction: column; gap: 16px; margin-top: 8px; }
    .appt-card { border-radius: 12px; }
    .appt-card.cancelled { opacity: 0.6; }
    .appt-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .appt-expert { display: flex; align-items: center; gap: 12px; }
    .appt-avatar { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; background: #e0e0e0; display: flex; align-items: center; justify-content: center; }
    .appt-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .appt-expert-info { display: flex; flex-direction: column; }
    .appt-specialty { font-size: 12px; color: #666; }
    .appt-details { display: flex; flex-direction: column; gap: 8px; }
    .appt-detail { display: flex; align-items: center; gap: 8px; font-size: 14px; }
    .appt-detail mat-icon { font-size: 18px; width: 18px; height: 18px; color: #555; }
    .cancel-btn { margin-top: 8px; align-self: flex-start; }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyAppointments implements OnInit {
    private apptSvc = inject(AppointmentService);
    private supabase = inject(SupabaseService);
    private notify = inject(NotificationService);
    private cdr = inject(ChangeDetectorRef);

    appointments = this.apptSvc.appointments;
    loading = this.apptSvc.loading;
    activeTab: 'upcoming' | 'past' | 'cancelled' = 'upcoming';

    tabs = [
        { key: 'upcoming' as const, label: 'Próximos', get count() { return 0; } },
        { key: 'past' as const, label: 'Realizados', get count() { return 0; } },
        { key: 'cancelled' as const, label: 'Cancelados', get count() { return 0; } },
    ];

    get tabCounts() {
        const list = this.appointments();
        return {
            upcoming: list.filter(a => a.status === 'pending' || a.status === 'confirmed').length,
            past: list.filter(a => a.status === 'completed' || a.status === 'no_show').length,
            cancelled: list.filter(a => a.status === 'cancelled').length,
        };
    }

    filteredAppointments = () => {
        const list = this.appointments();
        return list.filter(a => {
            if (this.activeTab === 'upcoming') return a.status === 'pending' || a.status === 'confirmed';
            if (this.activeTab === 'past') return a.status === 'completed' || a.status === 'no_show';
            return a.status === 'cancelled';
        });
    };

    async ngOnInit() {
        const { data: { user } } = await this.supabase.getUser();
        if (user) {
            this.apptSvc.loadForClient(user.id);
            this.apptSvc.subscribeToUpdates(undefined, user.id);
        }
    }

    statusLabel(status: string): string {
        return (APPOINTMENT_STATUS_LABELS as any)[status] || status;
    }

    chipColor(status: string): string {
        switch (status) {
            case 'pending': return 'warn';
            case 'confirmed': return 'primary';
            case 'completed': return '';
            case 'cancelled': return '';
            case 'no_show': return '';
            default: return '';
        }
    }

    async confirmCancel(appt: Appointment) {
        if (!confirm(`Deseja cancelar o agendamento do dia ${new Date(appt.appointment_date).toLocaleDateString()} às ${appt.start_time.slice(0, 5)}?`)) return;
        try {
            const { data: { user } } = await this.supabase.getUser();
            if (!user) return;
            await this.apptSvc.cancel(appt.id, user.id);
            this.notify.success('Agendamento cancelado.');
            this.cdr.detectChanges();
        } catch (e: any) {
            this.notify.error(e?.message || 'Erro ao cancelar.');
        }
    }
}
