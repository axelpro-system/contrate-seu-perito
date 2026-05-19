# API

Não temos um servidor próprio. Nossa "API" é o **PostgREST** exposto pelo Supabase sobre nosso schema, controlado por RLS. Esta pasta documenta como o frontend conversa com o backend.

| Documento                                              | Conteúdo                                                  |
| ------------------------------------------------------ | --------------------------------------------------------- |
| [postgrest.md](postgrest.md)                           | Padrão de chamada via `supabase-js`, filtros, paginação   |
| [endpoints.md](endpoints.md)                           | Recursos REST por tabela (verbos, payloads, exemplos)     |
| [rpcs.md](rpcs.md)                                     | Funções SQL chamadas via `rpc()`                          |
| [edge-functions.md](edge-functions.md)                 | Deno Edge Functions (admin, e-mail, integrações)          |
| [realtime.md](realtime.md)                             | Canais de mudanças em tempo real                          |
| [auth.md](auth.md)                                     | Endpoints de autenticação (signUp, signIn, OAuth, reset)  |
| [storage.md](storage.md)                               | Buckets, upload, URLs assinadas                           |
| [errors.md](errors.md)                                 | Códigos de erro do PostgREST e como tratá-los             |

## Convenções

- **Base URL:** `https://<projeto>.supabase.co/rest/v1`
- **Auth:** header `Authorization: Bearer <JWT>` (gerenciado pelo SDK).
- **Anon key:** header `apikey: <ANON>` (público; vai no bundle).
- **Versionamento:** sem versionamento explícito; quebras são tratadas como **migration** no schema e em uma ADR.

## Onde olhar primeiro

- Para usar uma feature já existente → [endpoints.md](endpoints.md).
- Para criar nova feature → [postgrest.md](postgrest.md) + [database/migrations.md](../database/migrations.md).
- Para erros 401/403 → [auth.md](auth.md) e [errors.md](errors.md).
