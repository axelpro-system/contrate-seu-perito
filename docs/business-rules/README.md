# Regras de Negócio

Catálogo de regras (`RN-XXX`) com fontes autoritativas no código e schema.

| Documento                                              | Conteúdo                                       |
| ------------------------------------------------------ | ---------------------------------------------- |
| [regras-de-negocio.md](regras-de-negocio.md)           | Catálogo completo com matriz de permissões    |

## Como usar

1. Para entender **o que** o sistema garante e **por quê**, leia o catálogo.
2. Cada regra possui `RN-XXX` estável. **Refira-se à regra pelo código** em PRs, ADRs e issues.
3. Mudou o comportamento? Atualize a regra na mesma PR e referencie o ADR que sustentou a mudança.

## Como propor uma nova regra

1. Justifique em ADR ([decisions/](../decisions/)).
2. Implemente no código + schema (constraint/policy/trigger se aplicável).
3. Adicione `RN-XXX` no catálogo apontando para a fonte.
4. Adicione/atualize testes em [tests/](../tests/).
