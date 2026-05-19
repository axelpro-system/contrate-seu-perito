# RB-070 — Degradação de Performance

## Sintomas

- Páginas lentas (TTFB alto, p95 > 2s).
- Queries demorando.
- Usuários reclamando.
- Métrica de latência p95 acima do alerta.

## Severidade

**P2** geralmente. **P1** se app praticamente travado.

## Confirmação rápida

1. Painel Supabase → Database → Query Performance.
2. Identificar **top queries por tempo total** e **top por chamadas**.
3. DevTools no app → Network: quais requests são lentas?

## Diagnóstico

### Banco

```sql
-- Top queries por tempo total
select query, calls, total_exec_time, mean_exec_time, rows
from pg_stat_statements
order by total_exec_time desc
limit 20;

-- Tabelas com muito seq_scan
select relname, seq_scan, seq_tup_read, idx_scan
from pg_stat_user_tables
where schemaname='public'
order by seq_tup_read desc
limit 20;

-- Conexões abertas
select count(*) from pg_stat_activity;
```

### Causas comuns

| Causa                                  | Sintoma típico                              | Ação                                                  |
| -------------------------------------- | ------------------------------------------- | ----------------------------------------------------- |
| Índice faltando                        | seq_scan alto em tabela grande              | Criar índice (CONCURRENTLY em prod)                   |
| Query nova ineficiente                 | Top em `pg_stat_statements`                 | Reescrever ou indexar                                 |
| Bundle grande                          | LCP alto, TTI alto                          | Verificar budget; lazy loading                        |
| Imagens não otimizadas                 | Network mostra MBs em imagens               | Resize no upload; `NgOptimizedImage`                  |
| Realtime saturado                      | Conexões > limite                           | Reduzir canais ou aumentar plano                      |
| Conexões DB exauridas                  | `pg_stat_activity` próximo do limite       | Procurar leak; reiniciar (último caso)                |

## Mitigação

- Reverter deploy se a degradação coincide.
- Adicionar índice CONCURRENTLY se identificado.
- Reduzir frequência de polling/auto-refresh no app.

## Correção

1. Para queries: explicar (`EXPLAIN (ANALYZE, BUFFERS) ...`), criar índice, ou refatorar.
2. Para bundle: revisar imports pesados, lazy chunks.
3. Para imagens: pipeline de otimização no upload.

## Pós-incidente

- Adicionar query ao monitoramento de slow queries.
- Atualizar [database/indexes.md](../database/indexes.md) com a decisão.
- Considerar `EXPLAIN` em PR review para queries novas pesadas.
