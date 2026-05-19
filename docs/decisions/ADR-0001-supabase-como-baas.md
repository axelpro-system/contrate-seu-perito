# ADR-0001 — Adoção de Supabase como BaaS

- **Status:** Accepted
- **Data:** 2026-01-15 (retroativa — formalizando decisão existente)

## Contexto

O produto precisa de banco relacional, auth, storage e tempo real desde o V1, com time pequeno. Construir backend dedicado dispersaria foco.

## Opções consideradas

1. **Supabase** (Postgres + Auth + Storage + Realtime gerenciados).
2. **Firebase** (Firestore + Auth + Storage).
3. **Backend próprio** em Node/NestJS + Postgres + Redis + S3.

## Decisão

Adotar **Supabase** como BaaS único do V1.

## Consequências

### Positivas

- Postgres relacional (vs. NoSQL do Firebase) — modelagem natural para relacionamentos do domínio.
- RLS resolve autorização sem servidor próprio.
- Auth/Storage/Realtime out of the box.
- SDK JavaScript maduro.
- Time pequeno entrega rápido.

### Negativas

- Vendor lock-in (PostgREST + convenções de Auth).
- Limites de plano (Realtime, Storage, conexões) — escalar = pagar.
- Dependência de uptime de terceiro.

### Neutras

- `service_role` precisa ser tratado com extremo cuidado.
- Migrations precisam de disciplina (não há ORM).

## Como saberemos que falhou

- Custos Supabase superando US$ 5k/mês sem ROI claro.
- Limites de Realtime/conexões bloqueando feature crítica.
- Mais de 3 outages > 1h em 12 meses.

## Referências

- [architecture/c4-context.md](../architecture/c4-context.md)
- [security/secrets.md](../security/secrets.md)
