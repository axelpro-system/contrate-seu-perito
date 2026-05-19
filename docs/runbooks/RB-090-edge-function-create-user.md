# RB-090 — Edge Function `create-user` falhando

> Runbook complementar ao geral [on-call-basics.md](on-call-basics.md). Específico para falhas na função `create-user` (criação de usuário pelo admin).

## Sintomas

- Admin clica em "Criar Usuário" e recebe erro 5xx.
- Logs da função mostram `Missing environment variables` ou erro de constraint.
- Usuário não aparece em `auth.users` nem em `profiles`.

## Severidade

**P2** — bloqueia onboarding administrativo, não afeta usuários finais.

## Passos para resolver:

### 1. Verificar Variáveis de Ambiente
Acesse: https://app.supabase.com/project/oedgzprzkcvtiybhcckm/settings/functions

Clique em "New secret" e adicione:
- **Name**: `SUPABASE_URL`
- **Value**: `https://oedgzprzkcvtiybhcckm.supabase.co`

- **Name**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: `<sua-service-role-key>` (encontre em: Settings > API > service_role key)

### 2. Verificar Schema da Tabela profiles
Execute no SQL Editor:
```sql
-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- Verificar se existe constraint que pode estar bloqueando
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass;
```

### 3. Verificar Logs da Função
Acesse: https://app.supabase.com/project/oedgzprzkcvtiybhcckm/logs/functions

Filtre por "create-user" e veja o erro exato.

### 4. Erros Comuns

#### Erro: "Missing environment variables"
**Solução**: Configurar as variáveis de ambiente no passo 1.

#### Erro: "User already registered" ou similar
**Solução**: O email já existe no Auth. Use outro email ou delete o usuário existente.

#### Erro na coluna X: "value too long" ou "invalid input"
**Solução**: Verificar se os valores enviados estão dentro dos limites do schema.

#### Erro: "violates foreign key constraint"
**Solução**: Verificar se a tabela profiles tem todas as colunas necessárias.

### 5. Redeploy da Função
Depois de configurar as variáveis:
```bash
supabase login --token SEU_TOKEN
supabase functions deploy create-user --project-ref oedgzprzkcvtiybhcckm
```

### 6. Teste Manual (no navegador)
Abra o console do navegador (F12) e execute:
```javascript
// Teste direto da função
fetch('https://oedgzprzkcvtiybhcckm.supabase.co/functions/v1/create-user', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lZGd6cHJ6a2N2dGl5YmhjY2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTE5NzMsImV4cCI6MjA4MDQyNzk3M30.sO3oZu07bLg1XxQQAbeZcc-RIkh9h66z8hNmiOpGw_Q',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'teste@teste.com',
    password: '123456',
    firstName: 'Teste',
    lastName: 'Usuario',
    profileType: 'CONTRATANTE',
    accountStatus: 'ACTIVE',
    profileVisible: true
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

## Próximos Passos

Me diga o que aparece nos **Logs da função** que consigo te dar a solução exata!
