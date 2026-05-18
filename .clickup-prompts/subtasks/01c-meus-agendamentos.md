# Subtask: Página "Meus Agendamentos" (Contratante)

**Parent:** Agendamento de Consultas (UI)
**Task ClickUp:** `86e1ej588`

## Prompt

Adicionar seção "Agendamentos" no `/client-dashboard`.

### O que implementar:

1. No `ClientDashboard`:
   - Injetar `AppointmentService`
   - No `ngOnInit`, carregar appointments do cliente com `loadForClient(user.id)`
   - Criar método `cancelAppointment(appt)` com dialog de confirmação

2. Template:
   ```html
   <section class="appointments-section">
     <h2>Meus Agendamentos</h2>

     @if (loading) {
       <mat-spinner diameter="32" />
     } @else if (appointments.length === 0) {
       <div class="empty-state">
         <mat-icon>calendar_month</mat-icon>
         <p>Nenhum agendamento ainda.</p>
         <button mat-raised-button routerLink="/search">Buscar Peritos</button>
       </div>
     } @else {
       @for (appt of appointments; track appt.id) {
         <mat-card>
           <mat-card-header>
             <mat-card-title>
               {{ appt.appointment_date | date:'dd/MM/yyyy' }} às {{ appt.start_time }}
             </mat-card-title>
             <mat-card-subtitle>
               <span class="status-badge" [class]="appt.status">
                 {{ APPOINTMENT_STATUS_LABELS[appt.status] }}
               </span>
             </mat-card-subtitle>
           </mat-card-header>
           <mat-card-content>
             <p><strong>Perito:</strong> {{ appt.expert?.full_name }}</p>
             <p><strong>Duração:</strong> {{ appt.start_time }} - {{ appt.end_time }}</p>
             @if (appt.notes) {
               <p><strong>Observação:</strong> {{ appt.notes }}</p>
             }
           </mat-card-content>
           @if (appt.status === 'scheduled' || appt.status === 'confirmed') {
             <mat-card-actions>
               <button mat-button color="warn" (click)="cancelAppointment(appt)">
                 Cancelar
               </button>
             </mat-card-actions>
           }
         </mat-card-card>
       }
     }
   </section>
   ```

3. Status badge colors:
   - scheduled: blue (#1976d2)
   - confirmed: green (#4caf50)
   - completed: gray (#666)
   - cancelled: red (#f44336)
   - no_show: orange (#ff9800)

### Edge cases:
- 0 agendamentos → empty state
- Agendamento passado → não mostrar botão cancelar
- Cancelar → confirm dialog + notificação
- Erro ao carregar → mensagem de erro
