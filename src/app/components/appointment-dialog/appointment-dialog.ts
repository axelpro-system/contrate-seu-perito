import { Component, Inject, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AppointmentService } from '../../services/appointment.service';
import { AvailabilityService } from '../../services/availability.service';
import { NotificationService } from '../../services/notification.service';
import { SupabaseService } from '../../services/supabase.service';

export interface AppointmentDialogData {
    expertId: string;
    expertName: string;
    clientId: string;
}

interface TimeSlot {
    time: string;
    available: boolean;
}

@Component({
    selector: 'app-appointment-dialog',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        MatDialogModule, MatButtonModule, MatIconModule,
        MatFormFieldModule, MatInputModule, MatChipsModule,
        MatProgressSpinnerModule,
    ],
    template: `
    <h2 mat-dialog-title>Agendar Consulta</h2>

    <mat-dialog-content>
      @if (step === 1) {
        <div class="step">
          <h3>1. Escolha a data</h3>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Data</mat-label>
            <input matInput type="date" [min]="minDate" [(ngModel)]="selectedDate"
                   (ngModelChange)="onDateChange()" />
          </mat-form-field>

          @if (!hasAvailability) {
            <p class="hint error">Este perito ainda não definiu horários disponíveis.</p>
          }
        </div>
      }

      @if (step === 2 && hasAvailability) {
        <div class="step">
          <h3>2. Escolha o horário</h3>
          <p class="hint">Data selecionada: {{ selectedDate | date:'dd/MM/yyyy' }}</p>

          @if (loadingSlots) {
            <div class="loading"><mat-spinner diameter="24" /></div>
          } @else if (availableSlots.length === 0) {
            <p class="hint error">Nenhum horário disponível nesta data.</p>
          } @else {
            <div class="slots-grid">
              @for (slot of availableSlots; track slot.time) {
                <button mat-stroked-button
                        [class.selected]="selectedTime === slot.time"
                        [disabled]="!slot.available"
                        (click)="selectTime(slot.time)">
                  {{ slot.time }}
                </button>
              }
            </div>
          }
        </div>
      }

      @if (step === 3) {
        <div class="step">
          <h3>3. Observação (opcional)</h3>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Mensagem para o perito</mat-label>
            <textarea matInput rows="3" [(ngModel)]="notes" placeholder="Ex: Gostaria de tratar sobre..."></textarea>
          </mat-form-field>
        </div>
      }

      @if (step === 4) {
        <div class="step">
          <h3>4. Confirme o agendamento</h3>
          <div class="summary">
            <p><strong>Perito:</strong> {{ data.expertName }}</p>
            <p><strong>Data:</strong> {{ selectedDate | date:'dd/MM/yyyy' }}</p>
            <p><strong>Horário:</strong> {{ selectedTime }}</p>
            @if (notes) {
              <p><strong>Observação:</strong> {{ notes }}</p>
            }
          </div>
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      @if (step > 1 && !saving) {
        <button mat-button (click)="prevStep()">Voltar</button>
      }
      <button mat-button (click)="dialogRef.close()" [disabled]="saving">Cancelar</button>

      @if (step < 4) {
        <button mat-raised-button color="primary" (click)="nextStep()"
                [disabled]="!canProceed()">
          Próximo
        </button>
      }

      @if (step === 4) {
        <button mat-raised-button color="primary" (click)="confirm()" [disabled]="saving">
          @if (saving) {
            <mat-spinner diameter="20" />
          } @else {
            Confirmar Agendamento
          }
        </button>
      }
    </mat-dialog-actions>
    `,
    styles: [`
    .step { min-height: 200px; }
    .full-width { width: 100%; }
    .hint { font-size: 13px; color: #666; margin: 8px 0; }
    .hint.error { color: #f44336; }
    .loading { display: flex; justify-content: center; padding: 24px; }
    .slots-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .slots-grid button.selected { background: #1976d2; color: #fff; border-color: #1976d2; }
    .summary { background: #f5f5f5; border-radius: 8px; padding: 16px; margin-top: 12px; }
    .summary p { margin: 4px 0; }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentDialog implements OnInit {
    private appointmentSvc = inject(AppointmentService);
    private availSvc = inject(AvailabilityService);
    private supabase = inject(SupabaseService);
    private notify = inject(NotificationService);
    private cdr = inject(ChangeDetectorRef);
    dialogRef = inject(MatDialogRef<AppointmentDialog>);

    constructor(@Inject(MAT_DIALOG_DATA) protected data: AppointmentDialogData) {}

    step = 1;
    minDate = new Date().toISOString().split('T')[0];
    selectedDate = '';
    selectedTime = '';
    notes = '';
    saving = false;
    loadingSlots = false;
    hasAvailability = false;
    availableSlots: TimeSlot[] = [];

    async ngOnInit() {
        await this.availSvc.load(this.data.expertId);
        this.hasAvailability = this.availSvc.slots().length > 0;
        this.cdr.detectChanges();
    }

    onDateChange() {
        this.selectedTime = '';
        this.availableSlots = [];
        if (this.selectedDate) {
            this.loadSlots();
        }
    }

    private async loadSlots() {
        this.loadingSlots = true;
        this.cdr.detectChanges();

        const dayOfWeek = new Date(this.selectedDate).getDay();
        const slots = this.availSvc.slots().filter(s => s.day_of_week === dayOfWeek && s.active);

        const { data: existing } = await this.supabase.client
            .from('appointments')
            .select('start_time, end_time')
            .eq('expert_id', this.data.expertId)
            .eq('appointment_date', this.selectedDate)
            .not('status', 'in', '("cancelled","no_show")');

        const busyTimes = (existing ?? []).flatMap((a: any) => {
            const times: string[] = [];
            let t = a.start_time;
            while (t < a.end_time) {
                times.push(t.slice(0, 5));
                const [h, m] = t.split(':').map(Number);
                const next = new Date(2024, 0, 1, h, m + 30);
                t = `${String(next.getHours()).padStart(2, '0')}:${String(next.getMinutes()).padStart(2, '0')}:00`;
            }
            return times;
        });

        this.availableSlots = slots.flatMap(s => {
            const times: TimeSlot[] = [];
            let t = s.start_time;
            while (t < s.end_time) {
                const timeStr = t.slice(0, 5);
                times.push({
                    time: timeStr,
                    available: !busyTimes.includes(timeStr),
                });
                const [h, m] = t.split(':').map(Number);
                const next = new Date(2024, 0, 1, h, m + 30);
                t = `${String(next.getHours()).padStart(2, '0')}:${String(next.getMinutes()).padStart(2, '0')}:00`;
            }
            return times;
        });

        this.loadingSlots = false;
        this.cdr.detectChanges();
    }

    selectTime(time: string) {
        this.selectedTime = time;
    }

    canProceed(): boolean {
        if (this.step === 1) return !!this.selectedDate && this.hasAvailability;
        if (this.step === 2) return !!this.selectedTime;
        if (this.step === 3) return true;
        return false;
    }

    nextStep() {
        if (this.canProceed()) {
            this.step++;
            this.cdr.detectChanges();
        }
    }

    prevStep() {
        if (this.step > 1) {
            this.step--;
            this.cdr.detectChanges();
        }
    }

    async confirm() {
        this.saving = true;
        this.cdr.detectChanges();
        try {
            const endTime = this.calcEndTime(this.selectedTime);
            await this.appointmentSvc.create({
                expert_id: this.data.expertId,
                client_id: this.data.clientId,
                appointment_date: this.selectedDate,
                start_time: this.selectedTime + ':00',
                end_time: endTime,
                notes: this.notes || undefined,
            });
            this.notify.success('Consulta agendada com sucesso!');
            this.dialogRef.close(true);
        } catch (e: any) {
            this.notify.error(e?.message || 'Erro ao agendar consulta.');
        } finally {
            this.saving = false;
            this.cdr.detectChanges();
        }
    }

    private calcEndTime(start: string): string {
        const [h, m] = start.split(':').map(Number);
        const end = new Date(2024, 0, 1, h, m + 30);
        return `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}:00`;
    }
}
