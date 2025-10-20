# 🌐 MAPEAMENTO COMPLETO DA REDE COOLIFY

## 📊 INFORMAÇÕES DO SERVIDOR

**Hostname:** `srv855424`

**IPs do Host:**
```
69.62.97.115        ← IP Público (Internet)
10.0.0.1            ← Docker network bridge
10.0.1.1            ← Docker network bridge  
10.244.43.196       ← ZeroTier network
10.0.2.1            ← Docker network bridge
10.0.3.1            ← Docker network bridge
10.0.5.1            ← Docker network bridge
10.0.4.1            ← Docker network bridge
2a02:4780:14:aee6::1 ← IPv6 público
fd58:b17b:5acd::1   ← IPv6 privado
```

---

## 🎯 CONTAINERS RELEVANTES PARA NOSSA APLICAÇÃO

### 1️⃣ **API Node.js** (Seu projeto)
```
Container: lwck8gk8owg0w8ggk0k8k4cs-011438063626
Porta Interna: 3000/tcp (não mapeada para host)
Status: healthy
Network: Precisa conectar com Supabase
```

### 2️⃣ **Supabase Kong** (Gateway API do Supabase)
```
Container: supabase-kong-jcsck88cks440scs08w4ggcs
Portas: 8000-8001/tcp, 8443-8444/tcp (não mapeadas para host)
Network: jcsck88cks440scs08w4ggcs (Supabase)
DNS Interno: supabase-kong-jcsck88cks440scs08w4ggcs
```

### 3️⃣ **Tools Website** (Frontend Vue.js)
```
Container: d4g0sos40s8888gwggs44ocs-232934210406
Porta: 80/tcp
Network: Precisa acessar API Node.js
```

### 4️⃣ **Traefik** (Reverse Proxy Principal)
```
Container: coolify-proxy
Portas Públicas: 80, 443 (HTTP/HTTPS)
Função: Roteia tráfego para os containers baseado em domínios
```

---

## 🔗 TOPOLOGIA DE REDE ATUAL

```
Internet (69.62.97.115)
    ↓
┌─────────────────────────────────────────────────────┐
│  Traefik (coolify-proxy)                            │
│  - 80/443 públicos                                  │
│  - Roteia por domínio                               │
└─────────────────────────────────────────────────────┘
    ↓
    ├─→ samm.host → Tools Website (Frontend)
    ├─→ api.samm.host → ??? (não configurado)
    └─→ mpanel.samm.host → ??? (não configurado)
```

---

## 🏗️ ARQUITETURA CORRETA (SPA + API Gateway)

### **Como funciona um SPA (Single Page Application):**

```
Navegador do Cliente
    ↓
1. Baixa HTML/CSS/JS estático de https://samm.host
    ↓
2. JavaScript executa NO NAVEGADOR (não no servidor)
    ↓
3. JavaScript faz fetch() para https://samm.host/api/*
    ↓
4. Traefik roteia /api/* → API Container (porta 3000)
    ↓
5. API valida autenticação/autorização
    ↓
6. API faz requisição INTERNA → Supabase Kong (porta 8000)
    ↓
7. API retorna dados → Navegador
```

### **✅ REGRAS DE SEGURANÇA:**

1. **Frontend (Vue.js):**
   - ✅ Pode fazer requisições públicas para `/api/*`
   - ❌ NÃO tem acesso a variáveis de ambiente secretas
   - ❌ NÃO acessa Supabase diretamente

2. **API (Node.js):**
   - ✅ Exposta publicamente em `/api/*`
   - ✅ Valida JWT/sessões em TODAS as rotas (exceto health)
   - ✅ Aplica IP filtering e rate limiting
   - ✅ Possui SERVICE_ROLE_KEY (frontend não tem)
   - ✅ Faz requisições internas para Supabase

3. **Supabase:**
   - ✅ 100% privado (só API acessa internamente)
   - ✅ Porta 8000 NÃO exposta publicamente
   - ❌ Clientes nunca acessam diretamente

---

## ❌ PROBLEMAS IDENTIFICADOS

### 1. **API não está roteada pelo Traefik**
```bash
curl https://samm.host/api/health → 404 (não encontrado)
```

**Motivo:** 
- Container API não tem labels do Traefik
- Traefik não sabe rotear `/api/*` para o container
- **PRECISA SER CORRIGIDO** para frontend funcionar

### 2. **API não está na mesma network do Supabase**
```bash
# Dentro do container da API:
curl http://supabase-kong-jcsck88cks440scs08w4ggcs:8000 → Timeout/DNS error
```

**Motivo:**
- API: Network `coolify` (padrão)
- Supabase: Network `jcsck88cks440scs08w4ggcs`
- **PRECISA CONECTAR** as networks

### 3. **Configuração de ambiente incompleta**
- Falta `SUPABASE_INTERNAL_URL` nas variáveis
- ALLOWED_IPs pode estar bloqueando requests do frontend
- CORS pode precisar de ajustes

---

## ✅ FLUXO COMPLETO DA APLICAÇÃO

### 🎯 **Exemplo: Usuário fazendo login**

```
1. Cliente acessa https://samm.host
   ↓
2. Traefik → Frontend Container (HTML/CSS/JS estático)
   ↓
3. Navegador baixa app Vue.js e executa
   ↓
4. Usuário clica em "Login" → Vue chama:
   fetch('https://samm.host/api/auth/login', {
     method: 'POST',
     credentials: 'include', // Envia cookies
     body: JSON.stringify({ email, password })
   })
   ↓
5. Traefik intercepta /api/* → API Container (porta 3000)
   ↓
6. API valida request (IP filter, rate limit)
   ↓
7. API faz requisição INTERNA:
   supabaseClient.auth.signInWithPassword({ email, password })
   ↓
8. Supabase processa no Kong interno (porta 8000)
   ↓
9. API cria sessão segura e retorna para o cliente
   ↓
10. Vue.js recebe resposta e atualiza interface
```

### 🔐 **Camadas de Segurança:**

```
Camada 1: Traefik
  - TLS/SSL (HTTPS)
  - Rate limiting
  
Camada 2: API (Middlewares)
  - IP filtering (ipFilter.js)
  - Validação de sessão (validator.js)
  - CORS restritivo
  
Camada 3: Lógica de Negócio
  - Autorização por recurso
  - Validação de dados
  
Camada 4: Supabase (Privado)
  - Row Level Security (RLS)
  - Políticas de acesso
```

---

## 🔧 PLANO DE IMPLEMENTAÇÃO (PASSO A PASSO)

### **FASE 1: Conectar API ao Supabase** 🔗

#### Passo 1.1 - Adicionar network no Coolify

**Opção A - Via Coolify UI (Recomendado):**
1. Acesse o painel do Coolify
2. Vá no projeto da API: `lwck8gk8owg0w8ggk0k8k4cs`
3. Aba: **Networks** ou **Advanced Settings**
4. Adicionar network: `jcsck88cks440scs08w4ggcs`
5. Redeploy o container

**Opção B - Via SSH (Temporário para teste):**
```bash
# Conectar ao servidor
ssh root@69.62.97.115

# Conectar API à network do Supabase
docker network connect jcsck88cks440scs08w4ggcs lwck8gk8owg0w8ggk0k8k4cs-011438063626

# Verificar se conectou
docker exec lwck8gk8owg0w8ggk0k8k4cs-011438063626 wget -O- http://supabase-kong-jcsck88cks440scs08w4ggcs:8000
# Deve retornar: 404 (normal) ou resposta do Kong
```

---

### **FASE 2: Expor API via Traefik** 🌐

#### Passo 2.1 - Configurar domínio e path no Coolify

**No painel do Coolify (projeto da API):**

1. **Domain/URL:**
   - Adicionar: `samm.host`
   - Path: `/api`
   - Port: `3000`

2. **Labels do Traefik (se houver seção manual):**
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

3. **Redeploy** o projeto

#### Passo 2.2 - Validar roteamento

```bash
# Do seu computador
curl https://samm.host/api/health
# Deve retornar: {"status":"healthy","timestamp":...}
```

---

### **FASE 3: Configurar Variáveis de Ambiente** ⚙️

**No Coolify → Environment Variables da API:**

```bash
# === SUPABASE (CRÍTICO) ===
SUPABASE_URL=https://mpanel.samm.host
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# === REDE E SEGURANÇA ===
HOST=0.0.0.0
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://samm.host

# IPs permitidos (incluir networks Docker)
ALLOWED_IPS=127.0.0.1,localhost,::1,10.0.0.0/8,172.16.0.0/12

# Session (gere uma nova chave segura!)
SESSION_SECRET=77750ce22daa1ae1d8b0d44e0c19fd5c1e32e80744a944459b9bb3d1470b344f
SESSION_MAX_AGE=3600000

# === LOGS E LIMITES ===
MAX_LOGS=1000
LOG_RETENTION_DAYS=7
MAX_FILE_SIZE=52428800
ALLOWED_MIME_TYPES=application/pdf,image/*
```

**⚠️ IMPORTANTE:**
- Use o `SUPABASE_URL` público (https://mpanel.samm.host)
- A biblioteca Supabase vai usar Kong interno automaticamente quando estiver na mesma network
- Se precisar forçar interno, adicione: `SUPABASE_INTERNAL_URL=http://supabase-kong-jcsck88cks440scs08w4ggcs:8000`

---

### **FASE 4: Ajustar Código da API (se necessário)** 💻

#### Passo 4.1 - Verificar CORS

```javascript
// src/config/index.js ou server.js
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://samm.host',
  credentials: true, // Permite cookies de sessão
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

#### Passo 4.2 - Verificar middleware de IP filtering

```javascript
// src/middlewares/ipFilter.js
// Certifique-se que ranges Docker estão permitidos:
// 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
```

#### Passo 4.3 - Verificar health check está ANTES dos middlewares

```javascript
// server.js
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Middlewares VÊM DEPOIS
app.use('/api', ipFilter);
app.use('/api', validateSession);
```

---

## 🧪 TESTES PARA VALIDAR

### **1. Teste de conectividade API → Supabase (dentro do container):**

```bash
# Entrar no container da API
docker exec -it lwck8gk8owg0w8ggk0k8k4cs-011438063626 sh

# Tentar conectar no Supabase Kong
wget -O- http://supabase-kong-jcsck88cks440scs08w4ggcs:8000
# Deve retornar: 404 (normal) ou resposta do Kong
```

### **2. Teste de roteamento Traefik:**

```bash
# Do seu computador
curl https://samm.host/api/health
# Deve retornar: {"status":"healthy",...}
```

### **3. Teste de comunicação Frontend → API:**

```javascript
// No navegador (console)
fetch('https://samm.host/api/health')
  .then(r => r.json())
  .then(console.log)
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### 🔗 Fase 1: Conectividade Interna (API ↔ Supabase)
- [ ] Conectar API à network do Supabase: `jcsck88cks440scs08w4ggcs`
- [ ] Verificar se API consegue resolver DNS: `supabase-kong-jcsck88cks440scs08w4ggcs`
- [ ] Testar dentro do container: `wget http://supabase-kong-jcsck88cks440scs08w4ggcs:8000`
- [ ] Logs da API não mostram erros de conexão com Supabase

### 🌐 Fase 2: Roteamento Público (Internet → API)
- [ ] Configurar domínio no Coolify: `samm.host` + path `/api`
- [ ] Adicionar labels Traefik (ou usar config automática do Coolify)
- [ ] Testar acesso público: `curl https://samm.host/api/health`
- [ ] Certificado SSL válido (Let's Encrypt via Traefik)

### ⚙️ Fase 3: Variáveis de Ambiente
- [ ] `SUPABASE_URL` configurado (público ou interno)
- [ ] `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` definidos
- [ ] `SESSION_SECRET` gerado (use: `openssl rand -hex 32`)
- [ ] `FRONTEND_URL=https://samm.host`
- [ ] `ALLOWED_IPS` incluindo ranges Docker: `10.0.0.0/8,172.16.0.0/12`
- [ ] `NODE_ENV=production`

### 🔐 Fase 4: Segurança e Middleware
- [ ] CORS configurado para aceitar `https://samm.host`
- [ ] `credentials: true` no CORS (permite cookies)
- [ ] Health check `/api/health` ANTES dos middlewares de auth
- [ ] IP filtering não bloqueia requests do frontend
- [ ] Rate limiting configurado (opcional)

### 🧪 Fase 5: Testes End-to-End
- [ ] Frontend consegue carregar: `https://samm.host`
- [ ] Frontend consegue chamar: `fetch('https://samm.host/api/health')`
- [ ] Login funciona: `POST /api/auth/login`
- [ ] Sessão persiste entre requests (cookies)
- [ ] API consegue acessar Supabase sem erros
- [ ] Logs mostram requests bem-sucedidos

### 📊 Fase 6: Monitoramento
- [ ] Configurar logs centralizados (opcional)
- [ ] Verificar uso de memória/CPU
- [ ] Configurar alertas de downtime
- [ ] Documentar endpoints da API

---

## 🎯 RESUMO EXECUTIVO

### **🔍 Situação Atual:**
- ✅ Frontend (Vue.js) deployado em `https://samm.host`
- ✅ Supabase rodando internamente (network `jcsck88cks440scs08w4ggcs`)
- ❌ API não acessível publicamente (`https://samm.host/api/*` retorna 404)
- ❌ API não consegue se comunicar com Supabase (networks diferentes)

### **🎯 Objetivo:**
Configurar arquitetura **SPA + API Gateway** onde:
1. Frontend (navegador) faz requests para API pública
2. API valida autenticação e autorização
3. API se comunica internamente com Supabase (privado)
4. Clientes NUNCA acessam Supabase diretamente

### **🔧 Solução (3 passos principais):**

1. **Conectar API ao Supabase:**
   ```bash
   docker network connect jcsck88cks440scs08w4ggcs lwck8gk8owg0w8ggk0k8k4cs-011438063626
   ```

2. **Expor API via Traefik:**
   - Configurar no Coolify: domínio `samm.host` + path `/api`
   - Porta: `3000`
   - Traefik cria roteamento automático

3. **Configurar Environment Variables:**
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `FRONTEND_URL=https://samm.host`
   - `ALLOWED_IPS` incluindo ranges Docker

### **✅ Resultado esperado:**
```bash
# Cliente pode acessar
curl https://samm.host/api/health
→ {"status":"healthy"}

# API pode acessar Supabase internamente
docker exec <api-container> wget http://supabase-kong-jcsck88cks440scs08w4ggcs:8000
→ 404 ou resposta do Kong (normal)

# Frontend Vue.js funciona
fetch('https://samm.host/api/auth/login', { ... })
→ 200 OK
```

### **🚨 IMPORTANTE:**
- API **PRECISA** ser pública (mas protegida com auth/middleware)
- Frontend roda no navegador, não pode acessar networks Docker
- Supabase fica 100% privado (só API acessa)
