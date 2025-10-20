# 🎯 COMANDOS PARA EXECUTAR AGORA

## 📝 ORDEM DE EXECUÇÃO

### PASSO 1: Conectar Networks (SSH - 30 segundos)

```bash
# Conectar ao servidor
ssh root@69.62.97.115

# Conectar API à network do Supabase
docker network connect jcsck88cks440scs08w4ggcs lwck8gk8owg0w8ggk0k8k4cs-011438063626

# Confirmar que conectou (deve mostrar a network)
docker inspect lwck8gk8owg0w8ggk0k8k4cs-011438063626 --format='{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}'

# Testar conectividade com Supabase
docker exec lwck8gk8owg0w8ggk0k8k4cs-011438063626 sh -c "wget -O- http://supabase-kong-jcsck88cks440scs08w4ggcs:8000 2>&1 | head -5"
```

**✅ Resultado esperado:**
```
coolify jcsck88cks440scs08w4ggcs  ← Duas networks!
404 page not found ← Kong respondeu!
```

---

### PASSO 2: Configurar Coolify (UI - 2 minutos)

1. **Abrir painel:** http://69.62.97.115:8000
2. **Localizar projeto da API** (nome: `lwck8gk8owg0w8ggk0k8k4cs`)
3. **Ir em: Configuration** ou **Domains**

**Se houver campo de domínio:**
- Domain: `samm.host`
- Path: `/api`
- Port: `3000`
- Enable HTTPS

**Se NÃO houver, ir em "Labels" e adicionar:**
```
traefik.enable=true
traefik.http.routers.apibackend.rule=Host(`samm.host`) && PathPrefix(`/api`)
traefik.http.routers.apibackend.entrypoints=https
traefik.http.routers.apibackend.tls=true
traefik.http.routers.apibackend.tls.certresolver=letsencrypt
traefik.http.services.apibackend.loadbalancer.server.port=3000
```

4. **Ir em: Environment Variables**

Adicionar/verificar:
```
SUPABASE_URL=https://mpanel.samm.host
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmdmN2dGtkd3B5bGZ6cXl5bmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkxODA0MTEsImV4cCI6MjA0NDc1NjQxMX0.rn-fHj7XVbOH4e2u-ZVU1VU5UXEqF5yWBqcIVb38G9k
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmdmN2dGtkd3B5bGZ6cXl5bmlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTE4MDQxMSwiZXhwIjoyMDQ0NzU2NDExfQ.w0hVeE5PdIoXYwKq3Gc0JdX2FjJLRPKBzQ4RjXXGTD0
FRONTEND_URL=https://samm.host
ALLOWED_IPS=127.0.0.1,localhost,::1,10.0.0.0/8,172.16.0.0/12
SESSION_SECRET=77750ce22daa1ae1d8b0d44e0c19fd5c1e32e80744a944459b9bb3d1470b344f
SESSION_MAX_AGE=3600000
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
```

5. **Clicar em: Redeploy** ou **Restart**

---

### PASSO 3: Validar (1 minuto)

```bash
# Do seu computador (PowerShell ou cmd)

# Teste 1: Health check público
curl https://samm.host/api/health

# Deve retornar:
# {"status":"healthy","timestamp":"..."}
```

```bash
# Teste 2: Logs da API (SSH)
ssh root@69.62.97.115
docker logs lwck8gk8owg0w8ggk0k8k4cs-011438063626 --tail 30

# Procurar por:
# ✅ "Servidor rodando em http://0.0.0.0:3000"
# ✅ "dotenv carregado, SUPABASE_URL: ✅"
# ❌ Não deve ter erros de conexão
```

---

## 🔍 SE ALGO DER ERRADO

### ❌ `curl https://samm.host/api/health` → 404

**Diagnóstico:**
```bash
ssh root@69.62.97.115

# Ver se o container está rodando
docker ps | grep lwck8gk8owg0w8ggk0k8k4cs

# Ver logs do Traefik
docker logs coolify-proxy --tail 50 | grep -i api

# Ver labels do container da API
docker inspect lwck8gk8owg0w8ggk0k8k4cs-011438063626 | grep -A 30 Labels
```

**Possível solução:** Labels não configuradas, volte ao Coolify e adicione manualmente.

---

### ❌ API não consegue acessar Supabase

**Diagnóstico:**
```bash
ssh root@69.62.97.115

# Entrar no container
docker exec -it lwck8gk8owg0w8ggk0k8k4cs-011438063626 sh

# Testar DNS
nslookup supabase-kong-jcsck88cks440scs08w4ggcs
# ou
ping supabase-kong-jcsck88cks440scs08w4ggcs

# Testar HTTP
wget -O- http://supabase-kong-jcsck88cks440scs08w4ggcs:8000
```

**Possível solução:** Network não conectada, execute novamente:
```bash
docker network connect jcsck88cks440scs08w4ggcs lwck8gk8owg0w8ggk0k8k4cs-011438063626
```

---

### ❌ CORS error no frontend

**Sintoma:** Console do navegador mostra erro de CORS

**Solução:** Verifique que `FRONTEND_URL=https://samm.host` está configurado corretamente no Coolify.

---

## 📊 RESUMO DOS COMANDOS

**SSH (1 comando principal):**
```bash
docker network connect jcsck88cks440scs08w4ggcs lwck8gk8owg0w8ggk0k8k4cs-011438063626
```

**Coolify UI:**
1. Adicionar domínio: `samm.host/api` → porta `3000`
2. Configurar Environment Variables (lista acima)
3. Redeploy

**Validação:**
```bash
curl https://samm.host/api/health
```

---

## ✅ SUCESSO!

Se `curl https://samm.host/api/health` retornou JSON com `"status":"healthy"`, está funcionando! 🎉

**Próximo passo:** Testar login no frontend e verificar se a comunicação completa funciona.
