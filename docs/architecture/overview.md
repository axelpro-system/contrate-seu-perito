# Arquitetura — Contrate seu Perito

Documento de referência para entender como o código está organizado, como os módulos se conectam, e quais invariantes precisam ser respeitadas ao evoluir o sistema.

> Leitura prévia recomendada: [README.md](../../README.md), [claude.md](../../claude.md), [schema.sql](../../schema.sql).

---

## 1. Visão geral

Contrate seu Perito é uma **SPA Angular 21** que opera sobre o **Supabase** como única dependência de backend. Não há camada de servidor própria: o cliente Angular conversa diretamente com o PostgreSQL via PostgREST (encapsulado pelo SDK do Supabase), com autorização garantida por **Row-Level Security** (RLS).

```
┌─────────────────────────────┐
│         Browser             │
│  ┌───────────────────────┐  │
│  │ Pages (lazy routes)   │  │
│  │       │               │  │
│  │       ▼               │  │
│  │ Components            │  │
│  │       │               │  │
│  │       ▼               │  │
│  │ Domain Services       │  │
│  │       │               │  │
│  │       ▼               │  │
│  │ SupabaseService ──────┼──┼─► Supabase (Auth + Postgres + Storage + Realtime)
│  └───────────────────────┘  │
└─────────────────────────────┘
```

**Invariantes fundamentais** (definidas em [claude.md](../../claude.md)):

1. Toda interação com banco passa por [`SupabaseService`](../../src/app/services/supabase.service.ts).
2. Componentes **não** executam CRUD diretamente — eles chamam serviços de domínio.
3. Dados gravados precisam respeitar exatamente as constraints do schema.
4. `reviews.reviewer_name` nunca pode ser `NULL` — busca-se do perfil do cliente, com fallback para `'Cliente'`.

---

## 2. Camadas

### 2.1 Apresentação — `src/app/pages/`

Cada pasta é uma rota lazy-loaded declarada em [app.routes.ts](../../src/app/app.routes.ts). Páginas são **standalone components**, o que elimina `NgModule` e mantém o bundle inicial pequeno.

Convenções:

- Uma página = uma feature de alto nível (ex.: `expert-profile`, `admin-dashboard`).
- Páginas montam UI e orquestram chamadas a serviços; **não** falam com o Supabase diretamente.
- Subáreas administrativas vivem como filhos de `admin-dashboard/` (ver [app.routes.ts](../../src/app/app.routes.ts#L15-L33)).

### 2.2 Componentes reutilizáveis — `src/app/components/`

Widgets sem rota: cards de perito, modais, formulários reutilizados, etc. UI baseada em **Angular Material**.

### 2.3 Diretivas e pipes

- `src/app/directives/` — diretivas estruturais ou de atributo customizadas.
- `src/app/pipes/` — transformações de exibição (formatação, máscaras).

### 2.4 Guards — `src/app/guards/`

Três guards de roteamento, cada um lendo `profile_type` / `account_status` do perfil autenticado:

- [`authGuard`](../../src/app/guards/auth.guard.ts) — exige sessão válida.
- [`expertGuard`](../../src/app/guards/expert.guard.ts) — exige `profile_type = PERITO`.
- [`adminGuard`](../../src/app/guards/admin.guard.ts) — exige `profile_type = ADMIN`.

> Guards são **defesa em profundidade** sobre a UX. A autorização real é aplicada pelo RLS no Postgres.

### 2.5 Serviços de domínio — `src/app/services/`

Cada serviço encapsula um agregado:

| Serviço                                                                          | Responsabilidade                                                 |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| [`supabase.service.ts`](../../src/app/services/supabase.service.ts)                 | Wrapper único do cliente Supabase (auth, query, storage)         |
| [`auth.service.ts`](../../src/app/services/auth.service.ts)                         | Sessão, login, registro, recuperação de senha                    |
| [`appointment.service.ts`](../../src/app/services/appointment.service.ts)           | Agendamentos                                                     |
| [`availability.service.ts`](../../src/app/services/availability.service.ts)         | Slots de disponibilidade do perito                               |
| [`chat.service.ts`](../../src/app/services/chat.service.ts)                         | Mensagens em tempo real                                          |
| [`expert-service.service.ts`](../../src/app/services/expert-service.service.ts)     | Listagem, busca e detalhe de peritos                             |
| [`expert-stats.service.ts`](../../src/app/services/expert-stats.service.ts)         | Métricas do dashboard do perito                                  |
| [`favorite.service.ts`](../../src/app/services/favorite.service.ts)                 | Peritos favoritados                                              |
| [`form.service.ts`](../../src/app/services/form.service.ts)                         | Submissões de formulários públicos                               |
| [`lead-notification.service.ts`](../../src/app/services/lead-notification.service.ts) | Notificações de leads/orçamentos                               |
| [`notification.service.ts`](../../src/app/services/notification.service.ts)         | Notificações in-app                                              |
| [`portfolio.service.ts`](../../src/app/services/portfolio.service.ts)               | Portfólio dos peritos                                            |
| [`quote.service.ts`](../../src/app/services/quote.service.ts)                       | Orçamentos                                                       |
| [`support-ticket.service.ts`](../../src/app/services/support-ticket.service.ts)     | Tickets de suporte                                               |
| [`export.service.ts`](../../src/app/services/export.service.ts)                     | Exportações (CSV/relatórios)                                     |
| [`cademi.service.ts`](../../src/app/services/cademi.service.ts)                     | Integração Cademí                                                |
| [`hotmart.service.ts`](../../src/app/services/hotmart.service.ts)                   | Integração Hotmart                                               |
| [`email-templates.ts`](../../src/app/services/email-templates.ts)                   | Templates de e-mail transacional                                 |

Convenções:

- Serviços são `@Injectable({ providedIn: 'root' })` — singletons.
- Métodos retornam `Promise` ou `Observable` tipados; nunca `any`.
- Erros do Supabase são normalizados e propagados — UI lida com mensagens amigáveis.

### 2.6 Tipos compartilhados — `src/app/types/`

Interfaces TypeScript que espelham as tabelas do Postgres. Mantenha alinhadas com [schema.sql](../../schema.sql).

---

## 3. Modelo de dados

Schema autoritativo: [schema.sql](../../schema.sql).

### 3.1 Enums

```sql
profile_type   = 'PERITO' | 'CONTRATANTE' | 'ADMIN'
account_status = 'ACTIVE' | 'BLOCKED' | 'PENDING' | 'REJECTED' | 'SUSPENDED'
quote_status   = 'submitted' | 'under_review' | 'approved' | 'rejected'
```

### 3.2 Entidades-chave

```
auth.users (Supabase Auth)
   │ 1:1
   ▼
profiles ────┬───< quotes (expert_id, client_id)
             ├───< leads (expert_id, client_id)
             ├───< reviews (expert_id, client_id, lead_id)
             ├───< messages (sender_id, recipient_id)
             ├───< favorites (client_id, expert_id)
             ├───< availability (expert_id)
             ├───< portfolio_items (expert_id)
             ├───< certificates (profile_id)
             ├───< service_completions (expert_id, client_id)
             ├───< notifications (user_id)
             └───< audit_logs (actor_id)

specialties  (catálogo independente)
contact_submissions (formulário público, sem FK)
```

### 3.3 Regras de integridade críticas

- `profiles.id` é FK para `auth.users.id` com `ON DELETE CASCADE` — deletar o usuário no Auth remove o perfil.
- `reviews.reviewer_name NOT NULL` — preencha a partir do `profiles.full_name` do cliente; nunca confie em input do cliente.
- `reviews.rating` tem `CHECK (rating BETWEEN 1 AND 5)`.
- Foreign keys são `ON DELETE SET NULL` ou `CASCADE` conforme o caso — consulte o schema antes de mexer.

### 3.4 RLS

Toda tabela tem RLS habilitado. Padrões típicos:

- **Leitura pública:** apenas para `profiles` onde `profile_visible = true` e `account_status = 'ACTIVE'`.
- **Escrita:** o usuário só pode mexer nas linhas em que ele é o owner (`auth.uid() = client_id` ou `auth.uid() = expert_id`).
- **Admin:** policies dedicadas que checam `profile_type = 'ADMIN'`.

> Nunca desabilite RLS para "facilitar" desenvolvimento — escreva uma policy específica e teste-a.

---

## 4. Autenticação e autorização

### 4.1 Fluxo de login

1. Usuário envia credenciais via [`/login`](../../src/app/pages/login/) → `AuthService.signIn()`.
2. Supabase Auth retorna JWT; SDK armazena em `localStorage`.
3. `AuthService` carrega o `profiles` correspondente e expõe via `Observable`.
4. Guards consultam o perfil em cache para decidir acesso.

### 4.2 Cadastro

- **Cliente:** [`/register`](../../src/app/pages/register/) → cria `auth.users` + `profiles` com `profile_type=CONTRATANTE`, `account_status=ACTIVE`.
- **Perito:** [`/register-expert`](../../src/app/pages/register-expert/) → cria com `profile_type=PERITO`, `account_status=PENDING`. Requer aprovação admin.
- **OAuth:** callback em [`/auth/callback`](../../src/app/pages/auth-callback/).

### 4.3 Recuperação de senha

[`/forgot-password`](../../src/app/pages/forgot-password/) dispara e-mail do Supabase; usuário clica no link e cai em [`/reset-password`](../../src/app/pages/reset-password/).

---

## 5. Fluxos de negócio

### 5.1 Solicitação de contato no perfil público

```
Cliente em /expert/:id
   │ clica em "Entrar em Contato"
   ▼
MatDialog (ContactExpertDialog)
   │ submit
   ▼
LeadService.createLead({ expert_id, client_id, message, ... })
   │
   ▼
INSERT em leads
   │
   ▼
LeadNotificationService → notifications + (opcional) e-mail
```

### 5.2 Orçamento (quote)

`quotes.status` transita: `submitted → under_review → approved | rejected`. Mudanças são auditadas em `audit_logs`.

### 5.3 Avaliação pós-serviço

1. Após `service_completions`, cliente recebe convite para avaliar.
2. `ReviewService.create()` busca `profiles.full_name` do cliente (regra obrigatória), monta payload com `reviewer_name` preenchido, insere.
3. Trigger atualiza `profiles.rating` e `profiles.reviews_count` do perito.

### 5.4 Chat

`messages` é consultada via Supabase **Realtime** — `ChatService` mantém uma assinatura à tabela filtrada por conversa e emite atualizações ao componente de chat.

---

## 6. Storage

Avatares, currículos (`cv_url`, `curriculum_url`) e anexos de portfólio são armazenados em **Supabase Storage**. Buckets típicos:

- `avatars/` — público (leitura), escrita apenas pelo dono.
- `cvs/` — privado; URLs assinadas geradas sob demanda.
- `portfolio/` — público para itens visíveis.

---

## 7. Segurança

- **JWT:** mantido pelo SDK; expira conforme política do projeto Supabase.
- **RLS:** primeira e última linha de defesa para dados.
- **Sanitização:** Angular escapa interpolação por padrão; não use `[innerHTML]` com dados de terceiros sem `DomSanitizer`.
- **Segredos:** apenas a `anon key` vai para o cliente. Service-role key **nunca** é embarcada na SPA.
- **Audit log:** ações sensíveis (aprovação de perito, alteração de role, moderação) gravam em `audit_logs`.

---

## 8. Convenções de código

- **Standalone components** em todo lugar; sem `NgModule`.
- **Lazy routes** para tudo exceto a `Home`.
- **Prettier:** `printWidth: 100`, `singleQuote: true` ([package.json](../../package.json)).
- **Nomes:** kebab-case em arquivos, PascalCase em classes, camelCase em métodos/variáveis.
- **Testes:** `*.spec.ts` ao lado do alvo; rodar com `npm test` (Vitest).

---

## 9. Build e deploy

- `npm run build` gera bundle otimizado em `dist/` (server-side rendering desabilitado por padrão).
- O conteúdo de `dist/contrate-seu-perito/browser/` pode ser servido em qualquer host estático (Vercel, Netlify, S3+CloudFront, Supabase Hosting).
- Variáveis de ambiente são bakeadas no bundle via [environment.ts](../../src/environments/environment.ts) — gere builds separados por ambiente.

---

## 10. Pontos de atenção para evolução

- **Não introduzir lógica de autorização puramente no frontend** — sempre espelhe em policy RLS.
- **Migrar mudanças de schema com cuidado:** atualize [schema.sql](../../schema.sql), as interfaces em `src/app/types/`, os serviços afetados e os testes na mesma PR.
- **Evite "service god":** se um serviço passar de ~300 linhas, considere dividir por agregado.
- **Realtime tem custo:** assine apenas o necessário e cancele a assinatura ao destruir o componente.
- **Storage:** sempre gere URLs assinadas para conteúdo privado; não confie em "URL difícil de adivinhar".

---

## 11. Referências internas

- [README.md](../../README.md) — visão geral, setup, papéis e rotas
- [AI_RULES.md](../../AI_RULES.md) — regras para agentes de IA
- [claude.md](../../claude.md) — constituição do projeto
- [schema.sql](../../schema.sql) — schema autoritativo
- [src/app/services/supabase.service.ts](../../src/app/services/supabase.service.ts) — wrapper único do banco
- [src/app/app.routes.ts](../../src/app/app.routes.ts) — mapa de rotas
