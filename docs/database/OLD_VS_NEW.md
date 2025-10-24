# 🔄 Mapeamento: Tabelas Antigas → Novas

> **Migração V7:** Reorganização completa de 6 tabelas → 23 tabelas  
> **Data:** 23 de outubro de 2025

## 📊 Visão Geral da Migração

### Antes (V6)
```
public schema (1 schema)
├── profiles (1)
├── user_points (1)
├── point_transactions (1)
├── point_packages (4)
├── tool_costs (15)
└── purchases (0)

Total: 6 tabelas | 22 registros
```

### Depois (V7)
```
5 schemas organizados
├── economy (7 tabelas | 8 registros)
├── gamification (6 tabelas | 1 registro)
├── tools (3 tabelas | 15 registros)
├── social (4 tabelas | 2 registros)
└── audit (3 tabelas | 0 registros)

Total: 23 tabelas | 26 registros
```

## 🗺️ Mapeamento Completo

### 1️⃣ `public.user_points` → `economy.user_wallets`

**Status:** ✅ Migrado (1 registro)

| Coluna Antiga | Coluna Nova | Transformação |
|---------------|-------------|---------------|
| `user_id` | `user_id` | Sem alteração |
| `free_points` | `bonus_credits` | Renomeado |
| `paid_points` | `purchased_points` | Renomeado |
| `total_points` | *removido* | Calculado: `bonus_credits + purchased_points` |
| `updated_at` | `created_at` | Reaproveitado |
| *não existia* | `id` | UUID gerado automaticamente |
| *não existia* | `updated_at` | `NOW()` |

**Query de Migração:**
```sql
INSERT INTO economy.user_wallets (user_id, bonus_credits, purchased_points, created_at)
SELECT 
  user_id,
  free_points as bonus_credits,
  paid_points as purchased_points,
  COALESCE(updated_at, NOW()) as created_at
FROM public.user_points;
```

---

### 2️⃣ `public.point_transactions` → `economy.transactions`

**Status:** ✅ Migrado (1 registro)

| Coluna Antiga | Coluna Nova | Transformação |
|---------------|-------------|---------------|
| `user_id` | `user_id` | Sem alteração |
| `type` (ENUM antigo) | `type` (ENUM novo) | Convertido (veja tabela abaixo) |
| `amount` | `amount` | Sem alteração |
| `description` | `description` | Sem alteração |
| `created_at` | `created_at` | Sem alteração |
| *não existia* | `id` | UUID gerado |
| *não existia* | `wallet_id` | Lookup via `user_id` |
| *não existia* | `metadata` | `'{}'::jsonb` |
| *não existia* | `updated_at` | Removido da migração |

**Conversão de ENUMs:**
| ENUM Antigo (`public.point_transaction_type`) | ENUM Novo (`economy.transaction_type`) |
|-----------------------------------------------|----------------------------------------|
| `signup_bonus` | `credit` |
| `referral_bonus` | `credit` |
| `purchase` | `purchase` |
| `tool_usage` | `debit` |
| `admin_adjustment` | `adjustment` |
| `refund` | `refund` |

**Query de Migração:**
```sql
INSERT INTO economy.transactions (wallet_id, user_id, type, amount, description, created_at, metadata)
SELECT 
  w.id as wallet_id,
  pt.user_id,
  CASE pt.type::text
    WHEN 'signup_bonus' THEN 'credit'::economy.transaction_type
    WHEN 'referral_bonus' THEN 'credit'::economy.transaction_type
    WHEN 'purchase' THEN 'purchase'::economy.transaction_type
    WHEN 'tool_usage' THEN 'debit'::economy.transaction_type
    WHEN 'admin_adjustment' THEN 'adjustment'::economy.transaction_type
    WHEN 'refund' THEN 'refund'::economy.transaction_type
  END as type,
  pt.amount,
  pt.description,
  pt.created_at,
  '{}'::jsonb as metadata
FROM public.point_transactions pt
JOIN economy.user_wallets w ON w.user_id = pt.user_id;
```

---

### 3️⃣ `public.point_packages` → `economy.point_packages`

**Status:** ✅ Migrado (4 registros)

| Coluna Antiga | Coluna Nova | Transformação |
|---------------|-------------|---------------|
| `name` | `name` | Sem alteração |
| `points_amount` | `points_amount` | Sem alteração |
| `price_cents` | `price_brl` | `price_cents / 100.0` (centavos → reais) |
| `is_active` | `is_active` | Sem alteração |
| `display_order` | `display_order` | Sem alteração |
| *não existia* | `id` | UUID gerado |
| *não existia* | `description` | `NULL` |
| *não existia* | `bonus_percentage` | `0` |
| *não existia* | `created_at` | `NOW()` |
| *não existia* | `updated_at` | Removido da migração |

**Query de Migração:**
```sql
INSERT INTO economy.point_packages (name, description, points_amount, price_brl, bonus_percentage, is_active, display_order, created_at)
SELECT 
  name,
  NULL as description,
  points_amount,
  (price_cents / 100.0) as price_brl,
  0 as bonus_percentage,
  is_active,
  display_order,
  NOW() as created_at
FROM public.point_packages;
```

---

### 4️⃣ `public.tool_costs` → `tools.catalog`

**Status:** ✅ Migrado (15 registros)

| Coluna Antiga | Coluna Nova | Transformação |
|---------------|-------------|---------------|
| `tool_name` | `name` | Renomeado |
| `points_cost` | `base_cost` | Renomeado |
| `is_active` | `is_active` | Sem alteração |
| *não existia* | `id` | UUID gerado |
| *não existia* | `slug` | Gerado: `LOWER(REPLACE(tool_name, ' ', '-'))` |
| *não existia* | `description` | `NULL` |
| *não existia* | `icon_url` | `NULL` |
| *não existia* | `category` | `NULL` |
| *não existia* | `pro_multiplier` | `1.0` (sem desconto) |
| *não existia* | `max_executions_free` | `NULL` (ilimitado) |
| *não existia* | `max_executions_pro` | `NULL` (ilimitado) |
| *não existia* | `created_at` | `NOW()` |
| *não existia* | `updated_at` | Removido da migração |

**Exemplos de Slugs Gerados:**
| `tool_name` (antigo) | `slug` (novo) |
|---------------------|---------------|
| Calculadora de Férias | calculadora-de-ferias |
| Gerador de CPF | gerador-de-cpf |
| Validador de CNPJ | validador-de-cnpj |

**Query de Migração:**
```sql
INSERT INTO tools.catalog (name, slug, description, base_cost, category, icon_url, is_active, pro_multiplier, max_executions_free, max_executions_pro, created_at)
SELECT 
  tool_name as name,
  LOWER(REPLACE(tool_name, ' ', '-')) as slug,
  NULL as description,
  points_cost as base_cost,
  NULL as category,
  NULL as icon_url,
  is_active,
  1.0 as pro_multiplier,
  NULL as max_executions_free,
  NULL as max_executions_pro,
  NOW() as created_at
FROM public.tool_costs;
```

---

### 5️⃣ `public.purchases` → `economy.purchases`

**Status:** ✅ Migrado (0 registros - tabela vazia)

| Coluna Antiga | Coluna Nova | Transformação |
|---------------|-------------|---------------|
| `user_id` | `user_id` | Sem alteração |
| `package_id` | `package_id` | Lookup UUID via nome do pacote |
| `points_amount` | `points_amount` | Sem alteração |
| `price_paid_cents` | `price_brl` | `price_paid_cents / 100.0` |
| `payment_method` | `payment_method` | Sem alteração |
| `payment_id` | `payment_id` | Sem alteração |
| `status` | `status` | Convertido (veja abaixo) |
| `created_at` | `created_at` | Sem alteração |
| *não existia* | `id` | UUID gerado |
| *não existia* | `payment_confirmed_at` | `NULL` |
| *não existia* | `updated_at` | Removido da migração |

**Conversão de Status:**
| Status Antigo | Status Novo (`economy.purchase_status`) |
|---------------|------------------------------------------|
| `pending` | `pending` |
| `completed` | `completed` |
| `failed` | `failed` |
| `refunded` | `refunded` |

**Query de Migração:**
```sql
INSERT INTO economy.purchases (user_id, package_id, points_amount, price_brl, payment_method, payment_id, status, payment_confirmed_at, created_at)
SELECT 
  p.user_id,
  pkg.id as package_id,
  p.points_amount,
  (p.price_paid_cents / 100.0) as price_brl,
  p.payment_method,
  p.payment_id,
  p.status::text::economy.purchase_status as status,
  NULL as payment_confirmed_at,
  p.created_at
FROM public.purchases p
LEFT JOIN economy.point_packages pkg ON pkg.points_amount = p.points_amount;
```

---

### 6️⃣ `public.profiles` → Tabelas Novas (Criadas Vazias)

**Status:** ✅ Estrutura criada, populada com defaults

#### → `social.user_privacy_settings`
```sql
-- Criado 1 registro com configurações padrão
INSERT INTO social.user_privacy_settings (user_id, profile_visibility, achievements_visibility, leaderboard_visibility, tools_history_visibility)
SELECT 
  id as user_id,
  'public'::social.visibility_level,
  'public'::social.visibility_level,
  'public'::social.visibility_level,
  'friends'::social.visibility_level
FROM auth.users;
```

#### → `gamification.daily_streaks`
```sql
-- Criado 1 registro com streak inicial
INSERT INTO gamification.daily_streaks (user_id, current_streak, longest_streak, last_activity_date)
SELECT 
  id as user_id,
  0,
  0,
  CURRENT_DATE
FROM auth.users;
```

#### → `social.referrals`
```sql
-- Criado 1 registro (usuário sem referenciador = NULL)
INSERT INTO social.referrals (referrer_id, referred_id)
SELECT 
  NULL as referrer_id,
  id as referred_id
FROM auth.users;
```

---

## 📈 Estatísticas da Migração

### Registros por Tabela

| Tabela Nova | Registros | Origem |
|-------------|-----------|--------|
| `economy.user_wallets` | 1 | `user_points` |
| `economy.transactions` | 1 | `point_transactions` |
| `economy.point_packages` | 4 | `point_packages` |
| `economy.purchases` | 0 | `purchases` (vazia) |
| `economy.subscriptions` | 0 | Nova (vazia) |
| `economy.subscription_plans` | 0 | Nova (vazia) |
| `economy.referral_rewards` | 0 | Nova (vazia) |
| `tools.catalog` | 15 | `tool_costs` |
| `tools.executions` | 0 | Nova (vazia) |
| `tools.user_favorites` | 0 | Nova (vazia) |
| `gamification.achievements` | 0 | Nova (vazia) |
| `gamification.user_achievements` | 0 | Nova (vazia) |
| `gamification.achievement_unlocks` | 0 | Nova (vazia) |
| `gamification.achievement_showcase` | 0 | Nova (vazia) |
| `gamification.leaderboards` | 0 | Nova (vazia) |
| `gamification.daily_streaks` | 1 | Criado (defaults) |
| `social.user_privacy_settings` | 1 | Criado (defaults) |
| `social.friendships` | 0 | Nova (vazia) |
| `social.friend_requests` | 0 | Nova (vazia) |
| `social.referrals` | 1 | Criado (defaults) |
| `audit.access_logs` | 0 | Nova (vazia) |
| `audit.security_events` | 0 | Nova (vazia) |
| `audit.admin_actions` | 0 | Nova (vazia) |

**Total:** 24 registros migrados/criados

### Conversões Aplicadas

| Tipo | Quantidade | Exemplos |
|------|------------|----------|
| Renomeação de colunas | 8 | `free_points`→`bonus_credits`, `tool_name`→`name` |
| Conversão de valores | 5 | `price_cents/100`→`price_brl` |
| Conversão de ENUMs | 6 | `signup_bonus`→`credit` |
| Geração automática | 3 | `slug`, `id`, `created_at` |
| Colunas removidas | 3 | `total_points`, `updated_at` (em alguns) |
| Colunas adicionadas | 15+ | `metadata`, `pro_multiplier`, `visibility_level` |

---

## 🔄 Rollback (Se Necessário)

### ⚠️ Reverter Migração

```sql
-- ATENÇÃO: Isso apagará TODOS os dados novos!
-- Use apenas se precisar voltar para V6

-- 1. Desabilitar RLS
ALTER TABLE economy.user_wallets DISABLE ROW LEVEL SECURITY;
-- (repetir para todas as 23 tabelas)

-- 2. Dropar schemas
DROP SCHEMA economy CASCADE;
DROP SCHEMA gamification CASCADE;
DROP SCHEMA tools CASCADE;
DROP SCHEMA social CASCADE;
DROP SCHEMA audit CASCADE;

-- 3. Tabelas antigas ainda existem em 'public'
-- Dados originais preservados se não dropou 'public'
```

### ✅ Verificação Pós-Rollback
```sql
SELECT COUNT(*) FROM public.user_points; -- Deve retornar 1
SELECT COUNT(*) FROM public.point_transactions; -- Deve retornar 1
SELECT COUNT(*) FROM public.point_packages; -- Deve retornar 4
```

---

## 📝 Lições Aprendidas

### Problemas Encontrados Durante Migração

1. **ENUMs Incompatíveis**
   - Problema: `public.point_transaction_type` ≠ `economy.transaction_type`
   - Solução: CASE statement convertendo valores

2. **Colunas Inexistentes**
   - Problema: Scripts assumiam `metadata`, `updated_at` existiam
   - Solução: Usar valores padrão (`'{}'::jsonb`, `NOW()`)

3. **Nomes de Colunas Diferentes**
   - Problema: `cost` vs `points_cost`
   - Solução: Consultar `information_schema.columns`

4. **UUIDs vs IDs Sequenciais**
   - Problema: Lookup de FKs precisava de JOINs
   - Solução: JOINs por campos únicos (user_id, points_amount)

5. **Slugs Ausentes**
   - Problema: Ferramentas não tinham slugs
   - Solução: Geração automática via `LOWER(REPLACE(...))`

6. **Valores Monetários**
   - Problema: Centavos vs Reais
   - Solução: Divisão por 100: `price_cents / 100.0`

---

**📖 Documentos Relacionados:**
- [MIGRATION_HISTORY.md](./MIGRATION_HISTORY.md) - Histórico completo da migração
- [STRUCTURE.md](./STRUCTURE.md) - Estrutura completa do banco V7
- [Scripts de Migração](../../sql-config/migrations/) - STEP_1 a STEP_6
