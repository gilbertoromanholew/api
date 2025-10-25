-- ============================================
-- VERIFICAÇÃO RÁPIDA - ESTRUTURAS E DADOS
-- ============================================

-- 1. Ver TODAS as colunas de economy.user_wallets
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'economy' AND table_name = 'user_wallets'
ORDER BY ordinal_position;

-- 2. Ver TODAS as colunas de economy.transactions
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'economy' AND table_name = 'transactions'
ORDER BY ordinal_position;

-- 3. Ver TODAS as colunas de tools.catalog
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'tools' AND table_name = 'catalog'
ORDER BY ordinal_position;

-- 4. Ver TODAS as colunas de tools.executions
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'tools' AND table_name = 'executions'
ORDER BY ordinal_position;

-- 5. Buscar meu usuário
SELECT 
  id,
  email,
  full_name,
  updated_at
FROM public.profiles
WHERE email = 'gilbertoromanholew@gmail.com';

-- 6. Ver se tenho wallet (sem especificar colunas)
SELECT *
FROM economy.user_wallets
LIMIT 5;

-- 7. Ver estatísticas gerais
SELECT 'tools.catalog' as tabela, COUNT(*) as total FROM tools.catalog
UNION ALL
SELECT 'tools.executions', COUNT(*) FROM tools.executions
UNION ALL
SELECT 'economy.user_wallets', COUNT(*) FROM economy.user_wallets
UNION ALL
SELECT 'economy.transactions', COUNT(*) FROM economy.transactions
UNION ALL
SELECT 'public.profiles', COUNT(*) FROM public.profiles;
