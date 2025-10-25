-- ============================================================================
-- GET ALL TABLES AND COLUMNS - Lista todas as tabelas e colunas do banco
-- Data: 25/10/2025
-- Objetivo: Referência completa para evitar erros de nomes/tipos
-- ============================================================================

-- ============================================================================
-- QUERY PRINCIPAL: TODAS AS TABELAS COM TODAS AS COLUNAS
-- ============================================================================

SELECT 
  c.table_schema AS schema,
  c.table_name AS tabela,
  c.ordinal_position AS "#",
  c.column_name AS coluna,
  CASE 
    WHEN c.character_maximum_length IS NOT NULL 
    THEN c.data_type || '(' || c.character_maximum_length || ')'
    WHEN c.numeric_precision IS NOT NULL
    THEN c.data_type || '(' || c.numeric_precision || 
         CASE WHEN c.numeric_scale IS NOT NULL THEN ',' || c.numeric_scale ELSE '' END || ')'
    ELSE c.data_type
  END AS tipo_completo,
  CASE 
    WHEN c.is_nullable = 'YES' THEN 'NULL'
    ELSE 'NOT NULL'
  END AS nullable,
  CASE 
    WHEN c.column_default IS NOT NULL 
    THEN LEFT(c.column_default, 100)
    ELSE '-'
  END AS default_value,
  CASE 
    WHEN pk.column_name IS NOT NULL THEN '🔑 PK'
    WHEN fk.column_name IS NOT NULL THEN '🔗 FK'
    WHEN uq.column_name IS NOT NULL THEN '⭐ UQ'
    ELSE ''
  END AS constraint_type,
  CASE 
    WHEN fk.column_name IS NOT NULL 
    THEN fk.foreign_table_name || '.' || fk.foreign_column_name
    ELSE ''
  END AS referencia
FROM information_schema.columns c

-- Identificar PRIMARY KEYs
LEFT JOIN (
  SELECT 
    kcu.table_schema,
    kcu.table_name,
    kcu.column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  WHERE tc.constraint_type = 'PRIMARY KEY'
) pk ON c.table_schema = pk.table_schema 
    AND c.table_name = pk.table_name 
    AND c.column_name = pk.column_name

-- Identificar FOREIGN KEYs
LEFT JOIN (
  SELECT 
    kcu.table_schema,
    kcu.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
) fk ON c.table_schema = fk.table_schema 
    AND c.table_name = fk.table_name 
    AND c.column_name = fk.column_name

-- Identificar UNIQUE constraints
LEFT JOIN (
  SELECT 
    kcu.table_schema,
    kcu.table_name,
    kcu.column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  WHERE tc.constraint_type = 'UNIQUE'
) uq ON c.table_schema = uq.table_schema 
    AND c.table_name = uq.table_name 
    AND c.column_name = uq.column_name

WHERE c.table_schema IN ('public', 'auth')
ORDER BY 
  c.table_schema,
  c.table_name,
  c.ordinal_position;

-- ============================================================================
-- RESUMO POR TABELA - Contagem de colunas
-- ============================================================================

SELECT 
  table_schema AS schema,
  table_name AS tabela,
  COUNT(*) AS total_colunas,
  COUNT(CASE WHEN is_nullable = 'NO' THEN 1 END) AS colunas_obrigatorias,
  COUNT(CASE WHEN is_nullable = 'YES' THEN 1 END) AS colunas_opcionais
FROM information_schema.columns
WHERE table_schema IN ('public', 'auth')
GROUP BY table_schema, table_name
ORDER BY table_schema, table_name;

-- ============================================================================
-- TIPOS DE DADOS UTILIZADOS - Estatística
-- ============================================================================

SELECT 
  data_type AS tipo_de_dado,
  COUNT(*) AS quantidade_colunas,
  string_agg(DISTINCT table_name, ', ' ORDER BY table_name) AS tabelas_que_usam
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY data_type
ORDER BY COUNT(*) DESC;

-- ============================================================================
-- COLUNAS COM MESMO NOME EM MÚLTIPLAS TABELAS
-- ============================================================================

SELECT 
  column_name AS nome_coluna,
  COUNT(DISTINCT table_name) AS quantidade_tabelas,
  string_agg(DISTINCT table_name, ', ' ORDER BY table_name) AS tabelas,
  COUNT(DISTINCT data_type) AS tipos_diferentes
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY column_name
HAVING COUNT(DISTINCT table_name) > 1
ORDER BY COUNT(DISTINCT table_name) DESC;

-- ============================================================================
-- VERIFICAR INCONSISTÊNCIAS - Colunas com mesmo nome mas tipos diferentes
-- ============================================================================

SELECT 
  column_name AS nome_coluna,
  data_type AS tipo,
  string_agg(DISTINCT table_name, ', ' ORDER BY table_name) AS tabelas
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN (
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    GROUP BY column_name
    HAVING COUNT(DISTINCT data_type) > 1
  )
GROUP BY column_name, data_type
ORDER BY column_name, data_type;

-- ============================================================================
-- ENUMS - Tipos customizados
-- ============================================================================

SELECT
  t.typname AS nome_enum,
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS valores_possiveis
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;

-- ============================================================================
-- TABELA: auth.users - Estrutura completa
-- ============================================================================

SELECT 
  ordinal_position AS "#",
  column_name AS coluna,
  CASE 
    WHEN character_maximum_length IS NOT NULL 
    THEN data_type || '(' || character_maximum_length || ')'
    ELSE data_type
  END AS tipo,
  CASE 
    WHEN is_nullable = 'YES' THEN 'NULL'
    ELSE 'NOT NULL'
  END AS nullable,
  CASE 
    WHEN column_default IS NOT NULL 
    THEN LEFT(column_default, 80)
    ELSE '-'
  END AS default_value
FROM information_schema.columns
WHERE table_schema = 'auth' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- ============================================================================
-- TABELA: public.profiles - Estrutura completa
-- ============================================================================

SELECT 
  ordinal_position AS "#",
  column_name AS coluna,
  CASE 
    WHEN character_maximum_length IS NOT NULL 
    THEN data_type || '(' || character_maximum_length || ')'
    ELSE data_type
  END AS tipo,
  CASE 
    WHEN is_nullable = 'YES' THEN 'NULL'
    ELSE 'NOT NULL'
  END AS nullable,
  CASE 
    WHEN column_default IS NOT NULL 
    THEN LEFT(column_default, 80)
    ELSE '-'
  END AS default_value
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================================================
-- TODAS AS TABELAS PUBLIC - Lista simples
-- ============================================================================

SELECT 
  LPAD(ROW_NUMBER() OVER (ORDER BY tablename)::TEXT, 2, '0') AS "#",
  tablename AS nome_tabela,
  tableowner AS owner,
  CASE WHEN rowsecurity THEN '✅' ELSE '❌' END AS rls
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- FIM DAS QUERIES
-- ============================================================================
