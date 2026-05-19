# Backup e Restore

## Estratégia

| Camada           | Backup                                       | Retenção                                |
| ---------------- | -------------------------------------------- | --------------------------------------- |
| Banco (Postgres) | Snapshot diário automático do Supabase       | 7-30 dias (depende do plano)            |
| Banco            | Snapshot **manual** antes de migration crítica| Permanente até confirmar sucesso       |
| Storage          | Réplica do bucket privado para storage externo | Mensal (proposta)                      |
| Configuração     | `schema.sql` + `supabase/migrations/` no Git | Permanente                              |

## Backups automáticos do Supabase

Painel → Database → Backups. Snapshots PITR (point-in-time recovery) no plano Pro+:

- **PITR:** restaurar para qualquer ponto na janela (ex.: 7 dias).
- **Daily:** snapshot diário.

> Confirme a janela atual no painel; planos free têm retenção menor.

## Backup manual antes de migration crítica

Painel → Database → Backups → "Create backup".

Ou via CLI / `pg_dump`:

```bash
# usando connection string do projeto (cuidado com onde guardar)
pg_dump --no-owner --schema=public "$SUPABASE_DB_URL" > backup-$(date +%Y%m%d-%H%M).sql
```

Armazenar em local seguro fora do projeto (S3, GCS) — **nunca** no repositório Git.

## Restore

### Cenário 1 — Corrupção recente (últimas horas)

1. Identificar timestamp pré-incidente.
2. Painel Supabase → Backups → PITR → escolher hora.
3. Restore num **novo projeto Supabase** primeiro (não substituir o atual de cara).
4. Validar integridade no projeto restaurado.
5. Cutover: ajustar `SUPABASE_URL` no frontend ou promover o restaurado para o domínio atual.

### Cenário 2 — Snapshot diário

Mesmo procedimento, granularidade menor (1 dia).

### Cenário 3 — Restore parcial (uma tabela)

Não há nativo "restore só uma tabela". Solução:

1. Restaurar snapshot em projeto temporário.
2. `pg_dump --table=public.tabela_x` do temporário.
3. `psql` no projeto atual com o dump.

## Storage

Buckets não vêm no snapshot SQL. Plano:

1. Job mensal copia `curriculums/`, `documents/` para bucket externo (S3 com versionamento).
2. Para restore: copiar de volta.

(Implementar como Edge Function agendada quando relevante.)

## Verificação periódica

Backup sem teste = arquivo de fé.

- **Trimestral:** restore drill (restaurar para projeto teste; validar contagem de tabelas, executar smoke; descartar).
- **Anual:** simulação completa de DR (Disaster Recovery): trocar domínio para projeto restaurado por 1h e voltar.

## RPO / RTO alvo

| Métrica                                 | Alvo (V1)            |
| --------------------------------------- | -------------------- |
| RPO (Recovery Point Objective)          | ≤ 24h (snapshot diário) |
| RPO com PITR (em plano Pro)             | ≤ 1h                 |
| RTO (Recovery Time Objective)           | ≤ 4h                 |

Melhorar com automação à medida que a base de usuários cresce.

## Documentar incidentes de restore

Sempre que executar restore real:

1. Abrir incidente em [runbooks/](../runbooks/).
2. Gravar timeline, decisões, impacto.
3. Pós-mortem documentado.
