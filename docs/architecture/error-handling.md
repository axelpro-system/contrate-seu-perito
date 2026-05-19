# Tratamento de Erros

## Princípios

1. **Falhe explicitamente.** Sem `catch` silencioso. Todo erro vira log + mensagem ao usuário (quando aplicável).
2. **Mensagens em PT-BR para o usuário; em inglês para devs.** Snackbar mostra texto humano; console mostra a causa técnica.
3. **Erros de RLS são esperados.** Tratar como negação de autorização, não como bug.
4. **Nunca expor segredos** em mensagens (stack traces com `service_role` etc. nunca aparecem na UI — só no console).

## Hierarquia

```
SupabaseService.normalizeError(raw)
        │
        ▼
AppError { code, message, cause }
        │
        ▼
Componente decide: snackbar / dialog / redirect
```

### Códigos de `AppError`

| `code`               | Origem típica                         | Ação recomendada                       |
| -------------------- | ------------------------------------- | -------------------------------------- |
| `RLS_DENIED`         | 401/403 do PostgREST                  | Mostrar "Você não tem permissão"      |
| `UNIQUE_VIOLATION`   | `23505` (Postgres)                    | Mostrar campo conflitante              |
| `FK_VIOLATION`       | `23503`                               | "Registro relacionado não encontrado" |
| `CHECK_VIOLATION`    | `23514`                               | Validação de regra (mostrar contexto)  |
| `NOT_FOUND`          | resposta vazia em `.single()`         | "Não encontramos esse item"            |
| `NETWORK`            | fetch fail / timeout                  | "Conexão instável, tente de novo"      |
| `AUTH_REQUIRED`      | sessão expirada                       | Redirect para `/login`                 |
| `UNKNOWN`            | qualquer outro                        | "Algo deu errado" + log                |

## Padrões em componentes

```ts
async onSubmit() {
  this.loading.set(true);
  try {
    const review = await this.reviewService.create(this.form.value);
    this.snack.open('Avaliação enviada!', 'OK', { duration: 3000 });
    this.router.navigate(['/expert', review.expert_id]);
  } catch (e) {
    const err = e as AppError;
    console.error(err.cause ?? err);
    this.snack.open(err.message, 'Fechar', { duration: 5000, panelClass: 'snack-error' });
  } finally {
    this.loading.set(false);
  }
}
```

Diretrizes:

- Sempre setar/limpar `loading` em `finally`.
- Logar `err.cause` (objeto bruto), mostrar `err.message` (já amigável).
- Não bloquear o usuário em erros recuperáveis — oferecer ação ("Tentar de novo").

## Erros não capturados

Há um `ErrorHandler` global registrado em [app.config.ts](../../src/app/app.config.ts) que:

1. Loga no console com contexto (rota, usuário).
2. Mostra snackbar genérico.
3. (Futuro) envia para serviço de observabilidade (ver [devops/observability.md](../devops/observability.md)).

## Validação de formulários

- **Cliente:** Reactive Forms + `Validators` síncronos/async — feedback imediato.
- **Servidor:** RLS + constraints SQL — fonte da verdade.

Quando o servidor recusa apesar do cliente passar, o erro normalizado vira snackbar.

## Tratamento de Realtime

- Falha de canal não deve quebrar a tela. Exibir badge "Tempo real indisponível" e oferecer reload.
- Reconnect: o SDK tenta sozinho; logar tentativas.

## Erros conhecidos / FAQ

| Sintoma                                              | Causa provável                              | Mitigação                                       |
| ---------------------------------------------------- | ------------------------------------------- | ----------------------------------------------- |
| "permission denied for table X"                      | Policy RLS faltando ou sessão sem JWT       | Verificar [security/rls.md](../security/rls.md) |
| Insert volta `RLS_DENIED` em prod, ok em dev         | Diferença em `account_status` do usuário    | Comparar dados; nunca relaxar RLS               |
| Realtime nunca dispara                               | Tabela sem `replication`/Realtime habilitado| Verificar painel Supabase                       |
| Login OAuth volta sem perfil                         | Trigger `handle_new_user` falhou            | Ver [database/triggers.md](../database/triggers.md) |
