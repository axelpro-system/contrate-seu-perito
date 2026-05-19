# Fluxo: Ciclo de vida do Orçamento

```mermaid
stateDiagram-v2
    [*] --> submitted: cliente envia
    submitted --> under_review: perito assume
    submitted --> rejected: perito recusa
    under_review --> approved: perito propõe + cliente aceita
    under_review --> rejected: alguma das partes recusa
    approved --> [*]: serviço executado<br/>(trigger gera service_completion)
    rejected --> [*]
```

## Sequência típica

```mermaid
sequenceDiagram
    actor C as Cliente
    participant SPA
    participant DB
    actor P as Perito

    C->>SPA: cria quote (case_description)
    SPA->>DB: INSERT quotes (status='submitted')
    DB->>DB: TRIGGER quotes_updated_at (default)
    SPA->>DB: INSERT notifications (P)
    P->>SPA: abre quote
    SPA->>DB: UPDATE quotes SET status='under_review' (opcional)
    P->>SPA: preenche proposed_value, proposed_deadline, expert_notes
    SPA->>DB: UPDATE quotes (campos + responded_at=now())
    SPA->>DB: INSERT notifications (C)
    C->>SPA: aceita
    SPA->>DB: UPDATE quotes SET status='approved'
    DB->>DB: TRIGGER quote_approved → INSERT service_completions
```

## Quem pode o quê

| Ação                                          | Quem                | RLS                                                  |
| --------------------------------------------- | ------------------- | ---------------------------------------------------- |
| Criar quote                                   | qualquer um (RN-051)| `Anyone can create quotes`                           |
| Ver quote                                     | requester + expert  | `Users can view their sent quotes`, `Experts can view received quotes` |
| Alterar `proposed_value`/`proposed_deadline`/`expert_notes` | perito | `Experts can update their quotes`                  |
| Alterar `status` para `approved`/`rejected` (do lado cliente) | cliente | `Requesters can update quote status` |
| Gerar `service_completions`                   | trigger             | n/a (banco)                                          |

## Notificações sugeridas

| Evento                       | Para         | Tipo                  |
| ---------------------------- | ------------ | --------------------- |
| Nova quote                   | Perito       | `quote.received`      |
| Perito respondeu             | Cliente      | `quote.responded`     |
| Quote aprovada               | Perito       | `quote.approved`      |
| Quote rejeitada              | ambos        | `quote.rejected`      |

(Implementar via [notification.service.ts](../../src/app/services/notification.service.ts).)

## Regras envolvidas

- [RN-050 a RN-056](../business-rules/regras-de-negocio.md#7-orçamentos-quotes).
- Trigger: [triggers.md](../database/triggers.md#create_service_completion).
