# ADR-0002 — Angular Standalone Components (sem NgModule)

- **Status:** Accepted
- **Data:** 2026-01-20 (retroativa)

## Contexto

Angular 14+ introduziu `standalone: true`. Em Angular 17+ tornou-se a forma recomendada. Iniciamos o projeto em Angular 21.

## Opções consideradas

1. **Standalone components em tudo.**
2. **NgModule (`AppModule`, `SharedModule`, etc.).**
3. **Híbrido** (standalone novo + NgModule legado).

## Decisão

Usar **standalone em tudo**. Lazy routes via `loadComponent`. Sem NgModule no projeto.

## Consequências

### Positivas

- Menos boilerplate; imports explícitos no componente.
- Tree-shaking mais agressivo → bundle menor.
- Curva de aprendizado mais simples para novos devs.
- Lazy granular por componente.

### Negativas

- Libs antigas que assumem NgModule (raras hoje) podem dar atrito.
- Padrão diferente do material didático mais antigo.

## Como saberemos que falhou

- Bundles excedendo budget mesmo com lazy.
- Necessidade recorrente de criar "container modules" para reuso.

## Referências

- [architecture/frontend.md](../architecture/frontend.md)
- [Angular Standalone Guide](https://angular.dev/guide/standalone-components)
