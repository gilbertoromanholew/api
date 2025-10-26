# 🔒 Migração Backend para RLS (Row Level Security)

**Data**: 26/10/2025  
**Status**: 🟡 EM PROGRESSO  
**Prioridade**: 🔴 CRÍTICA (Segurança)

---

## 📋 Resumo da Mudança

### ❌ ANTES (Vulnerável)
```javascript
// pointsService.js
const { data } = await supabaseAdmin
  .from('economy_user_wallets')
  .select('*')
  .eq('user_id', userId);

// ⚠️ PROBLEMA: supabaseAdmin bypassa RLS
// Se houver bug no backend (ex: userId vindo de query param não validado),
// atacante pode ver/modificar dados de QUALQUER usuário
```

### ✅ DEPOIS (Protegido)
```javascript
// 1. SELECT: Usar supabase (anon key) com RLS
const { data } = await supabase
  .from('economy_user_wallets')
  .select('*')
  .eq('user_id', userId);
// RLS valida automaticamente: auth.uid() = user_id

// 2. UPDATE: Usar functions do Postgres
const { data } = await supabase
  .rpc('debit_credits', {
    p_user_id: userId,
    p_amount: 10,
    p_reason: 'Uso de ferramenta'
  });
// Function valida: auth.uid() = p_user_id internamente
```

---

## 🛡️ Functions Criadas no Postgres

### 1. `admin_add_credits(user_id, amount, type, reason)`
**Uso**: Backend adiciona créditos (bônus de boas-vindas, recompensas, etc)

```javascript
// Backend (autenticado com service_role ou validação admin)
const { data, error } = await supabaseAdmin // OK usar Admin aqui
  .rpc('admin_add_credits', {
    p_user_id: userId,
    p_amount: 100,
    p_type: 'bonus', // ou 'purchase'
    p_reason: 'Bônus de boas-vindas'
  });

if (error) throw new Error(error.message);
console.log('Créditos adicionados:', data);
// Retorna: { success: true, transaction_id: '...', new_balance: 150 }
```

**Segurança**:
- ✅ SECURITY DEFINER (bypassa RLS com segurança)
- ⚠️ Backend DEVE validar que req.user é admin antes de chamar
- ✅ Valida amount > 0
- ✅ Cria transação automática

---

### 2. `debit_credits(user_id, amount, reason)`
**Uso**: Usuário usa ferramenta e gasta créditos

```javascript
// Backend (usuário autenticado)
const { data, error } = await supabase // Usar anon key
  .rpc('debit_credits', {
    p_user_id: req.user.id, // DEVE ser auth.uid()
    p_amount: 10,
    p_reason: 'Uso de ferramenta: Consulta CPF'
  });

if (error) {
  if (error.message.includes('Saldo insuficiente')) {
    return res.status(400).json({ error: 'Créditos insuficientes' });
  }
  throw error;
}

console.log('Créditos debitados:', data);
// Retorna: {
//   success: true,
//   transaction_id: '...',
//   debit_amount: 10,
//   bonus_used: 5,
//   purchased_used: 5,
//   new_balance: 40
// }
```

**Segurança**:
- ✅ SECURITY DEFINER com validação `auth.uid() = p_user_id`
- ❌ Se usuário A tentar debitar de B, retorna: `Acesso negado`
- ✅ Valida saldo suficiente
- ✅ Prioriza uso de créditos bônus antes dos comprados
- ✅ Cria transação automática (negativa)

---

## 📝 Checklist de Migração

### ✅ **Parte 1: SQL Executado**
- [x] Criar 6 policies de bloqueio (INSERT/UPDATE/DELETE)
- [x] Criar function `admin_add_credits()`
- [x] Criar function `debit_credits()`
- [x] Verificar RLS habilitado em 2 tabelas

---

### 🔄 **Parte 2: Atualizar Backend** (PENDENTE)

#### **Arquivo 1: `src/services/pointsService.js`**

| Função | Status | Mudança |
|--------|--------|---------|
| `getBalance(userId)` | 🟡 TODO | `supabaseAdmin` → `supabase` |
| `getHistory(userId)` | 🟡 TODO | `supabaseAdmin` → `supabase` |
| `addBonus(userId, amount, reason)` | 🟡 TODO | `.update()` → `.rpc('admin_add_credits')` |
| `addPurchasedPoints(userId, amount)` | 🟡 TODO | `.update()` → `.rpc('admin_add_credits')` |
| `deductCredits(userId, amount, reason)` | 🟡 TODO | `.update()` → `.rpc('debit_credits')` |
| `weeklyAllowanceCheck(userId)` | 🟡 TODO | Manter `supabaseAdmin` (admin operation) |

**Código ANTES**:
```javascript
// Linha ~23
export async function getBalance(userId) {
    const { data, error } = await supabaseAdmin  // ❌
        .from('economy_user_wallets')
        .select('*')
        .eq('user_id', userId)
        .single();
    // ...
}
```

**Código DEPOIS**:
```javascript
// Linha ~23
export async function getBalance(userId) {
    const { data, error } = await supabase  // ✅ RLS ativo
        .from('economy_user_wallets')
        .select('*')
        .eq('user_id', userId)  // RLS valida auth.uid() = userId
        .single();
    // ...
}
```

---

#### **Arquivo 2: `src/routes/authRoutes.js`**

| Operação | Status | Mudança |
|----------|--------|---------|
| Criar carteira inicial (linha ~386) | 🟡 TODO | Manter `supabaseAdmin` OU criar function |

**Opção 1: Manter supabaseAdmin** (OK para criação inicial)
```javascript
// authRoutes.js linha ~386 (registro de usuário)
const { error: walletError } = await supabaseAdmin
    .from('economy_user_wallets')
    .insert({
        user_id: newUser.id,
        bonus_credits: 100, // Bônus inicial
        purchased_points: 0
    });
```

**Opção 2: Criar function** (mais seguro)
```sql
-- SQL (adicionar ao ENABLE_RLS_CREDITS.sql)
CREATE OR REPLACE FUNCTION create_wallet_for_new_user(
  p_user_id UUID,
  p_initial_bonus INTEGER DEFAULT 100
)
RETURNS JSON AS $$
BEGIN
  INSERT INTO economy_user_wallets (user_id, bonus_credits)
  VALUES (p_user_id, p_initial_bonus);
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

```javascript
// Backend
const { error } = await supabaseAdmin
  .rpc('create_wallet_for_new_user', {
    p_user_id: newUser.id,
    p_initial_bonus: 100
  });
```

---

#### **Arquivo 3: `src/functions/user/userController.js`**

| Operação | Status | Mudança |
|----------|--------|---------|
| GET /user/data (linha ~24, ~156) | 🟡 TODO | `supabaseAdmin` → `supabase` |

**Código ANTES**:
```javascript
// userController.js linha ~24
const { data: wallet } = await supabaseAdmin
    .from('economy_user_wallets')
    .select('*')
    .eq('user_id', req.user.id)
    .single();
```

**Código DEPOIS**:
```javascript
// userController.js linha ~24
const { data: wallet } = await supabase  // ✅ RLS ativo
    .from('economy_user_wallets')
    .select('*')
    .eq('user_id', req.user.id)  // RLS valida automaticamente
    .single();
```

---

## 🧪 Testes de Segurança

### Teste 1: Isolamento de Dados
```javascript
// Login como Usuário A (id: aaaa-aaaa)
const responseA = await fetch('/api/credits/balance', {
  headers: { 'Authorization': 'Bearer token_usuario_A' }
});
const dataA = await responseA.json();
console.log(dataA); // { balance: 50, user_id: 'aaaa-aaaa' }

// Login como Usuário B (id: bbbb-bbbb)
const responseB = await fetch('/api/credits/balance', {
  headers: { 'Authorization': 'Bearer token_usuario_B' }
});
const dataB = await responseB.json();
console.log(dataB); // { balance: 100, user_id: 'bbbb-bbbb' }

// ✅ Cada usuário vê APENAS seus próprios dados
```

### Teste 2: Bloqueio de UPDATE Direto
```javascript
// Usuário tenta hackear via console do navegador
const { data, error } = await supabase
  .from('economy_user_wallets')
  .update({ bonus_credits: 1000000 })
  .eq('user_id', 'meu-user-id');

console.log(error);
// ❌ ERROR: new row violates row-level security policy "users_block_wallet_updates"
```

### Teste 3: Débito Apenas de Próprios Créditos
```javascript
// Usuário A (aaaa-aaaa) tenta debitar de B (bbbb-bbbb)
const { data, error } = await supabase
  .rpc('debit_credits', {
    p_user_id: 'bbbb-bbbb',  // ❌ Outro usuário
    p_amount: 10,
    p_reason: 'Hack attempt'
  });

console.log(error.message);
// ❌ "Acesso negado: usuário não pode debitar créditos de outros"
```

---

## 📊 Impacto da Mudança

### Performance
- ✅ **Neutro**: RLS é extremamente otimizado no Postgres
- ✅ **Menos queries**: Functions fazem UPDATE + INSERT em uma transação
- ✅ **Lock automático**: `FOR UPDATE` evita race conditions

### Segurança
- ✅ **ALTA**: Defesa em profundidade (Backend + Postgres)
- ✅ **Auditável**: Postgres logs mostram tentativas de acesso bloqueadas
- ✅ **Zero Trust**: Mesmo com bug no backend, Postgres bloqueia

### Manutenção
- ✅ **Melhor**: Lógica de segurança centralizada no Postgres
- ✅ **Testável**: Functions podem ser testadas isoladamente
- ⚠️ **Atenção**: Migração requer update em 3 arquivos

---

## 🚀 Ordem de Execução

1. ✅ **SQL executado**: `ENABLE_RLS_CREDITS.sql` (FEITO)
2. 🔄 **Atualizar `pointsService.js`**: Migrar para functions (TODO)
3. 🔄 **Atualizar `userController.js`**: Usar supabase (anon) (TODO)
4. 🔄 **Reiniciar backend**: `node server.js` (TODO)
5. 🔄 **Testar isolamento**: Login A/B, verificar dados (TODO)
6. 🔄 **Testar débito**: Usar ferramenta, verificar transação (TODO)

---

## 📞 Suporte

Se encontrar erro tipo:
- `function debit_credits does not exist` → Executar ENABLE_RLS_CREDITS.sql
- `Acesso negado` → Verificar que req.user.id = p_user_id
- `Saldo insuficiente` → Usuário realmente não tem créditos

**Logs úteis**:
```javascript
console.log('Debitando créditos:', { userId: req.user.id, amount });
const { data, error } = await supabase.rpc('debit_credits', ...);
console.log('Resultado:', { data, error });
```
