-- ========================================
-- FASE 7.1: Inventário de Ferramentas V9
-- ========================================
-- Data: 26 de outubro de 2025
-- Objetivo: Listar todas ferramentas em tools_catalog e comparar com src/tools/

-- 1. Listar todas as ferramentas ativas do catálogo
SELECT 
    id,
    slug,
    name,
    tool_type,
    category,
    cost_in_points,
    is_active,
    display_order,
    created_at
FROM tools_catalog
WHERE is_active = true
ORDER BY tool_type, display_order;

-- 2. Contar ferramentas por tipo
SELECT 
    tool_type,
    COUNT(*) as total,
    SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as ativas,
    SUM(CASE WHEN is_active THEN 0 ELSE 1 END) as inativas
FROM tools_catalog
GROUP BY tool_type
ORDER BY tool_type;

-- 3. Listar ferramentas com custo zero (podem precisar de ajuste)
SELECT 
    slug,
    name,
    cost_in_points,
    tool_type
FROM tools_catalog
WHERE cost_in_points = 0 OR cost_in_points IS NULL
ORDER BY slug;

-- 4. Ferramentas mais caras (top 10)
SELECT 
    slug,
    name,
    cost_in_points,
    tool_type
FROM tools_catalog
WHERE is_active = true
ORDER BY cost_in_points DESC
LIMIT 10;

-- 5. Verificar se há slugs duplicados
SELECT 
    slug,
    COUNT(*) as duplicatas
FROM tools_catalog
GROUP BY slug
HAVING COUNT(*) > 1;

-- ========================================
-- FERRAMENTAS CONHECIDAS EM V9:
-- ========================================
-- ✅ exemplo-test (código existe)
-- ✅ calculadora-simples (código existe)
-- ✅ conversor-moeda (código existe)
-- ✅ gerador-pdf (código existe)
--
-- PRÓXIMO: Comparar esta lista com resultado da query acima
-- para identificar ferramentas que precisam ser criadas
