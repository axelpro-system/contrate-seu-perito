# ADR-0009 — Revelar "Esqueci minha senha" após 3 falhas no login

- **Status:** Accepted
- **Data:** 2026-05-15 (retroativa)

## Contexto

O fluxo "Esqueci minha senha" estava acessível apenas via link separado em `/forgot-password`. Análise dos tickets de suporte mostrou:

- Usuários (peritos especialmente) ficam tentando senhas sem perceber que existe recuperação.
- A maioria das chamadas de suporte por login são por senha esquecida, não por bug.

Mostrar o link **sempre** no login tem dois problemas:

- Ruído visual em quem só errou uma vez.
- Pode incentivar reset desnecessário (carga extra no Resend).

## Opções consideradas

1. **Link sempre visível** abaixo do botão de login.
2. **Revelar após N falhas** consecutivas (3) na mesma sessão.
3. **Snackbar com link** ao falhar uma vez.

## Decisão

Adotar **opção 2**: contador local `failedAttempts`; ao chegar em 3, exibir botão "Esqueceu sua senha?" abaixo do form. Clique dispara a Edge Function `send-password-reset` (ADR-0008) sem sair da tela de login.

Implementação: [login.ts](../../src/app/pages/login/login.ts).

## Consequências

### Positivas

- Reduz ruído para quem acerta de primeira.
- Salva usuários encalhados sem precisar navegar para outra página.
- Reset usa template branded ([ADR-0008](ADR-0008-resend-emails.md)).

### Negativas

- Contador é **local ao componente** — fechando aba zera. Aceito como trade-off (ataques de força bruta são contados pelo rate-limit do Auth, não pelo contador local).
- Usuário que sabe que esqueceu pode preferir ir direto a `/forgot-password` — link permanece disponível no menu.

## Como saberemos que falhou

- Volume de reset enviado **subir** após o lançamento sem diminuir tickets.
- Ataque automatizado abusar do reset.

## Referências

- [flows/auth-signup-signin.md](../flows/auth-signup-signin.md#login-com-3-tentativas-falhas--reset-inline)
- [business-rules/regras-de-negocio.md](../business-rules/regras-de-negocio.md) — RN-017
- [api/edge-functions.md](../api/edge-functions.md#send-password-reset)
