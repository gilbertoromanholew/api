# 🚀 Configurações de Produção - Supabase Coolify

## 🌐 **URLs para produção:**

### Frontend:
```
https://samm.host
```

### API:
```
https://api.samm.host
```

---

## ⚙️ **Variáveis no Coolify (produção):**

```
ADDITIONAL_REDIRECT_URLS=https://samm.host/auth*,https://samm.host/*
GOTRUE_SITE_URL=https://samm.host
ENABLE_EMAIL_AUTOCONFIRM=false
ENABLE_EMAIL_SIGNUP=true
```

### SMTP (obrigatório em produção):
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SUA_API_KEY_AQUI
SMTP_SENDER=noreply@samm.host
```

---

## 📋 **Diferenças desenvolvimento vs produção:**

| Configuração | Desenvolvimento | Produção |
|--------------|----------------|----------|
| **ADDITIONAL_REDIRECT_URLS** | `http://localhost:5173/*` | `https://samm.host/*` |
| **GOTRUE_SITE_URL** | `http://localhost:5173` | `https://samm.host` |
| **FRONTEND_URL** | `http://localhost:5173` | `https://samm.host` |
| **SMTP** | Opcional | **OBRIGATÓRIO** |

---

## 🔧 **Quando migrar para produção:**

1. **Atualizar variáveis** no Coolify do Supabase
2. **Mudar FRONTEND_URL** no `.env` da API
3. **Configurar SMTP** para envio real de emails
4. **Testar** o fluxo completo de registro/confirmação

---

## 📧 **Sobre SMTP em produção:**

- **SendGrid**: 100 emails/dia grátis
- **Mailgun**: 5000 emails/mês grátis
- **Gmail**: Funciona mas não recomendado para produção

**Configure SMTP antes de colocar em produção!** 📧