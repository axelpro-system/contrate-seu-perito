# Documento de Regras de Negócio — Contrate seu Perito

> Versão: 1.0
> Última atualização: 2026-05-19
> Fontes autoritativas: [schema.sql](../../schema.sql), [src/app/guards/](../../src/app/guards/), [src/app/services/](../../src/app/services/), [claude.md](../../claude.md), [AI_RULES.md](../../AI_RULES.md).

Este documento descreve as **regras de negócio** que regem a plataforma Contrate seu Perito. Cada regra possui código único (`RN-XXX`), descrição, justificativa e onde está implementada/garantida no sistema.

---

## Sumário

1. [Glossário](#1-glossário)
2. [Atores e papéis](#2-atores-e-papéis)
3. [Cadastro e ciclo de vida da conta](#3-cadastro-e-ciclo-de-vida-da-conta)
4. [Perfil do perito](#4-perfil-do-perito)
5. [Visibilidade pública e busca](#5-visibilidade-pública-e-busca)
6. [Contato e leads](#6-contato-e-leads)
7. [Orçamentos (quotes)](#7-orçamentos-quotes)
8. [Chat/Mensagens](#8-chatmensagens)
9. [Conclusão de serviço e avaliações](#9-conclusão-de-serviço-e-avaliações)
10. [Favoritos](#10-favoritos)
11. [Disponibilidade e agendamento](#11-disponibilidade-e-agendamento)
12. [Portfólio e certificações](#12-portfólio-e-certificações)
13. [Serviços e precificação](#13-serviços-e-precificação)
14. [Notificações](#14-notificações)
15. [Administração](#15-administração)
16. [Auditoria](#16-auditoria)
17. [Segurança e dados pessoais](#17-segurança-e-dados-pessoais)
18. [Integrações externas](#18-integrações-externas)
19. [Matriz de permissões](#19-matriz-de-permissões)

---

## 1. Glossário

| Termo                       | Definição                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| **Perito**                  | Profissional técnico cadastrado para oferecer perícia (`profile_type = 'PERITO'`).       |
| **Contratante / Cliente**   | Usuário que solicita serviços (`profile_type = 'CONTRATANTE'`).                          |
| **Administrador**           | Usuário com poderes de moderação (`profile_type = 'ADMIN'`).                             |
| **Lead**                    | Contato inicial enviado pelo cliente ao perito a partir do perfil público.               |
| **Orçamento (quote)**       | Proposta formal com descrição do caso, valor e prazo, sujeita a aceite.                  |
| **Conclusão de serviço**    | Registro de que uma quote `approved` foi cumprida, habilitando avaliação.                |
| **Avaliação (review)**      | Nota (1–5) e comentário deixados pelo cliente após conclusão do serviço.                 |
| **RLS**                     | Row-Level Security — mecanismo de autorização no PostgreSQL.                             |

---

## 2. Atores e papéis

### RN-001 — Papéis suportados
A plataforma reconhece três papéis exclusivos por usuário: `PERITO`, `CONTRATANTE`, `ADMIN`.
**Onde:** enum `profile_type` em [schema.sql](../../schema.sql#L4).

### RN-002 — Papel padrão na criação
Quando um usuário é criado em `auth.users` sem metadado, o trigger `handle_new_user` define `profile_type = 'PERITO'` por padrão.
**Onde:** função `handle_new_user` em [schema.sql](../../schema.sql#L374).
**Observação:** páginas de cadastro [`/register`](../../src/app/pages/register/) e [`/register-expert`](../../src/app/pages/register-expert/) devem enviar `profile_type` correto no `raw_user_meta_data`.

### RN-003 — Um único papel por conta
Não é permitido um usuário ser simultaneamente Perito e Contratante. Para mudar de papel é necessário intervenção administrativa.

---

## 3. Cadastro e ciclo de vida da conta

### RN-010 — Estados de conta
`account_status` pode assumir: `PENDING`, `ACTIVE`, `BLOCKED`, `REJECTED`, `SUSPENDED`.
**Onde:** enum `account_status` em [schema.sql](../../schema.sql#L5).

### RN-011 — Cadastro de perito exige aprovação
Todo novo perito é criado com `account_status = 'PENDING'` e `profile_visible = false`. Só após aprovação por um administrador o status muda para `ACTIVE` e o perfil pode tornar-se público.
**Onde:** trigger `handle_new_user` em [schema.sql](../../schema.sql#L377-L378); fluxo de aprovação em [`/admin/pending-experts`](../../src/app/pages/admin-dashboard/).

### RN-012 — Registro de aprovação
Quando um admin aprova um perito, devem ser preenchidos:
- `approved_at` = timestamp da aprovação;
- `approved_by` = `id` do administrador que aprovou.
**Onde:** colunas em [schema.sql](../../schema.sql#L41-L42).

### RN-013 — Cadastro de contratante é imediato
Contratantes não passam por moderação prévia — `account_status` pode ser `ACTIVE` na criação (a UI de [`/register`](../../src/app/pages/register/) é responsável por gravar esse status).

### RN-014 — E-mail de contato único
`profiles.contact_email` é único na base. Não pode haver duas contas com o mesmo e-mail de contato.
**Onde:** constraint `profiles_contact_email_key` em [schema.sql](../../schema.sql#L52).

### RN-015 — Exclusão em cascata
Quando um usuário é excluído de `auth.users`, seu `profiles` e todas as entidades dependentes com `ON DELETE CASCADE` (certificados, favoritos, disponibilidade, portfólio, notificações, expert_services) são removidos.
**Onde:** FK `profiles.id REFERENCES auth.users ON DELETE CASCADE` em [schema.sql](../../schema.sql#L12).

### RN-016 — Contas bloqueadas/suspensas perdem visibilidade pública
Apenas perfis com `account_status = 'ACTIVE'` aparecem em listagens públicas.
**Onde:** RLS policy `Public profiles are viewable by everyone` em [schema.sql](../../schema.sql#L58-L63).

### RN-017 — Reset de senha revelado após 3 falhas no login
Ao falhar 3 vezes consecutivas no login, a tela exibe um botão "Esqueceu sua senha?" que dispara a Edge Function `send-password-reset` (envia link de recuperação via Resend).
**Por quê:** maioria dos tickets de login são senha esquecida — orienta o usuário sem poluir a UI de quem acerta de primeira.
**Onde:** [login.ts](../../src/app/pages/login/login.ts), [ADR-0009](../decisions/ADR-0009-forgot-password-after-3-attempts.md).

### RN-018 — Admin pode deletar conta antes de recriar com mesmo e-mail
No fluxo administrativo de criação de usuário, se o e-mail já existir (`check-email-exists`), o admin tem opção de **deletar a conta existente** (Edge Function `delete-user` → cascata via FK) e criar novamente.
**Por quê:** dá controle ao admin sem precisar editar via SQL.
**Onde:** [flows/admin-create-user.md](../flows/admin-create-user.md), [admin-user-create.ts](../../src/app/pages/admin-dashboard/admin-user-create.ts).

### RN-019 — E-mails transacionais saem do domínio `axelpro.com.br` via Resend
Boas-vindas, reset de senha, broadcast e notificações de produto são enviados por Edge Functions usando Resend, com remetente `noreply@axelpro.com.br`. E-mails do Supabase Auth nativo (confirmação inicial pós-signUp) permanecem temporariamente.
**Por quê:** branding consistente, deliverability, métricas próprias.
**Onde:** [ADR-0008](../decisions/ADR-0008-resend-emails.md), [api/edge-functions.md](../api/edge-functions.md), [devops/resend-setup.md](../devops/resend-setup.md).

---

## 4. Perfil do perito

### RN-020 — Informações mínimas para visibilidade
Para um perito ficar visível publicamente é necessário:
- `account_status = 'ACTIVE'`
- `profile_visible = true`
- `profile_type = 'PERITO'`

Recomenda-se também ter preenchidos: `full_name`, `specialty`, `city`/`state`, `bio`. (A UI de [`/expert/onboarding`](../../src/app/pages/expert-onboarding/) deve guiar o preenchimento.)

### RN-021 — Tornar perfil público é ação explícita
`profile_visible` inicia em `false`. O perito decide quando tornar o perfil público em [`/expert/edit`](../../src/app/pages/expert-profile-edit/).

### RN-022 — Atributos verificáveis
Os campos `is_verified` e `is_featured` são controlados exclusivamente por administradores. Peritos não conseguem alterá-los diretamente (impedido pela policy de update, que limita escrita do próprio perfil mas não pode ser usada para forjar verificação — a UI também não expõe esses campos).

### RN-023 — Avaliação e contagem são derivadas
`profiles.rating` e `profiles.reviews_count` são **calculados automaticamente** pelo trigger `update_expert_rating` ao inserir uma review. Nenhum código de aplicação deve gravar esses campos manualmente.
**Onde:** trigger em [schema.sql](../../schema.sql#L420-L432).

### RN-024 — Currículo é privado
Documentos de currículo (`curriculum_url`, `cv_url`) ficam em bucket privado do Supabase Storage. URLs assinadas são geradas sob demanda para visualização.

---

## 5. Visibilidade pública e busca

### RN-030 — O que aparece sem login
Visitantes não autenticados conseguem ver apenas:
- Peritos `ACTIVE` + `profile_visible = true` (campos públicos);
- Especialidades (catálogo);
- Avaliações (`reviews` é leitura pública);
- Portfólio e disponibilidade dos peritos públicos;
- Serviços (`expert_services` com `is_active = true` cujo perito é público).
**Onde:** RLS policies em [schema.sql](../../schema.sql).

### RN-031 — Usuários autenticados veem mais
Qualquer usuário logado pode consultar perfis sem o filtro de visibilidade pública (para fins de chat, admin, etc.), conforme policy `Authenticated users can view profiles`.

### RN-032 — Peritos em destaque
A função `get_featured_experts(limit_count)` retorna peritos públicos em ordem aleatória — usada na home para rotacionar destaques sem favorecer um perito específico.
**Onde:** [schema.sql](../../schema.sql#L408-L417).

---

## 6. Contato e leads

### RN-040 — Lead exige cliente identificado
Para criar um `lead`, o sistema exige `expert_id` e `client_id` (ambos NOT NULL). Visitantes não autenticados **não** podem disparar leads — devem usar [`contact_submissions`](#rn-041) ou se cadastrar primeiro.
**Onde:** tabela `leads` em [schema.sql](../../schema.sql#L167-L175).

### RN-041 — Formulário de contato público
Visitantes podem enviar mensagens genéricas via `contact_submissions` (nome, e-mail, assunto, mensagem). Não associa-se a perito específico.
**Onde:** tabela `contact_submissions` em [schema.sql](../../schema.sql#L154-L161).

### RN-042 — Mensagem do lead é obrigatória
`leads.message` é NOT NULL — não se cria lead vazio.

### RN-043 — Visibilidade do lead
Apenas perito e cliente envolvidos podem visualizar o lead.
**Onde:** policies em [schema.sql](../../schema.sql#L177-L180).

### RN-044 — Notificação ao perito
Ao criar lead, o `LeadNotificationService` deve gerar uma `notification` para o perito.
**Onde:** [lead-notification.service.ts](../../src/app/services/lead-notification.service.ts).

---

## 7. Orçamentos (quotes)

### RN-050 — Estados do orçamento
`quote_status` evolui em: `submitted → under_review → approved | rejected`.
**Onde:** enum `quote_status` em [schema.sql](../../schema.sql#L6).

### RN-051 — Quote pode ser criada por qualquer um
A policy `Anyone can create quotes` permite que mesmo visitantes anônimos enviem uma quote (`requester_id` pode ser `NULL`, mas `requester_name`, `requester_email` e `case_description` são obrigatórios).
**Onde:** [schema.sql](../../schema.sql#L84-L107).

### RN-052 — Apenas o perito altera valor e prazo
Os campos `proposed_value`, `proposed_deadline` e `expert_notes` só podem ser atualizados pelo perito destinatário.
**Onde:** policy `Experts can update their quotes` em [schema.sql](../../schema.sql#L106).

### RN-053 — Cliente pode atualizar status
O cliente solicitante (`requester_id`) pode atualizar o status (ex.: aceitar/rejeitar proposta).
**Onde:** policy `Requesters can update quote status` em [schema.sql](../../schema.sql#L107).

### RN-054 — Aprovação cria conclusão de serviço
Quando uma quote transita para `approved` (de qualquer status diferente), o trigger `quote_approved` insere uma linha em `service_completions`.
**Onde:** trigger em [schema.sql](../../schema.sql#L435-L447).

### RN-055 — `responded_at` registra a resposta
Ao perito responder uma quote (alterando status para `approved`/`rejected` ou preenchendo `proposed_value`), o campo `responded_at` deve ser populado pela camada de serviço.
**Onde:** [quote.service.ts](../../src/app/services/quote.service.ts).

### RN-056 — `updated_at` automático
Trigger `quotes_updated_at` atualiza `updated_at` em qualquer UPDATE.

---

## 8. Chat / Mensagens

### RN-060 — Conversa atrelada a quote
Toda mensagem (`messages`) está vinculada a uma `quote`. Não há chat livre fora do contexto de um orçamento.
**Onde:** FK `messages.quote_id` em [schema.sql](../../schema.sql#L217).

### RN-061 — Apenas participantes leem/enviam
Somente perito e solicitante daquela quote podem ler ou enviar mensagens.
**Onde:** policies em [schema.sql](../../schema.sql#L226-L248).

### RN-062 — `content` obrigatório
Não se envia mensagem vazia (`content` NOT NULL).

### RN-063 — Marcação de leitura
Qualquer participante pode marcar mensagens como lidas (campo `read`).

### RN-064 — Mensagens são apagadas com a quote
Excluir uma quote remove em cascata todas as suas mensagens (`ON DELETE CASCADE`).

---

## 9. Conclusão de serviço e avaliações

### RN-070 — Conclusão é automática
`service_completions` só é criada pelo trigger `quote_approved` (RN-054). A aplicação não deve inserir nessa tabela manualmente, exceto em rotinas administrativas.

### RN-071 — Lembrete de avaliação
`service_completions.review_reminder_sent` deve ser marcado quando o sistema enviar lembrete ao cliente. Não enviar lembrete repetido.

### RN-072 — Nota obrigatória entre 1 e 5
`reviews.rating` é NOT NULL e tem `CHECK (rating BETWEEN 1 AND 5)`.
**Onde:** [schema.sql](../../schema.sql#L187).

### RN-073 — `reviewer_name` sempre preenchido (regra crítica)
Na criação de uma review, **sempre** popular `reviewer_name` a partir do `profiles.full_name` do `client_id`. Se o nome estiver vazio, usar o fallback `'Cliente'`. **Nunca** confiar em input do cliente para esse campo.
**Por quê:** evitar reviews anônimas ou com nomes forjados; manter exibição consistente.
**Onde:** regra registrada em [claude.md](../../claude.md); deve ser aplicada em [`reviews` flow].

### RN-074 — `comment` é opcional
Avaliação só com estrelas é permitida.

### RN-075 — Visibilidade pública das reviews
Qualquer pessoa pode ler `reviews` (inclusive não autenticados).
**Onde:** policy `Anyone can view reviews` em [schema.sql](../../schema.sql#L195).

### RN-076 — Vínculo opcional com lead
`reviews.lead_id` pode referenciar o lead original que deu origem ao contato, mas é opcional.

### RN-077 — Atualização automática da nota do perito
Não atualize `profiles.rating` ou `profiles.reviews_count` manualmente — o trigger `review_created` faz isso (RN-023).

---

## 10. Favoritos

### RN-080 — Único por par cliente-perito
Não pode haver duas linhas em `favorites` para o mesmo `(client_id, expert_id)`.
**Onde:** constraint `unique(client_id, expert_id)` em [schema.sql](../../schema.sql#L256).

### RN-081 — Cliente gerencia seus próprios favoritos
Apenas o `client_id` da linha pode criar/remover.
**Onde:** policy `Clients can manage own favorites` em [schema.sql](../../schema.sql#L261).

### RN-082 — Lista de favoritos é pública
A contagem/lista de favoritos é legível por qualquer um (útil para exibir popularidade).

---

## 11. Disponibilidade e agendamento

### RN-090 — Slots por dia da semana
Cada slot em `availability` tem `day_of_week` (0=domingo … 6=sábado), `start_time` e `end_time`.
**Onde:** [schema.sql](../../schema.sql#L266-L275).

### RN-091 — Slots não duplicados
Não pode haver dois slots no mesmo `(expert_id, day_of_week, start_time)`.
**Onde:** constraint único em [schema.sql](../../schema.sql#L274).

### RN-092 — Slot pode ser desativado sem deletar
`active = false` desabilita o slot mantendo histórico.

### RN-093 — Perito gerencia somente sua disponibilidade
**Onde:** policy `Experts can manage own availability`.

---

## 12. Portfólio e certificações

### RN-100 — Portfólio é gerenciado pelo perito
Apenas o `expert_id` dono pode criar/editar/deletar itens em `portfolio_items`.

### RN-101 — Portfólio é público
Qualquer um pode ler. Use bucket público no Storage para `file_url`.

### RN-102 — Certificações
Cada certificado tem `name`, `issuing_organization`, `issue_date` obrigatórios. `expiration_date`, `credential_id`, `credential_url`, `document_url` são opcionais.
**Onde:** [schema.sql](../../schema.sql#L121-L133).

### RN-103 — Certificações exclusão em cascata
Deletar um perfil remove todos os certificados.

---

## 13. Serviços e precificação

### RN-110 — Unidades de preço suportadas
`expert_services.price_unit` ∈ `{hour, report, consultation, document, analysis, fixed}`.
**Onde:** check constraint em [schema.sql](../../schema.sql#L327).

### RN-111 — Moeda padrão
`currency` default `BRL`. Outras moedas são permitidas pelo schema mas a UI atual assume BRL.

### RN-112 — Serviços inativos
`is_active = false` esconde o serviço da listagem pública.

### RN-113 — Apenas o perito gerencia seus serviços
Policy `Experts can manage own services` (`expert_id = auth.uid()` na escrita).

### RN-114 — Admin pode gerenciar serviços de qualquer perito
Para moderação.

---

## 14. Notificações

### RN-120 — Estrutura mínima
`notifications` tem `type` e `title` obrigatórios; `body` e `data` (jsonb) opcionais.

### RN-121 — Cada usuário vê apenas as próprias
Policy `Users can view own notifications` (`auth.uid() = user_id`).

### RN-122 — Sistema cria; usuário marca lida
Insert é livre (system-driven). Update é permitido apenas pelo dono — usado para marcar `read = true`.

### RN-123 — Exclusão em cascata
Excluir o perfil remove suas notificações.

---

## 15. Administração

### RN-130 — Apenas ADMIN acessa o painel
Rotas sob `/admin/*` exigem `authGuard` + `adminGuard`.
**Onde:** [app.routes.ts](../../src/app/app.routes.ts#L15); [admin.guard.ts](../../src/app/guards/admin.guard.ts).

### RN-131 — Admin pode editar qualquer perfil
Policy `Admins can manage profiles` (acesso ALL).
**Onde:** [schema.sql](../../schema.sql#L78-L81).

### RN-132 — Áreas administrativas
O painel cobre: usuários (criar/editar), especialidades, tickets de suporte, logs de auditoria, peritos pendentes, páginas de conteúdo, broadcast, moderação, templates de e-mail, finanças, monitoramento e relatórios.
**Onde:** rotas filhas em [app.routes.ts](../../src/app/app.routes.ts#L16-L32).

### RN-133 — Moderação de conteúdo
Em [`/admin/moderation`](../../src/app/pages/admin-dashboard/) o admin pode revisar reviews, leads e portfólio reportados (regras específicas de moderação seguem o processo interno).

---

## 16. Auditoria

### RN-140 — Ações sensíveis devem ser logadas
Toda ação administrativa relevante (aprovar/rejeitar perito, bloquear/suspender conta, alterar status de quote em nome de terceiro, alterações de role) deve gravar uma linha em `audit_logs` com `user_id` (ator), `action` (rótulo) e `details` (jsonb com contexto).
**Onde:** tabela `audit_logs` em [schema.sql](../../schema.sql#L140-L146).

### RN-141 — Logs são imutáveis (na prática)
Apenas inserção é prevista. Não há policy de update/delete — não modifique logs depois de gravados.

### RN-142 — Apenas admins leem
Policy `Admin can view audit logs` em [schema.sql](../../schema.sql#L149-L151).

---

## 17. Segurança e dados pessoais

### RN-150 — SupabaseService como único portal
Toda interação com o backend passa pelo wrapper [`SupabaseService`](../../src/app/services/supabase.service.ts). Componentes não chamam `createClient` diretamente.
**Por quê:** uniformidade de erro, instrumentação, troca futura de provider.
**Onde:** regra em [claude.md](../../claude.md).

### RN-151 — Service-role key nunca no cliente
A SPA usa exclusivamente a `anon key`. Qualquer operação privilegiada deve passar por Edge Function ou RPC com `security definer`.

### RN-152 — RLS é a fonte de verdade da autorização
Guards do Angular são UX; autorização real é o RLS. Nunca desabilite RLS para conveniência.

### RN-153 — PII (dados pessoais)
Campos com dados pessoais (`first_name`, `last_name`, `full_name`, `email`, `contact_email`, `contact_phone`, `phone`, `cv_url`, `curriculum_url`) devem ser tratados conforme LGPD: minimização, finalidade, direito de exclusão (a exclusão em cascata da conta atende).

### RN-154 — Termos e privacidade
O usuário deve aceitar [Termos](../../src/app/pages/terms/) e [Política de Privacidade](../../src/app/pages/privacy/) no cadastro.

---

## 18. Integrações externas

### RN-160 — Cademí (LMS)
Integração de conteúdo educacional via [`cademi.service.ts`](../../src/app/services/cademi.service.ts). Tokens/segredos ficam em variáveis de ambiente (build-time) e nunca devem ser comitados.

### RN-161 — Hotmart
Integração de billing/vendas via [`hotmart.service.ts`](../../src/app/services/hotmart.service.ts). Mesma regra de segredos.

### RN-162 — E-mail transacional
Templates em [`email-templates.ts`](../../src/app/services/email-templates.ts). O envio efetivo é responsabilidade do Supabase Auth (e-mails de auth) ou de Edge Function dedicada (notificações de produto).

---

## 19. Matriz de permissões

Visão sintética por entidade. Detalhes nas policies de [schema.sql](../../schema.sql).

| Entidade            | Anônimo            | Cliente (CONTRATANTE)            | Perito (PERITO)                       | Admin              |
| ------------------- | ------------------ | -------------------------------- | -------------------------------------- | ------------------ |
| `profiles`          | Read (públicos)    | Read (todos), Write (próprio)    | Read (todos), Write (próprio)          | All                |
| `quotes`            | Insert             | Read/Update (próprio)            | Read/Update (recebidos)                | All (via admin)    |
| `messages`          | —                  | R/W (próprias quotes)            | R/W (próprias quotes)                  | All (via admin)    |
| `leads`             | —                  | Insert/Read (próprios)           | Read (recebidos)                       | All (via admin)    |
| `reviews`           | Read               | Insert/Read                      | Read                                   | All (via admin)    |
| `favorites`         | Read               | All (próprios)                   | Read                                   | All (via admin)    |
| `availability`      | Read               | Read                             | All (próprios)                         | All (via admin)    |
| `portfolio_items`   | Read               | Read                             | All (próprios)                         | All (via admin)    |
| `certificates`      | Read               | Read                             | All (próprios)                         | All (via admin)    |
| `expert_services`   | Read (ativos)      | Read (ativos)                    | All (próprios)                         | All                |
| `notifications`     | —                  | Read/Update (próprias)           | Read/Update (próprias)                 | All                |
| `audit_logs`        | —                  | —                                | —                                      | Read               |
| `specialties`       | Read               | Read                             | Read                                   | All                |
| `contact_submissions` | Insert           | Insert                           | Insert                                 | Read               |

> "All (via admin)" indica que o acesso é via policy `Admins can manage profiles` (ou equivalente) avaliando `profile_type = 'ADMIN'` do usuário autenticado.

---

## Como atualizar este documento

1. Adicione/edite regras mantendo o código `RN-XXX` estável.
2. Sempre cite a fonte autoritativa (linha do `schema.sql`, serviço, guard).
3. Se a regra mudar no código, atualize aqui na mesma PR.
4. Registre revisões em uma seção "Histórico" se a equipe adotar versionamento explícito.
