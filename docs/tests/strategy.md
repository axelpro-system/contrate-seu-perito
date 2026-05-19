# Estratégia de Testes

## Pirâmide

```
       /\
      /E2\        ~5%   — fluxos críticos ponta a ponta (Playwright)
     /----\
    / Integ\      ~25%  — services + Supabase real (stack local)
   /--------\
  /   Unit   \    ~70%  — componentes, serviços (mockando Supabase)
 /------------\
```

## Stack

| Camada       | Ferramenta                | Status            |
| ------------ | ------------------------- | ----------------- |
| Unit         | **Vitest** + jsdom        | ✅ configurado    |
| Integration  | Vitest + Supabase local   | 🟡 a configurar   |
| E2E          | Playwright                | 🟡 não instalado  |
| RLS          | pgTAP ou SQL scripts      | 🟡 a definir      |

Vitest já vem em [package.json](../../package.json#L44).

## O que testar — prioridade

### Crítico (não pode quebrar)

- **Auth flows** — signUp / signIn / OAuth / reset
- **Aprovação de perito** — RN-011, RN-012, RN-016
- **`reviewer_name` da review** — RN-073
- **Trigger `update_expert_rating`** — RN-023
- **RLS** das tabelas com dados sensíveis (`profiles`, `audit_logs`, `messages`)
- **Estados de quote** — transições e trigger `quote_approved`

### Alto

- Fluxo de contato (lead)
- Chat (envio + recepção via Realtime)
- Favoritos (unicidade)
- Filtros de busca

### Médio

- Edição de perfil
- Portfólio / certificações / serviços
- Notificações (criação e marcação como lidas)

### Baixo (não pular, mas não bloqueia)

- Mensagens de erro de UI
- Termos / privacidade (conteúdo estático)

## Localização

```
src/app/
├── services/
│   ├── quote.service.ts
│   └── quote.service.spec.ts          ← unit
├── pages/
│   └── expert-profile/
│       ├── expert-profile.ts
│       └── expert-profile.spec.ts     ← unit/component
tests/
├── integration/                       ← integration (Supabase local)
│   └── reviews.spec.ts
└── e2e/                               ← Playwright
    └── client-contact-expert.spec.ts
```

## Naming

- `describe('<Sujeito>', ...)` — classe ou função.
- `it('<comportamento esperado>', ...)` — começa com verbo.
- Fixtures em `__fixtures__/` adjacente.

## Mocking do Supabase em unit

```ts
const supaMock = {
  client: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: fixtureExpert, error: null }),
  },
  normalizeError: vi.fn((e) => ({ code: 'UNKNOWN', message: 'x', cause: e })),
};
```

> Mockar **o `SupabaseService`**, não o `createClient`. Mantém testes desacoplados do SDK.

## CI gates (proposta)

| Verificação              | Bloqueia merge? | Comando                              |
| ------------------------ | --------------- | ------------------------------------ |
| Build de produção        | sim             | `npm run build`                      |
| Unit + integration       | sim             | `npm test` (com `--run --coverage`)  |
| Cobertura mínima         | sim             | ver [coverage.md](coverage.md)       |
| E2E smoke                | sim             | `npx playwright test --grep @smoke`  |
| E2E completo             | não (overnight) | `npx playwright test`                |
| Lint/format              | sim             | `npx prettier --check .`             |

## Convenções

- Cada PR que altera código de domínio deve incluir/atualizar testes.
- Bugs viram **testes de regressão** antes do fix (TDD light).
- Não testar **frameworks**. Não testar **detalhes de implementação** — teste **comportamento**.
