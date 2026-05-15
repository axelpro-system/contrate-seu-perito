# Spec: Notificações por Email

## Objective

Enviar emails transacionais automáticos para engajar usuários sem que precisem estar logados na plataforma.

**Três disparos:**

| Evento | Quem recebe | Quando |
|--------|-------------|--------|
| Novo lead criado | Perito (`expert_id`) | Cliente envia solicitação de cotação |
| Proposta respondida | Cliente (`requester_id` / `requester_email`) | Perito responde com valor e prazo |
| Perito aprovado | Perito | Admin aprova cadastro pendente |

**Critérios de sucesso:**
- Perito recebe email em < 30s após lead ser criado
- Cliente recebe email em < 30s após proposta ser enviada
- Perito recebe email em < 30s após aprovação
- Email contém nome do remetente/destinatário e link para a ação
- Nenhuma query falha se o email não for enviado (fire-and-forget)

## Tech Stack

- Supabase Edge Functions (Deno + TypeScript)
- SMTP configurado no projeto Supabase (ou Resend API como fallback)
- Database triggers via SQL disparando `net.http_post()` para a Edge Function
- Função auxiliar `notify_email` para acionamento via trigger

## Commands

```bash
# Deploy edge function
supabase functions deploy send-email --project-ref oedgzprzkcvtiybhcckm

# Apply database triggers (via Management API ou migration)
# Build: ng build
```

## Project Structure

```
supabase/
  functions/
    send-email/
      index.ts          # Edge Function: recebe payload, envia email
      deno.json         # Deno config
  migrations/
    20260515120706_*.sql (já existe)
    20260515124250_*.sql (já existe)
    YYYYMMDDHHMMSS_email_notifications.sql  # Triggers e função auxiliar
```

## Code Style

Edge Function em Deno:

```typescript
// Edge Function: send-email/index.ts
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

serve(async (req) => {
  const { to, subject, html, from_name } = await req.json()
  
  // Usar SMTP configurado no projeto ou Resend
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${from_name || 'Contrate seu Perito'} <naoresponder@contrateseuperito.com.br>`,
      to,
      subject,
      html,
    })
  })
  
  return new Response(JSON.stringify(await res.json()), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

Trigger SQL:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url := current_setting('app.settings.edge_function_url') || '/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.edge_function_key')
    ),
    body := jsonb_build_object(
      'to', (SELECT contact_email FROM profiles WHERE id = NEW.expert_id),
      'subject', 'Nova solicitação de cotação',
      'html', format(
        '<p>Você recebeu uma nova solicitação de <strong>%s</strong>.</p><a href="%s/expert/quotes">Ver leads</a>',
        NEW.requester_name, current_setting('app.settings.app_url')
      ),
      'from_name', 'Contrate seu Perito'
    )
  );
  RETURN NEW;
END;
$$;
```

## Testing Strategy

- Testar triggers localmente com `supabase db dump`
- Verificar logs da Edge Function no Supabase Dashboard
- Testar fluxo completo: criar lead → verificar email (via Resend logs ou Supabase Inbucket local)

## Boundaries

### Always
- Verificar se o email do destinatário existe antes de enviar
- Usar `PERFORM` no trigger (não bloqueia a transação original)
- Tratar erros na Edge Function sem lançar exceção

### Ask first
- Adicionar novos templates de email
- Mudar de Resend para outro provedor SMTP

### Never
- Vazar chave de API da Resend/SMTP no código
- Bloquear a transação principal se o email falhar
- Enviar email sem consentimento do usuário

## Success Criteria

- [ ] Edge Function `send-email` implantada e respondendo 200
- [ ] Trigger `handle_new_lead` criado no banco
- [ ] Trigger `handle_quote_response` criado no banco
- [ ] Trigger `handle_expert_approved` criado no banco
- [ ] `net` extension habilitada no banco
- [ ] Variáveis de ambiente configuradas (RESEND_API_KEY, APP_URL)
- [ ] Email chega para o destinatário em < 30s

## Open Questions

1. Qual provedor de email usar? Resend (free: 100 emails/dia) ou configurar SMTP do projeto?
2. Qual domínio de email usar para o remetente? `naoresponder@contrateseuperito.com.br`?
3. Precisa de logs de email enviado no banco (tabela `email_logs`)?
