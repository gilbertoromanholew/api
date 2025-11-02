-- ========================================
-- SUPER AUDITORIA - BANCO DE DADOS
-- ========================================
-- Este script analisa TODAS as tabelas relacionadas ao painel admin
-- Verifica: estrutura, RLS, índices, foreign keys, dados inconsistentes

-- ========================================
-- 1. TABELAS DO PAINEL ADMIN
-- ========================================

-- Listar todas as tabelas públicas
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ========================================
-- 2. ADMIN_ACCESS_LOGS - Análise Completa
-- ========================================

-- Estrutura da tabela
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'admin_access_logs'
ORDER BY ordinal_position;

-- Índices
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'admin_access_logs';

-- RLS Policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'admin_access_logs';

-- Estatísticas
SELECT 
    COUNT(*) as total_logs,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT ip) as unique_ips,
    COUNT(*) FILTER (WHERE authorized = true) as authorized_requests,
    COUNT(*) FILTER (WHERE authorized = false) as unauthorized_requests,
    MIN(timestamp) as first_log,
    MAX(timestamp) as last_log
FROM admin_access_logs;

-- Top 10 endpoints mais acessados
SELECT 
    endpoint,
    COUNT(*) as total_requests,
    COUNT(DISTINCT ip) as unique_ips,
    COUNT(*) FILTER (WHERE authorized = true) as authorized,
    COUNT(*) FILTER (WHERE authorized = false) as unauthorized
FROM admin_access_logs
GROUP BY endpoint
ORDER BY total_requests DESC
LIMIT 10;

-- ========================================
-- 3. ADMIN_AUDIT_LOG - Análise Completa
-- ========================================

-- Estrutura
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'admin_audit_log'
ORDER BY ordinal_position;

-- Índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'admin_audit_log';

-- RLS Policies
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'admin_audit_log';

-- Estatísticas
SELECT 
    COUNT(*) as total_actions,
    COUNT(DISTINCT admin_id) as unique_admins,
    COUNT(*) FILTER (WHERE action_type = 'user_edit') as user_edits,
    COUNT(*) FILTER (WHERE action_type = 'credit_change') as credit_changes,
    COUNT(*) FILTER (WHERE action_type = 'role_change') as role_changes,
    MIN(timestamp) as first_action,
    MAX(timestamp) as last_action
FROM admin_audit_log;

-- Ações por admin
SELECT 
    admin_id,
    COUNT(*) as total_actions,
    COUNT(DISTINCT action_type) as action_types,
    MAX(timestamp) as last_action
FROM admin_audit_log
GROUP BY admin_id
ORDER BY total_actions DESC;

-- ========================================
-- 4. PROFILES - Análise Admin
-- ========================================

-- Estrutura
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'profiles';

-- RLS Policies
SELECT policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'profiles';

-- Estatísticas de usuários
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE role = 'admin') as admins,
    COUNT(*) FILTER (WHERE role = 'user') as regular_users,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_users_7d,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_users_30d,
    AVG(credits) as avg_credits,
    MAX(credits) as max_credits
FROM profiles;

-- Verificar CPFs duplicados ou inválidos
SELECT 
    cpf,
    COUNT(*) as occurrences
FROM profiles
WHERE cpf IS NOT NULL
GROUP BY cpf
HAVING COUNT(*) > 1;

-- Verificar emails duplicados
SELECT 
    email,
    COUNT(*) as occurrences
FROM profiles
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;

-- ========================================
-- 5. TOOLS_USAGE - Análise
-- ========================================

-- Estrutura
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'tools_usage'
ORDER BY ordinal_position;

-- Estatísticas
SELECT 
    COUNT(*) as total_usage,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT tool_name) as unique_tools,
    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
    SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors
FROM tools_usage;

-- Top ferramentas
SELECT 
    tool_name,
    COUNT(*) as usage_count,
    COUNT(DISTINCT user_id) as unique_users
FROM tools_usage
GROUP BY tool_name
ORDER BY usage_count DESC;

-- ========================================
-- 6. ECONOMY_TRANSACTIONS - Análise
-- ========================================

-- Estrutura
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'economy_transactions'
ORDER BY ordinal_position;

-- Estatísticas
SELECT 
    COUNT(*) as total_transactions,
    COUNT(DISTINCT user_id) as unique_users,
    SUM(CASE WHEN transaction_type = 'debit' THEN amount ELSE 0 END) as total_debits,
    SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE 0 END) as total_credits,
    AVG(amount) as avg_amount
FROM economy_transactions;

-- Transações por tipo
SELECT 
    transaction_type,
    COUNT(*) as count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount
FROM economy_transactions
GROUP BY transaction_type;

-- ========================================
-- 7. VERIFICAÇÕES DE INTEGRIDADE
-- ========================================

-- Foreign Keys
SELECT
    tc.table_name, 
    kcu.column_name, 
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
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('admin_access_logs', 'admin_audit_log', 'tools_usage', 'economy_transactions')
ORDER BY tc.table_name;

-- Verificar logs órfãos (user_id não existe em profiles)
SELECT COUNT(*) as orphaned_logs
FROM admin_access_logs aal
LEFT JOIN profiles p ON aal.user_id = p.id
WHERE aal.user_id IS NOT NULL AND p.id IS NULL;

SELECT COUNT(*) as orphaned_audits
FROM admin_audit_log aal
LEFT JOIN profiles p ON aal.admin_id = p.id
WHERE p.id IS NULL;

-- ========================================
-- 8. PERFORMANCE - Slow Queries
-- ========================================

-- Verificar tamanho das tabelas
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('admin_access_logs', 'admin_audit_log', 'profiles', 'tools_usage', 'economy_transactions')
ORDER BY size_bytes DESC;

-- ========================================
-- 9. SEGURANÇA - RLS ENABLED?
-- ========================================

SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('admin_access_logs', 'admin_audit_log', 'profiles', 'tools_usage', 'economy_transactions');

-- ========================================
-- 10. RELATÓRIO FINAL
-- ========================================

SELECT 
    'admin_access_logs' as tabela,
    COUNT(*) as registros,
    pg_size_pretty(pg_total_relation_size('admin_access_logs')) as tamanho
FROM admin_access_logs
UNION ALL
SELECT 
    'admin_audit_log',
    COUNT(*),
    pg_size_pretty(pg_total_relation_size('admin_audit_log'))
FROM admin_audit_log
UNION ALL
SELECT 
    'profiles',
    COUNT(*),
    pg_size_pretty(pg_total_relation_size('profiles'))
FROM profiles
UNION ALL
SELECT 
    'tools_usage',
    COUNT(*),
    pg_size_pretty(pg_total_relation_size('tools_usage'))
FROM tools_usage
UNION ALL
SELECT 
    'economy_transactions',
    COUNT(*),
    pg_size_pretty(pg_total_relation_size('economy_transactions'))
FROM economy_transactions;
