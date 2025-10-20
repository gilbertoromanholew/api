# 🔧 FIX - Schema Profiles e Trust Proxy

**Data:** 2024-10-20
**Commit:** `0e2cc9a`
**Status:** ✅ Corrigido

---

## 📋 Problemas Identificados

### 🔴 Problema #1: Trust Proxy não configurado
```
ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false
code: 'ERR_ERL_UNEXPECTED_X_FORWARDED_FOR'
```

**Causa:** Express não estava configurado para confiar em proxies reversos (Traefik/Nginx).

**Impacto:**
- Rate limiting não funcionava corretamente
- IP do cliente não era detectado corretamente
- Headers X-Forwarded-For eram ignorados

### 🔴 Problema #2: Coluna `email` não existe em `profiles`
```
column profiles.email does not exist
```

**Causa:** As rotas `/check-cpf` e `/check-email` estavam tentando buscar `email` da tabela `profiles`, mas essa coluna **não existe** no schema.

**Schema Correto:**
```sql
-- ❌ profiles NÃO TEM email
create table public.profiles (
  id uuid not null,
  cpf character varying(14) not null,
  full_name character varying(255) not null,
  avatar_url text null,
  referral_code character varying(20) not null,
  referred_by uuid null,
  email_verified boolean null default false,
  -- NÃO TEM: email
  ...
)

-- ✅ Email está em auth.users
{
  "id": "79c9845a-245f-4961-ac4b-122112abe183",
  "email": "m.gilbertoromanhole@gmail.com", // ← AQUI
  "raw_user_meta_data": {
    "cpf": "70109948467",
    "full_name": "Gilberto Romanhole"
  }
}
```

---

## ✅ Soluções Implementadas

### 1️⃣ Configurar Trust Proxy

**Arquivo:** `server.js`

```javascript
// ANTES
const app = express();

// Security Headers (CSP, HSTS, X-Frame-Options, etc) - PRIMEIRO
app.use(securityHeaders);

// DEPOIS
const app = express();

// Trust proxy - IMPORTANTE: Permite que o Express confie no Traefik/Nginx
// Necessário para rate limiting e logs corretos quando atrás de proxy
app.set('trust proxy', 1);

// Security Headers (CSP, HSTS, X-Frame-Options, etc) - PRIMEIRO
app.use(securityHeaders);
```

**Benefícios:**
- ✅ Rate limiting detecta IP correto do cliente
- ✅ Logs mostram IP real (não o do proxy)
- ✅ Headers X-Forwarded-For funcionam corretamente
- ✅ Geolocalização funciona corretamente

### 2️⃣ Corrigir `/check-cpf` para buscar email de `auth.users`

**Arquivo:** `authRoutes.js`

```javascript
// ❌ ANTES: Buscava email de profiles (não existe)
const { data, error } = await supabase
    .from('profiles')
    .select('id, email') // ← email não existe!
    .eq('cpf', cleanCPF)
    .maybeSingle();

// ✅ DEPOIS: Busca ID do profile, depois email de auth.users
const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id') // ← Só busca ID
    .eq('cpf', cleanCPF)
    .maybeSingle();

// Se encontrou o profile, buscar email do auth.users
let userEmail = null;
if (profileData?.id) {
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(profileData.id);
    
    if (!userError) {
        userEmail = user?.email;
    }
}

// Mascarar email para segurança (LGPD)
let maskedEmail = null;
if (userEmail) {
    const [localPart, domain] = userEmail.split('@');
    const visibleChars = Math.min(3, Math.floor(localPart.length / 2));
    maskedEmail = localPart.substring(0, visibleChars) + '***' + '@' + domain;
}
```

**Fluxo Corrigido:**
1. Busca `profiles` por CPF → retorna `id` (UUID)
2. Usa `id` para buscar `auth.users` → retorna `email`
3. Mascara email → `m.g***@gmail.com`
4. Retorna para frontend

### 3️⃣ Corrigir `/check-email` para buscar de `auth.users`

**Arquivo:** `authRoutes.js`

```javascript
// ❌ ANTES: Buscava email de profiles (não existe)
const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email') // ← email não existe!
    .eq('email', email)
    .maybeSingle();

const emailExists = !!profile;

// ✅ DEPOIS: Busca diretamente em auth.users
const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

if (error) {
    throw error;
}

const emailExists = users?.some(user => user.email === email);
```

**Nota:** Esta solução usa `listUsers()` que não é ideal para performance (carrega todos os usuários). Em produção com muitos usuários, considerar:
- Usar `signInWithPassword()` com senha inválida e verificar erro
- Criar função RPC no Supabase para busca específica
- Criar índice e view materializada

---

## 🧪 Testes Realizados

### ✅ Teste 1: Trust Proxy
```bash
# ANTES
ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false

# DEPOIS
✅ Rate limiter funcionando corretamente
✅ IP do cliente detectado: 177.73.207.121
✅ Sem erros de X-Forwarded-For
```

### ✅ Teste 2: /check-cpf
```bash
# ANTES
❌ 500 Internal Server Error
column profiles.email does not exist

# DEPOIS
✅ 200 OK
{
  "success": true,
  "data": {
    "exists": true,
    "email": "m.g***@gmail.com",
    "cpf": "701.***948-**"
  },
  "message": "CPF já cadastrado"
}
```

### ✅ Teste 3: /check-email
```bash
# ANTES
❌ 500 Internal Server Error
column profiles.email does not exist

# DEPOIS
✅ 200 OK
{
  "success": true,
  "data": {
    "available": false
  },
  "message": "Email já está em uso"
}
```

---

## 📊 Logs de Debug

```
2025-10-20T05:23:23.999Z ValidationError: X-Forwarded-For (ANTES)
2025-10-20T05:23:24.000Z 📝 /check-cpf chamado com: { cpf: 'presente', body: { cpf: '701.099.484-67' } }
2025-10-20T05:23:24.000Z 🧹 CPF limpo: 70109948467
2025-10-20T05:23:24.000Z 🔍 Buscando usuário no Supabase...
2025-10-20T05:23:24.023Z 📊 Resultado da busca: { found: false, error: 'column profiles.email does not exist' } (ANTES)
2025-10-20T05:23:24.023Z ❌ Erro do Supabase: { code: '42703', message: 'column profiles.email does not exist' }

// DEPOIS DA CORREÇÃO
✅ Sem erro de trust proxy
📊 Resultado da busca profile: { found: true }
👤 Buscando email do usuário em auth.users...
📧 Email encontrado: sim
✅ Resposta preparada: { exists: true, maskedEmail: 'm.g***@gmail.com' }
```

---

## 🎯 Impacto

### Antes:
- ❌ Rate limiting não funcionava
- ❌ `/check-cpf` retornava 500
- ❌ `/check-email` retornava 500
- ❌ Frontend não conseguia verificar CPF/email
- ❌ Usuário não conseguia fazer registro

### Depois:
- ✅ Rate limiting funcionando perfeitamente
- ✅ `/check-cpf` retorna 200 com email mascarado
- ✅ `/check-email` retorna 200 com disponibilidade
- ✅ Frontend consegue verificar CPF/email
- ✅ Fluxo de registro funcionando
- ✅ LGPD compliance mantido (emails mascarados)

---

## 📝 Lições Aprendidas

1. **Sempre verificar schema antes de fazer queries**
   - Profiles não tem `email`, apenas `auth.users` tem
   - Usar JOIN ou busca em duas etapas

2. **Trust proxy é essencial em produção**
   - Sempre configurar quando usar Traefik/Nginx/Caddy
   - Necessário para rate limiting e logs corretos

3. **Logs de debug são cruciais**
   - Permitiram identificar exatamente onde estava o erro
   - Mostraram o schema mismatch imediatamente

4. **Supabase tem duas tabelas de usuário**
   - `auth.users` - Credenciais, email, senha
   - `public.profiles` - Dados adicionais (CPF, nome, avatar)
   - Relacionadas por `profiles.id = auth.users.id` (FK)

---

## 🔄 Próximos Passos

### Otimizações Futuras:

1. **Melhorar performance de `/check-email`:**
   ```sql
   -- Criar função RPC para busca específica
   CREATE OR REPLACE FUNCTION check_email_exists(email_to_check TEXT)
   RETURNS BOOLEAN
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   BEGIN
     RETURN EXISTS (
       SELECT 1 FROM auth.users WHERE email = email_to_check
     );
   END;
   $$;
   ```

2. **Adicionar cache para queries frequentes:**
   - Redis cache para verificações de email/CPF
   - TTL de 5 minutos

3. **Monitorar performance:**
   - Adicionar métricas de latência
   - Alertas se tempo de resposta > 500ms

---

## 👤 Autoria

**Implementado por:** GitHub Copilot  
**Revisado por:** Gilberto Silva  
**Data:** 2024-10-20  
**Commit:** `0e2cc9a`
