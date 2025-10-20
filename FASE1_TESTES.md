# ✅ CHECKLIST DE TESTES - FASE 1

**Data:** 20 de outubro de 2025  
**Branch:** main  
**Status:** Aguardando testes em produção

---

## 📋 MUDANÇAS IMPLEMENTADAS

### 1. Reestruturação do `server.js`

✅ **Removido:** `app.use(ipFilter)` global (linha 71)

✅ **Adicionado:** Estrutura de rotas em 3 níveis:

#### 📍 Rotas Públicas (SEM filtro de IP)
```javascript
// Qualquer usuário da internet pode acessar
app.use('/supabase', supabaseProxyCors, supabaseProxy);  // Proxy Supabase
app.use('/auth', authRoutes);                             // Login, registro, sessão
app.get('/', getApiInfo);                                 // Documentação JSON
app.get('/docs', getApiDocs);                             // Documentação HTML
app.get('/functions', ...);                               // Lista de funções
```

#### 📍 Rotas Administrativas (COM ipFilter + requireAdmin)
```javascript
// Apenas IPs autorizados (VPN ZeroTier ou ALLOWED_IPS)
app.get('/logs', ipFilter, requireAdmin, getLogsDashboard);
app.use('/logs', ipFilter, requireAdmin, logsRoutes);
app.use('/zerotier', ipFilter, requireAdmin, zerotierRoutes);
app.use('/security', ipFilter, requireAdmin, securityRoutes);
```

#### 📍 Rotas de API (COM validateRouteAccess + trackViolations)
```javascript
// Functions dinâmicas com validação de nível de acesso
app.use('/api', validateRouteAccess, trackViolations);
await autoLoadRoutes(app);
```

### 2. Middleware `requireAuth`

✅ **Já existente:** `src/functions/auth/authMiddleware.js`
- Valida JWT do Supabase
- Suporta token via cookie (`sb-access-token`) ou header (`Authorization: Bearer`)
- Adiciona `req.user` e `req.token` quando autenticado

### 3. Rotas de Functions

✅ **Verificado:** Todas as rotas já usam `requireAuth` onde apropriado:
- `/api/user/*` → requireAuth ✅
- `/api/points/*` → requireAuth ✅
- `/api/tools/execute/*` → requireAuth ✅
- `/api/tools/list` → Público ✅

---

## 🧪 TESTES A EXECUTAR

### 🔓 Testes de Rotas Públicas (SEM autenticação)

#### 1. Healthcheck
```bash
curl https://samm.host/health
```
**Esperado:** 200 OK (sem restrições)

#### 2. Documentação
```bash
curl https://samm.host/
curl https://samm.host/docs
```
**Esperado:** 200 OK (HTML/JSON da documentação)

#### 3. Login (SEM token)
```bash
curl -X POST https://samm.host/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"senha123"}'
```
**Esperado:** 200 OK com cookie `sb-access-token`

#### 4. Registro (SEM token)
```bash
curl -X POST https://samm.host/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"novo@example.com","password":"senha123","full_name":"Teste"}'
```
**Esperado:** 201 Created

#### 5. Lista de Funções (público)
```bash
curl https://samm.host/functions
```
**Esperado:** 200 OK com lista de funções

### 🔐 Testes de Rotas Autenticadas (COM requireAuth)

#### 1. Perfil (SEM token)
```bash
curl https://samm.host/api/user/profile
```
**Esperado:** 401 Unauthorized
```json
{
  "success": false,
  "message": "Token de autenticação não fornecido"
}
```

#### 2. Perfil (COM token)
```bash
curl https://samm.host/api/user/profile \
  -H "Cookie: sb-access-token=SEU_TOKEN_AQUI"
```
**Esperado:** 200 OK com dados do usuário

#### 3. Saldo de Pontos (COM token)
```bash
curl https://samm.host/api/points/balance \
  -H "Cookie: sb-access-token=SEU_TOKEN_AQUI"
```
**Esperado:** 200 OK com saldo

#### 4. Lista de Ferramentas (público)
```bash
curl https://samm.host/api/tools/list
```
**Esperado:** 200 OK (público)

#### 5. Executar Ferramenta (SEM token)
```bash
curl -X POST https://samm.host/api/tools/execute/hora-extra \
  -H "Content-Type: application/json" \
  -d '{"params":{"horas":2}}'
```
**Esperado:** 401 Unauthorized

#### 6. Executar Ferramenta (COM token)
```bash
curl -X POST https://samm.host/api/tools/execute/hora-extra \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=SEU_TOKEN_AQUI" \
  -d '{"params":{"horas":2}}'
```
**Esperado:** 200 OK com resultado

### 🔒 Testes de Rotas Admin (COM ipFilter + requireAdmin)

#### 1. Dashboard de Logs (SEM VPN)
```bash
curl https://samm.host/logs
```
**Esperado:** 403 Forbidden (IP não autorizado)

#### 2. Dashboard de Logs (COM VPN ZeroTier)
```bash
# Conectar ao ZeroTier (10.244.x.x)
curl http://10.244.x.x:3000/logs
```
**Esperado:** 200 OK (HTML do dashboard)

#### 3. API de Logs (SEM VPN)
```bash
curl https://samm.host/logs/api/recent
```
**Esperado:** 403 Forbidden

#### 4. ZeroTier (SEM VPN)
```bash
curl https://samm.host/zerotier/status
```
**Esperado:** 403 Forbidden

#### 5. Segurança (SEM VPN)
```bash
curl https://samm.host/security/ips/allowed
```
**Esperado:** 403 Forbidden

---

## 🎯 CRITÉRIOS DE SUCESSO

### ✅ Fase 1 está completa se:

1. **Rotas públicas funcionam SEM autenticação:**
   - [ ] /health → 200 OK
   - [ ] /auth/login → 200 OK
   - [ ] /auth/register → 201 Created
   - [ ] / e /docs → 200 OK
   - [ ] /functions → 200 OK

2. **Rotas autenticadas bloqueiam SEM token:**
   - [ ] /api/user/profile → 401 Unauthorized
   - [ ] /api/points/balance → 401 Unauthorized
   - [ ] /api/tools/execute/* → 401 Unauthorized

3. **Rotas autenticadas funcionam COM token:**
   - [ ] /api/user/profile → 200 OK
   - [ ] /api/points/balance → 200 OK
   - [ ] /api/tools/execute/* → 200 OK

4. **Rotas admin bloqueiam IPs públicos:**
   - [ ] /logs → 403 Forbidden (sem VPN)
   - [ ] /logs/api/* → 403 Forbidden
   - [ ] /zerotier/* → 403 Forbidden
   - [ ] /security/* → 403 Forbidden

5. **Rotas admin funcionam via VPN:**
   - [ ] /logs → 200 OK (VPN ZeroTier)

6. **Frontend funciona normalmente:**
   - [ ] Login no frontend → Dashboard
   - [ ] Uso de ferramentas → Funciona
   - [ ] Logout → Volta ao login

---

## 📊 IMPACTO ESPERADO

### ✅ Melhorias

- ✅ Usuários públicos podem registrar e logar
- ✅ Rotas de ferramentas protegidas por autenticação real (JWT)
- ✅ Rotas administrativas protegidas por IP (VPN)
- ✅ Melhor separação de responsabilidades (público vs autenticado vs admin)

### ⚠️ Sem Mudanças Visíveis

- Frontend continua funcionando igual (já usa autenticação)
- Admin via VPN continua funcionando igual

### ❌ Sem Impacto Negativo

- Nenhuma funcionalidade existente quebra
- Nenhum usuário legítimo é bloqueado

---

## 🚀 PRÓXIMOS PASSOS

Após validar Fase 1:

1. ✅ Commitar mudanças
2. ✅ Deploy em produção (Coolify)
3. ✅ Executar testes manuais
4. ⏭️ Iniciar **Fase 2: Rate Limiting** (se tudo OK)

---

## 📝 NOTAS

**Configuração de Produção (Coolify):**
```bash
ALLOWED_IPS=177.73.207.121  # IP do servidor (proxy Nginx/Caddy)
```

**Como funciona:**
- Nginx/Caddy recebe requisições externas (qualquer IP)
- Faz proxy para API com IP 177.73.207.121
- API autoriza esse IP (ipFilter pass)
- Rotas públicas: ✅ Todos podem acessar
- Rotas autenticadas: ✅ Apenas com JWT válido
- Rotas admin: ✅ Apenas IPs da VPN ZeroTier (10.244.0.0/16)

---

**Status:** 🟡 Aguardando testes em produção
