# RB-080 — Restore de Backup

> Ação destrutiva. Exige aprovação de tech lead + comunicação a stakeholders.

## Quando usar

- Corrupção severa de dados em produção.
- Migration parcial impossível de corrigir via forward fix.
- Ataque que comprometeu integridade do banco.

## Antes de executar

1. **Confirmar que não há alternativa.** Forward fix é quase sempre melhor.
2. **Identificar ponto no tempo** alvo: o mais recente antes do problema.
3. **Calcular perda esperada:** gravações entre backup e agora vão se perder.
4. **Comunicar** `#engineering`, lead, stakeholders.
5. **Janela de manutenção** se possível.

## Procedimento

### Caso A — PITR (Point-In-Time Recovery, plano Pro+)

1. Painel Supabase → Database → Backups → PITR.
2. **Restore para novo projeto** (jamais sobrescrever o atual de cara):
   - Selecionar timestamp alvo.
   - Aguardar provisão (~10-30 min).
3. **Validar** o projeto restaurado:
   - Tabelas presentes?
   - Contagem coerente com o esperado?
   - Smoke SQL: `select count(*) from profiles where created_at < '<ts>';`
4. **Cutover:**
   - Atualizar `supabaseUrl`/`supabaseKey` em variáveis de ambiente do frontend.
   - Deploy de produção apontando para o novo projeto.
   - Ou: usar feature do Supabase para "promover" o projeto restaurado.
5. **Verificar a aplicação:**
   - Login funciona.
   - Fluxos críticos funcionam.
6. **Comunicar** conclusão e perda estimada (qual janela de dados foi perdida).

### Caso B — Snapshot diário

Mesmo procedimento; granularidade é diária.

### Caso C — Restore parcial (uma tabela)

1. Restaurar para projeto temporário.
2. `pg_dump --data-only --table=public.<tabela> "<temp_url>" > tabela.sql`.
3. Avaliar conflitos com dados atuais (PKs duplicados?).
4. Aplicar com cuidado em produção (depois de backup atual!).

## Após restore

1. **Re-key**: se o restore foi por motivo de segurança, rotacionar chaves (ver [security/secrets.md](../security/secrets.md)).
2. **Auditar `audit_logs`** após restore: o que aconteceu na janela perdida?
3. **Notificar usuários** se ações relevantes foram perdidas (avaliações, mensagens, etc.).
4. **Post-mortem.**

## Riscos

- Perda de dados na janela "entre backup e cutover".
- Sessões ativas dos usuários expiram (precisam relogar).
- Webhooks de provedores externos podem perder o estado.

## Critérios de sucesso

- Banco restaurado.
- Aplicação funcionando.
- Comunicação feita.
- Documentação atualizada com aprendizados.
