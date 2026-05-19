# RB-001 — Básico de On-Call

## Princípios

1. **Estabilizar antes de investigar.** Pare o sangramento, depois entenda.
2. **Reversível primeiro.** Rollback é melhor que fix arriscado.
3. **Comunique cedo.** Avisar `#engineering` em até 5 min do alerta P1.
4. **Documente.** Toda ação tomada vai em um doc do incidente.

## Severidade

| Nível | Definição                                          | Resposta            | Comunicação                |
| ----- | -------------------------------------------------- | ------------------- | -------------------------- |
| P1    | Prod fora ou risco de dados                        | Imediata            | Slack + telefone + status  |
| P2    | Funcionalidade degradada para muitos               | ≤ 30 min            | Slack                      |
| P3    | Anomalia ou bug isolado                            | Próximo dia útil    | Issue tracker              |

## Primeiros 10 minutos

1. **Confirme o alerta.** É real? Reproduzir.
2. **Avalie blast radius.** Quantos usuários afetados? Qual fluxo?
3. **Comunicar:**
   - Slack `#engineering`: "Investigando alerta X às HH:MM"
   - Status page (se P1)
4. **Mitigar:**
   - Feature flag off?
   - Rollback de último deploy?
   - Restart de algo?
5. **Documentar timeline** num doc do incidente:
   ```
   2026-05-19 14:23 — alerta `quote_create_error_rate > 5%`
   2026-05-19 14:25 — confirmado em /expert/:id (botão "Entrar em contato")
   2026-05-19 14:28 — feature flag desabilitada
   ```

## Ferramentas

- **Painel Supabase** → Database / Auth / Logs / API
- **Painel do host** (CF Pages / Vercel) → deploys, logs de edge
- **Slack** `#alerts`, `#engineering`, `#deploys`
- **DevTools** do browser quando reproduzível
- **Runbooks** desta pasta — siga o específico se houver

## Após mitigar (próximas 24h)

1. Post-mortem: timeline, causa raiz, impacto, ações.
2. Atualizar runbook (se faltou passo).
3. Criar tarefas de prevenção.
4. Compartilhar aprendizados com o time.

## Quando escalar

- Você não sabe o que fazer → chame outro engenheiro.
- Risco de perda de dados → chame tech lead imediatamente.
- LGPD envolvido → DPO + jurídico.
- Mais de 30 min sem progresso → chame ajuda.

**Pedir ajuda não é fraqueza. Demorar para pedir é.**
