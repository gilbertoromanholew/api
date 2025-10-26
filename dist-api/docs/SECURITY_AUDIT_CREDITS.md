# 🚨 AUDITORIA DE SEGURANÇA: Sistema de Créditos

**Data:** 26/10/2025  
**Severidade:** 🔴 **CRÍTICA**

---

## ❌ VULNERABILIDADE ENCONTRADA

### **Problema:**
O sistema usa `supabaseAdmin` (service_role) para acessar `economy_user_wallets` e `economy_transactions`, **MAS**:

1. ❌ **Não há RLS (Row Level Security)** nessas tabelas
2. ❌ `supabaseAdmin` **bypassa** qualquer RLS que existir
3. ⚠️ Se houver **qualquer brecha no backend**, um atacante pode:
   - Aumentar seus créditos
   - Zerar créditos de outros usuários
   - Ver saldo de qualquer pessoa

---

## 🔍 ANÁLISE DO CÓDIGO ATUAL

### **pointsService.js** (usa supabaseAdmin):

```javascript
// ❌ VULNERÁVEL: Se alguém chamar essa função com userId de outra pessoa
export async function getBalance(userId) {
    const { data } = await supabaseAdmin  // ⚠️ Bypassa RLS!
        .from('economy_user_wallets')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    return data;  // Retorna dados de QUALQUER usuário
}
```

### **Rota que usa:**

```javascript
// routes/creditsRoutes.js
router.get('/balance', requireAuth, async (req, res) => {
    const userId = req.user.id;  // ✅ Pega do token JWT
    const balance = await getBalance(userId);  // ✅ Passa o userId correto
    return res.json(balance);
});
```

**Parece seguro, MAS:**
- ✅ Se você só chamar de rotas autenticadas: **OK**
- ❌ Se chamar de qualquer outro lugar: **VULNERÁVEL**
- ❌ Se um hacker modificar o request: **PODE** dar problema

---

## 🛡️ SOLUÇÃO RECOMENDADA

### **Opção 1: RLS + supabase (anon key)** ⭐ **RECOMENDADA**

**Vantagens:**
- ✅ **Máxima segurança**: Postgres garante isolamento
- ✅ **Impossível hackear**: Mesmo com bug no backend
- ✅ **Auditável**: RLS policies visíveis no banco

**Como implementar:**

```sql
-- 1. Habilitar RLS
ALTER TABLE economy_user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy_transactions ENABLE ROW LEVEL SECURITY;

-- 2. Policies de SELECT (ler)
CREATE POLICY "Usuários veem apenas própria carteira"
ON economy_user_wallets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários veem apenas próprias transações"
ON economy_transactions FOR SELECT
USING (auth.uid() = user_id);

-- 3. Policies de UPDATE (atualizar)
CREATE POLICY "Usuários NÃO podem atualizar carteira diretamente"
ON economy_user_wallets FOR UPDATE
USING (false);  -- ❌ Bloqueado! Só via functions

-- 4. Policies de INSERT
CREATE POLICY "Sistema pode criar carteiras"
ON economy_user_wallets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sistema pode criar transações"
ON economy_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**Código atualizado:**

```javascript
// pointsService.js
import { supabase } from '../config/supabase.js';  // ✅ Usar anon key

// ✅ SEGURO: RLS valida automaticamente
export async function getBalance(userId) {
    const { data } = await supabase  // ✅ RLS ativo!
        .from('economy_user_wallets')
        .select('*')
        .eq('user_id', userId)  // RLS valida que auth.uid() = userId
        .single();
    
    return data;  // Só retorna se userId = auth.uid()
}

// Para operações administrativas (adicionar créditos):
export async function addCreditsAdmin(userId, amount, reason) {
    // ✅ Usar function do Postgres (bypassa RLS com segurança)
    const { data } = await supabaseAdmin
        .rpc('admin_add_credits', {
            p_user_id: userId,
            p_amount: amount,
            p_reason: reason
        });
    
    return data;
}
```

---

### **Opção 2: Manter supabaseAdmin + Validação dupla** ⚠️ **Menos seguro**

Se **realmente** precisar usar `supabaseAdmin`:

```javascript
// ⚠️ VALIDAÇÃO DUPLA: Verificar no código E no banco
export async function getBalance(userId, requestingUserId) {
    // 1. Validar que está pedindo próprios dados
    if (userId !== requestingUserId) {
        throw new Error('Acesso negado');
    }
    
    // 2. Buscar com supabaseAdmin
    const { data } = await supabaseAdmin
        .from('economy_user_wallets')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    // 3. Validar novamente (paranoia!)
    if (data.user_id !== requestingUserId) {
        throw new Error('Dados inconsistentes');
    }
    
    return data;
}
```

**Problema:** Depende de **nunca esquecer** a validação!

---

## 🎯 RECOMENDAÇÃO FINAL

### **✅ USE RLS + supabase (anon key)**

**Por quê:**
1. **Segurança em camadas**: Backend E banco validam
2. **Impossível bypassar**: Postgres bloqueia no nível do banco
3. **Zero trust**: Mesmo bug no código não expõe dados
4. **Auditável**: Policies documentadas no schema

### **Quando usar supabaseAdmin:**
- ✅ **Operações agregadas** (sem expor user_id)
- ✅ **Functions do Postgres** (com validação interna)
- ✅ **Tarefas administrativas** (com autenticação admin)
- ❌ **NUNCA** para operações de usuário final

---

## 📋 CHECKLIST DE CORREÇÃO

- [ ] Criar policies RLS para `economy_user_wallets`
- [ ] Criar policies RLS para `economy_transactions`
- [ ] Substituir `supabaseAdmin` → `supabase` em `pointsService.js`
- [ ] Criar functions do Postgres para operações admin
- [ ] Testar que usuário A não vê dados do usuário B
- [ ] Auditar TODOS os lugares que usam `supabaseAdmin`
- [ ] Documentar quando é OK usar `supabaseAdmin`

---

## 🚨 RISCO ATUAL

**Severidade:** 🔴 **ALTA**

**Cenário de ataque:**
1. Hacker encontra bug no backend (ex: SQL injection, SSRF)
2. Consegue chamar `getBalance(qualquer_user_id)`
3. Vê saldo de qualquer pessoa
4. Ou pior: chama `addCredits(meu_id, 999999)`

**Mitigação imediata:**
- ✅ Backend já valida `req.user.id` nas rotas
- ⚠️ MAS depende de **nunca ter bug** no middleware de auth

**Solução definitiva:**
- ✅ **RLS no Postgres** = segurança mesmo com bugs no backend

---

**Quer que eu implemente as policies RLS agora?** 🔒
