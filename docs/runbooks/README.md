# Runbooks

Procedimentos operacionais. Cada runbook tem código `RB-XXX` estável, sintomas claros, ações reversíveis primeiro.

| Código | Documento                                          | Tema                                              |
| ------ | -------------------------------------------------- | ------------------------------------------------- |
| RB-001 | [on-call-basics.md](on-call-basics.md)             | Como agir ao receber alerta                       |
| RB-010 | [supabase-down.md](supabase-down.md)               | Supabase indisponível                             |
| RB-020 | [rls-leak.md](rls-leak.md)                         | Suspeita de vazamento por RLS errado              |
| RB-030 | [auth-mass-failure.md](auth-mass-failure.md)       | Falhas em massa de login/signup                   |
| RB-040 | [realtime-degraded.md](realtime-degraded.md)       | Chat em tempo real instável                       |
| RB-050 | [migration-failure.md](migration-failure.md)       | Migration falhou em produção                      |
| RB-060 | [data-breach.md](data-breach.md)                   | Vazamento confirmado de dados pessoais            |
| RB-070 | [perf-degradation.md](perf-degradation.md)         | Lentidão geral / queries pesadas                  |
| RB-080 | [restore-from-backup.md](restore-from-backup.md)   | Restaurar de backup                               |
| RB-090 | [RB-090-edge-function-create-user.md](RB-090-edge-function-create-user.md) | Edge Function `create-user` falhando |

## Padrão de runbook

Cada arquivo segue:

1. **Sintomas** — como reconhecer.
2. **Severidade** — P1 / P2 / P3.
3. **Confirmação rápida** — comandos/consultas para validar.
4. **Mitigação** — passos para conter (reversível primeiro).
5. **Correção** — fix de raiz.
6. **Comunicação** — quem avisar.
7. **Pós-incidente** — post-mortem, atualização de docs.
