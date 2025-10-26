-- ============================================
-- SISTEMA DE PLANEJAMENTOS - ESTRUTURA
-- ============================================
-- Data: 2025-10-25
-- Objetivo: Adicionar suporte para controle de acesso
--           diferenciado em ferramentas de planejamento

-- ============================================
-- 1. ADICIONAR COLUNAS EM tools_catalog
-- ============================================

ALTER TABLE tools_catalog 
ADD COLUMN IF NOT EXISTS is_planning BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS planning_base_cost INTEGER, -- Custo experimental (gratuitos)
ADD COLUMN IF NOT EXISTS planning_full_cost INTEGER, -- Custo completo para gratuitos (5x base)
ADD COLUMN IF NOT EXISTS planning_monthly_limit INTEGER DEFAULT 20, -- Limite mensal para PRO
ADD COLUMN IF NOT EXISTS planning_pro_overflow_cost INTEGER; -- Custo após limite PRO (2x base)

COMMENT ON COLUMN tools_catalog.is_planning IS 'Indica se é ferramenta de planejamento com regras especiais';
COMMENT ON COLUMN tools_catalog.planning_base_cost IS 'Custo da experiência experimental (usuários gratuitos)';
COMMENT ON COLUMN tools_catalog.planning_full_cost IS 'Custo da experiência completa sem assinatura (5x base)';
COMMENT ON COLUMN tools_catalog.planning_monthly_limit IS 'Limite de usos grátis por mês para assinantes PRO';
COMMENT ON COLUMN tools_catalog.planning_pro_overflow_cost IS 'Custo após exceder limite mensal (2x base)';

-- ============================================
-- 2. CRIAR TABELA DE RASTREAMENTO DE USO
-- ============================================

CREATE TABLE IF NOT EXISTS tool_usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES tools_catalog(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Formato: "2025-10"
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT tool_usage_tracking_unique_user_tool_month 
    UNIQUE(user_id, tool_id, month_year)
);

COMMENT ON TABLE tool_usage_tracking IS 'Rastreia uso mensal de ferramentas de planejamento por usuário PRO';
COMMENT ON COLUMN tool_usage_tracking.month_year IS 'Mês/ano no formato YYYY-MM (ex: 2025-10)';
COMMENT ON COLUMN tool_usage_tracking.usage_count IS 'Número de vezes que a ferramenta foi usada no mês';

-- ============================================
-- 3. ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tool_usage_user 
  ON tool_usage_tracking(user_id);

CREATE INDEX IF NOT EXISTS idx_tool_usage_tool 
  ON tool_usage_tracking(tool_id);

CREATE INDEX IF NOT EXISTS idx_tool_usage_month 
  ON tool_usage_tracking(month_year);

CREATE INDEX IF NOT EXISTS idx_tool_usage_user_month 
  ON tool_usage_tracking(user_id, month_year);

CREATE INDEX IF NOT EXISTS idx_tools_is_planning 
  ON tools_catalog(is_planning) 
  WHERE is_planning = TRUE;

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE tool_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas seu próprio uso
CREATE POLICY "Users can view own usage"
  ON tool_usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem inserir apenas seu próprio uso (via backend)
CREATE POLICY "Users can insert own usage"
  ON tool_usage_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar apenas seu próprio uso (via backend)
CREATE POLICY "Users can update own usage"
  ON tool_usage_tracking FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin pode ver tudo
CREATE POLICY "Admins can view all usage"
  ON tool_usage_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 5. FUNÇÕES SQL
-- ============================================

-- Função para incrementar uso de ferramenta
CREATE OR REPLACE FUNCTION increment_tool_usage(
  p_user_id UUID,
  p_tool_id UUID,
  p_month_year TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO tool_usage_tracking (user_id, tool_id, month_year, usage_count, last_used_at)
  VALUES (p_user_id, p_tool_id, p_month_year, 1, NOW())
  ON CONFLICT (user_id, tool_id, month_year)
  DO UPDATE SET 
    usage_count = tool_usage_tracking.usage_count + 1,
    last_used_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_tool_usage IS 'Incrementa contador de uso mensal de ferramenta (upsert)';

-- Função para obter uso mensal
CREATE OR REPLACE FUNCTION get_monthly_usage(
  p_user_id UUID,
  p_tool_id UUID,
  p_month_year TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COALESCE(usage_count, 0)
  INTO v_count
  FROM tool_usage_tracking
  WHERE user_id = p_user_id
    AND tool_id = p_tool_id
    AND month_year = p_month_year;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_monthly_usage IS 'Retorna quantidade de usos de uma ferramenta no mês';

-- Função para obter uso de todas as ferramentas no mês
CREATE OR REPLACE FUNCTION get_user_monthly_usage(
  p_user_id UUID,
  p_month_year TEXT
)
RETURNS TABLE (
  tool_id UUID,
  tool_title TEXT,
  usage_count INTEGER,
  limit_reached BOOLEAN,
  monthly_limit INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    COALESCE(u.usage_count, 0)::INTEGER,
    COALESCE(u.usage_count, 0) >= t.planning_monthly_limit AS limit_reached,
    t.planning_monthly_limit
  FROM tools_catalog t
  LEFT JOIN tool_usage_tracking u 
    ON u.tool_id = t.id 
    AND u.user_id = p_user_id 
    AND u.month_year = p_month_year
  WHERE t.is_planning = TRUE
  ORDER BY t.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_monthly_usage IS 'Retorna uso mensal de todas as ferramentas de planejamento do usuário';

-- ============================================
-- 6. TRIGGER PARA AUTO-UPDATE updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_tool_usage_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tool_usage_timestamp ON tool_usage_tracking;

CREATE TRIGGER trigger_update_tool_usage_timestamp
  BEFORE UPDATE ON tool_usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_tool_usage_timestamp();

-- ============================================
-- 7. VIEW PARA ADMIN - ANALYTICS
-- ============================================

CREATE OR REPLACE VIEW admin_tool_usage_stats AS
SELECT 
  t.id AS tool_id,
  t.name AS tool_title,
  t.slug AS tool_slug,
  u.month_year,
  COUNT(DISTINCT u.user_id) AS unique_users,
  SUM(u.usage_count) AS total_uses,
  AVG(u.usage_count)::NUMERIC(10,2) AS avg_uses_per_user,
  MAX(u.usage_count) AS max_uses_by_single_user
FROM tools_catalog t
LEFT JOIN tool_usage_tracking u ON u.tool_id = t.id
WHERE t.is_planning = TRUE
GROUP BY t.id, t.name, t.slug, u.month_year
ORDER BY u.month_year DESC, total_uses DESC NULLS LAST;

COMMENT ON VIEW admin_tool_usage_stats IS 'Estatísticas de uso de ferramentas de planejamento para admin';

-- ============================================
-- 8. ATUALIZAR FERRAMENTAS EXISTENTES
-- ============================================

-- Atualizar todas as ferramentas que começam com "planejamento_"
UPDATE tools_catalog
SET 
  is_planning = TRUE,
  planning_base_cost = COALESCE(cost_in_points, 100), -- Base experimental
  planning_full_cost = COALESCE(cost_in_points, 100) * 5, -- 5x para experiência completa
  planning_monthly_limit = 20, -- 20 usos grátis para PRO
  planning_pro_overflow_cost = COALESCE(cost_in_points, 100) * 2 -- 2x após limite
WHERE slug LIKE 'planejamento_%';

-- ============================================
-- 9. VALIDAÇÕES
-- ============================================

-- Garantir que ferramentas de planejamento tenham custos definidos
ALTER TABLE tools_catalog 
ADD CONSTRAINT check_planning_costs 
  CHECK (
    is_planning = FALSE OR (
      planning_base_cost IS NOT NULL AND
      planning_full_cost IS NOT NULL AND
      planning_pro_overflow_cost IS NOT NULL AND
      planning_monthly_limit > 0
    )
  );

-- Garantir lógica de custos (full = 5x base, overflow = 2x base)
ALTER TABLE tools_catalog 
ADD CONSTRAINT check_planning_cost_logic 
  CHECK (
    is_planning = FALSE OR (
      planning_full_cost = planning_base_cost * 5 AND
      planning_pro_overflow_cost = planning_base_cost * 2
    )
  );

-- ============================================
-- FIM DO SCRIPT
-- ============================================

-- Verificar ferramentas de planejamento configuradas
SELECT 
  id,
  name,
  slug,
  is_planning,
  planning_base_cost AS base_experimental,
  planning_full_cost AS full_free_user,
  planning_monthly_limit AS pro_monthly_free,
  planning_pro_overflow_cost AS pro_after_limit
FROM tools_catalog
WHERE is_planning = TRUE
ORDER BY name;
