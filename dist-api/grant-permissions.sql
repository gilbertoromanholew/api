-- ========================================
-- CONCEDER PERMISSÕES PARA SERVICE_ROLE
-- ========================================

-- 1. TOOLS
GRANT ALL ON TABLE public.tools_catalog TO service_role;
GRANT ALL ON TABLE public.tools_executions TO service_role;

-- 2. ECONOMY
GRANT ALL ON TABLE public.economy_user_wallets TO service_role;
GRANT ALL ON TABLE public.economy_transactions TO service_role;
GRANT ALL ON TABLE public.economy_purchases TO service_role;
GRANT ALL ON TABLE public.economy_subscriptions TO service_role;

-- 3. SOCIAL
GRANT ALL ON TABLE public.social_referrals TO service_role;
-- social_friendships, social_friend_requests, social_user_privacy_settings não foram migradas ainda

-- 4. GAMIFICATION
GRANT ALL ON TABLE public.gamification_achievements TO service_role;
GRANT ALL ON TABLE public.gamification_achievement_unlocks TO service_role;
GRANT ALL ON TABLE public.gamification_achievement_showcase TO service_role;
GRANT ALL ON TABLE public.gamification_daily_streaks TO service_role;
GRANT ALL ON TABLE public.gamification_leaderboards TO service_role;
GRANT ALL ON TABLE public.gamification_user_achievements TO service_role;

-- ========================================
-- NOTIFICAR POSTGREST PARA RECARREGAR
-- ========================================
NOTIFY pgrst, 'reload schema';

-- ========================================
-- VERIFICAR PERMISSÕES
-- ========================================
SELECT 
  tablename,
  has_table_privilege('service_role', schemaname || '.' || tablename, 'SELECT') as can_select,
  has_table_privilege('service_role', schemaname || '.' || tablename, 'INSERT') as can_insert,
  has_table_privilege('service_role', schemaname || '.' || tablename, 'UPDATE') as can_update,
  has_table_privilege('service_role', schemaname || '.' || tablename, 'DELETE') as can_delete
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
  'gamification_achievements',
  'gamification_achievement_unlocks',
  'gamification_achievement_showcase',
  'gamification_daily_streaks',
  'gamification_leaderboards',
  'gamification_user_achievements'
)
ORDER BY tablename;
