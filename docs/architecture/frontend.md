# Padrões de Frontend (Angular 21)

Regras consolidadas de [AI_RULES.md](../../AI_RULES.md) + práticas observadas no código.

## 1. Standalone components em tudo

- Não usar `NgModule`. Todos os componentes, diretivas e pipes são `standalone: true`.
- Imports vão diretamente no `imports: []` do componente.
- O bootstrap fica em [main.ts](../../src/main.ts) via `bootstrapApplication`.

## 2. Lazy routes

- Toda página em [app.routes.ts](../../src/app/app.routes.ts) usa `loadComponent: () => import(...)`.
- Exceção: `Home` é importada estaticamente (entrada).
- Lazy = menor bundle inicial e melhor TTI.

## 3. Roteamento e proteção

- Guards em [src/app/guards/](../../src/app/guards/):
  - `authGuard` — sessão válida.
  - `expertGuard` — `profile_type = 'PERITO'`.
  - `adminGuard` — `profile_type = 'ADMIN'`.
- Guards consultam `AuthService` (já com perfil em cache).
- **Não delegue autorização ao frontend** — guards são UX; o RLS no Postgres é a defesa real.

## 4. UI: Angular Material exclusivamente

- `MatButton`, `MatCard`, `MatFormField`, `MatDialog`, `MatSnackBar`, `MatTable`, etc.
- Não introduzir libs UI externas (TailwindUI, PrimeNG, etc.) — registrar ADR antes.
- Tokens de cor/tipografia em [src/styles.scss](../../src/styles.scss).

## 5. Formulários

- **Reactive Forms** (`FormBuilder`, `FormGroup`, `Validators`) — não usar `ngModel` em formulários reais.
- Validações: combinar `Validators` síncronos com validators async quando necessário (ex.: unicidade de e-mail).
- Exibir erros sempre via `MatError` dentro de `MatFormField`.

## 6. Estilo

- SCSS por componente: `*.scss` ao lado do `*.ts`/`*.html`.
- Global em [styles.scss](../../src/styles.scss).
- Prettier: `printWidth: 100`, `singleQuote: true` ([package.json](../../package.json#L11-L21)).

## 7. Feedback ao usuário

- `MatSnackBar` para mensagens curtas (success/error/info).
- `MatDialog` para confirmações destrutivas e formulários modais (ex.: "Entrar em Contato" no perfil do perito).

## 8. Dados assíncronos

- Serviços retornam `Promise<T>` (Supabase SDK) ou `Observable<T>` (RxJS).
- Componentes preferem **async pipe** ou **signals** em vez de `subscribe` manual.
- Sempre tratar erro (try/catch ou `.catchError`) e mostrar feedback.

## 9. Convenções de nomenclatura

| Item                 | Padrão                            | Exemplo                                       |
| -------------------- | --------------------------------- | --------------------------------------------- |
| Arquivo de componente| kebab-case                        | `expert-profile.ts`, `expert-profile.html`    |
| Classe               | PascalCase                        | `ExpertProfile`                               |
| Serviço              | `*.service.ts` + `*Service` class | `quote.service.ts` → `QuoteService`           |
| Guard                | `*.guard.ts`                      | `auth.guard.ts`                               |
| Tipo/interface       | PascalCase em `src/app/types/`    | `Expert`, `Quote`, `Review`                   |

## 10. Estrutura de pastas

```
src/app/
├── components/      # Reutilizáveis (cards, dialogs, widgets)
├── directives/      # Diretivas customizadas
├── guards/          # Route guards
├── pages/           # Rotas (lazy)
├── pipes/           # Pipes de exibição
├── services/        # Domínio + integrações
├── styles/          # Estilos globais e tokens
└── types/           # Interfaces compartilhadas
```

**Regra de proximidade:** se um componente é usado **apenas** por uma página, mantenha-o dentro da pasta da página. Se for usado por 2+ páginas, promova para `components/`.

## 11. Performance

- Lazy routes (já feito).
- `ChangeDetectionStrategy.OnPush` em componentes pesados.
- `trackBy` em `*ngFor` longos.
- Evitar expressões pesadas em template; computar em propriedades/`computed`.
- Imagens otimizadas: usar `NgOptimizedImage` quando aplicável.

## 12. Acessibilidade

- Material já cobre a maioria. Validar:
  - Labels em todos os campos (`MatLabel`).
  - Foco visível.
  - Contraste mínimo AA.
  - `aria-label` em ícones-botão.

## 13. Internacionalização

- V1 é monolingual (PT-BR). Strings vivem nos templates.
- Antes de internacionalizar, registrar ADR (extrair para i18n exige refactor amplo).
