# 02 — Sua primeira PR

Objetivo: fazer uma mudança pequena, real, e passar pelo fluxo completo.

## Sugestões de PR inicial

1. **Corrigir um typo** em algum texto da UI.
2. **Adicionar uma especialidade** ao seed em [docs/database/seed.md](../database/seed.md).
3. **Aumentar a cobertura** de um serviço com teste extra para um caminho de erro.

## Fluxo

```bash
# 1) Crie branch
git checkout -b fix/typo-perfil-perito

# 2) Faça a mudança

# 3) Valide localmente
npx prettier --check .
npm test -- --run
npm run build

# 4) Commit (mensagem semântica)
git add -A
git commit -m "fix: corrige typo em label do perfil do perito"

# 5) Push
git push origin fix/typo-perfil-perito

# 6) Abrir PR no GitHub apontando para main
```

## Checklist da PR

Ver [04-pr-checklist.md](04-pr-checklist.md) — completo.

## Convenção de commits

Usamos conventional commits:

- `feat:` nova funcionalidade
- `fix:` correção
- `chore:` infra, dependências
- `docs:` apenas documentação
- `refactor:` mudança sem alterar comportamento
- `test:` apenas testes
- `style:` formatação

## Pareamento

Sua primeira PR vai para code review com um sênior. Não tenha medo de perguntas — é assim que se aprende o sistema. Bons reviews falam **por que**, não só **o quê**.

## Próximo passo

→ [03-codebase-tour.md](03-codebase-tour.md)
