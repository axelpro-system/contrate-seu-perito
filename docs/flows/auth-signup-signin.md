# Fluxo: Autenticação

## Cadastro (e-mail/senha)

```mermaid
sequenceDiagram
    actor U as Usuário
    participant SPA as Angular SPA
    participant Auth as Supabase Auth
    participant DB as Postgres
    participant Email as Provedor SMTP

    U->>SPA: Preenche /register-expert ou /register
    SPA->>Auth: signUp(email, password, { data: { profile_type } })
    Auth->>DB: INSERT auth.users
    DB->>DB: TRIGGER handle_new_user → INSERT profiles (PENDING, profile_visible=false)
    Auth->>Email: e-mail de confirmação
    Email->>U: link de confirmação
    Auth-->>SPA: { user, session: null (até confirmar) }
    SPA->>U: Redirect /email-confirmation

    U->>Email: clica no link
    Email->>SPA: /auth/callback?token=...
    SPA->>Auth: getSessionFromUrl()
    Auth-->>SPA: { session }
    SPA->>U: Redirect dashboard correspondente ao papel
```

## Login

```mermaid
sequenceDiagram
    actor U as Usuário
    participant SPA
    participant Auth as Supabase Auth
    participant DB

    U->>SPA: /login (email, senha)
    SPA->>Auth: signInWithPassword
    Auth-->>SPA: { session: JWT }
    SPA->>DB: SELECT profile WHERE id = auth.uid()
    DB-->>SPA: profile (com profile_type, account_status)
    SPA->>SPA: AuthService.user/profile = signal(...)
    SPA->>U: Redirect dashboard
```

## OAuth

```mermaid
sequenceDiagram
    actor U
    participant SPA
    participant Auth
    participant Provider as Google/etc.

    U->>SPA: clica "Entrar com Google"
    SPA->>Auth: signInWithOAuth({ provider, redirectTo: /auth/callback })
    Auth->>Provider: redirect (OAuth dance)
    Provider->>U: tela de consentimento
    U->>Provider: autoriza
    Provider->>SPA: redirect /auth/callback?code=...
    SPA->>Auth: exchangeCodeForSession
    Auth-->>SPA: { session }
    SPA->>U: Redirect dashboard
```

## Login com 3 tentativas falhas → reset inline

Após 3 falhas consecutivas, a tela de login exibe um link "Esqueceu sua senha?" que dispara a Edge Function `send-password-reset` (não usa o `resetPasswordForEmail` nativo — ver [ADR-0008](../decisions/ADR-0008-resend-emails.md)).

```mermaid
sequenceDiagram
    actor U
    participant SPA as /login
    participant Auth as Supabase Auth
    participant Fn as Edge: send-password-reset
    participant Resend

    loop até 3 falhas
        U->>SPA: tenta login
        SPA->>Auth: signInWithPassword
        Auth-->>SPA: error invalid_credentials
        SPA->>SPA: failedAttempts++
    end
    SPA->>U: revela link "Esqueceu sua senha?"
    U->>SPA: clica no link
    SPA->>Fn: functions.invoke('send-password-reset', { email, redirectUrl })
    Fn->>Auth: admin.generateLink({ type: 'recovery', email })
    Auth-->>Fn: action_link
    Fn->>Resend: POST /emails (HTML branded com link)
    Resend-->>U: e-mail
    U->>SPA: /reset-password?token=...
    SPA->>Auth: getSessionFromUrl
    U->>SPA: nova senha
    SPA->>Auth: updateUser({ password })
    SPA->>U: redirect dashboard
```

## Recuperação de senha (via /forgot-password)

Mesmo fluxo, disparado a partir da página dedicada:

```mermaid
sequenceDiagram
    actor U
    participant SPA
    participant Fn as Edge: send-password-reset
    participant Resend

    U->>SPA: /forgot-password (email)
    SPA->>Fn: functions.invoke('send-password-reset', { email })
    Fn->>Resend: envia e-mail customizado
    Resend-->>U: link
    U->>SPA: /reset-password?token=...
    SPA->>SPA: updatePassword
```

## Estados da sessão

```mermaid
stateDiagram-v2
    [*] --> Anônimo
    Anônimo --> Autenticado: signIn / OAuth ok
    Anônimo --> AguardandoConfirmação: signUp
    AguardandoConfirmação --> Autenticado: clicar no link de e-mail
    Autenticado --> Anônimo: signOut
    Autenticado --> Anônimo: token expirado (sem refresh)
    Autenticado --> Autenticado: refresh token
```

## Regras envolvidas

- [RN-001 a RN-016](../business-rules/regras-de-negocio.md#3-cadastro-e-ciclo-de-vida-da-conta) — papéis, estados de conta, default `PENDING`.
- [RN-017](../business-rules/regras-de-negocio.md) — 3 tentativas falhas revelam reset de senha.
- [auth.md](../api/auth.md) — endpoints e claims.
- [edge-functions.md](../api/edge-functions.md) — `send-password-reset` detalhado.
- [triggers.md](../database/triggers.md#handle_new_user) — criação automática de `profiles`.
