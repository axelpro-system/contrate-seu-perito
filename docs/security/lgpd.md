# Conformidade LGPD

A Lei Geral de Proteção de Dados (Lei 13.709/2018) rege como tratamos dados pessoais. Este documento mapeia o que coletamos, por quê, e como atendemos direitos do titular.

## Papéis

| Papel                  | Quem                                                 |
| ---------------------- | ---------------------------------------------------- |
| **Controlador**        | Contrate seu Perito (entidade operadora da plataforma) |
| **Operador**           | Supabase (banco/auth/storage/edge), Resend (e-mail transacional), Cademí, Hotmart |
| **Titular**            | Usuário cadastrado (perito, contratante)             |
| **DPO**                | A definir                                            |

## Bases legais

| Tratamento                            | Base legal LGPD                  |
| ------------------------------------- | -------------------------------- |
| Cadastro de usuário                   | Execução de contrato (Art. 7, V) |
| Avaliações públicas                   | Consentimento (Art. 7, I)        |
| `audit_logs` de admin                 | Legítimo interesse (Art. 7, IX)  |
| Comunicação transacional (e-mail)     | Execução de contrato             |
| Marketing futuro (newsletter)         | Consentimento (opt-in)           |

## Dados coletados

| Categoria        | Campos                                                                     | Onde                                        |
| ---------------- | -------------------------------------------------------------------------- | ------------------------------------------- |
| Identificação    | nome, sobrenome, e-mail, telefone                                          | `profiles`, `auth.users`                    |
| Profissional     | bio, especialidade, certificações, registration_number, CV                | `profiles`, `certificates`, Storage `cv`    |
| Geográfica       | cidade, estado, localização                                                | `profiles`                                  |
| Comportamental   | favoritos, leads, mensagens, avaliações                                    | tabelas correspondentes                     |
| Auditoria        | IP, user-agent (logs Supabase Auth)                                        | Logs Supabase                               |

## Direitos do titular (Art. 18)

| Direito                           | Como atender                                                                |
| --------------------------------- | --------------------------------------------------------------------------- |
| Confirmação da existência         | Endpoint público: usuário logado vê seu perfil                              |
| Acesso aos dados                  | Exportação JSON do perfil + interações (a implementar — feature)            |
| Correção                          | Edição de perfil em [`/expert/edit`](../../src/app/pages/expert-profile-edit/) e [`/dashboard`](../../src/app/pages/dashboard/) |
| Anonimização ou bloqueio          | Admin altera `account_status='BLOCKED'`                                     |
| Exclusão                          | Deletar usuário em `auth.users` → cascata via FK em `profiles`              |
| Portabilidade                     | Exportação JSON (a implementar)                                             |
| Informação sobre compartilhamento | Esta página + Termos                                                        |
| Revogação de consentimento        | Opt-out de marketing; exclusão de conta                                     |

## Procedimento de exclusão de conta

1. Usuário solicita via [`/support`](../../src/app/pages/support/).
2. Admin valida identidade.
3. Admin executa exclusão em `auth.users` (cascade remove `profiles` e dependências).
4. Storage: deletar bucket privado do usuário (`<userId>/`).
5. Notificações, leads, quotes históricas: manter `null` em `*_id` (FK ON DELETE SET NULL onde aplicável).
6. Gravar em `audit_logs` (action `user.delete`, com `user_id` e `requested_at`).
7. Confirmar ao usuário em até 15 dias úteis.

**Dado que permanece:**

- Reviews (anonimizadas com `reviewer_name = 'Cliente'`).
- `audit_logs` (registro legal de operações).
- `service_completions` (registro fiscal/operacional).

Justificativa: legítimo interesse / cumprimento de obrigação regulatória.

## Retenção

| Dado                       | Retenção                            |
| -------------------------- | ----------------------------------- |
| `audit_logs`               | 5 anos (defesa em processos)        |
| `messages`                 | Pelo tempo da quote + 2 anos        |
| `service_completions`      | 5 anos                              |
| Logs do Supabase Auth      | conforme plano (7-30 dias)          |
| Backups de banco           | 7-30 dias                           |
| Conta inativa              | Avaliar política de purga (1 ano sem login → alerta) |

## Compartilhamento com terceiros

Listar em página pública de privacidade:

- **Supabase:** infraestrutura (banco, auth, storage, edge functions).
- **Resend:** e-mails transacionais (recuperação de senha, boas-vindas, notificações). Recebe `email`, `nome` e conteúdo do e-mail.
- **Cademí, Hotmart:** integrações opcionais que o usuário ativa.
- **Nenhuma venda de dados.**

## Segurança aplicada

- HTTPS em todas as comunicações.
- Senhas com hash bcrypt (Supabase Auth).
- RLS em todas as tabelas.
- Storage privado para CV/documentos.
- Logs sem PII completo em produção.

## Incidente de segurança envolvendo dados pessoais

Em até 72h:

1. Avaliar criticidade.
2. Notificar a ANPD.
3. Notificar titulares afetados.
4. Documentar em runbook + post-mortem.

Ver [runbooks/data-breach.md](../runbooks/data-breach.md).

## Documentos relacionados

- Termos de Uso público — [src/app/pages/terms/](../../src/app/pages/terms/)
- Política de Privacidade pública — [src/app/pages/privacy/](../../src/app/pages/privacy/)
- DPA com Supabase — solicitar no portal Supabase
