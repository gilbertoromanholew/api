# 🤖 Instruções para IA - API Modular

> **Documento para IAs que vão trabalhar neste projeto**  
> **Versão:** 2.13.0  
> **Última atualização:** 17 de Janeiro de 2025  
> **Criado por:** GitHub Copilot

---

## 📋 Índice

1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Arquitetura e Conceitos](#arquitetura-e-conceitos)
3. [Sistema de Permissões](#sistema-de-permissões)
4. [O QUE VOCÊ PODE MODIFICAR](#o-que-você-pode-modificar)
5. [O QUE VOCÊ NÃO PODE MODIFICAR](#o-que-você-não-pode-modificar)
6. [Como Adicionar Novas Funcionalidades](#como-adicionar-novas-funcionalidades)
7. [Padrões de Código Obrigatórios](#padrões-de-código-obrigatórios)
8. [Sistema de Segurança](#sistema-de-segurança)
9. [Logging e Monitoramento](#logging-e-monitoramento)
10. [Troubleshooting](#troubleshooting)

---

## 📖 Visão Geral do Projeto

### O que é esta API?

Uma **API REST modular** construída em Node.js + Express com:

- ✅ **Auto-descoberta de rotas** - Novas funcionalidades são carregadas automaticamente
- ✅ **Sistema de segurança avançado** - Whitelist de IPs, bloqueios, suspensões automáticas
- ✅ **Dashboard de monitoramento** - Interface web em tempo real com filtros avançados
- ✅ **Hierarquia de permissões** - GUEST, TRUSTED, ADMIN
- ✅ **BaseController** - Respostas padronizadas e tratamento de erros centralizado
- ✅ **Geolocalização** - Tracking completo de IPs com 24+ campos

### Estrutura de Diretórios

```
api/
├── server.js                    # ❌ NÃO MODIFICAR - Entry point
├── .env                         # ⚠️ Configurações sensíveis
├── package.json                 # ⚠️ Só atualizar versão
│
├── src/
│   ├── config/                  # ❌ NÃO MODIFICAR
│   │   ├── allowedIPs.js        # Sistema de whitelist + permissões
│   │   └── index.js             # Configurações globais
│   │
│   ├── core/                    # ❌ NÃO MODIFICAR
│   │   ├── BaseController.js    # Classe base para controllers
│   │   └── routeLoader.js       # Auto-descoberta de rotas
│   │
│   ├── functions/               # ✅ VOCÊ PODE ADICIONAR AQUI
│   │   ├── _TEMPLATE/           # Template para novas functions
│   │   ├── exemplo/             # Exemplo de CRUD
│   │   └── pdf/                 # Parser de PDFs
│   │
│   ├── middlewares/             # ⚠️ MODIFICAR COM CUIDADO
│   │   ├── accessLevel.js       # Hierarquia de permissões
│   │   ├── errorHandler.js      # Tratamento de erros global
│   │   ├── ipFilter.js          # Filtro de IPs (whitelist)
│   │   └── validator.js         # Validação de dados
│   │
│   ├── routes/                  # ⚠️ MODIFICAR COM CUIDADO
│   │   ├── docs.js              # Documentação interativa
│   │   ├── logsDashboard.js     # Dashboard de logs
│   │   ├── logsRoutes.js        # API de logs
│   │   └── securityRoutes.js    # API de segurança
│   │
│   └── utils/                   # ⚠️ MODIFICAR COM CUIDADO
│       ├── accessLogger.js      # Sistema de logging
│       └── pdfParseWrapper.cjs  # Wrapper para pdf-parse
```

---

## 🏗️ Arquitetura e Conceitos

### 1. Auto-descoberta de Rotas (`routeLoader.js`)

O sistema **automaticamente** carrega qualquer pasta em `src/functions/` que contenha:
- `*Routes.js` - Arquivo de rotas
- `*Controller.js` - Lógica de negócio

**Como funciona:**

```javascript
// routeLoader.js escaneia src/functions/
src/functions/
├── exemplo/
│   ├── exemploRoutes.js   ← Detectado automaticamente
│   └── exemploController.js
└── minhaFeature/
    ├── minhaFeatureRoutes.js   ← Sua nova feature (será detectada!)
    └── minhaFeatureController.js
```

**Resultado:**
- `/api/exemplo/*` → Rotas de exemplo
- `/api/minhaFeature/*` → Suas novas rotas

### 2. BaseController (Padrão Obrigatório)

**TODOS** os controllers **DEVEM** estender `BaseController`:

```javascript
import { BaseController } from '../../core/BaseController.js';

class MeuController extends BaseController {
    async meuMetodo(req, res) {
        return this.execute(req, res, async (req, res) => {
            // Sua lógica aqui
            const resultado = { dados: '...' };
            
            // ✅ Use this.success() para sucesso
            return this.success(res, resultado, 'Operação concluída');
            
            // ❌ NÃO use res.json() diretamente!
        });
    }
}

export default new MeuController();
```

**Métodos disponíveis:**
- `this.execute(req, res, asyncFn)` - Executa com tratamento automático de erros
- `this.success(res, data, message, statusCode)` - Resposta de sucesso padronizada
- `this.error(res, message, statusCode)` - Resposta de erro padronizada

### 3. Sistema de Validação

Use o middleware `validate()` para validar dados de entrada:

```javascript
import { validate } from '../../middlewares/validator.js';

const meuSchema = {
    required: ['nome', 'email'],
    types: {
        nome: 'string',
        email: 'string',
        idade: 'number'
    },
    length: {
        nome: { min: 3, max: 100 },
        email: { min: 5, max: 255 }
    },
    enum: {
        tipo: ['A', 'B', 'C']
    }
};

router.post('/rota', validate(meuSchema), controller.metodo);
```

---

## 🔒 Sistema de Permissões

### Hierarquia de Acesso (v2.12.0+)

| Nível | Acesso | Bloqueios |
|-------|--------|-----------|
| **UNAUTHORIZED** ❌ | Nada | Tudo bloqueado |
| **GUEST** 👁️ | Apenas `/docs` | Não pode usar functions |
| **TRUSTED** 📝 | `/docs` + **TODAS as functions** | Não pode acessar `/logs`, `/api/logs`, `/api/security`, `/zerotier` |
| **ADMIN** 🔑 | **Tudo** sem restrições | Nenhum |

### Como Funciona o Controle de Acesso

**3 fontes de permissões:**

1. **IPs Permanentes** (admin) - `src/config/allowedIPs.js`
   ```javascript
   permanent: ['192.168.1.1', '10.0.0.0/24']  // ADMIN
   ```

2. **IPs do .env** (trusted) - Variável `ALLOWED_IPS_TRUSTED`
   ```env
   ALLOWED_IPS_TRUSTED=192.168.1.100,192.168.1.101
   ```

3. **IPs Dinâmicos** (guest/trusted) - Autorizados via `/api/security/authorize-ip`
   ```json
   { "ip": "203.0.113.1", "level": "guest", "reason": "Teste" }
   ```

### Middleware Stack (NÃO MODIFICAR A ORDEM!)

```javascript
// server.js - ORDEM IMPORTANTÍSSIMA!
app.use(cors(corsOptions));         // 1. CORS
app.use(ipFilter);                  // 2. Valida IP + define req.ip_detected
app.use(validateRouteAccess);       // 3. Valida permissões por rota
app.use(trackViolations);           // 4. Rastreia tentativas negadas
```

**⚠️ NUNCA altere esta ordem! O sistema depende disso.**

---

## ✅ O QUE VOCÊ PODE MODIFICAR

### 1. Adicionar Novas Functions em `src/functions/`

**Permitido:**
- ✅ Criar novas pastas em `src/functions/`
- ✅ Adicionar `*Controller.js` e `*Routes.js`
- ✅ Adicionar `*Utils.js` (opcional)
- ✅ Copiar template de `src/functions/_TEMPLATE/`

**Exemplo:**
```bash
# Copiar template
Copy-Item -Path "src/functions/_TEMPLATE" -Destination "src/functions/qrcode" -Recurse

# Renomear arquivos
Rename-Item "templateController.js" "qrcodeController.js"
Rename-Item "templateRoutes.js" "qrcodeRoutes.js"

# Implementar lógica
# ... (editar qrcodeController.js e qrcodeRoutes.js)
```

### 2. Adicionar Dependências no `package.json`

**Permitido:**
- ✅ Adicionar novas dependências (`npm install pacote`)
- ✅ Atualizar versões de dependências (com cautela)
- ✅ Atualizar campo `version` para refletir mudanças

**Exemplo:**
```bash
npm install qrcode
```

```json
// package.json
{
  "version": "2.14.0",  // ✅ Incrementar versão
  "dependencies": {
    "qrcode": "^1.5.3"  // ✅ Nova dependência
  }
}
```

### 3. Adicionar Estilos/Scripts no Dashboard

**Permitido (com cuidado):**
- ✅ Adicionar novos estilos CSS em `src/routes/logsDashboard.js`
- ✅ Adicionar funcionalidades JavaScript no dashboard
- ⚠️ **MAS:** Não quebre a estrutura existente

### 4. Adicionar Documentação

**Permitido:**
- ✅ Criar/atualizar READMEs nas suas functions
- ✅ Atualizar `CHANGELOG.md`
- ✅ Adicionar exemplos de uso

---

## ❌ O QUE VOCÊ NÃO PODE MODIFICAR

### 🚫 PROIBIDO ABSOLUTAMENTE:

#### 1. Arquivos Core (NUNCA TOQUE!)

```
❌ src/core/BaseController.js
❌ src/core/routeLoader.js
❌ server.js (entry point)
```

**Razão:** Estes arquivos são a base de todo o sistema. Modificá-los pode quebrar TUDO.

#### 2. Sistema de Segurança

```
❌ src/config/allowedIPs.js (estrutura)
❌ src/middlewares/ipFilter.js
❌ src/middlewares/accessLevel.js
```

**Razão:** O sistema de segurança é crítico. Qualquer erro pode expor dados sensíveis.

**⚠️ Você pode:**
- Adicionar IPs em `allowedIPs.permanent` (se souber o que está fazendo)
- Mas **NÃO PODE** mudar a lógica de validação

#### 3. Middlewares Globais

```
❌ src/middlewares/errorHandler.js
❌ src/middlewares/validator.js (lógica de validação)
```

**Razão:** Afetam toda a aplicação. Mudanças podem quebrar validações existentes.

#### 4. Sistema de Logging

```
❌ src/utils/accessLogger.js
❌ src/routes/logsRoutes.js (rotas de logs)
❌ src/routes/logsDashboard.js (estrutura principal)
```

**Razão:** O dashboard de logs é complexo (5500+ linhas). Modificações podem quebrar filtros, gráficos, etc.

**⚠️ Você pode:**
- Adicionar novos estilos CSS (com cuidado)
- Adicionar novos filtros (seguindo o padrão existente)
- Mas **NÃO PODE** mudar a estrutura de dados de logs

#### 5. Ordem dos Middlewares no `server.js`

```javascript
// ❌ NÃO MUDE ESTA ORDEM!
app.use(cors(corsOptions));
app.use(ipFilter);
app.use(validateRouteAccess);
app.use(trackViolations);
```

**Razão:** A ordem é CRÍTICA. O sistema depende dela.

#### 6. Estrutura de Respostas da API

```javascript
// ❌ NÃO MUDE ESTE FORMATO!
{
    success: true,
    data: { ... },
    message: "...",
    timestamp: "..."
}
```

**Razão:** O frontend (dashboard) depende deste formato exato.

---

## 🚀 Como Adicionar Novas Funcionalidades

### Passo a Passo COMPLETO

#### 1️⃣ Copie o Template

```powershell
# Windows PowerShell
Copy-Item -Path "src/functions/_TEMPLATE" -Destination "src/functions/minhaFeature" -Recurse
cd src/functions/minhaFeature
```

#### 2️⃣ Renomeie os Arquivos

```powershell
Rename-Item "templateController.js" "minhaFeatureController.js"
Rename-Item "templateRoutes.js" "minhaFeatureRoutes.js"
Rename-Item "templateUtils.js" "minhaFeatureUtils.js"  # Opcional
Remove-Item "README.md"  # Delete o README do template
```

#### 3️⃣ Implemente o Controller

```javascript
// minhaFeatureController.js
import { BaseController } from '../../core/BaseController.js';

class MinhaFeatureController extends BaseController {
    
    async listar(req, res) {
        return this.execute(req, res, async (req, res) => {
            // ✅ Sua lógica aqui
            const dados = [{ id: 1, nome: 'Exemplo' }];
            
            // ✅ Retorne usando this.success()
            return this.success(res, dados, 'Listagem concluída');
        });
    }
    
    async criar(req, res) {
        return this.execute(req, res, async (req, res) => {
            const { nome } = req.body;
            
            // Validação manual (se necessário)
            if (!nome) {
                return this.error(res, 'Nome é obrigatório', 400);
            }
            
            const novoItem = { id: Date.now(), nome };
            return this.success(res, novoItem, 'Item criado', 201);
        });
    }
}

export default new MinhaFeatureController();
```

#### 4️⃣ Configure as Routes

```javascript
// minhaFeatureRoutes.js
import { Router } from 'express';
import { validate } from '../../middlewares/validator.js';
import minhaFeatureController from './minhaFeatureController.js';
// import { requireAdmin } from '../../middlewares/accessLevel.js'; // Se precisar

const router = Router();

// Schema de validação
const criarSchema = {
    required: ['nome'],
    types: { nome: 'string' },
    length: { nome: { min: 3, max: 100 } }
};

// ✅ TRUSTED e ADMIN podem acessar (padrão)
router.get('/', minhaFeatureController.listar);
router.post('/', validate(criarSchema), minhaFeatureController.criar);

// 🔒 Se quiser que só ADMIN acesse:
// router.delete('/:id', requireAdmin, minhaFeatureController.deletar);

export default router;
```

#### 5️⃣ (Opcional) Crie Funções Auxiliares

```javascript
// minhaFeatureUtils.js
export function formatarDados(dados) {
    return {
        ...dados,
        timestamp: new Date().toISOString()
    };
}

export function validarCPF(cpf) {
    // Lógica complexa aqui
    return true;
}
```

#### 6️⃣ Teste sua Feature

```bash
# Reinicie o servidor
npm start

# Teste com curl
curl http://localhost:3000/api/minhaFeature

curl -X POST http://localhost:3000/api/minhaFeature `
  -H "Content-Type: application/json" `
  -d '{\"nome\":\"Teste\"}'
```

---

## 📏 Padrões de Código Obrigatórios

### ✅ BOM - Siga este padrão

```javascript
// ✅ Controller estende BaseController
class MeuController extends BaseController {
    async metodo(req, res) {
        // ✅ Use this.execute() para tratamento automático de erros
        return this.execute(req, res, async (req, res) => {
            // ✅ Lógica clara e comentada
            const dados = await minhaFuncao();
            
            // ✅ Use this.success() ou this.error()
            return this.success(res, dados, 'Sucesso');
        });
    }
}

// ✅ Export como instância
export default new MeuController();
```

### ❌ RUIM - Evite este padrão

```javascript
// ❌ NÃO faça controller sem BaseController
class MeuController {
    async metodo(req, res) {
        try {
            // ❌ NÃO use res.json() diretamente
            res.json({ success: true, data: {} });
        } catch (error) {
            // ❌ NÃO faça tratamento manual de erros
            res.status(500).json({ error: error.message });
        }
    }
}
```

### Convenções de Nomenclatura

```javascript
// Arquivos
minhaFeatureController.js  // camelCase com sufixo
minhaFeatureRoutes.js
minhaFeatureUtils.js

// Classes
class MinhaFeatureController extends BaseController { }  // PascalCase

// Funções e variáveis
const minhaVariavel = 'valor';  // camelCase
function minhaFuncao() { }       // camelCase

// Constantes
const API_URL = 'https://...';   // UPPER_SNAKE_CASE
```

---

## 🔐 Sistema de Segurança

### Whitelist de IPs (Como Funciona)

**3 níveis de whitelist:**

1. **Permanent (ADMIN)** - `src/config/allowedIPs.js`
   ```javascript
   permanent: [
       '127.0.0.1',
       '::1',
       '172.22.0.0/16',  // Suporta CIDR
       '10.0.0.1'
   ]
   ```

2. **From Env (TRUSTED)** - `.env`
   ```env
   ALLOWED_IPS_TRUSTED=192.168.1.100,192.168.1.101,192.168.1.0/24
   ```

3. **Dynamic (GUEST/TRUSTED)** - Via API
   ```bash
   curl -X POST http://localhost:3000/api/security/authorize-ip \
     -H "Content-Type: application/json" \
     -d '{"ip":"203.0.113.1","level":"guest","reason":"Teste"}'
   ```

### Sistema de Bloqueios Automáticos

**Progressão de bloqueios:**

1. **5 tentativas negadas** → ⚠️ **Warning** (aviso)
2. **10 tentativas negadas** → ⏳ **Suspensão de 15 minutos**
3. **3 suspensões** → 🚫 **Bloqueio permanente**

**Códigos importantes:**
- `src/middlewares/ipFilter.js` - Lógica de bloqueio
- `src/utils/accessLogger.js` - Tracking de tentativas

### Rotas Protegidas

**Apenas ADMIN pode acessar:**
```javascript
// server.js
app.use('/api/logs', requireAdmin, logsRoutes);
app.use('/zerotier', requireAdmin, zerotierRoutes);
app.use('/api/security', requireAdmin, securityRoutes);
```

**TRUSTED e ADMIN podem acessar:**
```javascript
// Todas as rotas em src/functions/*
// O middleware validateRouteAccess cuida disso automaticamente
```

---

## 📊 Logging e Monitoramento

### Como o Sistema de Logs Funciona

**1. Logging Automático:**
- Toda requisição é registrada automaticamente
- 5000 logs mantidos em memória (circular buffer)
- Dados incluem: IP, método, endpoint, status, geolocalização (24+ campos)

**2. Dashboard em Tempo Real:**
- Interface web em `/logs` (apenas ADMIN)
- Auto-refresh a cada 15 segundos
- Filtros avançados: quantidade, status, método, endpoint, IP
- Cards de IPs com badges de nível (ADMIN/TRUSTED/GUEST)

**3. Geolocalização:**
```javascript
// Dados armazenados por log:
{
    ip_detected: '203.0.113.1',
    country: 'Brazil',
    countryCode: 'BR',
    city: 'São Paulo',
    region: 'SP',
    regionName: 'São Paulo',
    isp: 'Example ISP',
    org: 'Example Organization',
    as: 'AS12345',
    lat: -23.5505,
    lon: -46.6333,
    timezone: 'America/Sao_Paulo',
    zip: '01310-100',
    hosting: false,
    proxy: false,
    mobile: false
}
```

### Não Modifique os Logs!

**❌ Não faça:**
- Mudar a estrutura de dados dos logs
- Modificar o circular buffer
- Alterar o sistema de geolocalização

**✅ Você pode:**
- Adicionar novos filtros no dashboard (seguindo o padrão)
- Adicionar novos gráficos/estatísticas
- Criar novas visualizações dos dados existentes

---

## 🐛 Troubleshooting

### Problema: "Rota não encontrada (404)"

**Causas comuns:**
1. Arquivo não termina com `Routes.js`
2. Falta `export default router` no final
3. Servidor não foi reiniciado

**Solução:**
```bash
# Verifique o nome do arquivo
ls src/functions/minhaFeature/

# Deve ter: minhaFeatureRoutes.js (não routes.js)

# Reinicie o servidor
npm start
```

### Problema: "Erro de validação"

**Causas comuns:**
1. Schema incorreto
2. Campos obrigatórios faltando
3. Tipos de dados errados

**Solução:**
```javascript
// Verifique o schema
const schema = {
    required: ['nome'],  // ✅ Campo obrigatório
    types: {
        nome: 'string',  // ✅ Tipo correto
        idade: 'number'  // ✅ number, não Number
    }
};
```

### Problema: "IP bloqueado"

**Causas comuns:**
1. IP não está na whitelist
2. IP teve muitas tentativas negadas
3. IP está suspenso/bloqueado

**Solução:**
```bash
# Verificar status do IP
curl http://localhost:3000/api/security/ip-status/203.0.113.1

# Autorizar IP temporariamente (como ADMIN)
curl -X POST http://localhost:3000/api/security/authorize-ip \
  -H "Content-Type: application/json" \
  -d '{"ip":"203.0.113.1","level":"guest","reason":"Teste"}'
```

### Problema: "Middleware validateRouteAccess bloqueando"

**Causas comuns:**
1. Nível de acesso insuficiente
2. IP não reconhecido
3. Rota administrativa sendo acessada por TRUSTED

**Solução:**
```javascript
// Verifique o nível necessário
// GUEST: só /docs
// TRUSTED: functions
// ADMIN: tudo

// Se sua rota deve ser acessível para TRUSTED, NÃO adicione requireAdmin
router.get('/rota', controller.metodo);  // ✅ TRUSTED pode acessar

// Se deve ser só para ADMIN:
router.get('/rota', requireAdmin, controller.metodo);  // 🔒 Só ADMIN
```

---

## 📝 Checklist para Adicionar Nova Feature

Antes de considerar sua feature pronta:

- [ ] Controller estende `BaseController`
- [ ] Usa `this.execute()`, `this.success()`, `this.error()`
- [ ] Routes usa `validate()` para validação
- [ ] Nomes de arquivos seguem padrão: `*Controller.js`, `*Routes.js`
- [ ] Export correto: `export default new MeuController()`
- [ ] Testado com diferentes níveis de acesso (GUEST, TRUSTED, ADMIN)
- [ ] README.md do template foi deletado
- [ ] Código comentado e documentado
- [ ] Servidor reiniciado e testado
- [ ] Nenhum arquivo core foi modificado
- [ ] Versão do `package.json` atualizada (se necessário)

---

## 🎯 Resumo Executivo para IA

### ✅ FAÇA:

1. **Adicionar functions** em `src/functions/` seguindo o template
2. **Usar BaseController** sempre
3. **Validar dados** com middleware `validate()`
4. **Seguir padrões** de nomenclatura e estrutura
5. **Testar** com diferentes níveis de acesso
6. **Documentar** suas mudanças

### ❌ NÃO FAÇA:

1. **Modificar arquivos core** (`src/core/*`, `server.js`)
2. **Mudar sistema de segurança** (whitelist, bloqueios)
3. **Alterar ordem de middlewares** no `server.js`
4. **Usar `res.json()` diretamente** (use BaseController)
5. **Quebrar estrutura de logs** (formato de dados)
6. **Mudar hierarquia de permissões** (GUEST/TRUSTED/ADMIN)

### 🎯 Regra de Ouro:

> **"Se não tem certeza se pode modificar, NÃO MODIFIQUE!"**
> 
> Adicione novas funcionalidades em `src/functions/` seguindo o template.
> Deixe o core intocado.

---

## 📞 Contato e Suporte

- **Repositório:** https://github.com/gilbertoromanholew/api
- **Documentação:** http://localhost:3000/docs
- **Dashboard:** http://localhost:3000/logs
- **Template:** `src/functions/_TEMPLATE/README.md`

---

**Última atualização:** 17 de Janeiro de 2025  
**Versão do documento:** 1.0.0  
**Criado por:** GitHub Copilot  
**Mantido por:** Gilberto Silva
