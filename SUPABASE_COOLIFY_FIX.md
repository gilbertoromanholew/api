# 🔧 Configuração Supabase Auto-Hospedado (Coolify) - CORREÇÃO

## ✅ Variáveis encontradas!

Você encontrou as variáveis corretas no Coolify:

### 1. **ADDITIONAL_REDIRECT_URLS**
```
Valor: https://samm.host/auth*,https://samm.host/*
```
❌ **IMPORTANTE:** Use HTTPS em produção!

### 2. **GOTRUE_SITE_URL**
```
Valor: https://samm.host
```
❌ **IMPORTANTE:** Use HTTPS em produção!

### 3. **ENABLE_EMAIL_AUTOCONFIRM**
```
Valor: false
```
❌ **IMPORTANTE:** Deixe como `false` para que o usuário PRECISE confirmar o email!

### 4. **ENABLE_EMAIL_SIGNUP**
```
Valor: true
```

---

## 🌐 **Configuração para produção:**

No **Coolify**, quando for colocar em produção, use:

```
ADDITIONAL_REDIRECT_URLS=https://samm.host/auth*,https://samm.host/*
GOTRUE_SITE_URL=https://samm.host
ENABLE_EMAIL_AUTOCONFIRM=false
ENABLE_EMAIL_SIGNUP=true
```

### SMTP (recomendado para produção):
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxx
SMTP_SENDER=noreply@samm.host
```

---

## 🔄 **Diferença entre desenvolvimento e produção:**

### Desenvolvimento (local):
```
ADDITIONAL_REDIRECT_URLS=http://localhost:5173/auth*,http://localhost:5173/*
GOTRUE_SITE_URL=http://localhost:5173
```

### Produção:
```
ADDITIONAL_REDIRECT_URLS=https://samm.host/auth*,https://samm.host/*
GOTRUE_SITE_URL=https://samm.host
```

---

## 📋 **Por que isso importa:**

1. **URLs de redirecionamento** precisam apontar para onde o usuário vai voltar após confirmar email
2. **Site URL** é a URL base do seu site
3. Em produção, use **HTTPS** sempre!

---

## ✅ **Status das configurações:**

- [x] **ADDITIONAL_REDIRECT_URLS** - URLs permitidas para redirecionamento
- [x] **GOTRUE_SITE_URL** - URL base do site
- [x] **ENABLE_EMAIL_AUTOCONFIRM=false** - Exige confirmação de email
- [x] **ENABLE_EMAIL_SIGNUP=true** - Permite cadastro por email
- [ ] **SMTP** - Para envio real de emails (recomendado)

---

## 🧪 **Como testar:**

1. **Registrar** usuário no frontend
2. **Ver logs:** `https://mpanel.samm.host` → Authentication → Logs
3. **Copiar** o link de confirmação dos logs
4. **Colar** no navegador para confirmar

---

## 🎯 **Próximos passos:**

1. Configure as variáveis acima no Coolify
2. Reinicie o Supabase
3. Teste o registro
4. Me diga se funcionou! 🚀

## 🔄 Após configurar:

1. **Salvar** as variáveis no Coolify
2. **Reiniciar** o serviço Supabase
3. **Testar** registro de usuário
4. **Verificar logs** no dashboard Supabase

---

## ✅ Status das configurações:

- [x] **ADDITIONAL_REDIRECT_URLS** - URLs permitidas para redirecionamento
- [x] **GOTRUE_SITE_URL** - URL base do site
- [x] **ENABLE_EMAIL_AUTOCONFIRM=false** - Exige confirmação de email
- [x] **ENABLE_EMAIL_SIGNUP=true** - Permite cadastro por email
- [ ] **SMTP** - Para envio real de emails (opcional)

---

## 🧪 Como testar:

1. **Registrar** usuário no frontend
2. **Ver logs:** `https://mpanel.samm.host` → Authentication → Logs
3. **Copiar link** de confirmação dos logs
4. **Colar** no navegador para confirmar

---

## 🎯 Próximos passos:

1. Configure as variáveis acima no Coolify
2. Reinicie o Supabase
3. Teste o registro
4. Me diga se funcionou! 🚀