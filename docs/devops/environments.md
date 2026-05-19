# Ambientes

## Matriz

| Ambiente   | Propósito                           | Supabase Project           | URL                                |
| ---------- | ----------------------------------- | -------------------------- | ---------------------------------- |
| local      | Desenvolvimento na máquina do dev   | `supabase start` (Docker)  | http://localhost:4200              |
| dev        | Integração contínua de mudanças     | projeto Supabase `dev`     | https://dev.contrateseuperito.app  |
| staging    | Pré-prod com dados sintéticos       | projeto Supabase `staging` | https://staging.contrateseuperito.app |
| prod       | Usuários reais                      | projeto Supabase `prod`    | https://contrateseuperito.app      |

> Adapte URLs e nomes conforme realidade. O que importa é manter **separação dura** entre ambientes.

## Arquivos de configuração

Angular usa [src/environments/](../../src/environments/):

```ts
// environment.ts (default)
export const environment = {
  production: false,
  supabaseUrl: 'https://<dev-project>.supabase.co',
  supabaseKey: '<anon-key-dev>',
};
```

```ts
// environment.development.ts
export const environment = {
  production: false,
  supabaseUrl: 'http://localhost:54321',
  supabaseKey: '<anon-key-local>',
};
```

Para staging/prod, gere builds com replace de arquivo via `angular.json` (`fileReplacements`).

## Variáveis sensíveis

Apenas a **anon key** vai no bundle. **NUNCA** comitar:

- `service_role` key do Supabase
- Chaves Hotmart / Cademí
- Tokens de e-mail SMTP
- Senhas de admin

Esses ficam em:

- **Local:** `.env` na raiz (no `.gitignore`).
- **CI/CD:** secrets do provedor (GitHub Actions, GitLab CI, etc.).
- **Edge functions:** secrets do projeto Supabase.

## `.env` (local) — proposta

```
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...
HOTMART_CLIENT_ID=...
HOTMART_CLIENT_SECRET=...
CADEMI_API_KEY=...
```

### Secrets das Edge Functions (Supabase)

Configurados em **Project → Functions → Secrets** (não no frontend):

| Secret                       | Usado por                                                           |
| ---------------------------- | ------------------------------------------------------------------- |
| `SUPABASE_URL`               | Todas Edge Functions                                                |
| `SUPABASE_SERVICE_ROLE_KEY`  | `create-user`, `delete-user`, `list-users`, `send-broadcast`, etc.  |
| `RESEND_API_KEY`             | `send-email`, `send-broadcast`, `send-password-reset`, `create-user`|

Domínio remetente: `axelpro.com.br` — ver [resend-setup.md](resend-setup.md).

> Quem precisa: scripts de seed/test, **não** o frontend em runtime.

## Promoção entre ambientes

```
local → dev → staging → prod
```

- **Mudanças de código:** PR aprovada → merge na `main` → CI faz deploy em dev → após verificação, promover para staging → após smoke E2E, promover para prod.
- **Migrations:** mesma ordem (`supabase db push --linked` apontando para cada projeto).
- **Nunca pular ambientes.** Prod deve ter sido validado em staging com dados equivalentes.

## Convenções

- Logs de prod retêm 30 dias (ajustar no painel Supabase).
- Snapshots automáticos diários do banco em staging e prod.
- Acesso ao painel Supabase de prod limitado a `engineering-leads`.
