# Personas

## 1. Contratante "Carla, advogada de contencioso"

| Atributo              | Detalhe                                                                            |
| --------------------- | ---------------------------------------------------------------------------------- |
| Contexto              | Sócia de escritório boutique, atua em direito civil e trabalhista                  |
| Frequência            | Contrata perito ~3 a 6 vezes por mês                                               |
| Dispositivo           | Desktop (90%), mobile (10%)                                                        |
| Sofisticação técnica  | Média — usa ferramentas SaaS no dia a dia                                          |

**Jobs-to-be-done**

- Encontrar perito grafotécnico em SP capital com disponibilidade nas próximas 2 semanas.
- Comparar 3 candidatos por preço, prazo e avaliação.
- Solicitar orçamento formal com descrição do caso e receber resposta em ≤ 48h.

**Dores**

- "Indicações que recebo não são especialistas no meu nicho."
- "Perdo tempo trocando e-mail antes de saber se o perito está disponível."
- "Não sei se um perito é bom até pagar a primeira hora."

**Sucesso para a persona**

- Encontrar e enviar orçamento em ≤ 10 minutos.
- Resposta do perito em ≤ 48h.

---

## 2. Perito "Paulo, engenheiro civil"

| Atributo              | Detalhe                                                                            |
| --------------------- | ---------------------------------------------------------------------------------- |
| Contexto              | Engenheiro civil com 15 anos de experiência, autônomo                              |
| Frequência            | Aceita ~5 casos por mês; lota agenda                                               |
| Dispositivo           | Mobile (60%), desktop (40%)                                                        |
| Sofisticação técnica  | Baixa-média — não quer "mais um sistema chato"                                     |

**Jobs-to-be-done**

- Receber leads qualificados sem prospectar ativamente.
- Construir portfólio público que valide sua experiência.
- Gerenciar agenda e responder orçamentos rápido.

**Dores**

- "Recebo pedidos fora do meu escopo / fora do meu estado."
- "Não tenho tempo de manter portfólio em rede social."
- "Cliente desaparece depois do primeiro contato."

**Sucesso para a persona**

- Receber ao menos 1 lead qualificado por semana.
- Manter `rating` ≥ 4.5 com `reviews_count` crescente.

---

## 3. Admin "Ana, operações"

| Atributo              | Detalhe                                                                            |
| --------------------- | ---------------------------------------------------------------------------------- |
| Contexto              | Membro do time de operações da plataforma                                          |
| Frequência            | Diária                                                                             |
| Dispositivo           | Desktop                                                                            |
| Sofisticação técnica  | Alta                                                                               |

**Jobs-to-be-done**

- Aprovar peritos pendentes em ≤ 24h após o cadastro completo.
- Moderar conteúdo reportado.
- Acompanhar saúde da plataforma (KPIs em [success-metrics.md](success-metrics.md)).
- Investigar incidentes via `audit_logs`.

**Dores**

- Aprovar/rejeitar precisa ser auditável.
- Precisa de visão consolidada (dashboard único).

**Sucesso para a persona**

- Fila de pendentes zerada diariamente.
- Tempo médio de aprovação ≤ 24h úteis.

---

## Anti-personas (não desenhamos para)

- **Vendedor de produtos** (não somos e-commerce).
- **Cliente que busca consultoria genérica** (somos perícia, não consultoria de gestão).
- **Perito que não é certificado/registrado** — rejeitamos no onboarding.
