# Fluxo: Aprovação Administrativa de Perito

```mermaid
sequenceDiagram
    actor A as Admin
    participant SPA
    participant DB
    participant Notif

    A->>SPA: /admin/pending-experts
    SPA->>DB: SELECT profiles WHERE profile_type='PERITO' AND account_status='PENDING'
    DB-->>SPA: lista
    A->>SPA: abre perfil candidato, revisa bio/certificados/CV

    alt Aprovar
        A->>SPA: clica "Aprovar"
        SPA->>DB: UPDATE profiles<br/>SET account_status='ACTIVE', approved_at=now(),<br/>approved_by=admin.id, profile_visible=true
        SPA->>DB: INSERT audit_logs (action='expert.approve', details={expert_id, by, when})
        SPA->>DB: INSERT notifications (user_id=expert_id, type='expert.approved')
        SPA-->>A: snackbar "Aprovado"
    else Rejeitar
        A->>SPA: clica "Rejeitar" + motivo
        SPA->>DB: UPDATE profiles SET account_status='REJECTED'
        SPA->>DB: INSERT audit_logs (action='expert.reject', details={expert_id, by, when, reason})
        SPA->>DB: INSERT notifications (user_id=expert_id, type='expert.rejected', data={reason})
        SPA-->>A: snackbar "Rejeitado"
    else Solicitar mais informações
        A->>SPA: clica "Pedir mais info"
        SPA->>DB: INSERT notifications (user_id=expert_id, type='expert.more_info_required', data={message})
        Note over A: status permanece PENDING
    end
```

## Critérios de aprovação (sugestão de checklist)

1. Identidade: nome completo coerente com documentos.
2. Especialidade do catálogo (não livre).
3. Pelo menos 1 certificação válida com `issuing_organization` reconhecida.
4. Bio com escopo claro.
5. `cv_url` presente.
6. Foto de perfil profissional (avatar).

## Auditoria

Cada decisão grava `audit_logs` com `action ∈ {expert.approve, expert.reject, expert.more_info_required}` e `details` JSON com:

```json
{
  "expert_id": "uuid",
  "by": "admin_uuid",
  "when": "iso8601",
  "previous_status": "PENDING",
  "new_status": "ACTIVE | REJECTED",
  "reason": "string (opcional)"
}
```

## Regras envolvidas

- [RN-011, RN-012, RN-130, RN-131, RN-140](../business-rules/regras-de-negocio.md).
