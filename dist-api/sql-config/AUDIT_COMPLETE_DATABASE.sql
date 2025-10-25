-- ============================================================================
-- AUDITORIA COMPLETA DO BANCO DE DADOS
-- Data: 25/10/2025
-- Descrição: Consulta TODAS as tabelas, colunas, índices, RLS, triggers, etc.
-- ============================================================================

-- ============================================================================
-- 1. LISTAR TODAS AS TABELAS DO SCHEMA PUBLIC
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  tableowner,
  tablespace,
  hasindexes,
  hasrules,
  hastriggers,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 2. LISTAR TODAS AS COLUNAS DE TODAS AS TABELAS
-- ============================================================================
SELECT 
  table_schema,
  table_name,
  column_name,
  ordinal_position,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- 3. LISTAR TODAS AS CONSTRAINTS (PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK)
-- ============================================================================
SELECT
  tc.table_schema,
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.update_rule,
  rc.delete_rule
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
LEFT JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
  AND tc.table_schema = rc.constraint_schema
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- ============================================================================
-- 4. LISTAR TODOS OS ÍNDICES
-- ============================================================================
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- 5. LISTAR TODAS AS POLÍTICAS RLS
-- ============================================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 6. LISTAR TODOS OS TRIGGERS
-- ============================================================================
SELECT
  trigger_schema,
  trigger_name,
  event_manipulation,
  event_object_schema,
  event_object_table,
  action_statement,
  action_timing,
  action_orientation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- 7. LISTAR TODAS AS FUNÇÕES/PROCEDURES
-- ============================================================================
SELECT
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  CASE
    WHEN p.prokind = 'f' THEN 'FUNCTION'
    WHEN p.prokind = 'p' THEN 'PROCEDURE'
    WHEN p.prokind = 'a' THEN 'AGGREGATE'
    WHEN p.prokind = 'w' THEN 'WINDOW'
  END as function_type,
  l.lanname as language
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN pg_language l ON p.prolang = l.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- ============================================================================
-- 8. LISTAR TODAS AS VIEWS
-- ============================================================================
SELECT
  table_schema,
  table_name as view_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- 9. LISTAR TODOS OS TIPOS ENUM
-- ============================================================================
SELECT
  n.nspname AS schema_name,
  t.typname AS enum_name,
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
GROUP BY n.nspname, t.typname
ORDER BY t.typname;

-- ============================================================================
-- 10. CONTAR REGISTROS DE TODAS AS TABELAS
-- ============================================================================
SELECT
  schemaname,
  relname as tablename,
  n_live_tup AS row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC, relname;

-- ============================================================================
-- 11. VERIFICAR PERMISSÕES DE ROLES (service_role, authenticated, anon)
-- ============================================================================
SELECT
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND grantee IN ('service_role', 'authenticated', 'anon', 'authenticator', 'postgres')
ORDER BY table_name, grantee, privilege_type;

-- ============================================================================
-- 12. VERIFICAR TAMANHO DAS TABELAS
-- ============================================================================
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- 13. VERIFICAR SEQUENCES
-- ============================================================================
SELECT
  schemaname,
  sequencename,
  last_value,
  start_value,
  increment_by,
  max_value,
  min_value,
  cycle
FROM pg_sequences
WHERE schemaname = 'public'
ORDER BY sequencename;

-- ============================================================================
-- 14. VERIFICAR RLS HABILITADO/DESABILITADO
-- ============================================================================
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- FIM DA AUDITORIA
-- ============================================================================
