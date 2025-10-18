# 🚀 API Modular - Node.js & Express

[![Node.js](https://img.shields.io/badge/Node.js-22.18.0+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Version](https://img.shields.io/badge/Version-2.10.2-blue.svg)](https://github.com/gilbertoromanholew/api)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **API REST modular com auto-descoberta de rotas, sistema de segurança inteligente e dashboard de monitoramento em tempo real.**

🌐 **Produção:** https://api.samm.host

---

## ⚡ Quick Start

```bash
# Clone e instale
git clone https://github.com/gilbertoromanholew/api.git
cd api
npm install

# Configure (opcional)
cp .env.example .env

# Inicie
npm start
```

**Acesse:**
- 📖 API: http://localhost:3000
- 📚 Docs: http://localhost:3000/docs
- 📊 Dashboard: http://localhost:3000/logs

---

## ✨ Características Principais

### 🏗️ Arquitetura
- **Modular** - Funcionalidades independentes com auto-descoberta
- **Escalável** - Pronto para crescer horizontal e verticalmente
- **Limpo** - BaseController + validação centralizada

### 🔒 Segurança
- **Whitelist de IPs** - Controle de acesso com CIDR
- **Bloqueio Automático** - Suspensões e bloqueios progressivos
- **Geolocalização** - 24+ campos (país, cidade, ISP, proxy/VPN)
- **Autorização Temporária** - IPs dinâmicos em memória

### 📊 Monitoramento
- **Dashboard em Tempo Real** - Métricas, IPs, logs (auto-refresh 15s)
- **Sistema de Filtros Avançado** - Quantidade, Status, Método HTTP, Endpoint, IP
- **Logging Completo** - Registra TODOS os acessos sem filtros (5000 logs em memória)
- **Documentação Interativa** - Teste endpoints direto no navegador
- **Cache Inteligente** - Rotas (5min) + geo (24h)
- **Tema Escuro Premium** - Design moderno com gradientes e animações suaves

---

## 📦 Estrutura do Projeto

```
api/
├── src/
│   ├── config/           # Configurações (IPs, env)
│   ├── core/             # BaseController + routeLoader
│   ├── functions/        # Módulos independentes ⭐
│   │   ├── exemplo/      # CRUD de usuários
│   │   ├── pdf/          # Leitura de PDFs
│   │   └── _TEMPLATE/    # Template para novas funções
│   ├── middlewares/      # Segurança + validação
│   ├── routes/           # Rotas especiais (docs, logs)
│   └── utils/            # Utilitários
├── server.js             # Entry point
└── package.json
```

---

## 🛠️ Como Criar Nova Funcionalidade

### Método 1: Copiar Template (5 minutos)

```bash
# 1. Copie o template
cp -r src/functions/_TEMPLATE src/functions/minhaFeature

# 2. Renomeie os arquivos
cd src/functions/minhaFeature
mv templateController.js minhaFeatureController.js
mv templateRoutes.js minhaFeatureRoutes.js
mv templateUtils.js minhaFeatureUtils.js

# 3. Implemente sua lógica
# Edite os arquivos e substitua "template" por "minhaFeature"

# 4. Reinicie o servidor
npm start
```

**Pronto!** A rota foi descoberta automaticamente.

### Método 2: Estrutura Manual

```javascript
// src/functions/usuarios/usuariosRoutes.js
import { Router } from 'express';
const router = Router();

router.get('/usuarios', (req, res) => {
    res.json({ success: true, data: [] });
});

export default router;
```

---

## 🔒 Configuração de Segurança

### Autorizar IPs

```bash
# Via .env (permanente)
ALLOWED_IPS=192.168.1.100,10.0.0.0/8

# Via Dashboard (temporário - memória)
# Acesse /logs → 🔓 Autorizar Acesso
```

### Desbloquear IP

```bash
# Via API
curl -X POST http://localhost:3000/api/security/unblock/192.168.1.100

# Via Dashboard
# Acesse /logs → Card do IP → 🔓 Desbloquear
```

---

## 🌍 Endpoints Disponíveis

### Documentação
- `GET /` - Documentação JSON
- `GET /docs` - Interface interativa

### Exemplos
- `GET /usuarios` - Listar usuários
- `POST /usuarios` - Criar usuário
- `POST /read-pdf` - Extrair texto de PDF

### Monitoramento
- `GET /logs` - Dashboard visual completo
- `GET /api/logs/list` - Logs em JSON
- `GET /api/logs/stats` - Estatísticas em tempo real
- `GET /api/logs/summary` - Resumo de acessos

### Segurança
- `GET /api/security/unified` - Lista unificada de IPs
- `POST /api/security/authorize-ip` - Autorizar IP
- `POST /api/security/unauthorize-ip/:ip` - Remover autorização
- `POST /api/security/block/:ip` - Bloquear IP
- `POST /api/security/unblock/:ip` - Desbloquear IP
- `POST /api/security/suspend/:ip` - Suspender IP

---

## 📚 Documentação Completa

- 📖 [Arquitetura Detalhada](./docs/ARQUITETURA.md)
- 🔒 [Guia de Segurança](./docs/SEGURANCA.md)
- 📡 [Referência da API](./docs/API_REFERENCE.md)
- 🔍 [Auditoria Final](./AUDITORIA_FINAL.md)
- 📝 [Changelog](./CHANGELOG.md)
- 🎨 [Design System](./docs/DESIGN.md) *(em breve)*

---

## 🚀 Deployment

### Docker (Recomendado)

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
docker build -t api-modular .
docker run -p 3000:3000 --env-file .env api-modular
```

### PM2 (Process Manager)

```bash
npm install -g pm2
pm2 start server.js --name api-modular
pm2 save
pm2 startup
```

---

## ⚙️ Variáveis de Ambiente

```bash
# .env
PORT=3000
ALLOWED_IPS=127.0.0.1,::1,192.168.1.0/24
NODE_ENV=production
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga os passos:

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/MinhaFeature`
3. Commit: `git commit -m 'Adiciona MinhaFeature'`
4. Push: `git push origin feature/MinhaFeature`
5. Abra um Pull Request

---

## 📄 Licença

[MIT License](LICENSE) - Você é livre para usar, modificar e distribuir.

---

## 👨‍💻 Autor

**Gilberto Roman Holew**
- GitHub: [@gilbertoromanholew](https://github.com/gilbertoromanholew)
- URL: https://api.samm.host

---

## 📊 Status do Projeto

- ✅ **v2.10.2** - Refresh sincronizado em 15s para todas as seções
- ✅ **v2.10.1** - Padronização inicial de refresh em 30s
- ✅ **v2.10.0** - Remoção de filtros de logging + limite aumentado para 5000
- ✅ **v2.9.3** - Animações suavizadas nos cards de estatísticas
- ✅ **v2.9.2** - Correção de hover nos dropdowns (tema escuro)
- ✅ **v2.9.1** - Correção de cores de fundo dos filtros
- ✅ **v2.9.0** - Redesign completo do painel de filtros (2 linhas organizadas)
- ✅ **v2.8.0** - Sistema de filtros avançado (Quantidade, Status, Método, Endpoint, IP)
- ✅ **v2.7.2** - Correção definitiva do scroll do modal de histórico
- ✅ **v2.7.0** - Reorganização de seções do dashboard
- ✅ **v2.2.4** - Sistema de autorização temporária
- ✅ **v2.2.3** - Correção de paleta de modais
- ✅ **v2.2.0** - Lista unificada de IPs + Dashboard

**Score de Qualidade:** 9.7/10 🌟

---

## 🎨 Destaques da Interface

### Dashboard Premium (v2.9.0+)
- **Painel de Filtros Organizado** - 2 linhas com labels descritivos e ícones
- **Tema Escuro Consistente** - Gradientes azul/roxo em toda a interface
- **Animações Suaves** - Hover elegante nos cards (-4px, sombras sutis)
- **Responsivo** - Design adaptável para desktop e mobile
- **Auto-refresh Inteligente** - Pausa ao interagir, retoma automaticamente

### Sistema de Filtros (v2.8.0+)
- 📊 **Quantidade**: 25, 50, 100, 200, 500, Todos
- ✅ **Status**: Todos, Autorizados, Negados
- 🔧 **Método HTTP**: Todos, GET, POST, PUT, DELETE, PATCH
- 🔍 **Busca por Endpoint**: Filtro de URL em tempo real
- � **Busca por IP**: Localização rápida de IPs específicos
- 🧹 **Limpar Filtros**: Reset completo com um clique

---

**⭐ Gostou? Deixe uma estrela no GitHub!**
