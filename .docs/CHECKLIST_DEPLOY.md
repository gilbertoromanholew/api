# 🚀 Checklist de Deploy para Produção

## ✅ O que você PRECISA mudar:

### 1. **Frontend (.env)**
```bash
# Mudar de:
VITE_API_URL=http://localhost:3000

# Para:
VITE_API_URL=https://api.samm.host
```

### 2. **Backend API (.env)**
```bash
# Mudar de:
FRONTEND_URL=http://localhost:5173

# Para:
FRONTEND_URL=https://samm.host
```

### 3. **CORS no server.js**
Adicionar a origem do frontend em produção:
```javascript
origin: [
    'https://samm.host',           // ← ADICIONAR ESTA LINHA
    'https://api.samm.host',
    'http://localhost:3000',
    'http://localhost:5173',
    // ... resto
]
```

### 4. **IPs permitidos (.env da API)**
```bash
# Adicionar IP da VPS se quiser restringir
# Ou deixar * para permitir todos
ALLOWED_IPS=*
```

### 5. **Supabase Coolify**
Atualizar as variáveis:
```bash
ADDITIONAL_REDIRECT_URLS=https://samm.host/auth*,https://samm.host/*
GOTRUE_SITE_URL=https://samm.host
```

### 6. **SMTP (OBRIGATÓRIO em produção)**
Configurar no Supabase Coolify:
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SUA_API_KEY
SMTP_SENDER=noreply@samm.host
```

---

## 🔧 Passos de deploy:

### 1. Frontend (samm.host - porta 80/443)
```bash
cd tools-website-builder

# Atualizar .env
echo "VITE_API_URL=https://api.samm.host" > .env

# Build
npm run build

# Deploy da pasta dist/
```

### 2. Backend API (api.samm.host - porta 3000)
```bash
cd api

# Atualizar .env
# Mudar FRONTEND_URL=https://samm.host

# Subir API
npm start
# ou
pm2 start server.js --name "aji-api"
```

### 3. Supabase (já está rodando)
```bash
# Atualizar variáveis no Coolify
ADDITIONAL_REDIRECT_URLS=https://samm.host/auth*
GOTRUE_SITE_URL=https://samm.host

# Configurar SMTP
# Reiniciar serviço
```

---

## ⚠️ IMPORTANTE - HTTPS:

Se você vai usar Nginx/Caddy na frente:

### Nginx exemplo:
```nginx
# Frontend
server {
    listen 80;
    server_name samm.host;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name samm.host;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /path/to/tools-website-builder/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# API
server {
    listen 80;
    server_name api.samm.host;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name api.samm.host;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🧪 Como testar após deploy:

1. **Acessar:** `https://samm.host`
2. **Registrar** usuário
3. **Verificar** se email chega
4. **Confirmar** email
5. **Fazer login**
6. **Verificar** se API responde corretamente

---

## 📋 Resumo das mudanças:

| Arquivo | Variável | Valor Desenvolvimento | Valor Produção |
|---------|----------|----------------------|----------------|
| `tools-website-builder/.env` | `VITE_API_URL` | `http://localhost:3000` | `https://api.samm.host` |
| `api/.env` | `FRONTEND_URL` | `http://localhost:5173` | `https://samm.host` |
| `api/server.js` | `cors.origin` | Adicionar | `https://samm.host` |
| Supabase Coolify | `ADDITIONAL_REDIRECT_URLS` | `http://localhost:5173/*` | `https://samm.host/*` |
| Supabase Coolify | `GOTRUE_SITE_URL` | `http://localhost:5173` | `https://samm.host` |
| Supabase Coolify | `SMTP_*` | Opcional | **OBRIGATÓRIO** |

---

## ✅ Checklist final:

- [ ] Atualizar `VITE_API_URL` no frontend
- [ ] Atualizar `FRONTEND_URL` no backend
- [ ] Adicionar `https://samm.host` no CORS
- [ ] Atualizar URLs no Supabase Coolify
- [ ] Configurar SMTP no Supabase
- [ ] Fazer build do frontend
- [ ] Subir API na VPS
- [ ] Configurar Nginx/Caddy
- [ ] Obter certificado SSL (Let's Encrypt)
- [ ] Testar fluxo completo

---

## 🆘 Se algo der errado:

1. **Erro de CORS:** Verificar origins no server.js
2. **Email não chega:** Verificar SMTP configurado
3. **Redirect não funciona:** Verificar URLs no Coolify
4. **API não responde:** Verificar porta e firewall
5. **SSL não funciona:** Verificar certificado e Nginx

---

## 🎯 Quer que eu prepare os arquivos prontos para produção?

Posso criar:
- `.env.production` para frontend
- `.env.production` para backend
- Arquivo de configuração do Nginx
- Script de deploy automatizado

**Me avise quando estiver pronto para fazer o deploy!** 🚀
