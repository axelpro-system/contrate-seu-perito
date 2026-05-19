# ADR-0003 — SupabaseService como porta única para o banco

- **Status:** Accepted
- **Data:** 2026-01-22 (retroativa)

## Contexto

Componentes precisam ler/gravar no banco. Permitir que cada componente chame `createClient` direto leva a:

- Múltiplas instâncias do cliente.
- Erros tratados de forma inconsistente.
- Impossibilidade de trocar provider sem refactor amplo.
- Testabilidade ruim.

## Opções consideradas

1. **SupabaseService como wrapper único** (todos os serviços/componentes injetam).
2. **Cliente compartilhado via factory** (sem wrapper).
3. **Acesso direto** em cada componente.

## Decisão

Adotar **SupabaseService como wrapper único**. Todo acesso ao Supabase passa por ele.

Componentes não chamam `SupabaseService` diretamente — chamam **serviços de domínio** (que por sua vez chamam o `SupabaseService`).

## Consequências

### Positivas

- Trocabilidade: se um dia formos para REST próprio, mudamos só esse arquivo.
- Instrumentação centralizada (logs, métricas, retry).
- Erros normalizados em `AppError`.
- Mock simples em testes.

### Negativas

- Camada extra de indireção.
- Risco de virar "service god" — mitigar mantendo escopo (auth, query, storage, realtime).

## Como saberemos que falhou

- Arquivo passando de 1000 linhas.
- Padrões de "vazamento" do SDK chegando aos componentes.

## Referências

- [architecture/data-access.md](../architecture/data-access.md)
- [src/app/services/supabase.service.ts](../../src/app/services/supabase.service.ts)
- [AI_RULES.md](../../AI_RULES.md)
