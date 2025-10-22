-- ============================================
-- MIGRATION: Security Fixes + Race Condition Protection
-- Data: 22 de outubro de 2025
-- Versão: 1.0.0
-- ============================================

-- Descrição:
-- Esta migration adiciona proteções contra:
-- 1. Zombie accounts (registros abandonados)
-- 2. Race conditions (registros simultâneos)
-- 3. Performance (índices otimizados)

BEGIN;

-- ============================================
-- 1. UNIQUE CONSTRAINT (Previne race condition)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_cpf'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT unique_cpf UNIQUE (cpf);
        
        RAISE NOTICE 'Constraint unique_cpf adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Constraint unique_cpf já existe';
    END IF;
END $$;

-- ============================================
-- 2. CAMPOS DE CONTROLE (Time window + verificação)
-- ============================================

-- created_at: Timestamp de criação do registro
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

COMMENT ON COLUMN public.profiles.created_at IS 
'Data/hora de criação do registro. Usado para time window protection (10 minutos).';

-- email_verified: Flag de verificação de email
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.profiles.email_verified IS 
'TRUE quando usuário verifica email via OTP. Registros não verificados podem ser deletados após 10 minutos.';

-- email: Cópia do email de auth.users (para queries otimizadas)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

COMMENT ON COLUMN public.profiles.email IS 
'Cópia do email de auth.users. Sincronizado via trigger para permitir queries eficientes.';

-- Copiar emails existentes de auth.users para profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND p.email IS NULL;

-- Atualizar registros existentes (já verificados implicitamente)
UPDATE public.profiles
SET email_verified = true
WHERE email_verified IS NULL;

-- ============================================
-- 3. ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índice composto: CPF + email_verified (usado em check-cpf)
CREATE INDEX IF NOT EXISTS idx_profiles_cpf_verified 
ON public.profiles (cpf, email_verified);

COMMENT ON INDEX idx_profiles_cpf_verified IS 
'Otimiza query de verificação de CPF com status de verificação.';

-- Índice parcial: Apenas registros não verificados recentes
CREATE INDEX IF NOT EXISTS idx_profiles_created_at 
ON public.profiles (created_at) 
WHERE email_verified = false;

COMMENT ON INDEX idx_profiles_created_at IS 
'Otimiza busca de registros não verificados para cleanup automático.';

-- Índice: Email (case-insensitive) para check-email
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower
ON public.profiles (LOWER(email));

COMMENT ON INDEX idx_profiles_email_lower IS 
'Otimiza check-email com busca case-insensitive. Performance: O(1) ao invés de O(n).';

-- ============================================
-- 4. FUNÇÃO DE LIMPEZA AUTOMÁTICA
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_abandoned_registrations()
RETURNS TABLE (
    deleted_count INTEGER,
    deleted_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count INTEGER;
    v_deleted_ids UUID[];
BEGIN
    -- Deletar usuários de registros não verificados com mais de 30 minutos
    -- CASCADE deleta profiles automaticamente
    WITH deleted AS (
        DELETE FROM auth.users
        WHERE id IN (
            SELECT id 
            FROM public.profiles
            WHERE email_verified = false
            AND created_at < NOW() - INTERVAL '30 minutes'
        )
        RETURNING id
    )
    SELECT 
        COUNT(*)::INTEGER,
        ARRAY_AGG(id)
    INTO v_deleted_count, v_deleted_ids
    FROM deleted;
    
    -- Log da operação
    RAISE NOTICE 'Cleanup: % registros abandonados deletados', COALESCE(v_deleted_count, 0);
    
    RETURN QUERY SELECT v_deleted_count, v_deleted_ids;
END;
$$;

COMMENT ON FUNCTION cleanup_abandoned_registrations IS 
'Remove registros abandonados (não verificados há mais de 30min). 
Executar via cron a cada 10 minutos.
Exemplo: SELECT * FROM cleanup_abandoned_registrations();';

-- ============================================
-- 5. TRIGGER AUTOMÁTICO (Opcional)
-- ============================================

-- Trigger para setar created_at automaticamente em novos registros
CREATE OR REPLACE FUNCTION set_created_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.created_at IS NULL THEN
        NEW.created_at = NOW();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_created_at ON public.profiles;
CREATE TRIGGER trigger_set_created_at
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_created_at();

COMMENT ON TRIGGER trigger_set_created_at ON public.profiles IS 
'Garante que created_at sempre tenha valor em novos registros.';

-- ============================================
-- 6. POLÍTICAS DE SEGURANÇA (Row Level Security)
-- ============================================

-- Permitir leitura apenas de próprio perfil ou admin
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy"
ON public.profiles FOR SELECT
USING (
    auth.uid() = id 
    OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Permitir update apenas de próprio perfil
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- ============================================
-- 7. VERIFICAÇÃO DE INTEGRIDADE
-- ============================================

-- Verificar registros órfãos (profiles sem auth.users)
DO $$
DECLARE
    v_orphan_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_orphan_count
    FROM public.profiles p
    WHERE NOT EXISTS (
        SELECT 1 FROM auth.users u WHERE u.id = p.id
    );
    
    IF v_orphan_count > 0 THEN
        RAISE WARNING 'ATENÇÃO: % perfis órfãos encontrados (profiles sem auth.users correspondente)', v_orphan_count;
        RAISE NOTICE 'Execute: DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users);';
    ELSE
        RAISE NOTICE 'Integridade OK: Nenhum perfil órfão encontrado';
    END IF;
END $$;

-- ============================================
-- 8. ESTATÍSTICAS
-- ============================================

DO $$
DECLARE
    v_total_profiles INTEGER;
    v_verified_profiles INTEGER;
    v_unverified_profiles INTEGER;
    v_old_unverified INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_profiles FROM public.profiles;
    SELECT COUNT(*) INTO v_verified_profiles FROM public.profiles WHERE email_verified = true;
    SELECT COUNT(*) INTO v_unverified_profiles FROM public.profiles WHERE email_verified = false;
    SELECT COUNT(*) INTO v_old_unverified 
    FROM public.profiles 
    WHERE email_verified = false 
    AND created_at < NOW() - INTERVAL '30 minutes';
    
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE 'ESTATÍSTICAS DA MIGRATION';
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE 'Total de perfis: %', v_total_profiles;
    RAISE NOTICE 'Perfis verificados: %', v_verified_profiles;
    RAISE NOTICE 'Perfis não verificados: %', v_unverified_profiles;
    RAISE NOTICE 'Candidatos a cleanup (>30min): %', v_old_unverified;
    RAISE NOTICE '═══════════════════════════════════════';
    
    IF v_old_unverified > 0 THEN
        RAISE NOTICE 'Execute cleanup_abandoned_registrations() para limpar %  registros antigos', v_old_unverified;
    END IF;
END $$;

COMMIT;

-- ============================================
-- COMANDOS ÚTEIS
-- ============================================

-- Executar cleanup manualmente:
-- SELECT * FROM cleanup_abandoned_registrations();

-- Verificar registros não verificados:
-- SELECT id, cpf, full_name, email_verified, created_at, 
--        EXTRACT(EPOCH FROM (NOW() - created_at))/60 AS minutes_old
-- FROM public.profiles
-- WHERE email_verified = false
-- ORDER BY created_at DESC;

-- Verificar índices criados:
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'profiles';

-- Testar constraint de CPF único:
-- INSERT INTO public.profiles (id, cpf, full_name) 
-- VALUES (gen_random_uuid(), '12345678901', 'Teste');
-- (Segunda inserção com mesmo CPF deve falhar)
