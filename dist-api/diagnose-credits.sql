-- ============================================
-- DIAGNÓSTICO: POR QUE CRÉDITOS NÃO FUNCIONAM?
-- ============================================

-- 1. Verificar se você TEM wallet
SELECT 
  'VERIFICAÇÃO 1: Sua Wallet' as check_name,
  user_id,
  bonus_credits,
  purchased_points,
  (bonus_credits + purchased_points) as total_calculado,
  total_spent,
  created_at
FROM economy.user_wallets
WHERE user_id = (
  SELECT id FROM public.profiles WHERE email = 'gilbertoromanholew@gmail.com'
);

-- 2. Verificar se o frontend está pedindo os dados CERTOS
-- O frontend pede: bonus_credits, purchased_credits, total_credits
-- Mas o banco tem: bonus_credits, purchased_points (SEM total_credits)

-- 3. Verificar se a API retorna os campos que o FRONTEND espera
-- Frontend espera (user.js store):
-- response.data.bonus_credits
-- response.data.purchased_credits (❌ ERRADO - deveria ser purchased_points)
-- response.data.total_credits (❌ NÃO EXISTE - precisa calcular)

-- 4. Verificar suas transações
SELECT 
  'VERIFICAÇÃO 2: Transações' as check_name,
  id,
  type,
  point_type,
  amount,
  balance_before,
  balance_after,
  description,
  created_at
FROM economy.transactions
WHERE user_id = (
  SELECT id FROM public.profiles WHERE email = 'gilbertoromanholew@gmail.com'
)
ORDER BY created_at DESC
LIMIT 5;

-- 5. Verificar se há EXECUÇÕES de ferramentas
SELECT 
  'VERIFICAÇÃO 3: Execuções' as check_name,
  COUNT(*) as total_execucoes,
  SUM(points_used) as total_pontos_gastos
FROM tools.executions
WHERE user_id = (
  SELECT id FROM public.profiles WHERE email = 'gilbertoromanholew@gmail.com'
);

-- 6. Simular o que a API deveria retornar
WITH user_wallet AS (
  SELECT 
    bonus_credits,
    purchased_points,
    total_earned_bonus,
    total_purchased,
    total_spent
  FROM economy.user_wallets
  WHERE user_id = (
    SELECT id FROM public.profiles WHERE email = 'gilbertoromanholew@gmail.com'
  )
)
SELECT 
  'VERIFICAÇÃO 4: O que API deveria retornar' as check_name,
  bonus_credits as "✅ bonus_credits (CORRETO)",
  purchased_points as "✅ purchased_points (CORRETO - mas frontend espera purchased_credits)",
  (bonus_credits + purchased_points) as "✅ total_credits (CALCULADO - não existe no banco)",
  total_earned_bonus as "✅ total_earned_bonus",
  total_purchased as "✅ total_purchased",
  total_spent as "✅ total_spent"
FROM user_wallet;

-- 7. Verificar se há INCONSISTÊNCIA entre wallet e transações
WITH wallet_data AS (
  SELECT 
    user_id,
    bonus_credits,
    purchased_points,
    total_spent
  FROM economy.user_wallets
  WHERE user_id = (
    SELECT id FROM public.profiles WHERE email = 'gilbertoromanholew@gmail.com'
  )
),
transaction_totals AS (
  SELECT 
    user_id,
    SUM(CASE WHEN point_type = 'bonus' AND amount > 0 THEN amount ELSE 0 END) as bonus_recebido,
    SUM(CASE WHEN point_type = 'purchased' AND amount > 0 THEN amount ELSE 0 END) as purchased_recebido,
    SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_gasto_transactions
  FROM economy.transactions
  WHERE user_id = (
    SELECT id FROM public.profiles WHERE email = 'gilbertoromanholew@gmail.com'
  )
  GROUP BY user_id
)
SELECT 
  'VERIFICAÇÃO 5: Consistência Wallet vs Transactions' as check_name,
  w.bonus_credits as wallet_bonus,
  COALESCE(t.bonus_recebido, 0) as transactions_bonus,
  CASE 
    WHEN w.bonus_credits = COALESCE(t.bonus_recebido, 0) THEN '✅ OK'
    ELSE '❌ INCONSISTENTE'
  END as status_bonus,
  w.purchased_points as wallet_purchased,
  COALESCE(t.purchased_recebido, 0) as transactions_purchased,
  CASE 
    WHEN w.purchased_points = COALESCE(t.purchased_recebido, 0) THEN '✅ OK'
    ELSE '❌ INCONSISTENTE'
  END as status_purchased,
  w.total_spent as wallet_spent,
  COALESCE(t.total_gasto_transactions, 0) as transactions_spent,
  CASE 
    WHEN w.total_spent = COALESCE(t.total_gasto_transactions, 0) THEN '✅ OK'
    ELSE '❌ INCONSISTENTE'
  END as status_spent
FROM wallet_data w
LEFT JOIN transaction_totals t ON w.user_id = t.user_id;

-- ============================================
-- POSSÍVEIS PROBLEMAS:
-- ============================================

-- ❌ PROBLEMA 1: Frontend pede "purchased_credits" mas banco tem "purchased_points"
-- Solução: API precisa retornar AMBOS para compatibilidade

-- ❌ PROBLEMA 2: Frontend pede "total_credits" mas campo NÃO EXISTE
-- Solução: API precisa CALCULAR (bonus_credits + purchased_points)

-- ❌ PROBLEMA 3: Wallet pode estar com dados errados
-- Solução: Recalcular baseado nas transactions

-- ❌ PROBLEMA 4: Transações podem não estar sendo criadas
-- Solução: Verificar logs de execução de ferramentas
