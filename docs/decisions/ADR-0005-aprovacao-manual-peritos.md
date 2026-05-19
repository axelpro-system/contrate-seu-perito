# ADR-0005 — Aprovação manual de peritos antes de publicar

- **Status:** Accepted
- **Data:** 2026-01-30 (retroativa)

## Contexto

O produto vende **confiança**. Peritos sem qualquer triagem expõem contratantes a:

- Profissionais sem certificação.
- Perfis falsos / golpes.
- Especialidades irrelevantes.

Automação pura (sem revisão humana) traz risco em mercado regulado.

## Opções consideradas

1. **Aprovação manual** por admin antes de publicar.
2. **Publicação automática** com moderação reativa (denúncias).
3. **Híbrido:** automação com flags + revisão dos sinalizados.

## Decisão

**Aprovação manual** para todo cadastro de perito. Perfil inicia em `PENDING` + `profile_visible=false`. Admin revisa documentação e aprova.

## Consequências

### Positivas

- Reduz risco reputacional.
- Cria barreira contra cadastros maliciosos.
- Gera capacidade de calibrar critérios à medida que o time aprende.

### Negativas

- Funil mais lento — fricção no onboarding de peritos legítimos.
- Capacidade humana limita escala (1 admin ≈ N aprovações/dia).
- "PENDING infinito" se time não acompanhar.

### Mitigações

- Meta de aprovação em até 24h úteis ([prd/success-metrics.md](../prd/success-metrics.md)).
- Checklist em [flows/admin-approval.md](../flows/admin-approval.md).
- Notificação ao perito a cada decisão.

## Quando revisar

- Volume diário de pendentes > capacidade do time.
- Tempo médio de aprovação > 48h por mais de 2 semanas.
- Crescimento da base força considerar (3) híbrido.

## Referências

- [flows/admin-approval.md](../flows/admin-approval.md)
- [business-rules/regras-de-negocio.md](../business-rules/regras-de-negocio.md#3-cadastro-e-ciclo-de-vida-da-conta)
