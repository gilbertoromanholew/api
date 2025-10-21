# 🔍 AUDITORIA: CÓDIGO DUPLICADO E OBSOLETO
## Data: 21 de outubro de 2025

---

## 🎯 OBJETIVO

Identificar código **duplicado**, **obsoleto** ou **mal localizado** e reorganizar seguindo o princípio:
- ✅ **Centralizado** (src/routes/, src/middlewares/, src/services/) = Infraestrutura compartilhada
- ✅ **Modular** (src/functions/) = Ferramentas isoladas

---

## 🔎 DESCOBERTAS

### 1️⃣ **DUPLICAÇÃO CRÍTICA: `requireAuth` e `requireAdmin`**

**Problema:** Temos 2 implementações diferentes de autenticação!

| Local | Arquivo | Status |
|-------|---------|--------|
| **NOVO (Centralizado)** | `src/middlewares/adminAuth.js` | ✅ Usado em rotas de admin |
| **ANTIGO (Modular)** | `src/functions/auth/authMiddleware.js` | ⚠️ Usado em server.js e auditRoutes.js |

**Análise:**

#### **`src/middlewares/adminAuth.js` (NOVO - Fase 3)**
```javascript
// ✅ Usa cookies HTTP-only (sb-access-token)
// ✅ Usa Supabase Admin (service role)
// ✅ Consulta perfil do usuário (profiles.role)
// ✅ Tem requireAuth + requireAdmin
// ✅ Padrão moderno e seguro

export async function requireAuth(req, res, next) {
    const sessionCookie = req.cookies?.['sb-access-token'];
    // Valida com supabaseAdmin.auth.getUser()
}

export async function requireAdmin(req, res, next) {
    // Verifica se user.role === 'admin'
}
```

#### **`src/functions/auth/authMiddleware.js` (ANTIGO - Legado)**
```javascript
// ⚠️ Usa Authorization header ou cookie genérico (auth_token)
// ⚠️ Usa função customizada getUserFromToken()
// ⚠️ Não consulta role do usuário
// ⚠️ Não tem requireAdmin
// ⚠️ Padrão antigo

export async function requireAuth(req, res, next) {
    const token = extractTokenFromHeader(authHeader) || cookieToken;
    const user = await getUserFromToken(token);
}

export async function optionalAuth(req, res, next) {
    // Versão opcional (não bloqueia se não autenticado)
}
```

**Onde cada um é usado:**

| Arquivo | Importa de | Função usada |
|---------|-----------|--------------|
| `server.js` | `functions/auth/authMiddleware.js` | `requireAuth`, `optionalAuth` |
| `src/routes/auditRoutes.js` | `functions/auth/authMiddleware.js` | `requireAuth` |
| `src/routes/authRoutes.js` | `middlewares/adminAuth.js` | `requireAuth`, `requireAdmin` |
| `src/routes/securityRoutes.js` | `middlewares/adminAuth.js` | `requireAuth`, `requireAdmin` |

**DECISÃO:**
- ✅ **Manter:** `src/middlewares/adminAuth.js` (padrão moderno, completo)
- ❌ **Remover:** `src/functions/auth/authMiddleware.js` (obsoleto, incompleto)
- 🔄 **Migrar:** `server.js` e `auditRoutes.js` para usar `adminAuth.js`

---

### 2️⃣ **PASTA OBSOLETA: `src/functions/auth/`**

**Status atual da pasta:**
```
src/functions/auth/
├── authController.js       # ⚠️ Obsoleto (funcionalidade em src/routes/authRoutes.js)
├── authMiddleware.js       # ⚠️ Obsoleto (substituído por src/middlewares/adminAuth.js)
├── authRoutes.js           # ⚠️ Obsoleto (funcionalidade em src/routes/authRoutes.js)
├── authUtils.js            # 🟡 Verificar se tem funções úteis
└── README.md               # 📝 Documentação antiga
```

**Análise de cada arquivo:**

#### **authController.js** (⚠️ OBSOLETO)
- Funções de login, register, logout
- **Substituído por:** `src/routes/authRoutes.js` (que já tem tudo isso + auditoria)
- **Ação:** REMOVER

#### **authMiddleware.js** (⚠️ OBSOLETO)
- requireAuth, optionalAuth
- **Substituído por:** `src/middlewares/adminAuth.js`
- **Ação:** REMOVER após migração

#### **authRoutes.js** (⚠️ OBSOLETO)
- Rotas de autenticação antigas
- **Substituído por:** `src/routes/authRoutes.js` (1500 linhas, completo)
- **Ação:** REMOVER

#### **authUtils.js** (🟡 VERIFICAR)
```javascript
// Funções como:
// - extractTokenFromHeader()
// - validatePassword()
// - etc
```
- **Ação:** REVISAR, mover funções úteis para `src/utils/` ou manter se necessário

---

### 3️⃣ **MIDDLEWARE DUPLICADO: Rate Limiters**

| Arquivo | Status | Motivo |
|---------|--------|--------|
| `src/middlewares/rateLimiters.js` | ✅ ATIVO | Fase 2: 5 limiters categorizados com auditoria |
| `src/middlewares/rateLimiter.js` | ⚠️ LEGADO | Versão antiga sem auditoria |

**Verificar uso:**

```bash
# Buscar importações de rateLimiter.js (antigo)
grep -r "from.*rateLimiter.js" dist-api/
```

**DECISÃO:**
- ✅ **Manter:** `rateLimiters.js` (novo, com auditoria)
- ❌ **Remover:** `rateLimiter.js` (se não estiver em uso)

---

### 4️⃣ **CÓDIGO BEM LOCALIZADO (Manter)**

#### ✅ **Infraestrutura Centralizada (src/routes/, src/middlewares/, src/services/):**

| Arquivo | Responsabilidade | Status |
|---------|------------------|--------|
| `src/routes/authRoutes.js` | Autenticação (login, register, logout, OTP) | ✅ ÓTIMO |
| `src/routes/auditRoutes.js` | Visualização de logs (admin) | ✅ ÓTIMO |
| `src/routes/securityRoutes.js` | Gerenciamento de IPs bloqueados | ✅ ÓTIMO |
| `src/middlewares/adminAuth.js` | Autenticação + autorização admin | ✅ ÓTIMO |
| `src/middlewares/rateLimiters.js` | Rate limiting com auditoria | ✅ ÓTIMO |
| `src/middlewares/ipFilter.js` | Filtro de IPs (VPN) | ✅ ÓTIMO |
| `src/services/auditService.js` | Logging de auditoria | ✅ ÓTIMO |
| `src/utils/ipBlockingSystem.js` | Sistema de bloqueio de IPs | ✅ ÓTIMO |
| `src/utils/alertSystem.js` | Sistema de alertas | ✅ ÓTIMO |

#### ✅ **Ferramentas Modulares (src/functions/):**

| Pasta | Responsabilidade | Status |
|-------|------------------|--------|
| `src/functions/health/` | Health check | ✅ ÓTIMO (modular) |
| `src/functions/points/` | Sistema de pontos | ✅ ÓTIMO (modular) |
| `src/functions/tools/` | Executor de ferramentas | ✅ ÓTIMO (modular) |
| `src/functions/user/` | Perfil de usuário | ✅ ÓTIMO (modular) |
| `src/functions/_TEMPLATE/` | Template para novas ferramentas | ✅ ÓTIMO (template) |

---

## 📋 PLANO DE AÇÃO

### 🔴 **AÇÃO 1: Migrar imports para adminAuth.js**

**Arquivos a modificar:**
1. `server.js` - Trocar import de `functions/auth/authMiddleware.js` → `middlewares/adminAuth.js`
2. `src/routes/auditRoutes.js` - Trocar import de `functions/auth/authMiddleware.js` → `middlewares/adminAuth.js`

**Mudanças necessárias:**

#### **server.js**
```javascript
// ANTES
import { requireAuth, optionalAuth } from './src/functions/auth/authMiddleware.js';

// DEPOIS
import { requireAuth } from './src/middlewares/adminAuth.js';
// Nota: optionalAuth não existe em adminAuth.js, precisa ser criado ou removido
```

#### **src/routes/auditRoutes.js**
```javascript
// ANTES
import { requireAuth } from '../functions/auth/authMiddleware.js';

// DEPOIS
import { requireAuth } from '../middlewares/adminAuth.js';
```

---

### 🔴 **AÇÃO 2: Criar optionalAuth em adminAuth.js**

**Motivo:** `server.js` usa `optionalAuth` (permite acesso sem autenticação).

**Implementação:**
```javascript
// Adicionar em src/middlewares/adminAuth.js

/**
 * Middleware: Autenticação opcional (não bloqueia se não autenticado)
 * Anexa usuário ao req se autenticado, senão continua sem usuário
 */
export async function optionalAuth(req, res, next) {
    try {
        const sessionCookie = req.cookies?.['sb-access-token'];
        
        if (!sessionCookie) {
            // Sem cookie, continua sem usuário
            req.user = null;
            return next();
        }

        // Tentar validar token
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(sessionCookie);
        
        if (error || !user) {
            // Token inválido, continua sem usuário
            req.user = null;
            return next();
        }

        // Token válido, anexa usuário
        req.user = user;
        next();
    } catch (error) {
        console.error('[Optional Auth] Erro ao validar token:', error);
        req.user = null;
        next();
    }
}
```

---

### 🔴 **AÇÃO 3: Verificar authUtils.js**

**Verificar se há funções úteis em `src/functions/auth/authUtils.js`:**

```bash
# Ver conteúdo do arquivo
cat src/functions/auth/authUtils.js
```

**Possíveis ações:**
- Se tem funções úteis → Mover para `src/utils/authUtils.js`
- Se não tem nada útil → Deletar junto com a pasta

---

### 🔴 **AÇÃO 4: Deletar src/functions/auth/**

**Após migrações:**

```bash
rm -rf src/functions/auth/
```

**Arquivos que serão deletados:**
- `authController.js` (obsoleto, substituído por src/routes/authRoutes.js)
- `authMiddleware.js` (obsoleto, substituído por src/middlewares/adminAuth.js)
- `authRoutes.js` (obsoleto, substituído por src/routes/authRoutes.js)
- `authUtils.js` (revisar antes, mover funções úteis se necessário)
- `README.md` (documentação antiga)

---

### 🟡 **AÇÃO 5: Verificar rateLimiter.js (antigo)**

```bash
# Verificar se está em uso
grep -r "from.*middlewares/rateLimiter.js" src/
```

**Se não estiver em uso:**
```bash
rm src/middlewares/rateLimiter.js
```

---

## 📊 IMPACTO DAS MUDANÇAS

### **Arquivos a modificar:**
- ✏️ `server.js` (trocar import)
- ✏️ `src/routes/auditRoutes.js` (trocar import)
- ✏️ `src/middlewares/adminAuth.js` (adicionar optionalAuth)

### **Arquivos a deletar:**
- 🗑️ `src/functions/auth/` (pasta inteira - 5 arquivos)
- 🗑️ `src/middlewares/rateLimiter.js` (se não usado)

### **Linhas de código removidas:**
- Aproximadamente **~500 linhas** de código obsoleto

### **Benefícios:**
1. ✅ **Menos confusão** - Apenas 1 sistema de autenticação
2. ✅ **Código mais limpo** - Sem duplicações
3. ✅ **Manutenção mais fácil** - Centralizado e padronizado
4. ✅ **Segurança melhor** - Todos usando adminAuth.js (mais robusto)

---

## ✅ CHECKLIST DE EXECUÇÃO

### Fase 1: Verificação
- [ ] Verificar conteúdo de `authUtils.js` (se tem algo útil)
- [ ] Verificar uso de `rateLimiter.js` (antigo)
- [ ] Confirmar que `adminAuth.js` tem todas as funções necessárias

### Fase 2: Criação
- [ ] Adicionar `optionalAuth` em `src/middlewares/adminAuth.js`

### Fase 3: Migração
- [ ] Modificar import em `server.js`
- [ ] Modificar import em `src/routes/auditRoutes.js`
- [ ] Testar autenticação (login, admin routes, audit routes)

### Fase 4: Limpeza
- [ ] Deletar `src/functions/auth/` (pasta inteira)
- [ ] Deletar `src/middlewares/rateLimiter.js` (se não usado)
- [ ] Commit: "refactor: Centralizar autenticação em adminAuth.js"

### Fase 5: Documentação
- [ ] Atualizar `AUDITORIA_COMPLETA_API.md`
- [ ] Marcar `functions/auth/` como REMOVIDO
- [ ] Atualizar estatísticas (menos 500 linhas)

---

## 🎯 RESULTADO ESPERADO

### **Antes:**
```
src/
├── functions/
│   ├── auth/                    # ⚠️ OBSOLETO (5 arquivos)
│   │   ├── authController.js
│   │   ├── authMiddleware.js    # <- requireAuth duplicado!
│   │   ├── authRoutes.js
│   │   ├── authUtils.js
│   │   └── README.md
│   └── ...
├── middlewares/
│   ├── adminAuth.js             # <- requireAuth NOVO!
│   ├── rateLimiter.js           # ⚠️ LEGADO
│   ├── rateLimiters.js          # ✅ NOVO
│   └── ...
└── routes/
    ├── authRoutes.js            # ✅ Sistema completo de auth
    └── ...
```

### **Depois:**
```
src/
├── functions/                   # 🎯 APENAS FERRAMENTAS
│   ├── health/
│   ├── points/
│   ├── tools/
│   ├── user/
│   └── _TEMPLATE/
├── middlewares/                 # 🛡️ AUTENTICAÇÃO UNIFICADA
│   ├── adminAuth.js             # ✅ requireAuth, requireAdmin, optionalAuth
│   ├── rateLimiters.js          # ✅ Rate limiting com auditoria
│   └── ...
└── routes/                      # 🌐 SISTEMA CENTRALIZADO
    ├── authRoutes.js            # ✅ Login, register, logout
    ├── auditRoutes.js           # ✅ Logs de auditoria
    └── ...
```

---

## 🏆 CONCLUSÃO

**Status:** 🔴 **CÓDIGO DUPLICADO ENCONTRADO**

**Problema:** Temos 2 sistemas de autenticação convivendo (antigo e novo).

**Solução:** Centralizar tudo em `src/middlewares/adminAuth.js` e deletar `src/functions/auth/`.

**Impacto:** Remoção de ~500 linhas de código obsoleto, redução de confusão, melhor manutenibilidade.

**Próximo passo:** Executar o plano de ação acima.

---

**Auditoria realizada por:** GitHub Copilot AI  
**Data:** 21 de outubro de 2025
