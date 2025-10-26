/**
 * ========================================
 * ROLLBACK: Sistema de Precificação
 * ========================================
 * 
 * ⚠️ ATENÇÃO: Execute APENAS se precisar desfazer a migração
 * 
 * Este script:
 * 1. Remove colunas adicionadas
 * 2. Restaura nomes antigos de colunas
 * 3. Remove tabela tools_usage_monthly
 * 4. Remove functions SQL
 */

-- ========================================
-- 1. REMOVER FUNCTIONS
-- ========================================

DROP FUNCTION IF EXISTS increment_tool_usage(UUID, UUID);
DROP FUNCTION IF EXISTS get_monthly_usage(UUID, UUID);

-- ========================================
-- 2. REMOVER TABELA DE CONTROLE MENSAL
-- ========================================

DROP TABLE IF EXISTS tools_usage_monthly CASCADE;

-- ========================================
-- 3. REMOVER COLUNAS DE CUSTO DIFERENCIADO
-- ========================================

ALTER TABLE tools_catalog
DROP COLUMN IF EXISTS cost_free_plan,
DROP COLUMN IF EXISTS cost_stage_plan,
DROP COLUMN IF EXISTS cost_professional_plan,
DROP COLUMN IF EXISTS planning_lite_cost_pro;

-- ========================================
-- 4. RESTAURAR NOMES ANTIGOS DAS COLUNAS
-- ========================================

ALTER TABLE tools_catalog
RENAME COLUMN planning_lite_cost_free TO planning_base_cost;

ALTER TABLE tools_catalog
RENAME COLUMN planning_premium_cost_free TO planning_full_cost;

ALTER TABLE tools_catalog
RENAME COLUMN planning_premium_cost_pro TO planning_pro_overflow_cost;

-- ========================================
-- 5. VERIFICAR ROLLBACK
-- ========================================

SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'tools_catalog'
ORDER BY ordinal_position;

-- ========================================
-- 6. RESULTADO ESPERADO
-- ========================================

/**
 * Após rollback, a estrutura deve estar como antes:
 * 
 * ✅ planning_base_cost (restaurado)
 * ✅ planning_full_cost (restaurado)
 * ✅ planning_pro_overflow_cost (restaurado)
 * ❌ cost_free_plan (removido)
 * ❌ cost_stage_plan (removido)
 * ❌ cost_professional_plan (removido)
 * ❌ planning_lite_cost_free (removido)
 * ❌ planning_premium_cost_free (removido)
 * ❌ planning_lite_cost_pro (removido)
 * ❌ tools_usage_monthly (removida)
 */

-- ========================================
-- FIM DO ROLLBACK
-- ========================================
