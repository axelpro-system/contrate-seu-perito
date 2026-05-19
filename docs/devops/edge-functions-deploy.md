# Deploy de Edge Functions

Catálogo das funções e referência da API em [api/edge-functions.md](../api/edge-functions.md). Esta página foca em **como deployar e operar**.

## Pré-requisitos

```bash
npm i -g supabase
supabase login --token <SUPABASE_ACCESS_TOKEN>
supabase link --project-ref <project-ref>
```

## Secrets necessários

Configurar em **Project Settings → Functions → Secrets** (não comitar em código):

| Secret                       | Valor                                                       |
| ---------------------------- | ----------------------------------------------------------- |
| `SUPABASE_URL`               | URL do projeto Supabase                                     |
| `SUPABASE_SERVICE_ROLE_KEY`  | Service role key (Settings → API)                           |
| `RESEND_API_KEY`             | API key do Resend (Dashboard Resend → API Keys)             |

> **Crítico:** sem `SUPABASE_SERVICE_ROLE_KEY` as funções admin (`create-user`, `delete-user`, `list-users`) falham com 500. Sem `RESEND_API_KEY`, e-mails não saem.

## Comandos

```bash
# Deploy individual
supabase functions deploy create-user --project-ref <project-ref>

# Deploy de todas
for fn in check-email-exists create-user delete-user list-users send-broadcast send-email send-password-reset; do
  supabase functions deploy $fn --project-ref <project-ref>
done

# Logs
supabase functions logs create-user --project-ref <project-ref>

# Servir local (debug)
supabase functions serve create-user --env-file .env.local
```

## Pipeline (proposta)

Adicionar ao workflow de release em [ci-cd.md](ci-cd.md):

```yaml
- name: Deploy Edge Functions
  run: |
    for fn in check-email-exists create-user delete-user list-users send-broadcast send-email send-password-reset; do
      supabase functions deploy $fn --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
    done
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

## Versionamento

- Não há tagging nativo. Trate **a função no Git** como versão.
- Em mudanças quebra-contrato, criar `<fn>-v2` e migrar callers gradualmente.

## Boas práticas

- **Idempotência:** chamadas que criam recursos devem aceitar repetição segura.
- **Validação de JWT do chamador** antes de operações admin (ver [api/edge-functions.md](../api/edge-functions.md#segurança)).
- **Logs estruturados:**
  ```ts
  console.log(`[${fn}] op=${op} status=ok userId=${id}`);
  ```
- **CORS** para todas as funções (preflight OPTIONS + headers).
- **Timeouts** explícitos em chamadas externas (Resend).

## Troubleshooting

- Função retorna 500 → ver logs em painel ou via `supabase functions logs`.
- Função retorna 404 → não foi deployada para o projeto, ou nome errado.
- `RESEND_API_KEY not configured` → conferir em Functions → Secrets.
- E-mail volta com "from email not verified" → ver [resend-setup.md](resend-setup.md).

Ver runbook específico em [runbooks/RB-090-edge-function-create-user.md](../runbooks/RB-090-edge-function-create-user.md).
