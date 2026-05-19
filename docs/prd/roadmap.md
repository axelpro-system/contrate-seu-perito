# Roadmap

> Documento vivo. Datas são orientativas. Ordem de prioridade reflete entrega de valor + dependências técnicas.

## Now (em curso / próximos 30 dias)

- **Estabilização do MVP.** Bugs de UX no fluxo de avaliação e contato (ver [findings.md](../../findings.md)).
- **Auditoria de RLS.** Revisão sistemática das policies por entidade.
- **Documentação técnica.** Conclusão das pastas `docs/` (este roadmap inclusive).
- **Onboarding guiado de peritos.** Checklist visual com progresso até `profile_visible=true`.

## Next (30-90 dias)

- **Analytics web** + instrumentação das métricas em [success-metrics.md](success-metrics.md).
- **Notificações por e-mail** transacionais para leads/quotes (hoje só in-app).
- **Filtros avançados de busca** (faixa de preço, disponibilidade, certificações).
- **Convite a avaliar** automático pós-`approved` (lembrete por e-mail).
- **Segregação de buckets** Storage: público (`avatars`, `portfolio`) × privado (`cv`, `documents`).

## Later (90-180 dias)

- **Painel financeiro para perito** (extrato de quotes aprovadas).
- **Calendário visual de disponibilidade** para o contratante.
- **Suporte a múltiplos serviços por perito** (já no schema, expor melhor na UI).
- **Programa de verificação selo** (`is_verified`) com fluxo formal de documentação.

## Future (depende de validação)

- Pagamentos in-platform (escrow + split) — exige ADR e parceiro de payments.
- App mobile nativo — após validar uso mobile da SPA.
- Internacionalização — após PMF no BR.

## Princípios de priorização

1. **Confiança > features.** Qualquer item que aumente fraude/risco fica fora até mitigação.
2. **Reduzir time-to-first-value** do contratante e do perito.
3. **Reversibilidade.** Preferir mudanças que possam ser revertidas com feature flag.
4. **Sem dívida estrutural.** Mudanças que toquem RLS ou triggers exigem ADR.

## Como propor uma mudança

1. Abrir uma **proposta de ADR** em [decisions/](../decisions/).
2. Atualizar [scope.md](scope.md) se mudar o escopo declarado.
3. Atualizar este roadmap após aprovação.
