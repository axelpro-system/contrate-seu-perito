# ERD — Diagrama Entidade-Relacionamento

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "1:1"
    PROFILES ||--o{ QUOTES : "expert / requester"
    PROFILES ||--o{ LEADS : "expert / client"
    PROFILES ||--o{ REVIEWS : "expert / client"
    PROFILES ||--o{ MESSAGES : "sender"
    PROFILES ||--o{ FAVORITES : "client / expert"
    PROFILES ||--o{ AVAILABILITY : ""
    PROFILES ||--o{ PORTFOLIO_ITEMS : ""
    PROFILES ||--o{ CERTIFICATES : ""
    PROFILES ||--o{ EXPERT_SERVICES : ""
    PROFILES ||--o{ NOTIFICATIONS : ""
    PROFILES ||--o{ AUDIT_LOGS : "actor"
    PROFILES ||--o{ SERVICE_COMPLETIONS : "expert / client"
    QUOTES ||--o{ MESSAGES : "conversa"
    QUOTES ||--o| SERVICE_COMPLETIONS : "ao aprovar"
    LEADS ||--o| REVIEWS : "origem opcional"
    SERVICE_COMPLETIONS ||--o| REVIEWS : "alimenta review"

    PROFILES {
        uuid id PK
        text full_name
        text profile_type
        text account_status
        boolean profile_visible
        numeric rating
        int reviews_count
    }
    QUOTES {
        uuid id PK
        uuid expert_id FK
        uuid requester_id FK
        text status
        text case_description
    }
    LEADS {
        uuid id PK
        uuid expert_id FK
        uuid client_id FK
        text message
    }
    REVIEWS {
        uuid id PK
        uuid expert_id FK
        uuid client_id FK
        int rating
        text reviewer_name
    }
    MESSAGES {
        uuid id PK
        uuid quote_id FK
        uuid sender_id FK
        text content
        boolean read
    }
    SERVICE_COMPLETIONS {
        uuid id PK
        uuid quote_id FK
        uuid expert_id FK
        uuid client_id FK
    }
```

## Cardinalidades importantes

- **profiles ↔ auth.users:** 1:1 estrita.
- **profiles → quotes:** um perito recebe muitas; um requester (autenticado) cria muitas.
- **quotes → messages:** 1:N com `ON DELETE CASCADE` em messages.
- **quotes → service_completions:** 1:1 (criado pelo trigger).
- **service_completions → reviews:** 1:0..1 (cliente pode não avaliar).
- **favorites:** N:N entre `clients` e `experts` (com unicidade por par).

## Diagrama de domínios (alto nível)

```mermaid
graph TB
    subgraph Identidade
        Profile
        Auth["auth.users"]
    end
    subgraph Discovery
        Specialty
        Portfolio
        Certificate
        ExpertService
        Availability
        Favorite
    end
    subgraph Engajamento
        Lead
        Quote
        Message
    end
    subgraph PósVenda
        ServiceCompletion
        Review
    end
    subgraph Sistema
        Notification
        AuditLog
        ContactSubmission
    end

    Auth --> Profile
    Profile --> Portfolio
    Profile --> Certificate
    Profile --> ExpertService
    Profile --> Availability
    Profile --> Favorite
    Profile --> Lead
    Profile --> Quote
    Quote --> Message
    Quote --> ServiceCompletion
    ServiceCompletion --> Review
    Lead --> Review
```
