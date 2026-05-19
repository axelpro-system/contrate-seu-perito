# Gestão de Segredos

## Classificação

| Categoria        | Exemplos                                 | Onde MORA                                                    |
| ---------------- | ---------------------------------------- | ------------------------------------------------------------ |
| Público          | `anon` key, URL Supabase                 | `environment.ts` (vai no bundle)                             |
| Privado interno  | `service_role` key, DB password          | Secrets do CI; **nunca** no Git nem no bundle                |
| Integração       | Tokens Hotmart/Cademí                    | Edge Function secrets (Supabase) ou backend dedicado         |
| Operacional      | Senhas de admin, JWTs longos             | Vault / Bitwarden / 1Password (compartilhado entre owners)   |

## Regras

1. **Nada secreto no repositório.** `.env`, `.env.local`, dumps em `.gitignore`.
2. **`service_role` jamais no frontend.** Bypassa RLS — equivalente a sudo no banco.
3. **Rotação periódica:** anual mínima; imediata após desligamento de pessoa com acesso ou suspeita de vazamento.
4. **Princípio do menor privilégio.** Cada chave/integração tem o mínimo de permissão necessária.

## Onde estão armazenados (alvo)

- **GitHub Actions Secrets:**
  - `SUPABASE_ACCESS_TOKEN`
  - `DEV_DB_PASSWORD`, `STAGING_DB_PASSWORD`, `PROD_DB_PASSWORD`
  - `CF_API_TOKEN`, `CF_ACCOUNT_ID`
  - `PLAYWRIGHT_*`
- **Supabase Edge Function secrets** (configurados em Project → Functions → Secrets):
  - `SUPABASE_URL` (também consumido pelas funções)
  - `SUPABASE_SERVICE_ROLE_KEY` — bypass de RLS para operações admin (criar/listar/deletar usuário, broadcast).
  - `RESEND_API_KEY` — Resend para e-mail transacional.
  - (Futuro) Hotmart, Cademí, outros.
- **Cofre da equipe (1Password/Vault):** senhas de owners.

## Procedimento de rotação

```mermaid
graph LR
    A[Detectar necessidade] --> B[Gerar nova chave]
    B --> C[Atualizar destinos<br/>(secrets do CI + secrets de Edge)]
    C --> D[Deploy / redeploy se necessário]
    D --> E[Revogar chave antiga]
    E --> F[Registrar em audit_logs / changelog]
```

## Em caso de vazamento

1. **Revogar imediatamente** a chave/credencial comprometida (Supabase / provedor).
2. Gerar nova e atualizar nos destinos.
3. Auditar `audit_logs` e logs do provedor para uso indevido.
4. Se `service_role` vazou, considerar **rotação do projeto** e auditoria completa do schema (alguém pode ter alterado policies).
5. Post-mortem em [runbooks/](../runbooks/).

## Detectar vazamentos

- **Pre-commit hook** com `git-secrets` ou `gitleaks` (proposta — registrar ADR).
- **GitHub secret scanning** habilitado.
- Buscas periódicas pelo prefixo das chaves no histórico do Git.

## Chaves no bundle — o que é aceitável

- `supabaseUrl` ✅
- `supabaseKey` (anon) ✅ (proteção real vem do RLS)
- Project ref ✅
- Qualquer outra credencial ❌

## Local — `.env.example`

Comitar um template:

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
# NUNCA COMITAR O VALOR REAL DA service_role
SUPABASE_SERVICE_ROLE_KEY=
HOTMART_CLIENT_ID=
HOTMART_CLIENT_SECRET=
CADEMI_API_KEY=
```

`.env` real fica no `.gitignore`.
