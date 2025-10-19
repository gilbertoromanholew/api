# 🔧 Scripts de Configuração Automática

## 📁 Arquivos criados:

### 1. **config.bat** - Menu principal
Executa um menu interativo para escolher o ambiente.

### 2. **config-dev.bat** - Desenvolvimento
Configura automaticamente para localhost:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5173`

### 3. **config-prod.bat** - Produção
Configura automaticamente para produção:
- Frontend: `https://api.samm.host`
- Backend: `https://samm.host`

---

## 🚀 Como usar:

### Método 1: Menu interativo
```bash
cd api
config.bat
```

Depois escolha:
- `[1]` para desenvolvimento
- `[2]` para produção

### Método 2: Direto
```bash
# Configurar para desenvolvimento
cd api
config-dev.bat

# Ou configurar para produção
cd api
config-prod.bat
```

---

## ✅ O que os scripts fazem:

### **config-dev.bat:**
1. Atualiza `tools-website-builder/.env`:
   - `VITE_API_URL=http://localhost:3000`

2. Atualiza `api/.env`:
   - `FRONTEND_URL=http://localhost:5173`

### **config-prod.bat:**
1. Atualiza `tools-website-builder/.env`:
   - `VITE_API_URL=https://api.samm.host`

2. Atualiza `api/.env`:
   - `FRONTEND_URL=https://samm.host`

3. Mostra lembretes de:
   - Adicionar CORS no server.js
   - Configurar Supabase Coolify
   - Configurar SMTP

---

## ⚠️ Ainda precisa fazer manualmente:

### 1. **CORS no server.js**
Adicionar:
```javascript
origin: [
    'https://samm.host',      // ADICIONAR
    'https://api.samm.host',  // ADICIONAR
    // ... resto
]
```

### 2. **Supabase Coolify**
```
ADDITIONAL_REDIRECT_URLS=https://samm.host/auth*,https://samm.host/*
GOTRUE_SITE_URL=https://samm.host
```

### 3. **SMTP no Supabase**
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SUA_API_KEY
SMTP_SENDER=noreply@samm.host
```

---

## 🧪 Fluxo de trabalho recomendado:

### Desenvolvimento local:
1. Executar `config-dev.bat`
2. Iniciar backend: `cd api && npm start`
3. Iniciar frontend: `cd tools-website-builder && npm run dev`

### Deploy para produção:
1. Executar `config-prod.bat`
2. Adicionar CORS no server.js
3. Build frontend: `cd tools-website-builder && npm run build`
4. Configurar Supabase Coolify
5. Subir API: `cd api && npm start` ou `pm2 start`
6. Deploy dist/ do frontend

### Voltar para desenvolvimento:
1. Executar `config-dev.bat`
2. Pronto!

---

## 📝 Notas importantes:

- ✅ Scripts preservam outras variáveis do .env
- ✅ Pedem confirmação antes de mudar para produção
- ✅ Mostram mensagens claras de sucesso/erro
- ⚠️ CORS e Supabase precisam ser configurados manualmente

---

## 🆘 Solução de problemas:

### "O sistema não pode encontrar o caminho especificado"
- Certifique-se de executar de dentro da pasta `api/`

### "Acesso negado"
- Execute como administrador se necessário

### ".env não foi modificado"
- Verifique se o arquivo existe
- Verifique permissões de escrita

---

## ✨ Próximas melhorias:

Posso criar scripts adicionais para:
- [ ] Build automático
- [ ] Deploy automatizado
- [ ] Backup de .env antes de mudar
- [ ] Rollback para configuração anterior
- [ ] Validação de variáveis antes de deploy

**Quer que eu adicione alguma dessas funcionalidades?** 🚀
