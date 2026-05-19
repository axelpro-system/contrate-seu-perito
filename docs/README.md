# Documentação — Contrate seu Perito

Índice da documentação técnica do produto. Cada pasta é um domínio independente com seu próprio `README.md`.

| Pasta                                    | Propósito                                                                                 |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| [prd/](prd/)                             | Product Requirements: visão, personas, escopo, métricas de sucesso, roadmap               |
| [architecture/](architecture/)           | Visão técnica: camadas, serviços, padrões, decisões estruturais                           |
| [api/](api/)                             | Contratos: PostgREST (Supabase), RPCs, Realtime, Storage                                  |
| [database/](database/)                   | Schema, RLS, índices, triggers, políticas de migração                                     |
| [business-rules/](business-rules/)       | Catálogo de regras de negócio (RN-XXX) com fontes                                         |
| [flows/](flows/)                         | Diagramas de sequência e máquinas de estado dos fluxos críticos                           |
| [tests/](tests/)                         | Estratégia de testes, pirâmide, padrões, cobertura mínima                                 |
| [devops/](devops/)                       | Ambientes, build, deploy, observabilidade, CI/CD                                          |
| [security/](security/)                   | Modelo de ameaças, segredos, LGPD, RLS, hardening                                         |
| [runbooks/](runbooks/)                   | Procedimentos operacionais e resposta a incidentes                                        |
| [onboarding/](onboarding/)               | Guia de entrada para novos desenvolvedores                                                |
| [decisions/](decisions/)                 | ADRs — Architecture Decision Records                                                      |

## Convenções

- **Idioma:** português (PT-BR) por padrão. Termos técnicos consagrados ficam em inglês (RLS, JWT, SDK).
- **Identificadores estáveis:** regras de negócio (`RN-XXX`), ADRs (`ADR-XXXX`), runbooks (`RB-XXX`).
- **Fontes autoritativas:** quando um documento descreve comportamento existente, ele **cita** o código/schema com link relativo. Quando descreve intenção (PRD/ADR), deixa isso explícito.
- **Mutação:** mudanças no código que afetem regras documentadas precisam atualizar o documento na mesma PR.

## Caminhos rápidos

- Acabei de chegar no time → [onboarding/](onboarding/README.md)
- Vou abrir uma PR que mexe no banco → [database/migrations.md](database/migrations.md) + [decisions/](decisions/)
- Estou diagnosticando um incidente → [runbooks/](runbooks/README.md)
- Preciso entender uma feature específica → [flows/](flows/README.md) + [business-rules/](business-rules/regras-de-negocio.md)
