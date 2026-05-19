# 06 — Convenções do Time

## Comunicação

- **Async > sync.** Decisões importantes em ADR ou PR, não em call.
- **Pergunte cedo.** "Estou travado em X, alguém pode olhar?" depois de 30-60 min.
- **Documente o que aprendeu.** Solução obscura? Atualiza runbook ou doc.

## Code review

- **Foco em design e correção**, não em estilo (Prettier resolve).
- **"Approve" significa "pronto para merge"** — não use como "tá bom mas tem ressalvas".
- Comentários ressalvas viram **request changes**.
- Quem abriu a PR responde aos comentários — sem fila silenciosa.

## Branches e merge

- `main` é deployável.
- Branches: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`, `test/`.
- **Squash merge** preferido (commits limpos no main).
- Não force-push em branches compartilhadas.

## Releases

- Versão `vMAJOR.MINOR.PATCH` por tag.
- Changelog gerado a partir dos commits semânticos.
- Release de prod requer aprovação manual no pipeline.

## Horário

- Sem deploy de prod sexta após 16h.
- Sem deploy durante incidente em curso.
- On-call rotativo (definir ciclo conforme tamanho do time).

## Definição de pronto (DoD)

Uma tarefa está pronta quando:

- Código merged em `main`.
- Testes pertinentes existem e passam.
- Documentação relevante atualizada ([business-rules/](../business-rules/), [flows/](../flows/), [decisions/](../decisions/)).
- Deploy em dev verificado.
- Feature flag em on (se aplicável).
- Stakeholder confirmou.

## Definição de feito-feito (em produção)

Indo além do DoD:

- Smoke em staging.
- Deploy em prod.
- Monitoramento estável por 24-48h sem regressão.
- Métricas confirmadas (se for feature mensurável).

## Atitude

- **Erros acontecem.** O importante é o pós-mortem honesto.
- **Não há heróis.** Soluções "sem teste, eu garanto" são red flag.
- **Reversibilidade > velocidade.** Feature flag, deploy gradual, rollback fácil.
- **Cliente primeiro, ego depois.** Discussões técnicas começam em "o que é melhor para o usuário?".

## Política de aprendizado

- Tempo protegido para estudar.
- Sessões de **knowledge share** quinzenais (sugestão).
- Pareamento aberto em features complexas.
- ADRs como ferramenta de pensamento, não burocracia.
