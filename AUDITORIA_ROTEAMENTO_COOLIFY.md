# 🔍 AUDITORIA COMPLETA - PROBLEMA DE ROTEAMENTO COM COOLIFY

**Data:** 21 de outubro de 2025  
**Problema:** Rotas retornando 401, 404, 405 após mudanças  
**Causa Raiz:** Desconhecimento do Path Stripping do Coolify  
**Status:** ✅ RESOLVIDO

---

## 📋 ÍNDICE

1. [Resumo Executivo](#resumo-executivo)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [O Problema Original](#o-problema-original)
4. [Tentativas de Correção](#tentativas-de-correção)
5. [A Solução Final](#a-solução-final)
6. [Como o Coolify Funciona](#como-o-coolify-funciona)
7. [Configuração Correta](#configuração-correta)
8. [Checklist de Validação](#checklist-de-validação)
9. [Lições Aprendidas](#lições-aprendidas)

---

## 1. RESUMO EXECUTIVO

### 🎯 Problema
Login funcionava mas sessão não persistia (erro 401 em `/auth/session`).

### 🔍 Causa Raiz
**Path Stripping do Coolify** - Quando você configura um domínio com path no Coolify (`https://samm.host/api`), o Coolify **remove automaticamente** esse path antes de enviar a requisição para o container.

### ✅ Solução
Entender que:
- **Frontend:** Chama `/api/auth/login` (com `/api`)
- **Coolify:** Remove `/api` → Envia `/auth/login` para container
- **Backend:** Monta rotas sem `/api` → `app.use('/auth', authRoutes)`

---

## 2. ARQUITETURA DO SISTEMA

### Componentes

```
┌──────────────────────────────────────────────────────────────┐
│  Browser (Usuário)                                           │
│  └─ https://samm.host/auth (página de login)                │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│  Frontend Container (Vue.js)                                 │
│  └─ fetch('https://samm.host/api/auth/login')               │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│  Caddy/Nginx (Proxy Reverso do Coolify)                     │
│  Config: https://samm.host/api → Container API:3000         │
│  ⚠️ IMPORTANTE: Remove /api antes de enviar!                │
└──────────────────────────────────────────────────────────────┘
                          ↓ (Path: /auth/login)
┌──────────────────────────────────────────────────────────────┐
│  API Container (Express.js)                                  │
│  └─ app.use('/auth', authRoutes)                            │
│  └─ Processa: /auth/login ✅                                │
└──────────────────────────────────────────────────────────────┘
```

### Configuração do Coolify

**API Service - Domains:**
```
https://samm.host/api
```

**Frontend Service - Domains:**
```
https://samm.host
```

---

## 3. O PROBLEMA ORIGINAL

### Sintoma
Após login bem-sucedido, a chamada para `/auth/session` retornava **401 Unauthorized**.

### Logs do Console
```javascript
✅ Login bem-sucedido
✅ Cookie sb-access-token setado
❌ GET /auth/session → 401 Unauthorized
```

### Resposta da API
```json
{
  "success": false,
  "error": "Token não fornecido"
}
```

### Por que aconteceu?
O frontend estava chamando:
```javascript
// Frontend
fetch('/api/auth/session')  // ❌ Rota não existia
```

Mas deveria chamar:
```javascript
fetch('/auth/session')  // ✅ Rota correta (na época)
```

Isso porque originalmente o backend tinha:
```javascript
// Backend (configuração original)
app.use('/auth', authRoutes);  // Sem /api
```

E o Coolify **NÃO** tinha configuração para rotear `/auth/*` (só `/api/*`).

---

## 4. TENTATIVAS DE CORREÇÃO

### 📍 Tentativa 1: Remover API_PREFIX do Frontend

**Commit:** `e04656d`  
**Data:** 20 de outubro de 2025

**Mudança:**
```javascript
// ANTES
const API_PREFIX = '/api';
const url = `${API_BASE_URL}${API_PREFIX}${endpoint}`;

// DEPOIS (ERRO!)
const url = `${API_BASE_URL}${endpoint}`;
```

**Resultado:**
```
Frontend → /auth/login
         ↓
Nginx → ❌ 405 Method Not Allowed
```

**Por quê?**
Nginx/Caddy só tinha proxy configurado para `/api/*`. Requisições para `/auth/*` não eram roteadas para o container da API.

---

### 📍 Tentativa 2: Mover Backend para /api/auth

**Commit:** `7430493`  
**Data:** 20 de outubro de 2025

**Mudança:**
```javascript
// Backend
app.use('/api/auth', authRoutes);  // ❌ ERRADO
```

**Lógica (errada):**
"Se o Nginx só roteia `/api/*`, vou mover as rotas de auth para `/api/auth`"

**Resultado:**
```
Frontend → /api/auth/login
         ↓
Coolify → Remove /api → /auth/login
         ↓
Express procura → /api/auth/login
         ↓
❌ 404 Not Found (Express procura /api/auth mas recebe /auth)
```

**Por quê?**
Não sabia que o Coolify remove o `/api` antes de enviar para o container!

---

### 📍 Tentativa 3: Reverter Frontend

**Commit:** `c53d416`  
**Data:** 20 de outubro de 2025

**Mudança:**
```javascript
// Frontend - Voltou API_PREFIX
const API_PREFIX = '/api';
const url = `${API_BASE_URL}${API_PREFIX}${endpoint}`;
```

**Resultado:**
```
Frontend → /api/auth/login
         ↓
Coolify → Remove /api → /auth/login
         ↓
Express procura → /api/auth/login
         ↓
❌ 404 Not Found (ainda)
```

**Por quê?**
Backend ainda estava errado (`app.use('/api/auth')` ao invés de `app.use('/auth')`).

---

### 📍 SOLUÇÃO FINAL: Entender o Coolify

**Commit:** `1ed798f`  
**Data:** 21 de outubro de 2025

**Mudança:**
```javascript
// Backend - Volta ao normal (SEM /api)
app.use('/auth', authRoutes);  // ✅ CORRETO
```

**Resultado:**
```
Frontend → /api/auth/login
         ↓
Coolify → Remove /api → /auth/login
         ↓
Express → app.use('/auth') → /auth/login
         ↓
✅ 200 OK - Rota encontrada!
```

---

## 5. A SOLUÇÃO FINAL

### Configuração Correta do Backend

```javascript
// server.js

// 🔐 Rotas de Autenticação
app.use('/auth', authRoutes);  // ✅ SEM /api

// 📦 Rotas Auto-carregadas (via routeLoader.js)
// Monta em: /user, /points, /tools (sem /api)
await autoLoadRoutes(app);
```

### routeLoader.js

```javascript
// ANTES (ERRADO)
app.use(`/api/${category}`, routeModule.default);  // ❌

// DEPOIS (CORRETO)
app.use(`/${category}`, routeModule.default);  // ✅
```

**Por quê?**
Coolify já adiciona o `/api` no roteamento. Se você adicionar no Express também, fica duplicado:
- Request: `samm.host/api/user/profile`
- Coolify remove `/api` → `/user/profile`
- Express monta em `/api/user` → Procura `/api/user/profile` ❌ (não encontra!)

### Configuração Correta do Frontend

```javascript
// api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_PREFIX = '/api';  // ✅ Mantém

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${API_PREFIX}${endpoint}`;  // ✅
  // /auth/login → /api/auth/login
}
```

---

## 6. COMO O COOLIFY FUNCIONA

### Path Stripping (Remoção de Path)

Quando você configura um domínio com path no Coolify:

```
Domínio: https://samm.host/api
```

O Coolify faz:

```
┌───────────────────────────────────────────────────────┐
│  Requisição Externa: https://samm.host/api/auth/login │
└───────────────────────────────────────────────────────┘
                      ↓
┌───────────────────────────────────────────────────────┐
│  Caddy/Nginx (Proxy Reverso)                          │
│  1. Detecta: /api/* → Container API                   │
│  2. Remove: /api (Path Stripping)                     │
│  3. Envia: /auth/login                                │
└───────────────────────────────────────────────────────┘
                      ↓
┌───────────────────────────────────────────────────────┐
│  Container API (Express)                              │
│  Recebe: /auth/login (sem o /api)                    │
└───────────────────────────────────────────────────────┘
```

### Exemplo Prático

| Requisição Externa | Coolify Remove | Container Recebe |
|--------------------|----------------|------------------|
| `/api/auth/login` | `/api` | `/auth/login` |
| `/api/user/profile` | `/api` | `/user/profile` |
| `/api/points/balance` | `/api` | `/points/balance` |
| `/api/tools/list` | `/api` | `/tools/list` |

### ⚠️ ATENÇÃO: Path Stripping é automático!

Você **NÃO** precisa (e **NÃO** deve) adicionar `/api` nas rotas do Express quando usar Coolify com path.

---

## 7. CONFIGURAÇÃO CORRETA

### 📁 Estrutura de Rotas

#### Backend (Express)

```javascript
// server.js

// Rotas SEM /api (Coolify já adiciona)
app.use('/auth', authRoutes);           // /auth/*
app.use('/supabase', supabaseProxy);    // /supabase/*

// Auto-load também SEM /api
app.use('/user', userRoutes);           // /user/*
app.use('/points', pointsRoutes);       // /points/*
app.use('/tools', toolsRoutes);         // /tools/*
```

#### Frontend (Vue.js)

```javascript
// api.js
const API_PREFIX = '/api';  // ✅ Frontend adiciona /api

// Exemplos de chamadas:
authApi.login()      → /api/auth/login
userApi.getProfile() → /api/user/profile
pointsApi.balance()  → /api/points/balance
```

### 🔄 Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│  1. Frontend                                                 │
│     fetch('/api/auth/login')                                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Browser                                                  │
│     GET https://samm.host/api/auth/login                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Coolify (Caddy/Nginx)                                   │
│     Config: https://samm.host/api → Container API           │
│     Path Stripping: Remove /api                             │
│     Proxy para: http://api-container:3000/auth/login        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Express (Container)                                      │
│     Recebe: GET /auth/login                                 │
│     app.use('/auth', authRoutes)                            │
│     Processa: /auth/login ✅ ENCONTRADO                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  5. Response                                                 │
│     200 OK + Cookie: sb-access-token                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. CHECKLIST DE VALIDAÇÃO

### ✅ Backend (Express)

- [ ] Rotas montadas **SEM** `/api` prefix
- [ ] `app.use('/auth', authRoutes)` ✅
- [ ] `app.use('/user', userRoutes)` ✅
- [ ] `app.use('/points', pointsRoutes)` ✅
- [ ] `app.use('/tools', toolsRoutes)` ✅
- [ ] routeLoader.js monta em `/${category}` (sem `/api`) ✅

### ✅ Frontend (Vue.js)

- [ ] `API_PREFIX = '/api'` presente ✅
- [ ] `apiRequest()` adiciona `/api` prefix ✅
- [ ] Todas as chamadas usam `/api/*` ✅

### ✅ Coolify

- [ ] API Service Domain: `https://samm.host/api` ✅
- [ ] Frontend Service Domain: `https://samm.host` ✅

### ✅ Testes

```bash
# 1. Healthcheck
curl https://samm.host/api/health
# Esperado: 200 OK

# 2. Sessão (sem token)
curl https://samm.host/api/auth/session
# Esperado: 401 + {"success":false,"error":"Token não fornecido"}

# 3. Login
curl -X POST https://samm.host/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"senha"}'
# Esperado: 200 OK + Cookie

# 4. Perfil (sem token)
curl https://samm.host/api/user/profile
# Esperado: 401 Unauthorized

# 5. Perfil (com token)
curl https://samm.host/api/user/profile \
  -H "Cookie: sb-access-token=TOKEN"
# Esperado: 200 OK + dados do usuário
```

---

## 9. LIÇÕES APRENDIDAS

### 🎓 Principais Aprendizados

#### 1. **Entenda a Infraestrutura Antes de Modificar**

**Erro:** Modificar código sem entender como o proxy funciona.

**Aprendizado:** Sempre verificar:
- Como o proxy está configurado (Nginx, Caddy, etc)
- Se há path stripping/rewriting
- Onde as rotas são montadas (backend vs proxy)

#### 2. **Path Stripping é Comum em Proxies**

Proxies reversos frequentemente:
- Removem prefixos de path
- Adicionam headers (X-Forwarded-For, X-Real-IP)
- Fazem SSL termination

**Regra:** Se o domínio tem path (`/api`), o proxy provavelmente remove antes de enviar para o container.

#### 3. **Teste Progressivamente**

**Erro:** Fazer múltiplas mudanças de uma vez.

**Correto:**
1. Fazer uma mudança
2. Testar
3. Se funcionar → continuar
4. Se não funcionar → reverter e tentar outra abordagem

#### 4. **Documente a Arquitetura**

**Erro:** Confiar na memória sobre como o sistema funciona.

**Correto:** Documentar:
- Fluxo de requisições
- Configuração de proxy
- Estrutura de rotas
- Variáveis de ambiente

#### 5. **Use Ferramentas de Debug**

```bash
# Ver logs do container
docker logs <container-id> -f

# Testar rota direto no container (bypass proxy)
docker exec -it <container-id> curl http://localhost:3000/auth/login

# Testar via proxy
curl -v https://samm.host/api/auth/login
```

### 📝 Checklist para Futuros Problemas de Roteamento

1. **Verificar a requisição externa:**
   - Qual URL o frontend está chamando?
   - Qual método HTTP?
   - Quais headers?

2. **Verificar o proxy:**
   - Qual configuração de domínio no Coolify?
   - Há path stripping?
   - Logs do proxy mostram algo?

3. **Verificar o container:**
   - Qual path o container recebe?
   - Logs do Express mostram tentativa de roteamento?
   - Rota está registrada corretamente?

4. **Testar isoladamente:**
   - Funciona direto no container (localhost:3000)?
   - Funciona via proxy público?
   - Funciona em desenvolvimento local?

### 🚨 Erros Comuns a Evitar

| Erro | Por que é errado | Solução |
|------|------------------|---------|
| Adicionar `/api` no Express quando Coolify já adiciona | Path duplicado: `/api/api/*` | Montar rotas sem `/api` |
| Remover `/api` do frontend sem verificar proxy | Proxy não roteia `/auth/*` | Manter `/api` no frontend |
| Mudar várias coisas ao mesmo tempo | Dificulta debug | Mudanças incrementais |
| Não testar após cada mudança | Acúmulo de erros | Teste após cada commit |
| Não documentar a solução | Repetir mesmo erro depois | Criar auditoria (este doc) |

---

## 10. REFERÊNCIAS

### Commits Relacionados

- `e04656d` - ❌ Tentativa 1: Remover API_PREFIX (405)
- `7430493` - ❌ Tentativa 2: Mover para /api/auth (404)
- `c53d416` - ❌ Tentativa 3: Reverter frontend (404)
- `1ed798f` - ✅ Solução: Entender path stripping (200)

### Arquivos Modificados

- `dist-api/server.js` - Montagem de rotas
- `dist-api/src/core/routeLoader.js` - Auto-load de rotas
- `tools-website-builder/src/services/api.js` - Cliente API frontend

### Documentação Externa

- [Coolify Docs - Domain Configuration](https://coolify.io/docs)
- [Express Routing Guide](https://expressjs.com/en/guide/routing.html)
- [Nginx Proxy Pass](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)

---

## 📞 CONTATO PARA DÚVIDAS

Se você (futuro eu) estiver lendo isso e tiver dúvidas:

1. Verifique os commits mencionados
2. Revise o fluxo de requisições (seção 7)
3. Execute o checklist de validação (seção 8)
4. Se ainda não funcionar, debug passo a passo:
   - Frontend → Proxy → Container → Express

---

**Última atualização:** 21 de outubro de 2025  
**Versão:** 1.0  
**Status:** ✅ Sistema funcionando corretamente
