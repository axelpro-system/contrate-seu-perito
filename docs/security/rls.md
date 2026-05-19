# RLS — Resumo de Segurança

Detalhes técnicos em [database/rls.md](../database/rls.md). Aqui ficam **princípios de segurança** de alto nível.

## Princípios

1. **RLS é a única fonte autoritativa de autorização.** Guards do Angular são UX; código de cliente nunca decide acesso.
2. **Deny by default.** `enable row level security` antes de criar a primeira policy.
3. **Defesa em profundidade.** Inclua filtros no SDK mesmo quando RLS já filtra (clareza + performance + proteção se a policy for relaxada).
4. **Testes negativos obrigatórios.** Para cada policy, prove que **não-autorizados são bloqueados** (ver [tests/rls-tests.md](../tests/rls-tests.md)).
5. **`security definer` requer ADR.** Toda função que bypassa RLS precisa justificar e auditar.

## Riscos identificados (revisar)

| Risco                                                    | Status               | Ação                                                  |
| -------------------------------------------------------- | -------------------- | ----------------------------------------------------- |
| `Users can update own profile` permite alterar `profile_type`, `account_status`, `is_verified`, `is_featured` | **aberto** | Trocar por update com colunas restritas (via função ou policy granular) |
| `reviews.reviewer_name` não tem constraint NOT NULL no SQL | **inconsistente** | Alinhar `schema.sql` com [claude.md](../../claude.md) |
| Insert livre em `audit_logs`                             | **aberto**           | Avaliar restrição: só sistema/admin                    |
| Storage policies não documentadas no `schema.sql`        | **aberto**           | Criar SQL versionado de policies de Storage           |

## Checklist para nova tabela

- [ ] `enable row level security` no momento da criação.
- [ ] Policy por verbo (SELECT/INSERT/UPDATE/DELETE) explícita.
- [ ] Policy de admin separada quando aplicável.
- [ ] Testes positivos e negativos em [tests/rls-tests.md](../tests/rls-tests.md).
- [ ] Documentar em [database/rls.md](../database/rls.md).
- [ ] Atualizar matriz em [business-rules/regras-de-negocio.md](../business-rules/regras-de-negocio.md#19-matriz-de-permissões).

## Padrões anti-vazamento

- **Subselects em policy** podem ser caros — para `messages`/`audit_logs`, considerar materializar relação em coluna FK direta.
- **Joins no SDK** seguem RLS de cada tabela — se uma tabela está fechada, o embed retorna `null` (não erro). Verifique.
- **Funções `security definer`** vazam tudo que retornam — sanitize a saída.

## Auditoria periódica (sugerido trimestralmente)

```sql
-- Tabelas em public sem RLS
select tablename from pg_tables
where schemaname = 'public' and rowsecurity = false;

-- Policies ativas
select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Cruzar com matriz em [business-rules](../business-rules/regras-de-negocio.md#19-matriz-de-permissões).
