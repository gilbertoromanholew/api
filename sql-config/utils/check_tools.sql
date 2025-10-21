-- ============================================
-- VERIFICAR FERRAMENTAS NO BANCO
-- ============================================

-- Ver TODAS as ferramentas (incluindo inativas)
SELECT 
    category,
    tool_name,
    display_name,
    points_cost,
    is_active
FROM tool_costs
ORDER BY category, points_cost DESC, display_name;

-- Resumo completo
SELECT 
    category,
    COUNT(*) as total,
    SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as ativas,
    SUM(CASE WHEN NOT is_active THEN 1 ELSE 0 END) as inativas,
    SUM(points_cost) as pontos_total
FROM tool_costs
GROUP BY category
ORDER BY category;
