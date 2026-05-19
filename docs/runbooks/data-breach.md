# RB-060 — Vazamento de Dados Pessoais

## Sintomas / Trigger

- Vazamento confirmado por bug report, pentest, observação interna, comunicação externa.
- Pode vir de [rls-leak.md](rls-leak.md) escalado.

## Severidade

**P1**. Alto risco regulatório (LGPD Art. 48: prazo de 72h para notificar ANPD).

## Ação imediata (primeiros 60 min)

1. **Conter o vazamento.** Endurecer policies, bloquear endpoint, desativar feature flag — o que for necessário (ver [rls-leak.md](rls-leak.md)).
2. **Acionar tech lead + DPO** (se houver).
3. **Iniciar registro do incidente** num documento dedicado com timestamps:
   ```
   2026-05-19 09:12 — vazamento reportado (via support ticket #1234)
   2026-05-19 09:15 — confirmado por engenheiro X
   2026-05-19 09:20 — policy endurecida
   ```
4. **Não deletar evidências.** Logs, payloads, audit_logs — preservar.

## Avaliação de impacto (primeiras 6h)

- Quantos titulares afetados?
- Quais dados expostos (e-mail? telefone? CV? mensagens?)?
- Por quanto tempo a brecha existiu?
- Houve **acesso indevido confirmado** ou apenas potencial?

Consultar:

```sql
-- exemplo: quantos perfis foram lidos via endpoint comprometido
select count(distinct user_id) from audit_logs
where action = '<ação>' and created_at between '<inicio>' and '<fim>';
```

## Notificação

### ANPD

Se houver risco "relevante" aos titulares — em até **72h após ciência**:

- Descrição da natureza dos dados.
- Titulares afetados (qtd e categoria).
- Medidas adotadas.
- Riscos relacionados.

### Titulares

Se confirmado e relevante, e-mail individualizado com:

- O que ocorreu.
- Quais dados afetados.
- O que estamos fazendo.
- O que o titular pode fazer (mudar senha, monitorar contas).

### Comunicado público

Avaliar com jurídico / DPO. Transparência protege reputação a longo prazo.

## Correção técnica

- Aplicar fix definitivo (não apenas mitigação).
- Reforçar testes de RLS / negativos.
- Auditar tabelas correlatas.

## Pós-mortem

Documento detalhado:

- Timeline (com timestamps em UTC).
- Causa raiz técnica.
- Causa raiz processual (revisão? testes? deploy?).
- Impacto quantificado.
- Ações corretivas (com responsáveis e prazos).
- Lições aprendidas.

Compartilhar com o time e arquivar **em local seguro** (acesso restrito).

## Prevenção futura

- Testes RLS automatizados como gate de CI ([tests/rls-tests.md](../tests/rls-tests.md)).
- Pentest periódico ([security/pentest-checklist.md](../security/pentest-checklist.md)).
- Treinamento de PR review para mudanças de policy.
