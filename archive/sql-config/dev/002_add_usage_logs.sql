-- ============================================
-- TABELA DE AUDITORIA - LOGS DE USO
-- ============================================
-- Data: 2025-10-25
-- Objetivo: Rastrear todos os usos de ferramentas
--           para auditoria e analytics

CREATE TABLE IF NOT EXISTS tool_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES tools_catalog(id) ON DELETE CASCADE,
  cost INTEGER NOT NULL DEFAULT 0,
  access_type TEXT NOT NULL, -- 'pro_included', 'pro_overflow', 'free_experimental', 'free_full', 'standard'
  experience_type TEXT, -- 'experimental', 'full', NULL
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE tool_usage_logs IS 'Log de auditoria de todos os usos de ferramentas';
COMMENT ON COLUMN tool_usage_logs.access_type IS 'Tipo de acesso: pro_included, pro_overflow, free_experimental, free_full, standard';
COMMENT ON COLUMN tool_usage_logs.experience_type IS 'Tipo de experiência em planejamentos: experimental, full';
COMMENT ON COLUMN tool_usage_logs.cost IS 'Custo real cobrado em créditos';

-- Índices
CREATE INDEX IF NOT EXISTS idx_tool_logs_user ON tool_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_logs_tool ON tool_usage_logs(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_logs_created ON tool_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tool_logs_access_type ON tool_usage_logs(access_type);

-- RLS
ALTER TABLE tool_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs"
  ON tool_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert logs"
  ON tool_usage_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all logs"
  ON tool_usage_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- View para analytics admin
CREATE OR REPLACE VIEW admin_tool_revenue_stats AS
SELECT 
  t.id AS tool_id,
  t.name AS tool_title,
  t.slug AS tool_slug,
  DATE_TRUNC('day', l.created_at) AS date,
  l.access_type,
  COUNT(*) AS total_uses,
  COUNT(DISTINCT l.user_id) AS unique_users,
  SUM(l.cost) AS total_revenue_credits,
  AVG(l.cost)::NUMERIC(10,2) AS avg_cost_per_use,
  COUNT(*) FILTER (WHERE l.success = FALSE) AS failed_uses
FROM tool_usage_logs l
JOIN tools_catalog t ON t.id = l.tool_id
GROUP BY t.id, t.name, t.slug, DATE_TRUNC('day', l.created_at), l.access_type
ORDER BY date DESC, total_revenue_credits DESC;

COMMENT ON VIEW admin_tool_revenue_stats IS 'Estatísticas de receita e uso por ferramenta (admin)';
