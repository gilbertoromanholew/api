-- ============================================
-- SCHEMA COMPLETO - AJI (Assessora Jurídica Inteligente)
-- Executar no Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. PERFIS DE USUÁRIO
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  referred_by UUID REFERENCES auth.users(id),
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON profiles(cpf);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);

-- ============================================
-- 2. SISTEMA DE PONTOS (Duplo)
-- ============================================
CREATE TABLE IF NOT EXISTS user_points (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Pontos Gratuitos
  free_points INTEGER DEFAULT 0 CHECK (free_points >= 0),
  free_points_limit INTEGER DEFAULT 100,
  
  -- Pontos Pagos
  paid_points INTEGER DEFAULT 0 CHECK (paid_points >= 0),
  
  -- Estatísticas
  total_earned INTEGER DEFAULT 0,
  total_purchased INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. TIPOS DE TRANSAÇÃO
-- ============================================
DO $$ BEGIN
    CREATE TYPE point_transaction_type AS ENUM (
        'signup_bonus',
        'referral_bonus',
        'purchase',
        'tool_usage',
        'admin_adjustment',
        'refund'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 4. HISTÓRICO DE TRANSAÇÕES
-- ============================================
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  type point_transaction_type NOT NULL,
  point_type VARCHAR(10) NOT NULL CHECK (point_type IN ('free', 'paid')),
  amount INTEGER NOT NULL,
  
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  
  description TEXT,
  tool_name VARCHAR(100),
  stripe_payment_id VARCHAR(255),
  referred_user_id UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON point_transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON point_transactions(created_at DESC);

-- ============================================
-- 5. PACOTES DE PONTOS
-- ============================================
CREATE TABLE IF NOT EXISTS point_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  points INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  stripe_price_id VARCHAR(255),
  bonus_percentage INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir pacotes padrão
INSERT INTO point_packages (name, description, points, price_cents, bonus_percentage, display_order, is_active) VALUES
('Pacote Básico', '100 pontos para começar', 100, 1000, 0, 1, true),
('Pacote Médio', '500 pontos + 10% bônus', 500, 4500, 10, 2, true),
('Pacote Premium', '1000 pontos + 20% bônus', 1000, 8000, 20, 3, true),
('Pacote Empresarial', '5000 pontos + 30% bônus', 5000, 35000, 30, 4, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. HISTÓRICO DE COMPRAS
-- ============================================
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES point_packages(id),
  
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_charge_id VARCHAR(255),
  
  amount_cents INTEGER NOT NULL,
  points_purchased INTEGER NOT NULL,
  bonus_points INTEGER DEFAULT 0,
  total_points INTEGER NOT NULL,
  
  status VARCHAR(50) DEFAULT 'pending',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe ON purchases(stripe_payment_intent_id);

-- ============================================
-- 7. CUSTO DAS FERRAMENTAS
-- ============================================
CREATE TABLE IF NOT EXISTS tool_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL CHECK (points_cost >= 0),
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ferramentas iniciais
INSERT INTO tool_costs (tool_name, display_name, points_cost, category, is_active) VALUES
('calculo_rescisao', 'Cálculo de Rescisão', 5, 'trabalhista', true),
('analise_loas', 'Análise LOAS', 10, 'assistencial', true),
('planejamento_previdenciario', 'Planejamento Previdenciário', 15, 'previdenciario', true)
ON CONFLICT (tool_name) DO NOTHING;

-- ============================================
-- 8. TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_points_updated_at ON user_points;
CREATE TRIGGER update_user_points_updated_at 
    BEFORE UPDATE ON user_points
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_packages ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
DROP POLICY IF EXISTS "Usuários podem ver próprio perfil" ON profiles;
CREATE POLICY "Usuários podem ver próprio perfil"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON profiles;
CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Sistema pode inserir perfis" ON profiles;
CREATE POLICY "Sistema pode inserir perfis"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Policies para user_points
DROP POLICY IF EXISTS "Usuários podem ver próprios pontos" ON user_points;
CREATE POLICY "Usuários podem ver próprios pontos"
  ON user_points FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Sistema pode gerenciar pontos" ON user_points;
CREATE POLICY "Sistema pode gerenciar pontos"
  ON user_points FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policies para point_transactions
DROP POLICY IF EXISTS "Usuários podem ver próprias transações" ON point_transactions;
CREATE POLICY "Usuários podem ver próprias transações"
  ON point_transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Sistema pode inserir transações" ON point_transactions;
CREATE POLICY "Sistema pode inserir transações"
  ON point_transactions FOR INSERT
  WITH CHECK (true);

-- Policies para purchases
DROP POLICY IF EXISTS "Usuários podem ver próprias compras" ON purchases;
CREATE POLICY "Usuários podem ver próprias compras"
  ON purchases FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Sistema pode gerenciar compras" ON purchases;
CREATE POLICY "Sistema pode gerenciar compras"
  ON purchases FOR ALL
  USING (true)
  WITH CHECK (true);

-- Tool costs é público
DROP POLICY IF EXISTS "Todos podem ver custos" ON tool_costs;
CREATE POLICY "Todos podem ver custos"
  ON tool_costs FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Packages é público
DROP POLICY IF EXISTS "Todos podem ver pacotes" ON point_packages;
CREATE POLICY "Todos podem ver pacotes"
  ON point_packages FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================
-- 10. FUNÇÕES AUXILIARES
-- ============================================

-- Função para gerar código de referência único
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        -- Gerar código aleatório de 8 caracteres
        code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Verificar se já existe
        SELECT COUNT(*) > 0 INTO exists FROM profiles WHERE referral_code = code;
        
        EXIT WHEN NOT exists;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SUCESSO!
-- ============================================
-- Execute este script no Supabase SQL Editor
-- Todas as tabelas, índices, triggers e policies foram criados
-- ============================================
