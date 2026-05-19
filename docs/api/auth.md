# Autenticação

Toda autenticação passa pelo **Supabase Auth**, encapsulado em [AuthService](../../src/app/services/auth.service.ts) que por sua vez usa [SupabaseService](../../src/app/services/supabase.service.ts).

## Endpoints relevantes (sem precisar chamar direto — o SDK abstrai)

| Endpoint                               | Operação                           |
| -------------------------------------- | ---------------------------------- |
| `POST /auth/v1/signup`                 | Criar conta (e-mail + senha)       |
| `POST /auth/v1/token?grant_type=password` | Login                          |
| `POST /auth/v1/token?grant_type=refresh_token` | Refresh do JWT             |
| `POST /auth/v1/logout`                 | Encerrar sessão                    |
| `POST /auth/v1/recover`                | Solicitar reset de senha           |
| `PUT  /auth/v1/user`                   | Atualizar dados do usuário         |
| `GET  /auth/v1/user`                   | Dados do usuário logado            |
| `GET  /auth/v1/authorize?provider=...` | Iniciar OAuth (Google, etc.)       |

## Fluxos

### 1. Cadastro por e-mail/senha

```ts
const { data, error } = await client.auth.signUp({
  email,
  password,
  options: {
    data: { profile_type: 'PERITO' }, // vira raw_user_meta_data
    emailRedirectTo: `${origin}/auth/callback`,
  },
});
```

O trigger `handle_new_user` cria a linha em `profiles` com `profile_type` extraído de `raw_user_meta_data` (default `PERITO`). Veja [database/triggers.md](../database/triggers.md).

### 2. Login

```ts
const { data, error } = await client.auth.signInWithPassword({ email, password });
```

JWT é guardado em `localStorage`. Auto-refresh é gerenciado pelo SDK.

### 3. OAuth

```ts
await client.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: `${origin}/auth/callback` },
});
```

Callback em [`/auth/callback`](../../src/app/pages/auth-callback/) chama `getSessionFromUrl()` (SDK lida) e redireciona para o dashboard.

### 4. Reset de senha

```ts
// pedir reset
await client.auth.resetPasswordForEmail(email, {
  redirectTo: `${origin}/reset-password`,
});

// na página de reset, com sessão temporária ativa:
await client.auth.updateUser({ password: newPassword });
```

### 5. Logout

```ts
await client.auth.signOut();
```

## Sessão atual

```ts
// snapshot
const { data: { session } } = await client.auth.getSession();

// reativo
client.auth.onAuthStateChange((event, session) => {
  // event: SIGNED_IN | SIGNED_OUT | TOKEN_REFRESHED | USER_UPDATED | PASSWORD_RECOVERY
});
```

`AuthService` centraliza isso e expõe `user`/`profile` como signals.

## JWT — claims relevantes

- `sub` — `auth.users.id` (= `profiles.id`).
- `email`.
- `role` — sempre `authenticated` para usuários logados (não confundir com `profile_type`).
- `aud`, `exp`, `iat`.

> O **papel de aplicação** (`PERITO/CONTRATANTE/ADMIN`) **não** está no JWT — vem de `profiles.profile_type`. Por isso o `AuthService` carrega o perfil após o login e o cacheia.

## Onde isso aparece no código

- [auth.service.ts](../../src/app/services/auth.service.ts) — wrapper das chamadas.
- [auth.guard.ts](../../src/app/guards/auth.guard.ts) — exige sessão.
- [expert.guard.ts](../../src/app/guards/expert.guard.ts) — exige `profile_type='PERITO'`.
- [admin.guard.ts](../../src/app/guards/admin.guard.ts) — exige `profile_type='ADMIN'`.
- Páginas: [login](../../src/app/pages/login/), [register](../../src/app/pages/register/), [register-expert](../../src/app/pages/register-expert/), [forgot-password](../../src/app/pages/forgot-password/), [reset-password](../../src/app/pages/reset-password/), [auth-callback](../../src/app/pages/auth-callback/).

## Erros comuns

| Erro                                  | Causa                                  | Solução                                       |
| ------------------------------------- | -------------------------------------- | --------------------------------------------- |
| `Invalid login credentials`           | E-mail ou senha errados                | Mensagem genérica ao usuário                  |
| `Email not confirmed`                 | Confirmação pendente                   | Reenviar e-mail; orientar usuário             |
| `User already registered`             | E-mail duplicado                       | Sugerir login ou recuperação                  |
| `JWT expired`                         | Refresh falhou ou sessão pausada longo demais | Forçar `signOut()` e redirect para `/login` |

## Configuração

- Provedores OAuth ativos: ver [supabase_auth_config.json](../../supabase_auth_config.json).
- Tempos de expiração de JWT/refresh: painel Supabase → Auth → Settings.
- Redirects permitidos: configurar no painel para evitar open redirect.
