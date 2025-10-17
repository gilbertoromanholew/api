# 🔒 Sistema de Níveis de Acesso - Proposta v2.3.0

## 📊 Hierarquia de Permissões

```
┌─────────────────────────────────────────────────────┐
│  NÍVEL 1: ADMIN (IPs Permanentes)                  │
│  ✅ Acesso Total: /logs, /api/security/*, /docs    │
│  📍 IPs: 127.0.0.1, ::1, 10.244.0.0/16 (ZeroTier)  │
└─────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────┐
│  NÍVEL 2: TRUSTED (IPs do .env)                    │
│  ✅ Acesso: /docs, /api/* (exceto segurança)       │
│  ❌ Bloqueado: /logs, /api/security/*              │
│  📍 IPs: process.env.ALLOWED_IPS                    │
└─────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────┐
│  NÍVEL 3: GUEST (Autorizados via /logs)            │
│  ✅ Acesso APENAS: /docs, /api/public/*            │
│  ❌ Bloqueado: /logs, /api/security/*, rotas admin │
│  📍 IPs: Autorizados temporariamente                │
└─────────────────────────────────────────────────────┘
```

---

## 🛡️ Regras de Segurança

### **1. IPs Permanentes (ADMIN)**
```javascript
permanentIPs = ['127.0.0.1', '::1', '10.244.0.0/16']

// Permissões:
✅ GET /logs                          // Dashboard de monitoramento
✅ GET /docs                          // Documentação
✅ POST /api/security/authorize-ip    // Autorizar IPs
✅ POST /api/security/block/:ip       // Bloquear IPs
✅ POST /api/security/unblock/:ip     // Desbloquear IPs
✅ GET /api/security/unified          // Ver lista completa
✅ Todos os endpoints da API
```

### **2. IPs do .env (TRUSTED)**
```javascript
envIPs = process.env.ALLOWED_IPS.split(',')

// Permissões:
✅ GET /docs                          // Documentação
✅ POST /usuarios                     // Endpoints de negócio
✅ POST /read-pdf                     // Funcionalidades normais
❌ GET /logs                          // NÃO pode ver logs
❌ POST /api/security/*               // NÃO pode gerenciar segurança
```

### **3. IPs Autorizados Temporários (GUEST)**
```javascript
dynamicIPs = []  // Autorizados via /logs

// Permissões:
✅ GET /docs                          // Apenas documentação
✅ GET /                              // Home/health
❌ GET /logs                          // NÃO pode ver logs
❌ POST /api/security/*               // NÃO pode gerenciar segurança
❌ Qualquer endpoint sensível
```

---

## 🚨 Proteções Implementadas

### **Proteção 1: Middleware de Níveis**
```javascript
// src/middlewares/accessLevel.js
export function requireAdmin(req, res, next) {
    const ip = req.ip_detected;
    
    if (isPermanentIP(ip)) {
        next();  // ✅ Admin, pode prosseguir
    } else {
        res.status(403).json({
            success: false,
            error: 'Admin access required',
            message: 'Você não tem permissão para acessar este recurso'
        });
    }
}

export function requireTrusted(req, res, next) {
    const ip = req.ip_detected;
    
    if (isPermanentIP(ip) || isEnvIP(ip)) {
        next();  // ✅ Admin ou Trusted, pode prosseguir
    } else {
        res.status(403).json({
            success: false,
            error: 'Trusted access required'
        });
    }
}
```

### **Proteção 2: Rotas Protegidas**
```javascript
// server.js
import { requireAdmin, requireTrusted } from './middlewares/accessLevel.js';

// ❌ Bloqueado para IPs temporários
app.use('/logs', requireAdmin);  // Só admin
app.use('/api/security', requireAdmin);  // Só admin

// ✅ Permitido para trusted + admin
app.use('/api', requireTrusted);  // Trusted ou superior

// ✅ Público para todos autorizados
app.use('/docs', (req, res, next) => next());  // Todos
```

### **Proteção 3: IPs Temporários SÓ Leitura**
```javascript
// IPs autorizados via /logs são READ-ONLY
// Não podem:
- Modificar dados
- Bloquear/desbloquear IPs
- Ver logs de acesso
- Acessar informações sensíveis
```

---

## 🔐 Implementação Detalhada

### **Arquivo: src/config/allowedIPs.js**
```javascript
// Adicionar função para verificar nível
export function getIPAccessLevel(ip) {
    if (permanentIPs.includes(ip)) {
        return 'admin';
    }
    
    if (envIPs.includes(ip)) {
        return 'trusted';
    }
    
    if (dynamicIPs.includes(ip)) {
        return 'guest';
    }
    
    return 'unauthorized';
}

export function canAccessRoute(ip, route) {
    const level = getIPAccessLevel(ip);
    
    // Admin: acesso total
    if (level === 'admin') return true;
    
    // Trusted: não pode acessar /logs e /api/security
    if (level === 'trusted') {
        if (route.startsWith('/logs')) return false;
        if (route.startsWith('/api/security')) return false;
        return true;
    }
    
    // Guest: só /docs e home
    if (level === 'guest') {
        if (route === '/' || route === '/docs') return true;
        return false;
    }
    
    return false;
}
```

---

## 🎯 Cenários de Uso

### **Cenário 1: Você (Admin)**
```
IP: 127.0.0.1 (localhost)
Nível: admin

Acessa /logs
✅ PERMITIDO - Ver dashboard completo

Autoriza IP 192.168.1.100
✅ PERMITIDO - Pode autorizar outros IPs

Bloqueia IP malicioso
✅ PERMITIDO - Controle total de segurança
```

### **Cenário 2: Servidor de Produção (.env)**
```
IP: 203.0.113.50 (em ALLOWED_IPS)
Nível: trusted

Acessa /docs
✅ PERMITIDO - Ver documentação

POST /usuarios
✅ PERMITIDO - Usar API normalmente

Tenta acessar /logs
❌ BLOQUEADO - 403 Forbidden
Resposta: "Admin access required"
```

### **Cenário 3: Cliente Autorizado Temporário**
```
IP: 192.168.1.100 (autorizado via /logs)
Nível: guest

Acessa /docs
✅ PERMITIDO - Ver documentação

Tenta POST /usuarios
❌ BLOQUEADO - 403 Forbidden
Resposta: "Insufficient permissions"

Tenta acessar /logs
❌ BLOQUEADO - 403 Forbidden
Resposta: "Admin access required"
```

---

## 🚀 Melhorias de Segurança

### **1. Rate Limiting por Nível**
```javascript
// Admin: sem limite
// Trusted: 1000 req/15min
// Guest: 100 req/15min

const rateLimitByLevel = {
    admin: null,  // Sem limite
    trusted: rateLimit({ windowMs: 15*60*1000, max: 1000 }),
    guest: rateLimit({ windowMs: 15*60*1000, max: 100 })
}
```

### **2. Audit Log**
```javascript
// Registrar TODAS as ações de IPs temporários
logAction(ip, 'guest', 'POST /usuarios', { success: false, reason: 'forbidden' });

// Se IP temporário tentar acessar rota proibida:
- Log de tentativa
- Incrementar contador de violações
- Após 3 tentativas: desautorizar automaticamente
```

### **3. Whitelist de Endpoints para Guest**
```javascript
const guestAllowedEndpoints = [
    'GET /',
    'GET /docs',
    'GET /health',
    // Adicionar endpoints públicos conforme necessário
];

function isGuestAllowed(method, path) {
    return guestAllowedEndpoints.includes(`${method} ${path}`);
}
```

---

## 📋 Checklist de Implementação

### Fase 1: Estrutura Base
- [ ] Criar `src/middlewares/accessLevel.js`
- [ ] Adicionar funções `getIPAccessLevel()` e `canAccessRoute()`
- [ ] Criar middlewares `requireAdmin()` e `requireTrusted()`

### Fase 2: Proteção de Rotas
- [ ] Proteger `/logs` com `requireAdmin`
- [ ] Proteger `/api/security/*` com `requireAdmin`
- [ ] Aplicar `requireTrusted` em endpoints de negócio

### Fase 3: Rate Limiting
- [ ] Instalar `express-rate-limit`
- [ ] Configurar limites por nível
- [ ] Testar limites

### Fase 4: Audit Log
- [ ] Registrar tentativas de acesso negadas
- [ ] Sistema de 3 strikes para desautorização
- [ ] Dashboard de violações

### Fase 5: Testes
- [ ] Testar acesso admin
- [ ] Testar acesso trusted
- [ ] Testar acesso guest
- [ ] Tentar bypass de permissões

---

## 🎉 Benefícios

✅ **Segurança em Camadas** - 3 níveis de acesso  
✅ **Proteção de Rotas Sensíveis** - /logs apenas para admin  
✅ **IPs Temporários Limitados** - Só docs e home  
✅ **Rate Limiting Diferenciado** - Menos para guests  
✅ **Audit Trail** - Log de todas as tentativas  
✅ **Auto-desautorização** - 3 strikes e está fora  

---

## ⚠️ Importante

**IPs Permanentes (Admin) NUNCA são afetados por:**
- Rate limiting
- Bloqueios automáticos
- Desautorizações
- Restrições de rota

**IPs do .env (Trusted):**
- Podem usar API normalmente
- Não veem logs nem gerenciam segurança

**IPs Temporários (Guest):**
- Acesso mínimo (docs only)
- Estritamente limitados
- Podem ser desautorizados facilmente

---

**Quer que eu implemente tudo isso agora?** 🚀
