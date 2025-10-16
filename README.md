# � API Multi-Funcional

> API REST modular com validação, processamento de PDF e cálculos matemáticos

[![Node.js](https://img.shields.io/badge/Node.js-22.18.0+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-blue.svg)](https://expressjs.com/)
[![Status](https://img.shields.io/badge/Status-Online-success.svg)](https://api.samm.host)

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Uso](#-uso)
- [Estrutura](#-estrutura-do-projeto)
- [Segurança](#-segurança)
- [Deploy](#-deploy)
- [Desenvolvimento](#-desenvolvimento)

---

## 🎯 Visão Geral

API REST modular construída com Node.js e Express, oferecendo múltiplas funcionalidades:
- ✅ Validação de documentos (CPF)
- 📄 Extração de texto de PDFs
- 🧮 Operações matemáticas
- 🔒 Filtro de IP para segurança
- 📚 Documentação interativa

**URL de Produção**: https://api.samm.host

---

## ⚡ Funcionalidades

### 1. 📚 Documentação da API

#### `GET /`
Retorna documentação completa em JSON com todos os endpoints, parâmetros e exemplos.

```bash
curl https://api.samm.host/
```

#### `GET /docs`
Página HTML interativa com a documentação visual.

```bash
# Acesse no navegador:
https://api.samm.host/docs
```

---

### 2. ✅ Validação de CPF

#### `POST /validate-cpf`

Valida CPFs brasileiros usando o algoritmo oficial.

**Requisição:**
```bash
curl -X POST https://api.samm.host/validate-cpf \
  -H "Content-Type: application/json" \
  -d '{"cpf": "12345678901"}'
```

**Resposta de Sucesso:**
```json
{
  "valido": true,
  "cpf": "123.456.789-01",
  "mensagem": "CPF válido"
}
```

**Resposta de Erro:**
```json
{
  "valido": false,
  "cpf": "12345678901",
  "mensagem": "CPF inválido"
}
```

---

### 3. 📄 Leitura de PDF

#### `POST /read-pdf`

Extrai texto de arquivos PDF.

**Requisição:**
```bash
curl -X POST https://api.samm.host/read-pdf \
  -F "pdf=@documento.pdf"
```

**Resposta:**
```json
{
  "success": true,
  "texto": "Conteúdo extraído do PDF...",
  "paginas": 5,
  "info": {
    "titulo": "Documento",
    "autor": "Autor"
  }
}
```

---

### 4. 🧮 Calculadora

#### `POST /calcular`

Realiza operações matemáticas.

**Operações disponíveis:**
- `somar` - Adição
- `subtrair` - Subtração
- `multiplicar` - Multiplicação
- `dividir` - Divisão
- `porcentagem` - Cálculo de percentual

**Requisição:**
```bash
curl -X POST https://api.samm.host/calcular \
  -H "Content-Type: application/json" \
  -d '{"operacao": "somar", "a": 10, "b": 5}'
```

**Resposta:**
```json
{
  "operacao": "somar",
  "a": 10,
  "b": 5,
  "resultado": 15
}
```

**Exemplo de Porcentagem:**
```bash
curl -X POST https://api.samm.host/calcular \
  -H "Content-Type: application/json" \
  -d '{"operacao": "porcentagem", "a": 100, "b": 15}'
```
Retorna: `15` (15% de 100)

---

## 🔧 Instalação

### Pré-requisitos
- Node.js >= 22.18.0
- npm >= 10.x

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

3. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
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

## ⚙️ Configuração

### Arquivo `.env`

Copie `.env.example` para `.env` e configure:

```env
# Servidor
PORT=3000
HOST=0.0.0.0

# Segurança - IPs autorizados (separados por vírgula)
ALLOWED_IPS=127.0.0.1,192.168.1.100,177.73.205.198

# Logs
LOG_LEVEL=info
LOG_FILE=false
```

### Configuração de IPs Autorizados

Por padrão, `localhost` (127.0.0.1 e ::1) sempre é permitido. Adicione outros IPs conforme necessário:

```env
ALLOWED_IPS=192.168.1.100,177.73.205.198,104.23.254.125
```

**Importante:** Se usar Cloudflare ou proxy, desabilite o proxy (DNS only) ou adicione o IP do proxy.

---
## 📁 Estrutura do Projeto

```
api/
├── .env                         # Variáveis de ambiente (não commitar)
├── .env.example                 # Template de configuração
├── .gitignore                   # Arquivos ignorados pelo git
├── package.json                 # Dependências e scripts
├── package-lock.json            # Lock de dependências
├── server.js                    # Arquivo principal da aplicação
├── README.md                    # Documentação principal
│
└── src/
    ├── config/                  # Configurações
    │   ├── index.js             # Carrega variáveis do .env
    │   └── allowedIPs.js        # Lista de IPs autorizados
    │
    ├── middlewares/             # Middlewares Express
    │   └── ipFilter.js          # Filtro de segurança por IP
    │
    ├── routes/                  # Rotas principais
    │   ├── index.js             # GET / (documentação JSON)
    │   └── docs.js              # GET /docs (página HTML)
    │
    ├── utils/                   # Utilitários
    │   └── pdfParseWrapper.cjs  # Wrapper CommonJS para pdf-parse
    │
    └── funcionalidades/         # Funcionalidades modulares
        │
        ├── validacao/           # Validação de documentos
        │   ├── README.md        # Documentação da funcionalidade
        │   ├── cpfValidator.js  # Algoritmo de validação CPF
        │   ├── cpfController.js # Controller de requisições
        │   └── cpfRoutes.js     # Rotas: POST /validate-cpf
        │
        ├── pdf/                 # Processamento de PDF
        │   ├── README.md        # Documentação da funcionalidade
        │   ├── pdfController.js # Controller de PDF
        │   └── pdfRoutes.js     # Rotas: POST /read-pdf
        │
        ├── calculo/             # Operações matemáticas
        │   ├── README.md        # Documentação da funcionalidade
        │   ├── calculoUtils.js  # Funções matemáticas
        │   ├── calculoController.js # Controller de cálculos
        │   └── calculoRoutes.js # Rotas: POST /calcular
        │
        └── extras/              # Funcionalidades futuras
            └── README.md        # Planejamento de features
```

**Total:** ~20 arquivos essenciais de código + documentação

---

## 🔒 Segurança

### Filtro de IP

A API implementa um sistema de whitelist de IPs:

- ✅ **IPs autorizados** → Acesso total à API
- ❌ **IPs não autorizados** → Erro 403

**Configuração no `.env`:**
```env
ALLOWED_IPS=192.168.1.100,177.73.205.198
```

**Sempre permitidos:**
- `127.0.0.1` (localhost IPv4)
- `::1` (localhost IPv6)

### Suporte a Proxies

O filtro de IP detecta automaticamente o IP real através de headers:
- `X-Forwarded-For` (proxies, load balancers)
- `X-Real-IP` (nginx, Apache)
- `req.ip` (conexão direta)

**Cloudflare:** Configure como "DNS only" (desabilitar proxy) para que o IP real seja detectado.

---

## 🚀 Deploy

### Deploy em VPS

1. **Conectar ao servidor:**
```bash
ssh usuario@seu-servidor.com
```

2. **Instalar Node.js (se necessário):**
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Clonar o repositório:**
```bash
git clone https://github.com/gilbertoromanholew/api.git
cd api
```

4. **Instalar dependências:**
```bash
npm install
```

5. **Configurar variáveis:**
```bash
cp .env.example .env
nano .env  # Editar configurações
```

6. **Instalar PM2 (gerenciador de processos):**
```bash
sudo npm install -g pm2
```

7. **Iniciar a aplicação:**
```bash
pm2 start server.js --name api
pm2 save
pm2 startup  # Configurar inicialização automática
```

8. **Verificar status:**
```bash
pm2 status
pm2 logs api
```

### Atualizar Deploy

```bash
cd /caminho/da/api
git pull origin main
npm install
pm2 restart api
```

### Configurar HTTPS (Nginx + Let's Encrypt)

1. **Instalar Nginx:**
```bash
sudo apt install nginx
```

2. **Configurar proxy reverso:**
```nginx
# /etc/nginx/sites-available/api
server {
    listen 80;
    server_name api.samm.host;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **Ativar site:**
```bash
sudo ln -s /etc/nginx/sites-available/api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

4. **Instalar SSL:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.samm.host
```

---

## 🛠️ Desenvolvimento

### Adicionar Nova Funcionalidade

1. **Criar estrutura:**
```bash
mkdir -p src/funcionalidades/minha-funcionalidade
cd src/funcionalidades/minha-funcionalidade
```

2. **Criar arquivos:**

**`README.md`** - Documentação
```markdown
# Minha Funcionalidade

## Descrição
...

## Endpoint
POST /minha-rota

## Parâmetros
...
```

**`minhaController.js`** - Lógica
```javascript
export const minhaFuncao = (req, res) => {
    const { parametro } = req.body;
    
    // Sua lógica aqui
    
    res.json({ resultado: 'sucesso' });
};
```

**`minhaRoutes.js`** - Rotas
```javascript
import express from 'express';
import { minhaFuncao } from './minhaController.js';

const router = express.Router();

router.post('/minha-rota', minhaFuncao);

export default router;
```

3. **Registrar no `server.js`:**
```javascript
import minhaRoutes from './src/funcionalidades/minha-funcionalidade/minhaRoutes.js';

// ... outras importações ...

app.use(minhaRoutes);
```

4. **Atualizar documentação em `src/routes/index.js`**

5. **Testar:**
```bash
npm start

curl -X POST http://localhost:3000/minha-rota \
  -H "Content-Type: application/json" \
  -d '{"parametro": "valor"}'
```

### Scripts disponíveis

```bash
npm start       # Inicia o servidor
npm test        # (adicionar testes no futuro)
```

### Dependências

**Produção:**
- `express@5.1.0` - Framework web
- `cors` - Cross-Origin Resource Sharing
- `dotenv` - Variáveis de ambiente
- `multer` - Upload de arquivos
- `pdf-parse@1.1.1` - Extração de texto de PDF

**Desenvolvimento:**
- Node.js >= 22.18.0

---

## 📝 Documentação de Funcionalidades

Cada funcionalidade possui sua própria documentação detalhada:

- [Validação de CPF](src/funcionalidades/validacao/README.md)
- [Leitura de PDF](src/funcionalidades/pdf/README.md)
- [Calculadora](src/funcionalidades/calculo/README.md)
- [Extras (Futuras)](src/funcionalidades/extras/README.md)

---

## 🐛 Troubleshooting

### Erro: "Cannot find module"
```bash
npm install
pm2 restart api
```

### Erro: Porta 3000 já em uso
```bash
# Encontrar processo na porta 3000
lsof -ti:3000

# Matar processo
lsof -ti:3000 | xargs kill -9

# Ou mudar a porta no .env
PORT=3001
```

### Erro 403 mesmo com IP autorizado

1. Verifique o IP detectado nos logs:
```bash
pm2 logs api
```

2. Se estiver usando Cloudflare:
   - Acesse o painel do Cloudflare
   - Vá em DNS
   - Desabilite o proxy (nuvem laranja → cinza)

3. Se estiver atrás de proxy/load balancer:
   - Verifique os headers `X-Forwarded-For` ou `X-Real-IP`
   - Adicione o IP do proxy na lista de permitidos

### PDF não está sendo lido

1. Verifique o formato do arquivo (deve ser PDF válido)
2. Verifique o tamanho (multer tem limite padrão)
3. Verifique se o campo do form-data é `pdf`

---

## 📄 Licença

Este projeto é proprietário. Todos os direitos reservados.

---

## 👨‍💻 Autor

**Gilberto Romano Holew**
- GitHub: [@gilbertoromanholew](https://github.com/gilbertoromanholew)
- Website: https://api.samm.host

---

## 📞 Suporte

Para questões ou problemas:
- Abra uma [issue](https://github.com/gilbertoromanholew/api/issues)
- Entre em contato através do site

---

## 📊 Status

- **Versão:** 2.0.0
- **Status:** ✅ Online e funcional
- **Última atualização:** 16 de outubro de 2025
- **Node.js:** >= 22.18.0
- **Express:** 5.1.0

---

**⚡ API desenvolvida com foco em modularidade, segurança e escalabilidade.**
