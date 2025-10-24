-- ============================================
-- MIGRAÇÃO V7 - PARTE 1: CRIAR SCHEMAS
-- ============================================
-- Data: 23/10/2025
-- Objetivo: Organizar banco de dados em schemas dedicados
-- ============================================

-- ============================================
-- 1. CRIAR SCHEMAS
-- ============================================

-- Schema de Economia (pontos, assinaturas, pagamentos)
CREATE SCHEMA IF NOT EXISTS economy;
COMMENT ON SCHEMA economy IS 'Sistema de economia: pontos, créditos, assinaturas Pro e pagamentos';

-- Schema de Gamificação (conquistas, leaderboards)
CREATE SCHEMA IF NOT EXISTS gamification;
COMMENT ON SCHEMA gamification IS 'Sistema de gamificação: conquistas, progressão e rankings';

-- Schema de Ferramentas (catálogo, execuções, favoritos)
CREATE SCHEMA IF NOT EXISTS tools;
COMMENT ON SCHEMA tools IS 'Catálogo e gestão de ferramentas da plataforma';

-- Schema Social (amizades, referências, privacidade)
CREATE SCHEMA IF NOT EXISTS social;
COMMENT ON SCHEMA social IS 'Sistema social: amizades, referências e configurações de privacidade';

-- Schema de Auditoria (logs, segurança, admin)
CREATE SCHEMA IF NOT EXISTS audit;
COMMENT ON SCHEMA audit IS 'Auditoria e logs de segurança do sistema';

-- ============================================
-- 2. CONCEDER PERMISSÕES BÁSICAS
-- ============================================

-- Authenticated pode ler de todos os schemas
GRANT USAGE ON SCHEMA economy TO authenticated;
GRANT USAGE ON SCHEMA gamification TO authenticated;
GRANT USAGE ON SCHEMA tools TO authenticated;
GRANT USAGE ON SCHEMA social TO authenticated;
GRANT USAGE ON SCHEMA audit TO authenticated;

-- Service Role tem controle total
GRANT ALL ON SCHEMA economy TO service_role;
GRANT ALL ON SCHEMA gamification TO service_role;
GRANT ALL ON SCHEMA tools TO service_role;
GRANT ALL ON SCHEMA social TO service_role;
GRANT ALL ON SCHEMA audit TO service_role;

-- ============================================
-- 3. CRIAR ENUMS GLOBAIS
-- ============================================

-- Tipos de transação de pontos
DO $$ BEGIN
    CREATE TYPE economy.transaction_type AS ENUM (
        'signup_bonus',
        'profile_complete',
        'achievement',
        'achievement_levelup',
        'pro_weekly_allowance',
        'referral_reward',
        'purchase',
        'tool_usage',
        'admin_adjustment',
        'refund'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tipos de ponto
DO $$ BEGIN
    CREATE TYPE economy.point_type AS ENUM ('bonus', 'purchased');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Status de assinatura
DO $$ BEGIN
    CREATE TYPE economy.subscription_status AS ENUM (
        'active',
        'canceled',
        'expired',
        'past_due',
        'trialing'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tipos de conquista
DO $$ BEGIN
    CREATE TYPE gamification.achievement_type AS ENUM (
        'milestone',
        'progressive',
        'recurring',
        'secret'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Categorias de conquista
DO $$ BEGIN
    CREATE TYPE gamification.achievement_category AS ENUM (
        'onboarding',
        'mastery',
        'consistency',
        'curiosity',
        'social'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Recorrência de conquista
DO $$ BEGIN
    CREATE TYPE gamification.recurrence_type AS ENUM (
        'none',
        'daily',
        'weekly',
        'monthly'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Status de amizade
DO $$ BEGIN
    CREATE TYPE social.friendship_status AS ENUM (
        'pending',
        'accepted',
        'rejected',
        'blocked'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Níveis de visibilidade
DO $$ BEGIN
    CREATE TYPE social.visibility_level AS ENUM (
        'public',
        'friends_only',
        'private'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Status de referência
DO $$ BEGIN
    CREATE TYPE social.referral_status AS ENUM (
        'pending',
        'completed',
        'rewarded'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- SUCESSO! SCHEMAS CRIADOS
-- ============================================
-- Schemas criados:
--   - economy (economia)
--   - gamification (gamificação)
--   - tools (ferramentas)
--   - social (sistema social)
--   - audit (auditoria)
--
-- Próximo passo: Executar v7_002_create_tables.sql
-- ============================================
