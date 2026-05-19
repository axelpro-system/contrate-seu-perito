# Testes de Integração

Validam a "costura" entre serviço de domínio, `SupabaseService` e o **Postgres real** (Supabase local).

## Stack local

```bash
# instalar (uma vez)
npm i -g supabase

# subir Postgres + Auth + Storage locais
supabase start

# aplica migrations e seed
supabase db reset
```

Variáveis para os testes:

```bash
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<dado pelo supabase status>
SUPABASE_SERVICE_ROLE_KEY=<dado pelo supabase status>   # apenas para setup, nunca em código de runtime
```

## Estrutura

```
tests/integration/
├── setup.ts                  # init do supabase client de teste
├── fixtures.ts               # seed mínimo + helpers de cleanup
├── reviews.spec.ts
├── quote-approve-trigger.spec.ts
└── leads.spec.ts
```

## Padrão

```ts
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

describe('Trigger quote_approved', () => {
  beforeAll(async () => {
    await supa.from('quotes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supa.from('service_completions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  });

  it('cria service_completion ao mudar quote.status para approved', async () => {
    const { data: quote } = await supa
      .from('quotes')
      .insert({
        expert_id: 'e_uuid',
        requester_id: 'c_uuid',
        requester_name: 'X',
        requester_email: 'x@x.com',
        case_description: 'caso',
        status: 'submitted',
      })
      .select()
      .single();

    await supa.from('quotes').update({ status: 'approved' }).eq('id', quote!.id);

    const { data: sc } = await supa.from('service_completions').select('*').eq('quote_id', quote!.id);
    expect(sc).toHaveLength(1);
  });
});
```

## Por que `service_role` no teste

Para **arranjar** o cenário (insert sem RLS atrapalhar). Para validar autorização use a **anon key** com JWT de um usuário de teste.

## Testando RLS

Ver [rls-tests.md](rls-tests.md).

## Isolamento entre testes

- Cleanup em `afterEach` ou `beforeEach`.
- Ou usar **savepoints** se a infraestrutura permitir.
- Não dependa de ordem entre arquivos de teste.

## Performance

- Stack local sobe em ~10s; reutilizar entre testes do mesmo run.
- Para CI: usar serviço Postgres direto (não Supabase completo) quando só precisa de SQL.

## Quando criar integration test em vez de unit

- Testar **trigger** Postgres.
- Testar **policy RLS** real.
- Testar fluxo que envolve 2+ tabelas com FKs.
- Validar query complexa que mocks tornariam tautológica.
