# RB-030 — Falhas em massa de Auth

## Sintomas

- Pico em logs do Supabase Auth: muitos `invalid_credentials` ou `signup` falhando.
- Usuários reclamando que não conseguem entrar.
- Métrica de "novos cadastros" caindo abruptamente.

## Severidade

**P1** se 100% dos logins falham. **P2** se é uma fração.

## Confirmação rápida

1. Painel Supabase → Auth → Logs → últimos 15 min.
2. Tentar login com conta de teste conhecida.
3. Status do provedor: [status.supabase.com](https://status.supabase.com).

## Causas comuns

| Causa                                  | Como confirmar                           | Mitigação                                 |
| -------------------------------------- | ---------------------------------------- | ----------------------------------------- |
| Incidente do Supabase                  | Página de status                         | Esperar; ver [supabase-down.md](supabase-down.md) |
| Rotação de JWT secret incorreta        | Erros recentes começam após rotação      | Reverter; aplicar corretamente            |
| Domínio de e-mail bloqueado            | Falhas só de e-mails específicos         | Verificar SMTP / Auth settings            |
| Ataque (credential stuffing)           | Muitos IPs, contas diferentes            | Rate limit + (futuro) captcha             |
| Configuração de OAuth provider quebrou | Falhas só em OAuth, não em senha         | Reverter última mudança em provider       |
| Frontend com chave anon errada         | Falha em 100% do login                   | Reverter deploy do frontend               |

## Mitigação

### Se for ataque

1. Painel Supabase → Auth → temporariamente reduzir rate-limit settings (proteger).
2. Bloquear IPs ofensores no host CDN (Cloudflare WAF).
3. Forçar usuários afetados a resetar senha.

### Se for config

1. Reverter última mudança em Auth Settings.
2. Reverter último deploy do frontend.

## Correção

- Causa raiz na tabela acima.
- Adicionar alerta dedicado se ainda não tinha.
- Considerar captcha em login após N falhas consecutivas por IP.

## Comunicação

- Banner na home se durar >15 min.
- E-mail proativo a usuários se vazamento envolvido (não é o caso típico).

## Pós-incidente

- Métricas: tempo até detecção, tempo até mitigação.
- Endurecer monitoramento.
