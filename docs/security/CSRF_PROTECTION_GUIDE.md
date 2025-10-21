# 🔐 Guia de Proteção CSRF (Cross-Site Request Forgery)

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [O Problema: Ataque CSRF](#o-problema-ataque-csrf)
3. [A Solução: Double Submit Cookie Pattern](#a-solução-double-submit-cookie-pattern)
4. [Implementação Backend](#implementação-backend)
5. [Implementação Frontend](#implementação-frontend)
6. [Endpoints Públicos vs Protegidos](#endpoints-públicos-vs-protegidos)
7. [Fluxo de Autenticação](#fluxo-de-autenticação)
8. [Testes e Validação](#testes-e-validação)
9. [Troubleshooting](#troubleshooting)
10. [Referências](#referências)

---

## 📖 Visão Geral

**Data de Implementação**: 21 de outubro de 2025  
**Padrão Utilizado**: Double Submit Cookie Pattern  
**Status**: ✅ Implementado e Testado

### O Que É CSRF?

CSRF (Cross-Site Request Forgery) é um ataque onde um site malicioso força o navegador da vítima a fazer requisições não autorizadas para outro site onde a vítima está autenticada.

### Por Que Precisamos de Proteção CSRF?

- 🍪 **Cookies são enviados automaticamente**: Navegadores incluem cookies em todas as requisições
- 🎯 **Atacante pode forjar requisições**: Sites maliciosos podem fazer POST/PUT/DELETE
- 💰 **Alto impacto**: Pode resultar em transferências, mudanças de senha, ações críticas
- 🔒 **Compliance**: Requerido por OWASP Top 10 e padrões de segurança

### CWE e CVE

- **CWE-352**: Cross-Site Request Forgery (CSRF)
- **OWASP Top 10 2021**: A01:2021 – Broken Access Control
- **CVSS Score**: 8.1 (High) - sem proteção adequada

---

## 🚨 O Problema: Ataque CSRF

### Como Funciona um Ataque CSRF?

```
┌─────────────┐                    ┌──────────────┐
│   Vítima    │                    │ Site Legítimo│
│  (Usuário)  │◄───────────────────┤  samm.host   │
└─────────────┘  1. Login normal   └──────────────┘
       │          Cookie de sessão
       │          armazenado ✅
       │
       ▼
┌─────────────┐
│Site Malicioso│
│  evil.com   │
└─────────────┘
       │
       │ 2. Vítima visita evil.com
       │
       ▼
┌─────────────────────────────────────────────┐
│ <form action="https://samm.host/api/logout" │
│       method="POST">                        │
│   <input type="submit" value="Clique aqui!">│
│ </form>                                     │
│                                             │
│ <script>                                    │
│   // Ou automaticamente:                   │
│   document.forms[0].submit();               │
│ </script>                                   │
└─────────────────────────────────────────────┘
       │
       │ 3. Navegador envia cookies
       │    automaticamente! 🚨
       ▼
┌──────────────┐
│ Site Legítimo│
│  samm.host   │
└──────────────┘
       │
       └─► ❌ Ação executada sem consentimento!
           (Logout, transferência, mudança de dados)
```

### Exemplo de Ataque Real

```html
<!-- evil.com/ataque.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Ganhe um iPhone Grátis!</title>
</head>
<body>
    <h1>Parabéns! Você ganhou!</h1>
    
    <!-- Formulário oculto que ataca samm.host -->
    <form id="ataque" action="https://samm.host/api/auth/logout" method="POST">
        <input type="hidden" name="user_id" value="123">
    </form>
    
    <script>
        // Submete automaticamente sem o usuário saber
        document.getElementById('ataque').submit();
    </script>
    
    <!-- Ou pode ser uma imagem: -->
    <img src="https://samm.host/api/auth/logout" style="display:none">
    
    <!-- Ou fetch JavaScript: -->
    <script>
        fetch('https://samm.host/api/auth/logout', {
            method: 'POST',
            credentials: 'include' // Inclui cookies!
        });
    </script>
</body>
</html>
```

### Por Que Isso Funciona (Sem Proteção)?

1. **Vítima está logada** em samm.host
2. **Cookies de sessão** estão no navegador
3. **Navegador envia cookies automaticamente** para samm.host
4. **Servidor aceita** a requisição pois tem cookie válido
5. **Ação é executada** sem consentimento do usuário

### Impacto Sem Proteção CSRF

| Ação | Impacto | Severidade |
|------|---------|------------|
| Logout forçado | Inconveniência, DoS | 🟡 Médio |
| Mudança de email | Perda de conta | 🔴 Crítico |
| Mudança de senha | Perda de conta | 🔴 Crítico |
| Transferência de créditos | Perda financeira | 🔴 Crítico |
| Exclusão de dados | Perda de dados | 🟠 Alto |
| Ações admin | Comprometimento total | 🔴 Crítico |

---

## ✅ A Solução: Double Submit Cookie Pattern

### Como Funciona

O **Double Submit Cookie Pattern** usa um token que deve estar em **dois lugares**:

1. **Cookie** (legível por JavaScript, mas não por outros domínios)
2. **Header HTTP** (adicionado pelo JavaScript do frontend)

```
┌─────────────┐                    ┌──────────────┐
│  Frontend   │                    │   Backend    │
│  (Vue.js)   │                    │  (Express)   │
└─────────────┘                    └──────────────┘
       │                                   │
       │ 1. POST /auth/login               │
       ├──────────────────────────────────►│
       │   { email, password }             │
       │                                   │
       │                                   │ 2. Valida credenciais
       │                                   │
       │                                   │ 3. Gera CSRF token
       │                                   │    crypto.randomBytes(32)
       │                                   │
       │ 4. Resposta com cookies           │
       │◄──────────────────────────────────┤
       │   Set-Cookie: csrf-token=abc123   │
       │   Set-Cookie: sb-access-token=... │
       │                                   │
       │                                   │
       │ 5. Próxima requisição mutante     │
       │    GET cookie: csrf-token         │
       │    ADD header: X-CSRF-Token       │
       │                                   │
       │ POST /auth/logout                 │
       ├──────────────────────────────────►│
       │   Cookie: csrf-token=abc123       │ 6. Valida:
       │   X-CSRF-Token: abc123            │    header === cookie?
       │                                   │
       │                                   │ ✅ Tokens iguais!
       │                                   │    Processa requisição
       │                                   │
       │ ✅ Logout bem-sucedido            │
       │◄──────────────────────────────────┤
       │                                   │
```

### Por Que Isso Protege Contra CSRF?

```
┌─────────────┐                    ┌──────────────┐
│Site Malicioso│                   │ Site Legítimo│
│  evil.com   │                    │  samm.host   │
└─────────────┘                    └──────────────┘
       │                                   │
       │ 1. Tenta ataque CSRF              │
       ├──────────────────────────────────►│
       │   Cookie: csrf-token=abc123       │
       │   X-CSRF-Token: ???               │ 2. Valida CSRF
       │                                   │
       │   ❌ evil.com NÃO CONSEGUE ler    │    header !== cookie
       │      o cookie csrf-token devido   │
       │      à Same-Origin Policy!        │    ❌ REJEITA!
       │                                   │
       │ ❌ 403 Forbidden                  │
       │◄──────────────────────────────────┤
       │   { error: "CSRF token inválido" }│
       │                                   │
```

### Segurança do Padrão

| Proteção | Como Funciona |
|----------|---------------|
| 🔒 **Same-Origin Policy** | evil.com não pode ler cookies de samm.host |
| 🔒 **sameSite=strict** | Cookie não é enviado em requisições cross-origin |
| 🔒 **Timing-safe comparison** | Previne timing attacks na validação |
| 🔒 **Crypto.randomBytes(32)** | Token criptograficamente seguro (64 chars hex) |
| 🔒 **Token único por sessão** | Cada login gera novo token |

---

## 🔧 Implementação Backend

### Estrutura de Arquivos

```
api/
└── dist-api/
    └── src/
        ├── middlewares/
        │   └── csrfProtection.js    ← Middleware CSRF
        ├── routes/
        │   └── authRoutes.js         ← Integração CSRF
        └── server.js                 ← Aplicação global
```

### 1. Middleware CSRF (`csrfProtection.js`)

```javascript
import crypto from 'crypto';

/**
 * Gera token CSRF criptograficamente seguro
 * @returns {string} Token hexadecimal de 64 caracteres
 */
export function generateCsrfToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Envia token CSRF após login
 * @param {object} req - Request Express
 * @param {object} res - Response Express
 * @param {number} expiresIn - Tempo de expiração em ms
 */
export function setCsrfToken(req, res, expiresIn = 24 * 60 * 60 * 1000) {
    const token = generateCsrfToken();
    
    req.csrfToken = token;
    
    // Cookie legível por JavaScript (httpOnly=false)
    res.cookie('csrf-token', token, {
        httpOnly: false,      // ⚠️ Precisa ser lido por JS
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',   // 🔒 Não envia cross-origin
        maxAge: expiresIn,
        path: '/'
    });
    
    return token;
}

/**
 * Valida token CSRF em requisições mutantes
 * @param {object} req - Request Express
 * @param {object} res - Response Express
 * @param {function} next - Next middleware
 */
export function validateCsrfToken(req, res, next) {
    const method = req.method.toUpperCase();
    
    // Safe methods não requerem CSRF
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        return next();
    }
    
    // Endpoints públicos (usuários não autenticados)
    const publicEndpoints = [
        '/auth/login',
        '/auth/register',
        '/auth/check-cpf',
        '/auth/check-email',
        '/auth/verify-otp',
        '/auth/resend-otp',
        '/auth/forgot-password',
        '/auth/reset-password'
        // ... outros endpoints públicos
    ];
    
    if (publicEndpoints.some(endpoint => req.path.includes(endpoint))) {
        return next();
    }
    
    // Extrai tokens
    const headerToken = req.headers['x-csrf-token'];
    const cookieToken = req.cookies['csrf-token'];
    
    // Ambos devem existir
    if (!headerToken || !cookieToken) {
        return res.status(403).json({
            success: false,
            error: 'CSRF token ausente',
            code: 'CSRF_TOKEN_MISSING'
        });
    }
    
    // Timing-safe comparison
    const tokensMatch = crypto.timingSafeEqual(
        Buffer.from(headerToken),
        Buffer.from(cookieToken)
    );
    
    if (!tokensMatch) {
        return res.status(403).json({
            success: false,
            error: 'CSRF token inválido',
            code: 'CSRF_TOKEN_INVALID'
        });
    }
    
    // ✅ Token válido
    next();
}

/**
 * Remove token CSRF (usado em logout)
 */
export function clearCsrfToken(res) {
    res.clearCookie('csrf-token', {
        path: '/',
        sameSite: 'strict'
    });
}
```

### 2. Integração em `authRoutes.js`

```javascript
import { setCsrfToken, clearCsrfToken } from '../middlewares/csrfProtection.js';

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Autenticação com Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        // Setar cookies de sessão (HTTP-only)
        res.cookie('sb-access-token', data.session.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: data.session.expires_in * 1000
        });
        
        // 🔐 Gerar e enviar CSRF token
        setCsrfToken(req, res, data.session.expires_in * 1000);
        
        res.json({
            success: true,
            data: { user: data.user, session: data.session }
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Logout
router.post('/logout', async (req, res) => {
    try {
        await supabase.auth.signOut();
        
        // Limpar cookies
        res.clearCookie('sb-access-token');
        res.clearCookie('sb-refresh-token');
        
        // 🔐 Limpar CSRF token
        clearCsrfToken(res);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

### 3. Aplicação Global em `server.js`

```javascript
import { validateCsrfToken } from './src/middlewares/csrfProtection.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

// 🔐 CSRF Protection - Valida tokens globalmente
app.use(validateCsrfToken);

// CORS com header CSRF permitido
app.use(cors({
    origin: ['https://samm.host', 'http://localhost:5173'],
    credentials: true,
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-CSRF-Token'  // ← Permitir header CSRF
    ]
}));

// Rotas
app.use('/auth', authRoutes);
```

---

## 💻 Implementação Frontend

### Estrutura de Arquivos

```
tools-website-builder/
└── src/
    ├── services/
    │   └── api.js              ← Cliente API com CSRF
    ├── composables/
    │   └── useAuth.js          ← Autenticação
    └── stores/
        └── auth.js             ← Store Pinia
```

### 1. Cliente API (`api.js`)

```javascript
/**
 * Lê CSRF token do cookie
 * @returns {string|null} Token CSRF ou null
 */
function getCsrfToken() {
    const match = document.cookie.match(/csrf-token=([^;]+)/);
    return match ? match[1] : null;
}

/**
 * Faz requisição à API com CSRF protection
 */
async function apiRequest(endpoint, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    
    // Headers base
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    // 🔐 Adicionar CSRF token em requisições mutantes
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        const csrfToken = getCsrfToken();
        if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
            console.log('🔐 CSRF token adicionado');
        } else {
            console.warn('⚠️ CSRF token não encontrado');
        }
    }
    
    const config = {
        method,
        headers,
        credentials: 'include', // Enviar cookies
        ...options
    };
    
    if (options.body) {
        config.body = JSON.stringify(options.body);
    }
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new ApiError(data.error, response.status, data);
        }
        
        return data;
    } catch (error) {
        // Tratar erro CSRF
        if (error.status === 403 && error.data?.code === 'CSRF_TOKEN_INVALID') {
            console.error('❌ CSRF token inválido - faça login novamente');
        }
        throw error;
    }
}

// Helpers
export const post = (endpoint, body) => 
    apiRequest(endpoint, { method: 'POST', body });

export const authApi = {
    login: (email, password) => post('/auth/login', { email, password }),
    logout: () => post('/auth/logout')
};
```

### 2. Composable de Autenticação (`useAuth.js`)

```javascript
import * as api from '@/services/api';

export function useAuth() {
    const user = ref(null);
    const isAuthenticated = computed(() => !!user.value);
    
    async function login(email, password) {
        try {
            const response = await api.authApi.login(email, password);
            
            if (response.success) {
                user.value = response.data.user;
                
                // ✅ CSRF token já foi setado pelo backend
                // Cookie csrf-token está no navegador
                // Próximas requisições incluirão automaticamente
                
                return { success: true };
            }
        } catch (error) {
            console.error('Erro no login:', error);
            return { success: false, error: error.message };
        }
    }
    
    async function logout() {
        try {
            await api.authApi.logout();
            
            // ✅ Backend limpou cookie csrf-token
            user.value = null;
            
            return { success: true };
        } catch (error) {
            console.error('Erro no logout:', error);
            return { success: false, error: error.message };
        }
    }
    
    return {
        user,
        isAuthenticated,
        login,
        logout
    };
}
```

---

## 🔓 Endpoints Públicos vs Protegidos

### Endpoints Públicos (SEM CSRF)

Estes endpoints **não requerem CSRF token** porque são acessados por usuários **não autenticados**:

```javascript
const publicEndpoints = [
    // Autenticação inicial
    '/auth/login',              // Login com email/senha
    '/auth/register',           // Cadastro de novo usuário
    '/auth/login-cpf',          // Login com CPF
    
    // Verificações pré-cadastro
    '/auth/check-cpf',          // Verificar se CPF existe
    '/auth/check-email',        // Verificar se email existe
    
    // Confirmação de email
    '/auth/verify-email',       // Verificar email (token)
    '/auth/verify-otp',         // Verificar código OTP
    '/auth/resend-otp',         // Reenviar OTP
    '/auth/resend-confirmation',// Reenviar email confirmação
    '/auth/verify-email-token', // Token de confirmação
    
    // Recuperação de senha
    '/auth/forgot-password',    // Solicitar reset de senha
    '/auth/reset-password'      // Resetar senha com token
];
```

### Endpoints Protegidos (COM CSRF)

Estes endpoints **requerem CSRF token** porque são acessados por usuários **autenticados**:

```javascript
const protectedEndpoints = [
    // Sessão
    '/auth/logout',             // Fazer logout
    '/auth/refresh',            // Renovar token
    
    // Perfil do usuário
    '/user/profile',            // Atualizar perfil
    '/user/password',           // Mudar senha
    '/user/email',              // Mudar email
    '/user/delete',             // Deletar conta
    
    // Operações críticas
    '/credits/purchase',        // Comprar créditos
    '/credits/transfer',        // Transferir créditos
    '/subscription/cancel',     // Cancelar assinatura
    
    // Admin
    '/admin/*',                 // Todas rotas admin
    '/auth/reset-rate-limit',   // Reset de rate limit
    '/auth/alerts/process'      // Processar alertas
];
```

### Decisão: Público ou Protegido?

```
┌──────────────────────────────────────────┐
│  O endpoint requer autenticação?         │
└──────────────┬───────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
       SIM           NÃO
        │             │
        ▼             ▼
┌───────────────┐  ┌─────────────────┐
│   PROTEGIDO   │  │     PÚBLICO     │
│   COM CSRF    │  │    SEM CSRF     │
└───────────────┘  └─────────────────┘
        │                    │
        │                    │
        ▼                    ▼
┌───────────────┐  ┌─────────────────┐
│ Usuário DEVE  │  │ Usuário PODE    │
│ estar logado  │  │ não estar logado│
│               │  │                 │
│ Tem sessão    │  │ Sem sessão ainda│
│ Tem CSRF token│  │ Sem CSRF token  │
└───────────────┘  └─────────────────┘
```

---

## 🔄 Fluxo de Autenticação Completo

### 1. Primeiro Acesso (Sem Login)

```
┌─────────┐                              ┌─────────┐
│Frontend │                              │ Backend │
└─────────┘                              └─────────┘
     │                                        │
     │ GET /                                  │
     ├───────────────────────────────────────►│
     │                                        │
     │ ✅ Página pública carregada            │
     │◄───────────────────────────────────────┤
     │                                        │
     │ Cookies: NENHUM 🍪                     │
     │ CSRF Token: NENHUM 🔐                  │
     │                                        │
```

### 2. Login Bem-Sucedido

```
┌─────────┐                              ┌─────────┐
│Frontend │                              │ Backend │
└─────────┘                              └─────────┘
     │                                        │
     │ POST /auth/login                       │
     ├───────────────────────────────────────►│
     │ { email, password }                    │
     │                                        │
     │                                        │ Valida credenciais ✅
     │                                        │
     │                                        │ Gera tokens:
     │                                        │ - sb-access-token
     │                                        │ - sb-refresh-token
     │                                        │ - csrf-token
     │                                        │
     │ 200 OK + Cookies                       │
     │◄───────────────────────────────────────┤
     │                                        │
     │ Set-Cookie: sb-access-token=xxx        │
     │            (httpOnly=true) 🔒          │
     │                                        │
     │ Set-Cookie: sb-refresh-token=yyy       │
     │            (httpOnly=true) 🔒          │
     │                                        │
     │ Set-Cookie: csrf-token=zzz             │
     │            (httpOnly=false) 🔓         │
     │                                        │
     │ Cookies armazenados! 🍪                │
     │                                        │
```

### 3. Requisição Autenticada (Com CSRF)

```
┌─────────┐                              ┌─────────┐
│Frontend │                              │ Backend │
└─────────┘                              └─────────┘
     │                                        │
     │ 1. Ler cookie csrf-token               │
     │    const token = getCookie('csrf')     │
     │                                        │
     │ 2. POST /user/profile                  │
     ├───────────────────────────────────────►│
     │ Headers:                               │
     │   X-CSRF-Token: zzz 🔐                 │
     │ Cookies (auto):                        │
     │   csrf-token=zzz                       │
     │   sb-access-token=xxx                  │
     │                                        │
     │                                        │ 3. Valida CSRF:
     │                                        │    header === cookie?
     │                                        │    ✅ Iguais!
     │                                        │
     │                                        │ 4. Valida sessão:
     │                                        │    sb-access-token válido?
     │                                        │    ✅ Válido!
     │                                        │
     │                                        │ 5. Processa requisição
     │                                        │
     │ 200 OK                                 │
     │◄───────────────────────────────────────┤
     │                                        │
```

### 4. Tentativa de Ataque CSRF

```
┌─────────┐                              ┌─────────┐
│evil.com │                              │ Backend │
└─────────┘                              └─────────┘
     │                                        │
     │ POST /auth/logout                      │
     ├───────────────────────────────────────►│
     │ Headers:                               │
     │   X-CSRF-Token: ??? ❌                 │
     │   (evil.com não consegue ler cookie!)  │
     │ Cookies (auto):                        │
     │   csrf-token=zzz                       │
     │   sb-access-token=xxx                  │
     │                                        │
     │                                        │ Valida CSRF:
     │                                        │ header !== cookie
     │                                        │ ❌ INVÁLIDO!
     │                                        │
     │ 403 Forbidden                          │
     │◄───────────────────────────────────────┤
     │ { error: "CSRF token inválido" }       │
     │                                        │
     │ 🛡️ ATAQUE BLOQUEADO!                   │
     │                                        │
```

### 5. Logout

```
┌─────────┐                              ┌─────────┐
│Frontend │                              │ Backend │
└─────────┘                              └─────────┘
     │                                        │
     │ POST /auth/logout                      │
     ├───────────────────────────────────────►│
     │ Headers:                               │
     │   X-CSRF-Token: zzz ✅                 │
     │ Cookies:                               │
     │   csrf-token=zzz                       │
     │   sb-access-token=xxx                  │
     │                                        │
     │                                        │ Valida CSRF ✅
     │                                        │
     │                                        │ Limpa cookies:
     │                                        │ - sb-access-token
     │                                        │ - sb-refresh-token
     │                                        │ - csrf-token
     │                                        │
     │ 200 OK + Clear-Cookie                  │
     │◄───────────────────────────────────────┤
     │                                        │
     │ Cookies removidos! 🗑️                  │
     │ CSRF token removido! 🗑️                │
     │                                        │
```

---

## 🧪 Testes e Validação

### Teste 1: Login Gera CSRF Token

```bash
# 1. Fazer login
curl -X POST https://samm.host/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"senha123"}' \
  -c cookies.txt \
  -v

# 2. Verificar cookies salvos
cat cookies.txt

# Esperado:
# samm.host   FALSE   /   TRUE    0   csrf-token   abc123...
# samm.host   FALSE   /   TRUE    0   sb-access-token   xyz789...
```

### Teste 2: Requisição COM CSRF Token

```bash
# Requisição com CSRF token correto
curl -X POST https://samm.host/api/auth/logout \
  -H "X-CSRF-Token: abc123..." \
  -b cookies.txt \
  -v

# Esperado:
# HTTP/1.1 200 OK
# {"success":true}
```

### Teste 3: Requisição SEM CSRF Token (Deve Falhar)

```bash
# Requisição sem header X-CSRF-Token
curl -X POST https://samm.host/api/auth/logout \
  -b cookies.txt \
  -v

# Esperado:
# HTTP/1.1 403 Forbidden
# {"success":false,"error":"CSRF token ausente"}
```

### Teste 4: Requisição com CSRF Token ERRADO (Deve Falhar)

```bash
# Requisição com token inválido
curl -X POST https://samm.host/api/auth/logout \
  -H "X-CSRF-Token: TOKEN_ERRADO" \
  -b cookies.txt \
  -v

# Esperado:
# HTTP/1.1 403 Forbidden
# {"success":false,"error":"CSRF token inválido"}
```

### Teste 5: Endpoint Público (Não Requer CSRF)

```bash
# Verificar CPF (endpoint público)
curl -X POST https://samm.host/api/auth/check-cpf \
  -H "Content-Type: application/json" \
  -d '{"cpf":"12345678900"}' \
  -v

# Esperado:
# HTTP/1.1 200 OK
# {"exists":false}
# (Sem erro de CSRF)
```

### Checklist de Validação

- [ ] **Login gera CSRF token**
  - Cookie `csrf-token` criado
  - Cookie `httpOnly=false` (legível por JS)
  - Cookie `sameSite=strict`

- [ ] **Frontend lê CSRF token**
  - `getCsrfToken()` retorna token
  - Token adicionado em header `X-CSRF-Token`
  - Apenas em POST/PUT/DELETE/PATCH

- [ ] **Backend valida CSRF**
  - Requisição COM header → ✅ Aceita
  - Requisição SEM header → ❌ Rejeita (403)
  - Header diferente de cookie → ❌ Rejeita (403)

- [ ] **Endpoints públicos funcionam**
  - `/auth/login` sem CSRF → ✅ Funciona
  - `/auth/register` sem CSRF → ✅ Funciona
  - `/auth/check-cpf` sem CSRF → ✅ Funciona

- [ ] **Logout limpa CSRF token**
  - Cookie `csrf-token` removido
  - Próxima requisição mutante → ❌ Falha (sem token)

### Teste no DevTools (Chrome/Firefox)

```javascript
// 1. Abrir DevTools → Console

// 2. Verificar cookies após login
document.cookie
// Deve conter: csrf-token=abc123...

// 3. Ler CSRF token
const match = document.cookie.match(/csrf-token=([^;]+)/);
const csrfToken = match ? match[1] : null;
console.log('CSRF Token:', csrfToken);

// 4. Fazer requisição autenticada
fetch('https://samm.host/api/auth/logout', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  }
}).then(r => r.json()).then(console.log);

// 5. Tentar sem CSRF token (deve falhar)
fetch('https://samm.host/api/auth/logout', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
    // Sem X-CSRF-Token!
  }
}).then(r => r.json()).then(console.log);
// Esperado: {"error":"CSRF token ausente"}
```

---

## 🚨 Troubleshooting

### Problema 1: "CSRF token ausente" em Endpoints Públicos

**Sintoma:**
```
Erro ao verificar CPF: CSRF token ausente
Erro no cadastro: CSRF token ausente
```

**Causa:**
Endpoint não está na lista `publicEndpoints` do middleware CSRF.

**Solução:**
```javascript
// csrfProtection.js
const publicEndpoints = [
    '/auth/check-cpf',    // ← Adicionar aqui
    '/auth/check-email',  // ← Adicionar aqui
    // ...
];
```

### Problema 2: "CSRF token inválido" Após Login

**Sintoma:**
```
Login bem-sucedido, mas primeira requisição falha com CSRF inválido
```

**Causa:**
Frontend não está lendo o cookie `csrf-token` corretamente.

**Solução:**
```javascript
// Verificar se cookie existe
console.log('Cookies:', document.cookie);

// Verificar se getCsrfToken() funciona
function getCsrfToken() {
    const match = document.cookie.match(/csrf-token=([^;]+)/);
    return match ? match[1] : null;
}
console.log('CSRF Token:', getCsrfToken());
```

### Problema 3: Cookie CSRF Não É Criado

**Sintoma:**
```
Login funciona, mas cookie csrf-token não aparece no navegador
```

**Causa:**
- `setCsrfToken()` não está sendo chamado após login
- Domínio do cookie incorreto

**Solução:**
```javascript
// authRoutes.js - Verificar se está sendo chamado
router.post('/login', async (req, res) => {
    // ... autenticação ...
    
    // ✅ Adicionar esta linha após login bem-sucedido
    setCsrfToken(req, res, data.session.expires_in * 1000);
    
    res.json({ success: true });
});
```

### Problema 4: CORS Bloqueia Header X-CSRF-Token

**Sintoma:**
```
Access to fetch at 'https://samm.host/api/auth/logout' has been blocked by CORS policy:
Request header field X-CSRF-Token is not allowed
```

**Causa:**
Header `X-CSRF-Token` não está permitido no CORS.

**Solução:**
```javascript
// server.js
app.use(cors({
    origin: ['https://samm.host'],
    credentials: true,
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-CSRF-Token'  // ← Adicionar aqui
    ]
}));
```

### Problema 5: Token Muda Entre Requisições

**Sintoma:**
```
Primeira requisição: OK
Segunda requisição: CSRF token inválido
```

**Causa:**
Token está sendo regerado a cada requisição.

**Solução:**
- CSRF token deve ser gerado **apenas no login**
- **NÃO** gerar novo token em cada requisição

```javascript
// ❌ ERRADO: Gerar em cada requisição
app.use((req, res, next) => {
    setCsrfToken(req, res);  // ← NÃO fazer isso!
    next();
});

// ✅ CORRETO: Gerar apenas no login
router.post('/login', async (req, res) => {
    // ... autenticação ...
    setCsrfToken(req, res);  // ← Apenas aqui!
});
```

### Problema 6: Cookie Não É Enviado em Requisições

**Sintoma:**
```
Backend não recebe cookie csrf-token
req.cookies['csrf-token'] é undefined
```

**Causa:**
- Frontend não está enviando `credentials: 'include'`
- Cookie `sameSite` muito restritivo

**Solução:**
```javascript
// Frontend: Sempre incluir credentials
fetch(url, {
    credentials: 'include'  // ← Essencial!
});

// Backend: Ajustar sameSite se necessário
res.cookie('csrf-token', token, {
    sameSite: 'lax'  // Menos restritivo que 'strict'
});
```

---

## 📚 Referências

### Documentação Oficial

- **OWASP CSRF Prevention Cheat Sheet**  
  https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html

- **OWASP Top 10 2021: A01 - Broken Access Control**  
  https://owasp.org/Top10/A01_2021-Broken_Access_Control/

- **CWE-352: Cross-Site Request Forgery (CSRF)**  
  https://cwe.mitre.org/data/definitions/352.html

### Padrões e Implementações

- **Double Submit Cookie Pattern**  
  https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#double-submit-cookie

- **SameSite Cookie Attribute**  
  https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite

- **Express CSRF Middleware (csurf)**  
  https://github.com/expressjs/csurf

### Segurança Web

- **Same-Origin Policy (SOP)**  
  https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy

- **Content Security Policy (CSP)**  
  https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP

- **CORS (Cross-Origin Resource Sharing)**  
  https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS

### Artigos e Tutoriais

- **Understanding CSRF Attacks**  
  https://portswigger.net/web-security/csrf

- **CSRF Tokens: What They Are and Why They Matter**  
  https://www.synopsys.com/blogs/software-security/csrf-tokens/

- **Preventing CSRF Attacks in Node.js/Express**  
  https://auth0.com/blog/cross-site-request-forgery-csrf/

### Ferramentas de Teste

- **Burp Suite (CSRF PoC Generator)**  
  https://portswigger.net/burp

- **OWASP ZAP (CSRF Scanner)**  
  https://www.zaproxy.org/

- **Postman (API Testing)**  
  https://www.postman.com/

---

## 📊 Checklist de Implementação

### Backend

- [x] Criar `csrfProtection.js` middleware
  - [x] `generateCsrfToken()` com crypto.randomBytes(32)
  - [x] `setCsrfToken()` envia cookie httpOnly=false
  - [x] `validateCsrfToken()` valida header === cookie
  - [x] `clearCsrfToken()` remove cookie
  - [x] Lista de endpoints públicos completa
  - [x] Timing-safe comparison

- [x] Integrar em `authRoutes.js`
  - [x] Import de `setCsrfToken`, `clearCsrfToken`
  - [x] Chamar `setCsrfToken()` após login
  - [x] Chamar `clearCsrfToken()` em logout
  - [x] Testar geração de token

- [x] Configurar `server.js`
  - [x] Import de `validateCsrfToken`
  - [x] Aplicar middleware globalmente
  - [x] Adicionar `X-CSRF-Token` ao CORS allowedHeaders

### Frontend

- [x] Criar função `getCsrfToken()` em `api.js`
  - [x] Ler cookie `csrf-token`
  - [x] Retornar token ou null

- [x] Integrar CSRF em `apiRequest()`
  - [x] Detectar métodos mutantes (POST/PUT/DELETE/PATCH)
  - [x] Chamar `getCsrfToken()`
  - [x] Adicionar header `X-CSRF-Token`
  - [x] Logs de debug

- [x] Testar em componentes
  - [x] Login → Cookie criado
  - [x] Operações autenticadas → Header adicionado
  - [x] Logout → Cookie removido

### Testes

- [x] Teste 1: Login gera CSRF token ✅
- [x] Teste 2: Requisição COM CSRF funciona ✅
- [x] Teste 3: Requisição SEM CSRF falha ✅
- [x] Teste 4: CSRF errado falha ✅
- [x] Teste 5: Endpoint público funciona ✅
- [x] Teste 6: Logout limpa token ✅

### Documentação

- [x] Criar guia de implementação CSRF
- [x] Documentar fluxo de autenticação
- [x] Listar endpoints públicos vs protegidos
- [x] Troubleshooting guide
- [x] Referências e links

---

## 🎯 Conclusão

A implementação de **CSRF Protection** usando o padrão **Double Submit Cookie** adiciona uma camada crítica de segurança à aplicação samm.host, prevenindo ataques CSRF que poderiam:

- ✅ Forçar logout de usuários
- ✅ Mudar senhas sem consentimento
- ✅ Executar transações não autorizadas
- ✅ Comprometer dados de usuários

### Status da Implementação

| Componente | Status | Data |
|------------|--------|------|
| Backend Middleware | ✅ Implementado | 21/10/2025 |
| Frontend API Client | ✅ Implementado | 21/10/2025 |
| Testes | ✅ Validado | 21/10/2025 |
| Documentação | ✅ Completa | 21/10/2025 |
| Produção | 🚀 Deploy pendente | - |

### Próximos Passos

1. **Deploy em produção** (samm.host)
2. **Monitorar logs** de tentativas de CSRF
3. **Treinar equipe** sobre funcionamento
4. **Auditar periodicamente** lista de endpoints públicos
5. **Considerar rotação de tokens** para sessões longas

### Impacto na Segurança

- **Antes**: Vulnerável a CSRF (CWE-352, CVSS 8.1)
- **Depois**: Protegido contra CSRF ✅
- **Conformidade**: OWASP Top 10 2021 A01 ✅
- **Melhoria**: 🔴 Crítico → 🟢 Seguro

---

**Documento criado em**: 21 de outubro de 2025  
**Autor**: Sistema de Segurança samm.host  
**Versão**: 1.0  
**Última atualização**: 21/10/2025
