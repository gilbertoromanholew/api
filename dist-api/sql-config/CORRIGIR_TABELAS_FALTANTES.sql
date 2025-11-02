-- ============================================
-- CORREÇÃO RÁPIDA - TABELAS FALTANTES
-- ============================================
-- Execute este SQL no Supabase SQL Editor para criar
-- as tabelas que estão causando os erros 500/404

-- ============================================
-- 1. TABELA: admin_audit_log
-- ============================================
-- Log de auditoria de ações administrativas

CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- ex: 'user.credits.add', 'user.role.change'
    target_type TEXT, -- ex: 'user', 'tool', 'system'
    target_id TEXT, -- ID do alvo (user_id, tool_id, etc)
    details JSONB, -- Informações adicionais da ação
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action_type ON admin_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target_type ON admin_audit_log(target_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);

-- RLS Policies (apenas admins podem ler)
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode ver audit log" ON admin_audit_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================
-- 2. TABELA: tools_usage (opcional)
-- ============================================
-- Tracking de uso de ferramentas
-- Se você já tem outra tabela para isso, ignore esta parte

CREATE TABLE IF NOT EXISTS tools_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tool_slug TEXT NOT NULL,
    tool_name TEXT,
    credits_spent INTEGER DEFAULT 0,
    execution_time INTEGER, -- ms
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tools_usage_user_id ON tools_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_tools_usage_tool_slug ON tools_usage(tool_slug);
CREATE INDEX IF NOT EXISTS idx_tools_usage_created_at ON tools_usage(created_at DESC);

-- RLS Policies
ALTER TABLE tools_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu próprio uso" ON tools_usage
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode inserir uso" ON tools_usage
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admin pode ver tudo" ON tools_usage
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================
-- CONFIRMAÇÃO
-- ============================================

SELECT 
    'admin_audit_log' as tabela,
    COUNT(*) as registros
FROM admin_audit_log
UNION ALL
SELECT 
    'tools_usage' as tabela,
    COUNT(*) as registros
FROM tools_usage;
