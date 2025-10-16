# 🚀 API Modular - Node.js & Express

[![Node.js](https://img.shields.io/badge/Node.js-22.18.0+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Online-success.svg)](https://api.samm.host)

> **API REST modular com auto-descoberta de rotas, validação centralizada, dashboard de monitoramento em tempo real e sistema de templates para desenvolvimento rápido.**

**🌐 URL de Produção:** https://api.samm.host

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
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Licença](#-licença)

---

## ✨ Características

### 🏗️ Arquitetura & Desenvolvimento
- 🎯 **Arquitetura Modular** - Funcionalidades independentes e auto-descobertas
- ⚡ **Auto-carregamento de Rotas** - Descobre e registra rotas automaticamente
- 🛡️ **Validação Centralizada** - Sistema de schemas reutilizáveis
- 🎨 **Respostas Padronizadas** - BaseController para consistência
- � **Sistema de Templates** - Crie novas funcionalidades em 5 minutos
- 🌐 **CORS Habilitado** - Pronto para APIs públicas
- 🚦 **Tratamento Global de Erros** - Error handler centralizado

### 📊 Monitoramento & Documentação
- �📝 **Documentação Automática Interativa** (`/docs`)
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

### 🔒 Segurança & Geolocalização
- 🔐 **Controle de Acesso por IP** - Whitelist com logging automático
- � **Geolocalização Completa** (ip-api.com - 24+ campos):
  - País, cidade, região, CEP, timezone, coordenadas
  - ISP, organização, AS (Sistema Autônomo)
  - Flags de hospedagem, proxy/VPN, rede móvel
  - Cache de 24h para performance
- � **Bandeiras de Países** - Representação visual com emojis
- 🏠 **Detecção de IP do Usuário** - Identifica e destaca seu IP automaticamente

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
| `GET` | `/` | Documentação JSON completa |
| `GET` | `/docs` | Dashboard HTML interativo |
| `GET` | `/logs` | Dashboard de logs em tempo real |

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

### Controle de Acesso por IP

O middleware `ipFilter` bloqueia automaticamente IPs não autorizados:

```javascript
// src/middlewares/ipFilter.js
const allowedIPs = require('../config/allowedIPs');

// Verifica se o IP está na whitelist
if (!allowedIPs.includes(clientIP)) {
  return res.status(403).json({
    success: false,
    error: 'IP não autorizado'
  });
}
```

### Geolocalização de IPs

Cada acesso é enriquecido com dados de geolocalização:

```javascript
{
  ip: '203.0.113.42',
  country: 'Brazil',
  city: 'São Paulo',
  countryCode: 'BR',
  timestamp: '2025-10-16T18:58:19.054Z'
}
```

**API usada:** ip-api.com (gratuita, 45 req/min)  
**Cache:** 24 horas por IP

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

## 📁 Estrutura do Projeto

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
│   │   ├── exemplo/         # Exemplo (CPF + Matemática)
│   │   │   ├── exemploController.js
│   │   │   └── exemploRoutes.js
│   │   │
│   │   └── pdf/             # Processamento de PDFs
│   │       ├── pdfController.js
│   │       ├── pdfRoutes.js
│   │       └── README.md
│   │
│   ├── middlewares/         # Middlewares globais
│   │   ├── errorHandler.js  # Tratamento de erros
│   │   ├── ipFilter.js      # Filtro de IP + geolocalização
│   │   └── validator.js     # Validação com Joi
│   │
│   ├── routes/              # Rotas especiais
│   │   ├── docs.js          # Documentação HTML
│   │   ├── index.js         # Rota raiz (JSON)
│   │   ├── logsDashboard.js # Dashboard de logs
│   │   └── logsRoutes.js    # API de logs
│   │
│   └── utils/               # Utilitários
│       ├── accessLogger.js      # Logger de acessos
│       └── pdfParseWrapper.cjs  # Wrapper para pdf-parse
│
├── server.js                # Entry point
├── package.json             # Dependências
└── README.md                # Documentação
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
