# ❓ PERGUNTAS E RESPOSTAS FREQUENTES

## 🤔 DÚVIDAS CONCEITUAIS

### **P: Por que a API precisa ser pública se eu quero segurança?**

**R:** Pública ≠ Insegura!

A API é "pública" no sentido de ser **acessível via HTTPS**, mas:
- ✅ Só aceita requests de `https://samm.host` (CORS)
- ✅ Valida JWT/sessão em TODAS as rotas
- ✅ Aplica rate limiting e IP filtering
- ✅ Usa HTTPS com certificado válido
- ✅ **NUNCA expõe** `SERVICE_ROLE_KEY` ao cliente

**Analogia:** Um banco é "público" (você pode entrar), mas tem segurança (guardas, cofres, autenticação).

---

### **P: O frontend não poderia acessar o Supabase diretamente para ser mais rápido?**

**R:** Poderia, mas você perderia:

**❌ Sem API (cliente → Supabase direto):**
- Cliente tem acesso ao `ANON_KEY` (pode fazer engenharia reversa)
- Não pode usar `SERVICE_ROLE_KEY` (segredo absoluto)
- Não pode fazer validações customizadas
- Não pode implementar lógica de negócio complexa
- Difícil adicionar logs centralizados
- Difícil aplicar rate limiting por usuário

**✅ Com API (cliente → API → Supabase):**
- Cliente nunca vê `SERVICE_ROLE_KEY`
- Você controla TODA a lógica de negócio
- Pode adicionar validações extras
- Pode fazer agregações/transformações de dados
- Pode implementar cache
- Logs centralizados e monitoramento

---

### **P: Por que não usar SSR (Server-Side Rendering) então?**

**R:** SSR resolve problemas diferentes!

**SSR (Nuxt/Next):** Renderiza HTML no servidor a cada request
- ✅ Melhor para SEO
- ✅ Primeira carga mais rápida
- ❌ Mais complexo de configurar
- ❌ Maior carga no servidor

**SPA (Vue/Vite - seu caso):** Renderiza HTML no navegador
- ✅ Mais simples de desenvolver
- ✅ Interatividade instantânea após carregamento
- ✅ Pode ser servido como arquivos estáticos (CDN)
- ❌ SEO precisa de cuidados extras

**Seu caso:** SPA + API é a arquitetura correta para ferramentas web interativas.

---

## 🔐 DÚVIDAS DE SEGURANÇA

### **P: Meus dados estão seguros se a API é pública?**

**R:** Sim! A segurança vem de:

1. **HTTPS:** Criptografia end-to-end (Let's Encrypt)
2. **Autenticação:** JWT/Sessões validadas em cada request
3. **Autorização:** Políticas de acesso (RLS no Supabase)
4. **CORS:** Só aceita requests de `https://samm.host`
5. **Rate Limiting:** Previne abuso
6. **IP Filtering:** Bloqueia IPs suspeitos
7. **Secrets no servidor:** Cliente nunca vê `SERVICE_ROLE_KEY`

---

### **P: Alguém pode ver minhas environment variables?**

**R:** Depende de onde estão:

**❌ NO FRONTEND (JavaScript):**
```javascript
// NUNCA faça isso!
const apiKey = 'sk-super-secret-key-123';
```
→ Qualquer um pode ver no código-fonte do navegador

**✅ NO BACKEND (API):**
```javascript
// Seguro! Só existe no servidor
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
```
→ Cliente nunca tem acesso

**✅ NO COOLIFY:**
Environment Variables são injetadas no container no momento do deploy
→ Não ficam no código, não vão para o Git

---

### **P: E se alguém tentar acessar `http://supabase-kong-jcsck88cks440scs08w4ggcs:8000` diretamente?**

**R:** Impossível!

- DNS interno do Docker só funciona DENTRO das networks
- Do navegador do cliente: ❌ Não resolve
- De outro servidor: ❌ Não resolve
- Do host (servidor): ❌ Não resolve (precisa estar dentro de um container na mesma network)

**Único lugar que funciona:** Dentro de containers conectados à network `jcsck88cks440scs08w4ggcs`

---

## 🌐 DÚVIDAS DE REDE

### **P: Por que preciso conectar a API em duas networks?**

**R:** Cada network tem um propósito:

**Network `coolify`:**
- API recebe requests do Traefik
- Traefik está nessa network
- Frontend também está nessa network (mas não precisa falar com API internamente)

**Network `jcsck88cks440scs08w4ggcs`:**
- API se comunica com Supabase
- Todos os serviços do Supabase estão aqui
- Isolamento: outros containers não acessam

**Analogia:** Você precisa de duas portas - uma para clientes entrarem (coolify) e outra para ir ao cofre (Supabase).

---

### **P: O Traefik não está bloqueando minhas requisições?**

**R:** Traefik só roteia, não bloqueia (por padrão).

**Como funciona:**
1. Request chega em `https://samm.host/api/health`
2. Traefik verifica labels dos containers
3. Encontra: `Host(samm.host) && PathPrefix(/api)` → API Container
4. Roteia para `http://api-container:3000/health`

**Traefik só bloqueia se:**
- Container não tem labels `traefik.enable=true`
- Rule não bate com o request
- Certificado SSL inválido

---

### **P: Como o Traefik sabe para onde rotear?**

**R:** Através de labels no container!

```yaml
# Labels da API
traefik.enable=true  ← Traefik, olhe para mim!
traefik.http.routers.api.rule=Host(`samm.host`) && PathPrefix(`/api`)  ← Se request for samm.host/api/*, sou eu!
traefik.http.services.api.loadbalancer.server.port=3000  ← Envie para minha porta 3000
```

**Coolify gerencia isso automaticamente quando você configura domínios na UI.**

---

## 🐛 DÚVIDAS DE TROUBLESHOOTING

### **P: Meu `curl https://samm.host/api/health` retorna 404. E agora?**

**R:** Checklist:

```bash
# 1. Container está rodando?
docker ps | grep lwck8gk8owg0w8ggk0k8k4cs

# 2. Container tem as labels do Traefik?
docker inspect lwck8gk8owg0w8ggk0k8k4cs-011438063626 | grep -i traefik

# 3. Traefik está rodando?
docker ps | grep traefik

# 4. API responde internamente?
docker exec lwck8gk8owg0w8ggk0k8k4cs-011438063626 wget -O- http://localhost:3000/api/health

# 5. Logs do Traefik mostram a rota?
docker logs coolify-proxy | grep -i api
```

---

### **P: Erro "Network not found". O que fazer?**

**R:** A network do Supabase pode ter mudado de nome.

```bash
# Listar todas as networks
docker network ls | grep -E "supabase|jcsck"

# Encontrar a network correta
docker inspect supabase-kong-* --format='{{json .NetworkSettings.Networks}}' | jq

# Conectar com o nome correto
docker network connect <NOME_DA_NETWORK> <CONTAINER_DA_API>
```

---

### **P: CORS error no navegador. Como resolver?**

**R:** 3 pontos para verificar:

```javascript
// 1. API tem CORS configurado?
app.use(cors({
  origin: 'https://samm.host',  ← Deve ser EXATAMENTE o domínio do frontend
  credentials: true
}));

// 2. Frontend envia credentials?
fetch('https://samm.host/api/login', {
  credentials: 'include'  ← Importante!
});

// 3. Environment variable está correta?
FRONTEND_URL=https://samm.host  ← Sem barra no final!
```

---

### **P: "Connection refused" ao acessar Supabase. Por quê?**

**R:** Checklist:

```bash
# 1. API está na network do Supabase?
docker inspect <API_CONTAINER> | grep -A 10 Networks
# Deve aparecer: jcsck88cks440scs08w4ggcs

# 2. Supabase Kong está rodando?
docker ps | grep supabase-kong

# 3. DNS resolve dentro do container?
docker exec <API_CONTAINER> nslookup supabase-kong-jcsck88cks440scs08w4ggcs

# 4. Porta está correta?
docker exec <API_CONTAINER> wget -O- http://supabase-kong-jcsck88cks440scs08w4ggcs:8000
```

---

## 🚀 DÚVIDAS DE DEPLOY

### **P: Preciso redeployar a API toda vez que mudar uma env var?**

**R:** Sim (na maioria dos casos).

- Environment variables são injetadas no **momento da criação** do container
- Se você mudar no Coolify, precisa **redeployar** para aplicar
- Exceção: Se você usa `dotenv` e monta `.env` como volume (não recomendado em produção)

---

### **P: Como atualizar a API sem downtime?**

**R:** Coolify suporta zero-downtime deployments:

1. Build nova imagem
2. Cria novo container
3. Espera healthcheck passar (seu `/api/health` é crucial!)
4. Traefik começa a rotear para novo container
5. Container antigo é removido

**Pré-requisito:** Healthcheck configurado corretamente!

---

### **P: Posso ter staging e production?**

**R:** Sim! Duas estratégias:

**Opção 1: Branches diferentes**
- `main` → https://samm.host (produção)
- `staging` → https://staging.samm.host

**Opção 2: Projetos diferentes no Coolify**
- Projeto API (prod) → `samm.host/api`
- Projeto API Staging → `staging.samm.host/api`

Cada um com suas próprias environment variables.

---

## 💡 DÚVIDAS DE OTIMIZAÇÃO

### **P: A comunicação API → Supabase é lenta?**

**R:** Não! É local (mesma máquina).

**Comparação:**
```
Cliente → Supabase diretamente:
  Internet (50-200ms) → Supabase

Cliente → API → Supabase:
  Internet (50-200ms) → API → Local (<1ms) → Supabase
  
Overhead: < 1ms
```

**Benefício:** Você ganha controle total por ~1ms de latência.

---

### **P: Posso cachear respostas do Supabase?**

**R:** Sim! Implementando cache na API:

```javascript
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 60 }); // 60 segundos

app.get('/api/users', async (req, res) => {
  const cached = cache.get('users');
  if (cached) return res.json(cached);
  
  const { data } = await supabase.from('users').select('*');
  cache.set('users', data);
  res.json(data);
});
```

**Impossível fazer isso se cliente acessar Supabase diretamente!**

---

### **P: Como escalar a API se tiver muitos usuários?**

**R:** Coolify + Docker facilita:

1. **Horizontal scaling:** Múltiplas instâncias da API
2. **Load balancing:** Traefik distribui requisições
3. **Cache:** Redis entre API e Supabase
4. **CDN:** Cloudflare na frente do Traefik

---

## 📚 DÚVIDAS DE ARQUITETURA

### **P: E se eu quiser mobile app também?**

**R:** A API já está pronta!

```
Web (Vue.js) ──┐
               ├──→ API ──→ Supabase
Mobile (React Native) ──┘
```

Ambos usam a mesma API. Só ajuste o CORS:

```javascript
app.use(cors({
  origin: [
    'https://samm.host',
    'capacitor://localhost',  // iOS
    'http://localhost'  // Android
  ],
  credentials: true
}));
```

---

### **P: Posso adicionar mais bancos de dados?**

**R:** Sim! API como gateway:

```
API ──→ Supabase (usuários, autenticação)
   ├──→ MongoDB (logs, analytics)
   ├──→ Redis (cache, sessões)
   └──→ S3 (arquivos grandes)
```

Frontend só conversa com a API, não sabe o que há por trás.

---

### **P: E se o Supabase ficar lento?**

**R:** API pode implementar circuit breaker:

```javascript
import CircuitBreaker from 'opossum';

const breaker = new CircuitBreaker(async (query) => {
  return await supabase.from('users').select(query);
}, { timeout: 3000 });

breaker.fallback(() => {
  return { data: [], error: 'Service temporarily unavailable' };
});
```

---

## 🎓 CONCEITOS IMPORTANTES

### **Diferença entre ANON_KEY e SERVICE_ROLE_KEY:**

**ANON_KEY (público):**
- Pode ser exposto no frontend
- Respeita Row Level Security (RLS)
- Permissões limitadas
- Exemplo: Usuário só vê próprios dados

**SERVICE_ROLE_KEY (secreto):**
- NUNCA deve ser exposto
- Bypass do RLS (acesso total)
- Permissões administrativas
- Exemplo: Admin vê todos os dados

**Seu caso:** Frontend usa API que usa SERVICE_ROLE_KEY (seguro).

---

### **Como funciona Row Level Security (RLS)?**

```sql
-- Política no Supabase
CREATE POLICY "Usuários veem apenas próprios dados"
ON public.users
FOR SELECT
USING (auth.uid() = id);
```

**Com ANON_KEY:**
```javascript
// Cliente consegue apenas seus dados
const { data } = await supabase.from('users').select('*');
// Retorna só o usuário logado
```

**Com SERVICE_ROLE_KEY:**
```javascript
// API consegue tudo (admin)
const { data } = await supabase.from('users').select('*');
// Retorna TODOS os usuários
```

---

## 🎯 RESUMO FINAL

**Arquitetura correta:**
```
Cliente (navegador)
    ↓ (HTTPS)
API (pública + autenticada)
    ↓ (Docker network)
Supabase (privado)
```

**Pontos-chave:**
1. Frontend faz requests para a API (não tem como evitar em SPA)
2. API é pública mas protegida (CORS, auth, rate limit)
3. Supabase é privado (só API acessa)
4. Security vem das camadas de proteção, não de "esconder" a API

**Próximos passos:** Execute o `EXECUTAR_AGORA.md` e teste! 🚀
