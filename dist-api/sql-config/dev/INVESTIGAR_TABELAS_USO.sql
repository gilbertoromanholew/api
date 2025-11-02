-- ========================================
-- INVESTIGAR TABELAS DE USO E RELATÓRIOS
-- ========================================
-- Verificar quais tabelas deveriam ter dados e quais estão vazias

-- 1️⃣ VERIFICAR TABELA tools_executions (principal)
SELECT 
    'tools_executions' AS "Tabela",
    COUNT(*) AS "Total Registros",
    COUNT(DISTINCT user_id) AS "Usuários Únicos",
    COUNT(DISTINCT tool_id) AS "Ferramentas Usadas",
    MIN(created_at) AS "Primeira Execução",
    MAX(created_at) AS "Última Execução"
FROM tools_executions;

-- 2️⃣ VERIFICAR TABELA tool_usage_tracking (nova tabela de tracking)
SELECT 
    'tool_usage_tracking' AS "Tabela",
    COUNT(*) AS "Total Registros",
    COUNT(DISTINCT user_id) AS "Usuários Únicos",
    COUNT(DISTINCT tool_slug) AS "Ferramentas Usadas",
    MIN(created_at) AS "Primeiro Uso",
    MAX(created_at) AS "Último Uso"
FROM tool_usage_tracking;

-- 3️⃣ VERIFICAR ÚLTIMAS 10 EXECUÇÕES (tools_executions)
SELECT 
    id,
    user_id,
    tool_id,
    cost_in_points AS "Custo",
    success AS "Sucesso?",
    execution_time_ms AS "Tempo (ms)",
    created_at AS "Data/Hora"
FROM tools_executions
ORDER BY created_at DESC
LIMIT 10;

-- 4️⃣ VERIFICAR ÚLTIMAS 10 EXECUÇÕES (tool_usage_tracking)
SELECT 
    id,
    user_id,
    tool_slug,
    credits_used AS "Créditos",
    success AS "Sucesso?",
    error_message AS "Erro",
    created_at AS "Data/Hora"
FROM tool_usage_tracking
ORDER BY created_at DESC
LIMIT 10;

-- 5️⃣ VERIFICAR TRANSAÇÕES DE CRÉDITO (economy_transactions)
SELECT 
    'economy_transactions' AS "Tabela",
    COUNT(*) AS "Total",
    COUNT(CASE WHEN type = 'debit' THEN 1 END) AS "Débitos",
    COUNT(CASE WHEN type = 'credit' THEN 1 END) AS "Créditos",
    MIN(created_at) AS "Primeira",
    MAX(created_at) AS "Última"
FROM economy_transactions;

-- 6️⃣ ÚLTIMAS 10 TRANSAÇÕES
SELECT 
    id,
    user_id,
    type AS "Tipo",
    amount AS "Valor",
    description AS "Descrição",
    balance_before AS "Saldo Antes",
    balance_after AS "Saldo Depois",
    created_at AS "Data/Hora"
FROM economy_transactions
ORDER BY created_at DESC
LIMIT 10;

-- 7️⃣ VERIFICAR SE HÁ REGISTROS PARA SEU USUÁRIO
SELECT 
    (SELECT COUNT(*) FROM tools_executions WHERE user_id = auth.uid()) AS "tools_executions",
    (SELECT COUNT(*) FROM tool_usage_tracking WHERE user_id = auth.uid()) AS "tool_usage_tracking",
    (SELECT COUNT(*) FROM economy_transactions WHERE user_id = auth.uid()) AS "economy_transactions";

-- 8️⃣ VERIFICAR ESTRUTURA DA TABELA tools_executions
SELECT 
    column_name AS "Coluna",
    data_type AS "Tipo",
    is_nullable AS "Nulo?"
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'tools_executions'
ORDER BY ordinal_position;

-- 9️⃣ VERIFICAR ESTRUTURA DA TABELA tool_usage_tracking
SELECT 
    column_name AS "Coluna",
    data_type AS "Tipo",
    is_nullable AS "Nulo?"
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'tool_usage_tracking'
ORDER BY ordinal_position;
