# Migrações

## Estado atual

Hoje o schema vive em [schema.sql](../../schema.sql) como um arquivo único, idempotente (`create table if not exists`, `create or replace function`). Funciona para o estágio atual, mas precisa evoluir.

## Convenção alvo

Adotar `supabase/migrations/` (já existe pasta [supabase/](../../supabase/)) com arquivos numerados:

```
supabase/migrations/
├── 20260101120000_init.sql
├── 20260115093000_add_expert_services.sql
├── 20260204110000_add_reviewer_name_not_null.sql
└── ...
```

- **Nome:** `YYYYMMDDHHMMSS_descricao.sql` (UTC).
- **Idempotente sempre que possível** (`if not exists`, `or replace`).
- **Reversível:** quando crítico, criar `*.down.sql` correspondente.

## Princípios

1. **Migrar é uma decisão arquitetural.** Toda migration que mude semântica deve ter ADR em [decisions/](../decisions/).
2. **Compatibilidade hacia atrás dentro do release.** Frontend antigo deve continuar funcionando até o deploy frente.
3. **Etapas para mudanças "perigosas"** (expand → contract):
   - **Expand:** adicionar nova coluna/tabela, deixando a antiga.
   - **Backfill:** preencher novos dados.
   - **Migrate code:** apontar frontend para o novo.
   - **Contract:** remover a antiga (em release separado).
4. **Nunca DROP em produção** sem janela de manutenção e confirmação explícita.

## Como aplicar localmente

Usando Supabase CLI (recomendado):

```bash
# instalar uma vez
npm i -g supabase

# linkar projeto
supabase link --project-ref <project-ref>

# aplicar pendentes em local/staging
supabase db push
```

Ou direto no SQL Editor do Supabase (apenas dev/staging — em prod, sempre via CLI ou pipeline).

## Como aplicar em produção

1. PR com a migration aprovada por outro engenheiro.
2. Pré-validar: rodar a migration em **staging** com snapshot recente de prod.
3. Janela de baixa carga (verificar [success-metrics.md](../prd/success-metrics.md) para horários).
4. Backup prévio do projeto (Supabase Dashboard → Database → Backups).
5. Aplicar via `supabase db push` (ou copy/paste no SQL Editor se for inviável CLI).
6. Validar smoke tests manuais nos fluxos críticos.
7. Monitorar logs por 1h.

## Tipos comuns

### Adicionar coluna nullable (seguro)

```sql
alter table profiles add column if not exists timezone text;
```

### Adicionar coluna NOT NULL (perigoso → seguir expand/contract)

```sql
-- Expand
alter table reviews add column reviewer_name text;
-- Backfill
update reviews r
set reviewer_name = coalesce(p.full_name, 'Cliente')
from profiles p
where r.client_id = p.id and r.reviewer_name is null;
-- Contract (em release posterior)
alter table reviews alter column reviewer_name set not null;
```

### Adicionar índice

Em prod, **CONCURRENTLY** para não travar:

```sql
create index concurrently if not exists idx_quotes_status_created
  on quotes(status, created_at desc);
```

(Não pode rodar dentro de transação — separar em migration própria.)

### Alterar policy RLS

1. Criar a nova policy.
2. Testar.
3. Remover a antiga em um segundo passo.

```sql
create policy "experts read own leads v2" on leads
  for select using (auth.uid() = expert_id);

drop policy if exists "Experts can view their leads" on leads;
```

## Como reverter

- Backup do Supabase (Database → Backups → Restore).
- Migration `down`: se foi `add column`, fazer `drop column`; se foi `drop column`, restore do backup.
- Comunicação obrigatória ao time antes de reverter.

## Boas práticas

- Uma mudança por migration. Misturar 5 alterações dificulta debug.
- Comentar **por que** no topo do arquivo, não só o que.
- Nunca usar dados específicos do user em migration (sem `where user_id = 'fulano'`).
- Para seeds de dev, use [seed.md](seed.md), não migration.
