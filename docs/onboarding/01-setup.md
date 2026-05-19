# 01 — Setup local

## Pré-requisitos

- **Node 20+** (recomendamos `nvm` / `volta`)
- **Git**
- **Docker** (para Supabase local — opcional inicialmente)
- Editor: VS Code (recomendado) com extensões Angular, ESLint, Prettier.

## Passos

```bash
# 1) Clone
git clone <repo-url>
cd Contrate-seu-perito

# 2) Dependências
npm ci

# 3) Configurar variáveis de ambiente do frontend
# Copie environment.ts.example (se existir) ou ajuste src/environments/environment.ts
# com URL/anon key do projeto Supabase de DEV (peça ao tech lead).

# 4) Subir o app
npm start
# → http://localhost:4200
```

## Supabase local (opcional, recomendado)

```bash
npm i -g supabase

# Inicia Postgres + Auth + Storage em Docker
supabase start

# Aplica schema (idempotente)
supabase db reset
psql "$DATABASE_URL" -f schema.sql

# Veja anon key e URL
supabase status
```

Ajustar `environment.development.ts` para apontar ao localhost (porta padrão 54321).

## Conta de teste

Use `e2e+expert@example.com`, `e2e+client@example.com`, `e2e+admin@example.com` (peça senhas no canal `#dev`).

Ou crie via `/register-expert` localmente e use o painel Supabase local para promover a `ACTIVE`/`ADMIN`.

## Verificação

- [ ] `npm start` sobe sem erro.
- [ ] Acessa `/` e vê a home.
- [ ] Consegue fazer login com conta de teste.
- [ ] DevTools → Network: requisições a Supabase com status 200.

## Problemas comuns

| Sintoma                                  | Solução                                                |
| ---------------------------------------- | ------------------------------------------------------ |
| `Module not found` ao iniciar            | `rm -rf node_modules && npm ci`                        |
| `Invalid API key` na home                | Conferir `supabaseUrl/supabaseKey` em `environment.ts` |
| `CORS` no console                        | Adicionar `http://localhost:4200` em Auth → URL Settings do projeto |
| Login não persiste                       | `localStorage` bloqueado? Modo privado?                |

## Próximo passo

→ [02-first-pr.md](02-first-pr.md)
