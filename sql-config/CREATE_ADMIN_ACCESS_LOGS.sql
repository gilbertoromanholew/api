-- ============================================
-- CRIAR TABELA admin_access_logs
-- ============================================
-- Esta tabela armazena logs de acesso à API
-- para monitoramento e auditoria
-- ============================================

CREATE TABLE IF NOT EXISTS admin_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip INET,
  endpoint TEXT,
  method TEXT,
  authorized BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_timestamp 
  ON admin_access_logs(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_admin_access_logs_authorized 
  ON admin_access_logs(authorized);

CREATE INDEX IF NOT EXISTS idx_admin_access_logs_endpoint 
  ON admin_access_logs(endpoint);

CREATE INDEX IF NOT EXISTS idx_admin_access_logs_method 
  ON admin_access_logs(method);

CREATE INDEX IF NOT EXISTS idx_admin_access_logs_user_id 
  ON admin_access_logs(user_id);

-- Comentários
COMMENT ON TABLE admin_access_logs IS 'Logs de acesso à API para auditoria e monitoramento';
COMMENT ON COLUMN admin_access_logs.timestamp IS 'Momento do acesso';
COMMENT ON COLUMN admin_access_logs.ip IS 'Endereço IP do cliente';
COMMENT ON COLUMN admin_access_logs.endpoint IS 'Endpoint acessado';
COMMENT ON COLUMN admin_access_logs.method IS 'Método HTTP (GET, POST, etc)';
COMMENT ON COLUMN admin_access_logs.authorized IS 'Se o acesso foi autorizado ou negado';
COMMENT ON COLUMN admin_access_logs.user_id IS 'ID do usuário que fez a requisição (se autenticado)';
COMMENT ON COLUMN admin_access_logs.details IS 'Detalhes adicionais em JSON';

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE admin_access_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Apenas admins podem ver todos os logs
CREATE POLICY "Admins podem ver todos os logs de acesso"
  ON admin_access_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Sistema pode inserir logs (via service_role key)
-- Nota: INSERT sem policy permite inserção via service_role key

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar se a tabela foi criada
SELECT 
  'admin_access_logs' as tabela,
  COUNT(*) as registros
FROM admin_access_logs;

-- Verificar índices criados
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'admin_access_logs'
ORDER BY indexname;

-- Verificar policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'admin_access_logs';
