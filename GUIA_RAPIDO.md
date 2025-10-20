# 🚀 GUIA RÁPIDO DE DEPLOY

## 📋 PRÉ-REQUISITOS
- Acesso SSH ao servidor: `ssh root@69.62.97.115`
- Acesso ao painel Coolify: `http://69.62.97.115:8000`
- Credenciais do Supabase

---

## ⚡ COMANDOS RÁPIDOS (3 MINUTOS)

### 1️⃣ Conectar API ao Supabase (SSH)

```bash
# Conectar ao servidor
ssh root@69.62.97.115

# Conectar networks
docker network connect jcsck88cks440scs08w4ggcs lwck8gk8owg0w8ggk0k8k4cs-011438063626

# Testar conectividade
docker exec lwck8gk8owg0w8ggk0k8k4cs-011438063626 sh -c "wget -O- http://supabase-kong-jcsck88cks440scs08w4ggcs:8000 2>&1"
```

**Resultado esperado:**
```
404 page not found
```
☝️ Isso é NORMAL! Significa que conseguiu conectar.

---

### 2️⃣ Configurar Domínio no Coolify (UI)

**Passos no painel:**
1. Abra: http://69.62.97.115:8000
2. Vá em: **Projects** → Projeto da API (`lwck8gk8owg0w8ggk0k8k4cs`)
3. Aba: **Domains** ou **Configuration**
4. Adicionar:
   - **Domain:** `samm.host`
   - **Path:** `/api` (ou configure redirect)
   - **Port:** `3000`
5. **Save** e **Redeploy**

**Alternativa (Labels manuais):**
Se o Coolify não tiver UI de domínios, adicione labels:
```yaml
traefik.enable=true
traefik.http.routers.api-backend.rule=Host(`samm.host`) && PathPrefix(`/api`)
traefik.http.routers.api-backend.entrypoints=https
traefik.http.routers.api-backend.tls=true
traefik.http.routers.api-backend.tls.certresolver=letsencrypt
traefik.http.services.api-backend.loadbalancer.server.port=3000
traefik.http.middlewares.api-strip.stripprefix.prefixes=/api
traefik.http.routers.api-backend.middlewares=api-strip
```

---

### 3️⃣ Configurar Environment Variables (Coolify)

**No painel da API → Environment Variables:**

```bash
# === SUPABASE ===
SUPABASE_URL=https://mpanel.samm.host
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmdmN2dGtkd3B5bGZ6cXl5bmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkxODA0MTEsImV4cCI6MjA0NDc1NjQxMX0.rn-fHj7XVbOH4e2u-ZVU1VU5UXEqF5yWBqcIVb38G9k
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmdmN2dGtkd3B5bGZ6cXl5bmlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTE4MDQxMSwiZXhwIjoyMDQ0NzU2NDExfQ.w0hVeE5PdIoXYwKq3Gc0JdX2FjJLRPKBzQ4RjXXGTD0

# === REDE ===
HOST=0.0.0.0
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://samm.host

# === SEGURANÇA ===
SESSION_SECRET=77750ce22daa1ae1d8b0d44e0c19fd5c1e32e80744a944459b9bb3d1470b344f
SESSION_MAX_AGE=3600000
ALLOWED_IPS=127.0.0.1,localhost,::1,10.0.0.0/8,172.16.0.0/12

# === OPCIONAIS ===
MAX_LOGS=1000
LOG_RETENTION_DAYS=7
MAX_FILE_SIZE=52428800
ALLOWED_MIME_TYPES=application/pdf,image/*
```

**Salvar** e **Redeploy**

---

## ✅ VALIDAÇÃO (2 MINUTOS)

### Teste 1: Health Check Público
```bash
curl https://samm.host/api/health
```
**Resultado esperado:**
```json
{"status":"healthy","timestamp":"2025-10-19T...","uptime":123.456}
```

### Teste 2: Conectividade Interna (SSH)
```bash
ssh root@69.62.97.115

# Logs da API
docker logs lwck8gk8owg0w8ggk0k8k4cs-011438063626 --tail 50

# Deve ver:
# ✅ Servidor rodando em http://0.0.0.0:3000
# ✅ dotenv carregado, SUPABASE_URL: ✅
```

### Teste 3: Frontend → API (Navegador)
```javascript
// Abra o console do navegador em https://samm.host
fetch('https://samm.host/api/health')
  .then(r => r.json())
  .then(console.log)
```
**Resultado esperado:** Objeto JSON com status "healthy"

---

## 🐛 TROUBLESHOOTING

### ❌ Problema: `curl https://samm.host/api/health` retorna 404

**Causas:**
1. Traefik não está roteando para a API
2. Labels não configuradas corretamente
3. API não foi redeployada após mudanças

**Solução:**
```bash
# Ver labels do container
docker inspect lwck8gk8owg0w8ggk0k8k4cs-011438063626 | grep -A 20 Labels

# Ver rotas do Traefik
docker logs coolify-proxy | grep api

# Forçar redeploy no Coolify
```

---

### ❌ Problema: API retorna erros de conexão com Supabase

**Causas:**
1. Networks não conectadas
2. DNS do Supabase não resolve

**Solução:**
```bash
# Entrar no container da API
docker exec -it lwck8gk8owg0w8ggk0k8k4cs-011438063626 sh

# Testar conectividade
wget -O- http://supabase-kong-jcsck88cks440scs08w4ggcs:8000
ping supabase-kong-jcsck88cks440scs08w4ggcs

# Verificar networks
docker inspect lwck8gk8owg0w8ggk0k8k4cs-011438063626 | grep -A 10 Networks
```

---

### ❌ Problema: CORS error no frontend

**Sintoma:** Console mostra `Access-Control-Allow-Origin` error

**Solução:**
```javascript
// Verificar se FRONTEND_URL está correto
// Deve ser: FRONTEND_URL=https://samm.host

// No código da API, verificar:
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

---

### ❌ Problema: IP bloqueado

**Sintoma:** API retorna 403 Forbidden

**Solução:**
```bash
# Verificar ALLOWED_IPS inclui ranges Docker
ALLOWED_IPS=127.0.0.1,localhost,::1,10.0.0.0/8,172.16.0.0/12

# Ver IP do request nos logs
docker logs lwck8gk8owg0w8ggk0k8k4cs-011438063626 | grep "IP bloqueado"
```

---

## 📞 CHECKLIST FINAL

Antes de considerar pronto:

- [ ] `curl https://samm.host/api/health` retorna 200 OK
- [ ] Logs da API não mostram erros de Supabase
- [ ] Frontend consegue fazer fetch para `/api/*`
- [ ] Login/autenticação funciona
- [ ] Cookies de sessão persistem entre requests
- [ ] Certificado SSL válido (cadeado verde)

---

## 🎉 DEPLOY BEM-SUCEDIDO!

Se todos os testes passaram, sua aplicação está configurada corretamente:

```
✅ Frontend: https://samm.host (Vue.js SPA)
✅ API: https://samm.host/api/* (Node.js Gateway)
✅ Supabase: Privado (só API acessa)
```

**Arquitetura:**
```
Cliente → Frontend (estático) → API (pública + auth) → Supabase (privado)
```

**Próximos passos:**
- Configurar monitoring/alertas
- Adicionar rate limiting
- Implementar logs centralizados
- Backup do banco Supabase
