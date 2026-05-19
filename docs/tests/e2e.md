# Testes E2E (Playwright)

> Status: ainda não instalado. Esta página é a especificação alvo. Antes de adotar, registrar ADR confirmando a escolha de Playwright × Cypress × WebdriverIO.

## Instalação alvo

```bash
npm i -D @playwright/test
npx playwright install --with-deps
```

`package.json` scripts sugeridos:

```json
"e2e": "playwright test",
"e2e:headed": "playwright test --headed",
"e2e:ui": "playwright test --ui"
```

`playwright.config.ts` sugerido: 2 navegadores (chromium + webkit), baseURL via env, retries=1 em CI.

## Estrutura

```
tests/e2e/
├── fixtures/
│   ├── auth.ts                  # login programático
│   └── seed.ts                  # cria dados via service-role
├── smoke/
│   ├── home.spec.ts             @smoke
│   └── login.spec.ts            @smoke
├── client/
│   ├── search-and-contact.spec.ts
│   └── leave-review.spec.ts
├── expert/
│   ├── onboarding.spec.ts
│   └── respond-quote.spec.ts
└── admin/
    └── approve-expert.spec.ts
```

## Fluxos obrigatórios

### Smoke (rodam em todo PR)

1. Home carrega e mostra peritos em destaque.
2. Login com credenciais válidas redireciona para dashboard.
3. Cadastro de novo usuário envia e-mail (verificar via mailcatcher local).

### Crítico (rodam diariamente)

1. Cliente: busca → entra no perfil → clica "Entrar em Contato" → cria lead.
2. Perito: recebe lead → cria quote → aprova.
3. Cliente: avalia perito após `approved` → rating sobe.
4. Admin: aprova perito pendente → vira público.

### Resiliência

- Erro de RLS: tentar acessar perfil de outro usuário direto via URL.
- Sessão expirada: simular token inválido e ver redirect para login.
- Realtime caído: bloquear websocket e ver badge de degradação no chat.

## Boas práticas

- **Locators por papel/role:**
  ```ts
  await page.getByRole('button', { name: /entrar em contato/i }).click();
  ```
  Evitar `page.locator('.some-class')`.

- **Login programático (não pela UI):**
  ```ts
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async ({ url, key, email, password }) => {
      const { createClient } = await import('@supabase/supabase-js');
      const c = createClient(url, key);
      await c.auth.signInWithPassword({ email, password });
    }, env);
  });
  ```

- **Cada teste em DB limpo** ou com namespacing por `test_run_id` para paralelismo.
- **Não esperar `setTimeout`** — usar `expect(locator).toHaveText(...)` que faz retry.

## Dados de teste

- Contas dedicadas com prefixo `e2e+`:
  - `e2e+client@example.com`
  - `e2e+expert@example.com`
  - `e2e+admin@example.com`
- Seedadas via service-role no `globalSetup`.

## CI

- Smoke a cada PR (≤ 3 min).
- Crítico em pipeline noturno + antes de release.
- Artefatos: screenshots, vídeos, traces em falha.

## Quando NÃO escrever E2E

- Validação de formulário (mais barato como unit do componente).
- Detalhes de ordenação/paginação (mais barato como integration).
- Estados de erro raros (mock no unit).
