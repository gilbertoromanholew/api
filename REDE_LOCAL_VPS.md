# 🔐 Configuração de Rede Local - VPS

## ✅ Configuração aplicada:

### **Arquitetura:**
```
Internet → Nginx/Caddy (samm.host:443)
                ↓
        Frontend (localhost:80)
                ↓
         API (localhost:3000)
```

---

## 🔧 Mudanças aplicadas:

### 1. **API (.env)**
```bash
HOST=127.0.0.1          # Apenas localhost
PORT=3000               # Porta 3000
ALLOWED_IPS=127.0.0.1,localhost,::1  # Apenas rede local
FRONTEND_URL=http://localhost
```

### 2. **API (server.js)**
```javascript
origin: [
    'http://localhost',         // Frontend porta 80
    'http://localhost:80',
    'http://127.0.0.1',
    'http://127.0.0.1:80',
    // ... mantém https://samm.host para Nginx
]
```

### 3. **Frontend (.env em produção)**
```bash
VITE_API_URL=http://localhost:3000
```

---

## 🛡️ Segurança:

### ✅ **O que está protegido:**
- API **NÃO** é acessível diretamente pela internet
- Apenas comunicação **localhost** entre frontend e API
- Nginx/Caddy faz proxy reverso para expor apenas frontend

### 🌐 **Acesso externo:**
```
https://samm.host → Nginx → localhost:80 (Frontend)
                           ↓
                    localhost:3000 (API - interno)
```

---

## 📋 Configuração do Nginx:

```nginx
# Frontend
server {
    listen 443 ssl;
    server_name samm.host;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /var/www/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Não precisa expor a API!
# Ela fica apenas em localhost:3000
```

---

## 🔄 Fluxo de requisição:

1. **Usuário** acessa `https://samm.host`
2. **Nginx** serve o frontend (localhost:80)
3. **Frontend** faz requisição para `http://localhost:3000`
4. **API** responde (apenas rede local)
5. **Frontend** exibe resposta

---

## ✅ Vantagens dessa configuração:

- 🔒 **API totalmente protegida** (não exposta na internet)
- 🚀 **Mais rápido** (comunicação localhost)
- 💰 **Menos recursos** (sem SSL na comunicação interna)
- 🛡️ **Mais seguro** (apenas Nginx exposto)

---

## ⚠️ Observações importantes:

1. **Frontend e API na mesma VPS** ✅
2. **API não é acessível externamente** ✅
3. **Nginx/Caddy gerencia SSL** ✅
4. **Firewall bloqueia porta 3000** (recomendado)

---

## 🔥 Configuração de firewall:

```bash
# Bloquear porta 3000 externamente
sudo ufw deny 3000

# Permitir apenas 80 e 443
sudo ufw allow 80
sudo ufw allow 443
```

---

## 🧪 Como testar:

### **Na VPS:**
```bash
# API deve responder localmente
curl http://localhost:3000/api/auth/session

# Mas NÃO externamente (deve dar timeout)
curl http://SEU_IP:3000/api/auth/session
```

### **No navegador:**
```
https://samm.host → Deve funcionar ✅
https://samm.host:3000 → Deve falhar ✅ (bloqueado)
```

---

## 📦 Deploy:

1. **Configurar para produção:**
```bash
cd tools-website-builder
config-prod.bat
npm run build
```

2. **Subir arquivos na VPS:**
```bash
# Frontend: dist/ → /var/www/frontend/dist
# API: código → /var/www/api
```

3. **Reiniciar serviços:**
```bash
cd /var/www/api
npm start
# ou
pm2 restart aji-api

# Reload Nginx
sudo nginx -t && sudo nginx -s reload
```

---

## 🎯 Checklist final:

- [x] API em `HOST=127.0.0.1`
- [x] `ALLOWED_IPS=127.0.0.1,localhost`
- [x] Frontend configurado para `http://localhost:3000`
- [x] CORS permite `http://localhost`
- [ ] Nginx configurado
- [ ] Firewall bloqueando porta 3000
- [ ] SSL configurado no Nginx

---

**Agora sua API está protegida e acessível apenas internamente!** 🔒🚀
