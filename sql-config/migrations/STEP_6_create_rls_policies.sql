-- ============================================
-- ✅ PASSO 6: CONFIGURAR ROW LEVEL SECURITY (RLS)
-- ============================================
-- Execute no SQL Editor (https://mpanel.samm.host)
-- Tempo estimado: 1-2 minutos
-- ============================================

-- ============================================
-- 1️⃣ HABILITAR RLS EM TODAS AS TABELAS
-- ============================================

-- Economy (7 tabelas)
ALTER TABLE economy.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy.point_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy.referral_rewards ENABLE ROW LEVEL SECURITY;

-- Tools (3 tabelas)
ALTER TABLE tools.catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools.executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools.user_favorites ENABLE ROW LEVEL SECURITY;

-- Gamification (6 tabelas)
ALTER TABLE gamification.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification.achievement_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification.achievement_showcase ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification.leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification.daily_streaks ENABLE ROW LEVEL SECURITY;

-- Social (4 tabelas)
ALTER TABLE social.user_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE social.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE social.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE social.referrals ENABLE ROW LEVEL SECURITY;

-- Audit (3 tabelas)
ALTER TABLE audit.access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.admin_actions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2️⃣ CRIAR POLICIES BÁSICAS
-- ============================================

-- ECONOMY: Usuários veem apenas seus próprios dados
CREATE POLICY "users_view_own_wallet" ON economy.user_wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users_view_own_transactions" ON economy.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users_view_own_subscriptions" ON economy.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users_view_own_purchases" ON economy.purchases FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users_view_own_referral_rewards" ON economy.referral_rewards FOR SELECT TO authenticated USING (auth.uid() = referrer_id);

-- ECONOMY: Catálogos públicos (planos e pacotes)
CREATE POLICY "anyone_view_active_plans" ON economy.subscription_plans FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "anyone_view_active_packages" ON economy.point_packages FOR SELECT TO authenticated USING (is_active = true);

-- TOOLS: Catálogo público, execuções e favoritos privados
CREATE POLICY "anyone_view_active_tools" ON tools.catalog FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "users_view_own_executions" ON tools.executions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users_manage_own_favorites" ON tools.user_favorites FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- GAMIFICATION: Conquistas públicas, progresso privado
CREATE POLICY "anyone_view_active_achievements" ON gamification.achievements FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "users_view_own_progress" ON gamification.user_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users_view_own_unlocks" ON gamification.achievement_unlocks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users_manage_own_showcase" ON gamification.achievement_showcase FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_view_own_leaderboard" ON gamification.leaderboards FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users_view_own_streak" ON gamification.daily_streaks FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- SOCIAL: Configurações privadas, amizades e pedidos
CREATE POLICY "users_manage_own_privacy" ON social.user_privacy_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_view_own_friendships" ON social.friendships FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "users_view_own_friend_requests" ON social.friend_requests FOR SELECT TO authenticated USING (auth.uid() = requester_id OR auth.uid() = requested_id);
CREATE POLICY "users_manage_own_friend_requests" ON social.friend_requests FOR ALL TO authenticated USING (auth.uid() = requester_id OR auth.uid() = requested_id) WITH CHECK (auth.uid() = requester_id OR auth.uid() = requested_id);
CREATE POLICY "users_view_own_referrals" ON social.referrals FOR SELECT TO authenticated USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- AUDIT: Usuários veem apenas seus próprios logs
CREATE POLICY "users_view_own_access_logs" ON audit.access_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users_view_own_security_events" ON audit.security_events FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- 3️⃣ SERVICE_ROLE TEM ACESSO TOTAL
-- ============================================

-- Economy
CREATE POLICY "service_manage_wallets" ON economy.user_wallets FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_manage_transactions" ON economy.transactions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_manage_subscriptions" ON economy.subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_manage_purchases" ON economy.purchases FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_manage_referral_rewards" ON economy.referral_rewards FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Tools
CREATE POLICY "service_manage_catalog" ON tools.catalog FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_manage_executions" ON tools.executions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Gamification
CREATE POLICY "service_manage_achievements" ON gamification.achievements FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_manage_user_achievements" ON gamification.user_achievements FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_manage_unlocks" ON gamification.achievement_unlocks FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_manage_leaderboards" ON gamification.leaderboards FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_manage_streaks" ON gamification.daily_streaks FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Social
CREATE POLICY "service_manage_friendships" ON social.friendships FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_manage_referrals" ON social.referrals FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Audit
CREATE POLICY "service_manage_access_logs" ON audit.access_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_manage_security_events" ON audit.security_events FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_manage_admin_actions" ON audit.admin_actions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- ✅ VERIFICAÇÃO FINAL
-- ============================================

SELECT 
  schemaname as schema,
  tablename as tabela,
  COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname IN ('economy', 'gamification', 'tools', 'social', 'audit')
GROUP BY schemaname, tablename
ORDER BY schemaname, tablename;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- Deve mostrar políticas criadas para cada tabela
-- Exemplo:
-- schema       | tabela                  | total_policies
-- -------------|-------------------------|---------------
-- economy      | point_packages          | 2
-- economy      | purchases               | 2
-- economy      | subscriptions           | 2
-- economy      | transactions            | 2
-- economy      | user_wallets            | 2
-- ... (mais linhas)
--
-- Total esperado: ~40 policies
-- ============================================

-- ✅ Se aparecerem policies para todas as tabelas, MIGRAÇÃO COMPLETA! 🎉
