# Row-Level Security (RLS)

RLS é a **fonte de verdade da autorização**. Guards do Angular são UX; o banco decide quem pode ler/escrever cada linha.

Toda tabela em `public` tem `ENABLE ROW LEVEL SECURITY`. Sem policy = sem acesso.

## Princípios

1. **Deny by default.** Habilitar RLS antes de criar policies — assim qualquer "esquecimento" trava o acesso.
2. **Use `auth.uid()`.** É o `id` do usuário JWT atual.
3. **Use `auth.role()`.** Retorna `anon` ou `authenticated`.
4. **Admin é checado via subselect** (`exists (select 1 from profiles where id = auth.uid() and profile_type = 'ADMIN')`).
5. **Defesa em profundidade.** Mesmo com RLS, repita filtros no SDK (clareza + performance).

## Policies por tabela (resumo)

### `profiles`

| Operação | Policy                                      | Condição                                                            |
| -------- | ------------------------------------------- | ------------------------------------------------------------------- |
| SELECT   | Public profiles are viewable by everyone    | `profile_type='PERITO' AND account_status='ACTIVE' AND profile_visible=true` |
| SELECT   | Authenticated users can view profiles       | `auth.uid() is not null`                                            |
| INSERT   | Enable insert for new users                 | `true` (trigger faz o trabalho)                                     |
| UPDATE   | Users can update own profile                | `auth.uid() = id`                                                   |
| ALL      | Admins can manage profiles                  | usuário tem `profile_type='ADMIN'`                                  |

### `quotes`

| Operação | Condição                              |
| -------- | ------------------------------------- |
| INSERT   | qualquer um (anônimo permitido)       |
| SELECT   | `auth.uid() IN (requester_id, expert_id)` |
| UPDATE   | mesmo                                 |

### `messages`

| Operação | Condição                                                              |
| -------- | --------------------------------------------------------------------- |
| SELECT/INSERT/UPDATE | participante da quote (subselect em `quotes`)              |

### `leads`

| Operação | Condição                                  |
| -------- | ----------------------------------------- |
| INSERT   | `true` (controle no app: exige auth)      |
| SELECT   | `auth.uid() IN (client_id, expert_id)`    |

### `reviews`

| Operação | Condição                       |
| -------- | ------------------------------ |
| INSERT   | `true` (validação na app, RN-073) |
| SELECT   | `true` (públicas)              |

### `favorites`

| Operação | Condição                       |
| -------- | ------------------------------ |
| SELECT   | `true`                         |
| ALL      | `auth.uid() = client_id`       |

### `availability`, `portfolio_items`, `certificates`, `expert_services`

| Operação | Condição                       |
| -------- | ------------------------------ |
| SELECT   | `true` (para `expert_services`, exige perito público) |
| ALL      | `auth.uid() = expert_id` (ou `profile_id`)            |

### `notifications`

| Operação | Condição                       |
| -------- | ------------------------------ |
| SELECT   | `auth.uid() = user_id`         |
| UPDATE   | `auth.uid() = user_id`         |
| INSERT   | `true` (sistema)               |

### `audit_logs`

| Operação | Condição                       |
| -------- | ------------------------------ |
| SELECT   | ADMIN apenas                   |
| INSERT   | feito pela aplicação           |

### `specialties`, `contact_submissions`

| Operação | Condição                                       |
| -------- | ---------------------------------------------- |
| SELECT (specialties) | `true`                              |
| INSERT (contact_submissions) | `true`                      |

## Padrão para escrever uma policy nova

```sql
-- 1. Habilitar RLS
alter table foo enable row level security;

-- 2. Policies explícitas por verbo (mais legível que ALL)
create policy "owners read own"  on foo for select using (auth.uid() = owner_id);
create policy "owners write own" on foo for insert with check (auth.uid() = owner_id);
create policy "owners update own" on foo for update using (auth.uid() = owner_id);
create policy "owners delete own" on foo for delete using (auth.uid() = owner_id);

-- 3. Admin override (se aplicável)
create policy "admins manage foo" on foo for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.profile_type = 'ADMIN'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.profile_type = 'ADMIN'));
```

## Armadilhas comuns

- **`USING` x `WITH CHECK`**: `USING` filtra leitura/update existentes; `WITH CHECK` valida o novo estado em INSERT/UPDATE. Para UPDATE seguro, use os dois.
- **Subselect em policy** pode ser custoso. Para performance, considere `security definer` em função auxiliar.
- **Policies sobrepostas** combinam por `OR`. Cuidado para não abrir acesso indesejado.
- **`auth.uid()` em policy de `INSERT`** só funciona se o token for válido — sessões anônimas verão `null`.

## Como testar RLS

1. **SQL Editor (Supabase):** rodar `set role authenticated; set request.jwt.claims = '{"sub":"<uuid>"}';` e testar SELECTs.
2. **Frontend dev:** logar com usuário de teste e tentar a operação.
3. **Negativos importam tanto quanto positivos** — verificar que o que **não** deveria funcionar de fato falha.

## Auditoria periódica

Trimestralmente (mínimo):

- Listar tabelas sem RLS: `select tablename from pg_tables where schemaname='public' and rowsecurity = false;`
- Listar policies por tabela: `select * from pg_policies where schemaname='public';`
- Revisar com base nas regras em [business-rules/](../business-rules/regras-de-negocio.md).
