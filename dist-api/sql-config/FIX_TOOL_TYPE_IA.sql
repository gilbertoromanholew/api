/**
 * ========================================
 * CORREÇÃO: Atualizar tool_type para ferramentas de IA
 * ========================================
 * 
 * Data: 2025-10-26
 * 
 * PROBLEMA:
 * - Ferramentas com slug começando com 'ia_' foram categorizadas como 'complementar'
 * - Porque a category não contém 'IA', e sim 'Validações' ou outras
 * 
 * SOLUÇÃO:
 * - Atualizar baseado no padrão do slug 'ia_%'
 */

-- Atualizar ferramentas que começam com 'ia_' para tipo 'ia'
UPDATE tools_catalog
SET tool_type = 'ia'
WHERE slug LIKE 'ia_%';

-- Verificar resultado
SELECT 
  tool_type,
  slug,
  name,
  category,
  is_planning,
  is_active
FROM tools_catalog
WHERE tool_type = 'ia'
ORDER BY slug;

-- Ver distribuição final
SELECT 
  tool_type,
  COUNT(*) as total,
  COUNT(CASE WHEN is_active = true THEN 1 END) as ativas
FROM tools_catalog
GROUP BY tool_type
ORDER BY tool_type;
