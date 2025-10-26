-- =============================================
-- PASSO 1: CRIAR TABELAS
-- =============================================
-- Execute este SQL no Supabase SQL Editor

-- Tabela de tracking de uso mensal
CREATE TABLE IF NOT EXISTS tool_usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES tools_catalog(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tool_id, month_year)
);

-- Tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS tool_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES tools_catalog(id) ON DELETE CASCADE,
  experience_type TEXT CHECK (experience_type IN ('experimental', 'full')),
  access_type TEXT CHECK (access_type IN ('pro_included', 'pro_overflow', 'free_experimental', 'free_full')),
  cost_charged INT DEFAULT 0,
  input_data JSONB,
  output_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_tool_usage_tracking_user ON tool_usage_tracking(user_id);
CREATE INDEX idx_tool_usage_tracking_month ON tool_usage_tracking(month_year);
CREATE INDEX idx_tool_usage_logs_user ON tool_usage_logs(user_id);
CREATE INDEX idx_tool_usage_logs_created ON tool_usage_logs(created_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE tool_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_usage_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: usuários só veem seus próprios dados
CREATE POLICY "Users can view own usage tracking"
  ON tool_usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own usage logs"
  ON tool_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Service role pode fazer tudo (bypass RLS)
CREATE POLICY "Service role has full access to tracking"
  ON tool_usage_tracking FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to logs"
  ON tool_usage_logs FOR ALL
  USING (true)
  WITH CHECK (true);
