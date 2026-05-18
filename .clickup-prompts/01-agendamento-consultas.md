# Feature: Agendamento de Consultas (UI)

**Task ClickUp:** Feature: Agendamento de Consultas (UI)

---

## Business Context

**Problema:** Clientes (contratantes) não conseguem agendar consultas com peritos diretamente pela plataforma. Precisam solicitar cotação e depois combinar horário por fora.

**Métrica:** Aumentar taxa de conversão de leads para contratos fechados, reduzir atrito no agendamento.

**Stack:** Angular 21 (standalone, OnPush), Angular Material, Supabase

---

## O Que Fazer

Criar fluxo completo de agendamento:
1. `AppointmentService` — CRUD + Realtime
2. Modal de agendamento no perfil do expert
3. Página "Meus Agendamentos" pro contratante
4. Gerenciamento no dashboard do perito
5. Notificações automáticas

---

## Tabela `appointments` (já existe no DB)

```sql
CREATE TABLE IF NOT EXISTS appointments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL,
  expert_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  cancelled_by uuid REFERENCES profiles(id),
  cancellation_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

RLS já configurada: expert vê próprios, client vê próprios, ambos podem criar e atualizar.

---

## Prompt 1: AppointmentService

**Arquivo:** `src/app/services/appointment.service.ts`

Criar service seguindo o padrão de `support-ticket.service.ts` e `availability.service.ts`:
- signals: `appointments`, `loading`
- `loadForExpert(expertId, date?)` — carrega appointments do perito, opcionalmente filtrados por data
- `loadForClient(clientId)` — carrega appointments do cliente
- `create(data: CreateAppointment)` — insere appointment. Validar:
  - Horário não conflita com appointment existente (mesmo expert, mesma data, horários sobrepostos)
  - Horário está dentro da disponibilidade do perito (consultar `AvailabilityService.slots()`)
- `cancel(id, reason?)` — atualiza status para `cancelled`, registra `cancelled_by` e `cancellation_reason`
- `confirm(id)` — atualiza status para `confirmed`
- `updateStatus(id, status)` — genérico
- `subscribeToUpdates(expertId?, clientId?)` — Realtime para receber inserts/updates

**Tipos** (adicionar em `src/app/types/index.ts`):
```typescript
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  completed: 'Realizado',
  cancelled: 'Cancelado',
  no_show: 'Não Compareceu',
};

export interface Appointment {
  id: string;
  quote_id: string | null;
  expert_id: string;
  client_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}
```

**Edge cases:**
- Horário já agendado por outro cliente → mostrar erro "Horário indisponível"
- Perito sem disponibilidade configurada → mostrar mensagem amigável
- Tentar criar no passado → bloquear
- Tentar cancelar em cima da hora (< 2h antes) → permitir mas avisar

---

## Prompt 2: Modal de Agendamento no Perfil do Expert

**Arquivos:**
- `src/app/components/appointment-dialog/appointment-dialog.ts`
- `src/app/components/appointment-dialog/appointment-dialog.html`
- `src/app/components/appointment-dialog/appointment-dialog.scss`

**Disparo:** Botão "Agendar Consulta" no perfil público do expert (`/expert/:id`), ao lado do botão "Solicitar Cotação". Visível apenas para CONTRATANTES logados.

**Fluxo do modal (MatDialog):**

**Passo 1 — Escolher data:**
- Mostrar calendário (usar `<input matInput type="date">` ou `<mat-calendar>`)
- Dias sem disponibilidade do perito ficam desabilitados
- Dias com todos os horários agendados também desabilitados

**Passo 2 — Escolher horário:**
- Carregar `AvailabilityService.slots()` do perito
- Calcular slots disponíveis para o dia selecionado (30min de duração cada, ou conforme configuração)
- Remover horários já agendados (consultar `AppointmentService.loadForExpert(expertId, date)`)
- Mostrar lista de botões de horário

**Passo 3 — Observação (opcional):**
- Textarea "Mensagem para o perito" (opcional)

**Passo 4 — Confirmação:**
- Resumo: Perito, Data, Horário, Observação
- Botão "Confirmar Agendamento"
- Loading state
- On success: fechar modal + `notify.success('Consulta agendada com sucesso!')`

**Integração com ExpertProfile:**
```typescript
// No expert-profile.ts
import { MatDialog } from '@angular/material/dialog';
import { AppointmentDialog } from '../../components/appointment-dialog/appointment-dialog';

// Template: adicionar botão
<button mat-raised-button color="accent" (click)="openAppointmentDialog()">
  <mat-icon>calendar_today</mat-icon> Agendar Consulta
</button>

// Método
openAppointmentDialog() {
  this.dialog.open(AppointmentDialog, {
    data: { expertId: this.expert.id, expertName: this.expert.full_name },
    width: '500px',
  });
}
```

**Edge cases:**
- Perito não configurou disponibilidade → mostrar "Este perito ainda não definiu horários disponíveis"
- Usuário não logado → redirecionar para login com returnUrl
- Todos horários ocupados no dia → "Nenhum horário disponível nesta data"

---

## Prompt 3: Página Meus Agendamentos (Contratante)

**Arquivo:** Atualizar `src/app/pages/client-dashboard/client-dashboard.ts`

**Adicionar aba "Agendamentos" no dashboard do contratante** (ou criar seção separada).

```html
<!-- Template -->
<section class="appointments-section">
  <h2>Meus Agendamentos</h2>

  @if (appointmentService.loading()) {
    <mat-spinner diameter="32" />
  } @else if (appointments().length === 0) {
    <div class="empty-state">
      <mat-icon>calendar_month</mat-icon>
      <p>Nenhum agendamento ainda.</p>
      <button mat-raised-button color="primary" routerLink="/search">
        Buscar Peritos
      </button>
    </div>
  } @else {
    @for (appt of appointments(); track appt.id) {
      <mat-card class="appointment-card">
        <mat-card-header>
          <mat-card-title>{{ appt.appointment_date | date:'dd/MM/yyyy' }} às {{ appt.start_time }}</mat-card-title>
          <mat-card-subtitle>
            <span class="status-badge" [class]="appt.status">
              {{ APPOINTMENT_STATUS_LABELS[appt.status] }}
            </span>
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p><strong>Perito:</strong> {{ appt.expert_name }}</p>
          <p><strong>Duração:</strong> {{ appt.start_time }} - {{ appt.end_time }}</p>
          @if (appt.notes) {
            <p><strong>Observação:</strong> {{ appt.notes }}</p>
          }
        </mat-card-content>
        @if (appt.status === 'scheduled' || appt.status === 'confirmed') {
          <mat-card-actions>
            <button mat-button color="warn" (click)="cancelAppointment(appt)">
              <mat-icon>cancel</mat-icon> Cancelar
            </button>
          </mat-card-actions>
        }
      </mat-card>
    }
  }
</section>
```

**Enriquecer appointments com nome do perito:**
```typescript
// Fazer join no loadForClient
async loadForClient(clientId: string) {
  const { data } = await this.supabase.client
    .from('appointments')
    .select('*, expert:expert_id(full_name, avatar_url, specialty)')
    .eq('client_id', clientId)
    .order('appointment_date', { ascending: false });
  this.appointments.set(data ?? []);
}
```

**Cancelar:**
```typescript
async cancelAppointment(appt: any) {
  const confirmed = await this.dialog.open(ConfirmDialog, {
    data: { title: 'Cancelar Agendamento', message: 'Tem certeza?' }
  }).afterClosed().toPromise();
  if (!confirmed) return;
  await this.appointmentService.cancel(appt.id, 'Cancelado pelo cliente');
  this.notify.success('Agendamento cancelado.');
}
```

---

## Prompt 4: Gerenciamento de Agendamentos (Perito Dashboard)

**Arquivo:** Atualizar `src/app/pages/expert-dashboard/expert-dashboard.ts`

Adicionar seção "Agenda" no dashboard do perito.

```html
<section class="agenda-section">
  <h2>Agenda</h2>
  <div class="date-selector">
    <button mat-icon-button (click)="previousWeek()"><mat-icon>chevron_left</mat-icon></button>
    <span>{{ weekStart | date:'dd/MM' }} - {{ weekEnd | date:'dd/MM/yyyy' }}</span>
    <button mat-icon-button (click)="nextWeek()"><mat-icon>chevron_right</mat-icon></button>
  </div>
  <div class="week-grid">
    @for (day of weekDays; track day.date) {
      <div class="day-column">
        <h3>{{ day.label }}<br><small>{{ day.date | date:'dd/MM' }}</small></h3>
        @for (slot of day.slots; track slot.id) {
          <div class="appointment-slot" [class]="slot.status">
            <span class="time">{{ slot.start_time }}</span>
            <span class="client">{{ slot.client_name }}</span>
            <div class="actions">
              @if (slot.status === 'scheduled') {
                <button mat-icon-button (click)="confirmAppointment(slot)" matTooltip="Confirmar">
                  <mat-icon>check_circle</mat-icon>
                </button>
              }
              <button mat-icon-button (click)="cancelAppointment(slot)" matTooltip="Cancelar">
                <mat-icon>cancel</mat-icon>
              </button>
            </div>
          </div>
        }
      </div>
    }
  </div>
</section>
```

**Edge cases:**
- Sem agendamentos na semana → "Nenhum agendamento esta semana"
- Agendamento passado não realizado → botão "Marcar como Não Compareceu"
- Conflito de horário ao confirmar → avisar

---

## Prompt 5: Notificações Automáticas

**Disparar após criar/cancelar appointment.**

No `AppointmentService.create()`:
```typescript
// Após inserir com sucesso
await this.notificationService.createNotification(
  expertId,
  'appointment_scheduled',
  'Novo Agendamento',
  `${clientName} agendou uma consulta para ${formatDate(appointmentDate)} às ${startTime}.`,
  { appointmentId: data.id, clientId }
);
```

No `AppointmentService.cancel()`:
```typescript
await this.notificationService.createNotification(
  participantId, // o outro participante
  'appointment_cancelled',
  'Agendamento Cancelado',
  `${cancellerName} cancelou a consulta de ${formatDate(appointmentDate)}.`,
  { appointmentId: id, reason }
);
```

**Email:** usar `SupabaseService.sendNotificationEmail()` com template similar aos existentes em `email-templates.ts`.

---

## Verification

1. Criar agendamento como contratante → aparece no dashboard do perito em tempo real
2. Perito confirma → contratante vê status atualizado
3. Cancelar → ambos notificados
4. Horário conflitante → erro amigável
5. Perito sem disponibilidade → mensagem clara
