# 🔍 AUDITORIA COMPLETA DA API
## Data: 21 de outubro de 2025

---

## 📊 Estrutura Geral

```
dist-api/
├── 📄 server.js                    # Ponto de entrada principal
├── 📁 src/                         # Código fonte (NOSSO CÓDIGO)
│   ├── config/                     # Configurações
│   ├── core/                       # Sistema core (base)
│   ├── functions/                  # 🎯 FERRAMENTAS MODULARES (padrão antigo)
│   ├── middlewares/                # 🛡️ SEGURANÇA & PROTEÇÃO
│   ├── routes/                     # 🌐 ROTAS DE SISTEMA
│   ├── services/                   # 💼 SERVIÇOS COMPARTILHADOS
│   ├── utils/                      # 🔧 UTILITÁRIOS
│   └── validators/                 # ✅ VALIDADORES
├── 📁 supabase/migrations/         # Migrations do banco
├── 📁 database/                    # Scripts SQL diversos
└── 📁 node_modules/                # Dependências (npm)
```

---

## 🎯 EXPLICAÇÃO: Por que 2 abordagens diferentes?

### **A API evoluiu de um padrão MODULAR para um padrão CENTRALIZADO**

### 📁 **src/functions/** - Padrão ANTIGO (Modular - Para Ferramentas)

**Filosofia:** Cada "ferramenta" é um mini-app isolado dentro da API.

```
src/functions/
├── auth/           # ⚠️ OBSOLETO (movido para src/routes/authRoutes.js)
├── health/         # ✅ Health check simples
├── points/         # ✅ Sistema de pontos (usado)
├── tools/          # ✅ Executor de ferramentas (usado)
├── user/           # ✅ Perfil de usuário (usado)
└── _TEMPLATE/      # 📝 Template para novas ferramentas
```

**Quando usar `src/functions/`:**
- ✅ Novas ferramentas que usuários **executam** (ex: calculadoras, conversores)
- ✅ Funcionalidades que **consomem pontos**
- ✅ Cada ferramenta deve ser **auto-contida** (controller + routes + utils)
- ✅ Ferramentas que podem ser **ativadas/desativadas** individualmente

**Exemplo de uso:**
```bash
POST /tools/execute/salary_calculator
POST /tools/execute/pdf_parser
POST /tools/execute/currency_converter
```

---

### 📁 **src/routes/** - Padrão NOVO (Centralizado - Para Sistema)

**Filosofia:** Rotas de infraestrutura que fazem parte do **core da API**.

```
src/routes/
├── authRoutes.js       # 🔐 Autenticação (login, register, logout)
├── auditRoutes.js      # 📊 Visualização de logs de auditoria (ADMIN)
├── securityRoutes.js   # 🛡️ Gerenciamento de segurança (ADMIN)
├── docs.js             # 📚 Documentação da API
├── logsDashboard.js    # 📈 Dashboard de logs (ADMIN)
├── logsRoutes.js       # 📜 Logs de acesso
├── zerotier.js         # 🌐 Integração ZeroTier
└── index.js            # 🔗 Agregador de rotas
```

**Quando usar `src/routes/`:**
- ✅ Funcionalidades **core da API** (não são "ferramentas")
- ✅ Autenticação, segurança, administração
- ✅ Rotas que **NÃO consomem pontos** do usuário
- ✅ Rotas administrativas (apenas admin)
- ✅ Integrações de sistema (ZeroTier, webhooks, etc)

**Exemplo de uso:**
```bash
POST /auth/login           # Sistema (não consome pontos)
GET /audit/stats           # Admin (não consome pontos)
POST /security/block-ip    # Admin (não consome pontos)
GET /docs                  # Público (não consome pontos)
```

---

## 🏗️ ARQUITETURA DETALHADA

### 1️⃣ **src/config/** - Configurações Centralizadas

```javascript
config/
├── allowedIPs.js       # Lista de IPs permitidos (VPN, admin)
├── index.js            # Exporta todas as configs
├── supabase.js         # Cliente Supabase (anon key)
└── supabaseRest.js     # Cliente REST Supabase
```

**Responsabilidade:** Centralizar todas as configurações sensíveis e clientes de serviços externos.

---

### 2️⃣ **src/core/** - Sistema Base

```javascript
core/
├── BaseController.js   # Classe base para controllers (herança)
└── routeLoader.js      # Carrega rotas automaticamente
```

**Responsabilidade:** Código que serve de base para outros módulos (DRY - Don't Repeat Yourself).

---

### 3️⃣ **src/middlewares/** - Camada de Proteção 🛡️

```javascript
middlewares/
├── accessLevel.js       # Controle de acesso por nível
├── adminAuth.js         # Autenticação de admin (requireAuth, requireAdmin)
├── dualRateLimiter.js   # Rate limiter IP + CPF
├── errorHandler.js      # Tratamento global de erros
├── ipFilter.js          # Filtro de IPs (VPN only)
├── rateLimiter.js       # Rate limiter simples (legado)
├── rateLimiters.js      # ✅ FASE 2: Rate limiters categorizados
├── securityHeaders.js   # Headers de segurança (CORS, CSP, etc)
├── supabaseProxy.js     # Proxy para Supabase
└── validator.js         # Validação de schemas
```

**Responsabilidade:** 
- 🔒 **Autenticação e Autorização**
- ⚡ **Rate Limiting** (proteção contra abuse)
- 🛡️ **Segurança** (headers, IP filtering)
- ✅ **Validação de entrada**
- ❌ **Tratamento de erros**

**Por que aqui e não em `functions/`?**
- Middlewares são **compartilhados** por TODAS as rotas
- São aplicados **globalmente** ou em grupos de rotas
- Não são funcionalidades isoladas, são **camadas de proteção**

---

### 4️⃣ **src/routes/** - Rotas de Sistema 🌐

```javascript
routes/
├── auditRoutes.js       # ✅ FASE 3: Rotas de auditoria (admin)
├── authRoutes.js        # ✅ MOVIDO de functions/auth/
├── docs.js              # Documentação Swagger/OpenAPI
├── index.js             # Agregador (importa todas as rotas)
├── logsDashboard.js     # Dashboard visual de logs
├── logsRoutes.js        # API de logs de acesso
├── securityRoutes.js    # ✅ FASE 1: Gerenciamento de IPs bloqueados
└── zerotier.js          # Webhook ZeroTier
```

**Responsabilidade:**
- 🔐 **Autenticação** (login, register, logout, OTP)
- 📊 **Auditoria** (visualização de logs para admin)
- 🛡️ **Segurança** (bloquear/desbloquear IPs, ver alertas)
- 📚 **Documentação** (Swagger UI)
- 🌐 **Integrações** (ZeroTier, webhooks futuros)

**Por que aqui e não em `functions/`?**
- São funcionalidades **core da API**, não ferramentas de usuário
- Não consomem pontos
- São essenciais para o funcionamento do sistema
- Seguem padrão centralizado (mais fácil de manter)

---

### 5️⃣ **src/services/** - Lógica de Negócio Compartilhada 💼

```javascript
services/
└── auditService.js     # ✅ FASE 3: Serviço de auditoria
```

**Responsabilidade:**
- Encapsular lógica complexa que é **reutilizada** em múltiplos lugares
- Exemplo: `auditService.js` é usado em:
  - `authRoutes.js` (registra login/logout)
  - `rateLimiters.js` (registra violações)
  - `toolsController.js` (registra execuções)
  - `auditRoutes.js` (consulta logs)

**Por que aqui e não em `functions/`?**
- Services são **compartilhados** entre múltiplos módulos
- Não são endpoints HTTP (são funções JavaScript)
- Centralizam lógica para evitar duplicação

---

### 6️⃣ **src/utils/** - Utilitários Globais 🔧

```javascript
utils/
├── accessLogger.js         # Logger de acesso HTTP
├── alertSystem.js          # Sistema de alertas de segurança
├── ipBlockingSystem.js     # ✅ FASE 1: Sistema de bloqueio de IPs
├── ipUtils.js              # Utilitários de IP (validação, etc)
└── startupLogger.js        # Logger de inicialização da API
```

**Responsabilidade:**
- Funções utilitárias que **não pertencem a nenhum módulo específico**
- Logging, formatação, validação, helpers diversos

**Por que aqui e não em `functions/`?**
- Utilitários são **globais** e usados em vários lugares
- Não são endpoints HTTP
- São funções auxiliares, não funcionalidades

---

### 7️⃣ **src/validators/** - Validadores de Schema ✅

```javascript
validators/
└── schemas.js          # Schemas Joi/Zod para validação
```

**Responsabilidade:**
- Definir schemas de validação para requests
- Usado pelo middleware `validator.js`

**Por que aqui e não em `functions/`?**
- Schemas são **compartilhados** entre múltiplas rotas
- Centralizar evita duplicação de código

---

### 8️⃣ **src/functions/** - Ferramentas Modulares 🎯

```javascript
functions/
├── auth/               # ⚠️ OBSOLETO (movido para src/routes/)
│   ├── authController.js
│   ├── authMiddleware.js
│   ├── authRoutes.js
│   ├── authUtils.js
│   └── README.md
│
├── health/             # ✅ Health check
│   ├── healthController.js
│   └── healthRoutes.js
│
├── points/             # ✅ Sistema de pontos
│   ├── pointsController.js
│   ├── pointsRoutes.js
│   ├── pointsService.js
│   └── README.md
│
├── tools/              # ✅ Executor de ferramentas
│   ├── toolsController.js
│   ├── toolsRoutes.js
│   └── README.md
│
├── user/               # ✅ Perfil de usuário
│   ├── userController.js
│   ├── userRoutes.js
│   └── README.md
│
└── _TEMPLATE/          # 📝 Template para novas ferramentas
    ├── templateController.js
    ├── templateRoutes.js
    ├── templateUtils.js
    └── README.md
```

**Responsabilidade:**
- Módulos **auto-contidos** que podem ser ligados/desligados
- Funcionalidades que **usuários executam** (não admin)
- Geralmente consomem pontos

**Status atual:**
- ✅ **health/** - Usado (GET /health)
- ✅ **points/** - Usado (GET /points/balance, POST /points/add)
- ✅ **tools/** - Usado (POST /tools/execute/:toolName)
- ✅ **user/** - Usado (GET /user/profile, PUT /user/profile)
- ⚠️ **auth/** - **OBSOLETO** (funcionalidade movida para `src/routes/authRoutes.js`)
- 📝 **_TEMPLATE/** - Template para novas ferramentas

---

## 🤔 POR QUE FIZEMOS ALTERAÇÕES FORA DE `functions/`?

### **Porque as Fases 1, 2 e 3 foram sobre INFRAESTRUTURA, não ferramentas!**

| Fase | O que implementamos | Onde ficou | Por quê? |
|------|-------------------|-----------|----------|
| **Fase 1** | Sistema de bloqueio de IPs | `src/utils/ipBlockingSystem.js` + `src/routes/securityRoutes.js` | Infraestrutura de segurança compartilhada |
| **Fase 2** | Rate Limiting | `src/middlewares/rateLimiters.js` | Middleware global que protege TODAS as rotas |
| **Fase 3** | Auditoria | `src/services/auditService.js` + `src/routes/auditRoutes.js` | Sistema de logging compartilhado |

### **Nenhuma dessas é uma "ferramenta de usuário"!**

- ❌ Não são funcionalidades que usuários **executam**
- ❌ Não consomem pontos
- ❌ Não são isoladas (são usadas em múltiplos lugares)
- ✅ São **infraestrutura** que protege e monitora a API inteira

---

## 📋 QUANDO USAR CADA PASTA?

### ✅ Use **`src/functions/`** quando:
1. Criar uma **nova ferramenta** que usuários executam
2. A ferramenta **consome pontos** do usuário
3. A ferramenta é **isolada** (não precisa de outros módulos)
4. A ferramenta pode ser **ativada/desativada** individualmente
5. Exemplo: Calculadora de salário, Conversor de moeda, Parser de PDF

**Como criar nova ferramenta:**
```bash
# 1. Copiar template
cp -r src/functions/_TEMPLATE src/functions/minha_ferramenta

# 2. Editar arquivos
# - minhaFerramentaController.js (lógica)
# - minhaFerramentaRoutes.js (endpoints)
# - minhaFerramentaUtils.js (funções auxiliares)
# - README.md (documentação)

# 3. Ferramenta será auto-carregada pelo routeLoader.js
```

### ✅ Use **`src/routes/`** quando:
1. Criar rotas de **sistema/admin** (não ferramentas)
2. Funcionalidade **não consome pontos**
3. Funcionalidade é **essencial** para API (auth, security, etc)
4. Precisa ser **integrada** com outras partes do sistema
5. Exemplo: Webhooks, integrações externas, admin panels

### ✅ Use **`src/middlewares/`** quando:
1. Criar **proteção** que se aplica a múltiplas rotas
2. Validação, autenticação, rate limiting
3. Headers de segurança, CORS, etc
4. Tratamento de erros global

### ✅ Use **`src/services/`** quando:
1. Criar **lógica complexa** usada em múltiplos lugares
2. Não é um endpoint HTTP (é uma função JavaScript)
3. Precisa ser **reutilizada** (DRY principle)
4. Exemplo: auditService, emailService, paymentService

### ✅ Use **`src/utils/`** quando:
1. Criar **funções auxiliares** genéricas
2. Não pertencem a nenhum módulo específico
3. Podem ser usadas em qualquer lugar
4. Exemplo: formatDate(), validateCPF(), generateUUID()

---

## 📊 MAPA DE DEPENDÊNCIAS

```
server.js
├── src/routes/index.js                    (agrega todas as rotas)
│   ├── src/routes/authRoutes.js           (usa auditService, rateLimiters)
│   ├── src/routes/auditRoutes.js          (usa auditService, adminAuth)
│   ├── src/routes/securityRoutes.js       (usa ipBlockingSystem, adminAuth)
│   ├── src/routes/docs.js                 (usa todos os endpoints)
│   └── src/functions/**/routes.js         (auto-carregadas)
│
├── src/middlewares/
│   ├── rateLimiters.js                    (usa auditService)
│   ├── adminAuth.js                       (usa supabase)
│   ├── ipFilter.js                        (usa allowedIPs)
│   └── errorHandler.js                    (usa logger)
│
├── src/services/
│   └── auditService.js                    (usa supabase service role)
│
└── src/utils/
    ├── ipBlockingSystem.js                (standalone)
    ├── alertSystem.js                     (standalone)
    └── accessLogger.js                    (usa winston)
```

---

## 🎯 ANÁLISE: O que está sendo usado?

### ✅ **USADO ATIVAMENTE:**

| Módulo | Status | Responsabilidade |
|--------|--------|------------------|
| `src/routes/authRoutes.js` | ✅ 100% | Login, register, logout, OTP |
| `src/routes/auditRoutes.js` | ✅ 100% | Visualização de logs (admin) |
| `src/routes/securityRoutes.js` | ✅ 100% | Gerenciamento de IPs bloqueados |
| `src/middlewares/rateLimiters.js` | ✅ 100% | Proteção contra abuse (5 limiters) |
| `src/middlewares/adminAuth.js` | ✅ 100% | Autenticação admin |
| `src/middlewares/ipFilter.js` | ✅ 100% | Filtro de IPs (VPN) |
| `src/services/auditService.js` | ✅ 100% | Logging de auditoria |
| `src/utils/ipBlockingSystem.js` | ✅ 100% | Sistema de bloqueio de IPs |
| `src/functions/health/` | ✅ 100% | Health check |
| `src/functions/points/` | ✅ 100% | Sistema de pontos |
| `src/functions/tools/` | ✅ 100% | Executor de ferramentas |
| `src/functions/user/` | ✅ 100% | Perfil de usuário |

### ⚠️ **OBSOLETO / REDUNDANTE:**

| Módulo | Status | Motivo | Ação |
|--------|--------|--------|------|
| `src/functions/auth/` | ✅ REMOVIDO | Movido para `src/routes/authRoutes.js` + `src/middlewares/adminAuth.js` | ~~Pode ser removido~~ **DELETADO** |
| `src/middlewares/rateLimiter.js` | ✅ REMOVIDO | Substituído por `rateLimiters.js` | ~~Pode ser removido~~ **DELETADO** |
| `authUtils.js` | ✅ MOVIDO | Movido de `functions/auth/` para `src/utils/` | Preservado (funções úteis) |

### 📝 **TEMPLATES / DOCUMENTAÇÃO:**

| Módulo | Status | Responsabilidade |
|--------|--------|------------------|
| `src/functions/_TEMPLATE/` | 📝 TEMPLATE | Base para novas ferramentas |

---

## 📈 ESTATÍSTICAS DA API

### **Linhas de código (aproximado):**
```
server.js:                    ~150 linhas
src/routes/:                  ~2500 linhas (authRoutes: 1500, auditRoutes: 400, etc)
src/middlewares/:             ~1000 linhas (rateLimiters: 500, adminAuth: 250, etc)
src/services/:                ~600 linhas (auditService)
src/utils/:                   ~900 linhas (ipBlockingSystem: 400, authUtils: 130, etc)
src/functions/:               ~1500 linhas (tools: 600, points: 400, user: 300, health: 200)
src/config/:                  ~200 linhas
src/core/:                    ~100 linhas
src/validators/:              ~100 linhas

TOTAL (sem node_modules):     ~6950 linhas de código próprio
✅ REMOVIDO: ~500 linhas de código duplicado/obsoleto
🎯 TOTAL LIMPO: ~6450 linhas de código próprio
```

### **Arquivos de código fonte:**
```
Total de arquivos .js:        ~45 arquivos
Arquivos de rotas:            ~15 arquivos
Middlewares:                  ~10 arquivos
Utilitários:                  ~5 arquivos
Controllers:                  ~10 arquivos
Services:                     ~1 arquivo (auditService)
```

### **Rotas registradas:**
```
Autenticação:                 ~15 rotas (login, register, logout, OTP, etc)
Auditoria (admin):            ~10 rotas (stats, logs, suspicious, etc)
Segurança (admin):            ~8 rotas (block IP, unblock, list, alerts)
Ferramentas:                  ~6 rotas (execute, list, health, points, user)
Documentação:                 ~2 rotas (docs, openapi)
Logs:                         ~4 rotas (logs, dashboard)

TOTAL:                        ~45 rotas HTTP
```

---

## 🔧 RECOMENDAÇÕES

### ✅ **O QUE ESTÁ BOM:**

1. ✅ Separação clara entre **sistema** (`src/routes/`) e **ferramentas** (`src/functions/`)
2. ✅ Middlewares bem organizados e reutilizáveis
3. ✅ Auditoria completa implementada
4. ✅ Rate limiting robusto (5 limiters categorizados)
5. ✅ Sistema de segurança funcional (IP blocking, RLS, admin auth)
6. ✅ Código documentado (READMEs em cada pasta)

### 🟡 **PODE MELHORAR:**

1. ✅ ~~**Remover código obsoleto:**~~ **CONCLUÍDO!** (Commit 4156347)
   - ~~`src/functions/auth/`~~ → **DELETADO** (movido para `src/routes/authRoutes.js` + `src/middlewares/adminAuth.js`)
   - ~~`src/middlewares/rateLimiter.js`~~ → **DELETADO** (substituído por `rateLimiters.js`)
   - `authUtils.js` → **MOVIDO** para `src/utils/authUtils.js`

2. 🟡 **Adicionar mais services:**
   - `emailService.js` - Para envio de emails (OTP, alertas)
   - `pointsService.js` - Já existe em `functions/points/`, pode mover para `services/`

3. 🟡 **Melhorar documentação:**
   - Criar `ARCHITECTURE.md` explicando a estrutura (este documento!)
   - Adicionar JSDoc em funções complexas

4. 🟡 **Testes unitários:**
   - Criar pasta `src/__tests__/`
   - Adicionar testes para funções críticas (auditService, ipBlockingSystem)

### 🔴 **CRÍTICO (Opcional - Fase 4):**

1. 🔴 **Redis para rate limiting:**
   - Substituir rate limiters em memória por Redis
   - Problema atual: limites resetam ao reiniciar container

2. 🔴 **Métricas e Observabilidade:**
   - Adicionar Prometheus + Grafana
   - Dashboards de performance, uptime, erros

3. 🔴 **CI/CD:**
   - Adicionar testes automatizados no GitHub Actions
   - Deploy automático via Coolify

---

## 🎯 RESPOSTA FINAL: Por que alterações fora de `functions/`?

### **TL;DR: Porque `functions/` é para FERRAMENTAS, não para INFRAESTRUTURA!**

**O que implementamos nas Fases 1-3:**
- 🛡️ **Segurança** (IP blocking, rate limiting, audit logging)
- 🔐 **Autenticação** (login, register, logout, OTP)
- 📊 **Auditoria** (tracking de todas as ações)
- 👮 **Administração** (rotas admin para gerenciar segurança)

**Nenhuma dessas é uma "ferramenta de usuário"!**

### **A pasta `functions/` deve ser usada para:**
- ✅ Calculadora de salário
- ✅ Conversor de moeda
- ✅ Parser de PDF
- ✅ Gerador de relatórios
- ✅ Qualquer ferramenta que **usuários executam** e **consome pontos**

### **A pasta `src/routes/` deve ser usada para:**
- ✅ Sistema de autenticação
- ✅ Administração da API
- ✅ Integrações externas (webhooks)
- ✅ Qualquer funcionalidade **core da API** que **não consome pontos**

---

## 🏆 CONCLUSÃO

A API está **bem arquitetada** com separação clara de responsabilidades:

| Camada | Responsabilidade | Exemplo |
|--------|------------------|---------|
| **server.js** | Entry point | Inicia Express, carrega rotas |
| **src/routes/** | Sistema core | Auth, audit, security, docs |
| **src/functions/** | Ferramentas | Calculadoras, conversores, tools |
| **src/middlewares/** | Proteção | Rate limit, auth, validation |
| **src/services/** | Lógica compartilhada | auditService, futuro emailService |
| **src/utils/** | Utilitários globais | IP utils, loggers, formatters |
| **src/config/** | Configurações | Supabase, allowed IPs, env vars |

**Status Geral:** ✅ **API ROBUSTA E BEM ESTRUTURADA**

**Próximos passos sugeridos:**
1. ✅ ~~Limpar código obsoleto~~ **CONCLUÍDO!** (Commit 4156347 - Removido ~500 linhas)
2. ✅ ~~Documentar arquitetura~~ **CONCLUÍDO!** (Este documento + AUDITORIA_DUPLICACAO.md)
3. 🧪 Adicionar testes unitários (Fase 4 - opcional)
4. 📊 Adicionar métricas (Fase 4 - opcional)
5. 🚀 Continuar adicionando ferramentas em `src/functions/` conforme necessidade

---

**Auditoria realizada por:** GitHub Copilot AI  
**Data:** 21 de outubro de 2025  
**Versão da API:** 1.0.0 (Fases 1-3 completas)
