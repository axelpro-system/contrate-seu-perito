# Testes de RLS

Policies são código. Código sem teste apodrece. RLS errado vira **violação de privacidade** — então testamos explicitamente.

## Abordagens

### A) SQL + pgTAP (recomendado)

```sql
-- tests/rls/profiles.sql
begin;
select plan(3);

-- Setup: criar dois usuários com role authenticated
insert into auth.users (id, email) values ('u1','u1@x'),('u2','u2@x');
insert into profiles (id, profile_type, account_status, profile_visible) values
  ('u1','PERITO','ACTIVE',true),
  ('u2','PERITO','PENDING',false);

-- Como u1
set local request.jwt.claims = '{"sub":"u1","role":"authenticated"}';

-- Pode ler u2? (autenticado, sem filtro de visibilidade)
select is( (select count(*) from profiles where id='u2'), 1::bigint,
           'u1 (auth) consegue ver u2');

-- Pode atualizar u2? (não — não é dono)
prepare upd as update profiles set bio='hack' where id='u2';
select throws_ok('execute upd', '42501', null, 'u1 não pode atualizar u2');

-- Sem auth (anon)
reset request.jwt.claims;
select is( (select count(*) from profiles where id='u2'), 0::bigint,
           'anônimo não vê u2 (PENDING/invisível)');

select * from finish();
rollback;
```

Rodar com pgTAP: `pg_prove -d $DATABASE_URL tests/rls/*.sql`.

### B) Via cliente Supabase JS (integration test)

Útil quando se quer testar o "round-trip" PostgREST.

```ts
const anon = createClient(URL, ANON_KEY);
const userClient = createClient(URL, ANON_KEY, { /* with custom jwt */ });

// Como anon
const { data: pub } = await anon.from('profiles').select('id').eq('id', expertActiveId);
expect(pub).toHaveLength(1);
const { data: priv } = await anon.from('profiles').select('id').eq('id', expertPendingId);
expect(priv).toHaveLength(0);

// Como dono
const { error } = await userClient.from('profiles').update({ bio: 'x' }).eq('id', notMyId);
expect(error?.code).toBe('42501');
```

## O que cobrir

Para cada tabela em `public`:

1. **SELECT positivo:** quem deveria ler, lê.
2. **SELECT negativo:** quem não deveria, **não** lê (retorna 0 linhas ou erro).
3. **INSERT positivo:** dono consegue criar.
4. **INSERT com payload de outro usuário:** rejeitado.
5. **UPDATE/DELETE positivo/negativo.**
6. **Anônimo:** apenas o que é público; nada além.
7. **Admin override:** confirma que ADMIN passa.

## Casos sensíveis (prioridade alta)

- `profiles` (perfis privados/pending não vazam)
- `messages` (não-participante não lê)
- `leads` (não-participante não lê)
- `audit_logs` (somente admin lê)
- `notifications` (cada um vê apenas as suas)

## Anti-padrões

- Testar apenas o "caminho feliz" — RLS exige testes negativos.
- Usar `service_role` no teste de RLS (bypassa tudo — só serve para arrange).
- Conferir `data.length` sem checar `error`.

## CI

- Roda em pipeline de migration (antes de aplicar em produção).
- Quebra de teste de RLS é **bloqueante** — segurança não é flaky test.
