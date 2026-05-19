# Schema do Banco de Dados

Documentação navegável das tabelas. **Fonte autoritativa: [schema.sql](../../schema.sql).** Se este documento divergir, o `schema.sql` vence.

## Enums

```sql
profile_type   = 'PERITO' | 'CONTRATANTE' | 'ADMIN'
account_status = 'ACTIVE' | 'BLOCKED' | 'PENDING' | 'REJECTED' | 'SUSPENDED'
quote_status   = 'submitted' | 'under_review' | 'approved' | 'rejected'
```

---

## profiles

Espelho de `auth.users` com dados de produto. 1:1 com usuário, cascade ao deletar.

| Coluna                | Tipo                 | Notas                                                                  |
| --------------------- | -------------------- | ---------------------------------------------------------------------- |
| `id`                  | uuid PK              | FK `auth.users(id) ON DELETE CASCADE`                                  |
| `first_name`          | text                 |                                                                        |
| `last_name`           | text                 |                                                                        |
| `full_name`           | text                 | Usado em listagens e em `reviews.reviewer_name` (RN-073)               |
| `email`               | text                 |                                                                        |
| `avatar_url`          | text                 | URL pública do bucket `avatars`                                        |
| `specialty`           | text                 |                                                                        |
| `location/city/state` | text                 |                                                                        |
| `phone`               | text                 |                                                                        |
| `bio`                 | text                 |                                                                        |
| `certifications`      | jsonb default `[]`   | Estrutura livre legada; preferir tabela `certificates`                 |
| `contact_email`       | text **UNIQUE**      | Constraint `profiles_contact_email_key`                                |
| `contact_phone`       | text                 |                                                                        |
| `curriculum_url`/`cv_url` | text             | Bucket privado                                                         |
| `expertise_areas`     | text                 |                                                                        |
| `rating`              | numeric default 0    | **Derivado** — atualizado pelo trigger `update_expert_rating`          |
| `reviews_count`       | integer default 0    | **Derivado** — mesmo trigger                                           |
| `hourly_rate`         | numeric              | Legado; usar `expert_services`                                         |
| `availability_status` | text default `available` |                                                                    |
| `linkedin_url`/`social_linkedin`/`social_website`/`website_url` | text |                                                  |
| `profile_visible`     | boolean default false| Controla aparição pública                                              |
| `profile_type`        | profile_type default `PERITO` |                                                               |
| `account_status`      | account_status default `PENDING` |                                                            |
| `approved_at`         | timestamptz          | Preenchido na aprovação                                                |
| `approved_by`         | uuid → profiles(id)  | Admin que aprovou                                                      |
| `tags`/`credential_tags`/`specialty_demands`/`work_types` | text[] |                                                |
| `registration_number` | text                 | CRC, CREA, OAB, etc.                                                   |
| `is_verified`         | boolean default false| Controlado por admin                                                   |
| `is_featured`         | boolean default false| Controlado por admin                                                   |
| `created_at`/`updated_at` | timestamptz      |                                                                        |

---

## quotes

Pedidos de orçamento.

| Coluna                | Tipo                 | Notas                                                                  |
| --------------------- | -------------------- | ---------------------------------------------------------------------- |
| `id`                  | uuid PK              |                                                                        |
| `expert_id`           | uuid NOT NULL → profiles |                                                                    |
| `requester_id`        | uuid → profiles      | Nullable (orçamento anônimo permitido)                                 |
| `requester_name`      | text NOT NULL        |                                                                        |
| `requester_email`     | text NOT NULL        |                                                                        |
| `requester_phone`     | text                 |                                                                        |
| `case_description`    | text NOT NULL        |                                                                        |
| `status`              | quote_status default `submitted` |                                                            |
| `proposed_value`      | numeric              | Preenchido pelo perito                                                 |
| `proposed_deadline`   | text                 |                                                                        |
| `expert_notes`        | text                 |                                                                        |
| `responded_at`        | timestamptz          |                                                                        |
| `created_at`/`updated_at` | timestamptz      | `updated_at` via trigger                                               |

Trigger `quote_approved`: ao virar `approved`, cria `service_completions`.

---

## leads

Contato inicial cliente → perito.

| Coluna       | Tipo                       | Notas                              |
| ------------ | -------------------------- | ---------------------------------- |
| `id`         | uuid PK                    |                                    |
| `expert_id`  | uuid NOT NULL → profiles   |                                    |
| `client_id`  | uuid NOT NULL → profiles   |                                    |
| `message`    | text NOT NULL              |                                    |
| `status`     | text default `pending`     | Texto livre; padronizar via app    |
| `created_at`/`updated_at` | timestamptz   |                                    |

---

## reviews

Avaliações pós-serviço. **Regra crítica RN-073:** `reviewer_name` vem do perfil do cliente.

| Coluna           | Tipo                       | Notas                                                |
| ---------------- | -------------------------- | ---------------------------------------------------- |
| `id`             | uuid PK                    |                                                      |
| `expert_id`      | uuid NOT NULL → profiles   |                                                      |
| `client_id`      | uuid NOT NULL → profiles   |                                                      |
| `rating`         | integer NOT NULL           | `CHECK (rating BETWEEN 1 AND 5)`                     |
| `comment`        | text                       |                                                      |
| `lead_id`        | uuid → leads               | Opcional, rastreia origem                            |
| `created_at`     | timestamptz                |                                                      |

> A coluna `reviewer_name` aparece em [claude.md](../../claude.md) como NOT NULL. O `schema.sql` atual não a tem explícita em `reviews` — verificar consistência antes de inserir. Esta inconsistência está rastreada em [findings.md](../../findings.md).

Trigger `review_created`: atualiza `profiles.rating` e `profiles.reviews_count`.

---

## service_completions

Registro de quotes aprovadas (origem para review).

| Coluna                | Tipo                       | Notas                          |
| --------------------- | -------------------------- | ------------------------------ |
| `id`                  | uuid PK                    |                                |
| `quote_id`            | uuid NOT NULL → quotes     |                                |
| `expert_id`           | uuid NOT NULL → profiles   |                                |
| `client_id`           | uuid NOT NULL → profiles   |                                |
| `completed_at`        | timestamptz default now()  |                                |
| `review_reminder_sent`| boolean default false      |                                |
| `review_id`           | uuid → reviews             | Link bidirecional opcional     |

---

## messages

Chat dentro de uma `quote`. `ON DELETE CASCADE` ao remover a quote.

| Coluna        | Tipo                       | Notas |
| ------------- | -------------------------- | ----- |
| `id`          | uuid PK                    |       |
| `quote_id`    | uuid NOT NULL → quotes     |       |
| `sender_id`   | uuid NOT NULL → profiles   |       |
| `content`     | text NOT NULL              |       |
| `read`        | boolean default false      |       |
| `created_at`  | timestamptz                |       |

---

## favorites

Único por par `(client_id, expert_id)`.

| Coluna        | Tipo                       | Notas                     |
| ------------- | -------------------------- | ------------------------- |
| `id`          | uuid PK                    |                           |
| `client_id`   | uuid NOT NULL → profiles   | `ON DELETE CASCADE`       |
| `expert_id`   | uuid NOT NULL → profiles   | `ON DELETE CASCADE`       |
| `created_at`  | timestamptz                |                           |

---

## availability

| Coluna         | Tipo                       | Notas                            |
| -------------- | -------------------------- | -------------------------------- |
| `id`           | uuid PK                    |                                  |
| `expert_id`    | uuid NOT NULL → profiles   | `ON DELETE CASCADE`              |
| `day_of_week`  | smallint NOT NULL          | `CHECK (BETWEEN 0 AND 6)`         |
| `start_time`   | time NOT NULL              |                                  |
| `end_time`     | time NOT NULL              |                                  |
| `active`       | boolean default true       |                                  |

UNIQUE `(expert_id, day_of_week, start_time)`.

---

## portfolio_items

| Coluna        | Tipo                       | Notas |
| ------------- | -------------------------- | ----- |
| `id`          | uuid PK                    |       |
| `expert_id`   | uuid NOT NULL → profiles   | cascade |
| `title`       | text NOT NULL              |       |
| `description` | text                       |       |
| `file_url`    | text                       |       |
| `file_type`   | text                       |       |
| `created_at`  | timestamptz                |       |

---

## certificates

| Coluna                  | Tipo            | Notas                          |
| ----------------------- | --------------- | ------------------------------ |
| `id`                    | uuid PK         |                                |
| `profile_id`            | uuid NOT NULL → profiles | cascade               |
| `name`                  | varchar(255) NOT NULL |                          |
| `issuing_organization`  | varchar(255) NOT NULL |                          |
| `issue_date`            | date NOT NULL   |                                |
| `expiration_date`       | date            |                                |
| `credential_id`         | varchar(255)    |                                |
| `credential_url`        | text            |                                |
| `description`           | text            |                                |
| `document_url`          | text            | Bucket apropriado              |
| `created_at`            | timestamptz     |                                |

---

## expert_services

Catálogo de serviços que o perito oferece.

| Coluna          | Tipo                       | Notas                                                                 |
| --------------- | -------------------------- | --------------------------------------------------------------------- |
| `id`            | uuid PK                    |                                                                       |
| `expert_id`     | uuid NOT NULL → profiles   | cascade                                                               |
| `service_name`  | text NOT NULL              |                                                                       |
| `description`   | text                       |                                                                       |
| `base_price`    | numeric                    |                                                                       |
| `price_unit`    | text default `hour`        | `CHECK IN ('hour','report','consultation','document','analysis','fixed')` |
| `currency`      | text default `BRL`         |                                                                       |
| `is_active`     | boolean default true       |                                                                       |
| `display_order` | integer default 0          |                                                                       |
| `created_at`/`updated_at` | timestamptz      | `updated_at` via trigger                                              |

---

## specialties

Catálogo controlado por admin.

| Coluna      | Tipo                    | Notas        |
| ----------- | ----------------------- | ------------ |
| `id`        | uuid PK                 |              |
| `label`     | text NOT NULL UNIQUE    |              |
| `active`    | boolean default true    |              |
| `created_at`| timestamptz             |              |

---

## notifications

| Coluna      | Tipo                       | Notas                          |
| ----------- | -------------------------- | ------------------------------ |
| `id`        | uuid PK                    |                                |
| `user_id`   | uuid NOT NULL → profiles   | cascade                        |
| `type`      | text NOT NULL              | Categorizar por convenção      |
| `title`     | text NOT NULL              |                                |
| `body`      | text                       |                                |
| `data`      | jsonb                      | Payload arbitrário             |
| `read`      | boolean default false      |                                |
| `created_at`| timestamptz                |                                |

---

## audit_logs

| Coluna      | Tipo                | Notas                                  |
| ----------- | ------------------- | -------------------------------------- |
| `id`        | uuid PK             |                                        |
| `user_id`   | uuid → profiles     | Ator                                   |
| `action`    | text NOT NULL       | Rótulo padronizado (ex.: `expert.approve`) |
| `details`   | jsonb               | Contexto da ação                       |
| `created_at`| timestamptz         |                                        |

Append-only por convenção (sem policies de update/delete).

---

## contact_submissions

Formulário público de contato.

| Coluna      | Tipo            | Notas |
| ----------- | --------------- | ----- |
| `id`        | uuid PK         |       |
| `name`      | text NOT NULL   |       |
| `email`     | text NOT NULL   |       |
| `subject`   | text NOT NULL   |       |
| `message`   | text NOT NULL   |       |
| `created_at`| timestamptz     |       |

---

## Próximos passos sugeridos no schema

1. **Padronizar `reviews.reviewer_name`** — alinhar `schema.sql` com [claude.md](../../claude.md) (NOT NULL).
2. **Constraints faltantes:** `leads.status` poderia ser enum em vez de texto livre.
3. **Particionamento futuro** de `messages` e `audit_logs` quando volume justificar.
