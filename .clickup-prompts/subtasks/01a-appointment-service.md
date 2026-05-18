# Subtask: AppointmentsService — CRUD de agendamentos

**Parent:** Agendamento de Consultas (UI)
**Task ClickUp:** `86e1ej56p`

## Prompt

Criar `src/app/services/appointment.service.ts` seguindo o padrão signal-based de `support-ticket.service.ts`.

### O que implementar:

1. **Tipos** (em `src/app/types/index.ts`):
   - `AppointmentStatus` enum: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
   - `APPOINTMENT_STATUS_LABELS` record com tradução pt-BR
   - `Appointment` interface com todos os campos da tabela

2. **AppointmentService**:
   - signals: `appointments`, `loading`
   - `loadForExpert(expertId, date?)` — SELECT + join expert + client names, opcional filter por data
   - `loadForClient(clientId)` — SELECT + join expert name
   - `create(data)` — INSERT com validações:
     - Não conflitar horário com outro appointment (mesmo expert, mesma data, horários sobrepostos)
     - Horário deve estar dentro da disponibilidade do perito
   - `cancel(id, userId, reason?)` — UPDATE status='cancelled', cancelled_by, cancellation_reason
   - `confirm(id)` — UPDATE status='confirmed'
   - `complete(id)` — UPDATE status='completed'
   - `noShow(id)` — UPDATE status='no_show'
   - `subscribeToUpdates(expertId?, clientId?)` — Realtime channel para inserts/updates

3. **Validações específicas:**
   - Horário só pode ser agendado com 24h+ de antecedência
   - Não criar appointment duplicado no mesmo horário
   - Verificar se expert existe e está ativo

### Dependências:
- `SupabaseService` — inject para acesso ao client
- `NotificationService` — inject para criar notificações ao criar/cancelar
- `AvailabilityService` — inject para verificar disponibilidade

### Testar:
- Criar appointment → aparece na lista do expert e do cliente
- Horário conflitante → erro "Horário indisponível"
- Cancelar → status muda, notificação enviada
- Realtime → novo appointment aparece sem refresh
