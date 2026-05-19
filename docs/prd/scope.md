# Escopo

## ✅ Em escopo (V1 — implementado)

### Identidade
- Cadastro de contratante e perito (e-mail/senha + OAuth via Supabase Auth)
- Recuperação de senha e confirmação de e-mail
- Perfil pessoal (edição) com avatar
- Aprovação manual de peritos por admin

### Discovery
- Página inicial com peritos em destaque (rotativo)
- Busca por especialidade, localização, tags
- Perfil público do perito com portfólio, certificações, avaliações, disponibilidade e serviços

### Contratação
- Botão **Entrar em Contato** abre dialog e cria lead
- Fluxo de orçamento (quote) com status `submitted → under_review → approved | rejected`
- Chat atrelado a quote em tempo real (Supabase Realtime)
- Favoritar peritos

### Pós-venda
- Conclusão de serviço gerada automaticamente quando quote vira `approved`
- Avaliação 1-5 com comentário; cálculo automático de `rating` e `reviews_count`

### Operação
- Painel admin: usuários, especialidades, peritos pendentes, tickets, logs, conteúdo, broadcast, moderação, templates de e-mail, finanças, monitoring, relatórios
- Notificações in-app
- Tickets de suporte

### Integrações
- Cademí (LMS)
- Hotmart (billing/vendas)

## ❌ Fora de escopo (V1)

- **Pagamentos in-platform** entre contratante e perito (escrow, split, repasses)
- **Assinatura recorrente** dos peritos (plano gratuito por enquanto)
- **App mobile nativo** (SPA responsiva atende)
- **Matching algorítmico** (busca por filtros é suficiente em V1)
- **Multi-idioma** (apenas PT-BR)
- **Multi-país / multi-moeda** (BRL only)
- **Videochamada integrada** (cliente e perito combinam fora da plataforma)
- **Assinatura eletrônica** de contratos
- **API pública** para terceiros

## 🔮 Próximas iterações (V2+)

| Iniciativa                          | Motivação                                              | Pré-requisito                          |
| ----------------------------------- | ------------------------------------------------------ | -------------------------------------- |
| Pagamentos in-platform (escrow)     | Reduzir calote, capturar fee                           | Definição comercial + KYC              |
| Planos pagos para peritos           | Monetização recorrente                                 | Após PMF do marketplace                |
| App mobile nativo                   | Engajamento de peritos (mobile-first)                  | Validar uso atual via analytics        |
| Matching com IA                     | Reduzir tempo até primeiro contato                     | Volume mínimo de dados de match        |
| Internacionalização                 | Expansão LatAm                                         | Validação do mercado BR                |
| API pública                         | Parcerias com ERPs jurídicos                           | Estabilizar contratos internos         |

## Princípio de evolução

Cada item de "fora de escopo" precisa de um **ADR** ([decisions/](../decisions/)) antes de entrar em desenvolvimento, explicando trade-offs e impacto em RLS/segurança.
