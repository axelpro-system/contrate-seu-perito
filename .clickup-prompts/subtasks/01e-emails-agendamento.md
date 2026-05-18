# Subtask: Notificação por Email para Agendamentos

**Parent:** Agendamento de Consultas (UI)
**Task ClickUp:** `86e1ej5a4`

## Prompt

Disparar notificações e emails quando agendamentos são criados/cancelados.

### O que implementar:

1. **No AppointmentService.create():**
   ```typescript
   // Após INSERT bem-sucedido
   // Notificação in-app para o perito
   await this.notificationService.createNotification(
     expertId,
     'appointment_scheduled',
     'Novo Agendamento',
     `${clientName} agendou consulta para ${formatDate(aptDate)} às ${startTime}.`
   );

   // Notificação in-app para o cliente
   await this.notificationService.createNotification(
     clientId,
     'appointment_confirmed',
     'Agendamento Confirmado',
     `Sua consulta com ${expertName} foi agendada para ${formatDate(aptDate)} às ${startTime}.`
   );
   ```

2. **Email para o perito** usando `SupabaseService.sendNotificationEmail()`:
   - Assunto: "Novo agendamento - Contrate seu Perito"
   - Corpo: "Você recebeu um novo agendamento de {clientName} para {data} às {hora}."

3. **Email para o cliente**:
   - Assunto: "Agendamento confirmado - Contrate seu Perito"
   - Corpo: "Seu agendamento com {expertName} foi confirmado para {data} às {hora}."

4. **No AppointmentService.cancel():**
   ```typescript
   // Notificação para o outro participante
   await this.notificationService.createNotification(
     otherParticipantId,
     'appointment_cancelled',
     'Agendamento Cancelado',
     `${cancellerName} cancelou o agendamento de ${formatDate(aptDate)}.`
   );
   ```

5. **Template de email** em `email-templates.ts`:
   ```typescript
   static appointmentConfirmation(data: {
     recipientName: string;
     expertName?: string;
     clientName?: string;
     date: string;
     time: string;
     isExpert: boolean;
   }) { ... }

   static appointmentCancellation(data: {
     recipientName: string;
     date: string;
     time: string;
     cancellerName: string;
   }) { ... }
   ```

6. **Registrar no email_logs:**
   ```typescript
   await this.supabase.client.from('email_logs').insert({
     recipient_email: email,
     email_type: 'appointment_' + eventType,
     subject: subject,
     status: 'sent',
   });
   ```

### Edge cases:
- Perito sem email → logar aviso, não quebrar fluxo
- Erro ao enviar email → logar, não impedir criação do agendamento
- Múltiplos emails para o mesmo evento → deduplicar (checar se já enviou)
