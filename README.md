# API - Documentação Completa

## 📋 Índice
- [Visão Geral](#visão-geral)
- [Instalação](#instalação)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Como Usar](#como-usar)
- [Endpoints Disponíveis](#endpoints-disponíveis)
- [Segurança](#segurança)
- [Como Adicionar Novas Funcionalidades](#como-adicionar-novas-funcionalidades)
- [Organização de Arquivos](#organização-de-arquivos)
- [Boas Práticas](#boas-práticas)

---

## 🎯 Visão Geral

API RESTful construída com Node.js e Express, com sistema de segurança por IP e estrutura modular para fácil escalabilidade.

**Características:**
- ✅ Proteção por whitelist de IPs
- ✅ Estrutura modular (fácil manutenção)
- ✅ Validação de CPF
- ✅ Leitura de arquivos PDF
- ✅ Código organizado em camadas (routes, controllers, middlewares, utils)
- ✅ Sistema de logs profissional (Winston)
- ✅ Variáveis de ambiente (.env)
- ✅ Models para estruturas de dados
- ✅ Services para integrações externas

---

## 🚀 Instalação

### Pré-requisitos
- Node.js >= 22.18.0
- npm ou yarn

### Passo a Passo

1. **Clone ou navegue até o projeto:**
```bash
cd "c:\Users\Gilberto Silva\Documents\GitHub\api"
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure os IPs autorizados:**
Edite o arquivo `.env` e adicione os IPs permitidos (separados por vírgula):
```env
ALLOWED_IPS=127.0.0.1,::1,192.168.168.100
```

Ou edite diretamente `src/config/allowedIPs.js`

4. **Inicie o servidor:**
```bash
npm start
```

5. **Teste a API:**
Abra o navegador em: `http://localhost:3000`

---

## 📁 Estrutura do Projeto

```
api/
├── server.js                    # Arquivo principal da aplicação
├── package.json                 # Dependências e scripts
├── .env                         # Variáveis de ambiente (NÃO commitado)
├── .env.example                 # Exemplo de variáveis de ambiente
├── .gitignore                   # Arquivos ignorados pelo Git
├── README.md                    # Este arquivo
├── QUICK_REFERENCE.txt          # Referência rápida
├── ESTRUTURA.md                 # Documentação da estrutura
│
├── logs/                        # Arquivos de log (gerados automaticamente)
│   ├── README.md
│   ├── all.log                  # Todos os logs
│   └── error.log                # Apenas erros
│
└── src/                         # Código-fonte organizado
    ├── config/                  # Configurações centralizadas
    │   ├── index.js             # Configurações gerais (carrega do .env)
    │   ├── logger.js            # Configuração do sistema de logs
    │   └── allowedIPs.js        # Lista de IPs autorizados
    │
    ├── middlewares/             # Middlewares personalizados
    │   ├── ipFilter.js          # Filtro de segurança por IP
    │   └── requestLogger.js     # Logger de requisições HTTP
    │
    ├── routes/                  # Definição de rotas
    │   ├── index.js             # Rota raiz (documentação)
    │   ├── cpfRoutes.js         # Rotas relacionadas a CPF
    │   └── pdfRoutes.js         # Rotas relacionadas a PDF
    │
    ├── controllers/             # Lógica de negócio
    │   ├── cpfController.js     # Controlador de CPF
    │   └── pdfController.js     # Controlador de PDF
    │
    ├── models/                  # Estruturas de dados
    │   ├── User.js              # Model de usuário (exemplo)
    │   └── Document.js          # Model de documento
    │
    ├── services/                # Integrações externas
    │   ├── supabaseService.js   # Serviço Supabase (exemplo)
    │   └── emailService.js      # Serviço de email (exemplo)
    │
    └── utils/                   # Funções auxiliares
        └── cpfValidator.js      # Validador de CPF
```

---

## 💻 Como Usar

### Acessar Documentação da API
```bash
GET http://localhost:3000/
```

Retorna JSON com todos os endpoints disponíveis.

---

## 🔌 Endpoints Disponíveis

### 1. **GET /** - Documentação
Retorna lista de endpoints e funções disponíveis.

**Exemplo de resposta:**
```json
{
  "message": "Bem-vindo à API!",
  "endpoints": [
    "POST /validate-cpf: Valida um CPF",
    "POST /read-pdf: Lê arquivo PDF"
  ]
}
```

---

### 2. **POST /validate-cpf** - Validar CPF

**Body (JSON):**
```json
{
  "cpf": "12345678901"
}
```

**Resposta de sucesso:**
```json
{
  "valid": true,
  "message": "CPF válido."
}
```

**Resposta de erro:**
```json
{
  "valid": false,
  "message": "CPF inválido."
}
```

---

### 3. **POST /read-pdf** - Ler PDF

**Body (form-data):**
- Key: `pdf`
- Value: [arquivo PDF]

**Resposta de sucesso:**
```json
{
  "success": true,
  "text": "Texto extraído do PDF...",
  "pages": 5,
  "info": { /* metadados do PDF */ }
}
```

---

## 🔒 Segurança

### Proteção por IP
Apenas IPs autorizados podem acessar a API. IPs não autorizados recebem:

**Resposta de bloqueio:**
```json
{
  "error": "Pare de tentar hackear! ;)"
}
```

### Como Adicionar IPs Autorizados

**Método 1: Via arquivo .env (Recomendado)**
Edite `.env` e adicione IPs separados por vírgula:
```env
ALLOWED_IPS=127.0.0.1,::1,192.168.168.100,192.168.1.50
```

**Método 2: Via código**
Edite `src/config/allowedIPs.js` diretamente (não recomendado para produção)

---

## ➕ Como Adicionar Novas Funcionalidades

### Passo 1: Criar o Controlador
Crie um arquivo em `src/controllers/`:

**Exemplo:** `src/controllers/emailController.js`
```javascript
export const sendEmail = async (req, res) => {
    try {
        const { to, subject, body } = req.body;
        
        // Sua lógica aqui
        
        res.status(200).json({ success: true, message: 'Email enviado!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
```

---

### Passo 2: Criar a Rota
Crie um arquivo em `src/routes/`:

**Exemplo:** `src/routes/emailRoutes.js`
```javascript
import express from 'express';
import { sendEmail } from '../controllers/emailController.js';

const router = express.Router();

router.post('/send-email', sendEmail);

export default router;
```

---

### Passo 3: Registrar no server.js
Adicione a importação e use a rota:

```javascript
import emailRoutes from './src/routes/emailRoutes.js';

// ... código existente ...

app.use(emailRoutes);
```

---

### Passo 4: Atualizar Documentação
Adicione ao `src/routes/index.js`:

```javascript
endpoints: [
    'POST /validate-cpf: Valida um CPF',
    'POST /read-pdf: Lê arquivo PDF',
    'POST /send-email: Envia um email'  // Nova linha
]
```

---

## 📂 Organização de Arquivos

### Novas Pastas Implementadas

**1. `src/config/` - Configurações centralizadas**
- `index.js` - Carrega todas as variáveis do .env
- `logger.js` - Sistema de logs com Winston
- `allowedIPs.js` - IPs autorizados

**2. `src/models/` - Estruturas de dados**
- `User.js` - Model de usuário com validações
- `Document.js` - Model de documento/PDF

**3. `src/services/` - Integrações externas**
- `supabaseService.js` - Exemplo para Supabase
- `emailService.js` - Exemplo para envio de emails

**4. `logs/` - Arquivos de log**
- `all.log` - Todos os logs
- `error.log` - Apenas erros

---

### Sistema de Logs

**Níveis de log disponíveis:**
```env
LOG_LEVEL=debug   # Tudo (desenvolvimento)
LOG_LEVEL=http    # Requisições HTTP
LOG_LEVEL=info    # Informações gerais (padrão)
LOG_LEVEL=warn    # Avisos
LOG_LEVEL=error   # Apenas erros
```

**Usar no código:**
```javascript
import logger from '../config/logger.js';

logger.info('Mensagem informativa');
logger.warn('Aviso');
logger.error('Erro crítico');
logger.debug('Debug detalhado');
logger.http('Requisição HTTP');
```

**Logs automáticos:**
- ✅ Todas as requisições HTTP são logadas
- ✅ IPs bloqueados são registrados
- ✅ Erros são salvos em `logs/error.log`

---

### Variáveis de Ambiente (.env)

**Vantagens:**
- 🔒 Senhas e chaves secretas fora do código
- 🚫 `.env` não é commitado no Git
- 🔄 Fácil mudar configurações por ambiente

**Arquivo `.env.example`:**
Use como template. Copie para `.env` e configure:
```bash
cp .env.example .env
```

**Acessar variáveis:**
```javascript
import config from './src/config/index.js';

console.log(config.port);        // 3000
console.log(config.nodeEnv);     // development
console.log(config.jwt.secret);  // sua chave JWT
```

---

### Models (Estruturas de Dados)

**Quando usar:**
- Padronizar estrutura de dados
- Adicionar validações
- Garantir consistência

**Exemplo de uso:**
```javascript
import { User } from '../models/User.js';

const user = new User({
    name: 'João Silva',
    email: 'joao@email.com',
    cpf: '12345678901'
});

const validation = user.validate();
if (!validation.isValid) {
    console.log(validation.errors);
}

// Retornar sem dados sensíveis
res.json(user.toJSON());
```

---

### Services (Integrações Externas)

**Quando usar:**
- Integrar com APIs externas (Supabase, OpenAI, etc.)
- Enviar emails
- Processar pagamentos
- Qualquer serviço externo

**Exemplo:**
```javascript
import emailService from '../services/emailService.js';

await emailService.sendEmail({
    to: 'cliente@email.com',
    subject: 'Bem-vindo!',
    text: 'Olá, seja bem-vindo!'
});
```

---

### Como Criar Novas Pastas

**Para serviços externos:**
```bash
mkdir src/services
```

Exemplo: `src/services/supabaseService.js`

**Para modelos de dados:**
```bash
mkdir src/models
```

Exemplo: `src/models/User.js`

**Para validações:**
```bash
mkdir src/validators
```

Exemplo: `src/validators/emailValidator.js`

---

### Como Renomear Arquivos/Pastas

**Usando terminal:**
```powershell
# Renomear arquivo
mv src/utils/cpfValidator.js src/utils/cpfUtils.js

# Renomear pasta
mv src/controllers src/handlers
```

**Importante:** Após renomear, atualize todos os imports nos arquivos que usam o arquivo renomeado!

---

## 📦 Como Instalar Novas Dependências

### Instalar pacote npm
```bash
npm install nome-do-pacote
```

**Exemplos comuns:**
```bash
npm install axios          # Para fazer requisições HTTP
npm install dotenv         # Para variáveis de ambiente
npm install bcrypt         # Para criptografia de senhas
npm install jsonwebtoken   # Para autenticação JWT
npm install nodemailer     # Para envio de emails
```

---

### Usar o pacote instalado
```javascript
import axios from 'axios';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
```

---

## 🎨 Boas Práticas

### 1. **Separação de Responsabilidades**
- **Routes:** Apenas definem endpoints
- **Controllers:** Contém lógica de negócio
- **Utils:** Funções auxiliares reutilizáveis
- **Middlewares:** Funções que processam requisições

### 2. **Nomenclatura**
- Arquivos: `camelCase.js`
- Constantes: `UPPER_CASE`
- Funções: `camelCase()`
- Classes: `PascalCase`

### 3. **Tratamento de Erros**
Sempre use try-catch nos controllers:
```javascript
try {
    // código
} catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: error.message });
}
```

### 4. **Validação de Dados**
Sempre valide dados de entrada:
```javascript
if (!cpf) {
    return res.status(400).json({ error: 'CPF não fornecido.' });
}
```

### 5. **Versionamento**
Para APIs grandes, use versionamento:
```javascript
app.use('/api/v1', routesV1);
app.use('/api/v2', routesV2);
```

---

## 🛡️ Sobre Segurança do Código

### O cliente pode ver o código?
**NÃO!** O código do backend roda no servidor, não no navegador.

**O que o cliente vê:**
- ✅ Apenas as respostas JSON da API
- ✅ URLs dos endpoints

**O que o cliente NÃO vê:**
- ❌ Código-fonte do servidor
- ❌ Lógica de negócio
- ❌ Validações internas
- ❌ Conexões com banco de dados

**No navegador (F12):**
O cliente só vê as requisições HTTP e respostas, nunca o código Node.js do servidor.

---

## 🔧 Scripts Disponíveis

```bash
npm start        # Inicia o servidor
npm test         # Executa testes (ainda não configurado)
```

---

## 📝 Atualizando a Documentação

Sempre que adicionar novos endpoints:

1. Atualize `README.md` (este arquivo)
2. Atualize `documentation.txt`
3. Atualize `src/routes/index.js` (documentação da API)

---

## 🚨 Troubleshooting

### Erro: "Cannot find module"
```bash
npm install  # Reinstale as dependências
```

### Erro: "Port 3000 already in use"
```bash
# Encontre e mate o processo:
netstat -ano | findstr :3000
taskkill /PID [número_do_pid] /F
```

### Acesso negado (403)
Verifique se seu IP está em `src/config/allowedIPs.js`

---

## 📞 Suporte

Para dúvidas ou problemas:
- Verifique a documentação completa
- Consulte `documentation.txt` para referência rápida
- Revise a estrutura de pastas

---

**Última atualização:** Outubro 2025
**Versão da API:** 1.0.0
**Node.js:** >= 22.18.0
