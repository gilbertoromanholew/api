# 🔧 Configuração de Email - Supabase Auto-Hospedado (Coolify)

## 📍 Como acessar o dashboard

### 1. URL do seu Supabase
Como você está usando auto-hospedado, o dashboard fica em:
```
https://mpanel.samm.host
```

### 2. Credenciais de acesso
Você precisa das credenciais do **admin** do Supabase. Geralmente:
- **Email:** O email que você usou para configurar o Supabase no Coolify
- **Senha:** A senha que você definiu durante a instalação

---

## ⚙️ Configuração passo a passo

### Passo 1: Fazer login no dashboard
1. Abrir: `https://mpanel.samm.host`
2. Fazer login com suas credenciais de admin

### Passo 2: Acessar configurações de autenticação
1. No menu lateral esquerdo, clicar em **"Authentication"**
2. Depois clicar em **"Settings"** (ou "Configurações")

### Passo 3: Configurar URLs
1. Na seção **"URL Configuration"** ou **"Configuração de URL"**:
   ```
   Site URL: http://localhost:5173
   ```

2. **Redirect URLs** - Adicionar estas URLs:
   ```
   http://localhost:5173/auth*
   http://localhost:5173/*
   ```

### Passo 4: Habilitar confirmação de email
1. Ainda na página de Authentication Settings
2. Procurar por **"Email"** ou **"Email Settings"**
3. Marcar a opção **"Enable email confirmations"** ou **"Confirmar email"**
4. **IMPORTANTE:** Deixe as outras configurações padrão por enquanto

### Passo 5: Configurar SMTP (opcional mas recomendado)
1. Na mesma página, procurar **"SMTP Settings"**
2. Para desenvolvimento, você pode usar:
   - **SendGrid** (gratuito até 100 emails/dia)
   - **Gmail** (menos recomendado para produção)

**Configuração SendGrid:**
```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: SG.xxxxxxxx (sua API key do SendGrid)
From: noreply@seu-dominio.com
```

---

## 🔍 Onde exatamente clicar

### Menu lateral:
```
📊 Dashboard
👥 Authentication  ← CLICAR AQUI
📧 Database
⚙️ Settings
🔧 API
📈 Logs
```

### Dentro de Authentication:
```
📋 Users
⚙️ Settings      ← CLICAR AQUI
🔧 Providers
📧 Email Templates
📊 Logs
```

### Na página Settings:
Procurar estas seções:
- **"Site URL"** - campo de texto
- **"Redirect URLs"** - lista para adicionar URLs
- **"Enable email confirmations"** - checkbox
- **"SMTP Settings"** - campos para configuração de email

---

## 🧪 Como testar se funcionou

### 1. Registrar um usuário
```bash
# No seu frontend (http://localhost:5173)
# Fazer registro com um email real
```

### 2. Verificar logs
1. No dashboard do Supabase: **Authentication → Logs**
2. Deve aparecer uma entrada de "email sent" ou "email enviado"

### 3. Verificar email
- Em desenvolvimento, o email aparece nos logs
- Copie o link de confirmação dos logs
- Cole no navegador para testar

---

## 🚨 Possíveis problemas

### "Não consigo acessar o dashboard"
- Verificar se o Supabase está rodando no Coolify
- Verificar URL: `https://mpanel.samm.host`
- Verificar credenciais de admin

### "Não vejo a opção de email"
- Certificar que está na aba "Settings" dentro de Authentication
- Pode estar em uma versão mais antiga - verificar versão do Supabase

### "Emails não chegam"
- Configurar SMTP primeiro (SendGrid é mais fácil)
- Verificar nos logs se o email foi enviado
- Em desenvolvimento, emails ficam nos logs

---

## 📞 Se ainda tiver dúvidas

Me diga exatamente:
1. **O que você vê** quando acessa `https://mpanel.samm.host`
2. **Qual página** você consegue acessar
3. **Quais opções** você vê no menu lateral
4. **Qual erro** aparece (se houver)

Assim posso te guiar melhor! 🎯

---

## ✅ Checklist de configuração

- [ ] Acessar `https://mpanel.samm.host`
- [ ] Fazer login com credenciais admin
- [ ] Ir em Authentication → Settings
- [ ] Configurar Site URL: `http://localhost:5173`
- [ ] Adicionar Redirect URLs
- [ ] Habilitar "Enable email confirmations"
- [ ] Configurar SMTP (opcional)
- [ ] Testar registro de usuário
- [ ] Verificar logs de email