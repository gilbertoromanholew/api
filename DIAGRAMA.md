# 📐 DIAGRAMA DA ARQUITETURA

## 🌐 VISÃO GERAL

```
                         INTERNET
                            |
                     (HTTPS/443)
                            |
                            ↓
        ┌───────────────────────────────────────┐
        │     Traefik (coolify-proxy)           │
        │     - Reverse Proxy                   │
        │     - SSL/TLS (Let's Encrypt)         │
        │     - Roteamento por domínio          │
        └───────────────────────────────────────┘
                   |                |
         (samm.host)          (samm.host/api/*)
                   |                |
                   ↓                ↓
        ┌──────────────┐  ┌──────────────────────┐
        │   FRONTEND   │  │    API (Node.js)     │
        │   (Vue.js)   │  │    Express + JWT     │
        │   Porta: 80  │  │    Porta: 3000       │
        └──────────────┘  └──────────────────────┘
                                     |
                          (Network Bridge)
                                     |
                                     ↓
                          ┌─────────────────────┐
                          │  Supabase Kong      │
                          │  Gateway API        │
                          │  Porta: 8000        │
                          │  (PRIVADO)          │
                          └─────────────────────┘
                                     |
                    ┌────────────────┼────────────────┐
                    ↓                ↓                ↓
            ┌──────────┐    ┌──────────┐    ┌──────────┐
            │ GoTrue   │    │ PostgREST│    │ Storage  │
            │ (Auth)   │    │ (REST)   │    │ (Files)  │
            └──────────┘    └──────────┘    └──────────┘
                                     |
                                     ↓
                          ┌─────────────────────┐
                          │   PostgreSQL        │
                          │   (Database)        │
                          └─────────────────────┘
```

---

## 🔄 FLUXO DE UMA REQUISIÇÃO (Exemplo: Login)

### **1. Cliente acessa o site**
```
Navegador → https://samm.host
    ↓
Traefik → Frontend Container
    ↓
HTML/CSS/JS baixado → Navegador executa Vue.js
```

### **2. Usuário clica em "Login"**
```javascript
// Código no navegador (Vue.js)
async function login(email, password) {
  const response = await fetch('https://samm.host/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Envia cookies
    body: JSON.stringify({ email, password })
  });
  return response.json();
}
```

### **3. Request viaja pela internet**
```
Navegador → HTTPS → Traefik (porta 443)
```

### **4. Traefik roteia para a API**
```
Traefik analisa:
  - Host: samm.host ✅
  - Path: /api/auth/login ✅
  
Traefik roteia → API Container (porta 3000)
```

### **5. API processa com middlewares**
```javascript
// Ordem de execução no servidor

1. CORS Middleware
   → Verifica origin: https://samm.host ✅
   
2. IP Filter Middleware
   → Verifica IP não está bloqueado ✅
   
3. Rate Limiting (opcional)
   → Verifica limite de requests ✅
   
4. Controller de Auth
   → Recebe { email, password }
```

### **6. API se comunica com Supabase (INTERNO)**
```javascript
// Código no servidor (API)
const { data, error } = await supabaseClient.auth.signInWithPassword({
  email: email,
  password: password
});

// Request vai para:
// http://supabase-kong-jcsck88cks440scs08w4ggcs:8000/auth/v1/token
//                   ↑
//            DNS interno Docker (só funciona dentro da network)
```

### **7. Supabase processa**
```
API → Supabase Kong (8000)
    ↓
Kong → GoTrue Service (Auth)
    ↓
GoTrue → PostgreSQL (valida credenciais)
    ↓
PostgreSQL → Retorna user data
    ↓
GoTrue → Gera JWT token
    ↓
Kong → Retorna para API
```

### **8. API retorna para o cliente**
```javascript
// Código no servidor (API)
if (error) {
  return res.status(401).json({ error: 'Credenciais inválidas' });
}

// Cria sessão no servidor
req.session.user = data.user;
req.session.accessToken = data.session.access_token;

// Retorna para o cliente (sem expor token sensível)
res.json({
  user: {
    id: data.user.id,
    email: data.user.email,
    role: data.user.role
  }
});
```

### **9. Frontend recebe e atualiza UI**
```javascript
// Código no navegador (Vue.js)
const result = await login(email, password);
if (result.user) {
  // Armazena no estado (Pinia/Vuex)
  userStore.setUser(result.user);
  
  // Redireciona
  router.push('/dashboard');
}
```

---

## 🔐 CAMADAS DE SEGURANÇA

```
┌─────────────────────────────────────────────────────────┐
│  Camada 1: HTTPS/TLS                                    │
│  - Criptografia end-to-end                              │
│  - Certificado Let's Encrypt                            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Camada 2: Traefik (Reverse Proxy)                     │
│  - Rate limiting global                                 │
│  - DDoS protection básico                               │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Camada 3: API Middlewares                              │
│  - IP Filtering (ipFilter.js)                           │
│  - CORS (só samm.host)                                  │
│  - Rate limiting per-user                               │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Camada 4: Autenticação                                 │
│  - JWT validation                                       │
│  - Session validation                                   │
│  - Role-based access control                            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Camada 5: Business Logic                               │
│  - Validação de dados                                   │
│  - Autorização por recurso                              │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Camada 6: Supabase RLS (Row Level Security)           │
│  - Políticas no banco de dados                          │
│  - Isolamento de dados por usuário                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🌐 NETWORKS DOCKER

### **Network: coolify (padrão)**
```
┌─────────────────────────────────────────┐
│  Network: coolify                       │
│  Subnet: 10.0.0.0/16 (exemplo)          │
│                                         │
│  Containers:                            │
│  - Frontend (d4g0sos40s8888gwggs44ocs)  │
│  - API (lwck8gk8owg0w8ggk0k8k4cs) ←─┐   │
│  - Traefik (coolify-proxy)           │   │
│  - Coolify (coolify)                 │   │
└─────────────────────────────────────┘   │
                                          │
                                   (Bridge conectada)
                                          │
┌─────────────────────────────────────────┤
│  Network: jcsck88cks440scs08w4ggcs      │
│  Subnet: 10.0.X.0/24 (privado)          │
│                                         │
│  Containers:                            │
│  - API (lwck8gk8owg0w8ggk0k8k4cs) ←─────┘
│  - Supabase Kong                        │
│  - Supabase Auth (GoTrue)               │
│  - Supabase REST (PostgREST)            │
│  - Supabase Storage                     │
│  - PostgreSQL                           │
│  - Realtime                             │
│  - Edge Functions                       │
└─────────────────────────────────────────┘
```

**Explicação:**
- API precisa estar em AMBAS as networks
- Network `coolify` para receber requests do Traefik
- Network `jcsck88cks440scs08w4ggcs` para falar com Supabase

---

## 🔍 DNS INTERNO DOCKER

### **Como funciona:**

```bash
# Dentro do container da API:
ping supabase-kong-jcsck88cks440scs08w4ggcs
→ PONG (resolve para 10.0.X.Y)

# No host (servidor):
ping supabase-kong-jcsck88cks440scs08w4ggcs
→ ERRO: Could not resolve host
```

**Por quê?**
- Docker cria DNS interno automático para cada network
- Containers na mesma network se enxergam pelo nome
- Host NÃO tem acesso ao DNS interno (precisa usar IPs)

### **Exemplo prático:**

```javascript
// ✅ CORRETO (dentro do container da API)
const supabaseUrl = 'http://supabase-kong-jcsck88cks440scs08w4ggcs:8000';

// ❌ ERRADO (não funciona no host)
curl http://supabase-kong-jcsck88cks440scs08w4ggcs:8000

// ✅ ALTERNATIVA (usar IP direto - mas não recomendado)
const supabaseUrl = 'http://10.0.X.Y:8000'; // IP muda a cada restart
```

---

## 📊 COMPARAÇÃO: ANTES vs DEPOIS

### ❌ **ANTES (não funcionava):**
```
Cliente
  ↓
Frontend (estático)
  ↓
??? (API não acessível)
  
API (isolada)
  ↓
❌ Supabase (network diferente)
```

### ✅ **DEPOIS (funciona):**
```
Cliente
  ↓
Frontend (estático) → fetch('https://samm.host/api/...')
  ↓
Traefik → API (pública) → middleware → auth
  ↓
Supabase Kong (privado) → services → DB
```

---

## 🎯 PONTOS-CHAVE

1. **Frontend é ESTÁTICO:** HTML/CSS/JS servido pelo servidor, mas **executa no navegador**
2. **API é PÚBLICA:** Precisa ser acessível via HTTPS, mas **protegida com auth**
3. **Supabase é PRIVADO:** Apenas a API consegue acessar, **nunca o cliente diretamente**
4. **Networks são fundamentais:** API precisa estar em ambas para se comunicar
5. **DNS interno do Docker:** Nomes de containers só funcionam dentro das networks

---

## ✅ CHECKLIST VISUAL

```
Internet → Traefik → API → Supabase → PostgreSQL
   ↓         ↓        ↓       ↓          ↓
  HTTPS    SSL       JWT   Network    RLS
  (443)   (Let's)   (Auth) (Bridge)  (Policies)
```

**Todos os pontos precisam funcionar para a aplicação estar completa!**
