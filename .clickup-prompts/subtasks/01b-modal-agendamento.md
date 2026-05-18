# Subtask: Modal de Agendamento no Perfil do Expert

**Parent:** Agendamento de Consultas (UI)
**Task ClickUp:** `86e1ej57e`

## Prompt

Criar `src/app/components/appointment-dialog/appointment-dialog.ts` — modal MatDialog para agendar consulta.

### Gatilho
Adicionar botão "Agendar Consulta" no perfil público do expert (`/expert/:id`, em `expert-profile.ts`).
Visível apenas para CONTRATANTES logados. Posicionar ao lado de "Solicitar Cotação".

### Layout do Dialog (3 passos):

**Passo 1 — Escolher data:**
- `<input matInput type="date">` com `[min]="tomorrow"`
- Dias sem disponibilidade do perito devem ser destacados/avisados

**Passo 2 — Escolher horário:**
- Carregar `AvailabilityService.slots()` do perito
- Carregar appointments existentes para a data (`AppointmentService.loadForExpert(expertId, date)`)
- Calcular slots de 30min ou 1h baseado na disponibilidade
- Remover horários já ocupados
- Mostrar como lista de chips/botões selecionáveis

**Passo 3 — Observação + Confirmação:**
- Textarea opcional "Mensagem para o perito"
- Resumo: Perito (nome), Data, Horário, Observação
- Botão "Confirmar Agendamento"
- Loading state + disabled durante envio

### Integração com ExpertProfile:

```typescript
// No expert-profile.ts
import { MatDialog } from '@angular/material/dialog';
import { AppointmentDialog } from '../../components/appointment-dialog/appointment-dialog';

openAppointmentDialog() {
  const dialogRef = this.dialog.open(AppointmentDialog, {
    data: { expertId: this.expert.id, expertName: this.expert.full_name },
    width: '500px',
    disableClose: true,
  });
}
```

### Edge cases:
- Perito sem disponibilidade → mensagem "Este perito ainda não configurou horários"
- Todos horários ocupados no dia → "Nenhum horário disponível nesta data"
- Usuário não logado → redirecionar para `/login?returnUrl=/expert/:id`
- Erro ao criar → `notify.error()` com mensagem amigável
- Mobile → dialog ocupa largura total com scroll
