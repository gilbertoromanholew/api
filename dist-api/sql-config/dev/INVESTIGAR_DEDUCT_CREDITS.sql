-- ========================================
-- INVESTIGAR FUNÇÕES deduct_credits
-- ========================================

-- 1️⃣ LISTAR TODAS AS FUNÇÕES deduct_credits (pode haver múltiplas)
SELECT 
    n.nspname AS "Schema",
    p.proname AS "Nome da Função",
    pg_get_function_arguments(p.oid) AS "Argumentos",
    pg_get_functiondef(p.oid) AS "Definição Completa"
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'deduct_credits'
ORDER BY n.nspname;

-- 2️⃣ VERIFICAR SE HÁ MÚLTIPLAS VERSÕES
SELECT 
    n.nspname AS "Schema",
    p.proname AS "Nome",
    COUNT(*) AS "Quantidade"
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'deduct_credits'
GROUP BY n.nspname, p.proname;

-- 3️⃣ BUSCAR TEXTO 'purchased_points' NA DEFINIÇÃO
SELECT 
    n.nspname AS "Schema",
    p.proname AS "Função",
    CASE 
        WHEN pg_get_functiondef(p.oid) LIKE '%purchased_points%' 
        THEN '❌ AINDA USA purchased_points'
        ELSE '✅ Usa purchased_credits'
    END AS "Status"
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'deduct_credits';
