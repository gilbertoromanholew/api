# 🔒 Auditoria de Segurança - API v2.10.4

**Data:** 17 de outubro de 2025  
**Auditor:** GitHub Copilot  
**Escopo:** Análise completa de vulnerabilidades por nível de acesso

---

## 📋 Resumo Executivo

| Métrica | Valor |
|---------|-------|
| **Vulnerabilidades Críticas** | 2 🔴 |
| **Vulnerabilidades Altas** | 3 🟠 |
| **Vulnerabilidades Médias** | 2 🟡 |
| **Vulnerabilidades Baixas** | 1 🟢 |
| **Score de Segurança** | 6.5/10 ⚠️ |

---

## 🎯 Hierarquia de Acesso Atual

### 1. **UNAUTHORIZED** (Não Autorizado)
- IPs não reconhecidos
- Bloqueados pelo `ipFilter`
- **Status:** ✅ SEGURO

### 2. **GUEST** (Convidado)
- IPs autorizados temporariamente
- **Acesso Esperado:** `/`, `/docs`, endpoints de functions
- **Acesso Real:** ⚠️ VER VULNERABILIDADES ABAIXO

### 3. **TRUSTED** (Confiável)
- IPs do `.env` (ALLOWED_IPS)
- **Acesso Esperado:** Mesmo que GUEST + algumas APIs extras
- **Acesso Real:** ⚠️ VER VULNERABILIDADES ABAIXO

### 4. **ADMIN** (Administrador)
- `127.0.0.1`, `::1`, `10.244.0.0/16` (ZeroTier)
- **Acesso Esperado:** TUDO
- **Acesso Real:** ✅ CORRETO

---

## 🚨 VULNERABILIDADES CRÍTICAS

### 🔴 VULN-001: Exposição da API de Logs (CORRIGIDA na v2.10.4)

**Gravidade:** 🔴 CRÍTICA  
**Status:** ✅ **CORRIGIDA**  
**Afeta:** GUEST, TRUSTED

**Descrição:**  
As rotas `/api/logs/*` estavam completamente abertas antes da v2.10.4, permitindo que qualquer IP autorizado (guest/trusted) acessasse logs sensíveis.

**Exploração:**
```bash
# Como GUEST, era possível:
curl https://api.samm.host/api/logs?ip=127.0.0.1
curl https://api.samm.host/api/logs/stats
curl https://api.samm.host/api/logs/ips
curl -X POST https://api.samm.host/api/logs/clear  # LIMPAR TODOS OS LOGS!
```

**Dados Expostos:**
- Todos os IPs que acessaram a API
- Timestamps, endpoints, métodos HTTP
- Geolocalização de todos os clientes
- Estatísticas completas de acesso
- **Possibilidade de LIMPAR logs (POST /clear)**

**Correção Aplicada (v2.10.4):**
```javascript
// server.js - LINHA 104
app.use('/api/logs', requireAdmin, logsRoutes);  // ✅ Protegida
```

**Impacto:** ✅ Resolvido - Apenas ADMIN pode acessar logs

---

### 🔴 VULN-002: ipFilter não define req.ip_detected e req.accessLevel

**Gravidade:** 🔴 CRÍTICA  
**Status:** ❌ **NÃO CORRIGIDA**  
**Afeta:** Todos os níveis

**Descrição:**  
O middleware `ipFilter` valida se o IP está autorizado, mas **NÃO define** as variáveis `req.ip_detected` e `req.accessLevel` que outros middlewares esperam.

**Localização:**  
`src/middlewares/ipFilter.js` - Linha 283 (apenas chama `next()` sem definir variáveis)

**Código Problemático:**
```javascript
// ipFilter.js - LINHA 283
if (!clientInfo.is_authorized) {
    // ... código de bloqueio
}

next(); // ❌ Não define req.ip_detected nem req.accessLevel
```

**Middlewares Afetados:**
```javascript
// accessLevel.js - LINHA 115
const ip = req.ip_detected || req.ip;  // ⚠️ Sempre vai usar req.ip

// accessLevel.js - LINHA 164
const ip = req.ip_detected || req.ip;  // ⚠️ Sempre vai usar req.ip
```

**Impacto:**
- Middlewares de autorização podem pegar IP errado (req.ip em vez de clientIp detectado)
- Não há rastreamento consistente do nível de acesso entre middlewares
- Dificulta auditoria e logs de segurança

**Correção Necessária:**
```javascript
// ipFilter.js - ANTES DE next()
req.ip_detected = clientIp;
req.accessLevel = 'unauthorized'; // Será sobrescrito por requireAdmin/etc
req.clientInfo = clientInfo;

next();
```

---

## 🟠 VULNERABILIDADES ALTAS

### 🟠 VULN-003: /api/functions expõe estrutura de diretórios

**Gravidade:** 🟠 ALTA  
**Status:** ❌ **NÃO CORRIGIDA**  
**Afeta:** GUEST, TRUSTED, ADMIN (rota pública)

**Descrição:**  
A rota `/api/functions` em `server.js` (linhas 36-100) lê o sistema de arquivos e expõe:
- Nomes de todas as pastas em `src/functions/`
- Conteúdo de README.md
- Todas as rotas e métodos HTTP de cada função
- Estrutura de código (via regex `router.(get|post|put|delete|patch)`)

**Exploração:**
```bash
curl https://api.samm.host/api/functions
```

**Resposta (exemplo):**
```json
{
  "success": true,
  "total": 2,
  "functions": [
    {
      "name": "exemplo",
      "path": "/exemplo",
      "description": "CRUD de usuários",
      "endpoints": [
        { "method": "GET", "path": "/usuarios" },
        { "method": "POST", "path": "/usuarios" },
        { "method": "PUT", "path": "/usuarios/:id" },
        { "method": "DELETE", "path": "/usuarios/:id" }
      ]
    },
    {
      "name": "pdf",
      "path": "/pdf",
      "endpoints": [
        { "method": "POST", "path": "/read-pdf" }
      ]
    }
  ]
}
```

**Risco:**
- Revela toda a superfície de ataque
- Facilita enumeração de endpoints
- Expõe informações de arquitetura interna

**Nível Atual:** 🔓 **PÚBLICO** (sem proteção)

**Correção Recomendada:**
```javascript
// server.js - LINHA 36
app.get('/api/functions', requireAdmin, async (req, res) => {
    // ... código existente
});
```

**Alternativa:** Manter público mas remover informações sensíveis (só mostrar nomes, sem estrutura de rotas)

---

### 🟠 VULN-004: Rotas de Functions sem controle de nível de acesso

**Gravidade:** 🟠 ALTA  
**Status:** ❌ **NÃO CORRIGIDA**  
**Afeta:** GUEST pode acessar TODAS as rotas de functions

**Descrição:**  
As rotas carregadas dinamicamente de `src/functions/` são registradas **SEM** validação de nível de acesso:

```javascript
// routeLoader.js - LINHA 46
app.use(routeModule.default);  // ❌ SEM PROTEÇÃO!
```

**Rotas Expostas:**
- `/usuarios` (GET, POST, PUT, DELETE) - GUEST tem acesso total!
- `/usuarios/:id` - GUEST pode criar, editar, deletar
- `/read-pdf` - GUEST pode fazer upload e processar PDFs

**Comportamento Esperado vs Real:**

| Ação | Esperado | Real |
|------|----------|------|
| Guest GET /usuarios | ✅ Permitido (leitura) | ✅ Permitido |
| Guest POST /usuarios | ❌ Negado (escrita) | ✅ **PERMITIDO** 🚨 |
| Guest PUT /usuarios/:id | ❌ Negado (escrita) | ✅ **PERMITIDO** 🚨 |
| Guest DELETE /usuarios/:id | ❌ Negado (delete) | ✅ **PERMITIDO** 🚨 |
| Guest POST /read-pdf | ❌ Negado (upload) | ✅ **PERMITIDO** 🚨 |

**Impacto:**
- GUEST pode modificar dados (POST, PUT, DELETE)
- GUEST pode fazer upload de arquivos (PDF)
- Sem controle granular de permissões

**Correção Necessária:**

**Opção 1: Proteção Global (Simples)**
```javascript
// server.js - ANTES de autoLoadRoutes
app.use('/usuarios', requireTrusted);  // Apenas trusted+ pode acessar
app.use('/read-pdf', requireTrusted);
```

**Opção 2: Middleware de Validação (Recomendado)**
```javascript
// server.js - LINHA 23 (depois de ipFilter)
import { validateRouteAccess } from './src/middlewares/accessLevel.js';
app.use(validateRouteAccess);  // Valida TODA requisição
```

**Opção 3: Por Método HTTP (Mais Granular)**
```javascript
// exemploRoutes.js
import { requireTrusted } from '../../middlewares/accessLevel.js';

router.get('/usuarios', exemploController.listarUsuarios);  // Guest OK
router.post('/usuarios', requireTrusted, exemploController.criarUsuario);  // Trusted+
router.put('/usuarios/:id', requireTrusted, exemploController.atualizarUsuario);
router.delete('/usuarios/:id', requireAdmin, exemploController.deletarUsuario);  // Admin only
```

---

### 🟠 VULN-005: /zerotier expõe Network ID público

**Gravidade:** 🟠 ALTA  
**Status:** ❌ **NÃO CORRIGIDA**  
**Afeta:** TODOS (rota pública)

**Descrição:**  
A rota `/zerotier/status` é pública e expõe:
- Network ID completo: `fada62b01530e6b6`
- Range da rede: `10.244.0.0/16`
- Gateway: `25.255.255.254`
- Instruções completas de como se conectar

**Exploração:**
```bash
curl https://api.samm.host/zerotier/status
```

**Risco:**
- Qualquer pessoa pode tentar se conectar à rede ZeroTier
- Mesmo que não seja autorizado no dashboard, já sabe o Network ID
- Facilita tentativas de bruteforce ou engenharia social

**Localização:**  
`src/routes/zerotier.js` - Todo o arquivo é público

**Correção Recomendada:**
```javascript
// server.js - LINHA 105
app.use('/zerotier', requireAdmin, zerotierRoutes);  // ✅ Proteger
```

**OU** (se quiser manter info básica pública):
```javascript
// zerotier.js - Remover Network ID e gateway
const networkInfo = {
    // networkId: 'fada62b01530e6b6',  // ❌ REMOVER
    networkName: 'API Private Network',
    range: '10.244.0.0/16',  // OK manter (é padrão)
    // gateway: '25.255.255.254',  // ❌ REMOVER
    description: 'Rede virtual segura para acesso à API'
};
```

---

## 🟡 VULNERABILIDADES MÉDIAS

### 🟡 VULN-006: trackViolations não registra todas as tentativas

**Gravidade:** 🟡 MÉDIA  
**Status:** ❌ **NÃO CORRIGIDA**  
**Afeta:** Auditoria de segurança

**Descrição:**  
O middleware `trackViolations` (accessLevel.js, linha 188) só rastreia erros 403, mas **não rastreia**:
- Tentativas de acesso a rotas inexistentes (404)
- Erros de validação (400)
- Tentativas de métodos não permitidos (405)
- Rate limiting (429)

**Impacto:**
- Auditoria incompleta
- Difícil detectar padrões de ataque
- Violações não registradas no sistema de bloqueio

**Correção Recomendada:**
```javascript
// accessLevel.js - trackViolations
res.json = async function(data) {
    // Rastrear 403, 401, 404, 400, 405, 429
    if ([403, 401, 404, 400, 405, 429].includes(res.statusCode) && !data.success) {
        // ... código de rastreamento
    }
    return originalJson(data);
};
```

---

### 🟡 VULN-007: CORS totalmente aberto

**Gravidade:** 🟡 MÉDIA  
**Status:** ❌ **NÃO CORRIGIDA**  
**Afeta:** Todos

**Descrição:**  
CORS está configurado sem restrições:

```javascript
// server.js - LINHA 18
app.use(cors());  // ❌ Aceita qualquer origem
```

**Risco:**
- Qualquer site pode fazer requisições à API
- Facilita ataques CSRF (Cross-Site Request Forgery)
- Permite embedding da API em sites maliciosos

**Correção Recomendada:**
```javascript
// server.js
app.use(cors({
    origin: [
        'https://api.samm.host',
        'http://localhost:3000',
        /^http:\/\/10\.244\.\d+\.\d+:\d+$/  // ZeroTier range
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 🟢 VULNERABILIDADES BAIXAS

### 🟢 VULN-008: Documentação expõe informações de versão

**Gravidade:** 🟢 BAIXA  
**Status:** ❌ **NÃO CORRIGIDA**  
**Afeta:** Todos (informacional)

**Descrição:**  
Rotas `/` e `/docs` expõem:
- Versão do Node.js
- Uptime do servidor
- Ambiente (production/dev)
- Estrutura completa da API

**Localização:**  
`src/routes/index.js` - linha 47

**Risco:**
- Facilita fingerprinting
- Pode revelar vulnerabilidades conhecidas da versão do Node
- Informações úteis para reconhecimento

**Correção (Opcional):**
```javascript
// index.js - Remover ou proteger
api: {
    name: 'API Modular',
    version: '2.10.4',  // ❌ Remover em produção
    status: 'online',
    // environment: process.env.NODE_ENV,  // ❌ Remover
    // node_version: process.version,  // ❌ Remover
    // uptime: process.uptime()  // ❌ Remover
}
```

---

## ✅ CORREÇÕES RECOMENDADAS (Prioridade)

### 🔥 URGENTE (Implementar Agora)

1. **VULN-002:** Definir `req.ip_detected` e `req.accessLevel` no ipFilter
2. **VULN-004:** Proteger rotas de escrita em functions (POST, PUT, DELETE)
3. **VULN-005:** Proteger `/zerotier` ou remover Network ID

### 🔶 ALTA (Implementar Esta Semana)

4. **VULN-003:** Proteger `/api/functions` com requireAdmin
5. **VULN-007:** Configurar CORS restrito

### 🔷 MÉDIA (Implementar Este Mês)

6. **VULN-006:** Expandir trackViolations para todos os erros
7. **VULN-008:** Remover informações de versão em produção

---

## 📊 Matriz de Acesso Atual vs Esperada

### ❌ ATUAL (Com Vulnerabilidades)

| Rota | UNAUTH | GUEST | TRUSTED | ADMIN |
|------|--------|-------|---------|-------|
| `/` | ✅ | ✅ | ✅ | ✅ |
| `/docs` | ✅ | ✅ | ✅ | ✅ |
| `/logs` | ❌ | ❌ | ❌ | ✅ |
| `/api/logs/*` | ❌ | ❌ | ❌ | ✅ ✅ |
| `/api/security/*` | ❌ | ❌ | ❌ | ✅ |
| `/api/functions` | ✅ | ✅ | ✅ | ✅ ⚠️ |
| `/zerotier/*` | ✅ | ✅ | ✅ | ✅ ⚠️ |
| `GET /usuarios` | ❌ | ✅ | ✅ | ✅ |
| `POST /usuarios` | ❌ | ✅ 🚨 | ✅ | ✅ |
| `PUT /usuarios/:id` | ❌ | ✅ 🚨 | ✅ | ✅ |
| `DELETE /usuarios/:id` | ❌ | ✅ 🚨 | ✅ | ✅ |
| `POST /read-pdf` | ❌ | ✅ 🚨 | ✅ | ✅ |

### ✅ ESPERADA (Após Correções)

| Rota | UNAUTH | GUEST | TRUSTED | ADMIN |
|------|--------|-------|---------|-------|
| `/` | ✅ | ✅ | ✅ | ✅ |
| `/docs` | ✅ | ✅ | ✅ | ✅ |
| `/logs` | ❌ | ❌ | ❌ | ✅ |
| `/api/logs/*` | ❌ | ❌ | ❌ | ✅ |
| `/api/security/*` | ❌ | ❌ | ❌ | ✅ |
| `/api/functions` | ❌ | ❌ | ❌ | ✅ ✅ |
| `/zerotier/*` | ❌ | ❌ | ❌ | ✅ ✅ |
| `GET /usuarios` | ❌ | ✅ | ✅ | ✅ |
| `POST /usuarios` | ❌ | ❌ | ✅ ✅ | ✅ |
| `PUT /usuarios/:id` | ❌ | ❌ | ✅ ✅ | ✅ |
| `DELETE /usuarios/:id` | ❌ | ❌ | ❌ | ✅ ✅ |
| `POST /read-pdf` | ❌ | ❌ | ✅ ✅ | ✅ |

---

## 🎯 Plano de Ação

### Fase 1: Correções Críticas (Hoje)
```bash
# 1. Corrigir ipFilter
# src/middlewares/ipFilter.js - Adicionar antes de next()
req.ip_detected = clientIp;
req.clientInfo = clientInfo;

# 2. Proteger rotas de escrita
# src/functions/exemplo/exemploRoutes.js
import { requireTrusted } from '../../middlewares/accessLevel.js';
router.post('/usuarios', requireTrusted, ...);
router.put('/usuarios/:id', requireTrusted, ...);
router.delete('/usuarios/:id', requireAdmin, ...);

# 3. Proteger /zerotier
# server.js
app.use('/zerotier', requireAdmin, zerotierRoutes);
```

### Fase 2: Correções Altas (Esta Semana)
```bash
# 4. Proteger /api/functions
# server.js - linha 36
app.get('/api/functions', requireAdmin, async (req, res) => { ... });

# 5. Configurar CORS
# server.js - linha 18
app.use(cors({ origin: [...], credentials: true }));
```

### Fase 3: Melhorias (Este Mês)
```bash
# 6. Expandir trackViolations
# 7. Limpar informações de versão
```

---

## 📈 Score de Segurança

### Antes das Correções: 6.5/10 ⚠️
- ❌ 2 vulnerabilidades críticas
- ❌ 3 vulnerabilidades altas
- ⚠️ 2 vulnerabilidades médias
- ℹ️ 1 vulnerabilidade baixa

### Após Correções Urgentes: 8.0/10 🟢
- ✅ Vulnerabilidades críticas corrigidas
- ✅ Principais vulnerabilidades altas corrigidas
- ⚠️ Algumas vulnerabilidades médias pendentes

### Após Todas as Correções: 9.5/10 🌟
- ✅ Todas as vulnerabilidades corrigidas
- ✅ Sistema de permissões robusto
- ✅ Auditoria completa
- ✅ CORS configurado
- ✅ Sem vazamento de informações

---

## 📝 Notas Finais

**Pontos Positivos:**
- ✅ Sistema de bloqueio automático funcionando
- ✅ Validação de IP com CIDR implementada
- ✅ Geolocalização e logs detalhados
- ✅ Dashboard protegido corretamente

**Pontos de Atenção:**
- ⚠️ Falta de controle granular de permissões em functions
- ⚠️ Exposição desnecessária de informações (Network ID, estrutura)
- ⚠️ CORS totalmente aberto

**Recomendação Final:**
Implementar **Fase 1 (Urgente)** imediatamente para elevar o score de 6.5 para 8.0. As vulnerabilidades críticas encontradas permitem que usuários GUEST modifiquem dados e acessem informações sensíveis da rede.

---

**Próxima Auditoria:** Após implementação das correções (v2.11.0)
