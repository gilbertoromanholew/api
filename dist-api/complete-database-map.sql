-- ============================================
-- MAPEAMENTO COMPLETO DO BANCO DE DADOS V7
-- Atualizado com informações corretas
-- ============================================

-- ========================================
-- RESUMO GERAL
-- ========================================

SELECT 
  'RESUMO GERAL' as secao,
  table_schema as schema_name,
  COUNT(*) as total_tabelas
FROM information_schema.tables
WHERE table_schema IN ('public', 'tools', 'economy', 'social')
  AND table_type = 'BASE TABLE'
GROUP BY table_schema
ORDER BY table_schema;

-- ========================================
-- SCHEMA: public (Sistema core)
-- ========================================

SELECT 
  'PUBLIC SCHEMA' as secao,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_schema = 'public' AND columns.table_name = tables.table_name) as colunas
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ========================================
-- SCHEMA: tools (Ferramentas)
-- ========================================

SELECT 
  'TOOLS SCHEMA' as secao,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_schema = 'tools' AND columns.table_name = tables.table_name) as colunas
FROM information_schema.tables
WHERE table_schema = 'tools'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Estrutura: tools.catalog
SELECT 
  'tools.catalog - ESTRUTURA' as info,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'tools' AND table_name = 'catalog'
ORDER BY ordinal_position;

-- Estrutura: tools.executions
SELECT 
  'tools.executions - ESTRUTURA' as info,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'tools' AND table_name = 'executions'
ORDER BY ordinal_position;

-- ========================================
-- SCHEMA: economy (Sistema econômico)
-- ========================================

SELECT 
  'ECONOMY SCHEMA' as secao,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_schema = 'economy' AND columns.table_name = tables.table_name) as colunas
FROM information_schema.tables
WHERE table_schema = 'economy'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Estrutura: economy.user_wallets
SELECT 
  'economy.user_wallets - ESTRUTURA' as info,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'economy' AND table_name = 'user_wallets'
ORDER BY ordinal_position;

-- Estrutura: economy.transactions
SELECT 
  'economy.transactions - ESTRUTURA' as info,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'economy' AND table_name = 'transactions'
ORDER BY ordinal_position;

-- Estrutura: economy.purchases
SELECT 
  'economy.purchases - ESTRUTURA' as info,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'economy' AND table_name = 'purchases'
ORDER BY ordinal_position;

-- Estrutura: economy.subscriptions
SELECT 
  'economy.subscriptions - ESTRUTURA' as info,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'economy' AND table_name = 'subscriptions'
ORDER BY ordinal_position;

-- Estrutura: economy.subscription_plans
SELECT 
  'economy.subscription_plans - ESTRUTURA' as info,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'economy' AND table_name = 'subscription_plans'
ORDER BY ordinal_position;

-- Estrutura: economy.referral_rewards
SELECT 
  'economy.referral_rewards - ESTRUTURA' as info,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'economy' AND table_name = 'referral_rewards'
ORDER BY ordinal_position;

-- ========================================
-- SCHEMA: social (Sistema social)
-- ========================================

SELECT 
  'SOCIAL SCHEMA' as secao,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_schema = 'social' AND columns.table_name = tables.table_name) as colunas
FROM information_schema.tables
WHERE table_schema = 'social'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Estrutura: social.friend_requests
SELECT 
  'social.friend_requests - ESTRUTURA' as info,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'social' AND table_name = 'friend_requests'
ORDER BY ordinal_position;

-- Estrutura: social.friendships
SELECT 
  'social.friendships - ESTRUTURA' as info,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'social' AND table_name = 'friendships'
ORDER BY ordinal_position;

-- Estrutura: social.referrals
SELECT 
  'social.referrals - ESTRUTURA' as info,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'social' AND table_name = 'referrals'
ORDER BY ordinal_position;

-- Estrutura: social.user_privacy_settings
SELECT 
  'social.user_privacy_settings - ESTRUTURA' as info,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'social' AND table_name = 'user_privacy_settings'
ORDER BY ordinal_position;

-- ========================================
-- VERIFICAÇÃO: Dados do usuário
-- ========================================

-- Verificar se usuário tem wallet
SELECT 
  'VERIFICAÇÃO: Wallet' as check_type,
  p.id as user_id,
  p.full_name,
  p.email,
  CASE 
    WHEN w.user_id IS NOT NULL THEN 'TEM WALLET ✅'
    ELSE 'SEM WALLET ❌'
  END as status,
  w.bonus_credits,
  w.purchased_credits,
  w.total_credits
FROM public.profiles p
LEFT JOIN economy.user_wallets w ON p.id = w.user_id
WHERE p.email = 'gilbertoromanholew@gmail.com';

-- Verificar transações do usuário
SELECT 
  'VERIFICAÇÃO: Transações' as check_type,
  COUNT(*) as total_transacoes,
  SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_creditos,
  SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END) as total_gastos
FROM economy.transactions t
JOIN public.profiles p ON t.user_id = p.id
WHERE p.email = 'gilbertoromanholew@gmail.com';

-- Verificar execuções de ferramentas
SELECT 
  'VERIFICAÇÃO: Execuções' as check_type,
  COUNT(*) as total_execucoes
FROM tools.executions e
JOIN public.profiles p ON e.user_id = p.id
WHERE p.email = 'gilbertoromanholew@gmail.com';

-- ========================================
-- ESTATÍSTICAS GERAIS
-- ========================================

-- Totais por schema
SELECT 'ESTATÍSTICAS' as secao, 'tools.catalog' as tabela, COUNT(*) as registros FROM tools.catalog
UNION ALL
SELECT 'ESTATÍSTICAS', 'tools.executions', COUNT(*) FROM tools.executions
UNION ALL
SELECT 'ESTATÍSTICAS', 'economy.user_wallets', COUNT(*) FROM economy.user_wallets
UNION ALL
SELECT 'ESTATÍSTICAS', 'economy.transactions', COUNT(*) FROM economy.transactions
UNION ALL
SELECT 'ESTATÍSTICAS', 'economy.purchases', COUNT(*) FROM economy.purchases
UNION ALL
SELECT 'ESTATÍSTICAS', 'economy.subscriptions', COUNT(*) FROM economy.subscriptions
UNION ALL
SELECT 'ESTATÍSTICAS', 'economy.subscription_plans', COUNT(*) FROM economy.subscription_plans
UNION ALL
SELECT 'ESTATÍSTICAS', 'economy.referral_rewards', COUNT(*) FROM economy.referral_rewards
UNION ALL
SELECT 'ESTATÍSTICAS', 'social.friend_requests', COUNT(*) FROM social.friend_requests
UNION ALL
SELECT 'ESTATÍSTICAS', 'social.friendships', COUNT(*) FROM social.friendships
UNION ALL
SELECT 'ESTATÍSTICAS', 'social.referrals', COUNT(*) FROM social.referrals
UNION ALL
SELECT 'ESTATÍSTICAS', 'social.user_privacy_settings', COUNT(*) FROM social.user_privacy_settings
UNION ALL
SELECT 'ESTATÍSTICAS', 'public.profiles', COUNT(*) FROM public.profiles
ORDER BY tabela;
