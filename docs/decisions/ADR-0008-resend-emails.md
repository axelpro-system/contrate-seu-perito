# ADR-0008 — Resend para e-mails transacionais

- **Status:** Accepted
- **Data:** 2026-04-15 (retroativa)

## Contexto

O e-mail nativo do Supabase Auth funciona para confirmação/reset, mas:

- **Templates limitados** e difíceis de versionar.
- **Remetente padrão** com domínio Supabase reduz confiança e deliverability.
- **Mensagens transacionais de produto** (boas-vindas pelo admin, notificação de lead, broadcast) precisam de remetente próprio.
- **Métricas de entrega** (opened, bounced) só ficam disponíveis com provedor dedicado.

## Opções consideradas

1. **Manter Supabase Auth nativo** para tudo.
2. **Resend** (preço razoável, API simples, ótima DX).
3. **AWS SES** (mais barato em escala, configuração mais pesada).
4. **SendGrid** (maduro, mas DX inferior).

## Decisão

Adotar **Resend** como provedor de e-mail transacional. Usar domínio próprio `axelpro.com.br` como remetente (`noreply@axelpro.com.br`).

Toda chamada ao Resend passa por Edge Function ([ADR-0007](ADR-0007-edge-functions-server-side.md)) — chave API nunca no cliente.

E-mails substituídos pelo Resend:

- Recuperação de senha (via `send-password-reset`, em vez de `resetPasswordForEmail` nativo).
- Boas-vindas no `create-user` (admin).
- Broadcast (`send-broadcast`).
- Genérico (`send-email`).

E-mails que permanecem no Supabase Auth: confirmação inicial pós-signUp (mais simples manter).

## Consequências

### Positivas

- Branding consistente: remetente em `@axelpro.com.br`.
- Templates HTML versionados no código da Edge Function.
- Métricas e logs de envio no painel Resend.
- DKIM, SPF, DMARC configurados ([resend-setup.md](../devops/resend-setup.md)).

### Negativas

- Custo extra ($20/mês a partir de ~3k e-mails).
- Verificação de domínio com DNS propaga em até 48h.
- Mais um terceiro com dados (e-mails dos usuários) — declarar em LGPD.

### Mitigações

- DPA Resend assinado.
- `RESEND_API_KEY` nas Edge Function secrets (rotação periódica).
- Quotas monitoradas no painel.

## Como saberemos que falhou

- Bounce rate > 5% sustained.
- Custos não justificáveis pelo volume.
- Outages frequentes do Resend.

## Referências

- [api/edge-functions.md](../api/edge-functions.md#send-email)
- [devops/resend-setup.md](../devops/resend-setup.md)
- [security/lgpd.md](../security/lgpd.md)
- [supabase/functions/send-email/index.ts](../../supabase/functions/send-email/index.ts)
