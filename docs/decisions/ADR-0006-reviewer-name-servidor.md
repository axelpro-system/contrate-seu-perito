# ADR-0006 — `reviewer_name` autoritativo do servidor

- **Status:** Accepted
- **Data:** 2026-02-01 (retroativa)

## Contexto

A tabela `reviews` exibe um campo `reviewer_name` em listagens públicas (perfil do perito). Se o cliente puder enviar esse nome livremente:

- **Falsificação:** "Avaliado por Tribunal de Justiça de SP" — fabricação.
- **Abuso:** apelidos ofensivos.
- **Inconsistência:** mesmo cliente aparece com nomes diferentes em reviews distintas.

## Opções consideradas

1. **Frontend envia `reviewer_name`** vindo do form.
2. **Servidor (camada de serviço) busca** `full_name` do perfil do `client_id` e ignora qualquer campo do cliente.
3. **Trigger SQL** preenche `reviewer_name` a partir de `profiles` no INSERT.

## Decisão

Adotar opção **(2)**: a camada de serviço (no `ReviewService`/equivalente) busca `profiles.full_name` do `client_id` e popula `reviewer_name`. Se vazio, usar `'Cliente'`. Qualquer valor enviado pelo cliente é **ignorado**.

Considerar **(3) trigger** como reforço futuro — torna a regra independente da app.

## Consequências

### Positivas

- Garante consistência e impede falsificação.
- Frontend não precisa enviar o campo (menos superfície).
- Regra centralizada em um service.

### Negativas

- Quem renomear o perfil **não** retroage automaticamente nas reviews antigas (snapshot do nome no momento da review).
- Se algum dia permitirmos review anônima, exige outra solução.

### Mitigação

- Documentar como regra `RN-073` em [business-rules/regras-de-negocio.md](../business-rules/regras-de-negocio.md).
- Test cobre o fluxo positivo + caso `full_name` vazio.

## Referências

- [claude.md](../../claude.md)
- [flows/review-flow.md](../flows/review-flow.md)
- [business-rules/regras-de-negocio.md](../business-rules/regras-de-negocio.md#9-conclusão-de-serviço-e-avaliações)
