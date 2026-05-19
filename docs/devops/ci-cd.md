# CI/CD

Pipeline proposto (GitHub Actions; equivalentes em outros provedores).

## Workflow `pr.yml` (PRs)

```yaml
name: PR
on:
  pull_request:
    branches: [main]

jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npx prettier --check .
      - run: npm test -- --run --coverage
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/
  e2e-smoke:
    needs: build-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test --grep @smoke
        env:
          BASE_URL: ${{ secrets.PREVIEW_URL }}
```

## Workflow `main.yml` (merge na main)

```yaml
name: Deploy Dev
on:
  push:
    branches: [main]

jobs:
  deploy-dev:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm run build -- --configuration=development
      - name: Apply DB migrations
        run: npx supabase db push --linked
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.DEV_DB_PASSWORD }}
      - name: Upload to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
          projectName: contrate-dev
          directory: dist/contrate-seu-perito/browser
```

## Workflow `release.yml` (tag → prod)

```yaml
name: Release
on:
  push:
    tags: ['v*']

jobs:
  deploy-prod:
    runs-on: ubuntu-latest
    environment: production   # exige aprovação manual
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm run build -- --configuration=production
      - name: Apply DB migrations (prod)
        run: npx supabase db push --linked
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.PROD_DB_PASSWORD }}
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
          projectName: contrate-prod
          directory: dist/contrate-seu-perito/browser
      - name: Smoke E2E
        run: npx playwright test --grep @smoke
        env:
          BASE_URL: https://contrateseuperito.app
```

## Branching

- `main` é deployável a qualquer momento.
- Feature branches: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`.
- Releases: tags `vMAJOR.MINOR.PATCH` (SemVer ajustado).

## Quality gates

| Gate                                  | Onde     | Bloqueante |
| ------------------------------------- | -------- | ---------- |
| Prettier check                        | PR       | sim        |
| Unit + integration tests              | PR       | sim        |
| Cobertura mínima (ver [coverage.md](../tests/coverage.md)) | PR | sim |
| Build de produção                     | PR       | sim        |
| Smoke E2E                             | PR       | sim        |
| Bundle budget                         | PR       | sim        |
| Aprovação manual (em prod)            | Release  | sim        |

## Secrets necessários

| Secret                       | Onde                       |
| ---------------------------- | -------------------------- |
| `SUPABASE_ACCESS_TOKEN`      | aplicar migrations         |
| `DEV_DB_PASSWORD`            | migration em dev           |
| `STAGING_DB_PASSWORD`        | migration em staging       |
| `PROD_DB_PASSWORD`           | migration em prod          |
| `CF_API_TOKEN` / `CF_ACCOUNT_ID` | deploy CDN             |
| `PLAYWRIGHT_*`               | rodar E2E                  |

Política de acesso: apenas owners do repositório.
