# Build

## Stack

- **Bundler:** `@angular/build` (Vite-based em Angular 21).
- **Saída:** `dist/contrate-seu-perito/browser/` (SPA estática, sem SSR em V1).
- **Otimizações automáticas:** tree-shaking, minificação, lazy chunks, CSS inlining.

## Comandos

```bash
npm start                  # dev server (HMR)
npm run watch              # build incremental sem servidor
npm run build              # build de produção
npm run build -- --configuration=staging  # staging com replacements
```

`package.json` define apenas `start` e `build`. Configurações por ambiente devem ir em `angular.json`.

## `angular.json` — configurações sugeridas

```jsonc
"configurations": {
  "production": {
    "fileReplacements": [
      { "replace": "src/environments/environment.ts", "with": "src/environments/environment.prod.ts" }
    ],
    "optimization": true,
    "outputHashing": "all",
    "sourceMap": false,
    "namedChunks": false,
    "extractLicenses": true
  },
  "staging": {
    "fileReplacements": [
      { "replace": "src/environments/environment.ts", "with": "src/environments/environment.staging.ts" }
    ],
    "optimization": true,
    "outputHashing": "all",
    "sourceMap": true
  },
  "development": {
    "optimization": false,
    "extractLicenses": false,
    "sourceMap": true,
    "namedChunks": true
  }
}
```

## Tamanho do bundle

Definir budgets:

```jsonc
"budgets": [
  { "type": "initial", "maximumWarning": "500kb", "maximumError": "1mb" },
  { "type": "anyComponentStyle", "maximumWarning": "4kb", "maximumError": "8kb" }
]
```

CI quebra se ultrapassar `maximumError`.

## Otimizações específicas

- **Lazy routes** — já configurado em [app.routes.ts](../../src/app/app.routes.ts).
- **Angular Material:** importar apenas módulos usados (já é o caso com standalone).
- **Imagens:** `NgOptimizedImage` em componentes com `<img>` significativo.
- **Fonts:** preconnect + `font-display: swap`.

## Source maps em produção

- Gerar **separadamente**, não embarcar no bundle (`sourceMap.hidden: true`).
- Subir para serviço de error tracking (quando adotado).

## Reprodutibilidade

- `package-lock.json` versionado (já é).
- Node version fixada (sugerir `.nvmrc` com `20`).
- CI usa `npm ci`, não `npm install`.

## Cache

- CI: cachear `node_modules` por hash do `package-lock.json`.
- CDN: TTL longo para arquivos com hash (`*.<hash>.js`); curto para `index.html`.
