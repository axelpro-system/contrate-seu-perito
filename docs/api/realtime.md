# Realtime

Supabase Realtime emite eventos de CDC (Change Data Capture) do Postgres. Usado quando o usuário precisa ver mudanças sem refresh.

## Onde usamos hoje

- **Chat (`messages`)** — novas mensagens aparecem instantaneamente para os dois lados da conversa.

## Quando NÃO usar

- Listas que mudam pouco (catálogo, perfis) — preferir refetch on-focus.
- Operações que precisam ser autoritativas (preferir polling controlado).
- Páginas com muitos usuários simultâneos lendo a mesma tabela inteira (custo + carga).

## Padrão de assinatura

```ts
private channel?: RealtimeChannel;

ngOnInit() {
  this.channel = this.supa.client
    .channel(`messages:${this.quoteId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `quote_id=eq.${this.quoteId}`,
      },
      (payload) => this.onNewMessage(payload.new as Message),
    )
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `quote_id=eq.${this.quoteId}` },
      (payload) => this.onMessageUpdated(payload.new as Message),
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') this.realtimeOk.set(true);
      if (status === 'CHANNEL_ERROR') this.realtimeOk.set(false);
    });
}

ngOnDestroy() {
  if (this.channel) this.supa.client.removeChannel(this.channel);
}
```

## Eventos suportados

| Evento     | Quando dispara                       |
| ---------- | ------------------------------------ |
| `INSERT`   | Nova linha                           |
| `UPDATE`   | Alteração de linha                   |
| `DELETE`   | Remoção (apenas se replicação plena) |
| `*`        | Qualquer um dos acima                |

## Filtros

- `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in` — sintaxe: `coluna=op.valor`.
- Compor filtros via múltiplos `.on()`.

## Pré-requisitos no banco

1. A tabela precisa estar em `supabase_realtime` publication:
   ```sql
   alter publication supabase_realtime add table public.messages;
   ```
2. RLS continua valendo — só recebe eventos sobre linhas que o JWT poderia ler via SELECT.

## Boas práticas

- **Nomeie canais por escopo** (`messages:<quoteId>`) para evitar broadcast desnecessário.
- **Cancele no destroy** — caso contrário, vazamento + cobrança.
- **Trate `CHANNEL_ERROR`** — mostrar badge "tempo real indisponível" e botão de reconectar.
- **Limite por usuário** — não abrir mais de 1 canal por aba para a mesma feature.
- **Idempotência:** lidar com possíveis eventos duplicados (Supabase pode reenviar em reconexão).

## Presence e Broadcast (não usado em V1)

Realtime também suporta `presence` (quem está online) e `broadcast` (pub/sub sem persistência). Antes de adotar, registrar ADR — aumenta complexidade e custo.

## Debug

- DevTools → WebSocket → filtrar por `realtime`.
- No Postgres: `select * from pg_stat_replication;` para confirmar replicação ativa.
