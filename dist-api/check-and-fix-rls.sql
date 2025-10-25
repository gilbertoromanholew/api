-- ========================================
-- VERIFICAR E CORRIGIR RLS
-- ========================================

-- 1. VERIFICAR QUAIS TABELAS TÊM RLS ATIVADO
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
  'tools_catalog',
  'tools_executions',
  'economy_user_wallets',
  'economy_transactions',
  'economy_purchases',
  'economy_subscriptions',
  'social_referrals',
  'social_friendships',
  'social_friend_requests',
  'social_user_privacy_settings',
  'gamification_achievements',
  'gamification_achievement_unlocks',
  'gamification_achievement_showcase',
  'gamification_daily_streaks',
  'gamification_leaderboards',
  'gamification_user_achievements'
)
ORDER BY tablename;

-- 2. VERIFICAR POLÍTICAS EXISTENTES
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename LIKE '%_%'
ORDER BY tablename, policyname;

-- ========================================
-- DESATIVAR RLS TEMPORARIAMENTE PARA TESTE
-- ========================================
-- ATENÇÃO: Só execute se quiser DESATIVAR segurança para testar

-- ALTER TABLE public.tools_catalog DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.tools_executions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.economy_user_wallets DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.economy_transactions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.economy_purchases DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.economy_subscriptions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.social_referrals DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.gamification_achievements DISABLE ROW LEVEL SECURITY;

-- ========================================
-- CRIAR POLÍTICAS CORRETAS
-- ========================================
-- Execute após verificar o resultado acima

-- TOOLS_CATALOG (leitura pública para ferramentas ativas)
-- DROP POLICY IF EXISTS "tools_catalog_select_policy" ON public.tools_catalog;
-- CREATE POLICY "tools_catalog_select_policy" 
--   ON public.tools_catalog FOR SELECT 
--   USING (is_active = true);

-- TOOLS_EXECUTIONS (usuário vê apenas suas execuções)
-- DROP POLICY IF EXISTS "tools_executions_select_policy" ON public.tools_executions;
-- CREATE POLICY "tools_executions_select_policy" 
--   ON public.tools_executions FOR SELECT 
--   USING (auth.uid() = user_id);

-- DROP POLICY IF EXISTS "tools_executions_insert_policy" ON public.tools_executions;
-- CREATE POLICY "tools_executions_insert_policy" 
--   ON public.tools_executions FOR INSERT 
--   WITH CHECK (auth.uid() = user_id);

-- ECONOMY_USER_WALLETS (usuário vê apenas sua wallet)
-- DROP POLICY IF EXISTS "economy_user_wallets_select_policy" ON public.economy_user_wallets;
-- CREATE POLICY "economy_user_wallets_select_policy" 
--   ON public.economy_user_wallets FOR SELECT 
--   USING (auth.uid() = user_id);

-- DROP POLICY IF EXISTS "economy_user_wallets_update_policy" ON public.economy_user_wallets;
-- CREATE POLICY "economy_user_wallets_update_policy" 
--   ON public.economy_user_wallets FOR UPDATE 
--   USING (auth.uid() = user_id);

-- ECONOMY_TRANSACTIONS (usuário vê apenas suas transações)
-- DROP POLICY IF EXISTS "economy_transactions_select_policy" ON public.economy_transactions;
-- CREATE POLICY "economy_transactions_select_policy" 
--   ON public.economy_transactions FOR SELECT 
--   USING (auth.uid() = user_id);

-- DROP POLICY IF EXISTS "economy_transactions_insert_policy" ON public.economy_transactions;
-- CREATE POLICY "economy_transactions_insert_policy" 
--   ON public.economy_transactions FOR INSERT 
--   WITH CHECK (auth.uid() = user_id);

-- SOCIAL_REFERRALS (usuário vê seus referrals)
-- DROP POLICY IF EXISTS "social_referrals_select_policy" ON public.social_referrals;
-- CREATE POLICY "social_referrals_select_policy" 
--   ON public.social_referrals FOR SELECT 
--   USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- GAMIFICATION_ACHIEVEMENTS (leitura pública)
-- DROP POLICY IF EXISTS "gamification_achievements_select_policy" ON public.gamification_achievements;
-- CREATE POLICY "gamification_achievements_select_policy" 
--   ON public.gamification_achievements FOR SELECT 
--   USING (true);
