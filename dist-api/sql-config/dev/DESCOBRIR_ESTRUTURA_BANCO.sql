-- ========================================
-- DESCOBRIR ESTRUTURA DAS TABELAS
-- ========================================
-- Execute este script para ver a estrutura real das tabelas

-- 1️⃣ VERIFICAR SE economy_transactions EXISTE
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'economy_transactions'
) AS "economy_transactions existe?";

-- 2️⃣ ESTRUTURA DE economy_transactions (se existir)
SELECT 
    column_name AS "Coluna", 
    data_type AS "Tipo",
    is_nullable AS "Nullable"
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'economy_transactions'
ORDER BY ordinal_position;

-- 3️⃣ VERIFICAR SE tool_usage_tracking EXISTE
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tool_usage_tracking'
) AS "tool_usage_tracking existe?";

-- 4️⃣ ESTRUTURA DE tool_usage_tracking (se existir)
SELECT 
    column_name AS "Coluna", 
    data_type AS "Tipo",
    is_nullable AS "Nullable"
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'tool_usage_tracking'
ORDER BY ordinal_position;

-- 5️⃣ LISTAR TODAS AS TABELAS DE ECONOMIA
SELECT 
    table_name AS "Tabela"
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name LIKE 'economy%' 
    OR table_name LIKE '%transaction%'
    OR table_name LIKE '%usage%'
    OR table_name LIKE '%tracking%'
)
ORDER BY table_name;

-- 6️⃣ VERIFICAR economy_user_wallets (deve existir)
SELECT 
    column_name AS "Coluna", 
    data_type AS "Tipo"
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'economy_user_wallets'
ORDER BY ordinal_position;
