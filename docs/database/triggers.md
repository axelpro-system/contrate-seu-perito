# Triggers e Funções

Triggers garantem regras críticas no banco — não dependem do cliente.

## `handle_new_user()`

**Onde:** [schema.sql](../../schema.sql) (`handle_new_user`).

**Quando:** após INSERT em `auth.users` (trigger `on_auth_user_created`).

**O que faz:** cria a linha em `public.profiles` com:

- `id` = id do user
- `contact_email` = e-mail do user
- `profile_type` = `raw_user_meta_data->>'profile_type'` ou `'PERITO'` por default
- `account_status` = `'PENDING'`
- `profile_visible` = `false`

**Por que `security definer`:** o trigger roda no contexto privilegiado para conseguir inserir mesmo antes do usuário ter JWT.

**Falha silenciosa:** o bloco `exception when others` captura erros e apenas loga `warning`, garantindo que a criação do `auth.users` não falhe.

> ⚠️ Se cadastros novos não estão criando `profiles`, verifique os logs Postgres por warnings `handle_new_user`.

---

## `update_updated_at()`

**Quando:** BEFORE UPDATE em `quotes` e `expert_services`.

**O que faz:** seta `new.updated_at = now()`.

**Aplicar onde:** sempre que uma tabela tiver `updated_at`. Hoje, falta em `profiles` (`updated_at` lá tem `default now()` no INSERT mas não atualiza). Avaliar adicionar.

---

## `update_expert_rating()`

**Quando:** AFTER INSERT em `reviews`.

**O que faz:** recalcula `profiles.rating` e `profiles.reviews_count` para o `expert_id` da review.

```sql
update profiles
set rating = (select coalesce(avg(rating), 0) from reviews where expert_id = NEW.expert_id),
    reviews_count = (select count(*) from reviews where expert_id = NEW.expert_id)
where id = NEW.expert_id;
```

**Implicações:**

- Não atualize `rating`/`reviews_count` na aplicação — o trigger é a fonte.
- Se um dia permitirmos DELETE de review, precisará de trigger AFTER DELETE também.

---

## `create_service_completion()`

**Quando:** AFTER UPDATE em `quotes`, quando status muda para `approved`.

**O que faz:**

```sql
if NEW.status = 'approved' and OLD.status != 'approved' then
  insert into service_completions (quote_id, expert_id, client_id)
  values (NEW.id, NEW.expert_id, NEW.requester_id);
end if;
```

**Implicação:** a aplicação **não** cria `service_completions` diretamente — apenas em casos administrativos excepcionais.

---

## `get_featured_experts(limit_count int)`

Função regular (não trigger), exposta como RPC. Ver [api/rpcs.md](../api/rpcs.md).

---

## Convenções

- **Nome em snake_case** com verbo no início.
- **`returns trigger`** + `language plpgsql`.
- **`security definer` apenas quando necessário** — registrar ADR.
- **Sem dependência de extensões obscuras** sem ADR.
- **Idempotência:** triggers devem lidar com reentrância segura.

## Como evoluir

1. Criar/alterar função e trigger em uma **migration** ([migrations.md](migrations.md)).
2. Testar em ambiente isolado com cenários de:
   - Caso normal,
   - Reentrância (UPDATE várias vezes seguidas),
   - Estado já satisfazendo a condição (não duplicar).
3. Documentar aqui.

## Como debugar

- Logs Postgres no painel Supabase mostram `RAISE WARNING` e `RAISE NOTICE`.
- Para investigar uma execução específica: `set log_statement = 'all'` no nível session (não em prod global).
- `pg_stat_user_functions` mostra contagem de execuções.
