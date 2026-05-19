# Índices

## Existentes ([schema.sql](../../schema.sql))

| Índice                                | Tabela            | Coluna(s)     | Motivo                                     |
| ------------------------------------- | ----------------- | ------------- | ------------------------------------------ |
| `idx_expert_services_expert_id`       | `expert_services` | `expert_id`   | JOIN com profiles, lookup por dono         |
| `idx_expert_services_active`          | `expert_services` | `is_active`   | Filtro de listagem pública                 |

Mais as **constraints únicas** geram índices automaticamente:

- `profiles_contact_email_key` em `profiles.contact_email`.
- `favorites (client_id, expert_id)` único.
- `availability (expert_id, day_of_week, start_time)` único.
- `specialties.label` único.
- PKs em todas as tabelas.

## Recomendados (avaliar conforme volume)

| Tabela          | Coluna(s)                              | Tipo  | Justificativa                                                |
| --------------- | -------------------------------------- | ----- | ------------------------------------------------------------ |
| `profiles`      | `(profile_type, account_status, profile_visible)` | btree composto | Filtro padrão da listagem pública                          |
| `profiles`      | `specialty`                            | btree (ou gin se virar array) | Busca por especialidade                                    |
| `profiles`      | `(state, city)`                        | btree | Busca geográfica                                            |
| `profiles`      | `tags`                                 | gin   | `?` / `&&` em arrays                                        |
| `quotes`        | `expert_id`                            | btree | Listagem do perito                                          |
| `quotes`        | `requester_id`                         | btree | Listagem do cliente                                         |
| `quotes`        | `(status, created_at)`                 | btree | Dashboard admin / filtros                                   |
| `leads`         | `expert_id`                            | btree | Listagem do perito                                          |
| `leads`         | `client_id`                            | btree | Listagem do cliente                                         |
| `reviews`       | `expert_id`                            | btree | Mostrar reviews no perfil                                   |
| `messages`      | `quote_id`                             | btree | Carregar conversa                                           |
| `messages`      | `(quote_id, created_at)`               | btree | Ordenação cronológica                                       |
| `notifications` | `(user_id, read, created_at desc)`     | btree | Lista de notificações não lidas                             |
| `audit_logs`    | `(created_at desc)`                    | btree | Listagem reversa                                            |
| `audit_logs`    | `user_id`                              | btree | Filtrar por ator                                            |
| `availability`  | `expert_id`                            | btree | Já implícito no único composto, mas explícito ajuda planner |

## Princípios

1. **Indexe por filtros + ordenação reais.** Veja `pg_stat_statements` antes de criar.
2. **Composto > vários simples** quando os filtros aparecem juntos.
3. **Cuidado com índices em colunas muito atualizadas** (`updated_at`, `rating`) — adicionam custo em UPDATE.
4. **GIN para arrays/JSONB** quando você consulta com `?`, `@>`, `&&`.
5. **Parciais** ajudam quando a maioria das linhas não interessa:
   ```sql
   create index idx_profiles_active_visible on profiles(profile_type)
     where account_status = 'ACTIVE' and profile_visible = true;
   ```

## Monitoramento

```sql
-- Índices não utilizados (candidatos a remoção)
select schemaname, relname, indexrelname, idx_scan
from pg_stat_user_indexes
where schemaname = 'public'
order by idx_scan asc;

-- Sequencial scans pesados (candidatos a indexar)
select relname, seq_scan, seq_tup_read, idx_scan
from pg_stat_user_tables
where schemaname = 'public'
order by seq_tup_read desc
limit 20;

-- Tamanho dos índices
select schemaname, relname, indexrelname, pg_size_pretty(pg_relation_size(indexrelid))
from pg_stat_user_indexes
where schemaname='public'
order by pg_relation_size(indexrelid) desc
limit 20;
```

Rodar revisão **mensal**. Documentar mudanças em migrations.
