# Subtask: Gerenciamento de Agendamentos (Perito Dashboard)

**Parent:** Agendamento de Consultas (UI)
**Task ClickUp:** `86e1ej594`

## Prompt

Adicionar seção "Agenda" no `/expert-dashboard` com calendário semanal.

### O que implementar:

1. **Navegação semanal:**
   - Botões < > para navegar entre semanas
   - Mostrar "Semana de DD/MM a DD/MM/YYYY"
   - Colunas: Seg a Sáb (domingo opcional)

2. **Grid semanal:**
   ```html
   <div class="week-grid">
     @for (day of weekDays; track day.date) {
       <div class="day-column">
         <h3>{{ day.label }}<br><small>{{ day.date | date:'dd/MM' }}</small></h3>

         @for (appt of day.appointments; track appt.id) {
           <div class="appointment-slot" [class]="appt.status">
             <span class="time">{{ appt.start_time }}</span>
             <span class="client">{{ appt.client_name }}</span>
             <div class="actions">
               @if (appt.status === 'scheduled') {
                 <button mat-icon-button (click)="confirmAppointment(appt)" matTooltip="Confirmar">
                   <mat-icon>check_circle</mat-icon>
                 </button>
               }
               @if (appt.status === 'confirmed' || appt.status === 'scheduled') {
                 <button mat-icon-button (click)="cancelAppointment(appt)" matTooltip="Cancelar">
                   <mat-icon>cancel</mat-icon>
                 </button>
               }
               @if (appt.status === 'confirmed' && isPast(appt)) {
                 <button mat-icon-button (click)="completeAppointment(appt)" matTooltip="Concluir">
                   <mat-icon>task_alt</mat-icon>
                 </button>
                 <button mat-icon-button (click)="noShowAppointment(appt)" matTooltip="Não Compareceu">
                   <mat-icon>person_off</mat-icon>
                 </button>
               }
             </div>
           </div>
         } @empty {
           <div class="no-appointments">Nenhum</div>
         }
       </div>
     }
   </div>
   ```

3. **Ações:**
   - Confirmar: `appointmentService.confirm(appt.id)`
   - Cancelar: dialog + `appointmentService.cancel(appt.id, userId, reason)`
   - Concluir: `appointmentService.complete(appt.id)`
   - Não Compareceu: `appointmentService.noShow(appt.id)`

4. **Load semanal:**
   ```typescript
   loadWeek(startDate: Date) {
     const endDate = new Date(startDate);
     endDate.setDate(endDate.getDate() + 6);
     this.appointmentService.loadForExpert(this.expertId, {
       dateFrom: startDate.toISOString().split('T')[0],
       dateTo: endDate.toISOString().split('T')[0],
     });
   }
   ```

5. **Realtime:**
   - Assinar `subscribeToUpdates(expertId)` para ver novos agendamentos instantaneamente

### Estilos:
- Grid de 7 colunas com scroll lateral se necessário
- Appointment-slot com cor de borda conforme status
- Ações aparecem no hover
- "Nenhum" centralizado quando sem agendamentos

### Edge cases:
- Sem agendamentos na semana → "Nenhum agendamento"
- Agendamento passado não realizado → mostrar opções concluir/não compareceu
- Conflito ao confirmar → avisar
