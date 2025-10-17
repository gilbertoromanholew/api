# 🚀 API Modular - Node.js & Express

[![Node.js](https://img.shields.io/badge/Node.js-22.18.0+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Version](https://img.shields.io/badge/Version-2.1.0-blue.svg)](https://github.com/gilbertoromanholew/api)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Online-success.svg)](https://api.samm.host)

> **API REST modular com auto-descoberta de rotas, validação centralizada, dashboard de monitoramento em tempo real, sistema de bloqueio automático de IPs e templates para desenvolvimento rápido.**

**🌐 URL de Produção:** https://api.samm.host

**📚 Documentação Adicional:**
- 🛡️ [Sistema de Bloqueio de IPs](./SISTEMA_BLOQUEIO.md) - Documentação técnica completa
- 📊 [Implementação do Sistema](./IMPLEMENTACAO_BLOQUEIO.md) - Resumo executivo
- 🔍 [Auditoria Completa](./AUDITORIA_COMPLETA.md) - Relatório de auditoria do código

---

## 📋 Índice

- [Características](#-características)
- [Instalação](#-instalação)
- [Início Rápido](#-início-rápido)
- [Arquitetura](#-arquitetura)
- [Endpoints Disponíveis](#-endpoints-disponíveis)
- [Dashboard Interativo](#-dashboard-interativo)
- [Como Criar Nova Funcionalidade](#-como-criar-nova-funcionalidade)
- [Configuração](#-configuração)
- [Segurança](#-segurança)
  - [Sistema de Bloqueio Automático](#️-sistema-de-bloqueio-automático-de-ips)
- [Performance & Otimizações](#-performance--otimizações)
- [ZeroTier VPN - Acesso Seguro](#-zerotier-vpn---acesso-seguro)
- [Novas Implementações](#-novas-implementações-v210)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Licença](#-licença)

---

## ✨ Características

### 🏗️ Arquitetura & Desenvolvimento
- 🎯 **Arquitetura Modular** - Funcionalidades independentes e auto-descobertas
- ⚡ **Auto-carregamento de Rotas** - Descobre e registra rotas automaticamente
- 🛡️ **Validação Centralizada** - Sistema de schemas reutilizáveis
- 🎨 **Respostas Padronizadas** - BaseController para consistência
- 📦 **Sistema de Templates** - Crie novas funcionalidades em 5 minutos
- 🌐 **CORS Habilitado** - Pronto para APIs públicas
- 🚦 **Tratamento Global de Erros** - Error handler centralizado

### 📊 Monitoramento & Documentação
- 📝 **Documentação Automática Interativa** (`/docs`)
  - Interface limpa com seções colapsáveis
  - Detecção automática de IP público
  - Cards de funções clicáveis com exemplos integrados
  - Explorador de API embutido para testes diretos
  - Exemplos de código em múltiplas linguagens
  
- 🎯 **Dashboard de Logs em Tempo Real** (`/logs`)
  - Métricas gerais (requisições, uptime, IPs únicos)
  - Cards de métricas expansíveis (top 3 + ver todos)
  - Estatísticas detalhadas por IP com geolocalização completa
  - Modal com detalhes de IP e auto-refresh (3s)
  - Detecção e pinning do seu IP no topo da lista
  - Logs de acesso recentes com filtros (colapsável por padrão)
  - Paginação inteligente (12 IPs visíveis + expandir)
  - Sistema de cache de geolocalização (24h TTL)
  - Interface escalável para 100+ IPs

### 🔒 Segurança & Performance
- 🔐 **Controle de Acesso por IP com CIDR** - Whitelist inteligente com suporte a ranges
- 🛡️ **Sistema de Bloqueio Automático** - Suspensões temporárias e bloqueios permanentes
  - Suspensão de 1 hora após 5 tentativas não autorizadas
  - Bloqueio permanente após 10 tentativas ou 3 suspensões
  - Dashboard visual para gerenciamento em tempo real
  - API REST para consulta e administração de bloqueios
- 🌍 **Geolocalização Completa** (ip-api.com - 24+ campos):
  - País, cidade, região, CEP, timezone, coordenadas
  - ISP, organização, AS (Sistema Autônomo)
  - Flags de hospedagem, proxy/VPN, rede móvel
  - Cache de 24h para performance
- ⚡ **Cache Inteligente** - Rotas descobertas (5min), geolocalização (24h)
- 📊 **Logs Otimizados** - Estatísticas O(n) em vez de O(n²)
- 🔐 **Suporte a ZeroTier VPN** - Acesso seguro via rede virtual criptografada
- 🏠 **Detecção de Origem** - Identifica localhost, ZeroTier, LAN e WAN

---

## 🔧 Instalação

### Pré-requisitos

- **Node.js** >= 22.18.0
- **npm** >= 10.x

### Passos

1. **Clone o repositório:**

```bash
git clone https://github.com/gilbertoromanholew/api.git
cd api
```

2. **Instale as dependências:**

```bash
npm install
```

3. **Configure as variáveis de ambiente (opcional):**

```bash
cp .env.example .env
# Edite o arquivo .env conforme necessário
```

4. **Inicie o servidor:**

```bash
npm start
```

5. **Acesse a API:**

```
http://localhost:3000
```

---

## 🚀 Início Rápido

### Testar a Documentação

```bash
# Ver documentação JSON
curl http://localhost:3000/

# Acessar documentação HTML interativa
curl http://localhost:3000/docs
```

### Exemplo: Criar Usuário

```bash
# Request
curl -X POST http://localhost:3000/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@example.com",
    "idade": 30,
    "ativo": true
  }'

# Response
{
  "success": true,
  "data": {
    "id": "1",
    "nome": "João Silva",
    "email": "joao@example.com",
    "idade": 30,
    "ativo": true
  }
}
```

### Exemplo: Extrair Texto de PDF

```bash
# Request
curl -X POST http://localhost:3000/read-pdf \
  -H "Content-Type: multipart/form-data" \
  -F "pdf=@documento.pdf"

# Response
{
  "success": true,
  "data": {
    "text": "Conteúdo extraído do PDF...",
    "pages": 5
  }
}
```

---

## 🏗️ Arquitetura

### Auto-carregamento de Rotas

O sistema de **auto-descoberta** escaneia a pasta `src/functions/` e registra automaticamente todas as rotas:

```
src/functions/
  ├── exemplo/
  │   ├── exemploController.js  ← Lógica de negócio
  │   └── exemploRoutes.js      ← Definição de rotas
  └── pdf/
      ├── pdfController.js
      └── pdfRoutes.js
```

**Como funciona:**
1. O `routeLoader.js` busca recursivamente por arquivos `*Routes.js`
2. Cada arquivo de rotas é automaticamente importado e registrado
3. Novas funcionalidades são detectadas sem reiniciar o servidor

### BaseController

Todos os controllers herdam de `BaseController` para garantir respostas padronizadas:

```javascript
class ExemploController extends BaseController {
  async criarUsuario(req, res) {
    const { nome, email, idade, ativo } = req.body;
    
    // Validação já foi feita pelo middleware
    const novoUsuario = {
      id: Date.now().toString(),
      nome,
      email,
      idade,
      ativo: ativo ?? true
    };
    
    return this.created(res, novoUsuario);
  }
}
```

**Métodos disponíveis:**
- `success(res, data)` - 200 OK
- `created(res, data)` - 201 Created
- `badRequest(res, message)` - 400 Bad Request
- `unauthorized(res, message)` - 401 Unauthorized
- `forbidden(res, message)` - 403 Forbidden
- `notFound(res, message)` - 404 Not Found
- `serverError(res, error)` - 500 Internal Server Error

---

## 📚 Endpoints Disponíveis

### 🏠 Root & Documentação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/` | Informações completas da API (JSON) |
| `GET` | `/docs` | Documentação interativa (HTML) |
| `GET` | `/logs` | Dashboard de logs em tempo real (HTML) |

### 🔐 ZeroTier & Status

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/zerotier/status` | Status da rede ZeroTier VPN |
| `GET` | `/zerotier/devices` | Dispositivos conectados (info) |

### 📊 API de Logs

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/logs` | Todos os logs (JSON) |
| `GET` | `/api/logs/stats` | Estatísticas gerais (JSON) |
| `GET` | `/api/logs/ips` | Estatísticas por IP (JSON) |
| `POST` | `/api/logs/clear` | Limpar todos os logs |
| `GET` | `/api/functions` | Funções auto-descobertas (cache 5min) |

### 👥 Usuários (CRUD Completo)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/usuarios` | Lista todos os usuários |
| `GET` | `/usuarios/estatisticas` | Estatísticas dos usuários |
| `GET` | `/usuarios/:id` | Busca usuário por ID |
| `POST` | `/usuarios` | Cria novo usuário |
| `PUT` | `/usuarios/:id` | Atualiza usuário existente |
| `DELETE` | `/usuarios/:id` | Remove usuário |

**Exemplo de corpo para criar usuário:**
```json
{
  "nome": "João Silva",
  "email": "joao@example.com",
  "idade": 30,
  "ativo": true
}
```

**Filtros disponíveis na listagem (`GET /usuarios`):**
- `?ativo=true` - Filtra por status
- `?nome=João` - Busca por nome
- `?email=joao@example.com` - Busca por email

### 📄 PDF

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/read-pdf` | Extrai texto de arquivos PDF |

**Requisição com arquivo:**
```bash
curl -X POST http://localhost:3000/read-pdf \
  -F "pdf=@documento.pdf"
```

---

## 🎨 Como Criar Nova Funcionalidade

### Usando o Template

1. **Copie a pasta template:**

```bash
cp -r src/functions/_TEMPLATE src/functions/minhaFuncao
```

2. **Renomeie os arquivos:**

```bash
cd src/functions/minhaFuncao
mv templateController.js minhaFuncaoController.js
mv templateRoutes.js minhaFuncaoRoutes.js
```

3. **Edite o Controller:**

```javascript
// minhaFuncaoController.js
const BaseController = require('../../core/BaseController');

class MinhaFuncaoController extends BaseController {
  async executar(req, res) {
    try {
      const { parametro } = req.body;
      
      // Sua lógica aqui
      const resultado = this.processar(parametro);
      
      return this.success(res, resultado);
    } catch (error) {
      return this.serverError(res, error);
    }
  }
  
  processar(parametro) {
    // Implementação
    return { resultado: 'sucesso' };
  }
}

module.exports = new MinhaFuncaoController();
```

4. **Configure as Rotas:**

```javascript
// minhaFuncaoRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('./minhaFuncaoController');
const { validate, schemas } = require('../../middlewares/validator');

router.post('/processar', 
  validate(schemas.minhaFuncao),
  (req, res) => controller.executar(req, res)
);

module.exports = router;
```

5. **Reinicie o servidor** - A nova rota será detectada automaticamente!

```bash
npm start
```

6. **Teste sua nova funcionalidade:**

```bash
curl -X POST http://localhost:3000/minhaFuncao/processar \
  -H "Content-Type: application/json" \
  -d '{"parametro": "teste"}'
```

### Estrutura Mínima Obrigatória

Para que o auto-carregamento funcione, você precisa:

✅ **Arquivo de Rotas** (`*Routes.js`)
```javascript
const express = require('express');
const router = express.Router();
module.exports = router;
```

✅ **Arquivo de Controller** (`*Controller.js`)
```javascript
const BaseController = require('../../core/BaseController');
class MeuController extends BaseController {}
module.exports = new MeuController();
```

---

## 🎯 Dashboard Interativo

### 📝 Documentação Interativa (`/docs`)

Acesse **http://localhost:3000/docs** para uma experiência completa:

#### Recursos Principais:
- 📊 **Estatísticas em Tempo Real**
  - Total de requisições
  - Requisições autorizadas
  - IPs únicos conectados
  - Uptime do servidor (atualiza a cada segundo)

- 🔒 **Informações de Acesso** (Colapsável)
  - Detecção automática do seu **IP público real**
  - Status de autorização
  - Informações de segurança
  - User-Agent detectado

- 🔑 **Sistema de Autenticação** (Colapsável)
  - Explicação do filtro de IP
  - Como configurar IPs autorizados
  - Exemplos de configuração

- 📦 **Funções Disponíveis** (Seção Principal)
  - Cards interativos e clicáveis
  - Hover com animação de elevação
  - **Ao clicar em uma função:**
    - 📡 Exemplos de uso aparecem dinamicamente
    - � Explorador de API aparece para teste direto
    - Exemplos em JavaScript, Python, cURL
    - Teste endpoints com body customizado
    - Resposta formatada em JSON
  - Toast notifications para feedback
  - Scroll suave automático

#### Vantagens:
- ✅ Interface ultra-limpa sem scroll infinito
- ✅ Conteúdo sob demanda (clique para expandir)
- ✅ Teste de API integrado
- ✅ Exemplos de código prontos para copiar
- ✅ Zero redundância - tudo em um só lugar

---

## 📊 Dashboard de Logs (`/logs`)

Acesse **http://localhost:3000/logs** para monitoramento avançado:

#### Estatísticas Gerais (Auto-refresh 10s)
- ✅ **Total de Requisições** - Contador global
- ✔️ **Requisições Autorizadas** - Acessos permitidos
- 🌍 **IPs Únicos** - Contagem de visitantes diferentes
- ⏱️ **Uptime do Servidor** - Tempo online

#### Cards de Métricas Expansíveis
Cada card mostra **Top 3** + botão "Ver todos":
- 🔥 **Endpoints Mais Acessados**
- 🌐 **Navegadores Mais Usados** (Chrome, Firefox, Edge, Safari, etc.)
- 💻 **Plataformas Mais Usadas** (Windows, Linux, macOS, Android, etc.)
- 🌍 **Países Mais Frequentes** (com bandeiras)

#### Estatísticas Detalhadas por IP
- 🏠 **Seu IP fixado no topo** com badge "VOCÊ" e borda verde
- **Paginação inteligente:** 12 IPs visíveis + botão "Ver todos"
- **Cards com informações ricas:**
  - Endereço IP + bandeira do país
  - Total de requisições
  - Primeira e última requisição
  - Navegador e plataforma
  - Botão para ver detalhes completos

#### Modal de Detalhes de IP (Auto-refresh 3s)
Ao clicar em um IP, veja:
- 🌍 **Geolocalização Completa:**
  - País, cidade, região/estado, CEP
  - Timezone com relógio
  - Coordenadas geográficas (link para Google Maps)
  
- 🌐 **Informações de Rede:**
  - ISP (Provedor de Internet)
  - Organização proprietária
  - AS (Sistema Autônomo)
  - Badges de alerta: 🏢 Hospedagem, 🔒 Proxy/VPN, 📱 Rede Móvel

- 📊 **Estatísticas de Acesso:**
  - Total de requisições
  - Requisições autorizadas vs negadas
  - Endpoints acessados
  - Navegadores usados
  - Plataformas detectadas

- � **Logs Detalhados (Expansível):**
  - Horário preciso de cada acesso
  - Endpoint requisitado
  - Status de autorização
  - Navegador e plataforma

#### Seção de Logs Recentes (Colapsável)
**Reduzida por padrão** - Clique no título para expandir:
- Tabela com últimos acessos
- **Filtros dinâmicos:**
  - Limite de registros (padrão: 50)
  - Tipo de acesso (todos, autorizados, negados)
  - Filtros aplicam automaticamente (sem botão)
- Paginação "Ver mais" para carregar incrementalmente

#### Sistema de Geolocalização Avançado
- **24+ campos da ip-api.com:**
  - Localização: país, cidade, região, CEP, timezone, coordenadas
  - Rede: ISP, organização, AS (Sistema Autônomo)
  - Segurança: flags de hospedagem, proxy, VPN, rede móvel
- **Cache inteligente:** 24h de validade por IP
- **Performance:** Máximo de 45 requisições/minuto respeitado

#### Recursos Especiais:
- 🔄 **Auto-refresh seletivo:**
  - Stats gerais: 10s
  - Modal aberto: 3s
  - Resto da página: estático
- 🏠 **Detecção automática do seu IP** (pinado no topo)
- 🎨 **Interface escalável** (testada com 100+ IPs)
- 📱 **Design responsivo**
- � **Animações suaves**
- 🔔 **Toast notifications** (máx. 3 simultâneos)
- 🌍 **Bandeiras de países** (emojis nativos)

---

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
PORT=3000
NODE_ENV=production
```

### Configurar IPs Permitidos

Edite `src/config/allowedIPs.js`:

```javascript
module.exports = [
  '127.0.0.1',           // Localhost
  '::1',                 // Localhost IPv6
  '192.168.1.100',       // Seu IP local
  '203.0.113.0/24'       // Range de IPs (CIDR notation)
];
```

### Adicionar Schema de Validação

Edite `src/middlewares/validator.js`:

```javascript
const schemas = {
  cpf: Joi.object({
    cpf: Joi.string().length(11).required()
  }),
  
  // Adicione seu schema
  minhaFuncao: Joi.object({
    parametro: Joi.string().required(),
    opcional: Joi.number().optional()
  })
};
```

---

## 🔒 Segurança

### Controle de Acesso por IP com CIDR

O middleware `ipFilter` bloqueia automaticamente IPs não autorizados com suporte a notação CIDR:

```javascript
// src/config/allowedIPs.js
export const allowedIPs = [
    '127.0.0.1',           // localhost IPv4
    '::1',                 // localhost IPv6
    '10.244.0.0/16',       // ZeroTier Network (65,536 IPs)
    '192.168.1.0/24',      // Rede local (256 IPs)
    ...envIPs              // IPs do .env
];
```

**Validação CIDR:**
- ✅ Suporta ranges de IP (ex: `10.244.0.0/16`)
- ✅ IPs individuais (ex: `192.168.1.100`)
- ✅ IPs do arquivo `.env` (variável `ALLOWED_IPS`)

### 🛡️ Sistema de Bloqueio Automático de IPs

Sistema completo de proteção contra tentativas de acesso não autorizadas com **suspensões temporárias** e **bloqueios permanentes**:

#### Regras de Bloqueio

```
Tentativa 1-4:  ⚠️  AVISO
                "X tentativas restantes antes da suspensão"

Tentativa 5:    ⏳  SUSPENSÃO TEMPORÁRIA (1 hora)
                HTTP 429 - "IP suspenso por 60 minutos"

Tentativa 10:   🚫  BLOQUEIO PERMANENTE
                HTTP 403 - "IP permanentemente bloqueado"
                
OU

3 Suspensões:   🚫  BLOQUEIO PERMANENTE
                HTTP 403 - "IP bloqueado após 3 suspensões"
```

#### Configuração Padrão

- **5 tentativas** → Suspensão temporária (1 hora)
- **10 tentativas** → Bloqueio permanente direto
- **3 suspensões** → Bloqueio permanente
- **Cache em memória** (Map/Set para performance)

#### Endpoints de Gerenciamento

```bash
# Estatísticas gerais
GET /api/security/stats

# Listar IPs bloqueados/suspensos/avisos
GET /api/security/blocked
GET /api/security/suspended
GET /api/security/warnings

# Verificar IP específico
GET /api/security/check/:ip

# Desbloquear IP (admin)
POST /api/security/unblock/:ip

# Remover suspensão (admin)
POST /api/security/unsuspend/:ip

# Obter todos os dados
GET /api/security/all
```

#### Dashboard Visual

Acesse **http://localhost:3000/logs** e expanda a seção **"🛡️ Sistema de Segurança"**:

- 📊 Estatísticas em tempo real (bloqueados/suspensos/avisos)
- 🎯 Sistema de tabs moderno (Bloqueados/Suspensos/Avisos)
- 🎨 Cards visuais com ícones e detalhes completos
- ⚡ Auto-refresh a cada 10 segundos
- 🔧 Botões de gerenciamento (desbloquear/remover suspensão)
- ⚙️ Visualização das regras configuradas

**Recursos de Segurança:**
- 🚫 Não revela como se conectar à API
- 📝 Todos os acessos negados são logados
- ⚠️ Mensagens progressivas (aviso → suspensão → bloqueio)
- 🔐 Sem exposição de informações da rede interna
- ⏰ Suspensões temporárias expiram automaticamente
- 🛠️ Gerenciamento completo via dashboard ou API
- 🎯 Bloqueio inteligente baseado em padrões de comportamento

**Documentação Completa:** Ver [SISTEMA_BLOQUEIO.md](./SISTEMA_BLOQUEIO.md)

### Geolocalização de IPs (24+ campos)

Cada acesso é enriquecido com dados completos de geolocalização (cache 24h):

```javascript
{
  ip: '203.0.113.42',
  country: 'Brazil',
  city: 'São Paulo',
  countryCode: 'BR',
  region: 'SP',
  regionName: 'São Paulo',
  isp: 'Example ISP',
  org: 'Example Organization',
  as: 'AS12345 Example AS',
  timezone: 'America/Sao_Paulo',
  lat: -23.5505,
  lon: -46.6333,
  hosting: false,  // É servidor de hospedagem?
  proxy: false,    // É proxy/VPN?
  mobile: false    // É rede móvel?
}
```

### Utilitários Centralizados (ipUtils.js)

Todas as funções de IP estão centralizadas para evitar duplicação:

```javascript
// src/utils/ipUtils.js
export function getClientIP(req) { /* ... */ }
export function cleanIP(ip) { /* ... */ }
export function isIPInRange(ip, cidr) { /* ... */ }
export function getConnectionOrigin(ip) { /* ... */ }
```

**API usada:** ip-api.com (gratuita, 45 req/min)  
**Cache:** 24 horas por IP

---

## ⚡ Performance & Otimizações

### Cache Inteligente

**Geolocalização (24h TTL):**
```javascript
// Cache em memória com Map
const geoCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas
```
- ✅ Reduz chamadas à API externa de 45 req/min
- ✅ Primeira requisição: ~50-100ms
- ✅ Requisições subsequentes: ~1-2ms (cache hit)

**Rotas Descobertas (5min TTL):**
```javascript
// Cache de funções auto-descobertas
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
```
- ✅ Evita regex repetido em cada requisição
- ✅ Primeira chamada: ~50-100ms (leitura de arquivos)
- ✅ Chamadas seguintes: ~1-2ms (cache)
- ✅ Auto-atualização a cada 5 minutos

### Otimização O(n²) → O(n)

**Estatísticas de IP otimizadas:**

Antes (O(n²) - lento com muitos logs):
```javascript
// ❌ Iterava todos os logs para cada IP
stats.forEach(ip => {
  logs.forEach(log => { /* ... */ });
});
```

Depois (O(n) - 1000x mais rápido):
```javascript
// ✅ Uma única passada usando Map
const stats = new Map();
for (const log of this.logs) {
  // Agregação em O(1)
}
```

**Ganho de Performance:**
- Com 1000 logs: De ~1.000.000 operações → 1.000 operações
- **1000x mais rápido** 🚀

### Código Sem Duplicação

**Antes:** Lógica de IP duplicada em 4 arquivos  
**Depois:** Centralizada em `src/utils/ipUtils.js`

**Redução:** 75% menos código duplicado  
**Manutenção:** 4x mais fácil (1 lugar em vez de 4)

### CORS

CORS está habilitado por padrão para todos os origins:

```javascript
app.use(cors());
```

Para restringir origins, edite `server.js`:

```javascript
app.use(cors({
  origin: ['https://meusite.com', 'https://api.meusite.com']
}));
```

---

## � ZeroTier VPN - Acesso Seguro

### O que é ZeroTier?

**ZeroTier** é uma VPN moderna que cria redes virtuais criptografadas peer-to-peer (P2P), permitindo que dispositivos em qualquer lugar do mundo se conectem como se estivessem na mesma rede local.

#### Vantagens sobre VPNs Tradicionais:
- 🔐 **Criptografia Ponta-a-Ponta** - Tráfego totalmente criptografado
- 🌐 **Peer-to-Peer** - Conexão direta entre dispositivos (quando possível)
- 🚀 **Baixa Latência** - Roteamento otimizado automaticamente
- 📱 **Multi-Plataforma** - Windows, Mac, Linux, iOS, Android
- 🎯 **Controle Granular** - Autorização por dispositivo individual
- 🆓 **Gratuito** - Até 25 dispositivos (plano gratuito)

### Como Funciona na API?

A API usa ZeroTier para controle de acesso em nível de dispositivo:

```
┌─────────────┐                  ┌──────────────┐
│   Seu PC    │  ←─ ZeroTier ─→  │ Servidor API │
│ 10.244.229.5│     (VPN)         │ 10.244.43.196│
└─────────────┘                  └──────────────┘
      ↓                                  ↓
  Autorizado                        Autorizado
      ↓                                  ↓
✅ Acesso Garantido            ✅ API Acessível
```

### Configuração da Rede ZeroTier

**Range de IPs:** `10.244.0.0/16` (65,536 endereços disponíveis)

```javascript
// src/config/allowedIPs.js
export const allowedIPs = [
    '127.0.0.1',           // localhost IPv4
    '::1',                 // localhost IPv6
    '10.244.0.0/16',       // ✅ ZeroTier Network (todos os dispositivos autorizados)
    ...envIPs              // IPs adicionais do .env
];
```

**Validação CIDR Inteligente:**
- ✅ Todo IP no range `10.244.0.0/16` é automaticamente autorizado
- ✅ Suporta até 65.536 dispositivos diferentes
- ✅ Autorização gerenciada pelo dashboard ZeroTier

### Detecção Automática de ZeroTier

O middleware `ipFilter` detecta automaticamente quando um cliente está conectado via ZeroTier:

```javascript
// src/utils/ipUtils.js
export function getConnectionOrigin(ip) {
    if (ip.startsWith('10.244.')) {
        return {
            type: 'zerotier',
            network: 'ZeroTier VPN',
            icon: '🔐',
            color: 'green'
        };
    }
    // ... outras detecções
}
```

**Logs Amigáveis:**
```
================================================================================
🔐 IP FILTER - CLIENT ACCESS ATTEMPT
================================================================================
⏰ Time: 2025-10-17T12:00:00.000Z

📍 IP ANALYSIS:
   🎯 Detected (used for auth): 10.244.229.5
   🔐 Origin: ZeroTier VPN (zerotier)

🔐 ZEROTIER INFO:
   Network: fada62b01530e6b6
   Range: 10.244.0.0/16
   Security: Encrypted P2P connection

✅ AUTHORIZATION: ✅ YES - ACCESS GRANTED
================================================================================
```

### Endpoints ZeroTier

#### GET `/zerotier/status`
Retorna informações sobre a conexão ZeroTier do cliente:

```json
{
  "success": true,
  "client": {
    "ip": "10.244.229.5",
    "isZeroTier": true,
    "network": "ZeroTier VPN (10.244.0.0/16)",
    "authorized": true,
    "icon": "🔐"
  },
  "server": {
    "zerotierNetwork": {
      "networkId": "fada62b01530e6b6",
      "networkName": "API Private Network",
      "range": "10.244.0.0/16",
      "features": [
        "Criptografia ponta-a-ponta",
        "Controle de acesso por dispositivo",
        "IP fixo independente da rede física",
        "Baixa latência (P2P quando possível)"
      ]
    }
  },
  "message": "🔐 Conectado via ZeroTier - Conexão segura e criptografada!"
}
```

#### GET `/zerotier/devices`
Informações sobre dispositivos (simulado):

```json
{
  "success": true,
  "network": {
    "id": "fada62b01530e6b6",
    "name": "API Private Network",
    "range": "10.244.0.0/16"
  },
  "note": "Para ver a lista completa de dispositivos, acesse: https://my.zerotier.com/",
  "yourIP": "10.244.229.5"
}
```

### Benefícios de Usar ZeroTier

1. **Segurança em Múltiplas Camadas:**
   - ✅ VPN criptografada (criptografia de transporte)
   - ✅ Controle de acesso por dispositivo (autorização)
   - ✅ IP whitelist com CIDR (validação)

2. **Flexibilidade:**
   - ✅ Acesse de qualquer lugar do mundo
   - ✅ IP fixo mesmo mudando de rede física
   - ✅ Suporte a dispositivos móveis (iOS/Android)

3. **Performance:**
   - ✅ Conexão P2P direta quando possível
   - ✅ Baixa latência (geralmente <50ms)
   - ✅ Sem gargalo de servidor VPN central

4. **Facilidade de Gerenciamento:**
   - ✅ Dashboard web para gerenciar dispositivos
   - ✅ Autorização/revogação instantânea
   - ✅ Visibilidade de todos os dispositivos conectados

### Documentação Adicional

Para documentação completa sobre a implementação ZeroTier, consulte:

- **Setup Guide:** `ZEROTIER_SETUP.md` (guia de instalação detalhado)
- **Implementation:** `IMPLEMENTACAO_ZEROTIER_COMPLETA.md` (detalhes técnicos)
- **Planning:** `PLANO_IMPLEMENTACAO_ZEROTIER.md` (planejamento em 5 fases)

---

## 🆕 Novas Implementações (v2.1.0+)

### ⚡ Otimizações de Performance

1. **Cache Inteligente de Rotas (5min TTL)**
   - GET `/api/functions` agora usa cache
   - Primeira chamada: ~50-100ms
   - Chamadas subsequentes: ~1-2ms (50x mais rápido)

2. **Estatísticas de IP Otimizadas (O(n²) → O(n))**
   - `getIPStats()` reescrito com Map
   - 1000x mais rápido com 1000+ logs
   - Uso de `for...of` em vez de `forEach`

3. **Cache de Geolocalização (24h TTL)**
   - Reduz chamadas à API externa
   - Respeita limite de 45 req/min
   - Performance consistente

### 🧹 Refatoração e Limpeza de Código

1. **Utilitários Centralizados (`ipUtils.js`)**
   - `getClientIP(req)` - Extração de IP real
   - `cleanIP(ip)` - Limpeza de prefixos IPv6
   - `isIPInRange(ip, cidr)` - Validação CIDR
   - `getConnectionOrigin(ip)` - Detecção de origem
   - **Redução:** 75% menos código duplicado

2. **Correção de Bugs Críticos**
   - ✅ Bug em `allowedIPs.js` (spread operator comentado)
   - ✅ Caminho incorreto de `pdfParseWrapper.cjs`
   - ✅ Dependências circulares eliminadas

### 🔒 Melhorias de Segurança

1. **Proteção Anti-Hacking**
   - Mensagens de advertência para IPs não autorizados
   - Sem exposição de informações sensíveis
   - Logging de todas as tentativas de acesso

2. **Resposta Rica para Autorizados**
   - GET `/` expandido de 5 para 40+ campos
   - Informações de API, cliente, IP, features
   - Quick links mantidos e expandidos

3. **Suporte a CIDR Nativo**
   - Validação de ranges de IP (ex: `10.244.0.0/16`)
   - Suporta IPv4 com máscaras de rede
   - Algoritmo otimizado de validação

---

## �📁 Estrutura do Projeto

```
api/
├── src/
│   ├── config/              # Configurações centralizadas
│   │   ├── allowedIPs.js    # Lista de IPs permitidos
│   │   └── index.js         # Exportador de configs
│   │
│   ├── core/                # Componentes centrais
│   │   ├── BaseController.js  # Controller base
│   │   └── routeLoader.js     # Auto-carregador de rotas
│   │
│   ├── functions/           # Funcionalidades modulares
│   │   ├── _TEMPLATE/       # Template para novas funcionalidades
│   │   │   ├── templateController.js
│   │   │   ├── templateRoutes.js
│   │   │   ├── templateUtils.js
│   │   │   └── README.md
│   │   │
│   │   ├── exemplo/         # Exemplo (CRUD de usuários)
│   │   │   ├── exemploController.js
│   │   │   └── exemploRoutes.js
│   │   │
│   │   └── pdf/             # Processamento de PDFs
│   │       ├── pdfController.js
│   │       ├── pdfRoutes.js
│   │       ├── pdfParseWrapper.cjs  # Wrapper CommonJS (modular)
│   │       └── README.md
│   │
│   ├── middlewares/         # Middlewares globais
│   │   ├── errorHandler.js  # Tratamento de erros
│   │   ├── ipFilter.js      # Filtro de IP + geolocalização
│   │   └── validator.js     # Validação de schemas
│   │
│   ├── routes/              # Rotas especiais
│   │   ├── docs.js          # Documentação HTML interativa
│   │   ├── index.js         # Rota raiz (JSON)
│   │   ├── logsDashboard.js # Dashboard de logs em tempo real
│   │   ├── logsRoutes.js    # API de logs (com cache)
│   │   ├── securityRoutes.js # API de segurança (bloqueios)
│   │   └── zerotier.js      # Status ZeroTier VPN
│   │
│   └── utils/               # Utilitários genéricos
│       ├── accessLogger.js  # Logger de acessos (otimizado O(n))
│       ├── ipUtils.js       # Utilitários de IP (CIDR, detecção)
│       └── ipBlockingSystem.js  # Sistema de bloqueio automático
│
├── server.js                # Entry point
├── package.json             # Dependências (v2.1.0)
├── README.md                # Documentação principal
├── SISTEMA_BLOQUEIO.md      # Documentação do sistema de bloqueio
├── IMPLEMENTACAO_BLOQUEIO.md # Resumo executivo da implementação
└── AUDITORIA_COMPLETA.md    # Relatório de auditoria
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga estes passos:

1. **Fork o projeto**
2. **Crie uma branch para sua feature:**
   ```bash
   git checkout -b feature/minha-feature
   ```
3. **Commit suas mudanças:**
   ```bash
   git commit -m 'Adiciona minha feature'
   ```
4. **Push para a branch:**
   ```bash
   git push origin feature/minha-feature
   ```
5. **Abra um Pull Request**

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🎉 Créditos

Desenvolvido com ❤️ por [Gilberto Roman Holew](https://github.com/gilbertoromanholew)

**URL de Produção:** https://api.samm.host

---

## 📞 Suporte

Encontrou algum problema? Abra uma [issue](https://github.com/gilbertoromanholew/api/issues) no GitHub.

---

**⭐ Se este projeto foi útil, deixe uma estrela no GitHub!**
