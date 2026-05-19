# RB-050 — Migration falhou em produção

## Sintomas

- Pipeline de release falhou no passo "Apply DB migrations".
- App em produção retornando erros consistentes em tabelas/colunas específicas.
- Diferença entre `staging` (ok) e `prod` (quebrado).

## Severidade

**P1** se migration parcial deixou o banco inconsistente.

## Confirmação rápida

1. Log do pipeline: qual SQL falhou e por quê.
2. Painel Supabase → Database → Logs → erro completo.
3. Conferir estado atual:
   ```sql
   \d public.<tabela>
   select * from supabase_migrations.schema_migrations order by version desc limit 5;
   ```

## Cenários

### A) Migration falhou antes de qualquer mudança

- O banco está íntegro.
- **Mitigação:** corrigir o SQL e reaplicar.
- Frontend ainda em versão anterior — sem impacto a usuários.

### B) Migration aplicou parcialmente

Pior caso. Postgres é transacional por statement; algumas operações (CREATE INDEX CONCURRENTLY, certos `ALTER`) **não** rodam em transação.

- **Mitigação:**
  1. Avaliar o que rodou e o que não rodou.
  2. Escrever **forward fix**: SQL idempotente que leva o banco ao estado correto.
  3. Aplicar via SQL Editor (com confirmação de outro engenheiro).
  4. Marcar migration como aplicada se o pipeline trava (`insert into supabase_migrations.schema_migrations(version, name) values (...)`).

### C) Migration aplicou tudo mas quebrou a app

- App esperava schema antigo.
- **Mitigação:**
  - Rollback do deploy do frontend (volta versão que conhecia o schema atual).
  - Se schema novo é necessário para frontend velho funcionar, então é bug — corrigir e redeplir.
  - Ou aplicar **down migration** se for reversível.

## Comunicação

- `#engineering`: descrição do estado + plano.
- `#deploys`: status do release.

## Restaurar de backup (caso extremo)

Se a inconsistência é severa e o forward fix é complexo, considerar restore (ver [restore-from-backup.md](restore-from-backup.md)) — perde gravações desde o backup.

## Prevenção

- Migrations **sempre** testadas em staging com snapshot recente de prod.
- Migrations não-transacionais (CONCURRENTLY) ficam em arquivos separados.
- Adicionar `BEGIN;` / `COMMIT;` explícito quando aplicável.
- Two-phase migrations (expand → contract) — ver [database/migrations.md](../database/migrations.md).

## Pós-incidente

- Análise: por que passou em staging? Volume de dados? Concorrência?
- Adicionar teste/validação que pegaria.
