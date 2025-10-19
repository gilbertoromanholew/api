# 📧 Configuração de Email de Confirmação - Supabase

## ✅ O que foi implementado

### Backend
1. **Habilitado email de confirmação nativo do Supabase** (`api/src/config/supabase.js`)
   - Removido `emailRedirectTo: undefined`
   - Configurado redirect para `http://localhost:5173/auth?confirmed=true`

2. **Endpoint de reenvio** (`POST /api/auth/resend-confirmation`)
   - Verifica se usuário existe
   - Verifica se já está confirmado
   - Reenvia email via `supabaseAdmin.auth.admin.generateLink`

3. **Fluxo de registro atualizado**
   - Registro agora retorna `requires_verification: true`
   - Mensagem clara para verificar email
   - Não faz login automático

### Frontend
1. **API client atualizado** (`tools-website-builder/src/services/api.js`)
   - Método `authApi.resendConfirmation(email)`

2. **Composable useAuth atualizado** (`tools-website-builder/src/composables/useAuth.js`)
   - `sendVerificationCode()` agora chama o backend
   - Tratamento de erros e mensagens

---

## ⚙️ Configuração necessária no Supabase

### 1. Configurar Site URL e Redirect URLs

Acesse: **Dashboard Supabase → Authentication → URL Configuration**

```
Site URL: http://localhost:5173
Redirect URLs (adicionar):
  - http://localhost:5173/auth*
  - http://localhost:5173/*
```

**Em produção, adicionar:**
```
Site URL: https://seu-dominio.com
Redirect URLs:
  - https://seu-dominio.com/auth*
  - https://seu-dominio.com/*
```

### 2. Habilitar confirmação de email

Acesse: **Dashboard Supabase → Authentication → Providers → Email**

✅ Marcar: **"Confirm email"**

### 3. Personalizar template de email (opcional)

Acesse: **Dashboard Supabase → Authentication → Email Templates**

Você pode personalizar:
- **Confirm signup** - Email de confirmação de cadastro
- **Magic Link** - Link mágico para login
- **Change Email Address** - Confirmação de mudança de email
- **Reset Password** - Redefinição de senha

Variáveis disponíveis:
- `{{ .ConfirmationURL }}` - Link de confirmação
- `{{ .Token }}` - Token de verificação
- `{{ .TokenHash }}` - Hash do token
- `{{ .SiteURL }}` - URL do site

### 4. Configurar variáveis de ambiente

**Backend** (`.env`):
```bash
# URLs
FRONTEND_URL=http://localhost:5173

# Em produção:
FRONTEND_URL=https://seu-dominio.com
```

---

## 🔄 Fluxo de verificação de email

### 1. Registro
```javascript
POST /api/auth/register
{
  "email": "usuario@email.com",
  "password": "Senha@123",
  "cpf": "12345678901",
  "full_name": "Nome Completo"
}

Response:
{
  "success": true,
  "message": "Cadastro realizado com sucesso! Enviamos um email...",
  "data": {
    "user": { ... },
    "requires_verification": true  // ← Frontend deve mostrar tela de verificação
  }
}
```

### 2. Usuário recebe email
O Supabase envia automaticamente um email com link:
```
https://seu-projeto.supabase.co/auth/v1/verify?token=xxx&type=signup&redirect_to=http://localhost:5173/auth?confirmed=true
```

### 3. Usuário clica no link
- Supabase confirma o email
- Redireciona para `http://localhost:5173/auth?confirmed=true`
- Frontend detecta `?confirmed=true` e mostra mensagem de sucesso
- Usuário pode fazer login normalmente

### 4. Reenviar email (se necessário)
```javascript
POST /api/auth/resend-confirmation
{
  "email": "usuario@email.com"
}

Response:
{
  "success": true,
  "message": "Email de confirmação reenviado com sucesso!"
}
```

---

## 🧪 Testando localmente

### 1. Iniciar backend
```bash
cd api
npm start
```

### 2. Iniciar frontend
```bash
cd tools-website-builder
npm run dev
```

### 3. Registrar usuário
- Acessar `http://localhost:5173`
- Fazer registro
- Verificar console do Supabase para ver o email

### 4. Verificar email no Supabase (modo dev)
**Dashboard Supabase → Authentication → Logs**

Os emails aparecem aqui em modo desenvolvimento. Copie o link de confirmação.

### 5. Testar confirmação
- Colar o link no navegador
- Deve redirecionar para frontend com `?confirmed=true`
- Fazer login normalmente

---

## 🔒 Comportamento após confirmação

### Login antes de confirmar email
```javascript
POST /api/auth/login
{
  "email": "usuario@email.com",
  "password": "Senha@123"
}

Response: ❌ 401 Unauthorized
{
  "success": false,
  "message": "Email não verificado"
}
```

### Login após confirmar email
```javascript
Response: ✅ 200 OK
{
  "success": true,
  "data": {
    "user": { ... },
    "session": { ... }
  }
}
```

---

## 📱 Em produção

### SMTP personalizado (recomendado)

Para garantir entrega de emails em produção, configure um serviço SMTP:

**Dashboard Supabase → Project Settings → Auth → SMTP Settings**

Provedores recomendados:
- **SendGrid** (gratuito até 100 emails/dia)
- **Mailgun** (gratuito até 5000 emails/mês)
- **Amazon SES** (muito barato)
- **Resend** (moderno e fácil)

Configuração exemplo (SendGrid):
```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: SG.xxxxx (sua API key)
From: noreply@seu-dominio.com
```

---

## 🐛 Troubleshooting

### Email não chega
1. Verificar logs no Supabase Dashboard
2. Verificar spam/lixo eletrônico
3. Em dev, verificar Authentication → Logs
4. Configurar SMTP em produção

### Erro "Email already registered"
- Email já existe no sistema
- Verificar se precisa reenviar confirmação

### Erro "Invalid redirect URL"
- Adicionar URL na lista de Redirect URLs do Supabase
- Verificar variável `FRONTEND_URL` no .env

### Usuário fica "waiting for verification"
- Normal até clicar no link do email
- Pode reenviar email via `/resend-confirmation`
- Não é possível fazer login antes de confirmar

---

## 📝 Próximos passos

- [ ] Configurar redirect URLs no dashboard do Supabase
- [ ] Testar fluxo completo de registro → email → confirmação → login
- [ ] Personalizar template de email (opcional)
- [ ] Configurar SMTP para produção
- [ ] Adicionar variável `FRONTEND_URL` ao `.env`
- [ ] Atualizar UI do frontend para melhor UX na tela de verificação

---

## 🔗 Recursos

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
