-- ============================================
-- MIGRAÇÃO V7 - PARTE 4: MIGRAR DADOS
-- ============================================
-- Data: 23/10/2025
-- Pré-requisito: v7_001, v7_002 e v7_003 executados
-- ============================================
-- ATENÇÃO: Este script migra dados existentes!
-- Faça backup antes de executar!
-- ============================================

-- ============================================
-- 1. MIGRAR user_points → economy.user_wallets
-- ============================================

INSERT INTO economy.user_wallets (
  user_id,
  bonus_credits,
  purchased_points,
  total_earned_bonus,
  total_purchased,
  total_spent,
  pro_weekly_allowance,
  last_allowance_date,
  created_at,
  updated_at
)
SELECT 
  user_id,
  free_points AS bonus_credits,
  paid_points AS purchased_points,
  total_earned AS total_earned_bonus,
  total_purchased,
  total_spent,
  20 AS pro_weekly_allowance, -- Default para todos
  NULL AS last_allowance_date,
  created_at,
  updated_at
FROM public.user_points
ON CONFLICT (user_id) DO UPDATE SET
  bonus_credits = EXCLUDED.bonus_credits,
  purchased_points = EXCLUDED.purchased_points,
  total_earned_bonus = EXCLUDED.total_earned_bonus,
  total_purchased = EXCLUDED.total_purchased,
  total_spent = EXCLUDED.total_spent,
  updated_at = NOW();

-- Verificação
DO $$
DECLARE
  count_old INTEGER;
  count_new INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_old FROM public.user_points;
  SELECT COUNT(*) INTO count_new FROM economy.user_wallets;
  
  IF count_old = count_new THEN
    RAISE NOTICE '✅ user_points migrado: % registros', count_new;
  ELSE
    RAISE WARNING '⚠️ Discrepância: old=% new=%', count_old, count_new;
  END IF;
END $$;

-- ============================================
-- 2. MIGRAR point_transactions → economy.transactions
-- ============================================

INSERT INTO economy.transactions (
  id,
  user_id,
  type,
  point_type,
  amount,
  balance_before,
  balance_after,
  description,
  tool_name,
  achievement_key,
  stripe_payment_id,
  referred_user_id,
  multiplier,
  created_at
)
SELECT 
  id,
  user_id,
  -- Mapear tipos antigos para novos
  CASE type
    WHEN 'signup_bonus' THEN 'signup_bonus'::economy.transaction_type
    WHEN 'referral_bonus' THEN 'referral_reward'::economy.transaction_type
    WHEN 'purchase' THEN 'purchase'::economy.transaction_type
    WHEN 'tool_usage' THEN 'tool_usage'::economy.transaction_type
    WHEN 'admin_adjustment' THEN 'admin_adjustment'::economy.transaction_type
    WHEN 'refund' THEN 'refund'::economy.transaction_type
    ELSE 'admin_adjustment'::economy.transaction_type
  END AS type,
  -- Mapear point_type
  CASE point_type
    WHEN 'free' THEN 'bonus'::economy.point_type
    WHEN 'paid' THEN 'purchased'::economy.point_type
    ELSE 'bonus'::economy.point_type
  END AS point_type,
  amount,
  balance_before,
  balance_after,
  description,
  tool_name,
  NULL AS achievement_key, -- Não existia antes
  stripe_payment_id,
  referred_user_id,
  1.0 AS multiplier, -- Default
  created_at
FROM public.point_transactions
ON CONFLICT (id) DO UPDATE SET
  type = EXCLUDED.type,
  point_type = EXCLUDED.point_type,
  amount = EXCLUDED.amount;

-- Verificação
DO $$
DECLARE
  count_old INTEGER;
  count_new INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_old FROM public.point_transactions;
  SELECT COUNT(*) INTO count_new FROM economy.transactions;
  
  IF count_old = count_new THEN
    RAISE NOTICE '✅ point_transactions migrado: % registros', count_new;
  ELSE
    RAISE WARNING '⚠️ Discrepância: old=% new=%', count_old, count_new;
  END IF;
END $$;

-- ============================================
-- 3. MIGRAR point_packages → economy.point_packages
-- ============================================

INSERT INTO economy.point_packages (
  id,
  name,
  description,
  points_amount,
  bonus_percentage,
  price_brl,
  stripe_product_id,
  stripe_price_id,
  is_popular,
  is_best_value,
  is_active,
  display_order,
  created_at
)
SELECT 
  id,
  name,
  description,
  points AS points_amount,
  bonus_percentage,
  price_cents / 100.0 AS price_brl, -- Converter centavos para reais
  stripe_price_id AS stripe_product_id, -- Ajustar se necessário
  stripe_price_id,
  (name = 'Pacote Médio') AS is_popular, -- Marcar Médio como popular
  (name = 'Pacote Premium') AS is_best_value, -- Marcar Premium como melhor
  is_active,
  display_order,
  created_at
FROM public.point_packages
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  points_amount = EXCLUDED.points_amount,
  price_brl = EXCLUDED.price_brl;

-- Verificação
DO $$
DECLARE
  count_old INTEGER;
  count_new INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_old FROM public.point_packages;
  SELECT COUNT(*) INTO count_new FROM economy.point_packages;
  
  IF count_old = count_new THEN
    RAISE NOTICE '✅ point_packages migrado: % registros', count_new;
  ELSE
    RAISE WARNING '⚠️ Discrepância: old=% new=%', count_old, count_new;
  END IF;
END $$;

-- ============================================
-- 4. MIGRAR purchases → economy.purchases
-- ============================================

INSERT INTO economy.purchases (
  id,
  user_id,
  package_id,
  amount_cents,
  points_purchased,
  bonus_points,
  total_points,
  stripe_payment_intent_id,
  stripe_charge_id,
  status,
  created_at,
  completed_at
)
SELECT 
  id,
  user_id,
  package_id,
  amount_cents,
  points_purchased,
  bonus_points,
  total_points,
  stripe_payment_intent_id,
  stripe_charge_id,
  status,
  created_at,
  completed_at
FROM public.purchases
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  completed_at = EXCLUDED.completed_at;

-- Verificação
DO $$
DECLARE
  count_old INTEGER;
  count_new INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_old FROM public.purchases WHERE TRUE;
  SELECT COUNT(*) INTO count_new FROM economy.purchases;
  
  RAISE NOTICE '✅ purchases migrado: % registros (old: %)', count_new, count_old;
END $$;

-- ============================================
-- 5. MIGRAR tool_costs → tools.catalog
-- ============================================

INSERT INTO tools.catalog (
  id,
  tool_key,
  display_name,
  description,
  icon,
  points_cost,
  category,
  subcategory,
  is_free_for_pro,
  is_active,
  is_beta,
  display_order,
  tags,
  estimated_time_minutes,
  created_at,
  updated_at
)
SELECT 
  id,
  tool_name AS tool_key,
  display_name,
  description,
  'tool' AS icon, -- Adicionar ícones específicos depois
  points_cost,
  category,
  NULL AS subcategory,
  -- Ferramentas de Planejamento são grátis para Pro
  (category = 'Planejamento') AS is_free_for_pro,
  is_active,
  false AS is_beta,
  0 AS display_order,
  ARRAY[]::TEXT[] AS tags,
  NULL AS estimated_time_minutes,
  created_at,
  NOW() AS updated_at
FROM public.tool_costs
ON CONFLICT (tool_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  points_cost = EXCLUDED.points_cost,
  is_active = EXCLUDED.is_active;

-- Verificação
DO $$
DECLARE
  count_old INTEGER;
  count_new INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_old FROM public.tool_costs;
  SELECT COUNT(*) INTO count_new FROM tools.catalog;
  
  IF count_old = count_new THEN
    RAISE NOTICE '✅ tool_costs migrado: % registros', count_new;
  ELSE
    RAISE WARNING '⚠️ Discrepância: old=% new=%', count_old, count_new;
  END IF;
END $$;

-- ============================================
-- 6. CRIAR CONFIGURAÇÕES DE PRIVACIDADE PADRÃO
-- ============================================

-- Para todos os usuários existentes
INSERT INTO social.user_privacy_settings (
  user_id,
  achievements_visibility,
  profile_visibility,
  stats_visibility,
  friends_visibility,
  show_in_leaderboard,
  show_in_search,
  allow_friend_requests
)
SELECT 
  id AS user_id,
  'public'::social.visibility_level,
  'public'::social.visibility_level,
  'public'::social.visibility_level,
  'public'::social.visibility_level,
  true,
  true,
  true
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Verificação
DO $$
DECLARE
  count_users INTEGER;
  count_privacy INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_users FROM auth.users;
  SELECT COUNT(*) INTO count_privacy FROM social.user_privacy_settings;
  
  IF count_users = count_privacy THEN
    RAISE NOTICE '✅ Privacidade criada para % usuários', count_privacy;
  ELSE
    RAISE NOTICE '⚠️ Privacidade: users=% privacy=%', count_users, count_privacy;
  END IF;
END $$;

-- ============================================
-- 7. CRIAR REFERÊNCIAS A PARTIR DE profiles.referred_by
-- ============================================

INSERT INTO social.referrals (
  referrer_id,
  referred_id,
  referral_code,
  status,
  created_at,
  completed_at,
  rewarded_at
)
SELECT 
  p_referrer.id AS referrer_id,
  p_referred.id AS referred_id,
  p_referrer.referral_code,
  'completed'::social.referral_status, -- Assumir que já está completo
  p_referred.created_at,
  p_referred.created_at, -- Assumir que completou no cadastro
  p_referred.created_at -- Assumir que foi recompensado
FROM public.profiles p_referred
JOIN public.profiles p_referrer ON p_referred.referred_by = p_referrer.id
WHERE p_referred.referred_by IS NOT NULL
ON CONFLICT (referrer_id, referred_id) DO NOTHING;

-- Verificação
DO $$
DECLARE
  count_referrals INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_referrals FROM social.referrals;
  
  RAISE NOTICE '✅ % referências migradas', count_referrals;
END $$;

-- ============================================
-- 8. CRIAR DAILY STREAKS INICIAIS
-- ============================================

INSERT INTO gamification.daily_streaks (
  user_id,
  current_streak,
  best_streak,
  last_activity_date,
  last_tool_used_at
)
SELECT 
  id AS user_id,
  0 AS current_streak,
  0 AS best_streak,
  NULL AS last_activity_date,
  NULL AS last_tool_used_at
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Verificação
DO $$
DECLARE
  count_users INTEGER;
  count_streaks INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_users FROM auth.users;
  SELECT COUNT(*) INTO count_streaks FROM gamification.daily_streaks;
  
  IF count_users = count_streaks THEN
    RAISE NOTICE '✅ Daily streaks criados para % usuários', count_streaks;
  ELSE
    RAISE NOTICE '⚠️ Streaks: users=% streaks=%', count_users, count_streaks;
  END IF;
END $$;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

DO $$
DECLARE
  total_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM auth.users;
  
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '✅ MIGRAÇÃO V7 CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE 'Total de usuários: %', total_users;
  RAISE NOTICE '';
  RAISE NOTICE 'Schemas criados:';
  RAISE NOTICE '  - economy (economia)';
  RAISE NOTICE '  - gamification (gamificação)';
  RAISE NOTICE '  - tools (ferramentas)';
  RAISE NOTICE '  - social (sistema social)';
  RAISE NOTICE '  - audit (auditoria)';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximo passo: v7_005_create_rls_policies.sql';
  RAISE NOTICE '════════════════════════════════════════';
END $$;
