# 🔒 Guia de RLS (Row Level Security) do Supabase

## 📋 O que é RLS?

**RLS (Row Level Security)** é um recurso de segurança do PostgreSQL que o Supabase usa para controlar quem pode acessar quais dados em suas tabelas.

Quando RLS está **ativo** em uma tabela:
- ✅ Apenas usuários autorizados podem ler/escrever
- ❌ Clientes não autorizados recebem dados vazios (`null`)
- 🔐 Proteção automática contra acesso indevido

---

## ⚠️ Problema Comum: Cliente Anônimo vs Admin

### ❌ **ERRADO - Cliente Anônimo não consegue ler tabelas com RLS:**

```javascript
// Cliente com ANON_KEY (público)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ❌ Retorna NULL mesmo com dados no banco!
const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('cpf', '70109948467');

console.log(data); // null (bloqueado pelo RLS!)
```

**Por que acontece:**
- `ANON_KEY` = chave pública, sem privilégios
- Tabela `profiles` tem RLS ativo
- PostgreSQL bloqueia acesso não autorizado
- Resultado: `data = null`

---

### ✅ **CORRETO - Cliente Admin ignora RLS:**

```javascript
// Cliente com SERVICE_ROLE_KEY (admin)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// ✅ Retorna dados mesmo com RLS ativo!
const { data } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('cpf', '70109948467');

console.log(data); // { id: "...", cpf: "70109948467", ... } ✅
```

**Por que funciona:**
- `SERVICE_ROLE_KEY` = chave privada com poderes de admin
- Ignora todas as políticas de RLS
- Acesso total ao banco de dados
- **⚠️ NUNCA exponha esta chave no frontend!**

---

## 🎯 Quando usar cada cliente?

| Cliente | Chave Usada | Usa RLS? | Casos de Uso |
|---------|-------------|----------|--------------|
| `supabase` | `ANON_KEY` | ✅ Sim | Frontend público, APIs expostas |
| `supabaseAdmin` | `SERVICE_ROLE_KEY` | ❌ Não | Backend, operações administrativas |

---

## 📝 Casos de Uso Práticos

### 1️⃣ **Verificar CPF/Email (Backend Privado)**

```javascript
// ✅ CORRETO - Usa Admin (backend não tem usuário logado)
router.post('/check-cpf', async (req, res) => {
    const { data } = await supabaseAdmin  // ← Admin!
        .from('profiles')
        .select('id, cpf')
        .eq('cpf', cleanCPF)
        .maybeSingle();
    
    res.json({ exists: !!data });
});
```

### 2️⃣ **Buscar Dados do Usuário Logado (Frontend)**

```javascript
// ✅ CORRETO - Usa Anon (usuário tem token de sessão)
const { data: { session } } = await supabase.auth.getSession();

const { data: profile } = await supabase  // ← Anon OK!
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
```

**Por que funciona:**
- Usuário está autenticado (tem token)
- RLS permite ler próprios dados
- Política típica: `auth.uid() = id`

### 3️⃣ **Criar Usuário (Backend Administrativo)**

```javascript
// ✅ CORRETO - Usa Admin (criação de usuário é admin)
router.post('/register', async (req, res) => {
    // Criar usuário em auth.users
    const { data: authData } = await supabaseAdmin.auth.admin.createUser({
        email, password
    });
    
    // Criar perfil em public.profiles
    const { error } = await supabaseAdmin  // ← Admin!
        .from('profiles')
        .insert({
            id: authData.user.id,
            cpf: cleanCPF,
            full_name
        });
});
```

---

## 🚨 Sintomas de Problema com RLS

Se você vê isso nos logs:

```javascript
console.log('Buscando CPF:', cpf);
console.log('Resultado:', data);  // null 😱

console.log('Erro:', error);  // null (sem erro!)
```

**Sinais:**
- ✅ Requisição executou sem erro
- ❌ Retorna `null` ou array vazio `[]`
- ✅ Dados existem no banco (você vê no Supabase Dashboard)
- ❌ Mas API não encontra

**Diagnóstico:** Provavelmente RLS bloqueando!

---

## 🔧 Como Verificar RLS no Supabase

### Opção 1: Dashboard Visual

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Authentication** → **Policies**
4. Procure pela tabela (ex: `profiles`)
5. Se vê políticas listadas, RLS está ativo ✅

### Opção 2: SQL Editor

```sql
-- Ver status do RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Ver políticas ativas
SELECT * FROM pg_policies 
WHERE tablename = 'profiles';
```

**Resultado:**
```
tablename | rowsecurity
----------|------------
profiles  | true        ← RLS está ATIVO!
```

---

## 🛠️ Solução: Configuração Correta no Código

### Setup Inicial (server.js ou authRoutes.js):

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ✅ Cliente público (respeita RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ✅ Cliente admin (ignora RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
```

### Variáveis de Ambiente (.env):

```bash
# Supabase Configuration
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # ⚠️ NUNCA commite!
```

---

## ✅ Checklist de Implementação

Ao criar novos endpoints que acessam o banco:

- [ ] **Pergunta 1:** Este endpoint é público ou privado?
  - ✅ Público (login, registro) → pode usar `supabaseAdmin`
  - ✅ Privado (perfil do usuário) → verificar autenticação primeiro

- [ ] **Pergunta 2:** Usuário está autenticado?
  - ✅ Sim → pode usar `supabase` (com token de sessão)
  - ❌ Não → precisa usar `supabaseAdmin`

- [ ] **Pergunta 3:** A tabela tem RLS ativo?
  - ✅ Sim → decidir entre `supabase` (com auth) ou `supabaseAdmin`
  - ❌ Não → qualquer cliente funciona

- [ ] **Pergunta 4:** É operação administrativa?
  - ✅ Sim (criar usuário, deletar conta) → usar `supabaseAdmin`
  - ❌ Não (ler próprio perfil) → usar `supabase`

---

## 🎓 Exemplos Práticos do Projeto

### ❌ Bug Original (commit f74181c):

```javascript
// PROBLEMA: Usava cliente anônimo para buscar CPF
router.post('/check-cpf', async (req, res) => {
    const { data } = await supabase  // ❌ ERRADO!
        .from('profiles')
        .select('id, cpf')
        .eq('cpf', cleanCPF)
        .maybeSingle();
    
    // Sempre retornava null por causa do RLS!
    res.json({ exists: !!data });  // exists: false (sempre!)
});
```

**Sintomas:**
- CPF existe no banco: `70109948467`
- API retorna: `{ exists: false }`
- Usuário pode se registrar com CPF duplicado 😱

### ✅ Correção (commit 718de83):

```javascript
// SOLUÇÃO: Usa cliente admin
router.post('/check-cpf', async (req, res) => {
    const { data } = await supabaseAdmin  // ✅ CORRETO!
        .from('profiles')
        .select('id, cpf')
        .eq('cpf', cleanCPF)
        .maybeSingle();
    
    // Agora encontra o CPF corretamente!
    res.json({ exists: !!data });  // exists: true ✅
});
```

**Resultado:**
```
Input: { cpf: "701.099.484-67" }
Output: { exists: true, message: "CPF já cadastrado" } ✅
```

---

## 📚 Referências

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Service Role Key](https://supabase.com/docs/guides/api/api-keys)

---

## 🎯 Resumo: Regra de Ouro

```javascript
// ❓ Como decidir qual cliente usar?

// Backend sem usuário logado + tabela com RLS? 
→ supabaseAdmin ✅

// Frontend com usuário logado + tabela com RLS?
→ supabase (com token de sessão) ✅

// Operação administrativa (criar/deletar usuário)?
→ supabaseAdmin sempre! ✅
```

---

**Criado em:** 20/10/2025  
**Última atualização:** 20/10/2025  
**Contexto:** Correção do bug de verificação de CPF (commit 718de83)
