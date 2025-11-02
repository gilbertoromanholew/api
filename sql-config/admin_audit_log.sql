-- ============================================
-- TABELA DE AUDITORIA DE AÇÕES ADMINISTRATIVAS
-- ============================================

-- Criar tabela admin_audit_log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL, -- 'user.credits.add', 'user.role.change', 'user.delete', etc
    target_type VARCHAR(50) NOT NULL, -- 'user', 'tool', 'transaction', 'system'
    target_id UUID, -- ID do recurso afetado
    details JSONB DEFAULT '{}'::jsonb, -- Dados adicionais da ação
    ip_address INET, -- IP do admin
    user_agent TEXT, -- Browser/device info
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para queries rápidas
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action_type ON public.admin_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target_type ON public.admin_audit_log(target_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target_id ON public.admin_audit_log(target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at ON public.admin_audit_log(created_at DESC);

-- Criar índice GIN para busca em JSONB
CREATE INDEX IF NOT EXISTS idx_admin_audit_details_gin ON public.admin_audit_log USING GIN (details);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ler o log de auditoria
CREATE POLICY "Admins podem ler audit log"
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Apenas admins podem inserir no audit log (via API)
CREATE POLICY "Admins podem inserir audit log"
ON public.admin_audit_log
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Ninguém pode deletar logs de auditoria (proteção)
-- (Apenas super admins via SQL direto se necessário)

-- ============================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================

COMMENT ON TABLE public.admin_audit_log IS 'Registro de todas as ações administrativas do sistema';
COMMENT ON COLUMN public.admin_audit_log.admin_id IS 'ID do administrador que executou a ação';
COMMENT ON COLUMN public.admin_audit_log.action_type IS 'Tipo de ação executada (ex: user.credits.add)';
COMMENT ON COLUMN public.admin_audit_log.target_type IS 'Tipo de recurso afetado (user, tool, transaction, etc)';
COMMENT ON COLUMN public.admin_audit_log.target_id IS 'ID do recurso afetado';
COMMENT ON COLUMN public.admin_audit_log.details IS 'Dados adicionais em formato JSON';
COMMENT ON COLUMN public.admin_audit_log.ip_address IS 'Endereço IP do administrador';
COMMENT ON COLUMN public.admin_audit_log.user_agent IS 'Informações do navegador/dispositivo';

-- ============================================
-- EXEMPLOS DE USO
-- ============================================

/*
-- Inserir log de alteração de créditos
INSERT INTO public.admin_audit_log (admin_id, action_type, target_type, target_id, details, ip_address)
VALUES (
    '123e4567-e89b-12d3-a456-426614174000',
    'user.credits.add',
    'user',
    '987fcdeb-51a2-43d7-8f9e-0123456789ab',
    '{"amount": 1000, "reason": "Bônus de boas-vindas", "previous_balance": 500}'::jsonb,
    '192.168.1.100'::inet
);

-- Buscar ações de um admin específico
SELECT * FROM public.admin_audit_log
WHERE admin_id = '123e4567-e89b-12d3-a456-426614174000'
ORDER BY created_at DESC
LIMIT 50;

-- Buscar todas as alterações de role
SELECT * FROM public.admin_audit_log
WHERE action_type = 'user.role.change'
ORDER BY created_at DESC;

-- Buscar ações em um usuário específico
SELECT * FROM public.admin_audit_log
WHERE target_type = 'user' AND target_id = '987fcdeb-51a2-43d7-8f9e-0123456789ab'
ORDER BY created_at DESC;

-- Buscar ações com filtro JSON
SELECT * FROM public.admin_audit_log
WHERE details @> '{"reason": "Bônus de boas-vindas"}'::jsonb
ORDER BY created_at DESC;
*/
