# Seed (dados de exemplo)

## Quando usar

- **Dev local / staging:** popular catálogo (especialidades) e contas de teste.
- **CI:** garantir massa de dados determinística para testes E2E.
- **Nunca em produção.** Seed é para ambientes não-produtivos.

## Local sugerido

```
supabase/seed/
├── 00_specialties.sql
├── 10_users.sql
├── 20_experts.sql
├── 30_quotes.sql
└── 40_reviews.sql
```

## Exemplo: catálogo de especialidades

```sql
insert into specialties (label, active) values
  ('Engenharia Civil', true),
  ('Engenharia Elétrica', true),
  ('Engenharia Mecânica', true),
  ('Contabilidade Forense', true),
  ('Grafotécnica', true),
  ('Medicina do Trabalho', true),
  ('Ambiental', true),
  ('Tecnologia da Informação', true),
  ('Avaliação de Imóveis', true)
on conflict (label) do nothing;
```

## Exemplo: contas de teste

```sql
-- Usuários no Supabase Auth devem ser criados via API (signUp ou Admin API), não direto em auth.users
-- Aqui seedamos apenas profiles supondo que os auth.users já existem.

insert into profiles (id, full_name, profile_type, account_status, profile_visible, specialty, city, state)
values
  ('11111111-1111-1111-1111-111111111111', 'Perito Demo', 'PERITO', 'ACTIVE', true, 'Grafotécnica', 'São Paulo', 'SP'),
  ('22222222-2222-2222-2222-222222222222', 'Cliente Demo', 'CONTRATANTE', 'ACTIVE', false, null, 'Rio de Janeiro', 'RJ'),
  ('99999999-9999-9999-9999-999999999999', 'Admin Demo',   'ADMIN',       'ACTIVE', false, null, 'São Paulo', 'SP')
on conflict (id) do update set
  full_name = excluded.full_name,
  account_status = excluded.account_status,
  profile_visible = excluded.profile_visible;
```

## Exemplo: review respeitando RN-073

```sql
-- garantindo reviewer_name vindo do perfil do cliente
with c as (select id, coalesce(full_name, 'Cliente') as nome from profiles where id = '22222222-2222-2222-2222-222222222222')
insert into reviews (expert_id, client_id, rating, comment)
select '11111111-1111-1111-1111-111111111111', c.id, 5, 'Excelente trabalho!'
from c;
```

> Se/quando `reviews.reviewer_name` virar NOT NULL no schema, atualize este insert para preenchê-lo.

## Boas práticas

- **IDs estáveis** nos seeds (UUIDs fixos) — facilita testes que referenciam por ID.
- **`ON CONFLICT DO NOTHING`** para idempotência.
- **Separar seed de dev × seed de teste.** Testes não devem depender de catálogo mutável.
- **Não comitar segredos** em seed (senhas reais, e-mails reais).

## Comando

Via CLI:

```bash
supabase db reset    # recria local com migrations + seed
psql "$DATABASE_URL" -f supabase/seed/00_specialties.sql
```

## Limpeza

Para resetar dados de teste sem dropar schema:

```sql
truncate
  messages,
  reviews,
  service_completions,
  quotes,
  leads,
  favorites,
  availability,
  portfolio_items,
  certificates,
  expert_services,
  notifications,
  audit_logs,
  contact_submissions
restart identity cascade;
```

(`profiles` e `auth.users` não são truncados — manter contas de demo.)
