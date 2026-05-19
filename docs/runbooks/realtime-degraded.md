# RB-040 — Realtime Degradado

## Sintomas

- Chat não atualiza sem refresh.
- Logs do cliente: `CHANNEL_ERROR`.
- Painel Supabase → Realtime mostra conexões caindo.

## Severidade

**P2** — funcionalidade degradada, mas chat funciona via refresh.

## Confirmação rápida

1. Abrir chat com duas contas; mandar mensagem; ver se chega instantaneamente.
2. DevTools → WS → conexão `realtime` aberta?
3. Painel Supabase → Realtime → conexões e erros.

## Causas comuns

| Causa                                            | Como confirmar                              |
| ------------------------------------------------ | ------------------------------------------- |
| Limite do plano excedido                         | Painel → uso vs. limite                     |
| Tabela `messages` saiu da publication            | `select * from pg_publication_tables;`      |
| Replicação Postgres degradada                    | `pg_stat_replication`                       |
| Política RLS impedindo entrega                   | Usuário deve poder SELECT a linha           |
| Cliente sem reconnect adequado                   | Logs do app                                 |

## Mitigação

- **Modo degradado** no chat: substituir Realtime por polling a cada 10s. Banner: "Atualizações em tempo real indisponíveis."
- Recolocar tabela na publication, se foi o caso:
  ```sql
  alter publication supabase_realtime add table public.messages;
  ```

## Correção

- Aumentar plano Supabase se for limite.
- Garantir reconnect robusto no `ChatService` (já há `subscribe(status => ...)`).
- Manter `messages` na publication via migration (não dependência de painel).

## Pós-incidente

- Adicionar métrica: "tempo entre INSERT em messages e recepção no canal" (p95).
- Documentar dependências em [api/realtime.md](../api/realtime.md).
