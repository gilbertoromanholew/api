# 🔐 Arquitetura de Segurança Máxima - Sistema de Créditos

**Data**: 26/10/2025  
**Prioridade**: 🔴 CRÍTICA  
**Status**: ✅ IMPLEMENTADO

---

## 🎯 Princípio Fundamental

> **Sistema de créditos = dinheiro real = MÁXIMA SEGURANÇA**

**ZERO confiança no backend. RLS (Row Level Security) no Postgres como linha final de defesa.**

---

## 🛡️ Camadas de Segurança

### **Camada 1: Frontend (Primeira Linha)**
- ✅ Valida dados antes de enviar
- ✅ Usa `localStorage.getItem('token')` para autenticação
- ✅ Nunca manipula créditos diretamente

### **Camada 2: Backend (Segunda Linha)**
- ✅ Middleware `requireAuth` valida JWT
- ✅ Extrai `req.user.id` e `req.user.token`
- ✅ **NUNCA** usa `supabaseAdmin` para operações de créditos
- ✅ Passa JWT do usuário para Supabase

### **Camada 3: Supabase RLS (Última Linha - INVIOLÁVEL)**
- ✅ Policies bloqueiam UPDATE/DELETE direto
- ✅ Valida `auth.uid() = user_id`
- ✅ Mesmo com bug no backend, Postgres bloqueia

---

## 🔒 Fluxo de Segurança

### **SELECT (Consultar Saldo)**

```javascript
// ✅ CORRETO: JWT do usuário + RLS
export async function getBalance(userId, userToken) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseWithAuth = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${userToken}` // ✅ JWT do usuário
                }
            }
        }
    );
    
    const { data, error } = await supabaseWithAuth
        .from('economy_user_wallets')
        .select('*')
        .eq('user_id', userId) // RLS valida: auth.uid() = userId
        .single();
}
```

**Postgres Policy**:
```sql
CREATE POLICY "users_view_own_wallet"
ON economy_user_wallets FOR SELECT
TO authenticated
USING (auth.uid() = user_id);  -- ✅ Valida que é o próprio usuário
```

**Resultado**: Usuário A **NUNCA** vê dados de B, mesmo com bug no backend.

---

### **UPDATE (Modificar Saldo)**

```javascript
// ❌ BLOQUEADO: UPDATE direto
const { error } = await supabaseWithAuth
    .from('economy_user_wallets')
    .update({ bonus_credits: 1000000 })
    .eq('user_id', userId);
// ❌ ERROR: Policy "users_block_wallet_updates" bloqueou

// ✅ CORRETO: Via function RLS
export async function consumePoints(userId, userToken, amount, metadata) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseWithAuth = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${userToken}` // ✅ JWT do usuário
                }
            }
        }
    );
    
    const { data, error } = await supabaseWithAuth
        .rpc('debit_credits', {
            p_user_id: userId,
            p_amount: amount,
            p_reason: metadata.description
        });
}
```

**Postgres Policy**:
```sql
CREATE POLICY "users_block_wallet_updates"
ON economy_user_wallets FOR UPDATE
TO authenticated
USING (false);  -- ❌ BLOQUEADO para TODOS

-- Function SECURITY DEFINER permite UPDATE, mas valida internamente
CREATE OR REPLACE FUNCTION debit_credits(...)
RETURNS JSON AS $$
BEGIN
  -- ✅ VALIDAÇÃO: Verificar que é o próprio usuário
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  
  -- Lógica de débito...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Resultado**: 
- ❌ UPDATE direto: **BLOQUEADO**
- ✅ Via function: **PERMITIDO** (se auth.uid() = user_id)
- ❌ Usuário A debitar de B: **BLOQUEADO** pela function

---

## 🚨 Cenários de Ataque

### **Ataque 1: Hacker tenta modificar saldo direto**

```javascript
// Hacker abre console do navegador
const { data } = await supabase
  .from('economy_user_wallets')
  .update({ bonus_credits: 1000000 })
  .eq('user_id', 'meu-user-id');

// ❌ RESULTADO: ERROR - Policy bloqueou
```

**Proteção**: Policy `users_block_wallet_updates` bloqueia UPDATE direto.

---

### **Ataque 2: Bug no backend passa userId errado**

```javascript
// Backend com BUG (userId vindo de query param sem validação)
const userId = req.query.userId; // ⚠️ PERIGO! userId de outro usuário
const userToken = req.user.token; // Token do hacker

await getBalance(userId, userToken);

// ❌ RESULTADO: Postgres retorna vazio
// RLS valida: auth.uid() (do token) != userId (query param)
```

**Proteção**: RLS valida `auth.uid()` do JWT, não o `userId` passado.

---

### **Ataque 3: Usuário A tenta debitar de B**

```javascript
// Usuário A (auth.uid = 'aaaa-aaaa') tenta debitar de B
const { data, error } = await supabase
  .rpc('debit_credits', {
    p_user_id: 'bbbb-bbbb', // ❌ Outro usuário
    p_amount: 10
  });

// ❌ RESULTADO: ERROR - "Acesso negado"
```

**Proteção**: Function `debit_credits` valida internamente:
```sql
IF auth.uid() != p_user_id THEN
  RAISE EXCEPTION 'Acesso negado';
END IF;
```

---

## ⚠️ POR QUE NÃO USAR `supabaseAdmin`?

### ❌ **ERRADO** (Vulnerável):
```javascript
// Backend usa service_role (bypassa RLS)
const { data } = await supabaseAdmin
    .from('economy_user_wallets')
    .select('*')
    .eq('user_id', userId); // ⚠️ userId pode ser de outro usuário!

// Se houver bug e userId vier de req.query.userId:
// Hacker pode ver dados de QUALQUER usuário
```

### ✅ **CORRETO** (Seguro):
```javascript
// Backend usa JWT do usuário (RLS ativo)
const { createClient } = await import('@supabase/supabase-js');
const supabaseWithAuth = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
        global: {
            headers: {
                Authorization: `Bearer ${req.user.token}` // ✅ JWT validado
            }
        }
    }
);

const { data } = await supabaseWithAuth
    .from('economy_user_wallets')
    .select('*')
    .eq('user_id', userId);

// Mesmo com bug, Postgres valida auth.uid() do JWT
// Se auth.uid() != userId, retorna vazio
```

---

## 🎯 Quando Usar `supabaseAdmin`?

### ✅ **PERMITIDO**:

1. **Operações administrativas validadas**:
```javascript
// Backend valida que req.user.role === 'admin'
if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
}

// OK usar Admin para adicionar créditos
await supabaseAdmin.rpc('admin_add_credits', {
    p_user_id: targetUserId,
    p_amount: 100,
    p_type: 'bonus'
});
```

2. **Criação de carteira inicial** (registro de usuário):
```javascript
// authRoutes.js - Registro de novo usuário
const { data: newUser } = await supabaseAdmin.auth.signUp({...});

// OK usar Admin: usuário ainda não tem token JWT
await supabaseAdmin
    .from('economy_user_wallets')
    .insert({ user_id: newUser.id, bonus_credits: 100 });
```

3. **Agregações e relatórios admin**:
```javascript
// Admin dashboard - total de créditos no sistema
const { data } = await supabaseAdmin
    .from('economy_user_wallets')
    .select('bonus_credits, purchased_points');
```

### ❌ **PROIBIDO**:

1. **Consultar saldo de usuário comum**
2. **Debitar/adicionar créditos de usuário comum**
3. **Consultar transações de usuário comum**

**Use JWT do usuário + RLS para essas operações!**

---

## 📋 Checklist de Segurança

### **Backend**
- [x] `requireAuth` middleware popula `req.user.token`
- [x] `getBalance(userId, userToken)` usa JWT
- [x] `getHistory(userId, userToken, options)` usa JWT
- [x] `consumePoints(userId, userToken, amount, metadata)` usa JWT
- [x] Todas rotas de créditos passam `req.user.token`

### **Postgres (Supabase)**
- [x] RLS habilitado em `economy_user_wallets`
- [x] RLS habilitado em `economy_transactions`
- [x] Policy SELECT: `auth.uid() = user_id`
- [x] Policy UPDATE: `false` (bloqueado)
- [x] Policy DELETE: `false` (bloqueado)
- [x] Function `debit_credits` valida `auth.uid()`
- [x] Function `admin_add_credits` usa SECURITY DEFINER

### **Frontend**
- [x] Usa `/api/credits/balance` para consultar saldo
- [x] Nunca manipula `economy_user_wallets` diretamente
- [x] Token JWT em `localStorage` enviado via headers

---

## 🧪 Testes de Segurança

### **Teste 1: Isolamento de Dados**
```bash
# Login usuário A
curl -H "Authorization: Bearer TOKEN_A" http://localhost:3000/api/credits/balance
# Retorna: { bonus: 50, purchased: 0, total: 50 }

# Login usuário B
curl -H "Authorization: Bearer TOKEN_B" http://localhost:3000/api/credits/balance
# Retorna: { bonus: 100, purchased: 0, total: 100 }

# ✅ SUCESSO: Cada usuário vê apenas seus dados
```

### **Teste 2: Bloqueio de UPDATE**
```sql
-- Supabase SQL Editor (logado como usuário comum)
UPDATE economy_user_wallets 
SET bonus_credits = 1000000 
WHERE user_id = auth.uid();

-- ❌ ESPERADO: ERROR - Policy bloqueou
```

### **Teste 3: Débito Via Function**
```javascript
// Frontend
const response = await fetch('/api/credits/consume', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ amount: 10, description: 'Teste' })
});

// ✅ ESPERADO: { success: true, new_balance: 90 }
```

---

## 📊 Comparação: Antes vs Depois

| Aspecto | ❌ ANTES (Vulnerável) | ✅ DEPOIS (Seguro) |
|---------|----------------------|-------------------|
| **Consulta SELECT** | `supabaseAdmin` (bypassa RLS) | JWT + RLS (auth.uid() validado) |
| **UPDATE direto** | Permitido (vulnerável) | **BLOQUEADO** por policy |
| **Débito de créditos** | UPDATE direto | Function RLS (valida auth.uid()) |
| **Proteção bug backend** | ❌ Nenhuma | ✅ RLS bloqueia no Postgres |
| **Usuário A ver B** | ⚠️ Possível | ❌ **IMPOSSÍVEL** |
| **Hack via console** | ⚠️ Possível | ❌ **IMPOSSÍVEL** |

---

## 🎓 Lições Aprendidas

1. **NUNCA confiar apenas no backend** - Bugs acontecem, RLS protege.
2. **JWT do usuário > service_role** - Para operações de usuário comum.
3. **RLS é a última linha de defesa** - Mesmo com falha total do backend.
4. **Functions SECURITY DEFINER** - Permitem operações controladas.
5. **Policies de bloqueio** - UPDATE/DELETE direto = ❌ PROIBIDO.

---

## 🚀 Próximos Passos

- [ ] Monitorar logs do Postgres para tentativas de acesso bloqueadas
- [ ] Implementar alertas de segurança (ex: múltiplas tentativas de hack)
- [ ] Auditoria periódica de policies RLS
- [ ] Testes de penetração automáticos

---

**LEMBRE-SE**: Sistema de créditos = dinheiro. **ZERO tolerância para vulnerabilidades.**
