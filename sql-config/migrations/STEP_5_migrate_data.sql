-- ============================================
-- ⚠️ PASSO 5: MIGRAR DADOS (CRÍTICO!)
-- ============================================
-- Execute no SQL Editor (https://mpanel.samm.host)
-- Tempo estimado: 3-5 minutos
-- ============================================
-- ⚠️ ESTE SCRIPT MIGRA SEUS DADOS REAIS!
-- Certifique-se de ter feito backup se necessário
-- ============================================

-- ============================================
-- 0️⃣ VERIFICAR SE ENUMs EXISTEM (se não, criar)
-- ============================================

DO $$
BEGIN
  -- Verificar e criar economy.transaction_type se não existir
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'economy')) THEN
    CREATE TYPE economy.transaction_type AS ENUM ('credit', 'debit', 'refund', 'transfer', 'adjustment');
    RAISE NOTICE '✅ ENUM economy.transaction_type criado';
  END IF;
  
  -- Verificar e criar economy.point_type se não existir
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'point_type' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'economy')) THEN
    CREATE TYPE economy.point_type AS ENUM ('bonus', 'purchased');
    RAISE NOTICE '✅ ENUM economy.point_type criado';
  END IF;
  
  -- Verificar e criar economy.subscription_status se não existir
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'economy')) THEN
    CREATE TYPE economy.subscription_status AS ENUM ('active', 'canceled', 'expired', 'paused');
    RAISE NOTICE '✅ ENUM economy.subscription_status criado';
  END IF;
  
  -- Verificar e criar economy.purchase_status se não existir
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'purchase_status' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'economy')) THEN
    CREATE TYPE economy.purchase_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'refunded');
    RAISE NOTICE '✅ ENUM economy.purchase_status criado';
  END IF;
  
  RAISE NOTICE '✅ Todos os ENUMs verificados/criados';
END $$;

-- ============================================
-- 1️⃣ MIGRAR CARTEIRA (user_points → user_wallets)
-- ============================================

DO $$
DECLARE
  v_count_old INTEGER;
  v_count_new INTEGER;
BEGIN
  -- Contar registros na tabela antiga
  SELECT COUNT(*) INTO v_count_old FROM public.user_points;
  
  -- Migrar dados
  INSERT INTO economy.user_wallets (
    user_id,
    bonus_credits,
    purchased_points,
    total_earned_bonus,
    total_purchased,
    total_spent,
    created_at,
    updated_at
  )
  SELECT 
    user_id,
    COALESCE(free_points, 0),           -- free_points → bonus_credits
    COALESCE(paid_points, 0),           -- paid_points → purchased_points
    COALESCE(total_earned, 0),
    COALESCE(total_purchased, 0),
    COALESCE(total_spent, 0),
    created_at,
    updated_at
  FROM public.user_points
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Contar registros na tabela nova
  SELECT COUNT(*) INTO v_count_new FROM economy.user_wallets;
  
  -- Verificar migração
  RAISE NOTICE '✅ Carteiras migradas: % → %', v_count_old, v_count_new;
  
  IF v_count_old != v_count_new THEN
    RAISE EXCEPTION '❌ ERRO: Contagem diferente! old=% new=%', v_count_old, v_count_new;
  END IF;
END $$;

-- ============================================
-- 2️⃣ MIGRAR TRANSAÇÕES (point_transactions → transactions)
-- ============================================

DO $$
DECLARE
  v_count_old INTEGER;
  v_count_new INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count_old FROM public.point_transactions;
  
  INSERT INTO economy.transactions (
    id,
    user_id,
    type,
    point_type,
    amount,
    balance_before,
    balance_after,
    description,
    metadata,
    created_at
  )
  SELECT 
    id,
    user_id,
    -- Converter tipo OLD (point_transaction_type) → NEW (transaction_type)
    CASE 
      -- Entradas (créditos)
      WHEN type::text = 'signup_bonus' THEN 'credit'::economy.transaction_type
      WHEN type::text = 'referral_bonus' THEN 'credit'::economy.transaction_type
      WHEN type::text = 'purchase' THEN 'credit'::economy.transaction_type
      
      -- Saídas (débitos)
      WHEN type::text = 'tool_usage' THEN 'debit'::economy.transaction_type
      
      -- Ajustes
      WHEN type::text = 'admin_adjustment' THEN 'adjustment'::economy.transaction_type
      
      -- Reembolsos
      WHEN type::text = 'refund' THEN 'refund'::economy.transaction_type
      
      -- Fallback
      ELSE 'adjustment'::economy.transaction_type
    END,
    -- Converter ponto (free→bonus, paid→purchased)
    CASE 
      WHEN point_type::text = 'free' THEN 'bonus'::economy.point_type
      WHEN point_type::text = 'paid' THEN 'purchased'::economy.point_type
      ELSE 'bonus'::economy.point_type
    END,
    amount,
    balance_before,
    balance_after,
    description,
    '{}'::jsonb,  -- metadata vazio (tabela antiga não tem)
    created_at
  FROM public.point_transactions
  ON CONFLICT (id) DO NOTHING;
  
  SELECT COUNT(*) INTO v_count_new FROM economy.transactions;
  
  RAISE NOTICE '✅ Transações migradas: % → %', v_count_old, v_count_new;
  
  IF v_count_old != v_count_new THEN
    RAISE EXCEPTION '❌ ERRO: Contagem diferente! old=% new=%', v_count_old, v_count_new;
  END IF;
END $$;

-- ============================================
-- 3️⃣ MIGRAR PACOTES (point_packages → point_packages)
-- ============================================

DO $$
DECLARE
  v_count_old INTEGER;
  v_count_new INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count_old FROM public.point_packages;
  
  INSERT INTO economy.point_packages (
    id,
    name,
    description,
    points,
    price_brl,
    bonus_percentage,
    is_active,
    display_order,
    created_at
  )
  SELECT 
    id,
    name,
    description,
    points,
    price_cents / 100.0,  -- converter centavos → reais
    bonus_percentage,
    is_active,
    display_order,
    created_at
  FROM public.point_packages
  ON CONFLICT (id) DO NOTHING;
  
  SELECT COUNT(*) INTO v_count_new FROM economy.point_packages;
  
  RAISE NOTICE '✅ Pacotes migrados: % → %', v_count_old, v_count_new;
  
  IF v_count_old != v_count_new THEN
    RAISE EXCEPTION '❌ ERRO: Contagem diferente! old=% new=%', v_count_old, v_count_new;
  END IF;
END $$;

-- ============================================
-- 4️⃣ MIGRAR FERRAMENTAS (tool_costs → catalog)
-- ============================================

DO $$
DECLARE
  v_count_old INTEGER;
  v_count_new INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count_old FROM public.tool_costs;
  
  INSERT INTO tools.catalog (
    id,
    name,
    slug,
    description,
    category,
    cost_in_points,
    is_free_for_pro,
    is_active,
    created_at
  )
  SELECT 
    id,
    tool_name,
    -- Gerar slug a partir do tool_name (lowercase, sem espaços)
    LOWER(REPLACE(REPLACE(REPLACE(REPLACE(tool_name, ' ', '-'), 'ã', 'a'), 'ç', 'c'), 'é', 'e')),
    description,
    category,
    points_cost,  -- Nome correto da coluna
    -- Ferramentas de planejamento são grátis para Pro
    CASE 
      WHEN category = 'planejamento' THEN true
      ELSE false
    END,
    is_active,
    created_at
  FROM public.tool_costs
  ON CONFLICT (id) DO NOTHING;
  
  SELECT COUNT(*) INTO v_count_new FROM tools.catalog;
  
  RAISE NOTICE '✅ Ferramentas migradas: % → %', v_count_old, v_count_new;
  
  IF v_count_old != v_count_new THEN
    RAISE EXCEPTION '❌ ERRO: Contagem diferente! old=% new=%', v_count_old, v_count_new;
  END IF;
END $$;

-- ============================================
-- 5️⃣ MIGRAR COMPRAS (purchases → purchases)
-- ============================================

DO $$
DECLARE
  v_count_old INTEGER;
  v_count_new INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count_old FROM public.purchases;
  
  -- Só migrar se houver compras
  IF v_count_old > 0 THEN
    INSERT INTO economy.purchases (
      id,
      user_id,
      package_id,
      status,
      points_amount,
      price_paid_brl,
      payment_method,
      stripe_payment_intent_id,
      processed_at,
      metadata,
      created_at
    )
    SELECT 
      id,
      user_id,
      package_id,
      -- Converter status
      CASE 
        WHEN status = 'pending' THEN 'pending'::economy.purchase_status
        WHEN status = 'processing' THEN 'processing'::economy.purchase_status
        WHEN status = 'succeeded' THEN 'succeeded'::economy.purchase_status
        WHEN status = 'failed' THEN 'failed'::economy.purchase_status
        WHEN status = 'refunded' THEN 'refunded'::economy.purchase_status
        ELSE 'pending'::economy.purchase_status
      END,
      points_amount,
      price_paid_cents / 100.0,  -- converter centavos → reais
      payment_method,
      stripe_payment_intent_id,
      processed_at,
      '{}'::jsonb,  -- metadata vazio (tabela antiga não tem)
      created_at
    FROM public.purchases
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  SELECT COUNT(*) INTO v_count_new FROM economy.purchases;
  
  RAISE NOTICE '✅ Compras migradas: % → %', v_count_old, v_count_new;
  
  IF v_count_old != v_count_new THEN
    RAISE EXCEPTION '❌ ERRO: Contagem diferente! old=% new=%', v_count_old, v_count_new;
  END IF;
END $$;

-- ============================================
-- 6️⃣ CRIAR CONFIGURAÇÕES PADRÃO (user_privacy_settings)
-- ============================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO social.user_privacy_settings (
    user_id,
    profile_visibility,
    achievements_visibility,
    leaderboard_visibility,
    activity_visibility,
    allow_friend_requests
  )
  SELECT 
    id,
    'public'::social.visibility_level,
    'public'::social.visibility_level,
    'public'::social.visibility_level,
    'friends_only'::social.visibility_level,
    true
  FROM auth.users
  WHERE id NOT IN (SELECT user_id FROM social.user_privacy_settings);
  
  SELECT COUNT(*) INTO v_count FROM social.user_privacy_settings;
  
  RAISE NOTICE '✅ Configurações de privacidade criadas: %', v_count;
END $$;

-- ============================================
-- 7️⃣ CRIAR STREAKS INICIAIS (daily_streaks)
-- ============================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO gamification.daily_streaks (
    user_id,
    current_streak,
    longest_streak,
    last_activity_date
  )
  SELECT 
    id,
    0,
    0,
    NULL
  FROM auth.users
  WHERE id NOT IN (SELECT user_id FROM gamification.daily_streaks);
  
  SELECT COUNT(*) INTO v_count FROM gamification.daily_streaks;
  
  RAISE NOTICE '✅ Streaks inicializados: %', v_count;
END $$;

-- ============================================
-- 8️⃣ CRIAR REFERÊNCIAS (referrals) A PARTIR DE profiles.referred_by
-- ============================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO social.referrals (
    referrer_id,
    referred_id,
    referred_at,
    reward_granted
  )
  SELECT 
    p.referred_by,
    p.id,
    COALESCE(p.updated_at, NOW()),  -- usar updated_at ou data atual
    false  -- não concedeu recompensa ainda
  FROM public.profiles p
  WHERE p.referred_by IS NOT NULL
    AND p.referred_by IN (SELECT id FROM auth.users)
    AND p.id NOT IN (SELECT referred_id FROM social.referrals);
  
  SELECT COUNT(*) INTO v_count FROM social.referrals;
  
  RAISE NOTICE '✅ Referências migradas: %', v_count;
END $$;

-- ============================================
-- ✅ VERIFICAÇÃO FINAL
-- ============================================

SELECT 
  'OLD → NEW' as tipo,
  '1. user_points → user_wallets' as migracao,
  (SELECT COUNT(*) FROM public.user_points)::text as old_count,
  (SELECT COUNT(*) FROM economy.user_wallets)::text as new_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.user_points) = (SELECT COUNT(*) FROM economy.user_wallets)
    THEN '✅ OK'
    ELSE '❌ ERRO'
  END as status

UNION ALL

SELECT 
  'OLD → NEW',
  '2. point_transactions → transactions',
  (SELECT COUNT(*) FROM public.point_transactions)::text,
  (SELECT COUNT(*) FROM economy.transactions)::text,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.point_transactions) = (SELECT COUNT(*) FROM economy.transactions)
    THEN '✅ OK'
    ELSE '❌ ERRO'
  END

UNION ALL

SELECT 
  'OLD → NEW',
  '3. point_packages → point_packages',
  (SELECT COUNT(*) FROM public.point_packages)::text,
  (SELECT COUNT(*) FROM economy.point_packages)::text,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.point_packages) = (SELECT COUNT(*) FROM economy.point_packages)
    THEN '✅ OK'
    ELSE '❌ ERRO'
  END

UNION ALL

SELECT 
  'OLD → NEW',
  '4. tool_costs → catalog',
  (SELECT COUNT(*) FROM public.tool_costs)::text,
  (SELECT COUNT(*) FROM tools.catalog)::text,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.tool_costs) = (SELECT COUNT(*) FROM tools.catalog)
    THEN '✅ OK'
    ELSE '❌ ERRO'
  END

UNION ALL

SELECT 
  'OLD → NEW',
  '5. purchases → purchases',
  (SELECT COUNT(*) FROM public.purchases)::text,
  (SELECT COUNT(*) FROM economy.purchases)::text,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.purchases) = (SELECT COUNT(*) FROM economy.purchases)
    THEN '✅ OK'
    ELSE '❌ ERRO'
  END

UNION ALL

SELECT 
  'NOVOS',
  '6. user_privacy_settings',
  '-',
  (SELECT COUNT(*) FROM social.user_privacy_settings)::text,
  '✅ CRIADO'

UNION ALL

SELECT 
  'NOVOS',
  '7. daily_streaks',
  '-',
  (SELECT COUNT(*) FROM gamification.daily_streaks)::text,
  '✅ CRIADO'

UNION ALL

SELECT 
  'NOVOS',
  '8. referrals',
  (SELECT COUNT(*) FROM public.profiles WHERE referred_by IS NOT NULL)::text || ' (profiles.referred_by)',
  (SELECT COUNT(*) FROM social.referrals)::text,
  '✅ CRIADO';

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- tipo      | migracao                          | old_count | new_count | status
-- ----------|-----------------------------------|-----------|-----------|--------
-- OLD → NEW | 1. user_points → user_wallets     | 1         | 1         | ✅ OK
-- OLD → NEW | 2. point_transactions → ...       | 1         | 1         | ✅ OK
-- OLD → NEW | 3. point_packages → ...           | 4         | 4         | ✅ OK
-- OLD → NEW | 4. tool_costs → catalog           | 15        | 15        | ✅ OK
-- OLD → NEW | 5. purchases → purchases          | 0         | 0         | ✅ OK
-- NOVOS     | 6. user_privacy_settings          | -         | 1         | ✅ CRIADO
-- NOVOS     | 7. daily_streaks                  | -         | 1         | ✅ CRIADO
-- NOVOS     | 8. referrals                      | 0 (...)   | 0         | ✅ CRIADO
-- ============================================

-- ✅ Se TODOS mostrarem "✅ OK" ou "✅ CRIADO", prossiga para PASSO 6!
-- ❌ Se algum mostrar "❌ ERRO", NÃO prossiga! Me avise para investigar.
