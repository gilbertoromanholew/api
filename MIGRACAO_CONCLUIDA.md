# ✅ MIGRAÇÃO COMPLETA: subscriptions → economy_subscriptions

**Data:** 25/10/2025  
**Status:** ✅ CONCLUÍDA

---

## 🎯 O QUE FOI FEITO

### ✅ 1. BANCO DE DADOS (Supabase)
- ✅ Deletada tabela fantasma `economy_subscriptions` (se existia)
- ✅ Renomeada `subscriptions` → `economy_subscriptions`
- ✅ Renomeada `subscription_plans` → `economy_subscription_plans`
- ✅ Foreign keys atualizadas automaticamente
- ✅ Índices preservados
- ✅ RLS Policies preservadas

### ✅ 2. BACKEND (Node.js API)
- ✅ `src/services/subscriptionService.js` - 9 alterações
- ✅ `src/services/promoCodesService.js` - 3 alterações
- ✅ Total: 12 alterações em 2 arquivos

---

## 📊 ESTRUTURA FINAL

### Tabelas Economy:
```
✅ economy_purchases
✅ economy_subscription_plans      ← RENOMEADA
✅ economy_subscriptions            ← RENOMEADA
✅ economy_transactions
✅ economy_user_wallets
```

### Código Backend:
```javascript
// Todas as referências atualizadas para:
.from('economy_subscriptions')
.from('economy_subscription_plans')

// Joins também atualizados:
economy_subscription_plans (name, slug, price_brl, ...)
```

---

## 🧪 PRÓXIMO PASSO: TESTAR

### ✅ Checklist de Testes:

#### 1. **Testar API de Planos:**
```bash
GET http://localhost:3001/subscriptions/plans
```
**Esperado:** Retorna lista de planos de assinatura

#### 2. **Testar Status de Assinatura:**
```bash
GET http://localhost:3001/subscriptions/status
Headers: Authorization: Bearer {token}
```
**Esperado:** Retorna status da assinatura do usuário

#### 3. **Testar Código Promocional PRO:**
```bash
POST http://localhost:3001/promo-codes/redeem
Headers: Authorization: Bearer {token}
Body: { "code": "WELCOME30" }
```
**Esperado:** Adiciona dias PRO ao usuário

#### 4. **Testar Cancelamento:**
```bash
POST http://localhost:3001/subscriptions/cancel
Headers: Authorization: Bearer {token}
```
**Esperado:** Cancela assinatura do usuário

---

## 🚀 COMO TESTAR

### Opção 1: Restart do Backend
```bash
cd dist-api
npm run dev
```

### Opção 2: Restart do Docker (se estiver usando)
```bash
docker-compose restart api
```

### Opção 3: Testar com Postman/Insomnia
Importar collection e testar cada endpoint acima

---

## 🔍 SE DER ERRO

### Erro comum: "relation subscriptions does not exist"
**Causa:** Código ainda procurando pela tabela antiga  
**Solução:** Verificar se todas as alterações foram feitas

### Erro comum: "foreign key violation"
**Causa:** Relacionamento não foi atualizado corretamente  
**Solução:** Rodar query de verificação de FKs no Supabase

### Erro comum: "column plan_slug does not exist"
**Causa:** promoCodesService.js tem campo errado  
**Solução:** Verificar se o INSERT está usando `plan_id` (não `plan_slug`)

---

## 📝 VALIDAÇÃO FINAL NO SUPABASE

Execute esta query para confirmar que está tudo OK:

```sql
-- Verificar que as tabelas foram renomeadas
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE '%subscription%'
ORDER BY tablename;

-- Deve retornar:
-- economy_subscription_plans
-- economy_subscriptions
-- (NÃO deve ter subscription_plans nem subscriptions)

-- Verificar foreign keys
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'economy_subscriptions';

-- Deve retornar:
-- plan_id → economy_subscription_plans
-- user_id → users
```

---

## 🎉 MIGRAÇÃO COMPLETA!

- ✅ Banco renomeado
- ✅ Backend atualizado
- ✅ Padrão economy_* aplicado
- ⏳ Aguardando testes

**Próxima ação:** Testar os 4 endpoints acima e me avisar se deu tudo certo! 🚀
