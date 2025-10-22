-- ============================================
-- ROLLBACK: Reverter mudanças da migration 001
-- Data: 22 de outubro de 2025
-- Motivo: Usar email_confirmed_at nativo do Supabase
-- ============================================

BEGIN;

-- ============================================
-- 1. REMOVER ÍNDICES
-- ============================================

DROP INDEX IF EXISTS public.idx_profiles_email_lower;
DROP INDEX IF EXISTS public.idx_profiles_created_at;
DROP INDEX IF EXISTS public.idx_profiles_cpf_verified;

-- ============================================
-- 2. REMOVER FUNÇÕES E TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS sync_email_after_profile_insert ON public.profiles CASCADE;
DROP FUNCTION IF EXISTS sync_email_from_auth() CASCADE;

DROP TRIGGER IF EXISTS trigger_set_created_at ON public.profiles CASCADE;
DROP FUNCTION IF EXISTS set_created_at() CASCADE;

DROP FUNCTION IF EXISTS cleanup_abandoned_registrations() CASCADE;

-- ============================================
-- 3. REMOVER CONSTRAINT UNIQUE
-- ============================================

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS unique_cpf;

-- ============================================
-- 4. REMOVER COLUNAS ADICIONADAS
-- ============================================

ALTER TABLE public.profiles
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS email_verified,
DROP COLUMN IF EXISTS created_at;

-- ============================================
-- 5. REMOVER POLÍTICAS RLS
-- ============================================

DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

COMMIT;

-- ============================================
-- VERIFICAÇÃO
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Rollback concluído com sucesso!';
    RAISE NOTICE 'Colunas removidas: email, email_verified, created_at';
    RAISE NOTICE 'Constraint removida: unique_cpf';
    RAISE NOTICE 'Funções removidas: cleanup_abandoned_registrations, set_created_at, sync_email_from_auth';
END $$;
