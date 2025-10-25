# 🔍 Análise Backend vs Database - V7

**Data:** 25/10/2025  
**Objetivo:** Validar consistência entre estrutura do banco e uso no backend

---

## ✅ 1. TABELAS DE ASSINATURAS - MIGRAÇÃO CONCLUÍDA ✅

### 🎯 Decisão Final: Seguir padrão economy_*

**Tabelas Atuais (após migração em 25/10/2025):**
- ✅ `economy_subscriptions` - **TABELA ATIVA** (renomeada de `subscriptions`)
- ✅ `economy_subscription_plans` - **TABELA ATIVA** (renomeada de `subscription_plans`)

**Antes da migração:**
- ~~`subscriptions`~~ → Renomeada para `economy_subscriptions`
- ~~`subscription_plans`~~ → Renomeada para `economy_subscription_plans`

**Evidências:**
- Backend atualizado: 12 alterações em 2 arquivos
- Todas as queries agora usam `economy_subscriptions` e `economy_subscription_plans`
- Consistência com padrão: `economy_user_wallets`, `economy_transactions`, `economy_purchases`

**Campos da tabela `subscriptions` (em uso):**
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users)
- `plan_id` (uuid, FK → subscription_plans)
- `status` (varchar: 'active', 'canceled', 'expired')
- `start_date` (timestamp)
- `end_date` (timestamp)
- `is_trial` (boolean)
- `stripe_subscription_id` (varchar)
- `stripe_customer_id` (varchar)
- `canceled_at` (timestamp)
- `created_at`, `updated_at`

**Campos da tabela `economy_subscriptions` (NÃO usada):**
- Similar à `subscriptions`, mas sem `plan_id`
- Tem `plan_id` como UUID
- Estrutura antiga da V6

### 📋 Recomendação:
```sql
-- PODE DELETAR COM SEGURANÇA
DROP TABLE IF EXISTS economy_subscriptions CASCADE;
```

---

## ✅ 2. ENUMS - TIPOS PERSONALIZADOS

### 🎯 Promo Codes - 2 ENUMs Ativos

**ENUM 1: `promo_code_type`**
```sql
-- Valores usados no backend (promoCodesService.js):
'BONUS_CREDITS'  -- Linha 80: case 'BONUS_CREDITS'
'PRO_TRIAL'      -- Linha 126: case 'PRO_TRIAL'
'DISCOUNT'       -- Linha 167: case 'DISCOUNT' (não implementado)
'REFERRAL'       -- Linha 171: case 'REFERRAL' (usa outro sistema)
```

**ENUM 2: `promo_code_status`**
```sql
-- Valores usados no backend:
'active'   -- Linha 18: .eq('status', 'active')
'expired'  -- Linha 31: .update({ status: 'expired' })
'inactive' -- (não encontrado no código, mas previsto)
```

**Estrutura da tabela `promo_codes`:**
```json
{
  "id": "uuid",
  "code": "varchar(50) UNIQUE",
  "type": "promo_code_type ENUM",  // ← ENUM 1
  "value": "integer",
  "description": "text",
  "expires_at": "timestamp",
  "max_uses": "integer",
  "used_count": "integer DEFAULT 0",
  "status": "promo_code_status ENUM DEFAULT 'active'",  // ← ENUM 2
  "metadata": "jsonb",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### 📋 Validação dos ENUMs:
```sql
-- Verificar ENUMs existentes
SELECT 
    t.typname as enum_name,
    e.enumlabel as valor,
    e.enumsortorder as ordem
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
  AND t.typname IN ('promo_code_type', 'promo_code_status')
ORDER BY t.typname, e.enumsortorder;
```

**Resultado Esperado:**
```
enum_name          | valor         | ordem
-------------------+---------------+------
promo_code_status  | active        | 1
promo_code_status  | expired       | 2
promo_code_status  | inactive      | 3
promo_code_type    | BONUS_CREDITS | 1
promo_code_type    | PRO_TRIAL     | 2
promo_code_type    | DISCOUNT      | 3
promo_code_type    | REFERRAL      | 4
```

---

## ✅ 3. TABELAS DE PLANOS DE ASSINATURA

### 🎯 Conclusão: `subscription_plans` está ativa

**Evidências do Backend:**
```javascript
// subscriptionService.js
.from('subscription_plans')  // Linha 17, 60, 95, 240
```

**Estrutura:**
```json
{
  "id": "uuid",
  "name": "varchar(100)",
  "slug": "varchar(50) UNIQUE",
  "description": "text",
  "price_brl": "numeric",
  "billing_period": "varchar(20)",  // 'monthly', 'quarterly', 'yearly'
  "features": "jsonb",
  "is_active": "boolean DEFAULT true",
  "stripe_price_id": "varchar(255)",
  "display_order": "integer DEFAULT 0",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

---

## ✅ 4. RESUMO - ESTRUTURA DO DB V7

### 📊 **22 Tabelas Ativas + 3 Views**

#### 🔐 **Autenticação (7):**
1. `profiles` - Perfis de usuários
2. `auth_audit_log` - Logs de autenticação
3. `otp_codes` - Códigos OTP
4. `operations_audit_log` - Auditoria de operações
5. `rate_limit_violations` - Violações de rate limit
6. 📊 `failed_login_attempts_24h` (VIEW)
7. 📊 `suspicious_activities` (VIEW)
8. 📊 `top_rate_limit_violators` (VIEW)

#### 💰 **Economia (5):**
1. `economy_user_wallets` - Carteiras
2. `economy_transactions` - Transações
3. `economy_purchases` - Compras de pontos
4. `subscription_plans` - Planos disponíveis
5. `subscriptions` - Assinaturas ativas
6. ❌ ~~`economy_subscriptions`~~ (DELETAR - não usada)

#### 🎮 **Gamificação (6):**
1. `gamification_achievements` - Conquistas
2. `gamification_user_achievements` - Progresso
3. `gamification_achievement_unlocks` - Desbloqueios
4. `gamification_achievement_showcase` - Vitrine
5. `gamification_daily_streaks` - Sequências
6. `gamification_leaderboards` - Rankings

#### 🛠️ **Ferramentas (2):**
1. `tools_catalog` - Catálogo
2. `tools_executions` - Histórico de execuções

#### 🎁 **Promoções & Social (3):**
1. `promo_codes` - Códigos promocionais
2. `promo_code_redemptions` - Resgates
3. `social_referrals` - Sistema de indicações

---

## ✅ 5. TIPOS PERSONALIZADOS (ENUMs)

### 📋 ENUMs Confirmados:
1. `promo_code_type` - Tipos de código promocional
2. `promo_code_status` - Status de código promocional

### 🔍 Verificar se há outros ENUMs:
```sql
-- Listar TODOS os ENUMs no banco
SELECT 
    n.nspname as schema,
    t.typname as enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) as valores
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
GROUP BY n.nspname, t.typname
ORDER BY t.typname;
```

---

## ✅ 6. FOREIGN KEYS - RELACIONAMENTOS

### 🔗 Relacionamentos Principais:

**Economy (Economia):**
- `economy_user_wallets.user_id` → `auth.users.id`
- `economy_transactions.user_id` → `auth.users.id`
- `economy_purchases.user_id` → `auth.users.id`
- `subscriptions.user_id` → `auth.users.id`
- `subscriptions.plan_id` → `subscription_plans.id`

**Gamification:**
- `gamification_user_achievements.user_id` → `auth.users.id`
- `gamification_user_achievements.achievement_id` → `gamification_achievements.id`
- `gamification_achievement_unlocks.user_id` → `auth.users.id`
- `gamification_achievement_unlocks.achievement_id` → `gamification_achievements.id`
- `gamification_achievement_showcase.user_id` → `auth.users.id`
- `gamification_achievement_showcase.achievement_id` → `gamification_achievements.id`
- `gamification_daily_streaks.user_id` → `auth.users.id`
- `gamification_leaderboards.user_id` → `auth.users.id`

**Tools:**
- `tools_executions.user_id` → `auth.users.id`
- `tools_executions.tool_id` → `tools_catalog.id`

**Promo & Social:**
- `promo_code_redemptions.user_id` → `auth.users.id`
- `promo_code_redemptions.promo_code_id` → `promo_codes.id`
- `social_referrals.referrer_id` → `profiles.id`
- `social_referrals.referred_id` → `profiles.id`

---

## 🎯 AÇÕES RECOMENDADAS

### 1️⃣ Deletar Tabela Obsoleta:
```sql
-- Backup antes de deletar (caso necessário)
CREATE TABLE _backup_economy_subscriptions AS 
SELECT * FROM economy_subscriptions;

-- Deletar tabela não usada
DROP TABLE IF EXISTS economy_subscriptions CASCADE;
```

### 2️⃣ Documentar ENUMs no README:
Adicionar seção explicando os ENUMs personalizados e seus usos.

### 3️⃣ Validar Integridade Referencial:
Executar queries de verificação do script `DIAGNOSTICO_COMPLETO_DB.sql` seção 12.

---

## 📝 OBSERVAÇÕES FINAIS

✅ **Backend consistente** - Usa apenas `subscriptions` e `subscription_plans`  
✅ **ENUMs bem definidos** - `promo_code_type` e `promo_code_status` em uso  
✅ **Sem conflitos** - Estrutura V7 consolidada no schema `public`  
⚠️ **Ação pendente** - Deletar `economy_subscriptions` (não usada)

---

**Última atualização:** 25/10/2025  
**Próxima revisão:** Após V8 (se houver migração)
