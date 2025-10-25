-- =========================================
-- DEBUG: Verificar créditos do usuário
-- =========================================

-- 1. Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'economy_user_wallets'
ORDER BY ordinal_position;

-- 2. Verificar se existem carteiras
SELECT COUNT(*) AS total_carteiras
FROM public.economy_user_wallets;

-- 3. Ver dados de TODAS as carteiras (limite 5)
SELECT 
    user_id,
    bonus_credits,
    purchased_points,
    (bonus_credits + purchased_points) AS total_calculado,
    total_earned_bonus,
    total_purchased,
    total_spent,
    created_at
FROM public.economy_user_wallets
ORDER BY created_at DESC
LIMIT 5;

-- 4. Verificar carteiras com créditos > 0
SELECT 
    user_id,
    bonus_credits,
    purchased_points,
    (bonus_credits + purchased_points) AS total
FROM public.economy_user_wallets
WHERE bonus_credits > 0 OR purchased_points > 0;

-- 5. Se não houver carteiras, criar uma de teste
-- DESCOMENTE ESTAS LINHAS SE PRECISAR:
-- INSERT INTO public.economy_user_wallets (
--     user_id,
--     bonus_credits,
--     purchased_points,
--     total_earned_bonus,
--     total_purchased,
--     total_spent
-- )
-- SELECT 
--     id,
--     100,  -- bonus_credits inicial
--     0,    -- purchased_points inicial
--     100,  -- total_earned_bonus
--     0,    -- total_purchased
--     0     -- total_spent
-- FROM auth.users
-- WHERE NOT EXISTS (
--     SELECT 1 FROM public.economy_user_wallets WHERE user_id = auth.users.id
-- )
-- LIMIT 1;

-- =========================================
-- RESULTADOS ESPERADOS:
-- =========================================
-- Query 1: Lista de colunas (deve ter bonus_credits e purchased_points)
-- Query 2: Número total de carteiras
-- Query 3: Dados das últimas 5 carteiras criadas
-- Query 4: Carteiras com saldo > 0
-- =========================================
