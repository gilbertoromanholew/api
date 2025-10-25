-- ============================================
-- VERIFICAÇÃO COMPLETA DE SCHEMAS E TABELAS
-- ============================================

-- 1. Listar TODOS os schemas
SELECT 
  schema_name,
  CASE 
    WHEN schema_name IN ('pg_catalog', 'information_schema') THEN 'Sistema PostgreSQL'
    WHEN schema_name LIKE 'pg_%' THEN 'Sistema PostgreSQL'
    WHEN schema_name IN ('auth', 'storage', 'realtime', 'supabase_functions') THEN 'Sistema Supabase'
    ELSE 'Schema de Usuário'
  END as tipo
FROM information_schema.schemata
ORDER BY schema_name;

-- 2. Listar tabelas do schema PUBLIC
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND columns.table_name = tables.table_name) as total_colunas
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 3. Verificar se schema TOOLS existe
SELECT 
  schema_name,
  'Schema TOOLS ' || CASE WHEN schema_name = 'tools' THEN 'EXISTE ✅' ELSE 'NÃO EXISTE ❌' END as status
FROM information_schema.schemata
WHERE schema_name = 'tools';

-- 4. Verificar se schema ECONOMY existe
SELECT 
  schema_name,
  'Schema ECONOMY ' || CASE WHEN schema_name = 'economy' THEN 'EXISTE ✅' ELSE 'NÃO EXISTE ❌' END as status
FROM information_schema.schemata
WHERE schema_name = 'economy';

-- 5. Listar tabelas do schema TOOLS (se existir)
SELECT 
  table_schema,
  table_name,
  table_type,
  'Tabela no schema TOOLS' as observacao
FROM information_schema.tables
WHERE table_schema = 'tools'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 6. Listar tabelas do schema ECONOMY (se existir)
SELECT 
  table_schema,
  table_name,
  table_type,
  'Tabela no schema ECONOMY' as observacao
FROM information_schema.tables
WHERE table_schema = 'economy'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 7. Procurar tabelas com nome parecido em QUALQUER schema
SELECT 
  table_schema,
  table_name,
  'Possível tabela V7' as observacao
FROM information_schema.tables
WHERE (
  table_name LIKE '%catalog%' OR
  table_name LIKE '%execution%' OR
  table_name LIKE '%wallet%' OR
  table_name LIKE '%transaction%' OR
  table_name LIKE '%subscription%' OR
  table_name LIKE '%purchase%' OR
  table_name LIKE '%referral%'
)
AND table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name;

-- 8. Verificar tabelas V6 obsoletas (que deveriam ter sido deletadas)
SELECT 
  table_name,
  'TABELA V6 OBSOLETA - DELETAR!' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('tool_costs', 'tool_usage_stats', 'user_points', 'point_transactions')
ORDER BY table_name;
