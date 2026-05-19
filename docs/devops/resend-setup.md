# Verificar Domínio no Resend

## Por que precisa verificar?
O Resend (e qualquer serviço de email) exige verificação de domínio para evitar spam e garantir que você é o dono do domínio.

## Passo a Passo

### 1. Acesse o Resend
- Vá em: https://resend.com/domains
- Faça login com sua conta

### 2. Adicione o Domínio
- Clique em **"Add Domain"**
- Digite: `axelpro.com.br`
- Clique em **"Add"**

### 3. Configure o DNS
O Resend vai te dar **3 registros DNS** para adicionar:

```
Tipo: TXT
Nome: _dmarc.axelpro.com.br
Valor: v=DMARC1; p=quarantine; rua=mailto:dmarc@resend.io

Tipo: TXT  
Nome: axelpro.com.br
Valor: [código de verificação do Resend]

Tipo: MX
Nome: axelpro.com.br
Valor: 10 feedback-smtp.us-east-1.amazonses.com
```

### 4. Onde adicionar esses registros?
Você precisa adicionar no **gerenciador DNS do seu domínio**:

- Se comprou o domínio na **Registro.br** → https://registro.br
- Se comprou na **Hostinger** → Painel da Hostinger
- Se comprou na **GoDaddy** → Painel da GoDaddy
- Outro registrador → Painel de controle do domínio

### 5. Exemplo na Registro.br:
1. Acesse https://registro.br
2. Faça login
3. Vá em **"Domínios"** → Selecione `axelpro.com.br`
4. Clique em **"Editar Zona"**
5. Adicione os 3 registros DNS que o Resend forneceu
6. Salve

### 6. Aguarde Propagação
- DNS pode levar de **15 minutos a 48 horas** para propagar
- No Resend, clique em **"Verify"** para verificar

### 7. Atualize o Código
Depois de verificado, altere no arquivo:

```typescript
// supabase/functions/send-email/index.ts
const FROM_EMAIL = 'noreply@axelpro.com.br'  // ou outro email do seu domínio
const FROM_NAME = 'Contrate um Perito'
```

E também no create-user:
```typescript
// supabase/functions/create-user/index.ts
from: 'Contrate um Perito <noreply@axelpro.com.br>',
```

---

## Resumo

| Situação | Pode enviar para |
|----------|------------------|
| Sem domínio verificado | Só axelpro.adm@gmail.com |
| Com axelpro.com.br verificado | Qualquer email ✓ |

Quer que eu te ajude com algum passo específico? 🚀
