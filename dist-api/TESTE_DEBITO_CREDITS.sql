-- ========================================
-- TESTE DE DÉBITO DE CRÉDITOS
-- ========================================
-- Execute este SQL ANTES e DEPOIS de usar uma ferramenta
-- para verificar se os créditos foram debitados corretamente

-- 1️⃣ VERIFICAR SALDO ATUAL
SELECT 
    user_id,
    bonus_credits AS "Créditos Bônus",
    purchased_credits AS "Créditos Comprados",
    (bonus_credits + purchased_credits) AS "Total Disponível",
    total_spent AS "Total Gasto",
    created_at AS "Criado em",
    updated_at AS "Atualizado em"
FROM economy_user_wallets
WHERE user_id = auth.uid();

-- 2️⃣ VERIFICAR ÚLTIMAS TRANSAÇÕES (últimas 5)
SELECT 
    id,
    type AS "Tipo",
    amount AS "Valor",
    description AS "Descrição",
    created_at AS "Data/Hora"
FROM economy_transactions
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;

-- 3️⃣ VERIFICAR EXECUÇÕES DE FERRAMENTAS (tools_executions)
SELECT 
    tool_id AS "ID Ferramenta",
    cost_in_points AS "Custo",
    success AS "Sucesso",
    execution_time_ms AS "Tempo (ms)",
    created_at AS "Data/Hora"
FROM tools_executions
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;

-- 4️⃣ RESUMO GERAL
SELECT 
    (SELECT COUNT(*) FROM economy_transactions WHERE user_id = auth.uid()) AS "Total de Transações",
    (SELECT COALESCE(SUM(ABS(amount)), 0) FROM economy_transactions WHERE user_id = auth.uid() AND type = 'debit') AS "Total Debitado",
    (SELECT COUNT(*) FROM tools_executions WHERE user_id = auth.uid()) AS "Ferramentas Executadas";
