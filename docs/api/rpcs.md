# RPCs (Funções SQL chamáveis via API)

Funções Postgres expostas pelo PostgREST. Chamada no cliente:

```ts
const { data, error } = await client.rpc('nome_da_funcao', { arg1: valor });
```

## `get_featured_experts(limit_count integer default 6)`

**O que faz:** retorna até `limit_count` peritos públicos em ordem aleatória.

**Fonte:** [schema.sql](../../schema.sql) (função `get_featured_experts`).

**Assinatura:**

```sql
get_featured_experts(limit_count integer default 6) RETURNS SETOF profiles
```

**Quem pode chamar:** qualquer um (`stable` + filtro embutido por visibilidade).

**Uso:**

```ts
const { data } = await client.rpc('get_featured_experts', { limit_count: 8 });
```

**Quando usar:** página inicial (carrossel de destaques). Não usar como busca — para isso, `select` em `profiles` com filtros explícitos.

---

## Convenções para novas RPCs

1. **Prefira queries diretas** ao SDK; só crie RPC se:
   - Houver lógica que SQL faz melhor (random, agregação complexa, CTE pesada).
   - Precisar de `security definer` (operação que exige bypass parcial de RLS, com auditoria).
   - Houver múltiplas tabelas envolvidas em uma transação.
2. **Imutável > stable > volatile.** Marque corretamente para o planner aproveitar.
3. **`SECURITY DEFINER` requer ADR.** Documente exatamente por que e o que valida internamente.
4. **Parâmetros explícitos.** Sem variádicos sem motivo; tipos claros.
5. **Retorno tipado.** `RETURNS SETOF <tabela>` ou `TABLE(...)`.
6. **Versionamento.** Mudança incompatível → nova função `*_v2`, deprecar a antiga.

## Template

```sql
create or replace function search_experts(
  q text default null,
  specialty text default null,
  state_filter text default null,
  min_rating numeric default 0,
  page_size int default 20,
  page_offset int default 0
)
returns setof profiles
language sql
stable
as $$
  select *
  from profiles
  where profile_type = 'PERITO'
    and account_status = 'ACTIVE'
    and profile_visible = true
    and (q is null or full_name ilike '%' || q || '%' or specialty ilike '%' || q || '%')
    and (specialty is null or profiles.specialty = specialty)
    and (state_filter is null or state = state_filter)
    and rating >= min_rating
  order by rating desc, reviews_count desc
  limit page_size
  offset page_offset;
$$;
```

## Testando RPC localmente

1. SQL Editor do Supabase: `select * from get_featured_experts(3);`
2. Garantir que aparece em `pg_proc` e o PostgREST faz reload (`NOTIFY pgrst, 'reload schema';`).
