-- ============================================
-- 🔍 DIAGNÓSTICO COMPLETO DO BANCO DE DADOS
-- Data: 25/10/2025
-- Uso: Executar no Supabase SQL Editor
-- ============================================

-- ============================================
-- 1️⃣ VISÃO GERAL - TODAS AS TABELAS
-- ============================================

SELECT 
    schemaname as schema,
    tablename as tabela,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as tamanho
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename;

-- ============================================
-- 2️⃣ CONTAGEM DE REGISTROS POR TABELA
-- ============================================

SELECT 
    schemaname as schema,
    tablename as tabela,
    (xpath('/row/cnt/text()', xml_count))[1]::text::int as total_registros
FROM (
    SELECT 
        schemaname,
        tablename,
        query_to_xml(
            format('SELECT COUNT(*) as cnt FROM %I.%I', schemaname, tablename),
            false, true, ''
        ) as xml_count
    FROM pg_tables
    WHERE schemaname = 'public'
) t
ORDER BY total_registros DESC;

-- ============================================
-- 3️⃣ ESTRUTURA DETALHADA - TODAS AS COLUNAS
-- ============================================

SELECT 
    table_schema as schema,
    table_name as tabela,
    column_name as coluna,
    data_type as tipo,
    character_maximum_length as tamanho_max,
    column_default as valor_padrao,
    is_nullable as permite_null
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- ============================================
-- 4️⃣ CONSTRAINTS - PRIMARY KEYS
-- ============================================

SELECT
    tc.table_schema as schema,
    tc.table_name as tabela,
    tc.constraint_name as constraint,
    tc.constraint_type as tipo,
    kcu.column_name as coluna
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ============================================
-- 5️⃣ FOREIGN KEYS - RELACIONAMENTOS
-- ============================================

SELECT
    tc.table_schema as schema_origem,
    tc.table_name as tabela_origem,
    kcu.column_name as coluna_origem,
    ccu.table_schema as schema_destino,
    ccu.table_name as tabela_destino,
    ccu.column_name as coluna_destino,
    tc.constraint_name as constraint
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================
-- 6️⃣ ÍNDICES - PERFORMANCE
-- ============================================

SELECT
    schemaname as schema,
    tablename as tabela,
    indexname as indice,
    indexdef as definicao
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================
-- 7️⃣ RLS POLICIES - SEGURANÇA
-- ============================================

SELECT
    schemaname as schema,
    tablename as tabela,
    policyname as policy,
    permissive as tipo,
    roles as roles,
    cmd as comando,
    qual as usando,
    with_check as verificacao
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 8️⃣ TRIGGERS - AUTOMAÇÕES
-- ============================================

SELECT
    event_object_schema as schema,
    event_object_table as tabela,
    trigger_name as trigger,
    event_manipulation as evento,
    action_timing as momento,
    action_statement as acao
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================
-- 9️⃣ FUNCTIONS - FUNÇÕES CUSTOMIZADAS
-- ============================================

SELECT
    n.nspname as schema,
    p.proname as funcao,
    pg_get_function_result(p.oid) as retorno,
    pg_get_function_arguments(p.oid) as argumentos
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- ============================================
-- 🔟 ENUMS - TIPOS ENUMERADOS
-- ============================================

SELECT
    n.nspname as schema,
    t.typname as enum_name,
    e.enumlabel as valor
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;

-- ============================================
-- 1️⃣1️⃣ VERIFICAR TABELAS ESPECÍFICAS DO PROJETO
-- ============================================

-- Ferramentas
SELECT COUNT(*) as total_ferramentas FROM tools_catalog WHERE is_active = true;

-- Carteiras de usuários
SELECT COUNT(*) as total_carteiras FROM economy_user_wallets;

-- Conquistas ativas
SELECT COUNT(*) as total_conquistas FROM gamification_achievements WHERE is_active = true;

-- Usuários registrados
SELECT COUNT(*) as total_usuarios FROM profiles;

-- Códigos promocionais ativos
SELECT COUNT(*) as total_promo_codes FROM promo_codes WHERE status = 'active';

-- ============================================
-- 1️⃣2️⃣ VERIFICAR INTEGRIDADE REFERENCIAL
-- ============================================

-- Verificar se há carteiras órfãs (sem usuário)
SELECT COUNT(*) as carteiras_orfas
FROM economy_user_wallets w
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = w.user_id
);

-- Verificar se há execuções de ferramentas que não existem
SELECT COUNT(*) as execucoes_invalidas
FROM tools_executions e
WHERE NOT EXISTS (
    SELECT 1 FROM tools_catalog t WHERE t.id = e.tool_id
);

-- ============================================
-- 1️⃣3️⃣ ESTATÍSTICAS DE USO
-- ============================================

-- Top 5 ferramentas mais usadas
SELECT 
    t.name as ferramenta,
    COUNT(e.id) as total_execucoes,
    SUM(e.cost_in_points) as total_pontos_gastos
FROM tools_catalog t
LEFT JOIN tools_executions e ON t.id = e.tool_id
GROUP BY t.id, t.name
ORDER BY total_execucoes DESC
LIMIT 5;

-- Distribuição de saldo nas carteiras
SELECT 
    CASE 
        WHEN bonus_credits + purchased_points = 0 THEN '0 pontos'
        WHEN bonus_credits + purchased_points <= 50 THEN '1-50 pontos'
        WHEN bonus_credits + purchased_points <= 100 THEN '51-100 pontos'
        WHEN bonus_credits + purchased_points <= 500 THEN '101-500 pontos'
        ELSE '500+ pontos'
    END as faixa_saldo,
    COUNT(*) as total_usuarios
FROM economy_user_wallets
GROUP BY faixa_saldo
ORDER BY 
    CASE faixa_saldo
        WHEN '0 pontos' THEN 1
        WHEN '1-50 pontos' THEN 2
        WHEN '51-100 pontos' THEN 3
        WHEN '101-500 pontos' THEN 4
        ELSE 5
    END;

-- ============================================
-- 1️⃣4️⃣ VERIFICAR PERMISSÕES
-- ============================================

SELECT
    grantee as usuario,
    table_schema as schema,
    table_name as tabela,
    privilege_type as permissao
FROM information_schema.table_privileges
WHERE table_schema = 'public'
    AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;

-- ============================================
-- 1️⃣5️⃣ ÚLTIMAS ATIVIDADES
-- ============================================

-- Últimos 10 usuários registrados
SELECT 
    id,
    email,
    full_name,
    created_at,
    email_verified
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- Últimas 10 execuções de ferramentas
SELECT 
    e.executed_at,
    p.full_name as usuario,
    t.name as ferramenta,
    e.cost_in_points as custo,
    e.status
FROM tools_executions e
JOIN profiles p ON e.user_id = p.id
JOIN tools_catalog t ON e.tool_id = t.id
ORDER BY e.executed_at DESC
LIMIT 10;

-- Últimas 10 transações
SELECT 
    t.created_at,
    p.full_name as usuario,
    t.type as tipo,
    t.amount as valor,
    t.balance_after as saldo_apos,
    t.description
FROM economy_transactions t
JOIN profiles p ON t.user_id = p.id
ORDER BY t.created_at DESC
LIMIT 10;

-- ============================================
-- 🎯 FIM DO DIAGNÓSTICO
-- ============================================
