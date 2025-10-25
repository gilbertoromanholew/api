-- Verificar quais são os nomes corretos das colunas
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'economy_user_wallets'
  AND column_name IN ('bonus_credits', 'purchased_points', 'purchased_credits')
ORDER BY column_name;

-- Verificar dados de um usuário (exemplo)
SELECT 
    user_id,
    bonus_credits,
    purchased_points,
    total_earned_bonus,
    total_purchased,
    total_spent
FROM public.economy_user_wallets
LIMIT 3;
