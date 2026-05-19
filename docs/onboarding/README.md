# Onboarding de Desenvolvedor

Bem-vindo(a) ao Contrate seu Perito. Este guia te coloca produtivo em ~1 dia.

| Documento                                          | Quando ler                                  |
| -------------------------------------------------- | ------------------------------------------- |
| [01-setup.md](01-setup.md)                         | Primeiro dia                                |
| [02-first-pr.md](02-first-pr.md)                   | Primeiros dias                              |
| [03-codebase-tour.md](03-codebase-tour.md)         | Primeira semana                             |
| [04-pr-checklist.md](04-pr-checklist.md)           | Toda PR                                     |
| [05-glossary.md](05-glossary.md)                   | Quando bater dúvida                         |
| [06-team-conventions.md](06-team-conventions.md)   | Primeiro mês                                |

## TL;DR

- Stack: **Angular 21 + Supabase**.
- Não chame Supabase direto — use [SupabaseService](../../src/app/services/supabase.service.ts).
- RLS é a fonte da autorização — não confie só em guard.
- Comece por [01-setup.md](01-setup.md).
