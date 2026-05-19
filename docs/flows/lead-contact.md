# Fluxo: Contato (Lead)

Cliente abre o perfil público e dispara um lead.

```mermaid
sequenceDiagram
    actor C as Cliente
    participant SPA
    participant DB as Postgres
    actor P as Perito

    C->>SPA: /expert/:id (perfil público)
    SPA->>DB: SELECT profiles, reviews, portfolio_items, expert_services, availability
    DB-->>SPA: dados do perito
    C->>SPA: clica "Entrar em Contato"
    SPA->>SPA: abre MatDialog (ContactExpertDialog)
    alt cliente não autenticado
        SPA->>C: pede login/cadastro
    else cliente autenticado
        C->>SPA: preenche mensagem
        SPA->>DB: INSERT leads (expert_id, client_id, message)
        SPA->>DB: INSERT notifications (user_id=expert_id, type='lead.new', data={lead_id})
        SPA->>C: snackbar "Mensagem enviada!"
    end

    Note over P: ao logar
    P->>SPA: /expert-dashboard ou sininho
    SPA->>DB: SELECT notifications WHERE user_id=P.id AND read=false
    P->>SPA: clica notificação
    SPA->>DB: SELECT lead + profile do cliente
    SPA->>P: tela do lead com botão "Iniciar chat" ou "Criar orçamento"
```

## Decisões

- O **lead exige cliente identificado** (RN-040). Visitantes anônimos veem o botão mas são redirecionados para cadastro/login.
- A mensagem é **NOT NULL** — sem lead vazio (RN-042).
- Notificação é gerada imediatamente; e-mail transacional fica como próxima iteração ([roadmap.md](../prd/roadmap.md)).

## Conexões com outros fluxos

- Lead → eventualmente vira **quote** ([quote-lifecycle.md](quote-lifecycle.md)).
- Quote vira **service_completion** → **review** ([review-flow.md](review-flow.md)).

## Regras envolvidas

- [RN-040 a RN-044](../business-rules/regras-de-negocio.md#6-contato-e-leads).
