# RB-010 — Supabase Indisponível

## Sintomas

- SPA mostra mensagens "Não foi possível carregar..." em massa.
- DevTools → Network: requisições a `*.supabase.co` retornam 5xx ou timeout.
- Alerta de erro frontend dispara.

## Severidade

**P1** se >50% das requisições falham. **P2** se intermitente.

## Confirmação rápida

1. [status.supabase.com](https://status.supabase.com) — incidente em curso?
2. Painel Supabase → tentar abrir → erro?
3. `curl -i https://<projeto>.supabase.co/rest/v1/profiles?select=id -H "apikey: <anon>"`

## Mitigação

### Se for incidente do Supabase

- Não há "fix" local. Comunicar `#engineering` e usuários (status page).
- Habilitar modo degradado (feature flag) que mostre banner: "Estamos com instabilidade momentânea, tente em alguns minutos."

### Se for projeto específico (não plataforma toda)

- Painel Supabase → Project → Restart (último recurso; perde conexões ativas).
- Verificar logs Postgres: alguma query infinita está bloqueando?
- Verificar conexões: `select count(*) from pg_stat_activity;` (precisa de admin do DB).

## Correção

- Aguardar resolução do incidente do provedor (caso 1).
- Otimizar/cancelar queries problemáticas (caso 2):
  ```sql
  -- queries ativas há mais de 1 min
  select pid, now()-pg_stat_activity.query_start as duration, query, state
  from pg_stat_activity
  where (now()-query_start) > interval '1 minute' and state != 'idle';
  -- cancelar
  select pg_cancel_backend(<pid>);
  -- forçar
  select pg_terminate_backend(<pid>);
  ```

## Comunicação

- `#engineering`: "Supabase com instabilidade desde HH:MM. Status: <link>. Aguardando."
- Status page pública.
- E-mail/aviso a peritos críticos se durar >1h.

## Pós-incidente

1. Salvar evidências (capturas do status, logs).
2. Avaliar plano: precisamos de redundância? Edge cache para leituras?
3. Atualizar runbook se aprendemos algo novo.
