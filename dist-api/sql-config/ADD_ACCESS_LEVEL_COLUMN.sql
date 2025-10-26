/**
 * ========================================
 * MIGRAÇÃO: Adicionar coluna access_level
 * ========================================
 * 
 * Data: 2025-10-26
 * Objetivo: Clarificar lógica de acesso às ferramentas
 * 
 * ANTES (confuso):
 * - is_free_for_pro: false → NÃO é grátis para Pro (dupla negação)
 * 
 * DEPOIS (claro):
 * - access_level: 'free' → Todos podem usar (pagando créditos)
 * - access_level: 'professional' → Apenas planos profissionais
 */

-- ========================================
-- 1. ADICIONAR NOVA COLUNA
-- ========================================

ALTER TABLE tools_catalog
ADD COLUMN IF NOT EXISTS access_level VARCHAR(20) DEFAULT 'free';

-- ========================================
-- 2. MIGRAR DADOS EXISTENTES
-- ========================================

-- Ferramentas de Planejamento → Apenas profissionais
UPDATE tools_catalog
SET access_level = 'professional'
WHERE is_planning = true;

-- Todas as outras ferramentas → Disponíveis para todos
UPDATE tools_catalog
SET access_level = 'free'
WHERE is_planning = false OR is_planning IS NULL;

-- ========================================
-- 3. ADICIONAR CONSTRAINT
-- ========================================

ALTER TABLE tools_catalog
ADD CONSTRAINT check_access_level 
CHECK (access_level IN ('free', 'professional'));

-- ========================================
-- 4. ADICIONAR COMENTÁRIOS
-- ========================================

COMMENT ON COLUMN tools_catalog.access_level IS 
'Nível de acesso necessário: free (todos podem usar pagando créditos) ou professional (apenas planos profissionais)';

-- ========================================
-- 5. VERIFICAR MIGRAÇÃO
-- ========================================

SELECT 
  access_level,
  COUNT(*) as total,
  STRING_AGG(name, ', ' ORDER BY name) as ferramentas
FROM tools_catalog
WHERE is_active = true
GROUP BY access_level
ORDER BY access_level;

-- ========================================
-- 6. RESULTADOS ESPERADOS
-- ========================================

/**
 * Após migração, você deve ver:
 * 
 * access_level    | total | ferramentas
 * ----------------|-------|------------------------------------------
 * free            | 12    | Calculadoras, Validadores, Extratores
 * professional    | 3     | Planejamento Previdenciário, Trabalhista, Assistencial
 */
