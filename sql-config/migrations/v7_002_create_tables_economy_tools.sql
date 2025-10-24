-- ============================================
-- MIGRAÇÃO V7 - PARTE 2: CRIAR TABELAS
-- ============================================
-- Data: 23/10/2025
-- Pré-requisito: v7_001_create_schemas.sql executado
-- ============================================

-- ============================================
-- SCHEMA: ECONOMY (Economia)
-- ============================================

-- 1. Carteira de Pontos (substitui user_points)
CREATE TABLE IF NOT EXISTS economy.user_wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Créditos Bônus (gratuitos)
  bonus_credits INTEGER DEFAULT 0 CHECK (bonus_credits >= 0),
  
  -- Pontos Comprados (pagos)
  purchased_points INTEGER DEFAULT 0 CHECK (purchased_points >= 0),
  
  -- Estatísticas (lifetime)
  total_earned_bonus INTEGER DEFAULT 0 CHECK (total_earned_bonus >= 0),
  total_purchased INTEGER DEFAULT 0 CHECK (total_purchased >= 0),
  total_spent INTEGER DEFAULT 0 CHECK (total_spent >= 0),
  
  -- Mesada Pro
  pro_weekly_allowance INTEGER DEFAULT 20,
  last_allowance_date DATE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallets_user ON economy.user_wallets(user_id);
COMMENT ON TABLE economy.user_wallets IS 'Carteira de pontos e créditos dos usuários';

-- 2. Transações (substitui point_transactions)
CREATE TABLE IF NOT EXISTS economy.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tipo e categoria
  type economy.transaction_type NOT NULL,
  point_type economy.point_type NOT NULL,
  
  -- Valores
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  
  -- Metadata
  description TEXT,
  tool_name TEXT,
  achievement_key TEXT,
  stripe_payment_id TEXT,
  referred_user_id UUID REFERENCES auth.users(id),
  multiplier NUMERIC(3,1) DEFAULT 1.0,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON economy.transactions(user_id);
CREATE INDEX idx_transactions_type ON economy.transactions(type);
CREATE INDEX idx_transactions_created ON economy.transactions(created_at DESC);
CREATE INDEX idx_transactions_tool ON economy.transactions(tool_name) WHERE tool_name IS NOT NULL;
COMMENT ON TABLE economy.transactions IS 'Histórico completo de transações de pontos';

-- 3. Planos de Assinatura
CREATE TABLE IF NOT EXISTS economy.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key TEXT UNIQUE NOT NULL, -- 'pro_monthly', 'pro_yearly'
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Preços
  price_monthly_cents INTEGER,
  price_yearly_cents INTEGER,
  
  -- Benefícios
  unlimited_planning_tools BOOLEAN DEFAULT true,
  weekly_allowance INTEGER DEFAULT 20,
  achievement_multiplier NUMERIC(3,1) DEFAULT 2.1,
  
  -- Stripe
  stripe_product_id TEXT,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_plans_key ON economy.subscription_plans(plan_key);
COMMENT ON TABLE economy.subscription_plans IS 'Planos de assinatura disponíveis';

-- 4. Assinaturas dos Usuários
CREATE TABLE IF NOT EXISTS economy.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES economy.subscription_plans(id),
  
  -- Status
  status economy.subscription_status DEFAULT 'active',
  
  -- Período
  current_period_start DATE NOT NULL,
  current_period_end DATE NOT NULL,
  
  -- Stripe
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  
  -- Cancelamento
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, status) WHERE status = 'active'
);

CREATE INDEX idx_subscriptions_user ON economy.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON economy.subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON economy.subscriptions(current_period_end);
CREATE INDEX idx_subscriptions_stripe ON economy.subscriptions(stripe_subscription_id);
COMMENT ON TABLE economy.subscriptions IS 'Assinaturas Pro ativas e históricas';

-- 5. Pacotes de Pontos (mantém estrutura)
CREATE TABLE IF NOT EXISTS economy.point_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Pontos
  points_amount INTEGER NOT NULL,
  bonus_percentage INTEGER DEFAULT 0,
  total_points INTEGER GENERATED ALWAYS AS (points_amount + (points_amount * bonus_percentage / 100)) STORED,
  
  -- Preço
  price_brl NUMERIC(10,2) NOT NULL,
  
  -- Stripe
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  
  -- Destaque
  is_popular BOOLEAN DEFAULT false,
  is_best_value BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_point_packages_active ON economy.point_packages(is_active, display_order);
COMMENT ON TABLE economy.point_packages IS 'Pacotes de pontos disponíveis para compra';

-- 6. Histórico de Compras
CREATE TABLE IF NOT EXISTS economy.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES economy.point_packages(id),
  
  -- Valores
  amount_cents INTEGER NOT NULL,
  points_purchased INTEGER NOT NULL,
  bonus_points INTEGER DEFAULT 0,
  total_points INTEGER NOT NULL,
  
  -- Stripe
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_purchases_user ON economy.purchases(user_id);
CREATE INDEX idx_purchases_status ON economy.purchases(status);
CREATE INDEX idx_purchases_stripe ON economy.purchases(stripe_payment_intent_id);
COMMENT ON TABLE economy.purchases IS 'Histórico de compras de pontos';

-- 7. Recompensas de Referência
CREATE TABLE IF NOT EXISTS economy.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tipo de recompensa
  reward_type TEXT NOT NULL CHECK (reward_type IN ('signup', 'profile_complete', 'first_purchase', 'milestone')),
  
  -- Valores
  bonus_amount INTEGER NOT NULL,
  multiplier_applied NUMERIC(3,1) DEFAULT 1.0,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(referrer_id, referred_id, reward_type)
);

CREATE INDEX idx_referral_rewards_referrer ON economy.referral_rewards(referrer_id);
CREATE INDEX idx_referral_rewards_referred ON economy.referral_rewards(referred_id);
COMMENT ON TABLE economy.referral_rewards IS 'Recompensas ganhas por indicações';

-- ============================================
-- SCHEMA: TOOLS (Ferramentas)
-- ============================================

-- 1. Catálogo de Ferramentas (substitui tool_costs)
CREATE TABLE IF NOT EXISTS tools.catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  tool_key TEXT UNIQUE NOT NULL, -- 'calc_rescisao', 'planejamento_prev', etc
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  
  -- Custo
  points_cost INTEGER NOT NULL CHECK (points_cost >= 0),
  
  -- Categoria
  category TEXT NOT NULL, -- 'Trabalhista', 'Previdenciário', etc
  subcategory TEXT,
  
  -- Acesso Pro
  is_free_for_pro BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_beta BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  tags TEXT[],
  estimated_time_minutes INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_catalog_key ON tools.catalog(tool_key);
CREATE INDEX idx_catalog_category ON tools.catalog(category);
CREATE INDEX idx_catalog_active ON tools.catalog(is_active);
CREATE INDEX idx_catalog_pro ON tools.catalog(is_free_for_pro);
COMMENT ON TABLE tools.catalog IS 'Catálogo completo de ferramentas da plataforma';

-- 2. Execuções de Ferramentas
CREATE TABLE IF NOT EXISTS tools.executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES tools.catalog(id),
  
  -- Custo
  points_consumed INTEGER NOT NULL,
  was_free_for_pro BOOLEAN DEFAULT false,
  
  -- Performance
  execution_time_ms INTEGER,
  
  -- Status
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'error', 'timeout')),
  error_message TEXT,
  
  -- Metadata
  params JSONB,
  result_summary JSONB,
  
  -- Audit
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_executions_user ON tools.executions(user_id);
CREATE INDEX idx_executions_tool ON tools.executions(tool_id);
CREATE INDEX idx_executions_created ON tools.executions(created_at DESC);
CREATE INDEX idx_executions_user_tool ON tools.executions(user_id, tool_id);
COMMENT ON TABLE tools.executions IS 'Log de todas as execuções de ferramentas';

-- 3. Ferramentas Favoritas
CREATE TABLE IF NOT EXISTS tools.user_favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES tools.catalog(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (user_id, tool_id)
);

CREATE INDEX idx_favorites_user ON tools.user_favorites(user_id, display_order);
COMMENT ON TABLE tools.user_favorites IS 'Ferramentas favoritas de cada usuário';

-- ============================================
-- PRÓXIMA PARTE: v7_003_create_gamification_tables.sql
-- ============================================
