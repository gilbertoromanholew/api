-- ============================================
-- 🔍 INSPECIONAR TABELA GAMIFICATION_ACHIEVEMENTS
-- ============================================
-- Script para ver todas as colunas e tipos de dados

-- Opção 1: Ver colunas com tipos de dados
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'gamification_achievements'
ORDER BY ordinal_position;

-- Opção 2: Ver estrutura completa (mais detalhada)
SELECT 
    a.attname AS column_name,
    pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
    a.attnotnull AS not_null,
    pg_get_expr(d.adbin, d.adrelid) AS default_value,
    col_description(a.attrelid, a.attnum) AS column_description
FROM pg_catalog.pg_attribute a
LEFT JOIN pg_catalog.pg_attrdef d ON (a.attrelid, a.attnum) = (d.adrelid, d.adnum)
WHERE a.attrelid = 'public.gamification_achievements'::regclass
AND a.attnum > 0
AND NOT a.attisdropped
ORDER BY a.attnum;

-- Opção 3: Ver constraints (restrições)
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
AND tc.table_name = 'gamification_achievements'
ORDER BY tc.constraint_type, tc.constraint_name;

-- Opção 4: Ver índices
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'gamification_achievements'
ORDER BY indexname;

-- Opção 5: Ver dados de exemplo (primeiras 5 linhas)
SELECT *
FROM public.gamification_achievements
LIMIT 5;
