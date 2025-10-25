-- ============================================
-- AUDITORIA COMPLETA - V6 vs V7
-- Verificar inconsistências entre código e banco
-- ============================================

-- ========================================
-- 1. TABELAS V6 QUE AINDA EXISTEM (DEVEM SER 0)
-- ========================================

SELECT 
  '❌ TABELAS V6 OBSOLETAS AINDA EXISTEM' as alerta,
  table_schema,
  table_name,
  'DELETAR AGORA!' as acao
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'tool_costs',
    'tool_usage_stats', 
    'user_points',
    'point_transactions'
  )
ORDER BY table_name;

-- ========================================
-- 2. TABELAS DUPLICADAS (PUBLIC vs SCHEMAS)
-- ========================================

-- Verificar se purchases existe nos 2 lugares
SELECT 
  '⚠️ TABELA DUPLICADA: purchases' as alerta,
  'public' as schema_antigo,
  (SELECT COUNT(*) FROM public.purchases) as registros_public,
  'economy' as schema_novo,
  (SELECT COUNT(*) FROM economy.purchases) as registros_economy,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.purchases) = 0 THEN 'DROP TABLE public.purchases;'
    ELSE 'ATENÇÃO: Migrar dados antes de deletar'
  END as sql_recomendado
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'purchases'
);

-- ========================================
-- 3. VERIFICAR CAMPOS QUE NÃO EXISTEM
-- ========================================

-- economy.user_wallets - Verificar se tem campos V6
SELECT 
  '⚠️ CAMPOS INCORRETOS EM user_wallets' as alerta,
  column_name,
  data_type,
  'Campo não deveria existir na V7' as observacao
FROM information_schema.columns
WHERE table_schema = 'economy' 
  AND table_name = 'user_wallets'
  AND column_name IN (
    'total_credits',          -- NÃO EXISTE (é calculado)
    'purchased_credits',       -- NOME ERRADO (deveria ser purchased_points)
    'bonus_credits_limit'      -- NÃO EXISTE
  );

-- ========================================
-- 4. VERIFICAR SE FALTAM CAMPOS V7
-- ========================================

-- Campos que DEVEM existir em user_wallets
SELECT 
  '✅ CAMPOS OBRIGATÓRIOS V7' as status,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'economy' 
  AND table_name = 'user_wallets'
  AND column_name IN (
    'user_id',
    'bonus_credits',
    'purchased_points',       -- Deve ser este, NÃO purchased_credits
    'total_earned_bonus',
    'total_purchased',
    'total_spent',
    'pro_weekly_allowance',
    'last_allowance_date'
  )
ORDER BY ordinal_position;

-- Ver se falta algum
WITH required_columns AS (
  SELECT unnest(ARRAY[
    'user_id',
    'bonus_credits', 
    'purchased_points',
    'total_earned_bonus',
    'total_purchased',
    'total_spent',
    'pro_weekly_allowance',
    'last_allowance_date'
  ]) as required_name
),
existing_columns AS (
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = 'economy' 
    AND table_name = 'user_wallets'
)
SELECT 
  '❌ CAMPO FALTANDO' as alerta,
  required_name as campo_necessario,
  'Adicionar à tabela user_wallets' as acao
FROM required_columns
WHERE required_name NOT IN (SELECT column_name FROM existing_columns);

-- ========================================
-- 5. VERIFICAR CAMPOS DE transactions
-- ========================================

-- Deve ter point_type, NÃO credit_type
SELECT 
  '✅ VERIFICAÇÃO: transactions' as status,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'economy' 
  AND table_name = 'transactions'
  AND column_name IN ('point_type', 'credit_type', 'type', 'amount')
ORDER BY ordinal_position;

-- ========================================
-- 6. VERIFICAR CAMPOS DE executions  
-- ========================================

-- Deve ter success (boolean), NÃO status
SELECT 
  '✅ VERIFICAÇÃO: executions' as status,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'tools' 
  AND table_name = 'executions'
  AND column_name IN ('success', 'status', 'points_used', 'point_type_used')
ORDER BY ordinal_position;

-- ========================================
-- 7. VERIFICAR CAMPOS DE catalog
-- ========================================

-- Deve ter cost_in_points, NÃO cost
SELECT 
  '✅ VERIFICAÇÃO: catalog' as status,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'tools' 
  AND table_name = 'catalog'
  AND column_name IN ('cost_in_points', 'cost', 'is_active', 'slug', 'name')
ORDER BY ordinal_position;

-- ========================================
-- 8. CONTAGEM GERAL DE SCHEMAS
-- ========================================

SELECT 
  '📊 RESUMO GERAL' as secao,
  table_schema,
  COUNT(*) as total_tabelas,
  string_agg(table_name, ', ' ORDER BY table_name) as tabelas
FROM information_schema.tables
WHERE table_schema IN ('public', 'tools', 'economy', 'social')
  AND table_type = 'BASE TABLE'
GROUP BY table_schema
ORDER BY table_schema;

-- ========================================
-- 9. LISTAR VIEWS/FUNCTIONS QUE PODEM ESTAR QUEBRADAS
-- ========================================

-- Verificar se tem views antigas apontando para tabelas V6
SELECT 
  '⚠️ VIEWS/FUNCTIONS ANTIGAS' as alerta,
  table_schema,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_type IN ('VIEW', 'FOREIGN TABLE')
  AND (
    table_name LIKE '%user_points%' OR
    table_name LIKE '%point_transaction%' OR
    table_name LIKE '%tool_cost%' OR
    table_name LIKE '%tool_usage%'
  );

-- ========================================
-- 10. VERIFICAR REFERÊNCIAS (FOREIGN KEYS)
-- ========================================

-- Ver se tem FKs quebradas apontando para tabelas deletadas
SELECT
  '✅ FOREIGN KEYS VÁLIDAS' as status,
  tc.table_schema,
  tc.table_name, 
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema IN ('tools', 'economy', 'social')
ORDER BY tc.table_schema, tc.table_name;

-- ========================================
-- 11. SQL PARA LIMPEZA (SE NECESSÁRIO)
-- ========================================

-- Este bloco só roda se encontrar problemas
-- Execute manualmente apenas se a auditoria mostrar problemas

-- Exemplo: Deletar public.purchases se estiver vazia
-- DROP TABLE IF EXISTS public.purchases CASCADE;

-- Exemplo: Renomear coluna errada
-- ALTER TABLE economy.user_wallets RENAME COLUMN purchased_credits TO purchased_points;

-- Exemplo: Adicionar coluna faltante
-- ALTER TABLE economy.user_wallets ADD COLUMN pro_weekly_allowance INTEGER DEFAULT 20;
