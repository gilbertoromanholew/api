-- ============================================================================
-- SCRIPT DE CRIAÇÃO DE TODAS AS TABELAS FALTANTES
-- Data: 25/10/2025
-- Descrição: Cria todas as tabelas descobertas como faltantes na análise
-- ============================================================================

-- ============================================================================
-- SEÇÃO 1: CRIAR TABELAS DE SUBSCRIPTIONS
-- ============================================================================

-- 1.1 Criar tabela subscription_plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  price_brl DECIMAL(10,2) NOT NULL,
  billing_period VARCHAR(20) NOT NULL, -- 'monthly', 'yearly'
  features JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  stripe_price_id VARCHAR(255),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 1.2 Criar índices subscription_plans
CREATE INDEX IF NOT EXISTS idx_subscription_plans_slug ON subscription_plans(slug);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);

-- 1.3 Criar tabela subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'expired'
  start_date TIMESTAMP NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP NOT NULL,
  is_trial BOOLEAN DEFAULT false,
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  canceled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 1.4 Criar índices subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);

-- 1.5 Habilitar RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 1.4 Políticas RLS para subscription_plans
DROP POLICY IF EXISTS "Todos podem ver planos ativos" ON subscription_plans;
CREATE POLICY "Todos podem ver planos ativos"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Service role pode fazer tudo" ON subscription_plans;
CREATE POLICY "Service role pode fazer tudo"
  ON subscription_plans
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 1.5 Políticas RLS para subscriptions
DROP POLICY IF EXISTS "Usuários veem próprias subscriptions" ON subscriptions;
CREATE POLICY "Usuários veem próprias subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role pode fazer tudo subscriptions" ON subscriptions;
CREATE POLICY "Service role pode fazer tudo subscriptions"
  ON subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 1.6 Seed do Plano PRO (se não existir)
INSERT INTO subscription_plans (
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
  'Plano completo com 20 créditos semanais e ferramentas ilimitadas',
  89.10,
  'monthly',
  jsonb_build_object(
    'weekly_bonus_credits', 20,
    'unlimited_tools', true,
    'priority_support', true,
    'advanced_features', true
  ),
  true,
  1
)
ON CONFLICT (slug) DO UPDATE SET
  price_brl = EXCLUDED.price_brl,
  features = EXCLUDED.features,
  updated_at = NOW();

-- ============================================================================
-- SEÇÃO 2: CRIAR TABELAS DE PROMO CODES
-- ============================================================================

-- 2.1 Criar ENUM types se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'promo_code_type') THEN
    CREATE TYPE promo_code_type AS ENUM ('BONUS_CREDITS', 'PRO_TRIAL', 'DISCOUNT', 'REFERRAL');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'promo_code_status') THEN
    CREATE TYPE promo_code_status AS ENUM ('active', 'expired', 'disabled');
  END IF;
END $$;

-- 2.2 Criar tabela promo_codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  type promo_code_type NOT NULL,
  value INTEGER NOT NULL,
  description TEXT,
  expires_at TIMESTAMP,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  status promo_code_status DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2.3 Criar índices
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_status ON promo_codes(status);
CREATE INDEX IF NOT EXISTS idx_promo_codes_type ON promo_codes(type);

-- 2.4 Criar tabela promo_code_redemptions
CREATE TABLE IF NOT EXISTS promo_code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMP DEFAULT NOW(),
  credits_awarded INTEGER DEFAULT 0,
  pro_days_awarded INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'
);

-- 2.5 Criar índices
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_user ON promo_code_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_code ON promo_code_redemptions(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_redeemed_at ON promo_code_redemptions(redeemed_at DESC);

-- 2.6 Criar função de incremento automático
CREATE OR REPLACE FUNCTION increment_promo_code_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE promo_codes 
  SET used_count = used_count + 1, updated_at = NOW()
  WHERE id = NEW.promo_code_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.7 Criar trigger
DROP TRIGGER IF EXISTS trigger_increment_promo_code_usage ON promo_code_redemptions;
CREATE TRIGGER trigger_increment_promo_code_usage
  AFTER INSERT ON promo_code_redemptions
  FOR EACH ROW EXECUTE FUNCTION increment_promo_code_usage();

-- 2.8 Habilitar RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_redemptions ENABLE ROW LEVEL SECURITY;

-- 2.9 Políticas RLS para promo_codes
DROP POLICY IF EXISTS "Todos podem ver promo codes ativos" ON promo_codes;
CREATE POLICY "Todos podem ver promo codes ativos"
  ON promo_codes
  FOR SELECT
  TO authenticated
  USING (status = 'active');

DROP POLICY IF EXISTS "Service role pode fazer tudo promo codes" ON promo_codes;
CREATE POLICY "Service role pode fazer tudo promo codes"
  ON promo_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2.10 Políticas RLS para promo_code_redemptions
DROP POLICY IF EXISTS "Usuários veem próprios resgates" ON promo_code_redemptions;
CREATE POLICY "Usuários veem próprios resgates"
  ON promo_code_redemptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role pode fazer tudo redemptions" ON promo_code_redemptions;
CREATE POLICY "Service role pode fazer tudo redemptions"
  ON promo_code_redemptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2.11 Configurar permissões
GRANT ALL ON TABLE promo_codes TO service_role;
GRANT SELECT ON TABLE promo_codes TO authenticated;
GRANT ALL ON TABLE promo_code_redemptions TO service_role;
GRANT ALL ON TABLE promo_code_redemptions TO authenticated;

-- 2.12 Seeds de promo codes
INSERT INTO promo_codes (code, type, value, description, max_uses) VALUES
  ('BEM-VINDO', 'BONUS_CREDITS', 50, 'Bônus de boas-vindas para novos usuários', NULL),
  ('PROMO2025', 'BONUS_CREDITS', 100, 'Promoção especial 2025', 1000),
  ('PRO30DIAS', 'PRO_TRIAL', 30, 'Teste PRO gratuito por 30 dias', 100)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  updated_at = NOW();

-- ============================================================================
-- SEÇÃO 3: CRIAR TABELAS DE AUDITORIA
-- ============================================================================

-- 3.0 Dropar views existentes (caso existam) ANTES de modificar as tabelas
DROP VIEW IF EXISTS failed_login_attempts_24h CASCADE;
DROP VIEW IF EXISTS suspicious_activities CASCADE;
DROP VIEW IF EXISTS top_rate_limit_violators CASCADE;

-- 3.1 Criar tabela auth_audit_log
CREATE TABLE IF NOT EXISTS auth_audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  country VARCHAR(100),
  city VARCHAR(100),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3.2 Criar índices auth_audit_log
CREATE INDEX IF NOT EXISTS idx_auth_audit_user_id ON auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_created_at ON auth_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_audit_action ON auth_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_auth_audit_ip ON auth_audit_log(ip_address);
CREATE INDEX IF NOT EXISTS idx_auth_audit_success ON auth_audit_log(success) WHERE success = false;

-- 3.3 Criar tabela operations_audit_log
CREATE TABLE IF NOT EXISTS operations_audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  operation VARCHAR(100) NOT NULL,
  resource VARCHAR(255),
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  execution_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3.4 Criar índices operations_audit_log
CREATE INDEX IF NOT EXISTS idx_ops_audit_user_id ON operations_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ops_audit_created_at ON operations_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_audit_operation ON operations_audit_log(operation);
CREATE INDEX IF NOT EXISTS idx_ops_audit_resource ON operations_audit_log(resource);
CREATE INDEX IF NOT EXISTS idx_ops_audit_success ON operations_audit_log(success) WHERE success = false;

-- 3.5 Criar tabela rate_limit_violations
CREATE TABLE IF NOT EXISTS rate_limit_violations (
  id BIGSERIAL PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  endpoint VARCHAR(255) NOT NULL,
  limiter_type VARCHAR(50) NOT NULL,
  attempts INTEGER DEFAULT 1,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3.6 Criar índices rate_limit_violations
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip ON rate_limit_violations(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limit_created_at ON rate_limit_violations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_endpoint ON rate_limit_violations(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limit_user_id ON rate_limit_violations(user_id);

-- 3.7 Criar views de auditoria
CREATE OR REPLACE VIEW failed_login_attempts_24h AS
SELECT 
  user_id,
  COUNT(*) as attempt_count,
  MAX(created_at) as last_attempt,
  array_agg(DISTINCT ip_address) as ip_addresses
FROM auth_audit_log
WHERE 
  action IN ('login', 'register')
  AND success = false
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY user_id
HAVING COUNT(*) >= 3;

CREATE OR REPLACE VIEW suspicious_activities AS
SELECT 
  user_id,
  COUNT(DISTINCT ip_address) as unique_ips,
  COUNT(DISTINCT country) as unique_countries,
  array_agg(DISTINCT ip_address) as ip_addresses,
  MAX(created_at) as last_activity
FROM auth_audit_log
WHERE 
  created_at >= NOW() - INTERVAL '1 hour'
  AND user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(DISTINCT ip_address) > 3;

CREATE OR REPLACE VIEW top_rate_limit_violators AS
SELECT 
  ip_address,
  user_id,
  COUNT(*) as violation_count,
  array_agg(DISTINCT endpoint) as endpoints,
  MAX(created_at) as last_violation
FROM rate_limit_violations
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY ip_address, user_id
HAVING COUNT(*) >= 5
ORDER BY violation_count DESC;

-- 3.8 Criar função de limpeza
DROP FUNCTION IF EXISTS cleanup_old_audit_logs(integer);
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS TABLE(
  auth_deleted BIGINT,
  ops_deleted BIGINT,
  rate_deleted BIGINT
) AS $$
DECLARE
  auth_count BIGINT;
  ops_count BIGINT;
  rate_count BIGINT;
BEGIN
  DELETE FROM auth_audit_log WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  GET DIAGNOSTICS auth_count = ROW_COUNT;
  
  DELETE FROM operations_audit_log WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  GET DIAGNOSTICS ops_count = ROW_COUNT;
  
  DELETE FROM rate_limit_violations WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  GET DIAGNOSTICS rate_count = ROW_COUNT;
  
  RETURN QUERY SELECT auth_count, ops_count, rate_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.9 Habilitar RLS
ALTER TABLE auth_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_violations ENABLE ROW LEVEL SECURITY;

-- 3.10 Políticas RLS auth_audit_log
DROP POLICY IF EXISTS "Usuários veem próprios logs de auth" ON auth_audit_log;
CREATE POLICY "Usuários veem próprios logs de auth"
  ON auth_audit_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role pode fazer tudo auth_audit" ON auth_audit_log;
CREATE POLICY "Service role pode fazer tudo auth_audit"
  ON auth_audit_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3.11 Políticas RLS operations_audit_log
DROP POLICY IF EXISTS "Usuários veem próprias operações" ON operations_audit_log;
CREATE POLICY "Usuários veem próprias operações"
  ON operations_audit_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role pode fazer tudo ops_audit" ON operations_audit_log;
CREATE POLICY "Service role pode fazer tudo ops_audit"
  ON operations_audit_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3.12 Políticas RLS rate_limit_violations
DROP POLICY IF EXISTS "Usuários veem próprias violações" ON rate_limit_violations;
CREATE POLICY "Usuários veem próprias violações"
  ON rate_limit_violations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role pode fazer tudo rate_limit" ON rate_limit_violations;
CREATE POLICY "Service role pode fazer tudo rate_limit"
  ON rate_limit_violations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3.13 Configurar permissões
GRANT ALL ON TABLE auth_audit_log TO service_role;
GRANT SELECT ON TABLE auth_audit_log TO authenticated;
GRANT ALL ON TABLE operations_audit_log TO service_role;
GRANT SELECT ON TABLE operations_audit_log TO authenticated;
GRANT ALL ON TABLE rate_limit_violations TO service_role;
GRANT SELECT ON TABLE rate_limit_violations TO authenticated;

-- ============================================================================
-- SEÇÃO 4: CRIAR TABELA OTP_CODES
-- ============================================================================

-- 4.1 Criar tabela otp_codes
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'email_verification', 'password_reset'
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4.2 Criar índices
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_id ON otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_code ON otp_codes(code);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);

-- 4.3 Habilitar RLS
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- 4.4 Políticas RLS
DROP POLICY IF EXISTS "Service role pode fazer tudo otp" ON otp_codes;
CREATE POLICY "Service role pode fazer tudo otp"
  ON otp_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4.5 Configurar permissões
GRANT ALL ON TABLE otp_codes TO service_role;

-- ============================================================================
-- SEÇÃO 5: RECARREGAR SCHEMA DO POSTGRESTS
-- ============================================================================

NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- SEÇÃO 6: VERIFICAÇÃO FINAL
-- ============================================================================

DO $$
DECLARE
  table_count INTEGER;
BEGIN
  -- Contar tabelas criadas/configuradas
  SELECT COUNT(*) INTO table_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN (
      'subscription_plans',
      'subscriptions',
      'promo_codes',
      'promo_code_redemptions',
      'auth_audit_log',
      'operations_audit_log',
      'rate_limit_violations',
      'otp_codes'
    );
  
  RAISE NOTICE '✅ Total de tabelas criadas/configuradas: %', table_count;
  
  IF table_count = 8 THEN
    RAISE NOTICE '✅ TODAS as 8 tabelas foram criadas/configuradas com sucesso!';
  ELSE
    RAISE WARNING '⚠️ Esperado: 8 tabelas | Encontrado: %', table_count;
  END IF;
  
  -- Verificar permissões
  RAISE NOTICE '';
  RAISE NOTICE '📋 Verificando permissões...';
  
  -- Verificar promo_codes
  SELECT COUNT(*) INTO table_count FROM promo_codes;
  RAISE NOTICE '  - promo_codes: % códigos cadastrados', table_count;
  
  -- Verificar subscription_plans
  SELECT COUNT(*) INTO table_count FROM subscription_plans;
  RAISE NOTICE '  - subscription_plans: % planos cadastrados', table_count;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Script executado com sucesso!';
  RAISE NOTICE '⚠️ Aguarde 5-10 segundos para o PostgREST atualizar o cache.';
END $$;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
