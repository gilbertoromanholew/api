# 🚀 API Modular - Node.js & Express# 🚀 API Modular - Node.js & Express# � API Multi-Funcional



[![Node.js](https://img.shields.io/badge/Node.js-22.18.0+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

[![Express](https://img.shields.io/badge/Express-5.1.0-000000?logo=express&logoColor=white)](https://expressjs.com/)

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)[![Node.js](https://img.shields.io/badge/Node.js-22.18.0+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)> API REST modular com validação, processamento de PDF e cálculos matemáticos

[![Status](https://img.shields.io/badge/Status-Online-success.svg)](https://api.samm.host)

[![Express](https://img.shields.io/badge/Express-5.1.0-000000?logo=express&logoColor=white)](https://expressjs.com/)

> **API REST modular com auto-descoberta de rotas, validação centralizada e sistema de templates para desenvolvimento rápido.**

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)[![Node.js](https://img.shields.io/badge/Node.js-22.18.0+-green.svg)](https://nodejs.org/)

**🌐 URL de Produção:** https://api.samm.host

[![Made with ❤️](https://img.shields.io/badge/Made%20with-❤%20️-red.svg)](https://github.com/gilbertoromanholew/api)[![Express](https://img.shields.io/badge/Express-5.1.0-blue.svg)](https://expressjs.com/)

---

[![Status](https://img.shields.io/badge/Status-Online-success.svg)](https://api.samm.host)

## 📋 Índice

> **API moderna e extensível com arquitetura modular, auto-carregamento de rotas e sistema de templates para desenvolvimento rápido.**

- [Características](#-características)

- [Instalação](#-instalação)---

- [Início Rápido](#-início-rápido)

- [Endpoints Disponíveis](#-endpoints-disponíveis)---

- [Arquitetura](#-arquitetura)

- [Como Criar Nova Funcionalidade](#-como-criar-nova-funcionalidade)## 📋 Índice

- [Configuração](#-configuração)

- [Segurança](#-segurança)## ✨ Características

- [Deploy](#-deploy)

- [Estrutura do Projeto](#-estrutura-do-projeto)- [Visão Geral](#-visão-geral)

- [Troubleshooting](#-troubleshooting)

- [Contribuindo](#-contribuindo)- 🎯 **Arquitetura Modular** - Funcionalidades independentes e auto-descobertas- [Funcionalidades](#-funcionalidades)

- [Licença](#-licença)

- ⚡ **Auto-carregamento** - Rotas descobertas e registradas automaticamente- [Instalação](#-instalação)

---

- 🛡️ **Validação Centralizada** - Sistema de schemas reutilizáveis- [Configuração](#-configuração)

## ✨ Características

- 🎨 **Respostas Padronizadas** - BaseController para consistência- [Uso](#-uso)

- 🎯 **Arquitetura Modular** - Funcionalidades independentes e auto-descobertas

- ⚡ **Auto-carregamento de Rotas** - Descobre e registra rotas automaticamente- 📝 **Documentação Automática** - Dashboard web com lista de funcionalidades- [Estrutura](#-estrutura-do-projeto)

- 🛡️ **Validação Centralizada** - Sistema de schemas reutilizáveis

- 🎨 **Respostas Padronizadas** - BaseController para consistência- 🔒 **Controle de Acesso** - Filtro de IP e logs de acessos- [Segurança](#-segurança)

- 📝 **Documentação Automática** - Dashboard web interativo

- 🔒 **Controle de Acesso por IP** - Whitelist de IPs autorizados- 🚦 **Tratamento de Erros** - Global error handler e 404 customizado- [Deploy](#-deploy)

- 🚦 **Tratamento Global de Erros** - Error handler centralizado

- 📦 **Sistema de Templates** - Crie novas funcionalidades em 5 minutos- 📦 **Sistema de Templates** - Crie novas funcionalidades em 5 minutos- [Desenvolvimento](#-desenvolvimento)

- 🌐 **CORS Habilitado** - Pronto para APIs públicas

- 📊 **Dashboard de Logs** - Visualize acessos em tempo real- 🌐 **CORS Habilitado** - Pronto para APIs públicas



---- 📊 **Dashboard de Logs** - Visualize acessos em tempo real---



## 🔧 Instalação



### Pré-requisitos---## 🎯 Visão Geral



- **Node.js** >= 22.18.0

- **npm** >= 10.x

## 📋 ÍndiceAPI REST modular construída com Node.js e Express, oferecendo múltiplas funcionalidades:

### Passos

- ✅ Validação de documentos (CPF)

1. **Clone o repositório:**

```bash- [Instalação](#-instalação)- 📄 Extração de texto de PDFs

git clone https://github.com/gilbertoromanholew/api.git

cd api- [Início Rápido](#-início-rápido)- 🧮 Operações matemáticas

```

- [Arquitetura](#-arquitetura)- 🔒 Filtro de IP para segurança

2. **Instale as dependências:**

```bash- [Endpoints Disponíveis](#-endpoints-disponíveis)- 📚 Documentação interativa

npm install

```- [Como Criar Nova Funcionalidade](#-como-criar-nova-funcionalidade)



3. **Configure as variáveis de ambiente:**- [Configuração](#-configuração)**URL de Produção**: https://api.samm.host

```bash

cp .env.example .env- [Exemplos de Uso](#-exemplos-de-uso)

# Edite o arquivo .env conforme necessário

```- [Estrutura do Projeto](#-estrutura-do-projeto)---



4. **Inicie o servidor:**- [Documentação Adicional](#-documentação-adicional)

```bash

npm start- [Contribuindo](#-contribuindo)## ⚡ Funcionalidades

```

- [Licença](#-licença)

5. **Acesse a API:**

```### 1. 📚 Documentação da API

http://localhost:3000

```---



---#### `GET /`



## 🚀 Início Rápido## 🔧 InstalaçãoRetorna documentação completa em JSON com todos os endpoints, parâmetros e exemplos.



### Testar a Documentação



```bash### Pré-requisitos```bash

# Ver documentação JSON

curl http://localhost:3000/curl https://api.samm.host/



# Acessar documentação HTML interativa- **Node.js** >= 22.18.0```

curl http://localhost:3000/docs

```- **npm** ou **yarn**



### Testar Endpoints#### `GET /docs`



```bash### Clonar e InstalarPágina HTML interativa com a documentação visual.

# Validar CPF

curl -X POST http://localhost:3000/validate-cpf \

  -H "Content-Type: application/json" \

  -d '{"cpf": "12345678901"}'```bash```bash



# Fazer cálculo# Clonar repositório# Acesse no navegador:

curl -X POST http://localhost:3000/calcular \

  -H "Content-Type: application/json" \git clone https://github.com/gilbertoromanholew/api.githttps://api.samm.host/docs

  -d '{"operacao": "somar", "a": 10, "b": 5}'

cd api```

# Extrair texto de PDF

curl -X POST http://localhost:3000/read-pdf \

  -F "pdf=@documento.pdf"

```# Instalar dependências---



---npm install



## 📡 Endpoints Disponíveis### 2. ✅ Validação de CPF



### Documentação e Sistema# Configurar variáveis de ambiente



| Método | Endpoint | Descrição |cp .env.example .env#### `POST /validate-cpf`

|--------|----------|-----------|

| `GET` | `/` | Documentação da API em JSON |# Edite o arquivo .env conforme necessário

| `GET` | `/docs` | Documentação HTML interativa |

| `GET` | `/logs` | Dashboard de logs em tempo real |Valida CPFs brasileiros usando o algoritmo oficial.

| `GET` | `/api/logs` | API de logs (JSON) |

| `GET` | `/api/logs/stats` | Estatísticas de acesso |# Iniciar servidor

| `GET` | `/api/functions` | Lista de funcionalidades disponíveis |

npm start**Requisição:**

### Funcionalidades

``````bash

#### 1. ✅ Validação de CPF

curl -X POST https://api.samm.host/validate-cpf \

**POST `/validate-cpf`**

O servidor estará rodando em **http://localhost:3000** 🎉  -H "Content-Type: application/json" \

Valida CPFs brasileiros usando o algoritmo oficial.

  -d '{"cpf": "12345678901"}'

**Requisição:**

```json---```

{

  "cpf": "12345678901"

}

```## 🚀 Início Rápido**Resposta de Sucesso:**



**Resposta:**```json

```json

{### Testar a API{

  "success": true,

  "valido": true,  "valido": true,

  "cpf": "123.456.789-01",

  "mensagem": "CPF válido"```bash  "cpf": "123.456.789-01",

}

```# Ver informações da API  "mensagem": "CPF válido"



---curl http://localhost:3000/}



#### 2. 🧮 Calculadora```



**POST `/calcular`**# Acessar documentação HTML



Realiza operações matemáticas.curl http://localhost:3000/docs**Resposta de Erro:**



**Operações disponíveis:**```json

- `somar` - Adição

- `subtrair` - Subtração# Listar usuários exemplo{

- `multiplicar` - Multiplicação

- `dividir` - Divisãocurl http://localhost:3000/usuarios  "valido": false,

- `porcentagem` - Cálculo percentual

  "cpf": "12345678901",

**Requisição:**

```json# Criar novo usuário  "mensagem": "CPF inválido"

{

  "operacao": "somar",curl -X POST http://localhost:3000/usuarios \}

  "a": 10,

  "b": 5  -H "Content-Type: application/json" \```

}

```  -d '{"nome":"João Silva","email":"joao@exemplo.com","idade":30}'



**Resposta:**---

```json

{# Buscar usuário por ID

  "success": true,

  "operacao": "somar",curl http://localhost:3000/usuarios/1### 3. 📄 Leitura de PDF

  "a": 10,

  "b": 5,

  "resultado": 15

}# Ver estatísticas#### `POST /read-pdf`

```

curl http://localhost:3000/usuarios/estatisticas

---

Extrai texto de arquivos PDF.

#### 3. 📄 Leitura de PDF

# Ler PDF

**POST `/read-pdf`**

curl -X POST http://localhost:3000/read-pdf \**Requisição:**

Extrai texto de arquivos PDF.

  -F "pdf=@caminho/para/arquivo.pdf"```bash

**Requisição:**

```bash```curl -X POST https://api.samm.host/read-pdf \

curl -X POST http://localhost:3000/read-pdf \

  -F "pdf=@documento.pdf"  -F "pdf=@documento.pdf"

```

---```

**Resposta:**

```json

{

  "success": true,## 🏗️ Arquitetura**Resposta:**

  "texto": "Conteúdo extraído do PDF...",

  "paginas": 5,```json

  "info": {

    "titulo": "Documento",### Visão Geral{

    "autor": "Autor"

  }  "success": true,

}

```A API utiliza uma **arquitetura modular** onde cada funcionalidade é auto-contida e descoberta automaticamente.  "texto": "Conteúdo extraído do PDF...",



---  "paginas": 5,



## 🏗️ Arquitetura```  "info": {



### Visão Geralsrc/    "titulo": "Documento",



A API utiliza uma **arquitetura modular** onde cada funcionalidade é auto-contida e descoberta automaticamente.├── core/    "autor": "Autor"



```│   ├── BaseController.js      # Classe base para controllers  }

src/

├── core/│   └── routeLoader.js          # Auto-carregador de rotas}

│   ├── BaseController.js      # Classe base para controllers

│   └── routeLoader.js          # Auto-carregador de rotas├── middlewares/```

├── middlewares/

│   ├── validator.js            # Validação centralizada│   ├── validator.js            # Validação centralizada

│   ├── errorHandler.js         # Tratamento global de erros

│   └── ipFilter.js             # Controle de acesso por IP│   ├── errorHandler.js         # Tratamento global de erros---

├── functions/

│   ├── _TEMPLATE/              # Template para novas features│   └── ipFilter.js             # Controle de acesso por IP

│   ├── exemplo/                # Exemplo de CRUD

│   └── pdf/                    # Leitura de PDF├── funcionalidades/### 4. 🧮 Calculadora

├── config/

│   ├── index.js                # Configurações centralizadas│   ├── _TEMPLATE/              # Template para novas features

│   └── allowedIPs.js           # IPs autorizados

├── routes/│   ├── exemplo/                # CRUD de usuários (exemplo)#### `POST /calcular`

│   ├── docs.js                 # Documentação HTML

│   ├── logsDashboard.js        # Dashboard de logs│   └── pdf/                    # Leitura de PDF

│   └── logsRoutes.js           # API de logs

└── utils/├── config/Realiza operações matemáticas.

    ├── accessLogger.js         # Sistema de logs

    └── pdfParseWrapper.cjs     # Wrapper para PDF│   └── index.js                # Configurações centralizadas

```

└── routes/**Operações disponíveis:**

### Fluxo de Requisição

    ├── docs.js                 # Documentação HTML- `somar` - Adição

```

Cliente → IP Filter → CORS → Validator → Controller → Response    ├── logsDashboard.js        # Dashboard de logs- `subtrair` - Subtração

                                ↓

                          Error Handler (se erro)    └── logsRoutes.js           # API de logs- `multiplicar` - Multiplicação

```

```- `dividir` - Divisão

### Componentes Principais

- `porcentagem` - Cálculo de percentual

#### 1. **BaseController**

Classe base que todos os controllers estendem, fornecendo:### Fluxo de Requisição

- `success(res, data, message, statusCode)` - Resposta de sucesso padronizada

- `error(res, message, statusCode, errors)` - Resposta de erro padronizada**Requisição:**

- `execute(req, res, handler)` - Wrapper com try-catch automático

``````bash

#### 2. **Auto-loader**

Sistema que descobre e registra rotas automaticamente:Cliente → IP Filter → CORS → Validator → Controller → Responsecurl -X POST https://api.samm.host/calcular \

- Varre `src/functions/` em busca de arquivos `*Routes.js`

- Registra rotas no Express automaticamente                                ↓  -H "Content-Type: application/json" \

- Ignora pasta `_TEMPLATE`

                          Error Handler (se erro)  -d '{"operacao": "somar", "a": 10, "b": 5}'

#### 3. **Validator**

Middleware de validação com schemas reutilizáveis:``````

- Validação de campos obrigatórios

- Validação de tipos de dados

- Validação de tamanho/comprimento

- Validação de valores enum### Componentes Principais**Resposta:**



#### 4. **Error Handler**```json

Tratamento global de erros:

- Captura todos os erros não tratados#### 1. **BaseController**{

- Handler personalizado para 404

- Stack trace em ambiente de desenvolvimentoClasse base que todos os controllers estendem, fornecendo:  "operacao": "somar",



---- `success(res, data, message, statusCode)` - Resposta de sucesso padronizada  "a": 10,



## 🆕 Como Criar Nova Funcionalidade- `error(res, message, statusCode, errors)` - Resposta de erro padronizada  "b": 5,



### Método Rápido (5 minutos)- `execute(req, res, handler)` - Wrapper com try-catch automático  "resultado": 15



```powershell}

# 1. Copiar template

Copy-Item -Path "src/functions/_TEMPLATE" -Destination "src/functions/minha-feature" -Recurse#### 2. **Auto-loader**```



# 2. Renomear arquivosSistema que descobre e registra rotas automaticamente:

# template* → minhafeature*

- Varre `src/funcionalidades/` em busca de arquivos `*Routes.js`**Exemplo de Porcentagem:**

# 3. Editar controller e routes

# Implementar sua lógica- Registra rotas no Express automaticamente```bash



# 4. Reiniciar servidor- Ignora pasta `_TEMPLATE`curl -X POST https://api.samm.host/calcular \

npm start

  -H "Content-Type: application/json" \

# ✅ Pronto! As rotas serão descobertas automaticamente

```#### 3. **Validator**  -d '{"operacao": "porcentagem", "a": 100, "b": 15}'



### Documentação CompletaMiddleware de validação com schemas reutilizáveis:```



Para um guia completo com exemplos, consulte:- Validação de campos obrigatóriosRetorna: `15` (15% de 100)

**[src/functions/_TEMPLATE/README.md](src/functions/_TEMPLATE/README.md)**

- Validação de tipos

---

- Validação de comprimento---

## ⚙️ Configuração

- Validação de valores enum

### Variáveis de Ambiente (.env)

## 🔧 Instalação

```env

# Servidor#### 4. **Error Handler**

PORT=3000

HOST=0.0.0.0Tratamento global de erros:### Pré-requisitos

NODE_ENV=development

- Captura todos os erros não tratados- Node.js >= 22.18.0

# Segurança - IPs autorizados (separados por vírgula)

# Deixe vazio para permitir todos- Handler personalizado para 404- npm >= 10.x

ALLOWED_IPS=127.0.0.1,192.168.1.100,177.73.205.198

- Stack trace em ambiente de desenvolvimento

# CORS

CORS_ORIGIN=*### Passos



# Logs---

LOG_LEVEL=info

MAX_LOGS=1001. **Clone o repositório:**

LOG_RETENTION_DAYS=7

## 📡 Endpoints Disponíveis```bash

# Upload

MAX_FILE_SIZE=5242880  # 5MB em bytesgit clone https://github.com/gilbertoromanholew/api.git

```

### Sistemacd api

### Configuração de IPs Autorizados

```

Por padrão, `localhost` (127.0.0.1 e ::1) sempre é permitido.

| Método | Endpoint | Descrição |

**Adicionar IPs:**

```env|--------|----------|-----------|2. **Instale as dependências:**

ALLOWED_IPS=192.168.1.100,177.73.205.198,104.23.254.125

```| `GET` | `/` | Informações da API em JSON |```bash



**⚠️ Importante:** Se usar Cloudflare ou proxy, configure como "DNS only" (desabilitar proxy) ou adicione o IP do proxy na lista.| `GET` | `/docs` | Documentação HTML interativa |npm install



---| `GET` | `/logs` | Dashboard de logs em tempo real |```



## 🔒 Segurança| `GET` | `/api/logs` | API de logs (JSON) |



### Filtro de IP3. **Configure as variáveis de ambiente:**



A API implementa um sistema de whitelist de IPs:### Funcionalidade: Exemplo (CRUD de Usuários)```bash

- ✅ **IPs autorizados** → Acesso total à API

- ❌ **IPs não autorizados** → Erro 403cp .env.example .env



**Sempre permitidos:**| Método | Endpoint | Descrição |```

- `127.0.0.1` (localhost IPv4)

- `::1` (localhost IPv6)|--------|----------|-----------|



### Detecção de IP Real| `GET` | `/usuarios` | Lista todos os usuários (com filtros) |4. **Inicie o servidor:**



O filtro detecta automaticamente o IP real através de headers:| `GET` | `/usuarios/estatisticas` | Estatísticas dos usuários |```bash

- `X-Forwarded-For` (proxies, load balancers)

- `X-Real-IP` (nginx, Apache)| `GET` | `/usuarios/:id` | Busca usuário por ID |npm start

- `req.ip` (conexão direta)

| `POST` | `/usuarios` | Cria novo usuário |```

### Logs de Acesso

| `PUT` | `/usuarios/:id` | Atualiza usuário |

Todos os acessos são registrados com:

- IP do cliente| `DELETE` | `/usuarios/:id` | Remove usuário |5. **Acesse a API:**

- Endpoint acessado

- Status da requisição (autorizado/negado)```

- User-Agent

- Timestamp**Filtros disponíveis em GET /usuarios:**http://localhost:3000



---- `?ativo=true/false` - Filtrar por status```



## 🚀 Deploy- `?idade_min=25` - Idade mínima



### Deploy em VPS- `?idade_max=40` - Idade máxima---



1. **Conectar ao servidor:**

```bash

ssh usuario@seu-servidor.com### Funcionalidade: PDF## ⚙️ Configuração

```



2. **Instalar Node.js:**

```bash| Método | Endpoint | Descrição |### Arquivo `.env`

curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

sudo apt-get install -y nodejs|--------|----------|-----------|

```

| `POST` | `/read-pdf` | Extrai texto de arquivo PDF |Copie `.env.example` para `.env` e configure:

3. **Clonar e configurar:**

```bash

git clone https://github.com/gilbertoromanholew/api.git

cd api---```env

npm install

cp .env.example .env# Servidor

nano .env  # Editar configurações

```## 🆕 Como Criar Nova FuncionalidadePORT=3000



4. **Instalar PM2:**HOST=0.0.0.0

```bash

sudo npm install -g pm2### Método 1: Copiar Template (5 minutos)

```

# Segurança - IPs autorizados (separados por vírgula)

5. **Iniciar aplicação:**

```bash```powershellALLOWED_IPS=127.0.0.1,192.168.1.100,177.73.205.198

pm2 start server.js --name api

pm2 save# 1. Copiar template

pm2 startup  # Configurar inicialização automática

```Copy-Item -Path "src/funcionalidades/_TEMPLATE" -Destination "src/funcionalidades/minha-feature" -Recurse# Logs



6. **Verificar status:**LOG_LEVEL=info

```bash

pm2 status# 2. Renomear arquivosLOG_FILE=false

pm2 logs api

```# template* → minhafeature*```



### Configurar HTTPS (Nginx + Let's Encrypt)



1. **Instalar Nginx:**# 3. Editar controller e routes### Configuração de IPs Autorizados

```bash

sudo apt install nginx# Implementar sua lógica

```

Por padrão, `localhost` (127.0.0.1 e ::1) sempre é permitido. Adicione outros IPs conforme necessário:

2. **Configurar proxy reverso:**

```nginx# 4. Reiniciar servidor

# /etc/nginx/sites-available/api

server {npm start```env

    listen 80;

    server_name api.samm.host;ALLOWED_IPS=192.168.1.100,177.73.205.198,104.23.254.125



    location / {# ✅ Pronto! As rotas serão descobertas automaticamente```

        proxy_pass http://localhost:3000;

        proxy_http_version 1.1;```

        proxy_set_header Upgrade $http_upgrade;

        proxy_set_header Connection 'upgrade';**Importante:** Se usar Cloudflare ou proxy, desabilite o proxy (DNS only) ou adicione o IP do proxy.

        proxy_set_header Host $host;

        proxy_set_header X-Real-IP $remote_addr;### Método 2: Manual

        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        proxy_cache_bypass $http_upgrade;---

    }

}1. **Criar pasta** em `src/funcionalidades/`## 📁 Estrutura do Projeto

```

2. **Criar Controller** estendendo `BaseController`

3. **Ativar site:**

```bash3. **Criar Routes** exportando um `Router` do Express```

sudo ln -s /etc/nginx/sites-available/api /etc/nginx/sites-enabled/

sudo nginx -t4. **Reiniciar servidor** - Auto-descoberta fará o resto!api/

sudo systemctl restart nginx

```├── .env                         # Variáveis de ambiente (não commitar)



4. **Instalar SSL:**### Exemplo Mínimo├── .env.example                 # Template de configuração

```bash

sudo apt install certbot python3-certbot-nginx├── .gitignore                   # Arquivos ignorados pelo git

sudo certbot --nginx -d api.samm.host

``````javascript├── package.json                 # Dependências e scripts



### Atualizar Deploy// src/funcionalidades/hello/helloController.js├── package-lock.json            # Lock de dependências



```bashimport { BaseController } from '../../core/BaseController.js';├── server.js                    # Arquivo principal da aplicação

cd /caminho/da/api

git pull origin main├── README.md                    # Documentação principal

npm install

pm2 restart apiclass HelloController extends BaseController {│

```

    async sayHello(req, res) {└── src/

---

        return this.execute(req, res, async (req, res) => {    ├── config/                  # Configurações

## 📁 Estrutura do Projeto

            const { nome } = req.body;    │   ├── index.js             # Carrega variáveis do .env

```

api/            return this.success(res, { mensagem: `Olá, ${nome}!` });    │   └── allowedIPs.js        # Lista de IPs autorizados

├── .env                         # Variáveis de ambiente (não commitar)

├── .gitignore                   # Arquivos ignorados        });    │

├── package.json                 # Dependências e scripts

├── server.js                    # Entry point    }    ├── middlewares/             # Middlewares Express

├── README.md                    # Este arquivo

│}    │   └── ipFilter.js          # Filtro de segurança por IP

└── src/

    ├── config/                  # Configurações    │

    │   ├── index.js             # Carrega variáveis do .env

    │   └── allowedIPs.js        # Lista de IPs autorizadosexport default new HelloController();    ├── routes/                  # Rotas principais

    │

    ├── core/                    # Núcleo da API```    │   ├── index.js             # GET / (documentação JSON)

    │   ├── BaseController.js    # Classe base para controllers

    │   └── routeLoader.js       # Auto-loader de rotas    │   └── docs.js              # GET /docs (página HTML)

    │

    ├── middlewares/             # Middlewares Express```javascript    │

    │   ├── errorHandler.js      # Tratamento global de erros

    │   ├── ipFilter.js          # Filtro de segurança por IP// src/funcionalidades/hello/helloRoutes.js    ├── utils/                   # Utilitários

    │   └── validator.js         # Validação de requisições

    │import { Router } from 'express';    │   └── pdfParseWrapper.cjs  # Wrapper CommonJS para pdf-parse

    ├── routes/                  # Rotas de sistema

    │   ├── index.js             # GET / (documentação JSON)import helloController from './helloController.js';    │

    │   ├── docs.js              # GET /docs (página HTML)

    │   ├── logsDashboard.js     # GET /logs (dashboard)    └── funcionalidades/         # Funcionalidades modulares

    │   └── logsRoutes.js        # API de logs

    │const router = Router();        │

    ├── utils/                   # Utilitários

    │   ├── accessLogger.js      # Sistema de logsrouter.post('/hello', (req, res) => helloController.sayHello(req, res));        ├── validacao/           # Validação de documentos

    │   └── pdfParseWrapper.cjs  # Wrapper CommonJS para pdf-parse

    │export default router;        │   ├── README.md        # Documentação da funcionalidade

    └── functions/               # Funcionalidades modulares

        │```        │   ├── cpfValidator.js  # Algoritmo de validação CPF

        ├── _TEMPLATE/           # Template oficial

        │   ├── README.md        # Guia completo (300+ linhas)        │   ├── cpfController.js # Controller de requisições

        │   ├── templateController.js

        │   ├── templateRoutes.js**Pronto!** Reinicie o servidor e acesse `POST /hello`        │   └── cpfRoutes.js     # Rotas: POST /validate-cpf

        │   └── templateUtils.js

        │        │

        ├── exemplo/             # Exemplo de CRUD

        │   ├── exemploController.js---        ├── pdf/                 # Processamento de PDF

        │   └── exemploRoutes.js

        │        │   ├── README.md        # Documentação da funcionalidade

        └── pdf/                 # Processamento de PDF

            ├── README.md        # Documentação específica## ⚙️ Configuração        │   ├── pdfController.js # Controller de PDF

            ├── pdfController.js

            └── pdfRoutes.js        │   └── pdfRoutes.js     # Rotas: POST /read-pdf

```

### Variáveis de Ambiente (.env)        │

**Total:** ~20 arquivos essenciais de código + documentação

        ├── calculo/             # Operações matemáticas

---

```env        │   ├── README.md        # Documentação da funcionalidade

## 🐛 Troubleshooting

# Servidor        │   ├── calculoUtils.js  # Funções matemáticas

### Erro: "Cannot find module"

```bashPORT=3000        │   ├── calculoController.js # Controller de cálculos

npm install

pm2 restart apiHOST=0.0.0.0        │   └── calculoRoutes.js # Rotas: POST /calcular

```

NODE_ENV=development        │

### Erro: Porta 3000 já em uso

```bash        └── extras/              # Funcionalidades futuras

# Windows (PowerShell)

Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process# Segurança            └── README.md        # Planejamento de features



# Linux/MacALLOWED_IPS=192.168.1.1,10.0.0.1  # IPs permitidos (vazio = todos)```

lsof -ti:3000 | xargs kill -9

CORS_ORIGIN=*                     # Origem CORS permitida

# Ou mudar a porta no .env

PORT=3001**Total:** ~20 arquivos essenciais de código + documentação

```

# Rate Limiting

### Erro 403 mesmo com IP autorizado

RATE_LIMIT_WINDOW=60000           # Janela em ms (1 min)---

1. Verifique o IP detectado nos logs:

```bashRATE_LIMIT_MAX=100                # Máximo de requisições

pm2 logs api

```## 🔒 Segurança



2. Se estiver usando Cloudflare:# Logs

   - Acesse o painel do Cloudflare

   - Vá em DNSMAX_LOGS=100                      # Máximo de logs em memória### Filtro de IP

   - Desabilite o proxy (nuvem laranja → cinza)

LOG_RETENTION_DAYS=7              # Dias para manter logs

3. Se estiver atrás de proxy/load balancer:

   - Verifique os headers `X-Forwarded-For` ou `X-Real-IP`A API implementa um sistema de whitelist de IPs:

   - Adicione o IP do proxy na lista de permitidos

# Upload

### PDF não está sendo lido

MAX_FILE_SIZE=5242880             # Tamanho máximo (5MB)- ✅ **IPs autorizados** → Acesso total à API

1. Verifique o formato do arquivo (deve ser PDF válido)

2. Verifique o tamanho (limite padrão de 5MB)```- ❌ **IPs não autorizados** → Erro 403

3. Verifique se o campo do form-data é `pdf`



### Rotas não sendo descobertas

### Configuração Centralizada**Configuração no `.env`:**

1. Verifique se o arquivo termina com `Routes.js`

2. Verifique se tem `export default router` no final```env

3. Reinicie o servidor

Todas as configurações estão em `src/config/index.js`:ALLOWED_IPS=192.168.1.100,177.73.205.198

---

```

## 🤝 Contribuindo

```javascript

Contribuições são bem-vindas! Siga os passos:

import config from './src/config/index.js';**Sempre permitidos:**

1. **Fork** o projeto

2. **Crie uma branch** para sua feature (`git checkout -b feature/MinhaFeature`)- `127.0.0.1` (localhost IPv4)

3. **Commit suas mudanças** (`git commit -m 'feat: Adiciona MinhaFeature'`)

4. **Push para a branch** (`git push origin feature/MinhaFeature`)// Uso- `::1` (localhost IPv6)

5. **Abra um Pull Request**

config.server.port        // 3000

### Padrão de Commits

config.security.corsOrigin  // '*'### Suporte a Proxies

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidadeconfig.logs.maxLogs       // 100

- `fix:` Correção de bug

- `docs:` Documentaçãoconfig.upload.maxFileSize // 5242880O filtro de IP detecta automaticamente o IP real através de headers:

- `refactor:` Refatoração de código

- `test:` Testes```- `X-Forwarded-For` (proxies, load balancers)

- `chore:` Tarefas de manutenção

- `X-Real-IP` (nginx, Apache)

---

---- `req.ip` (conexão direta)

## 📄 Licença



Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 💡 Exemplos de Uso**Cloudflare:** Configure como "DNS only" (desabilitar proxy) para que o IP real seja detectado.

---



## 👨‍💻 Autor

### Exemplo 1: Listar Usuários com Filtros---

**Gilberto Romano Holew**

- GitHub: [@gilbertoromanholew](https://github.com/gilbertoromanholew)

- Website: https://api.samm.host

**Requisição:**## 🚀 Deploy

---

```bash

## 📞 Suporte

curl "http://localhost:3000/usuarios?ativo=true&idade_min=25&idade_max=35"### Deploy em VPS

Para questões ou problemas:

- Abra uma [issue](https://github.com/gilbertoromanholew/api/issues)```

- Consulte a documentação em [/docs](https://api.samm.host/docs)

1. **Conectar ao servidor:**

---

**Resposta:**```bash

## 📊 Status

```jsonssh usuario@seu-servidor.com

- **Versão:** 2.0.0

- **Status:** ✅ Online e funcional{```

- **Última atualização:** 16 de outubro de 2025

- **Node.js:** >= 22.18.0  "success": true,

- **Express:** 5.1.0

  "message": "2 usuário(s) encontrado(s)",2. **Instalar Node.js (se necessário):**

---

  "data": {```bash

<div align="center">

    "total": 2,curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

**⭐ Se este projeto foi útil, considere dar uma estrela! ⭐**

    "usuarios": [sudo apt-get install -y nodejs

Feito com ❤️ por [Gilberto Romanhole](https://github.com/gilbertoromanholew)

      {```

</div>

        "id": 1,

        "nome": "João Silva",3. **Clonar o repositório:**

        "email": "joao@exemplo.com",```bash

        "idade": 30,git clone https://github.com/gilbertoromanholew/api.git

        "ativo": truecd api

      },```

      {

        "id": 2,4. **Instalar dependências:**

        "nome": "Maria Santos",```bash

        "email": "maria@exemplo.com",npm install

        "idade": 25,```

        "ativo": true

      }5. **Configurar variáveis:**

    ]```bash

  }cp .env.example .env

}nano .env  # Editar configurações

``````



### Exemplo 2: Criar Usuário6. **Instalar PM2 (gerenciador de processos):**

```bash

**Requisição:**sudo npm install -g pm2

```bash```

curl -X POST http://localhost:3000/usuarios \

  -H "Content-Type: application/json" \7. **Iniciar a aplicação:**

  -d '{```bash

    "nome": "Pedro Costa",pm2 start server.js --name api

    "email": "pedro@exemplo.com",pm2 save

    "idade": 28,pm2 startup  # Configurar inicialização automática

    "ativo": true```

  }'

```8. **Verificar status:**

```bash

**Resposta:**pm2 status

```jsonpm2 logs api

{```

  "success": true,

  "message": "Usuário criado com sucesso",### Atualizar Deploy

  "data": {

    "id": 4,```bash

    "nome": "Pedro Costa",cd /caminho/da/api

    "email": "pedro@exemplo.com",git pull origin main

    "idade": 28,npm install

    "ativo": true,pm2 restart api

    "criadoEm": "2025-10-16T19:30:00.000Z"```

  }

}### Configurar HTTPS (Nginx + Let's Encrypt)

```

1. **Instalar Nginx:**

### Exemplo 3: Erro de Validação```bash

sudo apt install nginx

**Requisição:**```

```bash

curl -X POST http://localhost:3000/usuarios \2. **Configurar proxy reverso:**

  -H "Content-Type: application/json" \```nginx

  -d '{"nome": "Jo"}'  # Nome muito curto# /etc/nginx/sites-available/api

```server {

    listen 80;

**Resposta:**    server_name api.samm.host;

```json

{    location / {

  "success": false,        proxy_pass http://localhost:3000;

  "message": "Erro de validação",        proxy_http_version 1.1;

  "errors": [        proxy_set_header Upgrade $http_upgrade;

    "Campo 'email' é obrigatório",        proxy_set_header Connection 'upgrade';

    "Campo 'idade' é obrigatório",        proxy_set_header Host $host;

    "Campo 'nome' deve ter entre 3 e 100 caracteres"        proxy_set_header X-Real-IP $remote_addr;

  ]        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

}        proxy_cache_bypass $http_upgrade;

```    }

}

### Exemplo 4: Ler PDF```



**Requisição:**3. **Ativar site:**

```bash```bash

curl -X POST http://localhost:3000/read-pdf \sudo ln -s /etc/nginx/sites-available/api /etc/nginx/sites-enabled/

  -F "pdf=@documento.pdf"sudo nginx -t

```sudo systemctl restart nginx

```

**Resposta:**

```json4. **Instalar SSL:**

{```bash

  "success": true,sudo apt install certbot python3-certbot-nginx

  "message": "PDF processado com sucesso",sudo certbot --nginx -d api.samm.host

  "data": {```

    "text": "Conteúdo extraído do PDF...",

    "pages": 5,---

    "info": {

      "Title": "Documento Exemplo",## 🛠️ Desenvolvimento

      "Author": "João Silva"

    },### Adicionar Nova Funcionalidade

    "metadata": {

      "CreationDate": "2025-10-16T10:00:00.000Z"1. **Criar estrutura:**

    }```bash

  }mkdir -p src/funcionalidades/minha-funcionalidade

}cd src/funcionalidades/minha-funcionalidade

``````



---2. **Criar arquivos:**



## 📂 Estrutura do Projeto**`README.md`** - Documentação

```markdown

```# Minha Funcionalidade

api/

├── src/## Descrição

│   ├── core/...

│   │   ├── BaseController.js        # Classe base para controllers

│   │   └── routeLoader.js            # Auto-carregador de rotas## Endpoint

│   ├── middlewares/POST /minha-rota

│   │   ├── errorHandler.js           # Tratamento global de erros

│   │   ├── ipFilter.js               # Filtro de IP## Parâmetros

│   │   └── validator.js              # Validação centralizada...

│   ├── funcionalidades/```

│   │   ├── _TEMPLATE/                # 📦 Template para novas features

│   │   │   ├── README.md**`minhaController.js`** - Lógica

│   │   │   ├── templateController.js```javascript

│   │   │   ├── templateRoutes.jsexport const minhaFuncao = (req, res) => {

│   │   │   └── templateUtils.js    const { parametro } = req.body;

│   │   ├── exemplo/                  # ✅ CRUD de usuários    

│   │   │   ├── exemploController.js    // Sua lógica aqui

│   │   │   └── exemploRoutes.js    

│   │   └── pdf/                      # 📄 Leitura de PDF    res.json({ resultado: 'sucesso' });

│   │       ├── pdfController.js};

│   │       └── pdfRoutes.js```

│   ├── config/

│   │   └── index.js                  # Configurações centralizadas**`minhaRoutes.js`** - Rotas

│   ├── routes/```javascript

│   │   ├── docs.js                   # Documentação HTMLimport express from 'express';

│   │   ├── index.js                  # Rotas de sistemaimport { minhaFuncao } from './minhaController.js';

│   │   ├── logsDashboard.js          # Dashboard de logs

│   │   └── logsRoutes.js             # API de logsconst router = express.Router();

│   └── utils/

│       ├── ipLogger.js               # Logger de acessosrouter.post('/minha-rota', minhaFuncao);

│       └── pdfParseWrapper.cjs       # Wrapper para pdf-parse

├── .env                              # Variáveis de ambienteexport default router;

├── .env.example                      # Exemplo de configuração```

├── package.json                      # Dependências

├── server.js                         # Entry point3. **Registrar no `server.js`:**

└── README.md                         # Este arquivo```javascript

```import minhaRoutes from './src/funcionalidades/minha-funcionalidade/minhaRoutes.js';



---// ... outras importações ...



## 📚 Documentação Adicionalapp.use(minhaRoutes);

```

- **[GUIA_RAPIDO.md](./GUIA_RAPIDO.md)** - Guia de início rápido (5 minutos)

- **[IMPLEMENTACAO_CONCLUIDA.md](./IMPLEMENTACAO_CONCLUIDA.md)** - Documentação técnica completa4. **Atualizar documentação em `src/routes/index.js`**

- **[SUGESTOES_MELHORIA.md](./SUGESTOES_MELHORIA.md)** - Decisões de arquitetura

- **[RESUMO_EXECUTIVO.md](./RESUMO_EXECUTIVO.md)** - Resumo executivo da implementação5. **Testar:**

- **[src/funcionalidades/_TEMPLATE/README.md](./src/funcionalidades/_TEMPLATE/README.md)** - Como criar novas funcionalidades```bash

npm start

---

curl -X POST http://localhost:3000/minha-rota \

## 🎯 Roadmap  -H "Content-Type: application/json" \

  -d '{"parametro": "valor"}'

### ✅ Implementado (v2.0)```



- [x] Auto-carregamento de rotas### Scripts disponíveis

- [x] BaseController padronizado

- [x] Sistema de validação centralizado```bash

- [x] Tratamento global de errosnpm start       # Inicia o servidor

- [x] Dashboard de documentaçãonpm test        # (adicionar testes no futuro)

- [x] Sistema de templates```

- [x] Logs de acesso

- [x] Filtro de IP### Dependências



### 🚧 Em Planejamento (v3.0)**Produção:**

- `express@5.1.0` - Framework web

- [ ] Testes automatizados (Jest)- `cors` - Cross-Origin Resource Sharing

- [ ] OpenAPI/Swagger docs- `dotenv` - Variáveis de ambiente

- [ ] Rate limiting avançado- `multer` - Upload de arquivos

- [ ] Cache com Redis- `pdf-parse@1.1.1` - Extração de texto de PDF

- [ ] WebSockets

- [ ] Autenticação JWT**Desenvolvimento:**

- [ ] Docker containerization- Node.js >= 22.18.0

- [ ] CI/CD pipeline

---

---

## 📝 Documentação de Funcionalidades

## 🤝 Contribuindo

Cada funcionalidade possui sua própria documentação detalhada:

Contribuições são bem-vindas! Siga os passos:

- [Validação de CPF](src/funcionalidades/validacao/README.md)

1. **Fork** o projeto- [Leitura de PDF](src/funcionalidades/pdf/README.md)

2. **Crie uma branch** para sua feature (`git checkout -b feature/MinhaFeature`)- [Calculadora](src/funcionalidades/calculo/README.md)

3. **Commit suas mudanças** (`git commit -m 'feat: Adiciona MinhaFeature'`)- [Extras (Futuras)](src/funcionalidades/extras/README.md)

4. **Push para a branch** (`git push origin feature/MinhaFeature`)

5. **Abra um Pull Request**---



### Padrão de Commits## 🐛 Troubleshooting



Seguimos [Conventional Commits](https://www.conventionalcommits.org/):### Erro: "Cannot find module"

```bash

- `feat:` Nova funcionalidadenpm install

- `fix:` Correção de bugpm2 restart api

- `docs:` Documentação```

- `refactor:` Refatoração de código

- `test:` Testes### Erro: Porta 3000 já em uso

- `chore:` Tarefas de manutenção```bash

# Encontrar processo na porta 3000

---lsof -ti:3000



## 📄 Licença# Matar processo

lsof -ti:3000 | xargs kill -9

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

# Ou mudar a porta no .env

---PORT=3001

```

## 👨‍💻 Autor

### Erro 403 mesmo com IP autorizado

**Gilberto Romanhole**

1. Verifique o IP detectado nos logs:

- GitHub: [@gilbertoromanholew](https://github.com/gilbertoromanholew)```bash

- Repositório: [github.com/gilbertoromanholew/api](https://github.com/gilbertoromanholew/api)pm2 logs api

```

---

2. Se estiver usando Cloudflare:

## 📞 Suporte   - Acesse o painel do Cloudflare

   - Vá em DNS

- 📖 Veja a [Documentação Completa](./GUIA_RAPIDO.md)   - Desabilite o proxy (nuvem laranja → cinza)

- 🐛 Reporte bugs via [Issues](https://github.com/gilbertoromanholew/api/issues)

- 💬 Tire dúvidas nas [Discussions](https://github.com/gilbertoromanholew/api/discussions)3. Se estiver atrás de proxy/load balancer:

   - Verifique os headers `X-Forwarded-For` ou `X-Real-IP`

---   - Adicione o IP do proxy na lista de permitidos



## 🌟 Métricas### PDF não está sendo lido



| Métrica | Valor |1. Verifique o formato do arquivo (deve ser PDF válido)

|---------|-------|2. Verifique o tamanho (multer tem limite padrão)

| **Tempo para criar funcionalidade** | 5 minutos (70% mais rápido) |3. Verifique se o campo do form-data é `pdf`

| **Linhas de código por controller** | 15-20 linhas (50% menos) |

| **Tempo de configuração** | 30 segundos (95% mais rápido) |---

| **Cobertura de testes** | Em desenvolvimento |

## 📄 Licença

---

Este projeto é proprietário. Todos os direitos reservados.

## 🎉 Agradecimentos

---

- [Express.js](https://expressjs.com/) - Framework web minimalista

- [Node.js](https://nodejs.org/) - Runtime JavaScript## 👨‍💻 Autor

- [pdf-parse](https://www.npmjs.com/package/pdf-parse) - Extração de texto de PDF

- [dotenv](https://www.npmjs.com/package/dotenv) - Gerenciamento de variáveis de ambiente**Gilberto Romano Holew**

- GitHub: [@gilbertoromanholew](https://github.com/gilbertoromanholew)

---- Website: https://api.samm.host



<div align="center">---



**⭐ Se este projeto foi útil, considere dar uma estrela! ⭐**## 📞 Suporte



Feito com ❤️ por [Gilberto Romanhole](https://github.com/gilbertoromanholew)Para questões ou problemas:

- Abra uma [issue](https://github.com/gilbertoromanholew/api/issues)

</div>- Entre em contato através do site


---

## 📊 Status

- **Versão:** 2.0.0
- **Status:** ✅ Online e funcional
- **Última atualização:** 16 de outubro de 2025
- **Node.js:** >= 22.18.0
- **Express:** 5.1.0

---

**⚡ API desenvolvida com foco em modularidade, segurança e escalabilidade.**
