# Spec: Chat Contratante ↔ Perito

## Objective
Permitir que contratante e perito troquem mensagens em tempo real dentro da plataforma após uma cotação ser aceita.

## Tech Stack
- Supabase Realtime (já usado no `LeadNotificationService`)
- Tabela `messages` já existe no banco
- Componentes Angular standalone

## Database (já existente)
```sql
messages (id, quote_id, sender_id, content, read, created_at)
notifications (id, user_id, type, title, body, data, read, created_at)
```

## Flow
1. Após quote ser aceita (status = 'approved'), aparece botão "Chat" no card
2. Chat abre como página ou drawer com histórico de mensagens
3. Mensagens em tempo real via Supabase Realtime
4. Notificação in-app quando nova mensagem chega

## Commands
Build: ng build

## Project Structure
```
src/app/
  services/
    chat.service.ts       # Chat CRUD + Realtime subscription
  components/
    chat/
      chat.ts             # Chat component
      chat.html
      chat.scss
  pages/
    chat/
      chat-page.ts        # Full-page chat view
```

## Success Criteria
- [ ] Mensagem aparece em < 1s para o outro usuário
- [ ] Chat só disponível após quote aprovada
- [ ] Indicador de não lidas
- [ ] Scroll automático para última mensagem
- [ ] Botão Chat nos dashboards (expert e client)
