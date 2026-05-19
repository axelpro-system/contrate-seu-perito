# Erros da API

PostgREST e Supabase Auth retornam erros como objetos JSON com `code`, `message` e (às vezes) `details`/`hint`. O SDK encapsula em `PostgrestError` ou `AuthError`.

## Tabela de referência

### PostgreSQL → PostgREST

| `code` (SQLSTATE) | Significado                  | HTTP típico | Como tratar                                                  |
| ----------------- | ---------------------------- | ----------- | ------------------------------------------------------------ |
| `23505`           | unique_violation             | 409         | Mostrar campo conflitante ("E-mail já cadastrado")           |
| `23503`           | foreign_key_violation        | 409         | "Registro referenciado não encontrado"                       |
| `23502`           | not_null_violation           | 400         | Campo obrigatório vazio — feedback no form                   |
| `23514`           | check_violation              | 400         | "Valor inválido para X"                                      |
| `42501`           | insufficient_privilege       | 403         | RLS negou — mostrar "Sem permissão" + log                    |
| `PGRST116`        | resultado de `.single()` vazio | 406       | Tratar como `NOT_FOUND`                                      |
| `PGRST301`        | JWT expirado                 | 401         | Forçar logout + redirect login                               |
| `PGRST204`        | coluna desconhecida          | 400         | Bug — alinhar com schema atual                               |

### Supabase Auth

| `message` (parcial)              | Significado                          | Ação                                       |
| -------------------------------- | ------------------------------------ | ------------------------------------------ |
| `Invalid login credentials`      | E-mail ou senha incorretos           | Mensagem genérica (não vaze qual está errado) |
| `Email not confirmed`            | Confirmação pendente                 | Oferecer reenvio                           |
| `User already registered`        | Cadastro duplicado                   | Sugerir login                              |
| `For security purposes, ...`     | Rate limit                           | Esperar e tentar de novo                   |
| `Token has expired`              | Sessão expirada                      | Logout silencioso + redirect               |

### HTTP genéricos

| Status | Causa típica                              |
| ------ | ----------------------------------------- |
| 400    | Payload mal formado / validação           |
| 401    | Sem JWT ou expirado                       |
| 403    | RLS negou                                 |
| 404    | Tabela/RPC não encontrada                 |
| 406    | `.single()` sem resultado                 |
| 409    | Conflito (unique/fk)                      |
| 429    | Rate limit                                |
| 500    | Erro inesperado no Postgres / função      |
| 503    | Supabase indisponível / manutenção        |

## Normalização

[SupabaseService.normalizeError()](../../src/app/services/supabase.service.ts) deve traduzir erros brutos em `AppError`. Padrão:

```ts
type AppErrorCode =
  | 'RLS_DENIED'
  | 'UNIQUE_VIOLATION'
  | 'FK_VIOLATION'
  | 'CHECK_VIOLATION'
  | 'NOT_NULL'
  | 'NOT_FOUND'
  | 'AUTH_REQUIRED'
  | 'NETWORK'
  | 'RATE_LIMIT'
  | 'UNKNOWN';

interface AppError {
  code: AppErrorCode;
  message: string; // PT-BR amigável
  cause: unknown;  // erro bruto
  fieldHint?: string; // coluna/constraint, se aplicável
}
```

Veja [architecture/error-handling.md](../architecture/error-handling.md) para o uso em componentes.

## Como debugar

1. **Console (`console.error(err.cause)`):** ver `code`, `message`, `details`, `hint`.
2. **Painel Supabase → Logs → Postgres logs:** ver o SQL que falhou.
3. **Painel Supabase → API → Logs:** rastrear a chamada HTTP.
4. **DevTools → Network:** olhar response do PostgREST.

## Mensagens ao usuário

- **Genérico:** "Não foi possível completar a operação. Tente novamente."
- **Permissão:** "Você não tem permissão para fazer isso."
- **Sessão:** "Sua sessão expirou. Faça login novamente."
- **Rede:** "Estamos com instabilidade. Tente em alguns instantes."
- **Validação:** específica por campo (`MatError` no form).
- **Conflito:** "Este e-mail já está cadastrado." (ou similar específico).

**Nunca expor:** stack trace, SQL bruto, constraint name técnico (`profiles_contact_email_key`).
