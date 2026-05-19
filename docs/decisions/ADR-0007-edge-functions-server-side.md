# ADR-0007 — Edge Functions para operações server-side

- **Status:** Accepted
- **Data:** 2026-04-10 (retroativa — formalizando decisão observada no código)

## Contexto

Algumas operações **não cabem** em PostgREST + RLS:

- **Admin cria/deleta usuário em `auth.users`** — exige `service_role`, que **não pode** ir para o frontend.
- **Listar usuários** (`auth.admin.listUsers`) — mesma razão.
- **Enviar e-mail transacional** — requer chave do Resend.
- **Validar duplicidade de e-mail** antes do cadastro — útil rodar no servidor para incluir `auth.users` (que não é exposta diretamente).
- **Broadcast em massa** — laço fora do cliente.

## Opções consideradas

1. **Backend Node próprio** dedicado a essas operações.
2. **Supabase Edge Functions** (Deno) — gratuitas até certo volume.
3. **AWS Lambda** ou similar — desacoplado.

## Decisão

Adotar **Supabase Edge Functions** para todas as operações server-side. Manter PostgREST + RLS como caminho principal para CRUD comum.

Funções atuais ([api/edge-functions.md](../api/edge-functions.md)):

- `check-email-exists`
- `create-user`, `delete-user`, `list-users`
- `send-email`, `send-password-reset`, `send-broadcast`

## Consequências

### Positivas

- Stack consolidada em Supabase — sem novo provedor.
- Próxima ao banco — latência baixa para queries com `service_role`.
- Deno: TypeScript out of the box, sem build steps.
- Versionável em Git no monorepo.

### Negativas

- Cold start.
- Tempo limite por função.
- Logs e debugging menos sofisticados que Node tradicional.
- Vendor lock-in adicional.

### Mitigações

- Manter funções **simples** (uma responsabilidade cada).
- Logs estruturados (`[fn] op=... status=...`).
- Runbook dedicado para falhas ([RB-090](../runbooks/RB-090-edge-function-create-user.md)).

## Quando NÃO usar Edge Function

- Operação cobrível por RLS — prefira PostgREST direto.
- Lógica que cabe em trigger SQL com clareza.
- Workflows longos (>30s) — usar fila externa.

## Como saberemos que falhou

- Cold start impactar UX (admins reportam lentidão recorrente).
- Limites de execução do Edge Runtime virarem teto.
- Custo crescendo desproporcionalmente.

## Referências

- [api/edge-functions.md](../api/edge-functions.md)
- [devops/edge-functions-deploy.md](../devops/edge-functions-deploy.md)
- [supabase/functions/](../../supabase/functions/)
