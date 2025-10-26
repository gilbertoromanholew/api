/**
 * ========================================
 * ROLLBACK: Remover coluna access_level
 * ========================================
 * 
 * Execute APENAS se precisar reverter a migração
 */

-- 1. Remover constraint
ALTER TABLE tools_catalog
DROP CONSTRAINT IF EXISTS check_access_level;

-- 2. Remover coluna
ALTER TABLE tools_catalog
DROP COLUMN IF EXISTS access_level;

-- 3. Verificar reversão
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'tools_catalog'
ORDER BY ordinal_position;
