-- ============================================
-- 🔔 NOTIFICATIONS & GAMIFICATION SYSTEM
-- ============================================
-- Tabelas para sistema de notificações em tempo real
-- e gamificação completa com conquistas
-- ============================================

-- ============================================
-- 1. TABELA DE NOTIFICAÇÕES
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Tipo e conteúdo da notificação
    type VARCHAR(50) NOT NULL, -- 'achievement', 'credits', 'level_up', 'admin', 'system'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Dados adicionais em JSON
    data JSONB DEFAULT '{}',
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    -- Metadados
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- Notificações podem expirar
    
    -- Índices para performance
    CONSTRAINT valid_notification_type CHECK (type IN ('achievement', 'credits', 'level_up', 'subscription', 'admin', 'system', 'tool'))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON public.user_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON public.user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON public.user_notifications(type);

-- ============================================
-- 2. RLS POLICIES - NOTIFICAÇÕES
-- ============================================

-- Habilitar RLS
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Usuário pode ver apenas suas notificações
CREATE POLICY "Users can view their own notifications"
    ON public.user_notifications
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy: Usuário pode marcar suas notificações como lidas
CREATE POLICY "Users can update their own notifications"
    ON public.user_notifications
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Usuário pode deletar suas notificações
CREATE POLICY "Users can delete their own notifications"
    ON public.user_notifications
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy: Sistema pode inserir notificações (via service_role)
CREATE POLICY "Service role can insert notifications"
    ON public.user_notifications
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- ============================================
-- 3. VERIFICAR E ATUALIZAR TABELAS DE GAMIFICAÇÃO
-- ============================================

-- Tabela de conquistas disponíveis
-- NOTA: A tabela pode já existir, então adicionamos colunas faltantes se necessário
CREATE TABLE IF NOT EXISTS public.gamification_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas faltantes (se não existirem)
DO $$ 
BEGIN
    -- Nome da conquista (coluna obrigatória)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gamification_achievements' AND column_name='name') THEN
        ALTER TABLE public.gamification_achievements ADD COLUMN name VARCHAR(100) NOT NULL;
    END IF;
    
    -- Slug único (coluna obrigatória)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gamification_achievements' AND column_name='slug') THEN
        ALTER TABLE public.gamification_achievements ADD COLUMN slug VARCHAR(50) NOT NULL UNIQUE;
    END IF;
    
    -- Descrição
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gamification_achievements' AND column_name='description') THEN
        ALTER TABLE public.gamification_achievements ADD COLUMN description TEXT;
    END IF;
    
    -- Categoria
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gamification_achievements' AND column_name='category') THEN
        ALTER TABLE public.gamification_achievements ADD COLUMN category VARCHAR(50);
    END IF;
    
    -- Requisitos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gamification_achievements' AND column_name='requirement_type') THEN
        ALTER TABLE public.gamification_achievements ADD COLUMN requirement_type VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gamification_achievements' AND column_name='requirement_value') THEN
        ALTER TABLE public.gamification_achievements ADD COLUMN requirement_value INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gamification_achievements' AND column_name='max_level') THEN
        ALTER TABLE public.gamification_achievements ADD COLUMN max_level INTEGER DEFAULT 1;
    END IF;
    
    -- Recompensas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gamification_achievements' AND column_name='reward_bonus_credits') THEN
        ALTER TABLE public.gamification_achievements ADD COLUMN reward_bonus_credits INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gamification_achievements' AND column_name='pro_multiplier') THEN
        ALTER TABLE public.gamification_achievements ADD COLUMN pro_multiplier NUMERIC(3,2) DEFAULT 1.0;
    END IF;
    
    -- Visual
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gamification_achievements' AND column_name='icon_emoji') THEN
        ALTER TABLE public.gamification_achievements ADD COLUMN icon_emoji VARCHAR(10);
    END IF;
    
    -- Status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gamification_achievements' AND column_name='is_secret') THEN
        ALTER TABLE public.gamification_achievements ADD COLUMN is_secret BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gamification_achievements' AND column_name='is_active') THEN
        ALTER TABLE public.gamification_achievements ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gamification_achievements' AND column_name='display_order') THEN
        ALTER TABLE public.gamification_achievements ADD COLUMN display_order INTEGER DEFAULT 0;
    END IF;
END $$;

-- Tabela de conquistas dos usuários
CREATE TABLE IF NOT EXISTS public.gamification_user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar foreign key se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'gamification_user_achievements_achievement_id_fkey'
    ) THEN
        ALTER TABLE public.gamification_user_achievements 
        ADD CONSTRAINT gamification_user_achievements_achievement_id_fkey 
        FOREIGN KEY (achievement_id) REFERENCES public.gamification_achievements(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Adicionar colunas faltantes (se não existirem)
DO $$ 
BEGIN
    -- Progresso
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gamification_user_achievements' AND column_name='current_count') THEN
        ALTER TABLE public.gamification_user_achievements ADD COLUMN current_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gamification_user_achievements' AND column_name='target_count') THEN
        ALTER TABLE public.gamification_user_achievements ADD COLUMN target_count INTEGER NOT NULL DEFAULT 1;
    END IF;
    
    -- Status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gamification_user_achievements' AND column_name='is_completed') THEN
        ALTER TABLE public.gamification_user_achievements ADD COLUMN is_completed BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gamification_user_achievements' AND column_name='completed_at') THEN
        ALTER TABLE public.gamification_user_achievements ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;
END $$;

-- Adicionar constraint UNIQUE se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'gamification_user_achievements_user_id_achievement_id_key'
    ) THEN
        ALTER TABLE public.gamification_user_achievements 
        ADD CONSTRAINT gamification_user_achievements_user_id_achievement_id_key 
        UNIQUE(user_id, achievement_id);
    END IF;
END $$;

-- Índices para gamificação
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.gamification_user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.gamification_user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON public.gamification_user_achievements(is_completed);

-- ============================================
-- 4. RLS POLICIES - GAMIFICAÇÃO
-- ============================================

-- Habilitar RLS nas tabelas de gamificação
ALTER TABLE public.gamification_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_user_achievements ENABLE ROW LEVEL SECURITY;

-- Policy: Todos podem ver conquistas ativas (público)
CREATE POLICY "Anyone can view active achievements"
    ON public.gamification_achievements
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Policy: Admins podem gerenciar conquistas
CREATE POLICY "Admins can manage achievements"
    ON public.gamification_achievements
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Policy: Usuário pode ver apenas suas conquistas
CREATE POLICY "Users can view their own achievements"
    ON public.gamification_user_achievements
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy: Service role pode gerenciar conquistas dos usuários
CREATE POLICY "Service role can manage user achievements"
    ON public.gamification_user_achievements
    FOR ALL
    TO service_role
    WITH CHECK (true);

-- ============================================
-- 5. FUNÇÕES UTILITÁRIAS
-- ============================================

-- Função: Marcar notificação como lida
CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.user_notifications
    SET is_read = true,
        read_at = NOW()
    WHERE id = notification_id
    AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$;

-- Função: Marcar todas notificações como lidas
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE public.user_notifications
    SET is_read = true,
        read_at = NOW()
    WHERE user_id = auth.uid()
    AND is_read = false;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows;
END;
$$;

-- Função: Limpar notificações antigas (executar via cron)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.user_notifications
    WHERE (
        -- Notificações lidas com mais de 30 dias
        (is_read = true AND read_at < NOW() - INTERVAL '30 days')
        OR
        -- Notificações expiradas
        (expires_at IS NOT NULL AND expires_at < NOW())
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Função: Criar notificação (usada pelo backend)
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type VARCHAR,
    p_title VARCHAR,
    p_message TEXT,
    p_data JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.user_notifications (
        user_id,
        type,
        title,
        message,
        data
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_message,
        p_data
    )
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

-- ============================================
-- 6. SEED DE CONQUISTAS BÁSICAS
-- ============================================

-- Inserir conquistas padrão (se não existirem)
INSERT INTO public.gamification_achievements (
    id, 
    name, 
    slug, 
    description, 
    category, 
    requirement_type, 
    requirement_value, 
    max_level, 
    reward_bonus_credits, 
    pro_multiplier, 
    icon_emoji, 
    is_secret, 
    display_order, 
    is_active
)
VALUES
    ('a0000000-0000-0000-0000-000000000001'::UUID, 'Bem-vindo!', 'first_login', 'Faça seu primeiro login na plataforma', 'engagement', 'login', 1, 1, 10, 1.0, '👋', false, 1, true),
    ('a0000000-0000-0000-0000-000000000002'::UUID, 'Primeira Consulta', 'first_tool', 'Use uma ferramenta jurídica pela primeira vez', 'usage', 'tool_usage', 1, 1, 50, 1.0, '⚖️', false, 2, true),
    ('a0000000-0000-0000-0000-000000000003'::UUID, 'Consultor Iniciante', 'tool_master_10', 'Use ferramentas 10 vezes', 'usage', 'tool_usage', 10, 1, 100, 1.0, '📚', false, 3, true),
    ('a0000000-0000-0000-0000-000000000004'::UUID, 'Consultor Experiente', 'tool_master_50', 'Use ferramentas 50 vezes', 'usage', 'tool_usage', 50, 1, 300, 1.0, '🎓', false, 4, true),
    ('a0000000-0000-0000-0000-000000000005'::UUID, 'Consultor Expert', 'tool_master_100', 'Use ferramentas 100 vezes', 'usage', 'tool_usage', 100, 1, 500, 1.0, '🏆', false, 5, true),
    ('a0000000-0000-0000-0000-000000000006'::UUID, 'Dedicação Semanal', 'streak_7', 'Faça login 7 dias seguidos', 'engagement', 'login_streak', 7, 1, 150, 1.0, '🔥', false, 6, true),
    ('a0000000-0000-0000-0000-000000000007'::UUID, 'Dedicação Mensal', 'streak_30', 'Faça login 30 dias seguidos', 'engagement', 'login_streak', 30, 1, 500, 1.0, '💎', false, 7, true),
    ('a0000000-0000-0000-0000-000000000008'::UUID, 'Embaixador', 'referral_1', 'Convide seu primeiro amigo', 'social', 'referral', 1, 1, 200, 1.0, '🎁', false, 8, true),
    ('a0000000-0000-0000-0000-000000000009'::UUID, 'Influenciador', 'referral_5', 'Convide 5 amigos', 'social', 'referral', 5, 1, 1000, 1.0, '🌟', false, 9, true),
    ('a0000000-0000-0000-0000-000000000010'::UUID, 'Perfil Completo', 'profile_complete', 'Complete 100% do seu perfil', 'engagement', 'profile_complete', 1, 1, 50, 1.0, '✨', false, 10, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 7. COMENTÁRIOS FINAIS
-- ============================================

COMMENT ON TABLE public.user_notifications IS 'Tabela de notificações em tempo real para os usuários';
COMMENT ON TABLE public.gamification_achievements IS 'Conquistas disponíveis no sistema de gamificação';
COMMENT ON TABLE public.gamification_user_achievements IS 'Progresso e conquistas desbloqueadas pelos usuários';

COMMENT ON FUNCTION mark_notification_as_read IS 'Marca uma notificação específica como lida';
COMMENT ON FUNCTION mark_all_notifications_as_read IS 'Marca todas as notificações do usuário como lidas';
COMMENT ON FUNCTION cleanup_old_notifications IS 'Remove notificações antigas (executar via cron)';
COMMENT ON FUNCTION create_notification IS 'Cria uma nova notificação para um usuário (usado pelo backend)';

-- ============================================
-- 8. SISTEMA DE PRESENÇA ONLINE (ADMIN)
-- ============================================

-- Tabela de presença online dos usuários
CREATE TABLE IF NOT EXISTS public.user_presence (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Status de presença
    is_online BOOLEAN DEFAULT FALSE,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Informações da sessão
    socket_id VARCHAR(255), -- ID do socket WebSocket
    ip_address VARCHAR(45), -- IPv4 ou IPv6
    user_agent TEXT,
    
    -- Metadados
    connected_at TIMESTAMPTZ,
    disconnected_at TIMESTAMPTZ,
    total_sessions INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_presence_is_online ON public.user_presence(is_online);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON public.user_presence(last_seen_at DESC);

-- RLS Policies
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver sua própria presença
CREATE POLICY "Users can view their own presence"
    ON public.user_presence
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy: Admins podem ver presença de todos
CREATE POLICY "Admins can view all presence"
    ON public.user_presence
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Policy: Service role pode gerenciar presença
CREATE POLICY "Service role can manage presence"
    ON public.user_presence
    FOR ALL
    TO service_role
    WITH CHECK (true);

-- ============================================
-- 9. FUNÇÕES PARA GERENCIAMENTO DE PRESENÇA
-- ============================================

-- Função: Marcar usuário como online
CREATE OR REPLACE FUNCTION set_user_online(
    p_user_id UUID,
    p_socket_id VARCHAR,
    p_ip_address VARCHAR DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_presence (
        user_id,
        is_online,
        last_seen_at,
        socket_id,
        ip_address,
        user_agent,
        connected_at,
        total_sessions,
        updated_at
    ) VALUES (
        p_user_id,
        true,
        NOW(),
        p_socket_id,
        p_ip_address,
        p_user_agent,
        NOW(),
        1,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        is_online = true,
        last_seen_at = NOW(),
        socket_id = p_socket_id,
        ip_address = COALESCE(p_ip_address, user_presence.ip_address),
        user_agent = COALESCE(p_user_agent, user_presence.user_agent),
        connected_at = NOW(),
        total_sessions = user_presence.total_sessions + 1,
        updated_at = NOW();
    
    RETURN true;
END;
$$;

-- Função: Marcar usuário como offline
CREATE OR REPLACE FUNCTION set_user_offline(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.user_presence
    SET is_online = false,
        last_seen_at = NOW(),
        disconnected_at = NOW(),
        socket_id = NULL,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN FOUND;
END;
$$;

-- Função: Atualizar heartbeat (manter vivo)
CREATE OR REPLACE FUNCTION update_user_heartbeat(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.user_presence
    SET last_seen_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id
    AND is_online = true;
    
    RETURN FOUND;
END;
$$;

-- Função: Buscar usuários online (para admins)
CREATE OR REPLACE FUNCTION get_online_users()
RETURNS TABLE (
    user_id UUID,
    email VARCHAR,
    full_name VARCHAR,
    role VARCHAR,
    is_online BOOLEAN,
    last_seen_at TIMESTAMPTZ,
    connected_at TIMESTAMPTZ,
    ip_address VARCHAR,
    total_sessions INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se usuário é admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    ) THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem ver usuários online';
    END IF;

    RETURN QUERY
    SELECT 
        p.user_id,
        au.email::VARCHAR,
        pr.full_name,
        pr.role,
        p.is_online,
        p.last_seen_at,
        p.connected_at,
        p.ip_address,
        p.total_sessions
    FROM public.user_presence p
    INNER JOIN auth.users au ON au.id = p.user_id
    LEFT JOIN public.profiles pr ON pr.id = p.user_id
    WHERE p.is_online = true
    ORDER BY p.connected_at DESC;
END;
$$;

-- Função: Buscar estatísticas de presença (para dashboard admin)
CREATE OR REPLACE FUNCTION get_presence_stats()
RETURNS TABLE (
    total_users BIGINT,
    online_now BIGINT,
    active_today BIGINT,
    active_week BIGINT,
    new_today BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se usuário é admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    ) THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem ver estatísticas';
    END IF;

    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM auth.users)::BIGINT as total_users,
        (SELECT COUNT(*) FROM public.user_presence WHERE is_online = true)::BIGINT as online_now,
        (SELECT COUNT(*) FROM public.user_presence WHERE last_seen_at > NOW() - INTERVAL '24 hours')::BIGINT as active_today,
        (SELECT COUNT(*) FROM public.user_presence WHERE last_seen_at > NOW() - INTERVAL '7 days')::BIGINT as active_week,
        (SELECT COUNT(*) FROM auth.users WHERE created_at > NOW() - INTERVAL '24 hours')::BIGINT as new_today;
END;
$$;

-- Função: Limpar usuários inativos (considerar offline se sem heartbeat há 5 min)
CREATE OR REPLACE FUNCTION cleanup_inactive_users()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE public.user_presence
    SET is_online = false,
        disconnected_at = NOW(),
        socket_id = NULL,
        updated_at = NOW()
    WHERE is_online = true
    AND last_seen_at < NOW() - INTERVAL '5 minutes';
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows;
END;
$$;

-- ============================================
-- 10. COMENTÁRIOS FINAIS
-- ============================================

COMMENT ON TABLE public.user_presence IS 'Rastreamento de presença online dos usuários em tempo real';
COMMENT ON FUNCTION set_user_online IS 'Marca usuário como online quando conecta via WebSocket';
COMMENT ON FUNCTION set_user_offline IS 'Marca usuário como offline quando desconecta';
COMMENT ON FUNCTION update_user_heartbeat IS 'Atualiza timestamp de última atividade (heartbeat)';
COMMENT ON FUNCTION get_online_users IS 'Retorna lista de usuários online (apenas para admins)';
COMMENT ON FUNCTION get_presence_stats IS 'Retorna estatísticas de presença para dashboard admin';
COMMENT ON FUNCTION cleanup_inactive_users IS 'Marca como offline usuários sem heartbeat há 5 minutos';
