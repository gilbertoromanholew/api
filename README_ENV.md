# 🔐 Guia de Configuração de Ambiente - API

## 📁 Estrutura de Arquivos

```
api/
├── .env                    ← Desenvolvimento LOCAL (NÃO commitar)
├── .env.coolify            ← Template para PRODUÇÃO (Coolify)
├── .env.production         ← Backup produção (NÃO commitar)
├── dist-api/               ← Código da aplicação
│   ├── server.js           ← Ponto de entrada
│   ├── package.json        ← Dependências
│   └── src/                ← Código fonte
└── Dockerfile              ← Build para produção
```

---

## 🏠 DESENVOLVIMENTO LOCAL

### 1️⃣ Arquivo: `.env`

**Status:** ✅ Configurado e pronto
**Localização:** `api/.env`
**Características:**
- `NODE_ENV=development`
- `FRONTEND_URL=http://localhost:5173`
- Session secret simples para dev
- IPs mais permissivos (192.168.0.0/16, 10.0.0.0/8)
- Logs verbosos, limites maiores

### 2️⃣ Como executar localmente:

```bash
# Navegue até a pasta raiz do projeto
cd "c:\Users\Gilberto Silva\Documents\GitHub\api"

# Opção 1: Executar com Node.js
node dist-api/server.js

# Opção 2: Executar com Nodemon (auto-reload)
npx nodemon dist-api/server.js

# Opção 3: Via npm (se configurado)
npm start
```

### 3️⃣ Testar se funcionou:

```bash
# A API deve iniciar em http://localhost:3000
# Acesse no navegador ou curl:
curl http://localhost:3000/api/health
```

---

## 🚀 PRODUÇÃO (Coolify)

### 1️⃣ Arquivo: `.env.coolify`

**Status:** ✅ Template pronto
**Localização:** `api/.env.coolify`
**Uso:** Referência para configurar no Coolify

### 2️⃣ Como configurar no Coolify:

1. Acesse seu projeto no **Coolify**
2. Vá em **Environment Variables**
3. Adicione cada variável abaixo com os valores de produção:

```bash
# ========== VARIÁVEIS OBRIGATÓRIAS ==========
SUPABASE_URL=https://mpanel.samm.host
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

SESSION_SECRET=77750ce22daa1ae1d8b0d44e0c19fd5c1e32e80744a944459b9bb3d1470b344f

ALLOWED_IPS=127.0.0.1,localhost,::1,172.16.0.0/12,10.244.43.0/24

FRONTEND_URL=https://samm.host

# ========== VARIÁVEIS OPCIONAIS ==========
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
SESSION_MAX_AGE=3600000
```

### 3️⃣ Deploy no Coolify:

1. Configure as variáveis (acima)
2. Faça commit e push do código
3. Coolify fará o deploy automaticamente
4. Acesse: `https://samm.host/api/health`

---

## 🔒 SEGURANÇA

### ❌ NÃO FAZER:
- ❌ Commitar `.env` ou `.env.production` no Git
- ❌ Usar a mesma SESSION_SECRET em dev e prod
- ❌ Compartilhar secrets em chats/emails
- ❌ Usar valores padrão fracos em produção

### ✅ FAZER:
- ✅ Manter `.env` local e ignorado pelo Git
- ✅ Configurar secrets apenas no Coolify para produção
- ✅ Usar `.env.coolify` apenas como template (sem valores reais)
- ✅ Rotacionar chaves periodicamente

---

## 🔍 VERIFICAÇÃO

### Desenvolvimento Local:
```bash
# Os logs devem mostrar:
🔧 dotenv carregado, SUPABASE_URL: ✅
NODE_ENV: development
FRONTEND_URL: http://localhost:5173
```

### Produção (Coolify):
```bash
# Os logs devem mostrar:
🔧 dotenv carregado, SUPABASE_URL: ✅
NODE_ENV: production
FRONTEND_URL: https://samm.host
```

---

## 📋 CHECKLIST DE DEPLOYMENT

### Antes do primeiro deploy:
- [ ] Configurar todas as variáveis no Coolify
- [ ] Verificar SESSION_SECRET é diferente de dev
- [ ] Confirmar ALLOWED_IPS está correto
- [ ] Testar localmente antes de deployar

### A cada deploy:
- [ ] Fazer commit do código (sem .env)
- [ ] Push para o repositório
- [ ] Coolify faz build e deploy automático
- [ ] Verificar logs do container
- [ ] Testar endpoint de health

---

## 🆘 TROUBLESHOOTING

### Problema: "SESSION_SECRET não configurada"
**Solução:** Configure a variável no Coolify Environment Variables

### Problema: "ALLOWED_IPS não configurada"
**Solução:** Configure a variável no Coolify Environment Variables

### Problema: "Supabase não configurado"
**Solução:** Verifique SUPABASE_URL e SUPABASE_ANON_KEY no Coolify

### Problema: "Access Denied (403)"
**Solução:** Verifique se seu IP está em ALLOWED_IPS

---

## 📞 SUPORTE

Para dúvidas ou problemas:
1. Verifique os logs do container no Coolify
2. Confira se todas as variáveis estão configuradas
3. Teste localmente primeiro antes de fazer deploy