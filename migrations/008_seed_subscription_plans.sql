-- ============================================
-- SEED: PLANOS DE ASSINATURA V7
-- ============================================
-- Insere planos iniciais na tabela economy_subscription_plans
-- 
-- PLANOS GAMIFICADOS (PLANEJAMENTO):
-- GRATUITO:
--   1. Planejador (Free) - Sempre gratuito
--
-- PLANEJADOR EXPERT (R$ 97):
--   2. Expert Mensal - R$ 97/mês (recorrente)
--   3. Expert Semanal - R$ 27/semana (recorrente)
--   4. Expert Diária - R$ 7/dia (pagamento único - sem recorrência)
--
-- PLANEJADOR MASTER (R$ 297):
--   5. Master Mensal - R$ 297/mês (recorrente) [INATIVO - EM BREVE]
--   6. Master Semanal - R$ 77/semana (recorrente) [INATIVO - EM BREVE]
--   7. Master Diária - R$ 17/dia (pagamento único) [INATIVO - EM BREVE]
-- ============================================

-- ⚠️ CUIDADO: Limpa dados existentes (não usar em produção com dados reais!)
-- TRUNCATE TABLE economy_subscription_plans CASCADE;

-- ============================================
-- PLANO 1: PLANEJADOR (FREE)
-- ============================================
INSERT INTO economy_subscription_plans (
  slug,
  name,
  description,
  price_brl,
  billing_period,
  features,
  is_active,
  stripe_price_id,
  created_at,
  updated_at
) VALUES (
  'free',
  '📋 Planejador',
  'Comece a planejar seus casos',
  0.00,
  'lifetime',
  '[
    "5 planejamentos por mês",
    "Ferramentas de cálculo básicas",
    "Relatórios simples",
    "Suporte por email"
  ]'::jsonb,
  true,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_brl = EXCLUDED.price_brl,
  billing_period = EXCLUDED.billing_period,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================
-- PLANO 2: PLANEJADOR EXPERT - MENSAL
-- ============================================
INSERT INTO economy_subscription_plans (
  slug,
  name,
  description,
  price_brl,
  billing_period,
  features,
  is_active,
  stripe_price_id,
  created_at,
  updated_at
) VALUES (
  'expert-monthly',
  '⚡ Expert Mensal',
  'Planejamento profissional - Plano mensal',
  97.00,
  'monthly',
  '[
    "Planejamentos ilimitados",
    "Todas as ferramentas profissionais",
    "Relatórios avançados exportáveis",
    "Simulações e projeções complexas",
    "Suporte prioritário",
    "Atualizações exclusivas",
    "Badge Expert no perfil"
  ]'::jsonb,
  true,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_brl = EXCLUDED.price_brl,
  billing_period = EXCLUDED.billing_period,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  stripe_price_id = EXCLUDED.stripe_price_id,
  updated_at = NOW();

-- ============================================
-- PLANO 3: PLANEJADOR EXPERT - SEMANAL
-- ============================================
INSERT INTO economy_subscription_plans (
  slug,
  name,
  description,
  price_brl,
  billing_period,
  features,
  is_active,
  stripe_price_id,
  created_at,
  updated_at
) VALUES (
  'expert-weekly',
  '⚡ Expert Semanal',
  'Planejamento profissional - Plano semanal',
  27.00,
  'weekly',
  '[
    "Planejamentos ilimitados durante 7 dias",
    "Todas as ferramentas profissionais",
    "Relatórios avançados exportáveis",
    "Suporte prioritário",
    "Renovação automática semanal"
  ]'::jsonb,
  true,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_brl = EXCLUDED.price_brl,
  billing_period = EXCLUDED.billing_period,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  stripe_price_id = EXCLUDED.stripe_price_id,
  updated_at = NOW();

-- ============================================
-- PLANO 4: PLANEJADOR EXPERT - DIÁRIA (PAGUE E USE)
-- ============================================
INSERT INTO economy_subscription_plans (
  slug,
  name,
  description,
  price_brl,
  billing_period,
  features,
  is_active,
  stripe_price_id,
  created_at,
  updated_at
) VALUES (
  'expert-daily-onetime',
  '⚡ Expert Diária',
  'Acesso completo por 24h - Pagamento único',
  7.00,
  'daily',
  '[
    "Acesso total por 24 horas",
    "Planejamentos ilimitados",
    "Todas as ferramentas",
    "Sem renovação automática",
    "Pague apenas quando precisar"
  ]'::jsonb,
  true,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_brl = EXCLUDED.price_brl,
  billing_period = EXCLUDED.billing_period,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  stripe_price_id = EXCLUDED.stripe_price_id,
  updated_at = NOW();

-- ============================================
-- PLANO 5: PLANEJADOR MASTER - MENSAL (EM BREVE)
-- ============================================
INSERT INTO economy_subscription_plans (
  slug,
  name,
  description,
  price_brl,
  billing_period,
  features,
  is_active,
  stripe_price_id,
  created_at,
  updated_at
) VALUES (
  'master-monthly',
  '👑 Master Mensal',
  'Planejamento estratégico total - Plano mensal',
  297.00,
  'monthly',
  '[
    "Tudo do plano Expert",
    "API para integrações customizadas",
    "Relatórios personalizados sob medida",
    "Consultoria estratégica especializada",
    "Suporte dedicado 24/7",
    "Treinamentos exclusivos",
    "Badge Master VIP no perfil",
    "Acesso antecipado a novos recursos"
  ]'::jsonb,
  false,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_brl = EXCLUDED.price_brl,
  billing_period = EXCLUDED.billing_period,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================
-- PLANO 6: PLANEJADOR MASTER - SEMANAL (EM BREVE)
-- ============================================
INSERT INTO economy_subscription_plans (
  slug,
  name,
  description,
  price_brl,
  billing_period,
  features,
  is_active,
  stripe_price_id,
  created_at,
  updated_at
) VALUES (
  'master-weekly',
  '👑 Master Semanal',
  'Planejamento estratégico total - Plano semanal',
  77.00,
  'weekly',
  '[
    "Tudo do plano Expert por 7 dias",
    "API para integrações",
    "Relatórios personalizados",
    "Consultoria estratégica",
    "Suporte dedicado",
    "Renovação automática semanal"
  ]'::jsonb,
  false,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_brl = EXCLUDED.price_brl,
  billing_period = EXCLUDED.billing_period,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================
-- PLANO 7: PLANEJADOR MASTER - DIÁRIA (PAGUE E USE) (EM BREVE)
-- ============================================
INSERT INTO economy_subscription_plans (
  slug,
  name,
  description,
  price_brl,
  billing_period,
  features,
  is_active,
  stripe_price_id,
  created_at,
  updated_at
) VALUES (
  'master-daily-onetime',
  '👑 Master Diária',
  'Acesso Master por 24h - Pagamento único',
  17.00,
  'daily',
  '[
    "Acesso total Master por 24 horas",
    "Todas as ferramentas Master",
    "API + Consultoria",
    "Sem renovação automática",
    "Pague apenas quando precisar"
  ]'::jsonb,
  false,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_brl = EXCLUDED.price_brl,
  billing_period = EXCLUDED.billing_period,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================
-- VALIDAÇÃO: Verificar dados inseridos
-- ============================================
SELECT 
  slug,
  name,
  price_brl,
  billing_period,
  is_active,
  features,
  created_at
FROM economy_subscription_plans
ORDER BY 
  CASE 
    WHEN slug = 'free' THEN 1
    WHEN slug LIKE 'expert-%' THEN 2
    WHEN slug LIKE 'master-%' THEN 3
    ELSE 99
  END,
  price_brl DESC;

-- ============================================
-- NOTAS:
-- ============================================
-- 1. ✅ ON CONFLICT garante que pode rodar múltiplas vezes sem duplicar
-- 2. ⚠️ stripe_price_id está NULL - atualizar quando configurar Stripe
-- 3. 🎮 NOMENCLATURA GAMIFICADA (PLANEJAMENTO):
--    📋 Planejador (Free) - R$ 0
--    ⚡ Expert - 3 opções de pagamento (ativas):
--       - Mensal: R$ 97/mês (recorrente)
--       - Semanal: R$ 27/semana (recorrente)
--       - Diária: R$ 7/dia (pague e use - sem recorrência)
--    👑 Master - 3 opções de pagamento (inativas - em breve):
--       - Mensal: R$ 297/mês (recorrente)
--       - Semanal: R$ 77/semana (recorrente)
--       - Diária: R$ 17/dia (pague e use - sem recorrência)
-- 4. 💰 PREÇOS ESTRATÉGICOS:
--    Expert: R$ 97/mês = R$ 27/sem = R$ 7/dia
--    Master: R$ 297/mês = R$ 77/sem = R$ 17/dia
-- 5. 🏆 Badges de status (Planejador, Expert, Master) 
-- 6. 🔄 RENOVAÇÃO:
--    - monthly/weekly = renovação automática
--    - daily = pagamento único, sem renovação
-- 7. ⏳ Para ativar Master: 
--    UPDATE economy_subscription_plans 
--    SET is_active = true 
--    WHERE slug LIKE 'master-%';
-- ============================================

-- DESATIVAR plano "ppp" antigo (se existir):
UPDATE economy_subscription_plans 
SET is_active = false,
    description = 'Plano descontinuado - migrado para Expert Mensal'
WHERE slug = 'ppp';

-- DESATIVAR plano "pro" antigo (se existir):
UPDATE economy_subscription_plans 
SET is_active = false,
    description = 'Plano descontinuado - migrado para Expert Mensal'
WHERE slug = 'pro';

-- DESATIVAR plano "enterprise" antigo (se existir):
UPDATE economy_subscription_plans 
SET is_active = false,
    description = 'Plano descontinuado - migrado para Master Mensal'
WHERE slug = 'enterprise';

-- ATUALIZAR STRIPE PRICE IDs (quando disponível):
-- Expert:
-- UPDATE economy_subscription_plans SET stripe_price_id = 'price_expert_monthly' WHERE slug = 'expert-monthly';
-- UPDATE economy_subscription_plans SET stripe_price_id = 'price_expert_weekly' WHERE slug = 'expert-weekly';
-- UPDATE economy_subscription_plans SET stripe_price_id = 'price_expert_daily_onetime' WHERE slug = 'expert-daily-onetime';
-- Master:
-- UPDATE economy_subscription_plans SET stripe_price_id = 'price_master_monthly' WHERE slug = 'master-monthly';
-- UPDATE economy_subscription_plans SET stripe_price_id = 'price_master_weekly' WHERE slug = 'master-weekly';
-- UPDATE economy_subscription_plans SET stripe_price_id = 'price_master_daily_onetime' WHERE slug = 'master-daily-onetime';

-- DESATIVAR planos recorrentes diários (removidos do sistema):
UPDATE economy_subscription_plans 
SET is_active = false,
    description = 'Plano descontinuado - use Expert Diária (pagamento único)'
WHERE slug = 'expert-daily-recurring';

UPDATE economy_subscription_plans 
SET is_active = false,
    description = 'Plano descontinuado - use Master Diária (pagamento único)'
WHERE slug = 'master-daily-recurring';
