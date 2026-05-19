# Cobertura

## Metas

| Camada                                   | Linhas | Branches | Notas                                |
| ---------------------------------------- | ------ | -------- | ------------------------------------ |
| Serviços de domínio (`src/app/services/`)| **≥80%** | **≥70%** | Onde mora a regra de negócio        |
| Guards (`src/app/guards/`)               | **100%** | **100%** | Pequenos, críticos                  |
| Pipes / utils                            | **≥80%** | **≥70%** |                                      |
| Componentes (UI)                         | ≥40%   | ≥30%     | Foco em lógica, não em template     |
| Total do projeto                         | ≥60%   | ≥50%     | Sanity check                         |

Cobertura é **suporte ao critério**, não substituto. Um serviço com 95% de cobertura que **não testa o caminho de erro RLS** vale menos que um com 70% que testa.

## Instrumentação

Vitest expõe cobertura via `@vitest/coverage-v8` ou `istanbul`. Adicionar (avaliar antes em ADR):

```bash
npm i -D @vitest/coverage-v8
```

```json
// vitest.config.ts (trecho)
test: {
  coverage: {
    provider: 'v8',
    reporter: ['text', 'html', 'lcov'],
    thresholds: {
      lines: 60,
      branches: 50,
      functions: 60,
      statements: 60,
    },
    exclude: [
      '**/*.spec.ts',
      'src/main.ts',
      'src/app/types/**',
      '**/*.routes.ts',
    ],
  },
}
```

## Gate de CI

PR não funde se cobertura cair abaixo do baseline atual menos uma margem (ex.: 1pp). Evita queda paulatina.

Em pipeline:

```bash
npm test -- --run --coverage
```

Falha se thresholds não bater.

## Como ler relatório HTML

```bash
npm test -- --coverage
# abre coverage/index.html
```

- Vermelho = sem cobertura.
- Amarelo = parcial (branch coberto, outro não).
- Verde = ok.

## O que não medir

- Arquivos gerados.
- `*.routes.ts`, `app.config.ts` (montagem).
- `index.html`, assets.
- Tipos puros (`src/app/types/`).

## Exceções e dívida

Cobertura abaixo do alvo é aceitável temporariamente em:

- Refactor em curso (registrar em [findings.md](../../findings.md)).
- Código legado em processo de remoção.

Sempre com prazo e plano.
