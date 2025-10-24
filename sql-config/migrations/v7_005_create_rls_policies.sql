-- ============================================
-- MIGRAÇÃO V7 - PARTE 5: RLS POLICIES
-- ============================================
-- Data: 23/10/2025
-- Pré-requisito: v7_004 executado
-- ============================================

-- ============================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- ============================================

-- Economy
ALTER TABLE economy.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy.point_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy.referral_rewards ENABLE ROW LEVEL SECURITY;

-- Tools
ALTER TABLE tools.catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools.executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools.user_favorites ENABLE ROW LEVEL SECURITY;

-- Gamification
ALTER TABLE gamification.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification.achievement_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification.achievement_showcase ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification.leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification.daily_streaks ENABLE ROW LEVEL SECURITY;

-- Social
ALTER TABLE social.user_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE social.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE social.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE social.referrals ENABLE ROW LEVEL SECURITY;

-- Audit
ALTER TABLE audit.access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.admin_actions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ECONOMY POLICIES
-- ============================================

-- user_wallets
CREATE POLICY "users_view_own_wallet"
  ON economy.user_wallets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "service_manage_wallets"
  ON economy.user_wallets FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- transactions
CREATE POLICY "users_view_own_transactions"
  ON economy.transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "service_create_transactions"
  ON economy.transactions FOR INSERT
  TO service_role
  WITH CHECK (true);

-- subscription_plans (público)
CREATE POLICY "anyone_view_active_plans"
  ON economy.subscription_plans FOR SELECT
  TO authenticated
  USING (is_active = true);

-- subscriptions
CREATE POLICY "users_view_own_subscriptions"
  ON economy.subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "service_manage_subscriptions"
  ON economy.subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- point_packages (público)
CREATE POLICY "anyone_view_active_packages"
  ON economy.point_packages FOR SELECT
  TO authenticated
  USING (is_active = true);

-- purchases
CREATE POLICY "users_view_own_purchases"
  ON economy.purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "service_manage_purchases"
  ON economy.purchases FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- referral_rewards
CREATE POLICY "users_view_own_rewards"
  ON economy.referral_rewards FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id);

CREATE POLICY "service_create_rewards"
  ON economy.referral_rewards FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================
-- TOOLS POLICIES
-- ============================================

-- catalog (público)
CREATE POLICY "anyone_view_active_tools"
  ON tools.catalog FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "service_manage_catalog"
  ON tools.catalog FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- executions
CREATE POLICY "users_view_own_executions"
  ON tools.executions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "service_create_executions"
  ON tools.executions FOR INSERT
  TO service_role
  WITH CHECK (true);

-- user_favorites
CREATE POLICY "users_manage_own_favorites"
  ON tools.user_favorites FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- GAMIFICATION POLICIES
-- ============================================

-- achievements (público se não for secreta)
CREATE POLICY "anyone_view_non_secret_achievements"
  ON gamification.achievements FOR SELECT
  TO authenticated
  USING (is_active = true AND (is_secret = false OR EXISTS (
    SELECT 1 FROM gamification.user_achievements ua
    WHERE ua.achievement_id = achievements.id
      AND ua.user_id = auth.uid()
  )));

CREATE POLICY "service_manage_achievements"
  ON gamification.achievements FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- user_achievements (próprias ou públicas)
CREATE POLICY "users_view_own_achievements"
  ON gamification.user_achievements FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM social.user_privacy_settings ups
      WHERE ups.user_id = user_achievements.user_id
        AND ups.achievements_visibility = 'public'
    )
    OR EXISTS (
      SELECT 1 FROM social.user_privacy_settings ups
      JOIN social.friendships f ON (
        (f.user_id = auth.uid() AND f.friend_id = user_achievements.user_id)
        OR (f.friend_id = auth.uid() AND f.user_id = user_achievements.user_id)
      )
      WHERE ups.user_id = user_achievements.user_id
        AND ups.achievements_visibility = 'friends_only'
        AND f.status = 'accepted'
    )
  );

CREATE POLICY "service_manage_user_achievements"
  ON gamification.user_achievements FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- achievement_unlocks
CREATE POLICY "users_view_own_unlocks"
  ON gamification.achievement_unlocks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "service_create_unlocks"
  ON gamification.achievement_unlocks FOR INSERT
  TO service_role
  WITH CHECK (true);

-- achievement_showcase
CREATE POLICY "users_manage_own_showcase"
  ON gamification.achievement_showcase FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "anyone_view_public_showcases"
  ON gamification.achievement_showcase FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM social.user_privacy_settings ups
    WHERE ups.user_id = achievement_showcase.user_id
      AND ups.achievements_visibility IN ('public', 'friends_only')
  ));

-- leaderboards (público)
CREATE POLICY "anyone_view_leaderboards"
  ON gamification.leaderboards FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "service_manage_leaderboards"
  ON gamification.leaderboards FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- daily_streaks
CREATE POLICY "users_view_own_streaks"
  ON gamification.daily_streaks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "service_manage_streaks"
  ON gamification.daily_streaks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- SOCIAL POLICIES
-- ============================================

-- user_privacy_settings
CREATE POLICY "users_manage_own_privacy"
  ON social.user_privacy_settings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- friendships
CREATE POLICY "users_view_own_friendships"
  ON social.friendships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "users_manage_own_friendships"
  ON social.friendships FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- friend_requests
CREATE POLICY "users_view_related_requests"
  ON social.friend_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "users_create_requests"
  ON social.friend_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "users_respond_to_requests"
  ON social.friend_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = to_user_id);

-- referrals
CREATE POLICY "users_view_own_referrals"
  ON social.referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "service_manage_referrals"
  ON social.referrals FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- AUDIT POLICIES
-- ============================================

-- access_logs (apenas próprios)
CREATE POLICY "users_view_own_access_logs"
  ON audit.access_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "service_create_access_logs"
  ON audit.access_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- security_events (apenas próprios ou admin)
CREATE POLICY "users_view_own_security_events"
  ON audit.security_events FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "service_create_security_events"
  ON audit.security_events FOR INSERT
  TO service_role
  WITH CHECK (true);

-- admin_actions (apenas admin)
CREATE POLICY "admins_view_admin_actions"
  ON audit.admin_actions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  ));

CREATE POLICY "admins_create_admin_actions"
  ON audit.admin_actions FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  ));

-- ============================================
-- CONCEDER PERMISSÕES PADRÃO NAS TABELAS
-- ============================================

-- Authenticated pode SELECT em tabelas públicas
GRANT SELECT ON economy.subscription_plans TO authenticated;
GRANT SELECT ON economy.point_packages TO authenticated;
GRANT SELECT ON tools.catalog TO authenticated;
GRANT SELECT ON gamification.achievements TO authenticated;
GRANT SELECT ON gamification.leaderboards TO authenticated;

-- Service role pode tudo
GRANT ALL ON ALL TABLES IN SCHEMA economy TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA gamification TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA tools TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA social TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA audit TO service_role;

-- ============================================
-- SUCESSO!
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '✅ RLS POLICIES CRIADAS COM SUCESSO!';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Todas as tabelas estão protegidas com RLS';
  RAISE NOTICE 'Policies configuradas para:';
  RAISE NOTICE '  - economy (7 tabelas)';
  RAISE NOTICE '  - tools (3 tabelas)';
  RAISE NOTICE '  - gamification (6 tabelas)';
  RAISE NOTICE '  - social (4 tabelas)';
  RAISE NOTICE '  - audit (3 tabelas)';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximo passo: v7_006_create_functions.sql';
  RAISE NOTICE '════════════════════════════════════════';
END $$;
