# 05 — Glossário

## Domínio

| Termo                  | Definição                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| **Perito**             | Profissional técnico (engenharia, grafotécnica, etc.) cadastrado para oferecer serviços.   |
| **Contratante**        | Usuário que busca e contrata peritos. Sinônimo: cliente.                                   |
| **Lead**               | Contato inicial enviado pelo cliente ao perito.                                            |
| **Quote**              | Orçamento formal — descreve caso, valor proposto, prazo.                                   |
| **Service completion** | Registro de quote `approved` concluída. Habilita avaliação.                                |
| **Review**             | Avaliação 1-5 estrelas que o cliente deixa ao perito.                                      |
| **Especialidade**      | Categoria de perícia. Catálogo controlado por admin.                                       |
| **Portfólio**          | Itens (imagens/docs) que o perito publica para demonstrar trabalho.                        |
| **Disponibilidade**    | Slots de horário em que o perito atende.                                                   |

## Técnico

| Termo                  | Definição                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| **SPA**                | Single-Page Application — frontend Angular.                                                |
| **SDK**                | Aqui, `@supabase/supabase-js` (cliente JS).                                                |
| **PostgREST**          | API REST que o Supabase expõe sobre o Postgres.                                            |
| **RLS**                | Row-Level Security — policies SQL que filtram linhas por usuário.                          |
| **JWT**                | JSON Web Token de auth, emitido pelo Supabase Auth.                                        |
| **anon key**           | Chave pública que o frontend usa. Acesso passa por RLS.                                    |
| **service_role**       | Chave administrativa do Supabase. **Nunca** no frontend.                                   |
| **Realtime**           | CDC do Postgres exposto via WebSocket pelo Supabase.                                       |
| **RPC**                | Remote Procedure Call — função SQL chamada via PostgREST.                                  |
| **CDC**                | Change Data Capture — captura de mudanças no banco.                                        |
| **Standalone**         | Componente Angular sem `NgModule`.                                                          |
| **Lazy route**         | Rota que carrega o componente por demanda (code splitting).                                |

## Operacional

| Termo                  | Definição                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| **PR**                 | Pull Request.                                                                              |
| **CI/CD**              | Integração e entrega contínuas.                                                            |
| **ADR**                | Architecture Decision Record — registro de decisão arquitetural.                           |
| **Runbook**            | Procedimento operacional documentado.                                                      |
| **PII**                | Personally Identifiable Information — dados que identificam pessoa.                        |
| **LGPD**               | Lei Geral de Proteção de Dados (Lei 13.709/2018).                                          |
| **DPO**                | Data Protection Officer — responsável por LGPD.                                            |
| **DPA**                | Data Processing Agreement — contrato com operador de dados.                                |
| **RPO/RTO**            | Recovery Point/Time Objective — métricas de DR.                                            |
| **TTL**                | Time To Live — validade de um recurso (URL assinada, cache).                               |

## Convenções de código

| Sigla / abrev.         | Significado                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| `RN-XXX`               | Código de regra de negócio. Ver [business-rules/](../business-rules/regras-de-negocio.md). |
| `ADR-XXXX`             | Architecture Decision Record. Ver [decisions/](../decisions/).                             |
| `RB-XXX`               | Runbook. Ver [runbooks/](../runbooks/).                                                    |
