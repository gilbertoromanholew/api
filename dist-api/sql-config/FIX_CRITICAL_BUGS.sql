-- ============================================================================
-- CORREÇÕES DE BUGS CRÍTICOS ENCONTRADOS NOS LOGS
-- Data: 25/10/2025
-- ============================================================================

-- ============================================================================
-- BUG 1: tools_executions.created_at não existe
-- ============================================================================

-- Verificar estrutura atual de tools_executions
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'tools_executions'
ORDER BY ordinal_position;

-- Adicionar coluna created_at se não existir
ALTER TABLE tools_executions 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- Adicionar coluna updated_at se não existir (boa prática)
ALTER TABLE tools_executions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_tools_executions_created_at 
ON tools_executions(created_at DESC);

-- Preencher created_at para registros existentes (se houver)
UPDATE tools_executions 
SET created_at = NOW() 
WHERE created_at IS NULL;

-- ============================================================================
-- BUG 2: social_referrals → profiles (FK incorreta)
-- ============================================================================

-- Verificar estrutura atual de social_referrals
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'social_referrals'
ORDER BY ordinal_position;

-- Verificar constraints existentes
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
LEFT JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'social_referrals'
  AND tc.constraint_type = 'FOREIGN KEY';

-- O problema é que o código busca: social_referrals.referred_id → profiles
-- Mas a FK real deve ser: social_referrals.referrer_id → auth.users
--                         social_referrals.referred_id → auth.users

-- Verificar se a tabela profiles existe no schema public
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- A tabela profiles JÁ EXISTE, apenas adicionar colunas faltantes
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Criar índices (se não existirem)
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);

-- Garantir que RLS está habilitado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (recriar se necessário)
DROP POLICY IF EXISTS "Usuários veem próprio perfil" ON profiles;
CREATE POLICY "Usuários veem próprio perfil"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários atualizam próprio perfil" ON profiles;
CREATE POLICY "Usuários atualizam próprio perfil"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Service role pode fazer tudo profiles" ON profiles;
CREATE POLICY "Service role pode fazer tudo profiles"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Configurar permissões
GRANT ALL ON TABLE profiles TO service_role;
GRANT SELECT, UPDATE ON TABLE profiles TO authenticated;

-- ============================================================================
-- BUG 3: Verificar se social_referrals tem FK correta
-- ============================================================================

-- Dropar todas as constraints existentes (independente do nome)
DO $$ 
BEGIN
  -- Dropar constraints antigas
  ALTER TABLE social_referrals DROP CONSTRAINT IF EXISTS social_referrals_referred_id_fkey CASCADE;
  ALTER TABLE social_referrals DROP CONSTRAINT IF EXISTS social_referrals_referrer_id_fkey CASCADE;
  ALTER TABLE social_referrals DROP CONSTRAINT IF EXISTS fk_social_referrals_referred CASCADE;
  ALTER TABLE social_referrals DROP CONSTRAINT IF EXISTS fk_social_referrals_referrer CASCADE;
  ALTER TABLE social_referrals DROP CONSTRAINT IF EXISTS fk_social_referrals_referrer_user CASCADE;
  ALTER TABLE social_referrals DROP CONSTRAINT IF EXISTS fk_social_referrals_referred_user CASCADE;
  ALTER TABLE social_referrals DROP CONSTRAINT IF EXISTS fk_social_referrals_referred_profile CASCADE;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Adicionar FKs corretas para auth.users
DO $$
BEGIN
  -- FK para referrer_id → auth.users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_social_referrals_referrer_user' 
    AND table_name = 'social_referrals'
  ) THEN
    ALTER TABLE social_referrals
      ADD CONSTRAINT fk_social_referrals_referrer_user
      FOREIGN KEY (referrer_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- FK para referred_id → auth.users  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_social_referrals_referred_user' 
    AND table_name = 'social_referrals'
  ) THEN
    ALTER TABLE social_referrals
      ADD CONSTRAINT fk_social_referrals_referred_user
      FOREIGN KEY (referred_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- FK para referred_id → profiles (para queries do frontend)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_social_referrals_referred_profile' 
      AND table_name = 'social_referrals'
    ) THEN
      ALTER TABLE social_referrals
        ADD CONSTRAINT fk_social_referrals_referred_profile
        FOREIGN KEY (referred_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- BUG 4: Verificar outras colunas que podem estar faltando
-- ============================================================================

-- Adicionar colunas comuns que podem estar faltando em tools_executions
ALTER TABLE tools_executions 
  ADD COLUMN IF NOT EXISTS tool_id UUID REFERENCES tools_catalog(id) ON DELETE CASCADE;

ALTER TABLE tools_executions 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE tools_executions 
  ADD COLUMN IF NOT EXISTS execution_time_ms INTEGER;

ALTER TABLE tools_executions 
  ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT true;

ALTER TABLE tools_executions 
  ADD COLUMN IF NOT EXISTS error_message TEXT;

ALTER TABLE tools_executions 
  ADD COLUMN IF NOT EXISTS input_data JSONB DEFAULT '{}';

ALTER TABLE tools_executions 
  ADD COLUMN IF NOT EXISTS output_data JSONB DEFAULT '{}';

-- Criar índices adicionais
CREATE INDEX IF NOT EXISTS idx_tools_executions_user_id ON tools_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_tools_executions_tool_id ON tools_executions(tool_id);
CREATE INDEX IF NOT EXISTS idx_tools_executions_success ON tools_executions(success) WHERE success = false;

-- ============================================================================
-- RECARREGAR SCHEMA
-- ============================================================================

NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

DO $$
DECLARE
  col_count INTEGER;
  table_exists BOOLEAN;
BEGIN
  RAISE NOTICE '=== VERIFICAÇÃO DE CORREÇÕES ===';
  RAISE NOTICE '';
  
  -- 1. Verificar created_at em tools_executions
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'tools_executions' 
    AND column_name = 'created_at';
  
  IF col_count = 1 THEN
    RAISE NOTICE '✅ tools_executions.created_at EXISTS';
  ELSE
    RAISE WARNING '❌ tools_executions.created_at MISSING';
  END IF;
  
  -- 2. Verificar tabela profiles
  SELECT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'profiles'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ profiles table EXISTS';
    
    -- Contar registros
    EXECUTE 'SELECT COUNT(*) FROM profiles' INTO col_count;
    RAISE NOTICE '   📊 Total de profiles: %', col_count;
  ELSE
    RAISE WARNING '❌ profiles table MISSING';
  END IF;
  
  -- 3. Verificar FKs em social_referrals
  SELECT COUNT(*) INTO col_count
  FROM information_schema.table_constraints
  WHERE table_schema = 'public' 
    AND table_name = 'social_referrals'
    AND constraint_type = 'FOREIGN KEY';
  
  RAISE NOTICE '✅ social_referrals tem % foreign keys', col_count;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Verificação completa!';
  RAISE NOTICE '⚠️ Aguarde 5-10 segundos para o PostgREST atualizar.';
END $$;

-- ============================================================================
-- FIM DAS CORREÇÕES
-- ============================================================================
