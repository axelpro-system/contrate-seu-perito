# 03 — Tour pelo Codebase

## Mapa em 1 minuto

```
src/app/
├── app.config.ts          # bootstrap, providers, error handler
├── app.routes.ts          # rotas raiz (todas lazy)
├── components/            # UI reutilizável
├── directives/            # diretivas custom
├── guards/                # auth / expert / admin
├── pages/                 # 1 pasta = 1 rota (lazy)
├── pipes/                 # pipes de exibição
├── services/              # SupabaseService + 1 service por agregado
├── styles/                # globais
└── types/                 # interfaces (espelham o schema)
```

## Pontos de partida por interesse

| Quer entender...                  | Leia                                                                       |
| --------------------------------- | -------------------------------------------------------------------------- |
| Como o app sobe                   | [app.config.ts](../../src/app/app.config.ts), [main.ts](../../src/main.ts) |
| Como uma rota carrega             | [app.routes.ts](../../src/app/app.routes.ts) + qualquer pasta em `pages/`  |
| Como o auth funciona              | [auth.service.ts](../../src/app/services/auth.service.ts), [api/auth.md](../api/auth.md) |
| Como chamar o banco               | [supabase.service.ts](../../src/app/services/supabase.service.ts), [architecture/data-access.md](../architecture/data-access.md) |
| Padrões de UI                     | [architecture/frontend.md](../architecture/frontend.md)                    |
| Modelo de dados                   | [schema.sql](../../schema.sql), [database/schema.md](../database/schema.md), [database/erd.md](../database/erd.md) |
| Regras de negócio                 | [business-rules/regras-de-negocio.md](../business-rules/regras-de-negocio.md) |
| Um fluxo específico               | [flows/](../flows/README.md)                                               |

## Caminhos críticos (leitura recomendada de PR)

1. **Cadastro de perito → aprovação:**
   - [register-expert/](../../src/app/pages/register-expert/)
   - trigger `handle_new_user` em [schema.sql](../../schema.sql)
   - [admin-dashboard/](../../src/app/pages/admin-dashboard/)
2. **Contato → review:**
   - [expert-profile/](../../src/app/pages/expert-profile/) → `MatDialog`
   - [lead.service](../../src/app/services/) (qual exatamente — verifique no código)
   - trigger `quote_approved` → `service_completions` → `reviews`
3. **Chat em tempo real:**
   - [chat.service.ts](../../src/app/services/chat.service.ts)
   - [api/realtime.md](../api/realtime.md)

## Convenções não-óbvias

- `signal()` é preferido sobre `BehaviorSubject` em estado de componente.
- Componentes são todos **standalone**; sem `NgModule`.
- Tudo lazy, exceto `Home`.
- Toda interação com banco usa `SupabaseService` — confirmado em PR review.
- `reviewer_name` em `reviews` **sempre** vem do perfil do cliente.

## Ferramentas internas

- `npm test` — Vitest.
- `npm run build` — build de prod.
- `npx prettier --write .` — formatar.

## Próximo passo

→ [04-pr-checklist.md](04-pr-checklist.md)
