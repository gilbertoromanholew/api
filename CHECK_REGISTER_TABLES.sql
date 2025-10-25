-- ============================================
-- VERIFICAR ESTRUTURA DE TABELAS CRÍTICAS
-- Para diagnosticar erro de registro
-- ============================================

-- 1. Verificar colunas de economy_user_wallets
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'economy_user_wallets'
ORDER BY ordinal_position;

-- 2. Verificar colunas de profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Verificar colunas de economy_transactions
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'economy_transactions'
ORDER BY ordinal_position;

-- 4. Testar INSERT em economy_user_wallets (com ROLLBACK)
DO $$
BEGIN
  -- Tentar inserir (sem commitar)
  INSERT INTO economy_user_wallets (
    user_id,
    bonus_credits,
    purchased_points,
    total_earned_bonus,
    total_purchased,
    total_spent,
    pro_weekly_allowance
  ) VALUES (
    gen_random_uuid(),
    100,
    0,
    100,
    0,
    0,
    20
  );
  
  RAISE NOTICE '✅ INSERT em economy_user_wallets funcionou!';
  
  -- Desfazer
  ROLLBACK;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Erro no INSERT: %', SQLERRM;
    ROLLBACK;
END $$;
