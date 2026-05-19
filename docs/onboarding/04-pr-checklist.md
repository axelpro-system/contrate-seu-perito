# 04 — Checklist de PR

## Antes de abrir

- [ ] **Escopo coerente.** Uma PR = um propósito. Não misturar refactor + feature + fix.
- [ ] **Branch atualizada com `main`.** Rebase ou merge — sem conflitos.
- [ ] **Commits limpos.** Mensagens semânticas; sem `wip` / `fix typo` espalhados.
- [ ] **`npx prettier --check .`** passa.
- [ ] **`npm test -- --run`** passa.
- [ ] **`npm run build`** passa sem warnings.
- [ ] **Sem console.log** esquecido.
- [ ] **Sem segredos** no diff (peguei no `grep -i secret`?).

## Conteúdo da PR

- [ ] **Título claro.** Imperativo e curto. Ex.: `feat: adiciona filtro por estado na busca de peritos`.
- [ ] **Descrição:**
  - O que muda.
  - Por quê.
  - Como testar manualmente.
  - Screenshots/vídeo se UI.
  - Issues / discussões relacionadas.
- [ ] **Tamanho razoável.** Acima de ~400 linhas de diff, considere dividir.

## Específico por tipo

### Mudança em DB / schema

- [ ] Migration adicionada em `supabase/migrations/`.
- [ ] [schema.sql](../../schema.sql) atualizado se for fonte autoritativa em uso.
- [ ] Reversibilidade pensada (down migration ou plano).
- [ ] Política RLS atualizada se mudou tabela com RLS.
- [ ] Testes em [tests/rls-tests.md](../tests/rls-tests.md) se policy mudou.
- [ ] ADR se for mudança estrutural.

### Mudança em RLS / segurança

- [ ] Caso positivo testado.
- [ ] **Caso negativo testado** (não-autorizado é rejeitado).
- [ ] Documentação em [database/rls.md](../database/rls.md) e/ou [security/](../security/) atualizada.

### Mudança em fluxo de negócio

- [ ] Regra `RN-XXX` atualizada em [business-rules/regras-de-negocio.md](../business-rules/regras-de-negocio.md).
- [ ] Fluxo em [flows/](../flows/) atualizado se aplicável.

### Nova dependência

- [ ] Justificativa na descrição.
- [ ] Tamanho do bundle considerado.
- [ ] Licença compatível.
- [ ] `npm audit` ok.

### Performance

- [ ] Query nova com `EXPLAIN` analisado se for crítica.
- [ ] Índice considerado.
- [ ] Bundle dentro do budget.

## Para o revisor

- [ ] Lê o **porquê** antes do **como**.
- [ ] Pergunta em vez de assumir.
- [ ] Aprova quando ok, não "approve com comentários ressalvas" — comentários ressalvas viram **request changes**.

## Após merge

- [ ] Conferir CI verde.
- [ ] Conferir deploy de dev.
- [ ] Smoke manual do que você mudou.
- [ ] Fechar issue/ticket relacionado.
