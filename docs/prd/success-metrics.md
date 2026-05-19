# Métricas de Sucesso

> Estas são as métricas que pretendemos acompanhar. A instrumentação efetiva é responsabilidade de cada PR que toca o fluxo.

## North Star

**Conversas qualificadas iniciadas por semana** — número de `leads` criados que evoluem para ao menos 3 mensagens trocadas entre cliente e perito.

Por que essa métrica: captura **descoberta + intenção + engajamento**. Volume puro de cadastro é vaidade; conversa qualificada indica valor entregue.

## KPIs por dimensão

### Aquisição

| Métrica                                | Definição                                           | Fonte                          |
| -------------------------------------- | --------------------------------------------------- | ------------------------------ |
| Novos cadastros / semana               | `count(auth.users) WHERE created_at >= week_start`  | Supabase Auth                  |
| Razão Perito : Contratante             | Saudável quando 1 perito : 3+ contratantes          | `profiles.profile_type`        |
| Origem do tráfego                      | Direto / SEO / referência / pago                    | Analytics (a definir)          |

### Ativação

| Métrica                                | Definição                                           | Fonte                          |
| -------------------------------------- | --------------------------------------------------- | ------------------------------ |
| % peritos que completam onboarding     | `profile_visible=true` / total peritos              | `profiles`                     |
| Tempo médio até primeira aprovação     | `approved_at - created_at` (peritos)                | `profiles`                     |
| % contratantes que enviam ≥ 1 lead     | `distinct(client_id) em leads` / total contratantes | `leads` + `profiles`           |

### Engajamento

| Métrica                                | Definição                                           | Fonte                          |
| -------------------------------------- | --------------------------------------------------- | ------------------------------ |
| **Conversas qualificadas / semana**    | Leads com ≥ 3 mensagens trocadas                    | `leads` + `messages`           |
| Tempo médio de resposta do perito      | Primeira mensagem do perito após criação do lead    | `messages`                     |
| Quotes `approved` / quotes `submitted` | Taxa de aprovação de orçamentos                     | `quotes`                       |

### Retenção

| Métrica                                | Definição                                           | Fonte                          |
| -------------------------------------- | --------------------------------------------------- | ------------------------------ |
| Peritos ativos / mês                   | Login ≥ 1x no mês (proxy: última atualização)       | `auth.users.last_sign_in_at`   |
| Contratantes recorrentes               | ≥ 2 leads em janelas de 90 dias                     | `leads`                        |
| NPS (peritos e contratantes)           | Pesquisa trimestral                                 | Fora da plataforma             |

### Qualidade

| Métrica                                | Definição                                           | Fonte                          |
| -------------------------------------- | --------------------------------------------------- | ------------------------------ |
| Rating médio da plataforma             | `AVG(reviews.rating)`                               | `reviews`                      |
| % avaliações ≥ 4 estrelas              | `count(rating>=4) / count(*)`                       | `reviews`                      |
| Tickets de suporte / 1k usuários ativos| Volume relativo                                     | `support_ticket` tabela        |
| Tempo de aprovação de perito           | Mediana de `approved_at - created_at`               | `profiles`                     |

## Metas iniciais (primeiros 90 dias pós-launch)

| KPI                                | Meta                |
| ---------------------------------- | ------------------- |
| Peritos `ACTIVE`                   | 100                 |
| Contratantes cadastrados           | 300                 |
| Conversas qualificadas / semana    | 25                  |
| Rating médio                       | ≥ 4.3               |
| Tempo de aprovação de perito       | ≤ 24h úteis (P50)   |

## Anti-métricas (evitar)

- **Volume de cadastro sem intenção:** cadastrar 10k usuários inativos não é sucesso.
- **GMV inexistente:** como não processamos pagamento, GMV não se aplica em V1.
- **Tempo na plataforma:** maior tempo pode significar **dificuldade**, não engajamento.

## Como instrumentar

1. Consultas agregadas vivem em **views** ou **RPCs** no Postgres (não na SPA).
2. Painel admin em [`/admin/reports`](../../src/app/pages/admin-dashboard/) consome essas views.
3. Para analytics web (origem, conversão de páginas), avaliar adoção de ferramenta externa (registrar em ADR antes de incluir).
