-- ============================================
-- ✅ PASSO 3: CRIAR TABELAS (Economy + Tools)
-- ============================================
-- Execute no SQL Editor (https://mpanel.samm.host)
-- Tempo estimado: 2-3 minutos
-- ============================================

-- Primeiro, criar ENUMs necessários
CREATE TYPE economy.transaction_type AS ENUM (
  'credit',           -- Crédito (entrada)
  'debit',            -- Débito (saída)
  'refund',           -- Reembolso
  'transfer',         -- Transferência
  'adjustment'        -- Ajuste manual
);

CREATE TYPE economy.point_type AS ENUM (
  'bonus',            -- Créditos Bônus (gratuitos)
  'purchased'         -- Pontos Comprados (pagos)
);

CREATE TYPE economy.subscription_status AS ENUM (
  'active',           -- Ativa
  'canceled',         -- Cancelada
  'expired',          -- Expirada
  'paused'            -- Pausada
);

CREATE TYPE economy.purchase_status AS ENUM (
  'pending',          -- Pendente
  'processing',       -- Processando
  'succeeded',        -- Concluída
  'failed',           -- Falhou
  'refunded'          -- Reembolsada
);

-- ============================================
-- TABELAS: ECONOMY
-- ============================================

-- 1. Carteira de Pontos
CREATE TABLE economy.user_wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  bonus_credits INTEGER DEFAULT 0 CHECK (bonus_credits >= 0),
  purchased_points INTEGER DEFAULT 0 CHECK (purchased_points >= 0),
  
  total_earned_bonus INTEGER DEFAULT 0 CHECK (total_earned_bonus >= 0),
  total_purchased INTEGER DEFAULT 0 CHECK (total_purchased >= 0),
  total_spent INTEGER DEFAULT 0 CHECK (total_spent >= 0),
  
  pro_weekly_allowance INTEGER DEFAULT 20,
  last_allowance_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallets_user ON economy.user_wallets(user_id);
COMMENT ON TABLE economy.user_wallets IS '💰 Carteira de pontos e créditos dos usuários';

-- 2. Transações
CREATE TABLE economy.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  type economy.transaction_type NOT NULL,
  point_type economy.point_type NOT NULL,
  
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON economy.transactions(user_id);
CREATE INDEX idx_transactions_type ON economy.transactions(type);
CREATE INDEX idx_transactions_created ON economy.transactions(created_at DESC);
COMMENT ON TABLE economy.transactions IS '📊 Histórico de transações de pontos';

-- 3. Planos de Assinatura
CREATE TABLE economy.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  
  price_brl DECIMAL(10,2) NOT NULL,
  billing_period VARCHAR(20) DEFAULT 'monthly',
  
  features JSONB DEFAULT '[]',
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE economy.subscription_plans IS '📋 Planos de assinatura disponíveis';

-- 4. Assinaturas de Usuários
CREATE TABLE economy.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES economy.subscription_plans(id),
  
  status economy.subscription_status DEFAULT 'active',
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  
  stripe_subscription_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON economy.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON economy.subscriptions(status);
COMMENT ON TABLE economy.subscriptions IS '👑 Assinaturas Pro dos usuários';

-- 5. Pacotes de Pontos
CREATE TABLE economy.point_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  points INTEGER NOT NULL CHECK (points > 0),
  price_brl DECIMAL(10,2) NOT NULL CHECK (price_brl > 0),
  
  bonus_percentage INTEGER DEFAULT 0 CHECK (bonus_percentage >= 0),
  
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_packages_active ON economy.point_packages(is_active, display_order);
COMMENT ON TABLE economy.point_packages IS '💎 Pacotes de pontos para venda';

-- 6. Compras
CREATE TABLE economy.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES economy.point_packages(id),
  
  status economy.purchase_status DEFAULT 'pending',
  
  points_amount INTEGER NOT NULL,
  price_paid_brl DECIMAL(10,2) NOT NULL,
  
  payment_method VARCHAR(50),
  stripe_payment_intent_id VARCHAR(255),
  
  processed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchases_user ON economy.purchases(user_id);
CREATE INDEX idx_purchases_status ON economy.purchases(status);
COMMENT ON TABLE economy.purchases IS '🛒 Histórico de compras de pontos';

-- 7. Recompensas de Referência
CREATE TABLE economy.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  reward_amount INTEGER NOT NULL,
  reward_type economy.point_type DEFAULT 'bonus',
  
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  transaction_id UUID REFERENCES economy.transactions(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referral_rewards_referrer ON economy.referral_rewards(referrer_id);
COMMENT ON TABLE economy.referral_rewards IS '🎁 Recompensas por indicação de usuários';

-- ============================================
-- TABELAS: TOOLS
-- ============================================

-- 1. Catálogo de Ferramentas
CREATE TABLE tools.catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(50),
  
  cost_in_points INTEGER NOT NULL DEFAULT 0,
  is_free_for_pro BOOLEAN DEFAULT false,
  
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_catalog_active ON tools.catalog(is_active, display_order);
CREATE INDEX idx_catalog_category ON tools.catalog(category);
COMMENT ON TABLE tools.catalog IS '🔧 Catálogo de ferramentas disponíveis';

-- 2. Execuções de Ferramentas
CREATE TABLE tools.executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES tools.catalog(id),
  
  points_used INTEGER NOT NULL DEFAULT 0,
  point_type_used economy.point_type,
  
  input_data JSONB,
  output_data JSONB,
  
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_executions_user ON tools.executions(user_id);
CREATE INDEX idx_executions_tool ON tools.executions(tool_id);
CREATE INDEX idx_executions_date ON tools.executions(executed_at DESC);
COMMENT ON TABLE tools.executions IS '📈 Histórico de execuções de ferramentas';

-- 3. Ferramentas Favoritas
CREATE TABLE tools.user_favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES tools.catalog(id) ON DELETE CASCADE,
  
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (user_id, tool_id)
);

CREATE INDEX idx_favorites_user ON tools.user_favorites(user_id);
COMMENT ON TABLE tools.user_favorites IS '⭐ Ferramentas favoritas dos usuários';

-- ============================================
-- ✅ VERIFICAÇÃO
-- ============================================

SELECT 
  schemaname as schema,
  COUNT(*) as total_tabelas
FROM pg_tables 
WHERE schemaname IN ('economy', 'tools')
GROUP BY schemaname
ORDER BY schemaname;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- schema   | total_tabelas
-- ---------|-------------
-- economy  | 7
-- tools    | 3
--
-- Total: 10 tabelas criadas
-- ============================================

-- ✅ Se mostrar "economy: 7" e "tools: 3", prossiga para PASSO 4!
