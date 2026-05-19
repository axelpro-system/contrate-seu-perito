# Acesso a Dados — `SupabaseService`

## 1. Regra de ouro

> Toda interação com o backend passa pelo [SupabaseService](../../src/app/services/supabase.service.ts). Componentes **nunca** chamam `createClient` ou montam queries diretas.

Por quê:

- **Trocabilidade.** Se um dia mudarmos de provider (ou introduzirmos uma camada própria), só um arquivo muda.
- **Instrumentação.** Logging, métricas e retry vivem em um lugar.
- **Erros uniformes.** Normalizar `PostgrestError` em uma classe interna.

## 2. Camadas

```
Componente (page/component)
    │
    ▼
Serviço de domínio (QuoteService, ChatService, ...)
    │   ← lógica de negócio + montagem de payload
    ▼
SupabaseService
    │   ← cliente Supabase, auth, storage, realtime
    ▼
Supabase (PostgREST + Auth + Storage + Realtime)
```

## 3. Padrões de leitura

```ts
// dentro de um service de domínio:
async listActiveExperts(specialty?: string): Promise<Expert[]> {
  const query = this.supa.client
    .from('profiles')
    .select('id, full_name, specialty, rating, reviews_count, avatar_url')
    .eq('profile_type', 'PERITO')
    .eq('account_status', 'ACTIVE')
    .eq('profile_visible', true);

  if (specialty) query.eq('specialty', specialty);

  const { data, error } = await query.order('rating', { ascending: false });
  if (error) throw this.supa.normalizeError(error);
  return data ?? [];
}
```

Diretrizes:

- **Sempre** selecionar colunas explicitamente (`.select('a, b, c')`), nunca `*`.
- Aplicar todos os filtros que o RLS já garantiria (defesa em profundidade + clareza).
- Ordenar/limitar no banco, não no cliente.

## 4. Padrões de escrita

```ts
async createReview(input: CreateReviewInput): Promise<Review> {
  // RN-073: reviewer_name vem do perfil do cliente, nunca do input
  const client = await this.profilesService.getById(input.clientId);
  const reviewerName = client?.full_name?.trim() || 'Cliente';

  const { data, error } = await this.supa.client
    .from('reviews')
    .insert({
      expert_id: input.expertId,
      client_id: input.clientId,
      rating: input.rating,
      comment: input.comment ?? null,
      reviewer_name: reviewerName,
      lead_id: input.leadId ?? null,
    })
    .select()
    .single();

  if (error) throw this.supa.normalizeError(error);
  return data;
}
```

Diretrizes:

- Validar invariantes antes do insert (ranges, requireds).
- Preencher campos derivados antes do envio (ex.: `reviewer_name`).
- Usar `.select().single()` quando precisar do registro recém-criado.

## 5. Realtime

Apenas onde valor justifica o custo. Hoje: `messages` no chat.

```ts
this.channel = this.supa.client
  .channel(`messages:${quoteId}`)
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'messages', filter: `quote_id=eq.${quoteId}` },
    (payload) => this.onNewMessage(payload.new as Message),
  )
  .subscribe();

// no ngOnDestroy:
this.supa.client.removeChannel(this.channel);
```

**Sempre** cancelar o canal no destroy para evitar vazamento.

## 6. Storage

```ts
async uploadAvatar(userId: string, file: File): Promise<string> {
  const path = `avatars/${userId}/${Date.now()}-${file.name}`;
  const { error } = await this.supa.client.storage.from('avatars').upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw this.supa.normalizeError(error);
  return this.supa.client.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}
```

- **Públicos:** `avatars/`, `portfolio/` → `getPublicUrl`.
- **Privados:** `cv/`, `documents/` → `createSignedUrl` com TTL curto.

## 7. Tratamento de erro

`SupabaseService` expõe `normalizeError(error)` que retorna uma `AppError` com:

- `code` (ex.: `RLS_DENIED`, `UNIQUE_VIOLATION`, `NETWORK`)
- `message` (texto amigável em PT-BR)
- `cause` (erro bruto, para log)

Componentes mostram `MatSnackBar` com `.message`. Devs leem `cause` no console.

## 8. Cache e revalidação

Estratégia atual: **request-on-demand** sem cache global. Adequado para o tamanho atual.

Quando avaliar cache (Signals/Stores):

- Listas que mudam pouco (especialidades, planos).
- Perfil do usuário autenticado.

Antes de introduzir uma store global (NgRx, Akita, signals state), registrar ADR.

## 9. Segurança no cliente

- Apenas `anon key` no cliente (ver [security/](../security/)).
- **Nunca** confiar em validação só no cliente — RLS sempre tem a última palavra.
- Sanitização de HTML: confiar no Angular; usar `DomSanitizer` somente quando estritamente necessário e com input controlado.

## 10. Testabilidade

- `SupabaseService` é injetado → fácil de mockar.
- Em testes, prover um mock que retorna fixtures determinísticas.
- Cobrir o serviço de domínio, não o `SupabaseService` em si.
