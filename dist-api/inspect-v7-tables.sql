-- ============================================
-- INSPEÇÃO DETALHADA DAS TABELAS V7
-- ============================================

-- ========================================
-- SCHEMA: tools
-- ========================================

-- tools.catalog - Estrutura e dados
SELECT 
  'tools.catalog - ESTRUTURA' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'tools' 
  AND table_name = 'catalog'
ORDER BY ordinal_position;

SELECT 
  'tools.catalog - DADOS' as info,
  COUNT(*) as total_ferramentas,
  COUNT(DISTINCT id) as ferramentas_unicas
FROM tools.catalog;

SELECT * FROM tools.catalog LIMIT 5;

-- tools.executions - Estrutura e dados
SELECT 
  'tools.executions - ESTRUTURA' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'tools' 
  AND table_name = 'executions'
ORDER BY ordinal_position;

SELECT 
  'tools.executions - DADOS' as info,
  COUNT(*) as total_execucoes,
  COUNT(DISTINCT user_id) as usuarios_unicos,
  COUNT(DISTINCT tool_id) as ferramentas_usadas
FROM tools.executions;

-- ========================================
-- SCHEMA: economy
-- ========================================

-- economy.user_wallets - Estrutura e dados
SELECT 
  'economy.user_wallets - ESTRUTURA' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'economy' 
  AND table_name = 'user_wallets'
ORDER BY ordinal_position;

SELECT 
  'economy.user_wallets - DADOS' as info,
  COUNT(*) as total_wallets,
  SUM(bonus_credits) as total_bonus,
  SUM(purchased_credits) as total_purchased,
  SUM(total_credits) as total_geral
FROM economy.user_wallets;

SELECT * FROM economy.user_wallets LIMIT 5;

-- economy.transactions - Estrutura e dados
SELECT 
  'economy.transactions - ESTRUTURA' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'economy' 
  AND table_name = 'transactions'
ORDER BY ordinal_position;

SELECT 
  'economy.transactions - DADOS' as info,
  COUNT(*) as total_transacoes,
  COUNT(DISTINCT user_id) as usuarios_com_transacoes,
  SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_creditos,
  SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END) as total_debitos
FROM economy.transactions;

-- economy.purchases - Estrutura e dados
SELECT 
  'economy.purchases - ESTRUTURA' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'economy' 
  AND table_name = 'purchases'
ORDER BY ordinal_position;

SELECT 
  'economy.purchases - DADOS' as info,
  COUNT(*) as total_compras,
  COUNT(DISTINCT user_id) as usuarios_compradores,
  SUM(amount) as receita_total
FROM economy.purchases;

-- economy.subscriptions - Estrutura e dados
SELECT 
  'economy.subscriptions - ESTRUTURA' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'economy' 
  AND table_name = 'subscriptions'
ORDER BY ordinal_position;

SELECT 
  'economy.subscriptions - DADOS' as info,
  COUNT(*) as total_assinaturas,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as assinaturas_ativas,
  COUNT(DISTINCT user_id) as usuarios_assinantes
FROM economy.subscriptions;

-- economy.subscription_plans - Estrutura e dados
SELECT 
  'economy.subscription_plans - ESTRUTURA' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'economy' 
  AND table_name = 'subscription_plans'
ORDER BY ordinal_position;

SELECT * FROM economy.subscription_plans;

-- economy.referral_rewards - Estrutura e dados
SELECT 
  'economy.referral_rewards - ESTRUTURA' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'economy' 
  AND table_name = 'referral_rewards'
ORDER BY ordinal_position;

SELECT 
  'economy.referral_rewards - DADOS' as info,
  COUNT(*) as total_recompensas,
  COUNT(DISTINCT referrer_id) as usuarios_que_indicaram,
  COUNT(DISTINCT referred_id) as usuarios_indicados,
  SUM(reward_amount) as total_recompensas_pagas
FROM economy.referral_rewards;

-- ========================================
-- SCHEMA: social
-- ========================================

-- social.referrals - Estrutura e dados
SELECT 
  'social.referrals - ESTRUTURA' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'social' 
  AND table_name = 'referrals'
ORDER BY ordinal_position;

SELECT 
  'social.referrals - DADOS' as info,
  COUNT(*) as total_referrals,
  COUNT(DISTINCT referrer_id) as usuarios_que_indicaram,
  COUNT(DISTINCT referred_id) as usuarios_indicados
FROM social.referrals;

-- ========================================
-- COMPARAÇÃO: public vs economy
-- ========================================

-- Comparar public.purchases vs economy.purchases
SELECT 
  'COMPARAÇÃO: public.purchases' as tabela,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'purchases'
ORDER BY ordinal_position;

SELECT 
  'COMPARAÇÃO: economy.purchases' as tabela,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'economy' AND table_name = 'purchases'
ORDER BY ordinal_position;

SELECT COUNT(*) as registros_public FROM public.purchases;
SELECT COUNT(*) as registros_economy FROM economy.purchases;

-- ========================================
-- VERIFICAÇÃO: Usuário tem wallet?
-- ========================================

SELECT 
  'VERIFICAÇÃO: Usuário Gilberto' as info,
  p.id,
  p.full_name,
  p.email,
  w.user_id as tem_wallet,
  w.bonus_credits,
  w.purchased_credits,
  w.total_credits
FROM public.profiles p
LEFT JOIN economy.user_wallets w ON p.id = w.user_id
WHERE p.email = 'gilbertoromanholew@gmail.com';

-- ========================================
-- RECOMENDAÇÕES DE EXCLUSÃO
-- ========================================

-- Tabelas vazias que podem ser deletadas
SELECT 
  table_schema,
  table_name,
  'VAZIA - PODE DELETAR' as recomendacao
FROM (
  SELECT 'public' as table_schema, 'referral_history' as table_name, (SELECT COUNT(*) FROM public.referral_history) as total
  UNION ALL
  SELECT 'public', 'referral_stats', (SELECT COUNT(*) FROM public.referral_stats)
  UNION ALL
  SELECT 'public', 'purchases', (SELECT COUNT(*) FROM public.purchases)
) t
WHERE total = 0;
