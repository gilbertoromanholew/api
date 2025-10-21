# 🔧 CONFIGURAÇÃO DE SEGURANÇA - PÓS FASE 1

**Data:** 20 de outubro de 2025  
**Status:** ✅ Atualizado

---

## 📋 RESUMO DAS MUDANÇAS

### ❓ A variável `ALLOWED_IPS` ainda é necessária?

**✅ SIM, mas com uso DIFERENTE!**

**Antes da Fase 1:**
- `ALLOWED_IPS` bloqueava **TODAS as rotas** globalmente
- Apenas localhost e redes internas podiam acessar

**Depois da Fase 1:**
- `ALLOWED_IPS` bloqueia **APENAS rotas administrativas**
- Rotas públicas e autenticadas não verificam IP

---

## 🎯 USO ATUAL DO `ALLOWED_IPS`

### ✅ Rotas que USAM ipFilter (verificam ALLOWED_IPS):

```javascript
// APENAS ESTAS ROTAS verificam ALLOWED_IPS:
app.get('/logs', ipFilter, requireAdmin, getLogsDashboard);
app.use('/logs', ipFilter, requireAdmin, logsRoutes);
app.use('/zerotier', ipFilter, requireAdmin, zerotierRoutes);
app.use('/security', ipFilter, requireAdmin, securityRoutes);
```

**Objetivo:** Restringir acesso administrativo apenas a IPs confiáveis (VPN)

### ❌ Rotas que NÃO usam ipFilter (não verificam ALLOWED_IPS):

```javascript
// ROTAS PÚBLICAS (qualquer IP pode acessar):
app.use('/auth', authRoutes);           // Login, registro, logout
app.get('/', getApiInfo);               // Documentação JSON
app.get('/docs', getApiDocs);           // Documentação HTML
app.get('/functions', ...);             // Lista de funções
app.use('/supabase', ...);              // Proxy Supabase

// ROTAS AUTENTICADAS (protegidas por JWT, não por IP):
app.use('/api', validateRouteAccess, trackViolations);
// └─ /api/user/* → requireAuth (JWT)
// └─ /api/points/* → requireAuth (JWT)
// └─ /api/tools/execute/* → requireAuth (JWT)
```

---

## 🔧 CONFIGURAÇÕES POR AMBIENTE

### 💻 Desenvolvimento Local (`.env`)

```bash
# Permite localhost + VPN ZeroTier
ALLOWED_IPS=127.0.0.1,localhost,::1,10.244.0.0/16
```

**Como funciona:**
- `127.0.0.1`, `localhost`, `::1` → Acesso local (você desenvolvendo)
- `10.244.0.0/16` → Rede ZeroTier (testes de admin via VPN)

**Testes:**
```bash
# Rotas públicas (funcionam sem VPN)
curl http://localhost:3000/auth/login          # ✅ 200 OK
curl http://localhost:3000/api/user/profile    # ❌ 401 (precisa JWT)

# Rotas admin (precisam de IP autorizado)
curl http://localhost:3000/logs                # ✅ 200 OK (localhost permitido)
curl http://10.244.x.x:3000/logs              # ✅ 200 OK (VPN permitida)
```

### 🚀 Produção (Coolify - `.env.coolify`)

```bash
# Permite IP do servidor (proxy) + VPN ZeroTier
ALLOWED_IPS=177.73.207.121,10.244.0.0/16
```

**Como funciona:**

```
┌────────────────────────────────────────────────────────┐
│  Usuário (Internet) → Qualquer IP                      │
└────────────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────────────┐
│  Nginx/Caddy (177.73.207.121)                          │
│  ├─ Recebe requisições externas                        │
│  └─ Faz proxy para API Docker                          │
└────────────────────────────────────────────────────────┘
                    ↓ X-Forwarded-For: 177.73.207.121
┌────────────────────────────────────────────────────────┐
│  API Container (Node.js/Express)                       │
│                                                         │
│  📍 ROTAS PÚBLICAS (sem ipFilter)                     │
│  ├─ /auth/* → ✅ QUALQUER IP PASSA                   │
│  ├─ /docs → ✅ QUALQUER IP PASSA                      │
│  └─ / → ✅ QUALQUER IP PASSA                          │
│                                                         │
│  📍 ROTAS AUTENTICADAS (requireAuth, sem ipFilter)    │
│  └─ /api/* → ✅ QUALQUER IP (se tiver JWT válido)    │
│                                                         │
│  📍 ROTAS ADMIN (ipFilter + requireAdmin)             │
│  ├─ Verifica: IP ∈ ALLOWED_IPS?                       │
│  │   ├─ 177.73.207.121? ✅ SIM (proxy)               │
│  │   └─ 10.244.x.x? ✅ SIM (VPN)                     │
│  ├─ /logs → ❌ BLOQUEIA (IP proxy não é admin real)  │
│  ├─ /zerotier → ❌ BLOQUEIA                           │
│  └─ /security → ❌ BLOQUEIA                           │
└────────────────────────────────────────────────────────┘
```

**Por que `177.73.207.121` está na lista?**
- É o IP do servidor (proxy Nginx/Caddy)
- **NÃO significa que qualquer pessoa pode acessar rotas admin!**
- Rotas admin têm `requireAdmin` adicional (verifica permissões do usuário)

**Por que `10.244.0.0/16` está na lista?**
- Rede VPN ZeroTier (administradores)
- Acesso direto ao container Docker (bypass do proxy)
- **REAL acesso administrativo**

---

## 🔐 SEGURANÇA EM CAMADAS

### Camada 1: Rede (IP Filtering)
```
ipFilter → Apenas rotas /logs, /zerotier, /security
```
**Protege:** Dashboard de logs, gerenciamento de infraestrutura

### Camada 2: Autenticação (JWT)
```
requireAuth → Todas as rotas /api/*
```
**Protege:** Ferramentas, perfil, pontos (dados do usuário)

### Camada 3: Autorização (Permissões)
```
requireAdmin → Rotas administrativas
```
**Protege:** Funções administrativas (mesmo com IP correto)

### Camada 4: Validação (Input)
```
validateRouteAccess + trackViolations
```
**Protege:** Parâmetros maliciosos, tentativas de exploração

---

## 🧪 TESTANDO A CONFIGURAÇÃO

### Teste 1: Rotas Públicas (deve funcionar de qualquer IP)

```bash
# De qualquer lugar da internet
curl https://samm.host/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"senha123"}'
```
**Esperado:** ✅ 200 OK (se credenciais corretas) ou 401 (se erradas)

### Teste 2: Rotas Autenticadas (deve bloquear sem JWT)

```bash
# Sem token
curl https://samm.host/api/user/profile
```
**Esperado:** ❌ 401 Unauthorized

```bash
# Com token
curl https://samm.host/api/user/profile \
  -H "Cookie: sb-access-token=TOKEN_AQUI"
```
**Esperado:** ✅ 200 OK (com dados do usuário)

### Teste 3: Rotas Admin (deve bloquear IP público)

```bash
# Acesso público (via internet)
curl https://samm.host/logs
```
**Esperado:** ❌ 403 Forbidden (IP não autorizado) ou ❌ 401 Unauthorized (requireAdmin)

```bash
# Acesso via VPN ZeroTier (10.244.x.x)
curl http://10.244.x.x:3000/logs
```
**Esperado:** ✅ 200 OK (HTML do dashboard)

---

## 🎯 POSSO REMOVER O `ALLOWED_IPS`?

### ❌ NÃO RECOMENDADO

Se você remover `ALLOWED_IPS` completamente:

**Opção 1: Remover da aplicação (código)**
```javascript
// Comentar todos os ipFilter
// app.get('/logs', ipFilter, requireAdmin, ...);  // ❌ REMOVER ipFilter
app.get('/logs', requireAdmin, ...);  // ✅ Apenas requireAdmin
```

**Resultado:**
- ✅ Rotas admin ficam acessíveis de qualquer IP (mas ainda com requireAdmin)
- ⚠️ Perde camada extra de segurança (defesa em profundidade)
- ⚠️ Se vulnerabilidade em requireAdmin, não tem backup (IP filtering)

**Opção 2: Definir como `*` (permitir tudo)**
```bash
ALLOWED_IPS=*
```

**Resultado:**
- ✅ ipFilter passa para qualquer IP
- ⚠️ Mesmas preocupações da Opção 1

### ✅ RECOMENDAÇÃO: MANTER

**Por quê?**

1. **Defesa em Profundidade** (Defense in Depth):
   - Se `requireAdmin` tiver bug → ipFilter ainda protege
   - Se JWT for comprometido → VPN ainda restringe acesso admin

2. **Logs Sensíveis**:
   - Dashboard de logs mostra IPs, tentativas de acesso, etc
   - Melhor restringir à VPN (não expor na internet)

3. **ZeroTier VPN Gratuito**:
   - Sem custo adicional
   - Fácil de configurar (já está rodando)
   - Adiciona criptografia extra

4. **Compliance/Auditoria**:
   - Mostra "boa prática" de segurança
   - Facilita auditorias ("rotas admin não são públicas")

---

## 📝 RESUMO FINAL

### ✅ Manter `ALLOWED_IPS`:

| Ambiente | Valor | Uso |
|----------|-------|-----|
| **Desenvolvimento** | `127.0.0.1,localhost,::1,10.244.0.0/16` | Localhost + VPN |
| **Produção** | `177.73.207.121,10.244.0.0/16` | Proxy + VPN |

### ✅ Benefícios:

- ✅ Rotas públicas funcionam sem VPN (usuários podem registrar/logar)
- ✅ Rotas autenticadas protegidas por JWT (não por IP)
- ✅ Rotas admin duplamente protegidas (IP + requireAdmin)
- ✅ Defesa em profundidade (múltiplas camadas)

### ❓ Dúvidas Comuns:

**Q: Por que `177.73.207.121` está em ALLOWED_IPS se é IP público?**
A: É o IP do **servidor** (proxy), não dos clientes. Permite que o proxy encaminhe requisições para a API. Rotas admin têm `requireAdmin` adicional.

**Q: Posso remover `10.244.0.0/16`?**
A: Pode, mas perderá acesso direto via VPN. Precisará acessar apenas via `https://samm.host/logs` (que vai bloquear por requireAdmin se não tiver permissões corretas).

**Q: Como adiciono outro admin?**
A: Via ZeroTier (adicionar ao network `fada62b01530e6b6`) OU dar permissões de admin no banco de dados (Supabase).

---

**Atualizado em:** 20 de outubro de 2025  
**Versão:** Pós Fase 1
