/**
 * ========================================
 * VERIFICAR E REMOVER TODAS AS CONSTRAINTS DE CUSTOS
 * ========================================
 * 
 * Para garantir edição manual sem problemas
 */

-- ========================================
-- PARTE 1: VER TODAS AS CONSTRAINTS ATUAIS
-- ========================================

SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'tools_catalog'::regclass
ORDER BY conname;

-- ========================================
-- PARTE 2: REMOVER CONSTRAINTS DE VALIDAÇÃO DE CUSTOS
-- ========================================

-- Remover constraints antigas de planejamento
ALTER TABLE tools_catalog
DROP CONSTRAINT IF EXISTS check_planning_costs;

ALTER TABLE tools_catalog
DROP CONSTRAINT IF EXISTS check_planning_cost_logic;

ALTER TABLE tools_catalog
DROP CONSTRAINT IF EXISTS check_planning_base_cost;

ALTER TABLE tools_catalog
DROP CONSTRAINT IF EXISTS check_planning_full_cost;

ALTER TABLE tools_catalog
DROP CONSTRAINT IF EXISTS check_planning_pro_cost;

-- Remover constraints de custos normais (se existirem)
ALTER TABLE tools_catalog
DROP CONSTRAINT IF EXISTS check_cost_in_points;

ALTER TABLE tools_catalog
DROP CONSTRAINT IF EXISTS check_positive_costs;

-- ========================================
-- PARTE 3: VERIFICAR O QUE SOBROU
-- ========================================

SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'tools_catalog'::regclass
  AND contype = 'c'  -- Apenas CHECK constraints
ORDER BY conname;

-- ========================================
-- TIPOS DE CONSTRAINTS:
-- ========================================
-- p = PRIMARY KEY
-- u = UNIQUE
-- f = FOREIGN KEY
-- c = CHECK
-- t = TRIGGER
-- x = EXCLUSION

-- ✅ Constraints SEGURAS (devem permanecer):
-- - PRIMARY KEY (tools_catalog_pkey)
-- - UNIQUE (tools_catalog_slug_key)
-- - check_tool_type (validação de 'planejamento', 'ia', 'complementar')
-- - check_access_level (validação de 'free', 'professional')

-- ❌ Constraints REMOVIDAS (bloqueavam edição):
-- - check_planning_costs
-- - check_planning_cost_logic
-- - Qualquer outra que valide valores numéricos de custos

SELECT '✅ Constraints de validação de custos removidas!' as status;
