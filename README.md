# Contrate seu Perito

Plataforma web que conecta **contratantes** (clientes que precisam de perícia técnica) a **peritos** (profissionais especializados). Permite busca de peritos por especialidade, solicitação de orçamentos, agendamento, troca de mensagens, avaliações e administração da plataforma.

- **Frontend:** Angular 21 (standalone components, lazy routes, Angular Material)
- **Backend / Banco / Auth:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **Testes:** Vitest
- **Build:** Angular CLI / `@angular/build`

---

## Sumário

- [Stack e arquitetura](#stack-e-arquitetura)
- [Requisitos](#requisitos)
- [Configuração](#configuração)
- [Desenvolvimento](#desenvolvimento)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Papéis de usuário](#papéis-de-usuário)
- [Principais fluxos](#principais-fluxos)
- [Banco de dados](#banco-de-dados)
- [Rotas](#rotas)
- [Testes e build](#testes-e-build)
- [Documentação adicional](#documentação-adicional)

---

## Stack e arquitetura

A aplicação é uma **SPA Angular** que consome o Supabase diretamente do navegador. Toda a lógica de negócio sensível é protegida por **Row-Level Security (RLS)** no PostgreSQL — o frontend não confia em si mesmo para autorização.

```
┌──────────────────────┐        ┌─────────────────────────────┐
│  Angular SPA         │        │  Supabase                   │
│  (standalone comps,  │ ──────▶│  - Postgres (RLS)           │
│   lazy routes)       │  HTTPS │  - Auth (JWT)               │
│                      │        │  - Storage (avatars, CVs)   │
│  SupabaseService     │        │  - Edge Functions / RPC     │
└──────────────────────┘        └─────────────────────────────┘
```

**Princípios arquiteturais** (ver [AI_RULES.md](AI_RULES.md) e [claude.md](claude.md)):

- Todas as chamadas ao banco passam por [`SupabaseService`](src/app/services/supabase.service.ts) — componentes nunca chamam o cliente Supabase diretamente.
- Estruturas enviadas ao banco devem respeitar exatamente os constraints do schema.
- Sem placeholders: implementações completas, tipadas, prontas para produção.

---

## Requisitos

- **Node.js** 20+ e **npm** 10+
- Projeto Supabase configurado (URL + anon key)
- Angular CLI 21 (opcional, `npx ng` também funciona)

---

## Configuração

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Configure os ambientes em [src/environments/](src/environments/):

   ```ts
   // src/environments/environment.ts
   export const environment = {
     production: false,
     supabaseUrl: 'https://<seu-projeto>.supabase.co',
     supabaseKey: '<sua-anon-key>',
   };
   ```

3. Aplique o schema do banco em uma instância Supabase nova executando [schema.sql](schema.sql) no SQL Editor. O arquivo inclui tipos enum, tabelas, índices e policies de RLS.

4. (Opcional) Configure provedores de autenticação social conforme [supabase_auth_config.json](supabase_auth_config.json).

---

## Desenvolvimento

```bash
npm start          # Sobe dev server em http://localhost:4200
npm run build      # Build de produção em dist/
npm run watch      # Build incremental em modo desenvolvimento
npm test           # Vitest
```

---

## Estrutura de pastas

```
src/app/
├── components/      # Componentes reutilizáveis (UI + widgets)
├── directives/      # Diretivas Angular customizadas
├── guards/          # auth.guard, admin.guard, expert.guard
├── pages/           # Páginas roteáveis (lazy-loaded)
├── pipes/           # Pipes customizados
├── services/        # Serviços de domínio (chamadas ao Supabase)
├── styles/          # Estilos globais e tokens
└── types/           # Interfaces TypeScript compartilhadas
```

Documentos relevantes no repositório:

- [AI_RULES.md](AI_RULES.md) — convenções para agentes de IA editando o código
- [claude.md](claude.md) — constituição do projeto (regras, schemas)
- [schema.sql](schema.sql) — schema autoritativo do PostgreSQL
- [progress.md](progress.md), [task_plan.md](task_plan.md) — planejamento ativo
- [AUDITORIA-WORKFLOWS.md](AUDITORIA-WORKFLOWS.md), [findings.md](findings.md) — auditorias

---

## Papéis de usuário

Definidos pelo enum `profile_type` em [schema.sql](schema.sql) e refletidos no campo `profiles.profile_type`:

| Papel          | Acesso                                                                                              | Guard                                    |
| -------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `CONTRATANTE`  | Busca peritos, solicita orçamentos, agenda, avalia, troca mensagens                                 | [authGuard](src/app/guards/auth.guard.ts) |
| `PERITO`       | Mantém perfil público, recebe leads/orçamentos, gerencia agenda, portfólio, responde mensagens     | [expertGuard](src/app/guards/expert.guard.ts) |
| `ADMIN`        | Modera usuários, especialidades, conteúdo, tickets, finanças, logs, e-mail templates, monitoring   | [adminGuard](src/app/guards/admin.guard.ts) |

Status de conta (`account_status`): `ACTIVE`, `BLOCKED`, `PENDING`, `REJECTED`, `SUSPENDED`. Peritos começam em `PENDING` até aprovação por um admin.

---

## Principais fluxos

### Onboarding de perito

1. Cadastro em [`/register-expert`](src/app/pages/register-expert/) cria entrada em `auth.users` + `profiles` com `profile_type=PERITO` e `account_status=PENDING`.
2. Perito completa [`/expert/onboarding`](src/app/pages/expert-onboarding/): bio, especialidades, certificações, áreas de atuação, valores.
3. Admin revisa em [`/admin/pending-experts`](src/app/pages/admin-dashboard/) e aprova → `account_status=ACTIVE`, `profile_visible=true`.

### Contratação

1. Cliente busca em [`/search`](src/app/pages/search-experts/) por especialidade, localização, tags.
2. Acessa perfil público em [`/expert/:id`](src/app/pages/expert-profile/) e clica em **Entrar em Contato** → dispara `MatDialog` com formulário de lead.
3. Submissão grava em `leads` (e/ou `quotes` para orçamento formal); perito recebe notificação.
4. Conversa segue em `messages` (real-time via Supabase Realtime).
5. Após o serviço, cliente avalia via `reviews` — `reviewer_name` é **sempre** preenchido a partir do perfil do cliente (ver regra em [claude.md](claude.md)).

### Administração

Painel completo em [`/admin`](src/app/pages/admin-dashboard/): usuários, especialidades, tickets de suporte, logs de auditoria, peritos pendentes, páginas de conteúdo, broadcast, moderação, templates de e-mail, finanças, monitoramento e relatórios.

---

## Banco de dados

Schema completo em [schema.sql](schema.sql). Tabelas principais:

| Tabela                 | Propósito                                                              |
| ---------------------- | ---------------------------------------------------------------------- |
| `profiles`             | Perfis estendendo `auth.users`; armazena papel, status, dados públicos |
| `specialties`          | Catálogo de especialidades de perícia                                  |
| `certificates`         | Certificações dos peritos                                              |
| `quotes`               | Pedidos de orçamento (status: submitted/under_review/approved/rejected)|
| `leads`                | Contatos iniciais entre cliente e perito                               |
| `reviews`              | Avaliações pós-serviço (1-5 estrelas)                                  |
| `service_completions`  | Registro de serviços concluídos                                        |
| `messages`             | Mensagens entre usuários                                               |
| `favorites`            | Peritos favoritados por clientes                                       |
| `availability`         | Slots de disponibilidade dos peritos                                   |
| `portfolio_items`      | Itens do portfólio dos peritos                                         |
| `notifications`        | Notificações in-app                                                    |
| `audit_logs`           | Trilha de auditoria de ações sensíveis                                 |
| `contact_submissions`  | Formulário de contato público                                          |

**RLS está habilitado** em todas as tabelas. Veja [schema.sql](schema.sql) para as policies específicas.

---

## Rotas

Definidas em [app.routes.ts](src/app/app.routes.ts). Resumo:

**Públicas:** `/`, `/login`, `/register`, `/register-expert`, `/forgot-password`, `/reset-password`, `/auth/callback`, `/email-confirmation`, `/search`, `/expert/:id`, `/how-it-works`, `/support`, `/terms`, `/privacy`, `/faq` (→ `/support`), `/contact` (→ `/support`).

**Autenticadas (`authGuard`):** `/dashboard`, `/client-dashboard`, `/expert-dashboard`, `/expert/quotes`, `/expert/onboarding`, `/my-appointments`.

**Perito (`expertGuard`):** `/expert/edit`.

**Admin (`adminGuard`):** `/admin/*` (users, specialties, tickets, logs, pending-experts, content-pages, broadcast, moderation, email-templates, finance, monitoring, reports).

---

## Testes e build

- **Unit tests:** `npm test` (Vitest + jsdom). Specs ficam ao lado dos arquivos como `*.spec.ts`.
- **Build de produção:** `npm run build` gera artefatos otimizados em `dist/`.
- **Lint/format:** Prettier configurado no [package.json](package.json) (printWidth 100, single quotes).

---

## Documentação

Toda a documentação técnica vive em [docs/](docs/). Comece pelo [índice](docs/README.md):

- **PRD** — visão, personas, escopo, métricas → [docs/prd/](docs/prd/)
- **Arquitetura** — camadas, serviços, decisões estruturais → [docs/architecture/](docs/architecture/)
- **API** — contratos REST/PostgREST, RPCs, realtime → [docs/api/](docs/api/)
- **Banco de Dados** — schema, RLS, índices, migrações → [docs/database/](docs/database/)
- **Regras de Negócio** — RN-XXX catalogadas → [docs/business-rules/](docs/business-rules/)
- **Fluxos** — diagramas de sequência e estado → [docs/flows/](docs/flows/)
- **Testes** — estratégia, pirâmide, cobertura → [docs/tests/](docs/tests/)
- **DevOps** — build, deploy, ambientes → [docs/devops/](docs/devops/)
- **Segurança** — modelo de ameaças, LGPD, RLS → [docs/security/](docs/security/)
- **Runbooks** — operação e resposta a incidentes → [docs/runbooks/](docs/runbooks/)
- **Onboarding** — guia para novos devs → [docs/onboarding/](docs/onboarding/)
- **Decisões (ADRs)** — registros arquiteturais → [docs/decisions/](docs/decisions/)

---

## Licença

Privado. Todos os direitos reservados.
