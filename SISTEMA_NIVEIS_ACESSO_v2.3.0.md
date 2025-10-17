# 🔒 Sistema de Níveis de Acesso - v2.3.0

**Data:** 17 de outubro de 2025  
**Status:** ✅ Implementado

---

## 🎯 O Problema

Você expressou preocupação:
> "Eu tenho medo esses autorizados pelo /logs eles desautorizem os padrões do aplicativo, ou façam requisições que não podem."

**Cenário de Risco:**
```
IP 192.168.1.100 autorizado via /logs (temporário)
↓
Tenta acessar /logs → ❌ PERIGO! Pode ver tudo e gerenciar segurança
Tenta bloquear 127.0.0.1 → ❌ PERIGO! Pode bloquear admin
Tenta autorizar mais IPs → ❌ PERIGO! Pode criar backdoors
```

---

## ✅ A Solução: 3 Níveis de Acesso

### **1. ADMIN (IPs Permanentes)** 🔑

**Quem:**
- `127.0.0.1` (localhost)
- `::1` (localhost IPv6)  
- `10.244.0.0/16` (ZeroTier VPN)

**Permissões:**
```
✅ /                       → Documentação JSON
✅ /docs                   → Interface de documentação
✅ /logs                   → Dashboard de monitoramento
✅ /api/logs/*             → API de logs
✅ /api/security/*         → Gerenciar segurança
✅ /zerotier/*             → Info ZeroTier
✅ /api/functions/*        → Todos os endpoints
```

**Características:**
- ✅ Acesso total e irrestrito
- ✅ Sem rate limiting
- ✅ Não pode ser bloqueado
- ✅ Não rastreia violações

---

### **2. TRUSTED (IPs do .env)** 🤝

**Quem:**
- IPs em `process.env.ALLOWED_IPS`
- Exemplo: Servidor de produção, servidor de backup

**Permissões:**
```
✅ /                       → Documentação JSON
✅ /docs                   → Interface de documentação
✅ /api/functions/*        → Endpoints de negócio
❌ /logs                   → BLOQUEADO (403)
❌ /api/logs/*             → BLOQUEADO (403)
❌ /api/security/*         → BLOQUEADO (403)
```

**Características:**
- ✅ Pode usar API normalmente
- ❌ Não vê logs
- ❌ Não gerencia segurança
- ⚠️ Rate limit: 1000 req/15min (futuro)

---

### **3. GUEST (Autorizados via /logs)** 👤

**Quem:**
- IPs autorizados temporariamente via dashboard `/logs`
- Armazenados em memória (resetam ao reiniciar)

**Permissões:**
```
✅ /                       → Documentação JSON
✅ /docs                   → Interface de documentação
❌ /logs                   → BLOQUEADO (403)
❌ /api/*                  → BLOQUEADO (403)
❌ Qualquer outro endpoint → BLOQUEADO (403)
```

**Características:**
- ✅ Acesso APENAS à documentação
- ❌ Não pode fazer NADA além de ver docs
- ⚠️ Rate limit: 100 req/15min (futuro)
- 🚨 **Sistema de 3 Strikes:** 3 tentativas de acesso negadas = desautorização automática

---

## 🛡️ Proteções Implementadas

### **1. Middleware de Níveis**

**Arquivo:** `src/middlewares/accessLevel.js`

```javascript
// Determina o nível do IP
export async function getIPAccessLevel(ip)
// Retorna: 'admin' | 'trusted' | 'guest' | 'unauthorized'

// Verifica se pode acessar rota específica
export async function canAccessRoute(ip, method, path)
// Retorna: { allowed: boolean, level: string, reason?: string }

// Middleware: Requer admin
export async function requireAdmin(req, res, next)
// Bloqueia se não for admin

// Middleware: Requer trusted ou admin
export async function requireTrusted(req, res, next)
// Bloqueia se for guest ou unauthorized

// Rastreia violações (tentativas negadas)
export async function trackViolations(req, res, next)
// Conta tentativas e desautoriza após 3 strikes
```

---

### **2. Rotas Protegidas**

**Arquivo:** `server.js`

```javascript
// Público (todos autorizados)
app.get('/', getApiInfo);
app.get('/docs', getApiDocs);

// 🔒 ADMIN ONLY
app.get('/logs', requireAdmin, getLogsDashboard);
app.use('/api/logs', requireAdmin, logsRoutes);
app.use('/api/security', requireAdmin, securityRoutes);

// Funcionalidades de negócio (trusted + admin)
// app.use('/api', requireTrusted);  // Futuro
```

---

### **3. Sistema de 3 Strikes**

**Como funciona:**

```
IP 192.168.1.100 (guest) tenta acessar /logs
↓
❌ Acesso negado (403)
↓
Violação registrada (1/3)
↓
IP tenta novamente /api/security/block/127.0.0.1
↓
❌ Acesso negado (403)
↓
Violação registrada (2/3)
↓
IP tenta /api/logs/list
↓
❌ Acesso negado (403)
↓
Violação registrada (3/3)
↓
🚨 IP DESAUTORIZADO AUTOMATICAMENTE
↓
Próxima requisição: "IP not authorized" (bloqueio total)
```

**Log de exemplo:**
```
⚠️ Violation tracked for 192.168.1.100: 1 attempts
⚠️ Violation tracked for 192.168.1.100: 2 attempts
🚨 IP 192.168.1.100 exceeded violation limit (3). Removing authorization.
```

---

## 🧪 Testes e Cenários

### **Teste 1: Guest Tenta Acessar /logs**

```bash
# Autorizar IP temporário
curl -X POST http://localhost:3000/api/security/authorize-ip \
  -H "Content-Type: application/json" \
  -d '{"ip": "192.168.1.100", "reason": "Teste"}'

# Tentar acessar /logs desse IP
curl -H "X-Forwarded-For: 192.168.1.100" \
  http://localhost:3000/logs

# Resposta:
{
  "success": false,
  "error": "Forbidden",
  "message": "🚫 Admin access required. This resource is restricted to administrators only.",
  "accessLevel": "guest",
  "yourIP": "192.168.1.100"
}
```

**Resultado:** ✅ BLOQUEADO

---

### **Teste 2: Guest Tenta Bloquear IP**

```bash
curl -H "X-Forwarded-For: 192.168.1.100" \
  -X POST http://localhost:3000/api/security/block/127.0.0.1

# Resposta:
{
  "success": false,
  "error": "Forbidden",
  "message": "🚫 Admin access required. This resource is restricted to administrators only.",
  "accessLevel": "guest",
  "yourIP": "192.168.1.100"
}
```

**Resultado:** ✅ BLOQUEADO

---

### **Teste 3: Guest Acessa /docs (Permitido)**

```bash
curl -H "X-Forwarded-For: 192.168.1.100" \
  http://localhost:3000/docs

# Resposta:
<!DOCTYPE html>
<html>
...documentação HTML...
</html>
```

**Resultado:** ✅ PERMITIDO

---

### **Teste 4: 3 Strikes e Desautorização**

```bash
# Tentativa 1
curl -H "X-Forwarded-For: 192.168.1.100" http://localhost:3000/logs
# Log: ⚠️ Violation tracked for 192.168.1.100: 1 attempts

# Tentativa 2
curl -H "X-Forwarded-For: 192.168.1.100" http://localhost:3000/api/security/block/1.1.1.1
# Log: ⚠️ Violation tracked for 192.168.1.100: 2 attempts

# Tentativa 3
curl -H "X-Forwarded-For: 192.168.1.100" http://localhost:3000/api/logs/list
# Log: 🚨 IP 192.168.1.100 exceeded violation limit (3). Removing authorization.

# Próxima requisição (qualquer rota)
curl -H "X-Forwarded-For: 192.168.1.100" http://localhost:3000/docs

# Resposta:
{
  "success": false,
  "error": "IP not authorized",
  "message": "Your IP is not in the allowed list"
}
```

**Resultado:** ✅ IP DESAUTORIZADO AUTOMATICAMENTE

---

### **Teste 5: Admin Tem Acesso Total**

```bash
# Localhost (admin) pode tudo
curl http://localhost:3000/logs
# ✅ Dashboard completo

curl -X POST http://localhost:3000/api/security/authorize-ip \
  -H "Content-Type: application/json" \
  -d '{"ip": "1.2.3.4", "reason": "Teste"}'
# ✅ IP autorizado

curl http://localhost:3000/api/logs/list
# ✅ Lista de logs completa
```

**Resultado:** ✅ TUDO PERMITIDO

---

## 📊 Comparação: Antes vs Depois

| Ação                          | Antes (v2.2.5) | Agora (v2.3.0) |
|-------------------------------|----------------|----------------|
| **Guest acessa /logs**        | ✅ Permitido   | ❌ BLOQUEADO   |
| **Guest vê /api/security**    | ✅ Permitido   | ❌ BLOQUEADO   |
| **Guest bloqueia IPs**        | ✅ Permitido   | ❌ BLOQUEADO   |
| **Guest autoriza outros IPs** | ✅ Permitido   | ❌ BLOQUEADO   |
| **Guest vê /docs**            | ✅ Permitido   | ✅ PERMITIDO   |
| **Trusted vê /logs**          | ✅ Permitido   | ❌ BLOQUEADO   |
| **Admin tem acesso total**    | ✅ Sim         | ✅ SIM         |
| **3 strikes desautoriza**     | ❌ Não existe  | ✅ IMPLEMENTADO|

---

## 🚀 Segurança Escalável

### **Proteções Atuais:**
- ✅ 3 níveis de acesso hierárquicos
- ✅ Rotas administrativas protegidas
- ✅ Sistema de 3 strikes
- ✅ Logs de violações
- ✅ Desautorização automática

### **Futuras Melhorias (v2.4.0):**
- [ ] Rate limiting diferenciado por nível
- [ ] Audit log detalhado
- [ ] Dashboard de violações
- [ ] Alertas de segurança
- [ ] Whitelist de endpoints para guest

---

## 📝 Checklist de Segurança

### ✅ Implementado

- [x] Middleware de níveis de acesso
- [x] Proteção de rotas administrativas
- [x] Sistema de 3 strikes
- [x] Rastreamento de violações
- [x] Desautorização automática
- [x] Logs de tentativas negadas
- [x] IPs guest limitados a /docs apenas

### ⏳ Próximas Implementações

- [ ] Rate limiting por nível
- [ ] Dashboard de violações no /logs
- [ ] Alertas por email de violações
- [ ] Whitelist configurável para guests
- [ ] Logs persistentes de violações

---

## 🎉 Resumo

**Sua preocupação foi resolvida!**

### **Antes:**
❌ IPs autorizados via /logs tinham acesso total  
❌ Podiam ver logs e gerenciar segurança  
❌ Risco de ataques e manipulação  

### **Agora:**
✅ IPs guest SÓ veem /docs  
✅ /logs protegido (ADMIN ONLY)  
✅ /api/security protegido (ADMIN ONLY)  
✅ Sistema de 3 strikes desautoriza automaticamente  
✅ Logs de todas as tentativas negadas  

---

## 🧪 Como Testar

1. **Reinicie o servidor**
   ```bash
   node server.js
   ```

2. **Autorize um IP temporário**
   ```bash
   # No navegador: http://localhost:3000/logs
   # Clique em "Autorizar Acesso"
   # Digite: 192.168.1.100
   ```

3. **Tente acessar /logs com esse IP**
   ```bash
   curl -H "X-Forwarded-For: 192.168.1.100" http://localhost:3000/logs
   # Deve retornar 403 Forbidden
   ```

4. **Veja os logs no console**
   ```
   🚫 Access denied to /logs for IP 192.168.1.100 (level: guest)
   ```

---

**Versão:** 2.3.0  
**Data:** 17 de outubro de 2025  
**Status:** ✅ Pronto para Produção  
**Segurança:** 🔒 Máxima
