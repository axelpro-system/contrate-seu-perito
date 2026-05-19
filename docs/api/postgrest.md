# PostgREST via `supabase-js`

O Supabase expõe cada tabela como recurso REST. Em vez de chamar HTTP direto, usamos o SDK.

## 1. Cliente

```ts
// SupabaseService (resumido)
this.client = createClient(environment.supabaseUrl, environment.supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
```

## 2. SELECT

```ts
const { data, error } = await client
  .from('profiles')
  .select('id, full_name, specialty, rating')
  .eq('profile_type', 'PERITO')
  .eq('account_status', 'ACTIVE')
  .gte('rating', 4)
  .order('rating', { ascending: false })
  .range(0, 19); // paginação 0-19
```

### Filtros disponíveis

| Método              | SQL equivalente              |
| ------------------- | ---------------------------- |
| `.eq(col, val)`     | `col = val`                  |
| `.neq`              | `col <> val`                 |
| `.gt / .gte`        | `>`, `>=`                    |
| `.lt / .lte`        | `<`, `<=`                    |
| `.like`             | `LIKE`                       |
| `.ilike`            | `ILIKE` (case-insensitive)   |
| `.in(col, [a,b])`   | `IN (a, b)`                  |
| `.is(col, null)`    | `IS NULL`                    |
| `.contains(col, x)` | jsonb/array contains         |
| `.or('a.eq.1,b.eq.2')` | combinação OR             |
| `.not(col, op, v)`  | negação                      |

### Joins (embeds)

```ts
client.from('quotes').select(`
  id, status, case_description, created_at,
  expert:profiles!quotes_expert_id_fkey(id, full_name),
  requester:profiles!quotes_requester_id_fkey(id, full_name)
`);
```

A relação precisa de FK declarada; o alias após `!` é o nome da constraint.

## 3. INSERT

```ts
const { data, error } = await client
  .from('leads')
  .insert({
    expert_id: expertId,
    client_id: clientId,
    message: text,
  })
  .select()
  .single();
```

- `.select()` após `.insert()` retorna a linha criada.
- `.single()` espera exatamente 1 linha; estoura erro se 0 ou >1.

## 4. UPDATE

```ts
const { data, error } = await client
  .from('quotes')
  .update({
    status: 'approved',
    proposed_value: 1500,
    responded_at: new Date().toISOString(),
  })
  .eq('id', quoteId)
  .eq('expert_id', userId) // defesa em profundidade
  .select()
  .single();
```

## 5. DELETE

```ts
const { error } = await client.from('favorites').delete().eq('client_id', userId).eq('expert_id', expertId);
```

RLS limita o que cada usuário pode deletar.

## 6. Paginação e contagem

```ts
const { data, count, error } = await client
  .from('reviews')
  .select('*', { count: 'exact' })
  .eq('expert_id', expertId)
  .range(0, 9);
```

`count` opções:

- `'exact'` — precisa, varre tudo.
- `'planned'` — estimativa rápida (preferir em listas grandes).
- `'estimated'` — fallback do `planned`.

## 7. UPSERT

```ts
await client.from('availability').upsert(
  { expert_id: userId, day_of_week: 3, start_time: '09:00', end_time: '12:00' },
  { onConflict: 'expert_id,day_of_week,start_time' },
);
```

## 8. Single vs maybeSingle

- `.single()` — erro se != 1 linha.
- `.maybeSingle()` — retorna `null` se 0 linhas (sem erro). Use quando "não encontrado" é caminho normal.

## 9. Cabeçalhos `Prefer`

O SDK gerencia automaticamente:

- `return=representation` ao usar `.select()` em insert/update.
- `count=exact|planned|estimated` quando você passa `count`.

## 10. Limites

- Resultado padrão: 1000 linhas (configurável). Sempre paginar.
- Timeout: ~60s (PostgREST). Para queries longas, RPC com `set statement_timeout`.

## 11. Performance

- Selecionar **apenas** as colunas necessárias.
- Usar índices apropriados ([database/indexes.md](../database/indexes.md)).
- Filtros mais seletivos primeiro.
- Para listagens pesadas, criar **view** materializada ou **RPC**.

## 12. RLS é invisível mas obrigatório

Mesmo que o SDK não exija filtros redundantes (RLS filtra), **inclua-os** por:

1. Clareza ao leitor do código.
2. Defesa em profundidade.
3. Performance (planner usa o filtro).
