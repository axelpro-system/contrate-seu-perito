# RB-020 — Suspeita de vazamento por RLS

## Sintomas

- Usuário relata ver dados de outra pessoa.
- Bug report ou pentest indica acesso indevido.
- Teste de RLS quebrou em CI.

## Severidade

**P1**. Risco de violação LGPD.

## Confirmação rápida

1. **Reproduzir** com conta de teste:
   - Logue como usuário A.
   - Tente acessar recurso do usuário B (via URL direta ou DevTools).
   - Se conseguir → confirmado.
2. **Conferir policies da tabela:**
   ```sql
   select * from pg_policies where schemaname='public' and tablename='<tabela>';
   ```
3. **Verificar audit_logs** se houve acesso anômalo recente:
   ```sql
   select * from audit_logs where created_at > now() - interval '24 hours' order by created_at desc;
   ```

## Mitigação imediata

Se a brecha está confirmada e é grave:

1. **Endurecer a policy temporariamente:**
   ```sql
   alter policy "<nome>" on public.<tabela> using (false);   -- bloqueia geral
   ```
   ou criar policy específica.
2. **Avaliar trade-off:** bloquear feature inteira pode ser pior. Discutir com lead.
3. **Desabilitar feature flag** que expõe o recurso, se aplicável.

## Correção

1. Reescrever policy correta:
   ```sql
   drop policy "<nome>" on public.<tabela>;
   create policy "<nome v2>" on public.<tabela>
     for select using (<predicado correto>);
   ```
2. Adicionar teste de RLS cobrindo o caso (positivo + negativo) em [tests/rls-tests.md](../tests/rls-tests.md).
3. Aplicar via migration ([database/migrations.md](../database/migrations.md)).

## Avaliar impacto

```sql
-- linhas acessadas indevidamente nos últimos N dias (se houver instrumentação)
-- ou estimar via padrões de log
```

Se PII vazou para terceiros → seguir [data-breach.md](data-breach.md).

## Comunicação

- Interna: `#engineering`, tech lead, DPO.
- Externa: depende do impacto — DPO orienta.

## Pós-incidente

1. Post-mortem cobrindo:
   - Quando a policy entrou (commit / migration).
   - Por que passou na revisão.
   - Por que teste não pegou.
2. **Ações:**
   - Cobrir gap nos testes de RLS.
   - Revisar **todas** as policies de tabelas correlatas.
   - Se padrão de erro: revisar checklist de PR para mudanças em RLS.
