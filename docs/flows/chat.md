# Fluxo: Chat (Mensagens em tempo real)

Conversa atrelada a uma `quote`. Apenas participantes leem/enviam (RN-061).

```mermaid
sequenceDiagram
    actor A as Participante A
    actor B as Participante B
    participant SPA_A as SPA (A)
    participant SPA_B as SPA (B)
    participant RT as Supabase Realtime
    participant DB as Postgres

    A->>SPA_A: abre /chat/:quoteId
    SPA_A->>DB: SELECT messages WHERE quote_id=...
    DB-->>SPA_A: histórico
    SPA_A->>RT: channel("messages:quoteId").on(INSERT, filter quote_id=eq...)

    B->>SPA_B: já online (canal aberto)

    A->>SPA_A: digita e envia
    SPA_A->>DB: INSERT messages (quote_id, sender_id=A, content)
    DB->>RT: replicação (CDC)
    RT-->>SPA_A: payload INSERT
    RT-->>SPA_B: payload INSERT
    SPA_B->>B: mostra mensagem instantânea

    Note over A,B: marcar como lido (opcional)
    B->>SPA_B: scroll até a mensagem
    SPA_B->>DB: UPDATE messages SET read=true WHERE id=...
    DB->>RT: replicação UPDATE
    RT-->>SPA_A: payload UPDATE
    SPA_A->>A: indicador "lido"
```

## Setup do canal

Ver [api/realtime.md](../api/realtime.md). Resumo:

```ts
channel = client
  .channel(`messages:${quoteId}`)
  .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `quote_id=eq.${quoteId}` },
      onInsert)
  .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'messages', filter: `quote_id=eq.${quoteId}` },
      onUpdate)
  .subscribe();
```

**Sempre** `removeChannel` no `ngOnDestroy`.

## Edge cases

| Caso                                  | Comportamento esperado                              |
| ------------------------------------- | --------------------------------------------------- |
| Usuário não-participante tenta entrar | RLS bloqueia SELECT → tela vazia/erro 403           |
| Conexão cai                           | SDK reconecta; mostrar badge "reconectando…"        |
| Mensagem chega duplicada              | Deduplicar por `id` na lista                        |
| Quote deletada                        | `messages ON DELETE CASCADE` limpa o histórico      |
| Mensagem vazia                        | `content NOT NULL` bloqueia (RN-062)                |

## Regras envolvidas

- [RN-060 a RN-064](../business-rules/regras-de-negocio.md#8-chat-mensagens).
