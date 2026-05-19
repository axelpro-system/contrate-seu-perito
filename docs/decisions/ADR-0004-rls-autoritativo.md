# ADR-0004 — RLS como autoridade de autorização

- **Status:** Accepted
- **Data:** 2026-01-25 (retroativa)

## Contexto

Sem backend próprio, o cliente fala direto com PostgREST. Quem decide o que cada usuário pode ler/escrever?

## Opções consideradas

1. **RLS no Postgres como única fonte.**
2. **Edge Functions intermediando** todas as escritas.
3. **Guards no Angular** decidindo.

## Decisão

**RLS no Postgres é a única fonte autoritativa.** Guards do Angular são UX (redirecionar para login, ocultar menus); o banco aplica a regra real.

Edge Functions só entram para operações que **não** podem ser modeladas com RLS (workflows multi-tabela com transação atômica, integrações server-side com tokens).

## Consequências

### Positivas

- Defesa única em camada baixa = atacante não bypassa via API.
- Frontend pode evoluir sem reescrever auth.
- Testável via SQL (pgTAP / scripts).

### Negativas

- Curva de aprendizado: pensar em policies em vez de middleware.
- Debug de "permission denied" exige conhecer o contexto JWT.
- Policies complexas (subselect) podem ter custo de performance.

### Mitigações

- Testes negativos obrigatórios para cada policy crítica.
- Documentação em [database/rls.md](../database/rls.md) e [security/rls.md](../security/rls.md).
- Funções `security definer` para casos específicos, com ADR dedicado.

## Como saberemos que falhou

- Mais de 3 incidentes de RLS em 12 meses.
- Performance de leitura comprometida por subselects.

## Referências

- [security/threat-model.md](../security/threat-model.md)
- [database/rls.md](../database/rls.md)
- [tests/rls-tests.md](../tests/rls-tests.md)
