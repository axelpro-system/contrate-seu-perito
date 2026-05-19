# Endpoints REST

Recursos expostos via PostgREST. Verbo HTTP → método SQL:

| HTTP    | SDK                 | SQL                                                       |
| ------- | ------------------- | --------------------------------------------------------- |
| `GET`   | `.select()`         | `SELECT`                                                  |
| `POST`  | `.insert()`         | `INSERT`                                                  |
| `PATCH` | `.update()`         | `UPDATE`                                                  |
| `DELETE`| `.delete()`         | `DELETE`                                                  |
| `POST /rpc/<fn>` | `.rpc(name)` | `SELECT fn(...)`                                          |

Permissões reais vêm das policies RLS — abaixo, "Permitido a" reflete intenção (não substitui consulta às policies).

---

## `/profiles`

Perfis de usuário. Veja [database/schema.md](../database/schema.md#profiles).

| Operação | Permitido a                            | Observações                                       |
| -------- | -------------------------------------- | ------------------------------------------------- |
| GET (público) | qualquer um                       | Apenas peritos `ACTIVE` + `profile_visible=true`  |
| GET (auth)    | usuário autenticado               | Vê todos os perfis                                |
| POST          | qualquer (insert livre)           | Em prática vem do trigger `handle_new_user`       |
| PATCH         | dono (`auth.uid()=id`) ou ADMIN   | Não permitir alterar `is_verified`/`is_featured` no cliente |
| DELETE        | cascata via `auth.users`          | Não chamar diretamente                            |

**Exemplo — buscar peritos por especialidade:**

```ts
client.from('profiles')
  .select('id, full_name, specialty, city, state, rating, avatar_url, tags')
  .eq('profile_type', 'PERITO')
  .eq('account_status', 'ACTIVE')
  .eq('profile_visible', true)
  .ilike('specialty', `%${term}%`)
  .order('rating', { ascending: false });
```

---

## `/quotes`

Orçamentos.

| Operação | Permitido a                                  | Observações                                  |
| -------- | -------------------------------------------- | -------------------------------------------- |
| GET      | `expert_id = uid` ou `requester_id = uid`    | Cada lado vê o que é seu                     |
| POST     | qualquer (incl. anônimo)                     | Campos obrigatórios: requester_name/email, case_description, expert_id |
| PATCH    | perito (campos da proposta) ou cliente (status) | Trigger `quote_approved` gera service_completion |

**Payload mínimo:**

```json
{
  "expert_id": "uuid",
  "requester_name": "Carla Souza",
  "requester_email": "carla@exemplo.com",
  "case_description": "Perícia grafotécnica em contrato..."
}
```

---

## `/leads`

Contatos iniciais.

| Operação | Permitido a                                  | Observações                                  |
| -------- | -------------------------------------------- | -------------------------------------------- |
| GET      | `expert_id = uid` ou `client_id = uid`       |                                              |
| POST     | usuário autenticado                          | `expert_id`, `client_id`, `message` obrigatórios |

---

## `/messages`

Chat dentro de uma quote.

| Operação | Permitido a                                  | Observações                                  |
| -------- | -------------------------------------------- | -------------------------------------------- |
| GET      | participantes da `quote`                     | RLS via subselect na `quotes`                |
| POST     | participantes da `quote`                     | Vai disparar notificação em Realtime         |
| PATCH    | participantes                                | Para marcar `read = true`                    |

---

## `/reviews`

Avaliações.

| Operação | Permitido a                | Observações                                                          |
| -------- | -------------------------- | -------------------------------------------------------------------- |
| GET      | qualquer um                | Públicas                                                             |
| POST     | qualquer (RLS permissivo)  | **RN-073:** `reviewer_name` vem do perfil do cliente, não do input  |
| DELETE   | n/a                        | Não excluímos reviews da API; admin atua via dashboard               |

---

## `/favorites`

| Operação | Permitido a            | Observações                            |
| -------- | ---------------------- | -------------------------------------- |
| GET      | qualquer um            | Lista pública (popularidade)           |
| POST     | `client_id = uid`      | Único por par cliente-perito           |
| DELETE   | `client_id = uid`      |                                        |

---

## `/availability`

| Operação | Permitido a            | Observações                                            |
| -------- | ---------------------- | ------------------------------------------------------ |
| GET      | qualquer um            |                                                        |
| POST/PATCH/DELETE | `expert_id = uid` | `day_of_week ∈ [0,6]`, único por (expert, dow, start) |

---

## `/portfolio_items`, `/certificates`, `/expert_services`

Mesmo padrão: leitura pública, escrita restrita ao dono (`expert_id = uid` ou `profile_id = uid`).

---

## `/specialties`

| Operação | Permitido a   | Observações                |
| -------- | ------------- | -------------------------- |
| GET      | qualquer um   |                            |
| POST/PATCH/DELETE | ADMIN | Via painel administrativo |

---

## `/notifications`

| Operação | Permitido a            | Observações                                |
| -------- | ---------------------- | ------------------------------------------ |
| GET      | `user_id = uid`        |                                            |
| POST     | qualquer (sistema)     | Geralmente disparado por outro serviço     |
| PATCH    | `user_id = uid`        | Marcar `read = true`                       |

---

## `/contact_submissions`

| Operação | Permitido a   | Observações                          |
| -------- | ------------- | ------------------------------------ |
| POST     | qualquer um   | Formulário público de contato        |
| GET      | ADMIN         | Lido no painel de moderação          |

---

## `/audit_logs`

Apenas ADMIN lê. Inserts vêm da própria aplicação ao realizar ações sensíveis.

---

## RPCs

Funções SQL chamadas via `.rpc()`. Ver [rpcs.md](rpcs.md).

- `get_featured_experts(limit_count int)` — peritos públicos em ordem aleatória.

---

## Endpoints de auth

Não usam PostgREST. Ver [auth.md](auth.md):

- `POST /auth/v1/signup`
- `POST /auth/v1/token` (login)
- `POST /auth/v1/recover`
- `POST /auth/v1/logout`
- `GET /auth/v1/user`
- OAuth providers via `/auth/v1/authorize?provider=...`
