# Banco de Dados

PostgreSQL gerenciado pelo Supabase. Fonte autoritativa do schema: [schema.sql](../../schema.sql).

| Documento                                | Conteúdo                                                            |
| ---------------------------------------- | ------------------------------------------------------------------- |
| [schema.md](schema.md)                   | Tabelas, colunas, tipos, FKs, constraints                           |
| [erd.md](erd.md)                         | Diagrama entidade-relacionamento                                    |
| [rls.md](rls.md)                         | Policies de Row-Level Security                                      |
| [triggers.md](triggers.md)               | Triggers e funções (handle_new_user, update_expert_rating, …)       |
| [indexes.md](indexes.md)                 | Estratégia de indexação                                             |
| [migrations.md](migrations.md)           | Política de migrações e versionamento                               |
| [seed.md](seed.md)                       | Dados de seed para dev e teste                                      |

> Princípio: o banco é a **fonte de verdade** das regras de integridade. Não confie em validação só do cliente.
