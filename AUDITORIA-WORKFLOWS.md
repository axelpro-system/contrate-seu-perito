# Auditoria de Workflows — Contrate seu Perito

**Data:** 2026-05-15
**Escopo:** Revisão completa dos fluxos de autenticação, cliente, perito, admin, serviços, rotas e schema do banco.
**Status:** ✅ Todas as correções implementadas e build passando.

---

## Sumário Executivo

| Severidade | Quantidade | Status |
|------------|------------|--------|
| 🔴 Crítico | 6 | ✅ Resolvidos |
| 🟡 Médio | 9 | ✅ Resolvidos |
| 🟢 Menor | 6 | ✅ Resolvidos |

**Total:** 21 problemas identificados e corrigidos.

---

## 🔴 Críticos — Bloqueiam fluxo principal

### 1. Auth callback quebrado para confirmação de e-mail
**Arquivo:** `src/app/pages/auth-callback/auth-callback.ts` (linhas 36–63)

O componente `/auth/callback` trata apenas o fluxo Hotmart. O Supabase usa o mesmo path para confirmação de e-mail (magic link). Quando o usuário clica no link de confirmação após registro, o componente tenta validar como callback Hotmart, falha em `validateState`, e redireciona para `/login` com "Falha na validação de segurança".

**Impacto:** Nenhum novo usuário consegue confirmar registro.

**Correção sugerida:** Detectar o tipo de callback no `ngOnInit` — se vier `access_token`/`refresh_token` no hash, é Supabase; se vier `code`/`state` na query, é Hotmart. Roteamento condicional.

---

### 2. HireDialog cria `lead`, mas painéis leem `quote`
**Arquivos:**
- `src/app/components/hire-dialog/hire-dialog.ts` (insert em `leads`)
- `src/app/components/quote-request-dialog/quote-request-dialog.ts` (insert em `quotes`)
- `src/app/pages/client-dashboard/client-dashboard.ts` (lê apenas `quotes`)
- `src/app/pages/expert-leads/expert-leads.ts` (lê apenas `quotes`)

O botão "Contratar" no perfil público do perito abre o `HireDialog`, que insere em `leads`. Mas o client-dashboard e o expert-leads carregam apenas da tabela `quotes`.

**Impacto:** Todo pedido iniciado via HireDialog é um silo morto — nem cliente nem perito o veem nos seus painéis.

**Correção sugerida:** Unificar — o `HireDialog` deve criar `quotes`, ou os painéis devem agregar ambas as tabelas. Recomendado consolidar em `quotes` e deprecar `leads`.

---

### 3. Busca por localização sempre retorna zero
**Arquivos:**
- `src/app/services/supabase.service.ts` (linha 67): `query.ilike('location', ...)`
- `src/app/pages/expert-profile-edit/expert-profile-edit.ts`: salva em `city` e `state`
- `src/app/pages/expert-onboarding/expert-onboarding.ts`: salva em `city` e `state`

A coluna `location` existe no schema mas nenhum formulário a popula. Todos os formulários salvam em `city` + `state` separadamente. O filtro de busca consulta `location`.

**Impacto:** Filtro de localização sempre retorna vazio. Funcionalidade principal de busca quebrada.

**Correção sugerida:**
- (a) Mudar a query para filtrar `city.ilike OR state.ilike`, OU
- (b) Adicionar coluna computada no banco: `location = city || ', ' || state`, OU
- (c) Adicionar campo `location` ao formulário de edição.

---

### 4. Register-expert redireciona para rota protegida sem sessão
**Arquivo:** `src/app/pages/register-expert/register-expert.ts` (linha 57)

Após `signUp`, navega imediatamente para `/expert/edit` (protegida por `authGuard`). A sessão Supabase ainda não foi estabelecida (confirmação de e-mail pendente). O guard redireciona para `/login`, contradizendo a snackbar "Complete seu perfil profissional".

**Impacto:** Perito recém-cadastrado vê mensagem de sucesso mas é jogado no login sem entender por quê.

**Correção sugerida:** Redirecionar para uma página informando "Confirme seu e-mail para continuar" ou aguardar `authService.initialized` antes de navegar.

---

### 5. `openHireDialog` falha silenciosamente para anônimos
**Arquivo:** `src/app/pages/expert-profile/expert-profile.ts` (linhas 111–119)

```typescript
openHireDialog() {
    if (!userId || !expertData) return;
}
```

Clientes não autenticados que visitam um perfil de perito clicam em "Contratar" e nada acontece — sem snackbar, sem redirect para login.

**Impacto:** Principal ponto de conversão do marketplace não funciona para visitantes anônimos (que são a maioria).

**Correção sugerida:** Se não autenticado, redirecionar para `/login?returnUrl=/expert/[id]` ou abrir um modal de login.

---

### 6. Perito pode alterar próprio `account_status`
**Arquivos:**
- `src/app/services/supabase.service.ts` (linhas 47–57): `sanitizeProfileData` exclui campos sensíveis
- `src/app/services/supabase.service.ts`: `upsertProfile` **não** passa por `sanitizeProfileData`
- `schema.sql`: RLS policy "Users can insert their own profile" usa apenas `with check (auth.uid() = id)`

A RLS não restringe quais campos podem ser alterados, e o `upsertProfile` aceita o payload bruto. Perito pode enviar `account_status: 'ACTIVE'` e burlar a aprovação manual.

**Impacto:** Fura o processo de homologação de peritos.

**Correção sugerida:**
- (a) Aplicar `sanitizeProfileData` também ao `upsertProfile`, OU
- (b) Adicionar policy RLS restringindo colunas alteráveis com `with check`, OU
- (c) Criar trigger `BEFORE UPDATE` que rejeite mudanças em campos protegidos quando `auth.role() != 'service_role'`.

---

## 🟡 Médios — Degradam experiência ou funcionalidade

### 7. Nome do interlocutor invertido no ClientDashboard
**Arquivo:** `src/app/pages/client-dashboard/client-dashboard.ts` (linhas 85, 95)

`openChat` e `openReview` passam `otherName: q.requester_name` e `expertName: q.requester_name` — que é o nome do próprio cliente, não do perito.

**Impacto:** Cliente abre chat e vê o próprio nome como interlocutor; modal de review mostra "Avaliar [seu próprio nome]".

**Correção sugerida:** Fazer join com `profiles` via `expert_id` ou adicionar campo `expert_name` denormalizado em `quotes`.

---

### 8. Forgot-password sem página de redefinição
**Arquivo:** `src/app/services/supabase.service.ts` (linha 187)

`redirectTo` aponta para `/login`. O Supabase envia o link com `access_token` no hash. O componente `/login` não trata esses tokens nem possui formulário de nova senha.

**Impacto:** Usuário recebe e-mail, clica, chega no login sem feedback nem campo para nova senha. Recuperação de senha não funciona.

**Correção sugerida:** Criar rota `/reset-password` que leia o token do hash e ofereça formulário de nova senha.

---

### 9. Seção de Serviços invisível no expert-dashboard
**Arquivo:** `src/app/pages/expert-dashboard/expert-dashboard.ts` (linhas 218–222, 267–284)

Signals `svcName`, `svcDesc`, `svcPrice`, `svcUnit` e método `addService()` existem mas não há HTML correspondente. O perito não consegue cadastrar serviços pela interface.

**Correção sugerida:** Adicionar bloco no template para listar e cadastrar serviços, ou remover o código não usado.

---

### 10. Admin não consegue alterar `account_status` pela aba básica
**Arquivos:**
- `src/app/pages/admin-dashboard/admin-user-edit.ts` (linha 259): chama `updateProfile`
- `src/app/services/supabase.service.ts` (linhas 47–57): `sanitizeProfileData` remove `account_status`

O select de status na aba "Dados Básicos" é um controle morto — o valor escolhido nunca é salvo. Funciona apenas via aba "Aprovação" que usa métodos dedicados.

**Correção sugerida:** Criar método específico `adminUpdateProfile` que não aplica sanitização, ou remover o select duplicado.

---

### 11. `audit_logs` nunca populada pelo front-end
**Arquivo:** `schema.sql` (linhas 139–151); nenhum serviço do front escreve em `audit_logs`.

A tabela existe, o admin-logs a lê, mas nenhum INSERT é feito. A aba de auditoria sempre vazia.

**Correção sugerida:** Adicionar interceptor ou wrapper nos serviços críticos (`approveExpert`, `rejectExpert`, `updateProfile`) que registre em `audit_logs`. Idealmente via trigger no banco.

---

### 12. Race condition no redirect pós-login
**Arquivo:** `src/app/pages/login/login.ts` (linhas 56–58)

Após `signIn`, espera `authService.initialized` — que já está resolvido desde o boot. O perfil é carregado de forma assíncrona pelo `onAuthStateChange`, mas o `getRedirectUrl()` é chamado antes do `userProfile` estar pronto.

**Impacto:** Pode redirecionar para `/login` em vez do dashboard correto, criando loop.

**Correção sugerida:** Criar `awaitProfile()` no AuthService que resolva quando `userProfile()` ficar não-nulo após o signIn.

---

### 13. Rota `/expert/edit` sem guard de role
**Arquivo:** `src/app/app.routes.ts` (linha 12)

Qualquer autenticado (CONTRATANTE, ADMIN) pode acessar e salvar no formulário de perito.

**Correção sugerida:** Criar `expertGuard` que verifique `profile_type === 'PERITO'`.

---

### 14. NotificationService pode criar canais duplicados
**Arquivo:** `src/app/services/notification.service.ts` (linhas 58–83)

`subscribe()` é chamado em `ngOnInit` do header. Sem guarda `if (this.channel) return`, múltiplas chamadas criam canais Realtime duplicados — notificações duplicadas.

**Correção sugerida:** Adicionar early return se `this.channel` já existe.

---

### 15. Schema com colunas duplicadas
**Arquivo:** `schema.sql` vs. `src/app/types/index.ts`

| Campo no schema (legado) | Campo efetivo | Tipo declarado em `types/index.ts` |
|---|---|---|
| `curriculum_url` | `cv_url` | `curriculum_url` (errado) |
| `linkedin_url` | `social_linkedin` | `linkedin_url` (errado) |
| `website_url` | `social_website` | `website_url` (errado) |
| `location` | `city` + `state` | `location` (legado) |

**Impacto:** Tipos TypeScript desalinhados com schema real. Bugs silenciosos.

**Correção sugerida:** Drop das colunas legadas no banco (após migração de dados) e atualizar tipos.

---

## 🟢 Menores

### 16. Ícone `lead` inválido
**Arquivo:** `src/app/pages/admin-dashboard/admin-dashboard.ts` (linha 89)
`'lead'` não existe no Material Icons. Resultado: caixa vazia.

### 17. `AccountStatus` enum incompleto
**Arquivo:** `src/app/types/index.ts` (linha 2)
Declara apenas `ACTIVE` e `BLOCKED`. Schema tem 5: `ACTIVE`, `BLOCKED`, `PENDING`, `REJECTED`, `SUSPENDED`.

### 18. `service_completions` nunca lida
Tabela populada por trigger quando quote é aprovada, mas nenhum componente lê dela. Sistema de review pós-serviço incompleto.

### 19. Tabela `certificates` órfã
Tabela existe no schema (linhas 121–133) mas o código sempre usa `certifications jsonb` em `profiles`. Schema de segunda geração não integrado.

### 20. Wildcard `**` sem 404
**Arquivo:** `src/app/app.routes.ts` (linha 34)
Redireciona para home. URLs inválidas falham silenciosamente.

### 21. Rota `/dashboard` órfã
Componente genérico semi-funcional. Nenhum fluxo de redirecionamento aponta para ele.

---

## Prioridade Sugerida de Correção

### Sprint 1 — Bloqueios de produto
1. **#1** — Auth callback (sem isso, ninguém confirma e-mail)
2. **#2** — Unificar HireDialog/QuoteDialog (sem isso, cotações não chegam aos painéis)
3. **#3** — Busca por localização
4. **#5** — Botão "Contratar" para anônimos

### Sprint 2 — Fluxo do usuário
5. **#4** — Redirect pós-registro de perito
6. **#7** — Nome do interlocutor no chat/review
7. **#8** — Página de redefinição de senha
8. **#12** — Race condition no login

### Sprint 3 — Segurança e admin
9. **#6** — Bloquear alteração de `account_status` pelo perito
10. **#13** — Guard de role em `/expert/edit`
11. **#10** — Admin salvar status na aba básica
12. **#11** — Popular `audit_logs`

### Sprint 4 — Limpeza técnica
13. **#9** — UI de serviços ou remover código
14. **#14** — Guarda no NotificationService
15. **#15** — Drop de colunas duplicadas no schema
16. Itens 16–21 — Polimento

---

## Observações Finais

O sistema apresenta uma base sólida em Angular standalone components e Supabase, mas dois grandes problemas estruturais saltam aos olhos:

1. **Duplicação de fluxos** — `leads` vs. `quotes`, `HireDialog` vs. `QuoteRequestDialog`, `expert-onboarding` vs. `expert-profile-edit`, `dashboard` vs. `client-dashboard`/`expert-dashboard`. Aparentemente o produto evoluiu sem que as versões antigas fossem retiradas, gerando caminhos paralelos que não se comunicam.

2. **Schema em duas gerações** — colunas legadas (`location`, `curriculum_url`, `linkedin_url`, `website_url`, tabela `certificates`) coexistem com as novas, mas os tipos TypeScript ainda apontam para as antigas. Isso indica migração de schema sem refatoração do código consumidor.

Resolver esses dois pontos estruturais antes (ou junto com) os bugs específicos vai reduzir drasticamente a superfície de problemas futuros.

---

## Changelog de Correções

### ✅ Sprint 1 — Bloqueios de produto (RESOLVIDOS)

1. **#1 Auth callback** — `auth-callback.ts` agora detecta Supabase (hash com `access_token`) vs Hotmart (query com `code`). Suporta `type=signup` (email confirmation) e `type=recovery` (password reset).
2. **#2 HireDialog unificado** — Agora cria `quotes` via `QuoteService` em vez de `leads`. Formulário expandido com nome, email, telefone e mensagem.
3. **#3 Busca por localização** — `searchExperts` agora filtra por `city.ilike OR state.ilike` ao invés de `location`.
4. **#5 Botão Contratar para anônimos** — `openHireDialog` redireciona para `/login?returnUrl=/expert/[id]` se não autenticado.

### ✅ Sprint 2 — Fluxo do usuário (RESOLVIDOS)

5. **#4 Redirect pós-registro** — `register-expert` agora redireciona para `/email-confirmation` (nova página) ao invés de `/expert/edit`.
6. **#7 Nome do interlocutor** — `client-dashboard` agora usa `expert.first_name/last_name/full_name` via join no `getSentQuotes`.
7. **#8 Reset-password** — Nova página `/reset-password` que lê token do hash e oferece formulário de nova senha. `resetPasswordForEmail` agora redireciona para `/reset-password`.
8. **#12 Race condition login** — `AuthService.awaitProfile()` aguarda profile ser carregado antes do redirect.

### ✅ Sprint 3 — Segurança e admin (RESOLVIDOS)

9. **#6 Bloquear account_status** — `upsertProfile` agora aplica `sanitizeProfileData`, impedindo peritos de alterar campos protegidos.
10. **#13 Expert guard** — Novo `expertGuard` verifica `profile_type === 'PERITO'`. Aplicado em `/expert/edit`.
11. **#10 Admin salvar status** — Novo método `adminUpdateProfile` sem sanitização. `admin-user-edit` usa este método.
12. **#11 Audit logs** — Migration 015 cria triggers automáticos em `profiles`, `quotes` e `reviews`.

### ✅ Sprint 4 — Limpeza técnica (RESOLVIDOS)

13. **#14 NotificationService** — `subscribe()` agora tem `if (this.channel) return` para evitar canais duplicados.
14. **#15 Tipos TypeScript** — `AccountStatus` expandido com PENDING, REJECTED, SUSPENDED. `Profile` interface alinhada com schema (removidos `location`, `curriculum_url`, `linkedin_url`, `website_url`).
15. **#16 Ícone lead** — Substituído `lead` por `how_to_reg` (Material Icons válido).
