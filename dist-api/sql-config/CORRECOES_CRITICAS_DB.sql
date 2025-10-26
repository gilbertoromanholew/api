-- ============================================
-- 🔧 CORREÇÕES CRÍTICAS DO BANCO DE DADOS
-- Data: 26/10/2025
-- Executar no Supabase SQL Editor
-- ============================================

-- ============================================
-- 1️⃣ ADICIONAR COLUNAS FALTANTES EM ECONOMY_TRANSACTIONS
-- ============================================

-- Adicionar coluna 'type' para categorizar transações
ALTER TABLE economy_transactions
ADD COLUMN IF NOT EXISTS type VARCHAR(50);

-- Adicionar coluna 'point_type' para diferenciar bonus vs purchased
ALTER TABLE economy_transactions
ADD COLUMN IF NOT EXISTS point_type VARCHAR(20);

-- Criar índices para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_economy_transactions_type 
  ON economy_transactions(type);
  
CREATE INDEX IF NOT EXISTS idx_economy_transactions_point_type 
  ON economy_transactions(point_type);

CREATE INDEX IF NOT EXISTS idx_economy_transactions_user_type
  ON economy_transactions(user_id, type);

-- Atualizar registros existentes com valores padrão
UPDATE economy_transactions
SET 
  type = 'legacy',
  point_type = CASE 
    WHEN amount > 0 THEN 'bonus'
    WHEN amount < 0 THEN 'consumption'
    ELSE 'unknown'
  END
WHERE type IS NULL;

-- ============================================
-- 2️⃣ VERIFICAR CONSISTÊNCIA DE DADOS
-- ============================================

-- Verificar se há carteiras órfãs (sem usuário)
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM economy_user_wallets w
  WHERE NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = w.user_id
  );
  
  IF orphan_count > 0 THEN
    RAISE NOTICE '⚠️  Encontradas % carteiras órfãs!', orphan_count;
  ELSE
    RAISE NOTICE '✅ Nenhuma carteira órfã encontrada';
  END IF;
END $$;

-- Verificar se há execuções de ferramentas que não existem
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM tools_executions e
  WHERE NOT EXISTS (
    SELECT 1 FROM tools_catalog t WHERE t.id = e.tool_id
  );
  
  IF invalid_count > 0 THEN
    RAISE NOTICE '⚠️  Encontradas % execuções de ferramentas inválidas!', invalid_count;
  ELSE
    RAISE NOTICE '✅ Todas as execuções referenciam ferramentas válidas';
  END IF;
END $$;

-- ============================================
-- 3️⃣ PADRONIZAR TABELA DE EXECUÇÕES
-- ============================================

-- Adicionar colunas faltantes em tools_executions para compatibilidade
ALTER TABLE tools_executions
ADD COLUMN IF NOT EXISTS access_type TEXT,
ADD COLUMN IF NOT EXISTS experience_type TEXT;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_tools_executions_user 
  ON tools_executions(user_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_tools_executions_tool 
  ON tools_executions(tool_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_tools_executions_success 
  ON tools_executions(success, executed_at DESC);

-- ============================================
-- 4️⃣ MIGRAR DADOS DE TOOL_USAGE_LOGS (SE EXISTIR)
-- ============================================

-- Verificar se tool_usage_logs tem dados
DO $$
DECLARE
  log_count INTEGER;
  exec_count INTEGER;
BEGIN
  -- Contar registros em tool_usage_logs
  SELECT COUNT(*) INTO log_count FROM tool_usage_logs;
  
  IF log_count > 0 THEN
    RAISE NOTICE 'ℹ️  Encontrados % registros em tool_usage_logs', log_count;
    
    -- Migrar dados para tools_executions
    INSERT INTO tools_executions (
      user_id,
      tool_id,
      cost_in_points,
      success,
      error_message,
      execution_time_ms,
      executed_at,
      access_type,
      experience_type
    )
    SELECT 
      tul.user_id,
      tul.tool_id,
      tul.cost,
      tul.success,
      tul.error_message,
      tul.execution_time_ms,
      tul.created_at,
      tul.access_type,
      tul.experience_type
    FROM tool_usage_logs tul
    WHERE NOT EXISTS (
      SELECT 1 FROM tools_executions te
      WHERE te.user_id = tul.user_id
        AND te.tool_id = tul.tool_id
        AND te.executed_at = tul.created_at
    );
    
    GET DIAGNOSTICS exec_count = ROW_COUNT;
    RAISE NOTICE '✅ Migrados % registros para tools_executions', exec_count;
    
    -- Renomear tabela antiga
    ALTER TABLE tool_usage_logs RENAME TO tool_usage_logs_deprecated;
    RAISE NOTICE '✅ Tabela tool_usage_logs renomeada para tool_usage_logs_deprecated';
  ELSE
    RAISE NOTICE '✅ tool_usage_logs está vazia, nada a migrar';
  END IF;
END $$;

-- ============================================
-- 5️⃣ VERIFICAR ECONOMY_SUBSCRIPTIONS
-- ============================================

-- Verificar se há assinaturas ativas
SELECT 
  COUNT(*) as total_assinaturas_ativas,
  COUNT(DISTINCT user_id) as usuarios_unicos
FROM economy_subscriptions
WHERE status = 'active'
  AND end_date > NOW();

-- Verificar planos disponíveis
SELECT 
  id,
  name,
  slug,
  price_brl,
  billing_period,
  is_active
FROM economy_subscription_plans
WHERE is_active = true
ORDER BY display_order;

-- ============================================
-- 6️⃣ CRIAR VIEWS ÚTEIS
-- ============================================

-- View: Saldo total de usuários
CREATE OR REPLACE VIEW user_credits_summary AS
SELECT 
  w.user_id,
  p.full_name,
  p.email,
  w.bonus_credits,
  w.purchased_points,
  (w.bonus_credits + w.purchased_points) as total_credits,
  w.total_earned_bonus,
  w.total_purchased,
  w.total_spent,
  w.updated_at as last_transaction
FROM economy_user_wallets w
JOIN profiles p ON p.id = w.user_id;

-- View: Uso de ferramentas por mês
CREATE OR REPLACE VIEW monthly_tool_usage AS
SELECT 
  t.month_year,
  tc.name as tool_name,
  tc.slug as tool_slug,
  tc.category,
  COUNT(DISTINCT t.user_id) as unique_users,
  SUM(t.usage_count) as total_uses
FROM tool_usage_tracking t
JOIN tools_catalog tc ON tc.id = t.tool_id
GROUP BY t.month_year, tc.id, tc.name, tc.slug, tc.category
ORDER BY t.month_year DESC, total_uses DESC;

-- View: Transações recentes com detalhes
CREATE OR REPLACE VIEW recent_transactions_detail AS
SELECT 
  t.id,
  t.created_at,
  p.full_name as usuario,
  p.email,
  t.type,
  t.point_type,
  t.amount,
  t.balance_before,
  t.balance_after,
  t.description,
  t.metadata
FROM economy_transactions t
JOIN profiles p ON p.id = t.user_id
ORDER BY t.created_at DESC
LIMIT 100;

-- ============================================
-- 7️⃣ ADICIONAR COMENTÁRIOS EM TABELAS
-- ============================================

COMMENT ON TABLE economy_transactions IS 'Registro de todas as transações de créditos/pontos';
COMMENT ON COLUMN economy_transactions.type IS 'Tipo de transação: tool_usage, promo_code, referral_bonus, purchase, etc.';
COMMENT ON COLUMN economy_transactions.point_type IS 'Tipo de ponto: bonus, purchased';

COMMENT ON TABLE tools_executions IS 'Registro de execuções de ferramentas';
COMMENT ON COLUMN tools_executions.access_type IS 'Como a ferramenta foi acessada: free, pro_included, pro_overflow, paid';
COMMENT ON COLUMN tools_executions.experience_type IS 'Tipo de experiência: experimental, full';

COMMENT ON TABLE tool_usage_tracking IS 'Tracking mensal de uso de ferramentas por usuário';
COMMENT ON TABLE economy_user_wallets IS 'Carteira de créditos de cada usuário';

-- ============================================
-- 8️⃣ RESUMO FINAL
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CORREÇÕES APLICADAS COM SUCESSO!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Alterações realizadas:';
  RAISE NOTICE '  1. Colunas type e point_type adicionadas em economy_transactions';
  RAISE NOTICE '  2. Índices criados para melhor performance';
  RAISE NOTICE '  3. Colunas access_type e experience_type adicionadas em tools_executions';
  RAISE NOTICE '  4. Dados migrados de tool_usage_logs (se existiam)';
  RAISE NOTICE '  5. Views criadas para consultas rápidas';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Próximos passos:';
  RAISE NOTICE '  - Testar endpoints da API';
  RAISE NOTICE '  - Verificar logs de erro';
  RAISE NOTICE '  - Executar testes de integração';
  RAISE NOTICE '';
END $$;

-- ============================================
-- 🎯 FIM DAS CORREÇÕES
-- ============================================
