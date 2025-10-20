# 🔐 PLANO DE REFATORAÇÃO - SEGURANÇA DA API

**Data de Criação:** 20 de outubro de 2025  
**Objetivo:** Migrar de IP Filtering para Autenticação/Autorização adequada  
**Status:** 🟡 EM PLANEJAMENTO

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Fase 1: Reestruturação de Segurança](#fase-1-reestruturação-de-segurança)
3. [Fase 2: Rate Limiting e Validação](#fase-2-rate-limiting-e-validação)
4. [Fase 3: Auditoria e Monitoramento](#fase-3-auditoria-e-monitoramento)
5. [Fase 4: Otimizações Avançadas](#fase-4-otimizações-avançadas)
6. [Checklist de Execução](#checklist-de-execução)
7. [Testes de Validação](#testes-de-validação)

---

## 1. VISÃO GERAL

### 🎯 Objetivo Principal

Transformar a API de **"Segurança por IP"** para **"Segurança por Autenticação"**, permitindo:

- ✅ Acesso público às rotas de autenticação (register, login)
- ✅ Acesso autenticado às ferramentas (após login)
- ✅ Acesso administrativo restrito (via ZeroTier VPN)
- ✅ Proteção contra abuso (rate limiting)
- ✅ Auditoria completa de acessos

### 📊 Arquitetura Atual vs Nova

```
┌─────────────────────────────────────────────────────────────┐
│  ANTES (IP Filtering Global)                                │
├─────────────────────────────────────────────────────────────┤
│  Internet → Nginx → ipFilter (BLOQUEIA) → Rotas             │
│  ❌ Problema: Bloqueia usuários legítimos                   │
│  ❌ Problema: Falsa sensação de segurança                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  DEPOIS (Autenticação + Autorização)                        │
├─────────────────────────────────────────────────────────────┤
│  Internet → Nginx → Rate Limiting                           │
│           ↓                                                  │
│      Rotas Públicas (/auth/*, /docs)                        │
│           ↓                                                  │
│      requireAuth → Rotas Autenticadas (/api/*)             │
│           ↓                                                  │
│      ipFilter + requireAdmin → Rotas Admin (/logs, etc)    │
│                                                              │
│  ✅ Solução: Controle granular por rota                     │
│  ✅ Solução: Segurança real (JWT + RLS)                     │
└─────────────────────────────────────────────────────────────┘
```

### 🔑 Princípios de Segurança

1. **Defesa em Profundidade** (Multiple Layers)
   - Camada 1: Rate Limiting (prevenir abuso)
   - Camada 2: Autenticação (quem é você?)
   - Camada 3: Autorização (o que você pode fazer?)
   - Camada 4: Validação (dados corretos?)
   - Camada 5: Auditoria (o que foi feito?)

2. **Princípio do Menor Privilégio**
   - Usuário anônimo: Apenas register/login
   - Usuário autenticado: Suas próprias ferramentas
   - Admin: Acesso total (via VPN)

3. **Segurança por Design**
   - Rotas públicas explícitas
   - Rotas protegidas por padrão
   - RLS no banco (cada user vê só seus dados)

---

## 2. FASE 1: REESTRUTURAÇÃO DE SEGURANÇA

**Status:** 🔴 NÃO INICIADO  
**Duração Estimada:** 2-3 horas  
**Prioridade:** CRÍTICA

### 📝 Objetivos

1. Remover ipFilter de rotas públicas
2. Manter ipFilter apenas em rotas administrativas
3. Adicionar requireAuth em rotas autenticadas
4. Testar fluxo completo (register → login → usar ferramentas)

### 🔧 Mudanças no Código

#### 1.1. Modificar `server.js`

**Arquivo:** `api/dist-api/server.js`

**Mudança:**
```javascript
// ❌ REMOVER (linha 71)
app.use(ipFilter);

// ✅ ADICIONAR (estrutura nova)

// ===== ROTAS PÚBLICAS (sem restrições) =====
app.get('/health', healthCheck);
app.get('/', getApiInfo);
app.get('/docs', getApiDocs);

// Rotas de autenticação (públicas)
app.use('/auth', authRoutes);

// Proxy Supabase (público, mas rate limited)
app.use('/supabase', supabaseProxyCors, supabaseProxy);

// ===== ROTAS AUTENTICADAS (requireAuth) =====
// Ferramentas e cálculos (precisa estar logado)
app.use('/api', requireAuth, autoLoadRoutes);

// ===== ROTAS ADMINISTRATIVAS (ipFilter + requireAdmin) =====
// Apenas via ZeroTier VPN (10.244.0.0/16)
app.use('/logs', ipFilter, requireAdmin, logsRoutes);
app.use('/zerotier', ipFilter, requireAdmin, zerotierRoutes);
app.use('/security', ipFilter, requireAdmin, securityRoutes);

// Handlers de erro (por último)
app.use(notFoundHandler);
app.use(errorHandler);
```

**Justificativa:**
- Permite usuários públicos registrarem e logarem
- Protege ferramentas (apenas autenticados)
- Mantém admin protegido por VPN

#### 1.2. Atualizar `requireAuth` Middleware

**Arquivo:** `api/dist-api/src/middlewares/adminAuth.js`

**Verificar se está correto:**
```javascript
export async function requireAuth(req, res, next) {
    try {
        // Pegar token do cookie (já está implementado)
        const sessionCookie = req.cookies?.['sb-access-token'];
        
        if (!sessionCookie) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated',
                message: 'You need to be logged in to access this resource.',
                code: 'AUTH_REQUIRED'
            });
        }

        // Validar com Supabase
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(sessionCookie);
        
        if (error || !user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid session',
                message: 'Your session has expired. Please login again.',
                code: 'SESSION_EXPIRED'
            });
        }

        // Adicionar usuário ao request
        req.user = user;
        req.userId = user.id;
        
        next();
    } catch (error) {
        console.error('[Auth Middleware] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication error',
            message: error.message
        });
    }
}
```

#### 1.3. Atualizar Rotas de Functions

**Verificar arquivos em:** `api/dist-api/src/functions/*/`

**Cada rota de function deve:**
```javascript
// Exemplo: exemploRoutes.js
import { Router } from 'express';
import { requireAuth } from '../../middlewares/adminAuth.js';

const router = Router();

// ✅ Proteger com requireAuth
router.post('/exemplo', requireAuth, async (req, res) => {
    // req.user já está disponível (validado pelo middleware)
    // req.userId contém o ID do usuário
    
    try {
        // Processar apenas dados do usuário logado
        const result = await processExample(req.userId, req.body);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
```

#### 1.4. Atualizar `.env.coolify`

**Arquivo:** `api/.env.coolify`

**Mudança:**
```bash
# ANTES
ALLOWED_IPS=177.73.207.121

# DEPOIS (opcional, para manter apenas admin via VPN)
ALLOWED_IPS=10.244.0.0/16

# OU (se quiser manter servidor também)
ALLOWED_IPS=10.244.0.0/16,177.73.207.121
```

**Nota:** Como o ipFilter agora é apenas para rotas admin, pode deixar só ZeroTier.

### ✅ Checklist Fase 1

- [ ] Backup do código atual (git commit)
- [ ] Modificar `server.js` (remover ipFilter global)
- [ ] Adicionar estrutura de rotas (públicas/autenticadas/admin)
- [ ] Verificar `requireAuth` middleware
- [ ] Atualizar rotas de functions (adicionar requireAuth)
- [ ] Atualizar `.env.coolify` (opcional)
- [ ] Testar localmente:
  - [ ] `GET /health` → ✅ 200 OK (sem auth)
  - [ ] `GET /docs` → ✅ 200 OK (sem auth)
  - [ ] `POST /auth/register` → ✅ 200 OK (criar conta)
  - [ ] `POST /auth/login` → ✅ 200 OK (fazer login)
  - [ ] `GET /api/exemplo` sem auth → ❌ 401 Unauthorized
  - [ ] `GET /api/exemplo` com auth → ✅ 200 OK
  - [ ] `GET /logs` sem VPN → ❌ 403 Forbidden
  - [ ] `GET /logs` com VPN → ✅ 200 OK
- [ ] Commit e push
- [ ] Deploy em produção
- [ ] Testar em produção (mesmo fluxo)

### 📊 Resultado Esperado

**Antes:**
```
❌ Usuário não consegue registrar (IP bloqueado)
❌ Usuário não consegue logar (IP bloqueado)
❌ Apenas servidor (177.73.207.121) acessa
```

**Depois:**
```
✅ Qualquer usuário pode registrar
✅ Qualquer usuário pode logar
✅ Apenas autenticados usam ferramentas
✅ Apenas admin via VPN acessa logs
```

---

## 3. FASE 2: RATE LIMITING E VALIDAÇÃO

**Status:** 🔴 NÃO INICIADO  
**Duração Estimada:** 3-4 horas  
**Prioridade:** ALTA

### 📝 Objetivos

1. Implementar rate limiting por rota
2. Adicionar validação de input (Joi/Zod)
3. Sanitizar dados de entrada
4. Prevenir abuso e ataques

### 🔧 Mudanças no Código

#### 2.1. Instalar Dependências

```bash
npm install express-rate-limit joi
```

#### 2.2. Criar Rate Limiters

**Novo arquivo:** `api/dist-api/src/middlewares/rateLimiters.js`

```javascript
import rateLimit from 'express-rate-limit';

// Rate limiter para autenticação (mais restritivo)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 tentativas
    message: {
        success: false,
        error: 'Too many authentication attempts',
        message: 'Please try again in 15 minutes',
        retryAfter: 15 * 60 // segundos
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    // Usar IP + User-Agent para evitar bloqueio de proxies
    keyGenerator: (req) => {
        return `${req.ip}-${req.headers['user-agent']}`;
    }
});

// Rate limiter para API geral (moderado)
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requisições
    message: {
        success: false,
        error: 'Too many requests',
        message: 'Please slow down and try again later',
        retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Rate limit por usuário (se autenticado) OU IP
    keyGenerator: (req) => {
        return req.userId || req.ip;
    }
});

// Rate limiter para Supabase proxy (restritivo)
export const supabaseLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 10, // 10 requisições
    message: {
        success: false,
        error: 'Too many Supabase requests',
        message: 'Please wait a moment before trying again',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter para registro (muito restritivo)
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // 3 registros
    message: {
        success: false,
        error: 'Too many registration attempts',
        message: 'Please try again in 1 hour',
        retryAfter: 60 * 60
    },
    standardHeaders: true,
    legacyHeaders: false
});
```

#### 2.3. Aplicar Rate Limiters no `server.js`

```javascript
import { 
    authLimiter, 
    apiLimiter, 
    supabaseLimiter, 
    registerLimiter 
} from './src/middlewares/rateLimiters.js';

// ===== ROTAS PÚBLICAS =====
app.get('/health', healthCheck);
app.get('/', getApiInfo);
app.get('/docs', getApiDocs);

// Autenticação com rate limiting
app.post('/auth/register', registerLimiter, authRoutes);
app.post('/auth/login', authLimiter, authRoutes);
app.use('/auth', authLimiter, authRoutes); // Outras rotas de auth

// Supabase proxy com rate limiting
app.use('/supabase', supabaseLimiter, supabaseProxyCors, supabaseProxy);

// ===== ROTAS AUTENTICADAS =====
app.use('/api', requireAuth, apiLimiter, autoLoadRoutes);

// ===== ROTAS ADMINISTRATIVAS =====
// Admin não precisa rate limiting (acesso restrito por VPN)
app.use('/logs', ipFilter, requireAdmin, logsRoutes);
app.use('/zerotier', ipFilter, requireAdmin, zerotierRoutes);
app.use('/security', ipFilter, requireAdmin, securityRoutes);
```

#### 2.4. Criar Schemas de Validação

**Novo arquivo:** `api/dist-api/src/validators/schemas.js`

```javascript
import Joi from 'joi';

// Schema para registro
export const registerSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Email inválido',
            'any.required': 'Email é obrigatório'
        }),
    
    password: Joi.string()
        .min(6)
        .max(72)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
            'string.min': 'Senha deve ter no mínimo 6 caracteres',
            'string.max': 'Senha deve ter no máximo 72 caracteres',
            'string.pattern.base': 'Senha deve conter: maiúscula, minúscula, número e símbolo',
            'any.required': 'Senha é obrigatória'
        }),
    
    full_name: Joi.string()
        .min(3)
        .max(100)
        .required()
        .messages({
            'string.min': 'Nome deve ter no mínimo 3 caracteres',
            'string.max': 'Nome deve ter no máximo 100 caracteres',
            'any.required': 'Nome completo é obrigatório'
        }),
    
    cpf: Joi.string()
        .length(11)
        .pattern(/^\d{11}$/)
        .required()
        .messages({
            'string.length': 'CPF deve ter 11 dígitos',
            'string.pattern.base': 'CPF deve conter apenas números',
            'any.required': 'CPF é obrigatório'
        })
});

// Schema para login
export const loginSchema = Joi.object({
    email: Joi.string()
        .email()
        .required(),
    
    password: Joi.string()
        .required()
});

// Schema para cálculo de exemplo
export const calculationSchema = Joi.object({
    type: Joi.string()
        .valid('salary', 'tax', 'mortgage', 'investment')
        .required(),
    
    value: Joi.number()
        .min(0)
        .max(1000000000)
        .required(),
    
    parameters: Joi.object()
        .optional()
});

// Middleware de validação
export function validate(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false, // Retornar todos os erros
            stripUnknown: true // Remover campos não definidos no schema
        });
        
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                errors: errors
            });
        }
        
        // Substituir req.body pelos dados validados e sanitizados
        req.body = value;
        next();
    };
}
```

#### 2.5. Aplicar Validação nas Rotas

**Exemplo em `authRoutes.js`:**

```javascript
import { validate, registerSchema, loginSchema } from '../validators/schemas.js';

// Registro com validação
router.post('/register', validate(registerSchema), async (req, res) => {
    // req.body já foi validado e sanitizado
    const { email, password, full_name, cpf } = req.body;
    
    // Processar registro...
});

// Login com validação
router.post('/login', validate(loginSchema), async (req, res) => {
    // req.body já foi validado
    const { email, password } = req.body;
    
    // Processar login...
});
```

### ✅ Checklist Fase 2

- [ ] Instalar dependências (`express-rate-limit`, `joi`)
- [ ] Criar `rateLimiters.js` com limiters específicos
- [ ] Aplicar rate limiters no `server.js`
- [ ] Criar `schemas.js` com validações
- [ ] Aplicar validações em rotas de autenticação
- [ ] Aplicar validações em rotas de API
- [ ] Testar rate limiting:
  - [ ] Fazer 6 tentativas de login → ❌ Bloqueado na 6ª
  - [ ] Esperar 15 min → ✅ Desbloqueado
  - [ ] Fazer 101 requests API → ❌ Bloqueado na 101ª
- [ ] Testar validação:
  - [ ] Enviar email inválido → ❌ 400 Bad Request
  - [ ] Enviar senha fraca → ❌ 400 Bad Request
  - [ ] Enviar dados corretos → ✅ 200 OK
- [ ] Commit e push
- [ ] Deploy em produção
- [ ] Testar em produção

### 📊 Resultado Esperado

**Proteção contra:**
- ✅ Brute force (login)
- ✅ Spamming (registro)
- ✅ DDoS (API geral)
- ✅ SQL Injection (validação)
- ✅ XSS (sanitização)

---

## 4. FASE 3: AUDITORIA E MONITORAMENTO

**Status:** 🔴 NÃO INICIADO  
**Duração Estimada:** 2-3 horas  
**Prioridade:** MÉDIA

### 📝 Objetivos

1. Registrar TODAS as operações sensíveis
2. Criar tabelas de auditoria no Supabase
3. Implementar logging estruturado
4. Dashboard de auditoria (admin)

### 🔧 Mudanças no Código

#### 3.1. Criar Tabelas de Auditoria

**SQL Migration:** `003_audit_tables.sql`

```sql
-- Tabela de auditoria de autenticação
CREATE TABLE IF NOT EXISTS auth_audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'login', 'logout', 'register', 'failed_login'
    ip_address VARCHAR(45),
    user_agent TEXT,
    country VARCHAR(100),
    city VARCHAR(100),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_auth_audit_user_id ON auth_audit_log(user_id);
CREATE INDEX idx_auth_audit_created_at ON auth_audit_log(created_at);
CREATE INDEX idx_auth_audit_action ON auth_audit_log(action);

-- Tabela de auditoria de operações
CREATE TABLE IF NOT EXISTS operations_audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    operation VARCHAR(100) NOT NULL, -- 'calculation', 'data_export', etc
    resource VARCHAR(255), -- 'salary_calculator', 'tax_calculator', etc
    details JSONB, -- Detalhes da operação
    ip_address VARCHAR(45),
    user_agent TEXT,
    execution_time_ms INTEGER, -- Tempo de execução
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_ops_audit_user_id ON operations_audit_log(user_id);
CREATE INDEX idx_ops_audit_created_at ON operations_audit_log(created_at);
CREATE INDEX idx_ops_audit_operation ON operations_audit_log(operation);

-- RLS (Row Level Security)
ALTER TABLE auth_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins podem ver tudo
CREATE POLICY "Admins can see all audit logs"
ON auth_audit_log
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

CREATE POLICY "Admins can see all operations"
ON operations_audit_log
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- Usuários podem ver apenas seus próprios logs
CREATE POLICY "Users can see their own auth logs"
ON auth_audit_log
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can see their own operations"
ON operations_audit_log
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Sistema pode inserir logs
CREATE POLICY "System can insert auth logs"
ON auth_audit_log
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "System can insert operation logs"
ON operations_audit_log
FOR INSERT
TO service_role
WITH CHECK (true);
```

#### 3.2. Criar Serviço de Auditoria

**Novo arquivo:** `api/dist-api/src/services/auditService.js`

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Registrar evento de autenticação
 */
export async function logAuthEvent(data) {
    try {
        const { error } = await supabase
            .from('auth_audit_log')
            .insert({
                user_id: data.userId || null,
                action: data.action,
                ip_address: data.ip,
                user_agent: data.userAgent,
                country: data.country || null,
                city: data.city || null,
                success: data.success !== false,
                error_message: data.error || null
            });
        
        if (error) {
            console.error('[Audit] Error logging auth event:', error);
        }
    } catch (error) {
        console.error('[Audit] Exception logging auth event:', error);
    }
}

/**
 * Registrar operação de usuário
 */
export async function logOperation(data) {
    try {
        const { error } = await supabase
            .from('operations_audit_log')
            .insert({
                user_id: data.userId,
                operation: data.operation,
                resource: data.resource || null,
                details: data.details || null,
                ip_address: data.ip,
                user_agent: data.userAgent,
                execution_time_ms: data.executionTime || null,
                success: data.success !== false,
                error_message: data.error || null
            });
        
        if (error) {
            console.error('[Audit] Error logging operation:', error);
        }
    } catch (error) {
        console.error('[Audit] Exception logging operation:', error);
    }
}

/**
 * Middleware de auditoria automática
 */
export function auditMiddleware(operation, resource) {
    return async (req, res, next) => {
        const startTime = Date.now();
        
        // Interceptar res.json para capturar resultado
        const originalJson = res.json.bind(res);
        
        res.json = function(body) {
            const executionTime = Date.now() - startTime;
            
            // Registrar operação (async, não bloqueia resposta)
            logOperation({
                userId: req.userId || req.user?.id,
                operation: operation,
                resource: resource,
                details: {
                    method: req.method,
                    path: req.path,
                    query: req.query,
                    // Não registrar body inteiro (pode ter dados sensíveis)
                },
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                executionTime: executionTime,
                success: body.success !== false,
                error: body.error || null
            }).catch(err => console.error('[Audit] Failed to log:', err));
            
            return originalJson(body);
        };
        
        next();
    };
}
```

#### 3.3. Aplicar Auditoria nas Rotas

**Exemplo em `authRoutes.js`:**

```javascript
import { logAuthEvent } from '../services/auditService.js';

// Login com auditoria
router.post('/login', validate(loginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Tentar fazer login
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            // Registrar falha
            await logAuthEvent({
                action: 'failed_login',
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                success: false,
                error: error.message
            });
            
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
        
        // Registrar sucesso
        await logAuthEvent({
            userId: data.user.id,
            action: 'login',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            success: true
        });
        
        // Setar cookies e responder...
        res.json({ success: true, user: data.user });
        
    } catch (error) {
        // ...
    }
});
```

**Exemplo em rotas de API:**

```javascript
import { auditMiddleware } from '../services/auditService.js';

// Aplicar auditoria automaticamente
router.post(
    '/calculate',
    requireAuth,
    auditMiddleware('calculation', 'salary_calculator'),
    async (req, res) => {
        // Processar cálculo...
        // Auditoria é registrada automaticamente ao responder
    }
);
```

### ✅ Checklist Fase 3

- [ ] Criar migration `003_audit_tables.sql`
- [ ] Executar migration no Supabase
- [ ] Criar `auditService.js`
- [ ] Aplicar auditoria em rotas de auth
- [ ] Aplicar auditoria em rotas de API
- [ ] Criar endpoint admin para visualizar logs
- [ ] Testar auditoria:
  - [ ] Fazer login → ✅ Registrado em auth_audit_log
  - [ ] Fazer cálculo → ✅ Registrado em operations_audit_log
  - [ ] Falhar login → ✅ Registrado com success=false
- [ ] Criar queries de relatório (admin)
- [ ] Commit e push
- [ ] Deploy em produção

### 📊 Resultado Esperado

**Visibilidade completa:**
- ✅ Quem logou e quando
- ✅ De onde (IP, país, cidade)
- ✅ O que foi feito (operações)
- ✅ Quanto tempo levou
- ✅ Se teve sucesso ou erro

---

## 5. FASE 4: OTIMIZAÇÕES AVANÇADAS

**Status:** 🔴 NÃO INICIADO  
**Duração Estimada:** 4-6 horas  
**Prioridade:** BAIXA (opcional)

### 📝 Objetivos

1. Migrar IP Blocking para PostgreSQL (persistente)
2. Implementar cache (Redis)
3. Otimizar queries
4. Adicionar métricas (Prometheus/Grafana)

### 🔧 Mudanças no Código

*Detalhamento será feito quando chegar nesta fase*

### ✅ Checklist Fase 4

- [ ] A definir

---

## 6. CHECKLIST DE EXECUÇÃO

### 🎯 Fase 1 - Reestruturação (CRÍTICA)

**Estimativa:** 2-3 horas

- [ ] **Preparação**
  - [ ] Backup do código (`git commit`)
  - [ ] Criar branch `refactor/security-restructure`
  - [ ] Ler documentação completa desta fase

- [ ] **Implementação**
  - [ ] Modificar `server.js` (estrutura de rotas)
  - [ ] Verificar `requireAuth` middleware
  - [ ] Atualizar rotas de functions
  - [ ] Atualizar `.env.coolify` (opcional)

- [ ] **Testes Locais**
  - [ ] Rotas públicas (sem auth)
  - [ ] Rotas autenticadas (com auth)
  - [ ] Rotas admin (com VPN)

- [ ] **Deploy**
  - [ ] Merge para main
  - [ ] Push para repositório
  - [ ] Deploy no Coolify
  - [ ] Testes em produção

### 🎯 Fase 2 - Rate Limiting (ALTA)

**Estimativa:** 3-4 horas

- [ ] **Preparação**
  - [ ] Criar branch `feature/rate-limiting`
  - [ ] Instalar dependências

- [ ] **Implementação**
  - [ ] Criar rate limiters
  - [ ] Criar validators
  - [ ] Aplicar em rotas

- [ ] **Testes**
  - [ ] Testar limitações
  - [ ] Testar validações

- [ ] **Deploy**
  - [ ] Merge e deploy

### 🎯 Fase 3 - Auditoria (MÉDIA)

**Estimativa:** 2-3 horas

- [ ] **Preparação**
  - [ ] Criar branch `feature/audit-logging`
  - [ ] Criar migration SQL

- [ ] **Implementação**
  - [ ] Executar migration
  - [ ] Criar audit service
  - [ ] Aplicar em rotas

- [ ] **Testes**
  - [ ] Verificar logs no banco

- [ ] **Deploy**
  - [ ] Merge e deploy

### 🎯 Fase 4 - Otimizações (BAIXA - opcional)

**Estimativa:** 4-6 horas

- [ ] A definir quando chegar aqui

---

## 7. TESTES DE VALIDAÇÃO

### 🧪 Testes por Fase

#### Fase 1: Segurança Básica

```bash
# 1. Testar rota pública (sem auth)
curl https://samm.host/api/docs
# Esperado: 200 OK

# 2. Testar registro (sem auth)
curl -X POST https://samm.host/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123","full_name":"Test User","cpf":"12345678901"}'
# Esperado: 200 OK

# 3. Testar login (sem auth)
curl -X POST https://samm.host/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123"}'
# Esperado: 200 OK + cookies

# 4. Testar rota protegida SEM auth
curl https://samm.host/api/exemplo
# Esperado: 401 Unauthorized

# 5. Testar rota protegida COM auth
curl https://samm.host/api/exemplo \
  -H "Cookie: sb-access-token=<token>"
# Esperado: 200 OK

# 6. Testar rota admin SEM VPN
curl https://samm.host/api/logs
# Esperado: 403 Forbidden

# 7. Testar rota admin COM VPN (via ZeroTier)
curl http://10.244.x.x:3000/logs
# Esperado: 200 OK
```

#### Fase 2: Rate Limiting

```bash
# 1. Testar rate limit de login (fazer 6 tentativas)
for i in {1..6}; do
  curl -X POST https://samm.host/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done
# Esperado: 6ª tentativa retorna 429 Too Many Requests

# 2. Testar validação de email inválido
curl -X POST https://samm.host/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email","password":"Test@123"}'
# Esperado: 400 Bad Request + mensagem de erro
```

#### Fase 3: Auditoria

```sql
-- 1. Verificar logs de autenticação
SELECT * FROM auth_audit_log 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Verificar logs de operações
SELECT * FROM operations_audit_log 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Ver tentativas de login falhadas
SELECT * FROM auth_audit_log 
WHERE action = 'failed_login' 
AND created_at > NOW() - INTERVAL '1 hour';
```

---

## 📝 NOTAS IMPORTANTES

### ⚠️ Cuidados

1. **Sempre fazer backup antes de mudanças críticas**
2. **Testar localmente ANTES de deploy**
3. **Fazer deploy fora do horário de pico**
4. **Monitorar logs após deploy**
5. **Ter plano de rollback pronto**

### 🔄 Rollback Plan

Se algo der errado:

```bash
# 1. Voltar para commit anterior
git reset --hard <commit-hash>

# 2. Fazer deploy da versão antiga
git push -f origin main

# 3. No Coolify, fazer redeploy

# 4. Verificar se voltou ao normal
```

### 📞 Contatos de Emergência

- Suporte Coolify: [documentação]
- Suporte Supabase: [documentação]
- Logs do servidor: `ssh root@69.62.97.115`

---

## ✅ STATUS GERAL

| Fase | Status | Progresso | Duração | Prioridade |
|------|--------|-----------|---------|------------|
| Fase 1: Reestruturação | 🔴 Não Iniciado | 0% | 2-3h | CRÍTICA |
| Fase 2: Rate Limiting | 🔴 Não Iniciado | 0% | 3-4h | ALTA |
| Fase 3: Auditoria | 🔴 Não Iniciado | 0% | 2-3h | MÉDIA |
| Fase 4: Otimizações | 🔴 Não Iniciado | 0% | 4-6h | BAIXA |

**Progresso Total:** 0% (0/4 fases)

---

**PRÓXIMO PASSO:** Iniciar Fase 1 - Reestruturação de Segurança

Execute: `Quero começar a Fase 1`

---

*Documento criado em: 20 de outubro de 2025*  
*Última atualização: 20 de outubro de 2025*  
*Versão: 1.0*
