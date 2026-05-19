# Edge Functions

Funções Deno executadas no Supabase Edge Runtime. Usadas para operações que **não cabem em PostgREST puro**:

- Precisam de `service_role` (bypass de RLS para admin).
- Integram com terceiros (Resend para e-mail).
- Combinam múltiplos passos atômicos.

Código em [supabase/functions/](../../supabase/functions/).

## Catálogo

| Função                  | Propósito                                            | Autenticação                          |
| ----------------------- | ---------------------------------------------------- | ------------------------------------- |
| `check-email-exists`    | Verifica se um e-mail já existe em `profiles`        | Pública (JWT do usuário)              |
| `create-user`           | Admin cria usuário (Auth + profile + e-mail)         | JWT de admin                          |
| `delete-user`           | Admin remove usuário (cascata via `auth.users`)      | JWT de admin                          |
| `list-users`            | Lista usuários para painel admin                     | JWT de admin                          |
| `send-broadcast`        | Disparo em massa de e-mails para segmento            | JWT de admin                          |
| `send-email`            | Wrapper genérico de envio via Resend                 | JWT do solicitante                    |
| `send-password-reset`   | Reset de senha com template customizado              | Pública (JWT anônimo)                 |

## Padrões comuns

```ts
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Client-Info, apikey',
};
```

- **CORS preflight** obrigatório (browser envia OPTIONS).
- **Segredos** vêm de variáveis de ambiente (`Deno.env`).
- **Service-role** apenas dentro da função, nunca exposto.

## Detalhamento

### `check-email-exists`

**Quando:** antes do admin criar um usuário (fluxo em [admin-create-user.md](../flows/admin-create-user.md)).

**Request:**
```json
{ "email": "user@example.com" }
```

**Response:**
```json
{ "exists": true, "userId": "uuid-or-null" }
```

> No frontend, atalho em [supabase.service.ts](../../src/app/services/supabase.service.ts) — `checkEmailExists()` consulta `profiles` por e-mail.

### `create-user`

**Quando:** painel admin → criar usuário.

**Request:**
```json
{
  "email": "novo@example.com",
  "password": "senha-temporaria",
  "firstName": "Maria",
  "lastName": "Silva",
  "profileType": "CONTRATANTE | PERITO | ADMIN",
  "accountStatus": "ACTIVE | PENDING",
  "profileVisible": false,
  "sendWelcomeEmail": true
}
```

**Comportamento:**
1. Valida payload e papel do solicitante.
2. `auth.admin.createUser` (cria com e-mail confirmado).
3. UPDATE em `profiles` para preencher dados estendidos (o trigger `handle_new_user` já criou a linha base).
4. (Opcional) chama `send-email` para enviar boas-vindas com senha.

**Response:**
```json
{ "success": true, "userId": "uuid" }
```

Erros comuns: ver [runbooks/RB-090-edge-function-create-user.md](../runbooks/RB-090-edge-function-create-user.md).

### `delete-user`

**Quando:** painel admin → remover usuário; ou no fluxo "deletar antes de recriar" quando e-mail conflita.

**Request:**
```json
{ "userId": "uuid" }
```

**Comportamento:** `auth.admin.deleteUser` — cascata via FK remove `profiles` e dependências (RN-015).

**Response:**
```json
{ "success": true }
```

### `list-users`

**Quando:** painel admin → listagem com paginação.

**Request:** `{ page?: number, perPage?: number, query?: string }`

**Response:** `{ users: [...], total: number }`

> Necessário porque PostgREST sobre `auth.users` é restrito; `auth.admin.listUsers` exige `service_role`.

### `send-broadcast`

**Quando:** painel admin → comunicação em massa para segmento.

**Request:**
```json
{
  "subject": "Novidades",
  "html": "<p>...</p>",
  "filters": { "profile_type": "PERITO", "account_status": "ACTIVE" }
}
```

**Comportamento:**
1. Consulta `profiles` com filtros.
2. Para cada destinatário, chama Resend (ou enfileira).
3. Loga em `audit_logs` (`action='broadcast.send'`).

> Cuidado: rate limit do Resend; volumes grandes exigem enfileiramento.

### `send-email`

**Quando:** envios pontuais (notificações transacionais, confirmações).

**Request:**
```json
{
  "to": "user@example.com",
  "subject": "Assunto",
  "html": "<p>Corpo</p>",
  "from_name": "Contrate um Perito"
}
```

**Comportamento:** valida payload, chama Resend API com `Authorization: Bearer ${RESEND_API_KEY}`.

Remetente padrão: `noreply@axelpro.com.br` (domínio verificado — ver [devops/resend-setup.md](../devops/resend-setup.md)).

### `send-password-reset`

**Quando:** usuário clica "Esqueci minha senha" na tela de login.

**Request:**
```json
{ "email": "user@example.com", "redirectUrl": "https://app/reset-password" }
```

**Comportamento:**
1. `auth.admin.generateLink({ type: 'recovery', email })` para obter link com token.
2. Monta HTML customizado (branding) e dispara via Resend.

**Por que função custom em vez do `resetPasswordForEmail` nativo:**
- Template personalizado de e-mail.
- Remetente do nosso domínio (`@axelpro.com.br`).
- Métricas próprias de entrega via Resend.

Veja [ADR-0008](../decisions/ADR-0008-resend-emails.md).

## Variáveis de ambiente requeridas

Configurar em **Project Settings → Functions → Secrets**:

| Secret                       | Usado por                                                 |
| ---------------------------- | --------------------------------------------------------- |
| `SUPABASE_URL`               | Todas                                                     |
| `SUPABASE_SERVICE_ROLE_KEY`  | Todas (admin actions)                                     |
| `RESEND_API_KEY`             | `send-email`, `send-broadcast`, `send-password-reset`, `create-user` |

## Deploy

```bash
# autenticar uma vez
supabase login --token <SUPABASE_ACCESS_TOKEN>

# linkar projeto (uma vez)
supabase link --project-ref <project-ref>

# deploy individual
supabase functions deploy <nome> --project-ref <project-ref>

# deploy de todas
supabase functions deploy --project-ref <project-ref>
```

CI pode chamar `supabase functions deploy` no pipeline ([devops/ci-cd.md](../devops/ci-cd.md)).

## Logs

Painel → Functions → Logs → filtre por nome da função.

Recomendado em código:

```ts
console.log(`[${functionName}] op: ${action}, status: ok`);
console.error(`[${functionName}] op: ${action}, status: error`, { err });
```

Nunca logar segredos, senhas, tokens, ou HTML completo de e-mails.

## Segurança

- **Validar JWT do chamador** sempre que a ação for restrita (admin):
  ```ts
  const authHeader = req.headers.get('Authorization');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader || '' } },
  });
  const { data: { user } } = await supabase.auth.getUser();
  // verificar profile_type == 'ADMIN' antes de prosseguir
  ```
- **Service-role** apenas após validar o chamador.
- **Não confie em payload** para autorização — `profile_type` vem do banco, não do request.

## Testabilidade

- Local: `supabase functions serve <nome>` simula o runtime.
- Mocking via `globalThis.fetch` para chamadas externas (Resend).
