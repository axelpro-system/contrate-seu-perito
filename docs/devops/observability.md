# Observabilidade

## Pilares

1. **Logs** — eventos discretos com contexto.
2. **Métricas** — números agregados ao longo do tempo.
3. **Traces** — caminho de uma requisição entre serviços.

V1 cobre logs (cliente + Supabase). Métricas e traces formais ficam como evolução.

## Logs

### Frontend

- `console.error` para erros não capturados (handler global em [app.config.ts](../../src/app/app.config.ts)).
- Estruturar como JSON quando enviar para serviço externo:
  ```json
  { "level": "error", "ts": "...", "user_id": "...", "route": "/expert/:id", "code": "RLS_DENIED", "message": "...", "cause": {...} }
  ```
- Nunca logar segredos, tokens, conteúdo de mensagens privadas.

### Supabase

Painel → Logs:

- **Auth** — signup, signin, password reset.
- **Postgres** — slow queries, erros.
- **API (PostgREST)** — status, latência.
- **Realtime** — conexões.
- **Storage** — uploads/downloads.

Retenção padrão: 1-7 dias (plano pago aumenta).

### Serviço de error tracking (proposta)

Sentry (ou alternativas: Bugsnag, Honeybadger):

- Captura uncaught errors do browser.
- Source maps (uploadados separadamente — ver [build.md](build.md#source-maps-em-produção)).
- Breadcrumbs (cliques, navegações).
- User context (apenas `id`, nunca PII).

Antes de adotar, registrar ADR.

## Métricas a acompanhar

| Categoria       | Métrica                              | Fonte                          | Limiar de alerta            |
| --------------- | ------------------------------------ | ------------------------------ | --------------------------- |
| Saúde da SPA    | Taxa de erro frontend                | Sentry                         | > 1% sessões com erro       |
| Backend         | Latência p95 API                     | Painel Supabase                | > 500ms por 5min            |
| Backend         | Erros 5xx                            | Painel Supabase                | > 0.5%                      |
| Auth            | Falhas de login (anomalia)           | Logs Auth                      | spike > 3σ                  |
| Realtime        | Conexões abertas                     | Painel Supabase                | > limite do plano           |
| Banco           | Conexões abertas                     | `pg_stat_activity`             | > 80% do pool               |
| Banco           | Slow queries                         | `pg_stat_statements`           | qualquer > 1s recorrente    |
| Storage         | Bandwidth diária                     | Painel Supabase                | > limite do plano           |
| Negócio         | Conversas qualificadas / semana      | RPC custom                     | queda > 30% sem.-sem.       |

## Dashboards (alvo)

1. **Saúde técnica:** erros, latência, conexões.
2. **Funil de produto:** cadastros → ativações → conversas qualificadas.
3. **Operação:** aprovações pendentes, tickets, moderação.

## Alertas

- Canal `#alerts` no Slack.
- Severidade:
  - **P1:** prod fora — chama on-call (telefone).
  - **P2:** degradação — Slack imediato.
  - **P3:** anomalia — Slack, sem urgência.

## Runbooks

Cada alerta tem runbook em [runbooks/](../runbooks/) com:

- Sintomas.
- Confirmação rápida.
- Mitigação.
- Pós-incidente.

## Auditoria

`audit_logs` no banco é a fonte para investigar **ações de usuário/admin**:

```sql
select created_at, user_id, action, details
from audit_logs
where action like 'expert.%'
order by created_at desc
limit 100;
```

Combine com logs do Auth para reconstruir incidentes de segurança.
