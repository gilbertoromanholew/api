# 🚀 API Node.js + Supabase com Coolify

API Gateway segura construída com Node.js + Express, integrada com Supabase e deployada via Coolify.

## 📚 DOCUMENTAÇÃO COMPLETA

### ⚡ **INÍCIO RÁPIDO** (5 minutos)

**Quer fazer funcionar AGORA?**  
👉 **[EXECUTAR_AGORA.md](./EXECUTAR_AGORA.md)** - Comandos prontos para copiar e colar

**Quer um guia passo a passo?**  
👉 **[GUIA_RAPIDO.md](./GUIA_RAPIDO.md)** - Tutorial completo com troubleshooting

---

### 📖 **DOCUMENTAÇÃO TÉCNICA**

- **[INDEX.md](./INDEX.md)** - Índice de toda documentação
- **[NETWORK_TOPOLOGY.md](./NETWORK_TOPOLOGY.md)** - Topologia da rede e containers
- **[DIAGRAMA.md](./DIAGRAMA.md)** - Diagramas visuais da arquitetura
- **[FAQ.md](./FAQ.md)** - Perguntas frequentes

---

### ⚙️ **CONFIGURAÇÃO**

- **[README_ENV.md](./README_ENV.md)** - Guia de environment variables
- **[CONFIG.md](./CONFIG.md)** - Segurança e configuração
- **[.env.coolify](./.env.coolify)** - Template para produção

---

## 🏗️ ARQUITETURA

```
Cliente (Navegador)
    ↓ HTTPS
Traefik (Reverse Proxy)
    ↓
API Node.js (Gateway público + auth)
    ↓ Docker Network
Supabase Kong (Privado)
    ↓
PostgreSQL + Auth + Storage
```

**Características:**

- ✅ **SPA + API Gateway:** Frontend estático, API dinâmica
- ✅ **Segurança em camadas:** HTTPS, JWT, CORS, IP filtering, RLS
- ✅ **Supabase privado:** Apenas API tem acesso interno
- ✅ **Escalável:** Docker + Traefik + Multiple instances

---

## 🚀 TECNOLOGIAS

**Backend:**
- Node.js v22+ (ES Modules)
- Express.js
- Supabase Client
- express-session
- dotenv

**Infraestrutura:**
- Docker + Alpine
- Coolify (Deploy)
- Traefik (Reverse Proxy)
- Supabase (BaaS)

**Segurança:**
- JWT Authentication
- Session-based auth
- IP filtering
- CORS restrictivo
- HTTPS (Let's Encrypt)

---

## 📦 ESTRUTURA DO PROJETO

```
api/
├── server.js                 # Entrada principal
├── Dockerfile               # Build para produção
├── package.json             # Dependências
│
├── src/
│   ├── config/              # Configurações
│   │   ├── index.js         # Config centralizada
│   │   └── supabase.js      # Cliente Supabase
│   │
│   ├── middlewares/         # Middlewares
│   │   ├── ipFilter.js      # Filtro de IP
│   │   ├── validator.js     # Validação de sessão
│   │   └── errorHandler.js  # Tratamento de erros
│   │
│   ├── routes/              # Rotas principais
│   │   ├── index.js         # Router principal
│   │   └── ...              # Outras rotas
│   │
│   └── functions/           # Lógica por feature
│       ├── auth/            # Autenticação
│       ├── user/            # Usuários
│       └── ...              # Outras features
│
├── docs/                    # Documentação
│   ├── INDEX.md             # Índice
│   ├── EXECUTAR_AGORA.md    # Guia rápido
│   ├── GUIA_RAPIDO.md       # Tutorial completo
│   ├── NETWORK_TOPOLOGY.md  # Arquitetura
│   ├── DIAGRAMA.md          # Diagramas
│   └── FAQ.md               # Perguntas frequentes
│
├── .env                     # Config local (não commitado)
├── .env.coolify             # Template produção (commitado)
└── .gitignore               # Arquivos ignorados
```

---

## 🔧 DESENVOLVIMENTO LOCAL

### Pré-requisitos

- Node.js v22+
- npm ou yarn
- Acesso ao Supabase (URL + Keys)

### Instalação

```bash
# Clonar repositório
git clone <repo-url>
cd api

# Instalar dependências
npm install

# Configurar environment variables
cp .env.example .env
# Editar .env com suas credenciais
```

### Executar

```bash
# Desenvolvimento
npm run dev

# Produção
npm start

# Docker local
docker build -t api-local .
docker run -p 3000:3000 --env-file .env api-local
```

### Testar

```bash
# Health check
curl http://localhost:3000/api/health

# Deve retornar:
# {"status":"healthy","timestamp":"...","uptime":123}
```

---

## 🌐 DEPLOY EM PRODUÇÃO (COOLIFY)

### Requisitos

- Servidor com Docker
- Coolify instalado
- Domínio configurado (DNS)
- Supabase rodando (interno ou externo)

### Passo a passo rápido

1. **Conectar API ao Supabase:**
   ```bash
   docker network connect jcsck88cks440scs08w4ggcs <API_CONTAINER>
   ```

2. **Configurar domínio no Coolify:**
   - Domain: `seu-dominio.com`
   - Path: `/api`
   - Port: `3000`

3. **Adicionar Environment Variables:**
   ```bash
   SUPABASE_URL=https://sua-url.supabase.co
   SUPABASE_ANON_KEY=seu-anon-key
   SUPABASE_SERVICE_ROLE_KEY=seu-service-role-key
   FRONTEND_URL=https://seu-dominio.com
   SESSION_SECRET=<gerar-com-openssl-rand-hex-32>
   NODE_ENV=production
   ```

4. **Redeploy no Coolify**

5. **Validar:**
   ```bash
   curl https://seu-dominio.com/api/health
   ```

**📖 Guia completo:** [EXECUTAR_AGORA.md](./EXECUTAR_AGORA.md)

---

## 🔐 SEGURANÇA

### Camadas de Proteção

1. **HTTPS/TLS:** Criptografia end-to-end (Let's Encrypt)
2. **Traefik:** Rate limiting, DDoS protection básico
3. **Middlewares:** IP filtering, CORS, validação de sessão
4. **Autenticação:** JWT + Session-based
5. **Autorização:** Role-based access control
6. **Supabase RLS:** Row Level Security no banco

### Boas Práticas

- ✅ `SERVICE_ROLE_KEY` nunca exposta ao frontend
- ✅ CORS configurado apenas para domínio específico
- ✅ Sessões com expiração configurável
- ✅ IP filtering com whitelist/blacklist
- ✅ Logs de acesso centralizados
- ✅ Environment variables via Coolify (não commitadas)

**📖 Detalhes:** [CONFIG.md](./CONFIG.md)

---

## 🧪 ENDPOINTS

### Públicos (sem auth)

```bash
GET /api/health         # Health check
```

### Autenticados (requer sessão)

```bash
POST   /api/auth/login       # Login
POST   /api/auth/logout      # Logout
GET    /api/auth/me          # Usuário atual
POST   /api/auth/register    # Registro (se habilitado)

GET    /api/user/profile     # Perfil do usuário
PUT    /api/user/profile     # Atualizar perfil

# Adicione seus endpoints aqui...
```

**📖 Documentação completa:** (adicionar Swagger/OpenAPI)

---

## 🐛 TROUBLESHOOTING

### Problema: `curl https://dominio.com/api/health` retorna 404

**Solução:** Traefik não está roteando para a API.
- Verifique labels do container
- Confirme domínio configurado no Coolify
- Veja logs: `docker logs coolify-proxy`

**📖 Ver:** [GUIA_RAPIDO.md - Troubleshooting](./GUIA_RAPIDO.md#troubleshooting)

---

### Problema: API não consegue acessar Supabase

**Solução:** Networks não conectadas.
```bash
docker network connect jcsck88cks440scs08w4ggcs <API_CONTAINER>
```

**📖 Ver:** [NETWORK_TOPOLOGY.md](./NETWORK_TOPOLOGY.md)

---

### Problema: CORS error no frontend

**Solução:** Verificar `FRONTEND_URL` nas environment variables.
```bash
FRONTEND_URL=https://seu-dominio.com  # Sem barra no final!
```

**📖 Ver:** [FAQ.md - CORS](./FAQ.md#cors)

---

## 📊 MONITORAMENTO

### Logs

```bash
# Logs da API
docker logs <API_CONTAINER> -f --tail 100

# Logs do Traefik
docker logs coolify-proxy -f --tail 100
```

### Health Check

```bash
# Endpoint de health
curl https://seu-dominio.com/api/health

# Resposta esperada:
{
  "status": "healthy",
  "timestamp": "2025-10-19T12:00:00.000Z",
  "uptime": 123.456
}
```

### Métricas (futuro)

- [ ] Prometheus + Grafana
- [ ] Uptime monitoring (Uptime Kuma)
- [ ] Error tracking (Sentry)

---

## 🤝 CONTRIBUINDO

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'feat: adiciona nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

---

## 📝 LICENÇA

[MIT](LICENSE)

---

## 📞 SUPORTE

- **Documentação:** [INDEX.md](./INDEX.md)
- **FAQ:** [FAQ.md](./FAQ.md)
- **Issues:** GitHub Issues

---

## 🎉 AGRADECIMENTOS

- [Supabase](https://supabase.com) - Backend-as-a-Service
- [Coolify](https://coolify.io) - Self-hosted deployment
- [Traefik](https://traefik.io) - Reverse proxy

---

**⚡ PRÓXIMO PASSO:** Leia [EXECUTAR_AGORA.md](./EXECUTAR_AGORA.md) para fazer deploy!
