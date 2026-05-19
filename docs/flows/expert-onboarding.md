# Fluxo: Onboarding de Perito

Do cadastro até o perfil público.

```mermaid
sequenceDiagram
    actor P as Perito
    participant SPA
    participant Auth as Supabase Auth
    participant DB as Postgres
    actor A as Admin

    P->>SPA: /register-expert (form completo)
    SPA->>Auth: signUp({ profile_type: 'PERITO' })
    Auth->>DB: INSERT auth.users
    DB->>DB: TRIGGER handle_new_user → INSERT profiles<br/>(PENDING, profile_visible=false)
    Auth-->>SPA: session
    SPA->>P: Redirect /expert/onboarding

    P->>SPA: completa bio, especialidade, certificações, áreas
    SPA->>DB: UPDATE profiles (dados completos)
    SPA->>DB: INSERT certificates, expert_services, availability

    Note over A: rotina diária
    A->>SPA: /admin/pending-experts
    SPA->>DB: SELECT profiles WHERE account_status='PENDING' AND profile_type='PERITO'
    A->>SPA: clica "Aprovar"
    SPA->>DB: UPDATE profiles SET account_status='ACTIVE', approved_at=now(), approved_by=admin.id, profile_visible=true
    SPA->>DB: INSERT audit_logs (action='expert.approve', details={...})
    SPA->>DB: INSERT notifications (user_id=perito, type='expert.approved')
    DB-->>P: notificação (na próxima visita)
```

## Estados do perfil de perito

```mermaid
stateDiagram-v2
    [*] --> PENDING: criação
    PENDING --> ACTIVE: admin aprova
    PENDING --> REJECTED: admin rejeita
    ACTIVE --> SUSPENDED: violação leve
    ACTIVE --> BLOCKED: violação grave
    SUSPENDED --> ACTIVE: regularização
    BLOCKED --> [*]: encerramento
```

## Pontos críticos

- `profile_visible` começa `false` mesmo após `ACTIVE`. O perito decide quando publicar (RN-021).
- Aprovação registra `approved_by` (RN-012) — auditável.
- Toda transição grava `audit_logs` (RN-140).
- A rejeição deve mandar e-mail/notificação explicativa (boa prática, não obrigatória no schema).

## Regras envolvidas

- [RN-011, RN-012, RN-016, RN-020 a RN-024](../business-rules/regras-de-negocio.md).
- Veja também: [admin-approval.md](admin-approval.md).
