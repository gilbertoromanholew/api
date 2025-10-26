-- ============================================
-- MIGRATION 009: PREPARAR INTEGRAÇÃO STRIPE
-- ============================================
-- Adiciona colunas necessárias para integração com Stripe
-- Executar APÓS configurar conta Stripe
-- ============================================

-- ============================================
-- 1. ADICIONAR COLUNAS STRIPE NA TABELA PROFILES
-- ============================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'canceled', 'past_due', 'trialing')),
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription ON profiles(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);

COMMENT ON COLUMN profiles.stripe_customer_id IS 'ID do cliente no Stripe (cus_xxxxx)';
COMMENT ON COLUMN profiles.stripe_subscription_id IS 'ID da assinatura no Stripe (sub_xxxxx)';
COMMENT ON COLUMN profiles.subscription_status IS 'Status da assinatura: active, inactive, canceled, past_due, trialing';
COMMENT ON COLUMN profiles.subscription_current_period_end IS 'Data de término do período atual de cobrança';

-- ============================================
-- 2. TABELA DE WEBHOOKS STRIPE (LOG)
-- ============================================
CREATE TABLE IF NOT EXISTS stripe_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_event_type ON stripe_webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_processed ON stripe_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_created_at ON stripe_webhooks(created_at DESC);

COMMENT ON TABLE stripe_webhooks IS 'Log de eventos recebidos via Stripe Webhooks';

-- ============================================
-- 3. FUNÇÃO: PROCESSAR WEBHOOK DO STRIPE
-- ============================================
CREATE OR REPLACE FUNCTION process_stripe_webhook(
  p_event_id TEXT,
  p_event_type TEXT,
  p_payload JSONB
) RETURNS JSONB AS $$
DECLARE
  v_customer_id TEXT;
  v_subscription_id TEXT;
  v_subscription_status TEXT;
  v_period_end TIMESTAMPTZ;
  v_plan_id TEXT;
BEGIN
  -- Inserir webhook no log
  INSERT INTO stripe_webhooks (event_id, event_type, payload)
  VALUES (p_event_id, p_event_type, p_payload)
  ON CONFLICT (event_id) DO NOTHING;

  -- Processar baseado no tipo de evento
  CASE p_event_type
    -- Assinatura criada
    WHEN 'customer.subscription.created' THEN
      v_customer_id := p_payload->'data'->'object'->>'customer';
      v_subscription_id := p_payload->'data'->'object'->>'id';
      v_subscription_status := p_payload->'data'->'object'->>'status';
      v_period_end := TO_TIMESTAMP((p_payload->'data'->'object'->>'current_period_end')::BIGINT);
      
      UPDATE profiles
      SET stripe_subscription_id = v_subscription_id,
          subscription_status = v_subscription_status,
          subscription_current_period_end = v_period_end,
          updated_at = NOW()
      WHERE stripe_customer_id = v_customer_id;

    -- Assinatura atualizada
    WHEN 'customer.subscription.updated' THEN
      v_subscription_id := p_payload->'data'->'object'->>'id';
      v_subscription_status := p_payload->'data'->'object'->>'status';
      v_period_end := TO_TIMESTAMP((p_payload->'data'->'object'->>'current_period_end')::BIGINT);
      
      UPDATE profiles
      SET subscription_status = v_subscription_status,
          subscription_current_period_end = v_period_end,
          updated_at = NOW()
      WHERE stripe_subscription_id = v_subscription_id;

    -- Assinatura cancelada
    WHEN 'customer.subscription.deleted' THEN
      v_subscription_id := p_payload->'data'->'object'->>'id';
      
      UPDATE profiles
      SET subscription_status = 'canceled',
          stripe_subscription_id = NULL,
          updated_at = NOW()
      WHERE stripe_subscription_id = v_subscription_id;

    -- Pagamento bem-sucedido
    WHEN 'invoice.payment_succeeded' THEN
      v_customer_id := p_payload->'data'->'object'->>'customer';
      
      -- Atualizar status para active
      UPDATE profiles
      SET subscription_status = 'active',
          updated_at = NOW()
      WHERE stripe_customer_id = v_customer_id;

    -- Pagamento falhou
    WHEN 'invoice.payment_failed' THEN
      v_customer_id := p_payload->'data'->'object'->>'customer';
      
      -- Atualizar status para past_due
      UPDATE profiles
      SET subscription_status = 'past_due',
          updated_at = NOW()
      WHERE stripe_customer_id = v_customer_id;

  END CASE;

  -- Marcar webhook como processado
  UPDATE stripe_webhooks
  SET processed = true,
      processed_at = NOW()
  WHERE event_id = p_event_id;

  RETURN jsonb_build_object(
    'success', true,
    'event_type', p_event_type,
    'processed_at', NOW()
  );

EXCEPTION WHEN OTHERS THEN
  -- Log de erro
  UPDATE stripe_webhooks
  SET error_message = SQLERRM
  WHERE event_id = p_event_id;
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION process_stripe_webhook IS 'Processa eventos recebidos via Stripe Webhooks';

-- ============================================
-- 4. FUNÇÃO: VERIFICAR SE USUÁRIO TEM ASSINATURA ATIVA
-- ============================================
CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_status TEXT;
BEGIN
  SELECT subscription_status INTO v_status
  FROM profiles
  WHERE id = p_user_id;
  
  RETURN v_status IN ('active', 'trialing');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION has_active_subscription IS 'Verifica se usuário tem assinatura ativa (active ou trialing)';

-- ============================================
-- 5. VIEW: RESUMO DE ASSINATURAS ATIVAS
-- ============================================
CREATE OR REPLACE VIEW v_active_subscriptions AS
SELECT 
  p.id as user_id,
  p.name,
  p.email,
  p.cpf,
  p.subscription_status,
  p.stripe_customer_id,
  p.stripe_subscription_id,
  p.subscription_current_period_end,
  CASE 
    WHEN p.subscription_current_period_end < NOW() THEN true
    ELSE false
  END as is_expired,
  DATE_PART('day', p.subscription_current_period_end - NOW()) as days_remaining
FROM profiles p
WHERE p.subscription_status IN ('active', 'trialing', 'past_due')
ORDER BY p.subscription_current_period_end ASC;

COMMENT ON VIEW v_active_subscriptions IS 'Resumo de todas as assinaturas ativas e seus status';

-- ============================================
-- 6. POLÍTICA DE SEGURANÇA (RLS)
-- ============================================
-- Stripe webhooks só podem ser inseridos via função SECURITY DEFINER
ALTER TABLE stripe_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Webhooks são públicos apenas para leitura via service role"
  ON stripe_webhooks
  FOR SELECT
  USING (auth.role() = 'service_role');

-- ============================================
-- VALIDAÇÃO
-- ============================================
-- Verificar colunas adicionadas
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name IN ('stripe_customer_id', 'stripe_subscription_id', 'subscription_status', 'subscription_current_period_end')
ORDER BY column_name;

-- Verificar tabela de webhooks
SELECT 
  table_name,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
FROM information_schema.tables
WHERE table_name = 'stripe_webhooks';

-- ============================================
-- NOTAS:
-- ============================================
-- 1. ✅ Colunas Stripe adicionadas em profiles
-- 2. ✅ Tabela stripe_webhooks para log de eventos
-- 3. ✅ Função process_stripe_webhook() para processar eventos
-- 4. ✅ Função has_active_subscription() para verificar status
-- 5. ✅ View v_active_subscriptions para monitoramento
-- 6. 🔐 RLS configurado para segurança
-- 7. ⏳ PRÓXIMOS PASSOS:
--    a) Configurar Stripe API Keys no backend (.env)
--    b) Implementar endpoint POST /webhooks/stripe no backend
--    c) Configurar Webhook URL no Dashboard Stripe
--    d) Atualizar stripe_price_id nos planos (tabela economy_subscription_plans)
-- ============================================
