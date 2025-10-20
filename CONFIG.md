# 🔐 Configuração de Segurança da API

## 📋 Variáveis de Ambiente Obrigatórias

### 🚨 CRÍTICO - Configurar no Coolify Environment Variables

As seguintes variáveis DEVEM ser configuradas no Coolify para a API funcionar:

```bash
# ========== VARIÁVEIS CRÍTICAS ==========
SUPABASE_URL=https://mpanel.samm.host
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

SESSION_SECRET=uma-chave-muito-segura-de-pelo-menos-32-caracteres

ALLOWED_IPS=127.0.0.1,localhost,::1,172.16.0.0/12,10.244.43.0/24

FRONTEND_URL=https://samm.host

# ========== VARIÁVEIS OPCIONAIS ==========
NODE_ENV=production
SESSION_MAX_AGE=86400000
MAX_LOGS=1000
LOG_RETENTION_DAYS=7
MAX_FILE_SIZE=10485760
ALLOWED_MIME_TYPES=application/pdf
```

## 🛡️ Por que essas variáveis são críticas?

### SUPABASE_*
- **Risco**: Exposição do banco de dados
- **Impacto**: Acesso não autorizado aos dados dos usuários
- **Mitigação**: Nunca commitar no código, sempre via Environment Variables

### SESSION_SECRET
- **Risco**: Sessões falsas, roubo de identidade
- **Impacto**: Usuários podem ser impersonados
- **Mitigação**: Chave única e forte, nunca reusar entre ambientes

### ALLOWED_IPS
- **Risco**: Acesso não autorizado à API
- **Impacto**: Ataques externos, DDoS
- **Mitigação**: Lista restrita de IPs confiáveis

### FRONTEND_URL
- **Risco**: CORS bypass, ataques de domínio
- **Impacto**: Requests maliciosos aceitos
- **Mitigação**: URL específica do frontend

## 🚀 Como configurar no Coolify

1. Acesse seu projeto no Coolify
2. Vá em **Environment Variables**
3. Adicione cada variável listada acima
4. **Reinicie o container** após configurar

## 📝 Desenvolvimento Local

Para desenvolvimento local:

```bash
# Copie o template
cp .env.example .env

# Edite o .env com suas chaves locais
# NUNCA commite o .env real!
```

## ⚠️ Avisos de Segurança

- 🔴 **NUNCA** commite arquivos `.env` com valores reais
- 🔴 **NUNCA** use as mesmas chaves em produção e desenvolvimento
- 🔴 **NUNCA** compartilhe chaves em chats ou emails
- ✅ Use gerenciadores de secrets quando possível
- ✅ Rotacione chaves periodicamente
- ✅ Monitore logs por tentativas de acesso suspeitas

## 🔍 Verificação

Após configurar, os logs devem mostrar:
```
🔧 dotenv carregado, SUPABASE_URL: ✅
🔧 Configuração Supabase:
   URL: ✅ Configurada
   ANON_KEY: ✅ Configurada
   SERVICE_ROLE_KEY: ✅ Configurada
```