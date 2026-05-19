# Architecture Decision Records (ADRs)

Registros curtos de decisões arquiteturais. Cada ADR é imutável após aceito — mudanças vêm em um ADR novo que substitui o anterior.

## Convenção

- Arquivo: `ADR-XXXX-titulo-curto.md`.
- Número sequencial, zero-padded a 4 dígitos.
- Status: `Proposed` → `Accepted` → (eventualmente) `Superseded by ADR-YYYY`.

## Template

[template.md](template.md)

## Índice

| Nº       | Título                                                                                | Status   |
| -------- | ------------------------------------------------------------------------------------- | -------- |
| ADR-0001 | [Adoção de Supabase como BaaS](ADR-0001-supabase-como-baas.md)                        | Accepted |
| ADR-0002 | [Angular Standalone Components em vez de NgModule](ADR-0002-angular-standalone.md)    | Accepted |
| ADR-0003 | [SupabaseService como porta única para o banco](ADR-0003-supabase-service-unico.md)   | Accepted |
| ADR-0004 | [RLS como autoridade de autorização](ADR-0004-rls-autoritativo.md)                    | Accepted |
| ADR-0005 | [Aprovação manual de peritos antes de publicar](ADR-0005-aprovacao-manual-peritos.md) | Accepted |
| ADR-0006 | [reviewer_name autoritativo do servidor](ADR-0006-reviewer-name-servidor.md)          | Accepted |
| ADR-0007 | [Edge Functions para operações server-side](ADR-0007-edge-functions-server-side.md)   | Accepted |
| ADR-0008 | [Resend para e-mails transacionais](ADR-0008-resend-emails.md)                        | Accepted |
| ADR-0009 | [Reset de senha após 3 falhas no login](ADR-0009-forgot-password-after-3-attempts.md) | Accepted |

> Adicione novas ADRs no fim. Não renumere as antigas.

## Quando criar uma ADR

- Escolha entre 2+ tecnologias/abordagens com trade-offs reais.
- Mudança de regra de negócio com impacto técnico.
- Introdução de nova dependência relevante.
- Mudança de policy RLS / triggers / schema com impacto cross-team.
- Adoção/abandono de ferramenta de observabilidade, testes, deploy.

## Quando NÃO criar

- Refactor local sem mudança de contrato.
- Bug fix.
- Mudança puramente estética.

## Processo

1. Abrir PR com ADR em status `Proposed`.
2. Discutir.
3. Ajustar.
4. Mergear com status `Accepted`.
5. Aplicar a decisão no código (geralmente em PR separada).
