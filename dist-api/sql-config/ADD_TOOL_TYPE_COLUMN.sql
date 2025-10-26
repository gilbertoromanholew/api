/**
 * ========================================
 * MIGRAÇÃO: Adicionar coluna tool_type
 * ========================================
 * 
 * Data: 2025-10-26
 * Objetivo: Criar coluna dedicada para tipo de ferramenta
 * 
 * PROBLEMA ATUAL:
 * - Tipo da ferramenta era definido por is_planning + category
 * - Lógica complexa e espalhada pelo código
 * - Dificulta manutenção e filtros
 * 
 * SOLUÇÃO:
 * - Nova coluna: tool_type VARCHAR(50)
 * - Valores: 'planejamento', 'ia', 'complementar'
 * - Constraint CHECK para validar valores
 * - Popular automaticamente baseado em lógica atual
 * 
 * VANTAGENS:
 * ✅ Tipo explícito e independente do slug
 * ✅ Facilita queries e filtros
 * ✅ Permite ferramentas IA que também são planejamento
 * ✅ Melhora Hall da Fama e estatísticas
 * ✅ Código mais limpo e manutenível
 */

-- ========================================
-- PARTE 1: ADICIONAR COLUNA tool_type
-- ========================================

ALTER TABLE tools_catalog
ADD COLUMN IF NOT EXISTS tool_type VARCHAR(50);

-- ========================================
-- PARTE 2: POPULAR DADOS BASEADO EM LÓGICA ATUAL
-- ========================================

-- PLANEJAMENTO: Ferramentas com is_planning = true
UPDATE tools_catalog
SET tool_type = 'planejamento'
WHERE is_planning = true;

-- IA: Ferramentas com categoria contendo 'IA' (case insensitive)
UPDATE tools_catalog
SET tool_type = 'ia'
WHERE is_planning = false
  AND (
    category ILIKE '%IA%'
    OR category ILIKE '%inteligência artificial%'
    OR category ILIKE '%inteligencia artificial%'
  );

-- COMPLEMENTAR: Todas as outras ferramentas
UPDATE tools_catalog
SET tool_type = 'complementar'
WHERE tool_type IS NULL;

-- ========================================
-- PARTE 3: ADICIONAR CONSTRAINT
-- ========================================

-- Tornar NOT NULL (agora que todos têm valor)
ALTER TABLE tools_catalog
ALTER COLUMN tool_type SET NOT NULL;

-- Adicionar constraint CHECK para validar valores
ALTER TABLE tools_catalog
ADD CONSTRAINT check_tool_type 
CHECK (tool_type IN ('planejamento', 'ia', 'complementar'));

-- ========================================
-- PARTE 4: CRIAR ÍNDICE PARA PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_tools_catalog_tool_type 
ON tools_catalog(tool_type);

-- Índice composto para queries com is_active
CREATE INDEX IF NOT EXISTS idx_tools_catalog_type_active 
ON tools_catalog(tool_type, is_active);

-- ========================================
-- PARTE 5: VERIFICAÇÃO
-- ========================================

-- Ver distribuição por tipo
SELECT 
  tool_type,
  COUNT(*) as total,
  COUNT(CASE WHEN is_active = true THEN 1 END) as ativas,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inativas
FROM tools_catalog
GROUP BY tool_type
ORDER BY tool_type;

-- Ver alguns exemplos de cada tipo
SELECT 
  tool_type,
  slug,
  name,
  category,
  is_planning,
  is_active
FROM tools_catalog
ORDER BY tool_type, slug
LIMIT 20;

-- ========================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ========================================

COMMENT ON COLUMN tools_catalog.tool_type IS 
'Tipo da ferramenta: planejamento (ferramentas de planejamento), ia (ferramentas com IA), complementar (demais ferramentas)';

-- ========================================
-- ROLLBACK (se necessário)
-- ========================================

/**
 * Para reverter esta migração, execute:
 * 
 * DROP INDEX IF EXISTS idx_tools_catalog_type_active;
 * DROP INDEX IF EXISTS idx_tools_catalog_tool_type;
 * ALTER TABLE tools_catalog DROP CONSTRAINT IF EXISTS check_tool_type;
 * ALTER TABLE tools_catalog DROP COLUMN IF EXISTS tool_type;
 */
