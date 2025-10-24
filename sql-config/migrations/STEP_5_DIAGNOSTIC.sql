-- ============================================
-- 🔍 DIAGNÓSTICO: VERIFICAR ENUMs EXISTENTES
-- ============================================
-- Execute este SQL ANTES do PASSO 5
-- ============================================

-- Listar TODOS os ENUMs no banco
SELECT 
  n.nspname as schema,
  t.typname as enum_name,
  array_agg(e.enumlabel ORDER BY e.enumsortorder) as valores
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE t.typtype = 'e'
GROUP BY n.nspname, t.typname
ORDER BY n.nspname, t.typname;

-- ============================================
-- RESULTADO: Me envie o que aparecer aqui
-- ============================================
-- Isso vai mostrar TODOS os ENUMs, incluindo
-- qualquer conflito de nomes entre schemas
-- ============================================
