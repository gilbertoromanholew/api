# 🔧 Troubleshooting Rápido - CSRF Token

## ✅ Como Testar se CSRF Está Funcionando

### 1. Verificar Cookie Após Login

```javascript
// Abra DevTools (F12) → Console
// Após fazer login, execute:
console.log('Cookies:', document.cookie);

// Deve mostrar:
// csrf-token=abc123...; sb-access-token=xyz789...
```

### 2. Verificar Cookie no Application Tab

```
F12 → Application → Cookies → https://samm.host

Deve existir:
✅ Name: csrf-token
✅ Value: (64 caracteres hex)
✅ HttpOnly: false (❗ importante!)
✅ Secure: true (em produção)
✅ SameSite: Lax
✅ Domain: .samm.host
✅ Path: /
```

### 3. Verificar Header nas Requisições

```
F12 → Network → Selecionar requisição POST/PUT/DELETE → Headers

Request Headers deve conter:
✅ X-CSRF-Token: abc123... (mesmo valor do cookie)
```

---

## 🚨 Problemas Comuns

### Problema 1: Cookie Não É Criado

**Sintomas:**
```javascript
document.cookie
// Resultado: não contém 'csrf-token'
```

**Causas Possíveis:**
1. Backend não está chamando `setCsrfToken()`
2. `sameSite` muito restritivo
3. Domain incorreto
4. HTTPS não configurado em produção

**Solução:**
```javascript
// Backend: authRoutes.js
router.post('/login', async (req, res) => {
    // ... autenticação ...
    
    // ✅ Adicionar esta linha:
    setCsrfToken(req, res, data.session.expires_in * 1000);
    
    res.json({ success: true });
});

// csrfProtection.js
res.cookie('csrf-token', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // ← Não use 'strict'!
    domain: '.samm.host' // ← Em produção
});
```

**Verificar Logs do Backend:**
```bash
# Deve aparecer após login:
🔐 CSRF token gerado: { token: 'abc123...', expiresIn: '3600s', sameSite: 'lax', domain: '.samm.host' }
```

---

### Problema 2: Cookie Existe Mas Frontend Não Lê

**Sintomas:**
```javascript
document.cookie // Mostra csrf-token
getCsrfToken()  // Retorna null ❌
```

**Causas Possíveis:**
1. Cookie HttpOnly=true (não pode ser lido por JS)
2. Regex de leitura incorreta
3. Cookie de domínio diferente

**Solução:**
```javascript
// Verificar se cookie é legível:
console.log('Todos cookies:', document.cookie);

// Testar regex manualmente:
const match = document.cookie.match(/csrf-token=([^;]+)/);
console.log('Match:', match);
console.log('Token:', match ? match[1] : 'NÃO ENCONTRADO');

// Se match é null, verificar:
// 1. Cookie tem httpOnly=false? (deve ser false!)
// 2. Cookie tem nome exato 'csrf-token'?
// 3. Cookie está no domínio correto?
```

---

### Problema 3: Header Não É Enviado

**Sintomas:**
```
Network → Request Headers
X-CSRF-Token: (ausente) ❌
```

**Causas Possíveis:**
1. `getCsrfToken()` retorna null
2. Lógica de adicionar header com erro
3. CORS bloqueando header

**Solução:**
```javascript
// api.js
const csrfToken = getCsrfToken();
console.log('CSRF Token lido:', csrfToken); // Debug

if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
    console.log('Header adicionado!');
} else {
    console.error('Token não encontrado!');
}

// Verificar CORS no backend:
app.use(cors({
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-CSRF-Token' // ← Deve estar aqui!
    ]
}));
```

---

### Problema 4: 403 CSRF Token Inválido

**Sintomas:**
```
POST /auth/logout
403 Forbidden
{ error: "CSRF token inválido" }
```

**Causas Possíveis:**
1. Header diferente do cookie
2. Token expirado
3. Token mudou entre requisições

**Verificar:**
```javascript
// No DevTools Console:
const cookieToken = document.cookie.match(/csrf-token=([^;]+)/)[1];
console.log('Cookie:', cookieToken);

// No Network → Request Headers:
console.log('Header X-CSRF-Token:', headerToken);

// Devem ser IDÊNTICOS!
```

**Solução:**
```javascript
// Backend: csrfProtection.js
// Usar timing-safe comparison:
const tokensMatch = crypto.timingSafeEqual(
    Buffer.from(headerToken),
    Buffer.from(cookieToken)
);

// Logs para debug:
console.log('Validação CSRF:', {
    cookie: cookieToken.substring(0, 8),
    header: headerToken.substring(0, 8),
    match: tokensMatch
});
```

---

### Problema 5: Logout Não Funciona

**Sintomas:**
```javascript
await logout(); // Muda de rota mas não desloga
// Ao recarregar página → ainda está logado
```

**Causas Possíveis:**
1. CSRF token ausente (403)
2. Cookies não são limpos
3. Estado local não é limpo

**Solução Completa:**

**Backend:**
```javascript
router.post('/logout', async (req, res) => {
    try {
        // 1. Logout no Supabase
        await supabase.auth.signOut();
        
        // 2. Limpar cookies de sessão
        res.clearCookie('sb-access-token', { path: '/' });
        res.clearCookie('sb-refresh-token', { path: '/' });
        
        // 3. Limpar CSRF token
        clearCsrfToken(res);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

**Frontend:**
```javascript
async function logout() {
    try {
        // 1. Chamar API de logout (com CSRF token)
        await api.authApi.logout();
        
        // 2. Limpar estado local
        user.value = null;
        session.value = null;
        
        // 3. Redirecionar
        router.push('/login');
        
        return { success: true };
    } catch (error) {
        console.error('Erro no logout:', error);
        
        // Se erro CSRF, limpar local e redirecionar mesmo assim
        if (error.status === 403) {
            user.value = null;
            session.value = null;
            router.push('/login');
        }
        
        return { success: false, error };
    }
}
```

---

### Problema 6: Warnings em Endpoints Públicos

**Sintomas:**
```
⚠️ CSRF token não encontrado para: POST /auth/check-cpf
⚠️ CSRF token não encontrado para: POST /auth/login
```

**Causa:**
Frontend mostrando warning desnecessário para endpoints públicos.

**Solução:**
```javascript
// api.js - já corrigido em commit 0664c89
const publicEndpoints = [
    '/auth/login',
    '/auth/check-cpf',
    // ... outros
];

const isPublicEndpoint = publicEndpoints.some(pub => endpoint.includes(pub));

if (!csrfToken && !isPublicEndpoint) {
    console.warn('⚠️ CSRF token não encontrado');
}
```

---

## 🧪 Testes Manuais

### Teste 1: Login Gera Token

```bash
# 1. Limpar cookies
DevTools → Application → Cookies → Clear all

# 2. Fazer login
email: test@example.com
password: senha123

# 3. Verificar console do backend:
# Deve mostrar: 🔐 CSRF token gerado

# 4. Verificar DevTools → Application → Cookies
# Deve existir: csrf-token

# 5. Verificar console do frontend:
console.log(document.cookie)
# Deve conter: csrf-token=...
```

### Teste 2: Requisição Autenticada

```bash
# 1. Após login, tentar fazer logout
# DevTools → Network → Selecionar POST /auth/logout

# 2. Verificar Request Headers:
# Deve conter: X-CSRF-Token: abc123...

# 3. Verificar Response:
# 200 OK
# { success: true }

# 4. Verificar cookies foram limpos:
# csrf-token → (removido)
# sb-access-token → (removido)
```

### Teste 3: Endpoint Público (Sem CSRF)

```bash
# 1. Logout ou limpar cookies
# 2. Tentar verificar CPF

# Resultado esperado:
# ✅ Funciona normalmente
# ✅ Sem warning no console
# ✅ Backend não valida CSRF
```

---

## 📊 Checklist de Debug

Quando tiver problema com CSRF, seguir esta ordem:

- [ ] **1. Backend gera token?**
  - Logs: `🔐 CSRF token gerado`
  - Rota: `setCsrfToken()` está sendo chamado?

- [ ] **2. Cookie é criado?**
  - DevTools → Application → Cookies
  - Nome: `csrf-token`
  - HttpOnly: `false` (deve ser false!)

- [ ] **3. Frontend lê cookie?**
  - Console: `document.cookie` contém `csrf-token`
  - Console: `getCsrfToken()` retorna valor

- [ ] **4. Header é adicionado?**
  - Network → Request Headers
  - `X-CSRF-Token: abc123...`

- [ ] **5. Backend valida?**
  - Logs: `✅ CSRF token válido`
  - Response: 200 OK (não 403)

- [ ] **6. Cookies corretos?**
  - `sameSite: 'lax'` (não 'strict')
  - `domain: '.samm.host'` (com ponto)
  - `secure: true` (em produção)

---

## 🔗 Links Úteis

- **Documentação Completa**: `CSRF_PROTECTION_GUIDE.md`
- **Código Backend**: `dist-api/src/middlewares/csrfProtection.js`
- **Código Frontend**: `src/services/api.js`
- **OWASP**: https://owasp.org/www-community/attacks/csrf

---

## 🆘 Ainda Com Problema?

1. **Verificar logs do backend** (Docker logs ou console)
2. **Verificar logs do frontend** (DevTools Console)
3. **Verificar Network tab** (cookies, headers, response)
4. **Comparar com código neste guia**
5. **Verificar commits**:
   - `733bbda`: Fix sameSite e domain
   - `0664c89`: Fix warnings endpoints públicos

---

**Última atualização**: 21/10/2025  
**Versão**: 1.0
