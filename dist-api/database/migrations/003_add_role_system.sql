-- ========================================
-- MIGRATION 003: Role System (Fase 3)
-- Data: 20/10/2025
-- Descrição: Adiciona sistema de roles para autenticação admin
-- ========================================

-- 1. Adicionar coluna role na tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- 2. Criar índice para performance em queries filtradas por role
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 3. Adicionar constraint de validação (apenas valores permitidos)
ALTER TABLE profiles 
ADD CONSTRAINT role_check 
CHECK (role IN ('user', 'admin', 'moderator'));

-- 4. Atualizar usuário admin principal
-- IMPORTANTE: Substitua 'm.gilbertoromanhole@gmail.com' pelo seu email
UPDATE profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'm.gilbertoromanhole@gmail.com'
);

-- 5. Comentário na coluna (documentação)
COMMENT ON COLUMN profiles.role IS 'Role do usuário: user (padrão), admin (acesso total), moderator (acesso limitado)';

-- ========================================
-- VERIFICAÇÕES
-- ========================================

-- Verificar se a coluna foi adicionada
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    RAISE NOTICE '✅ Coluna role adicionada com sucesso';
  ELSE
    RAISE EXCEPTION '❌ Erro: Coluna role não foi criada';
  END IF;
END $$;

-- Listar todos os admins
SELECT 
  p.id,
  p.full_name,
  p.cpf,
  p.role,
  u.email,
  p.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'admin'
ORDER BY p.created_at DESC;

-- ========================================
-- ROLLBACK (caso necessário)
-- ========================================
-- Para reverter esta migration:
/*
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS role_check;
DROP INDEX IF EXISTS idx_profiles_role;
ALTER TABLE profiles DROP COLUMN IF EXISTS role;
*/
