-- ============================================================================
-- MIGRATION 003: TABELAS DE AUDITORIA
-- ============================================================================
-- Criado em: 21 de outubro de 2025
-- Fase 3: Auditoria e Logging
-- 
-- Objetivo:
-- - Registrar TODAS as operações sensíveis (autenticação, operações de usuário)
-- - Permitir investigação de atividades suspeitas
-- - Compliance e auditoria de segurança
-- ============================================================================

-- ============================================================================
-- 1. TABELA DE AUDITORIA DE AUTENTICAÇÃO
-- ============================================================================

CREATE TABLE IF NOT EXISTS auth_audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- 'login', 'logout', 'register', 'failed_login', 'password_reset', 'password_change'
    ip_address VARCHAR(45), -- IPv4 ou IPv6
    user_agent TEXT, -- Browser/App info
    country VARCHAR(100), -- País (se disponível)
    city VARCHAR(100), -- Cidade (se disponível)
    success BOOLEAN DEFAULT true,
    error_message TEXT, -- Mensagem de erro (se success = false)
    metadata JSONB, -- Dados adicionais (ex: tentativas anteriores, etc)
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_auth_audit_user_id ON auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_created_at ON auth_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_audit_action ON auth_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_auth_audit_ip ON auth_audit_log(ip_address);
CREATE INDEX IF NOT EXISTS idx_auth_audit_success ON auth_audit_log(success) WHERE success = false;

-- Comentários
COMMENT ON TABLE auth_audit_log IS 'Auditoria de eventos de autenticação (login, logout, registro, etc)';
COMMENT ON COLUMN auth_audit_log.action IS 'Tipo de ação: login, logout, register, failed_login, password_reset, password_change';
COMMENT ON COLUMN auth_audit_log.success IS 'Se a ação foi bem-sucedida';
COMMENT ON COLUMN auth_audit_log.metadata IS 'Dados adicionais em JSON (tentativas anteriores, motivo de bloqueio, etc)';

-- ============================================================================
-- 2. TABELA DE AUDITORIA DE OPERAÇÕES
-- ============================================================================

CREATE TABLE IF NOT EXISTS operations_audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    operation VARCHAR(100) NOT NULL, -- 'tool_execution', 'points_consumption', 'profile_update', etc
    resource VARCHAR(255), -- Recurso afetado (ex: 'salary_calculator', 'profile', etc)
    details JSONB, -- Detalhes da operação (params, valores antes/depois, etc)
    ip_address VARCHAR(45),
    user_agent TEXT,
    execution_time_ms INTEGER, -- Tempo de execução em milissegundos
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB, -- Metadados adicionais
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ops_audit_user_id ON operations_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ops_audit_created_at ON operations_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_audit_operation ON operations_audit_log(operation);
CREATE INDEX IF NOT EXISTS idx_ops_audit_resource ON operations_audit_log(resource);
CREATE INDEX IF NOT EXISTS idx_ops_audit_success ON operations_audit_log(success) WHERE success = false;

-- Comentários
COMMENT ON TABLE operations_audit_log IS 'Auditoria de operações de usuários (execução de ferramentas, consumo de pontos, etc)';
COMMENT ON COLUMN operations_audit_log.operation IS 'Tipo de operação executada';
COMMENT ON COLUMN operations_audit_log.resource IS 'Recurso afetado pela operação';
COMMENT ON COLUMN operations_audit_log.details IS 'Detalhes da operação em JSON';
COMMENT ON COLUMN operations_audit_log.execution_time_ms IS 'Tempo de execução em milissegundos';

-- ============================================================================
-- 3. TABELA DE AUDITORIA DE RATE LIMITING
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_limit_violations (
    id BIGSERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    endpoint VARCHAR(255) NOT NULL, -- Rota que foi bloqueada
    limiter_type VARCHAR(50) NOT NULL, -- Tipo de rate limiter (auth, api, tools, etc)
    attempts INTEGER, -- Número de tentativas
    user_agent TEXT,
    metadata JSONB, -- Dados adicionais
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip ON rate_limit_violations(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limit_user_id ON rate_limit_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_created_at ON rate_limit_violations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_endpoint ON rate_limit_violations(endpoint);

-- Comentários
COMMENT ON TABLE rate_limit_violations IS 'Auditoria de violações de rate limiting';
COMMENT ON COLUMN rate_limit_violations.limiter_type IS 'Tipo de rate limiter: auth, register, api, supabase, tools';
COMMENT ON COLUMN rate_limit_violations.attempts IS 'Número de tentativas antes do bloqueio';

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE auth_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_violations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. POLÍTICAS DE ACESSO
-- ============================================================================

-- -----------------------------------------------
-- auth_audit_log
-- -----------------------------------------------

-- Admins podem ver todos os logs
CREATE POLICY "Admins can see all auth audit logs"
ON auth_audit_log
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Usuários podem ver apenas seus próprios logs
CREATE POLICY "Users can see their own auth logs"
ON auth_audit_log
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Service role pode inserir logs (API)
CREATE POLICY "Service role can insert auth logs"
ON auth_audit_log
FOR INSERT
TO service_role
WITH CHECK (true);

-- API pode inserir logs (usando anon key mas com JWT)
CREATE POLICY "Authenticated users can insert auth logs"
ON auth_audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- -----------------------------------------------
-- operations_audit_log
-- -----------------------------------------------

-- Admins podem ver todos os logs de operações
CREATE POLICY "Admins can see all operations logs"
ON operations_audit_log
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Usuários podem ver apenas suas próprias operações
CREATE POLICY "Users can see their own operations"
ON operations_audit_log
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Service role pode inserir logs
CREATE POLICY "Service role can insert operation logs"
ON operations_audit_log
FOR INSERT
TO service_role
WITH CHECK (true);

-- API pode inserir logs
CREATE POLICY "Authenticated users can insert operation logs"
ON operations_audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- -----------------------------------------------
-- rate_limit_violations
-- -----------------------------------------------

-- Apenas admins podem ver violações de rate limit
CREATE POLICY "Admins can see all rate limit violations"
ON rate_limit_violations
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Service role pode inserir violações
CREATE POLICY "Service role can insert rate limit violations"
ON rate_limit_violations
FOR INSERT
TO service_role
WITH CHECK (true);

-- API pode inserir violações
CREATE POLICY "Authenticated users can insert rate limit violations"
ON rate_limit_violations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================================================
-- 6. FUNÇÕES AUXILIARES
-- ============================================================================

-- Função para limpar logs antigos (manutenção)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS TABLE (
    auth_deleted BIGINT,
    operations_deleted BIGINT,
    rate_limit_deleted BIGINT
) AS $$
DECLARE
    auth_count BIGINT;
    ops_count BIGINT;
    rate_count BIGINT;
BEGIN
    -- Deletar logs de autenticação antigos
    DELETE FROM auth_audit_log
    WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    GET DIAGNOSTICS auth_count = ROW_COUNT;
    
    -- Deletar logs de operações antigos
    DELETE FROM operations_audit_log
    WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    GET DIAGNOSTICS ops_count = ROW_COUNT;
    
    -- Deletar violações antigas
    DELETE FROM rate_limit_violations
    WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    GET DIAGNOSTICS rate_count = ROW_COUNT;
    
    RETURN QUERY SELECT auth_count, ops_count, rate_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário
COMMENT ON FUNCTION cleanup_old_audit_logs IS 'Remove logs de auditoria mais antigos que X dias (padrão: 90 dias)';

-- Função para estatísticas de auditoria
CREATE OR REPLACE FUNCTION get_audit_stats(user_id_param UUID DEFAULT NULL)
RETURNS TABLE (
    total_logins BIGINT,
    failed_logins BIGINT,
    total_operations BIGINT,
    failed_operations BIGINT,
    rate_limit_violations BIGINT,
    last_login TIMESTAMP,
    most_used_operation VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM auth_audit_log WHERE action = 'login' AND success = true AND (user_id_param IS NULL OR user_id = user_id_param)) as total_logins,
        (SELECT COUNT(*) FROM auth_audit_log WHERE action = 'failed_login' AND (user_id_param IS NULL OR user_id = user_id_param)) as failed_logins,
        (SELECT COUNT(*) FROM operations_audit_log WHERE success = true AND (user_id_param IS NULL OR user_id = user_id_param)) as total_operations,
        (SELECT COUNT(*) FROM operations_audit_log WHERE success = false AND (user_id_param IS NULL OR user_id = user_id_param)) as failed_operations,
        (SELECT COUNT(*) FROM rate_limit_violations WHERE (user_id_param IS NULL OR user_id = user_id_param)) as rate_limit_violations,
        (SELECT MAX(created_at) FROM auth_audit_log WHERE action = 'login' AND success = true AND (user_id_param IS NULL OR user_id = user_id_param)) as last_login,
        (SELECT operation FROM operations_audit_log WHERE (user_id_param IS NULL OR user_id = user_id_param) GROUP BY operation ORDER BY COUNT(*) DESC LIMIT 1) as most_used_operation;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário
COMMENT ON FUNCTION get_audit_stats IS 'Retorna estatísticas de auditoria para um usuário (ou todos se user_id_param for NULL)';

-- ============================================================================
-- 7. VIEWS PARA RELATÓRIOS
-- ============================================================================

-- View: Tentativas de login falhadas (últimas 24h)
CREATE OR REPLACE VIEW failed_login_attempts_24h AS
SELECT 
    user_id,
    ip_address,
    COUNT(*) as attempts,
    MAX(created_at) as last_attempt,
    ARRAY_AGG(DISTINCT user_agent) as user_agents
FROM auth_audit_log
WHERE action = 'failed_login'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id, ip_address
HAVING COUNT(*) >= 3
ORDER BY attempts DESC;

COMMENT ON VIEW failed_login_attempts_24h IS 'Tentativas de login falhadas nas últimas 24h (3 ou mais tentativas)';

-- View: Atividades suspeitas (múltiplos IPs para mesmo usuário)
CREATE OR REPLACE VIEW suspicious_activities AS
SELECT 
    user_id,
    COUNT(DISTINCT ip_address) as different_ips,
    ARRAY_AGG(DISTINCT ip_address) as ips,
    MIN(created_at) as first_seen,
    MAX(created_at) as last_seen
FROM auth_audit_log
WHERE action = 'login'
  AND success = true
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(DISTINCT ip_address) >= 3
ORDER BY different_ips DESC;

COMMENT ON VIEW suspicious_activities IS 'Usuários com logins de múltiplos IPs diferentes na última hora (possível conta comprometida)';

-- View: Top violadores de rate limit
CREATE OR REPLACE VIEW top_rate_limit_violators AS
SELECT 
    ip_address,
    user_id,
    COUNT(*) as violations,
    ARRAY_AGG(DISTINCT endpoint) as endpoints,
    MAX(created_at) as last_violation
FROM rate_limit_violations
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY ip_address, user_id
HAVING COUNT(*) >= 5
ORDER BY violations DESC;

COMMENT ON VIEW top_rate_limit_violators IS 'IPs/Usuários com mais violações de rate limit nas últimas 24h';

-- ============================================================================
-- 8. GRANTS (Permissões)
-- ============================================================================

-- Permitir que authenticated role acesse as tabelas
GRANT SELECT, INSERT ON auth_audit_log TO authenticated;
GRANT SELECT, INSERT ON operations_audit_log TO authenticated;
GRANT SELECT, INSERT ON rate_limit_violations TO authenticated;

-- Service role tem acesso total
GRANT ALL ON auth_audit_log TO service_role;
GRANT ALL ON operations_audit_log TO service_role;
GRANT ALL ON rate_limit_violations TO service_role;

-- Views são apenas leitura para admins (via RLS)
GRANT SELECT ON failed_login_attempts_24h TO authenticated;
GRANT SELECT ON suspicious_activities TO authenticated;
GRANT SELECT ON top_rate_limit_violators TO authenticated;

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================

-- Log de conclusão
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 003 (Audit Tables) executada com sucesso!';
    RAISE NOTICE '📊 Tabelas criadas: auth_audit_log, operations_audit_log, rate_limit_violations';
    RAISE NOTICE '🔐 RLS habilitado em todas as tabelas';
    RAISE NOTICE '👁️ Views criadas: failed_login_attempts_24h, suspicious_activities, top_rate_limit_violators';
END $$;
