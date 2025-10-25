-- ========================================
-- CONFIGURAR TABELAS DE ASSINATURA - V7
-- ========================================
-- As tabelas já existem, vamos apenas configurar permissões e popular

-- ========================================
-- 1. CONCEDER PERMISSÕES SERVICE_ROLE
-- ========================================
GRANT ALL ON TABLE public.subscription_plans TO service_role;
GRANT ALL ON TABLE public.subscriptions TO service_role;

-- ========================================
-- 2. CONFIGURAR RLS (se ainda não estiver)
-- ========================================

-- SUBSCRIPTION_PLANS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_view_active_plans" ON public.subscription_plans;
CREATE POLICY "anyone_view_active_plans"
  ON public.subscription_plans FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "service_manage_plans" ON public.subscription_plans;
CREATE POLICY "service_manage_plans"
  ON public.subscription_plans FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- SUBSCRIPTIONS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_view_own_subscription" ON public.subscriptions;
CREATE POLICY "users_view_own_subscription"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "service_manage_subscriptions" ON public.subscriptions;
CREATE POLICY "service_manage_subscriptions"
  ON public.subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ========================================
-- 3. SEED: PLANO PRO
-- ========================================
INSERT INTO public.subscription_plans (
  name,
  slug,
  description,
  price_brl,
  billing_period,
  features,
  is_active,
  display_order
) VALUES (
  'Pro',
  'pro',
  'Acesso completo a todas as ferramentas de planejamento + mesada semanal de 100 créditos',
  89.10,
  'monthly',
  '[
    "Ferramentas de Planejamento GRATUITAS",
    "100 créditos SEMANAIS",
    "Suporte prioritário",
    "Sem limites de uso em planejamento",
    "Acesso a novas features primeiro"
  ]'::jsonb,
  true,
  1
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_brl = EXCLUDED.price_brl,
  features = EXCLUDED.features,
  updated_at = NOW();

-- ========================================
-- 4. NOTIFICAR POSTGREST
-- ========================================
NOTIFY pgrst, 'reload schema';

-- ========================================
-- 5. VERIFICAÇÃO
-- ========================================
SELECT 
  'subscription_plans' as table_name,
  COUNT(*) as total_plans,
  COUNT(*) FILTER (WHERE is_active = true) as active_plans
FROM public.subscription_plans

UNION ALL

SELECT 
  'subscriptions' as table_name,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'active' AND end_date > NOW()) as active
FROM public.subscriptions;
