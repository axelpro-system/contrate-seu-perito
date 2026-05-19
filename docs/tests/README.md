# Estratégia de Testes

| Documento                                  | Conteúdo                                              |
| ------------------------------------------ | ----------------------------------------------------- |
| [strategy.md](strategy.md)                 | Pirâmide, escopos, ferramentas, mínimos de cobertura  |
| [unit.md](unit.md)                         | Padrões de testes unitários (Vitest)                  |
| [integration.md](integration.md)           | Testes de integração com Supabase (local stack)       |
| [e2e.md](e2e.md)                           | Testes end-to-end (Playwright proposto)               |
| [rls-tests.md](rls-tests.md)               | Testar policies RLS no Postgres                       |
| [coverage.md](coverage.md)                 | Metas, instrumentação, gates de CI                    |

> Princípio: **teste o que importa**. Cobrir 100% de getters não traz valor; cobrir 0% de fluxos de pagamento, sim.
