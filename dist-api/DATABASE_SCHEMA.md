# 📊 DATABASE SCHEMA - Supabase

**Projeto:** AJI - Análise Jurídica Inteligente  
**Data:** 2024-10-20  
**Versão:** 1.0.0  

---

## 🗄️ Estrutura do Banco de Dados

O Supabase usa **duas tabelas principais** para gerenciar usuários:

1. **`auth.users`** - Tabela gerenciada pelo Supabase (credenciais, autenticação)
2. **`public.profiles`** - Tabela customizada (dados adicionais do usuário)

### 🔗 Relacionamento

```
auth.users (1) ←──────── (1) public.profiles
     ↑                            ↓
     └────── id (UUID) ───────── id (FK)
```

---

## 📋 Tabela: `auth.users`

**Gerenciada por:** Supabase Auth  
**Acesso:** Apenas via `supabaseAdmin.auth.admin.*`  
**Não pode:** Fazer queries diretas com `.from('auth.users')`

### Schema Real

```typescript
interface AuthUser {
  // 🔑 Identificação
  id: string;                    // UUID - Primary Key
  aud: string;                   // "authenticated"
  role: string;                  // "authenticated"
  
  // 📧 Email e Autenticação
  email: string;                 // ← EMAIL ESTÁ AQUI
  encrypted_password: string;    // ← SENHA ESTÁ AQUI (hash bcrypt)
  email_confirmed_at: string;    // Timestamp de confirmação
  confirmed_at: string;          // Timestamp geral de confirmação
  
  // 🔐 Tokens
  confirmation_token: string;
  confirmation_sent_at: string;
  recovery_token: string;
  recovery_sent_at: string;
  email_change_token_new: string;
  email_change: string;
  email_change_sent_at: string;
  
  // 📱 Telefone
  phone: string | null;
  phone_confirmed_at: string | null;
  phone_change: string;
  phone_change_token: string;
  phone_change_sent_at: string | null;
  
  // 🔒 Segurança
  reauthentication_token: string;
  reauthentication_sent_at: string | null;
  is_super_admin: boolean | null;
  banned_until: string | null;
  deleted_at: string | null;
  
  // 📊 Metadados
  raw_app_meta_data: {
    provider: string;            // "email"
    providers: string[];         // ["email"]
  };
  
  raw_user_meta_data: {
    cpf?: string;                // ⚠️ CPF pode estar aqui (backup)
    full_name?: string;          // ⚠️ Nome pode estar aqui (backup)
    email_verified?: boolean;
    [key: string]: any;
  };
  
  // 🕐 Timestamps
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
  
  // 🔐 Outros
  instance_id: string;
  invited_at: string | null;
  is_sso_user: boolean;
  is_anonymous: boolean;
  email_change_token_current: string;
  email_change_confirm_status: number;
}
```

### Exemplo Real

```json
{
  "id": "79c9845a-245f-4961-ac4b-122112abe183",
  "email": "m.gilbertoromanhole@gmail.com",
  "encrypted_password": "$2a$10$v6IIifyiXfdOfd5TVSsygu3idFmz4bw73HWD8ZtZlHnNJF45Lx3eu",
  "email_confirmed_at": "2025-10-20 04:38:53.997167+00",
  "confirmed_at": "2025-10-20 04:38:53.997167+00",
  "raw_user_meta_data": {
    "cpf": "70109948467",
    "full_name": "Gilberto Romanhole",
    "email_verified": true
  },
  "created_at": "2025-10-20 04:38:42.952731+00",
  "updated_at": "2025-10-20 04:38:53.997859+00"
}
```

### Como Acessar

```javascript
// ✅ CORRETO - Via Admin API
const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(userId);
console.log(user.email);          // "m.gilbertoromanhole@gmail.com"
console.log(user.encrypted_password); // Hash bcrypt

// ✅ CORRETO - Listar todos
const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

// ❌ ERRADO - Query direta NÃO funciona
const { data } = await supabase.from('auth.users').select('*'); // ERRO!
```

---

## 📋 Tabela: `public.profiles`

**Gerenciada por:** Aplicação  
**Acesso:** Via `.from('profiles')`  
**Relacionamento:** `profiles.id = auth.users.id` (FK CASCADE)

### Schema SQL

```sql
CREATE TABLE public.profiles (
  -- 🔑 Identificação
  id UUID NOT NULL,                        -- FK para auth.users.id
  
  -- 👤 Dados Pessoais
  cpf VARCHAR(14) NOT NULL,                -- ← CPF ESTÁ AQUI (formato: "70109948467")
  full_name VARCHAR(255) NOT NULL,         -- ← NOME ESTÁ AQUI
  avatar_url TEXT NULL,
  
  -- 🎁 Sistema de Referência
  referral_code VARCHAR(20) NOT NULL,      -- Código único do usuário
  referred_by UUID NULL,                   -- Quem indicou este usuário
  
  -- ✅ Status
  email_verified BOOLEAN DEFAULT FALSE,
  
  -- 🕐 Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 🔐 Constraints
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_cpf_key UNIQUE (cpf),
  CONSTRAINT profiles_referral_code_key UNIQUE (referral_code),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) 
    REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT profiles_referred_by_fkey FOREIGN KEY (referred_by) 
    REFERENCES auth.users (id)
) TABLESPACE pg_default;

-- 📑 Índices
CREATE INDEX idx_profiles_cpf ON public.profiles USING btree (cpf);
CREATE INDEX idx_profiles_referral_code ON public.profiles USING btree (referral_code);
CREATE INDEX idx_profiles_referred_by ON public.profiles USING btree (referred_by);

-- 🔄 Trigger
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

### Schema TypeScript

```typescript
interface Profile {
  id: string;                    // UUID - FK para auth.users.id
  cpf: string;                   // "70109948467" (11 dígitos)
  full_name: string;             // "Gilberto Romanhole"
  avatar_url: string | null;     // URL da imagem
  referral_code: string;         // "USER-ABC123"
  referred_by: string | null;    // UUID do referrer
  email_verified: boolean;       // true/false
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
}
```

### Como Acessar

```javascript
// ✅ CORRETO - Query direta
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('cpf', '70109948467')
  .single();

console.log(profile.cpf);        // "70109948467"
console.log(profile.full_name);  // "Gilberto Romanhole"
console.log(profile.id);         // "79c9845a-245f-4961-ac4b-122112abe183"
```

---

## 🔍 Onde Encontrar Cada Informação

### 📧 Email
```javascript
// LOCAL: auth.users.email
const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
const email = user.email; // "m.gilbertoromanhole@gmail.com"
```

### 🔐 Senha (Hash)
```javascript
// LOCAL: auth.users.encrypted_password
const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
const passwordHash = user.encrypted_password; // "$2a$10$..."

// ⚠️ NUNCA expor ou retornar para o cliente!
```

### 🆔 CPF
```javascript
// LOCAL PRIMÁRIO: public.profiles.cpf
const { data: profile } = await supabase
  .from('profiles')
  .select('cpf')
  .eq('id', userId)
  .single();
const cpf = profile.cpf; // "70109948467"

// LOCAL SECUNDÁRIO (fallback): auth.users.raw_user_meta_data.cpf
const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
const cpf = user.raw_user_meta_data?.cpf; // "70109948467"
```

### 👤 Nome Completo
```javascript
// LOCAL PRIMÁRIO: public.profiles.full_name
const { data: profile } = await supabase
  .from('profiles')
  .select('full_name')
  .eq('id', userId)
  .single();
const name = profile.full_name; // "Gilberto Romanhole"

// LOCAL SECUNDÁRIO (fallback): auth.users.raw_user_meta_data.full_name
const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
const name = user.raw_user_meta_data?.full_name; // "Gilberto Romanhole"
```

### 🎁 Código de Referência
```javascript
// LOCAL: public.profiles.referral_code
const { data: profile } = await supabase
  .from('profiles')
  .select('referral_code')
  .eq('id', userId)
  .single();
const code = profile.referral_code; // "USER-ABC123"
```

### ✅ Email Verificado
```javascript
// LOCAL PRIMÁRIO: public.profiles.email_verified
const { data: profile } = await supabase
  .from('profiles')
  .select('email_verified')
  .eq('id', userId)
  .single();
const verified = profile.email_verified; // true/false

// LOCAL SECUNDÁRIO: auth.users.email_confirmed_at
const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
const verified = !!user.email_confirmed_at; // true se tiver timestamp
```

---

## 🔄 Fluxos Comuns

### 1️⃣ Verificar se CPF existe e obter email

```javascript
// PASSO 1: Buscar profile por CPF
const { data: profile } = await supabase
  .from('profiles')
  .select('id')
  .eq('cpf', cleanCPF)
  .maybeSingle();

if (!profile) {
  return { exists: false };
}

// PASSO 2: Buscar email em auth.users usando o ID
const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(profile.id);

// PASSO 3: Mascarar email (LGPD)
const [localPart, domain] = user.email.split('@');
const maskedEmail = localPart.substring(0, 3) + '***' + '@' + domain;

return { 
  exists: true, 
  email: maskedEmail // "m.g***@gmail.com"
};
```

### 2️⃣ Verificar se email existe

```javascript
// OPÇÃO A: Listar todos os usuários (não ideal para muitos usuários)
const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
const exists = users.some(u => u.email === email);

// OPÇÃO B: Criar função RPC (recomendado)
// Ver seção "Otimizações" abaixo
```

### 3️⃣ Criar novo usuário completo

```javascript
// PASSO 1: Criar em auth.users
const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
  email: email,
  password: password,
  email_confirm: false,
  user_metadata: {
    full_name: fullName,
    cpf: cleanCPF
  }
});

// PASSO 2: Criar profile
await supabaseAdmin
  .from('profiles')
  .insert({
    id: authData.user.id,              // Mesmo ID!
    cpf: cleanCPF,
    full_name: fullName,
    referral_code: generateCode(),
    email_verified: false
  });
```

### 4️⃣ Fazer login

```javascript
// Login é feito com email + senha
const { data, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password
});

// Retorna sessão + user de auth.users
console.log(data.user.email);          // Email
console.log(data.user.id);             // ID para buscar profile
console.log(data.session.access_token); // JWT token
```

### 5️⃣ Buscar dados completos do usuário

```javascript
// Opção A: Queries separadas
const userId = session.user.id;

const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();

const userData = {
  id: user.id,
  email: user.email,                    // de auth.users
  cpf: profile.cpf,                     // de profiles
  full_name: profile.full_name,         // de profiles
  avatar_url: profile.avatar_url,       // de profiles
  referral_code: profile.referral_code, // de profiles
  email_verified: profile.email_verified
};

// Opção B: LEFT JOIN (via RPC ou View)
// Ver seção "Otimizações" abaixo
```

---

## ⚠️ Armadilhas Comuns

### ❌ ERRO #1: Buscar email de profiles
```javascript
// ❌ ERRADO - profiles NÃO TEM email
const { data } = await supabase
  .from('profiles')
  .select('email') // ← Esta coluna não existe!
  .eq('cpf', cpf)
  .single();
```

### ❌ ERRO #2: Query direta em auth.users
```javascript
// ❌ ERRADO - Não pode fazer query direta
const { data } = await supabase
  .from('auth.users') // ← Não funciona!
  .select('email')
  .eq('id', userId);
```

### ❌ ERRO #3: Não usar maybeSingle()
```javascript
// ❌ ERRADO - .single() lança erro se não encontrar
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('cpf', cpf)
  .single(); // ← Erro se CPF não existe!

// ✅ CORRETO - .maybeSingle() retorna null
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('cpf', cpf)
  .maybeSingle(); // ← Retorna null se não encontrar
```

### ❌ ERRO #4: Não fazer CASCADE
```javascript
// ❌ ERRADO - Deletar profile antes do user
await supabase.from('profiles').delete().eq('id', userId);
await supabaseAdmin.auth.admin.deleteUser(userId); // Profile já deletado

// ✅ CORRETO - Deletar user (CASCADE deleta profile)
await supabaseAdmin.auth.admin.deleteUser(userId);
// Profile é deletado automaticamente pelo CASCADE
```

---

## 🚀 Otimizações Recomendadas

### 1️⃣ Função RPC para verificar email

```sql
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

Uso:
```javascript
const { data: exists } = await supabase.rpc('check_email_exists', { 
  email_to_check: email 
});
```

### 2️⃣ View para JOIN automático

```sql
CREATE OR REPLACE VIEW public.users_full AS
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at as auth_created_at,
  p.cpf,
  p.full_name,
  p.avatar_url,
  p.referral_code,
  p.referred_by,
  p.email_verified,
  p.created_at as profile_created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id;
```

Uso (com RLS apropriado):
```javascript
const { data } = await supabase
  .from('users_full')
  .select('*')
  .eq('id', userId)
  .single();
```

### 3️⃣ Índice para busca por email (se criar coluna)

Se decidir adicionar coluna `email` em profiles (sincronizado):
```sql
ALTER TABLE public.profiles ADD COLUMN email VARCHAR(255);
CREATE UNIQUE INDEX idx_profiles_email ON public.profiles (email);

-- Trigger para sincronizar
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET email = NEW.email 
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_email_to_profile
AFTER INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE FUNCTION sync_profile_email();
```

---

## 📚 Referências Rápidas

### Imports Necessários
```javascript
import { createClient } from '@supabase/supabase-js';

// Client normal (usuário logado)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin client (todas as permissões)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
```

### Diferenças Client vs Admin

| Operação | Client Normal | Admin Client |
|----------|---------------|--------------|
| Ler profiles | ✅ (com RLS) | ✅ (sem RLS) |
| Criar user em auth | ❌ | ✅ |
| Ler auth.users | ❌ | ✅ |
| Listar todos users | ❌ | ✅ |
| Atualizar qualquer user | ❌ | ✅ |

### Queries Essenciais

```javascript
// Buscar profile por CPF
const { data } = await supabase.from('profiles').select('*').eq('cpf', cpf).maybeSingle();

// Buscar profile por ID
const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();

// Buscar user por ID (admin)
const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);

// Listar todos users (admin)
const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();

// Criar user (admin)
const { data } = await supabaseAdmin.auth.admin.createUser({ email, password });

// Atualizar user (admin)
const { data } = await supabaseAdmin.auth.admin.updateUserById(userId, { email_confirm: true });

// Login (client)
const { data } = await supabase.auth.signInWithPassword({ email, password });

// Get sessão atual (client)
const { data: { session } } = await supabase.auth.getSession();
```

---

## 📊 Diagrama do Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────┐         ┌──────────────────────┐  │
│  │   auth.users       │         │  public.profiles     │  │
│  │ (Supabase Auth)    │◄────────┤  (Custom Table)      │  │
│  ├────────────────────┤   FK    ├──────────────────────┤  │
│  │ 🔑 id (UUID)       │◄────────┤ 🔑 id (FK)           │  │
│  │ 📧 email           │         │ 🆔 cpf               │  │
│  │ 🔐 password (hash) │         │ 👤 full_name         │  │
│  │ ✅ email_confirmed │         │ 🖼️  avatar_url       │  │
│  │ 📊 user_metadata   │         │ 🎁 referral_code     │  │
│  │ 🕐 created_at      │         │ 👥 referred_by       │  │
│  └────────────────────┘         │ ✅ email_verified    │  │
│           ↑                     │ 🕐 created_at        │  │
│           │                     └──────────────────────┘  │
│           │                                                │
│  ┌────────┴───────────┐                                   │
│  │ Session/JWT Token  │                                   │
│  │ (Frontend Storage) │                                   │
│  └────────────────────┘                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Checklist para Novas Features

Ao implementar funcionalidade que envolve usuários:

- [ ] Preciso de email? → Buscar de `auth.users`
- [ ] Preciso de senha? → Usar `signInWithPassword()` ou verificar hash em `auth.users`
- [ ] Preciso de CPF? → Buscar de `public.profiles`
- [ ] Preciso de nome? → Buscar de `public.profiles`
- [ ] Preciso verificar existência? → Primeiro buscar em `profiles`, depois fallback para `user_metadata`
- [ ] Vou criar usuário? → Criar em `auth.users` E `public.profiles` (ambos!)
- [ ] Vou deletar usuário? → Deletar de `auth.users` (CASCADE deleta profile)
- [ ] Preciso de admin access? → Usar `supabaseAdmin`
- [ ] É operação do usuário? → Usar `supabase` client normal

---

## 👤 Autoria

**Criado por:** GitHub Copilot  
**Revisado por:** Gilberto Silva  
**Data:** 2024-10-20  
**Versão:** 1.0.0  
**Projeto:** AJI - Análise Jurídica Inteligente
