-- ============================================
-- 🔄 MIGRAÇÃO: subscriptions → economy_subscriptions
-- Data: 25/10/2025
-- Objetivo: Renomear tabelas para seguir padrão economy_*
-- ============================================

-- ============================================
-- ETAPA 1: VERIFICAR ESTADO ATUAL
-- ============================================

-- 1.1. Ver tabelas existentes
SELECT tablename, pg_size_pretty(pg_total_relation_size('public.'||tablename)) as tamanho
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('subscriptions', 'economy_subscriptions', 'subscription_plans');

-- 1.2. Contar registros
SELECT 
    'subscriptions' as tabela,
    COUNT(*) as total
FROM subscriptions
UNION ALL
SELECT 
    'subscription_plans' as tabela,
    COUNT(*) as total
FROM subscription_plans;

-- ============================================
-- ETAPA 2: DELETAR economy_subscriptions (SE EXISTIR)
-- ============================================

-- 2.1. Verificar se existe
SELECT COUNT(*) as existe 
FROM pg_tables 
WHERE tablename = 'economy_subscriptions' 
  AND schemaname = 'public';

-- 2.2. Deletar se existir (pode dar erro se não existir - normal)
DROP TABLE IF EXISTS economy_subscriptions CASCADE;

-- 2.3. Confirmar exclusão
SELECT COUNT(*) as ainda_existe 
FROM pg_tables 
WHERE tablename = 'economy_subscriptions' 
  AND schemaname = 'public';
-- Deve retornar 0

-- ============================================
-- ETAPA 3: RENOMEAR subscriptions → economy_subscriptions
-- ============================================

-- 3.1. Renomear a tabela
ALTER TABLE subscriptions 
RENAME TO economy_subscriptions;

-- 3.2. Verificar renomeação
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE '%subscription%'
ORDER BY tablename;

-- Deve retornar:
-- economy_subscriptions
-- subscription_plans

-- ============================================
-- ETAPA 4: RENOMEAR subscription_plans → economy_subscription_plans
-- ============================================

-- 4.1. Renomear a tabela
ALTER TABLE subscription_plans 
RENAME TO economy_subscription_plans;

-- 4.2. Verificar renomeação
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE '%subscription%'
ORDER BY tablename;

-- Deve retornar:
-- economy_subscriptions
-- economy_subscription_plans

-- ============================================
-- ETAPA 5: ATUALIZAR FOREIGN KEYS (NOMES)
-- ============================================

-- 5.1. Ver foreign keys atuais
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('economy_subscriptions', 'economy_subscription_plans');

-- 5.2. Renomear constraint plan_id (se necessário)
-- As constraints foram renomeadas automaticamente, mas vamos garantir

-- ============================================
-- ETAPA 6: ATUALIZAR ÍNDICES
-- ============================================

-- 6.1. Ver índices atuais
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('economy_subscriptions', 'economy_subscription_plans')
ORDER BY tablename, indexname;

-- Índices são renomeados automaticamente

-- ============================================
-- ETAPA 7: ATUALIZAR RLS POLICIES (SE HOUVER)
-- ============================================

-- 7.1. Ver policies atuais
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('economy_subscriptions', 'economy_subscription_plans')
ORDER BY tablename, policyname;

-- Policies mantêm o mesmo nome, mas agora aplicadas às novas tabelas

-- ============================================
-- ETAPA 8: VERIFICAÇÃO FINAL
-- ============================================

-- 8.1. Listar todas as tabelas economy_*
SELECT 
    tablename as tabela,
    pg_size_pretty(pg_total_relation_size('public.'||tablename)) as tamanho
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'economy_%'
ORDER BY tablename;

-- Deve incluir:
-- economy_purchases
-- economy_subscription_plans (NOVO)
-- economy_subscriptions (NOVO)
-- economy_transactions
-- economy_user_wallets

-- 8.2. Verificar contagem de registros (deve ser igual)
SELECT 
    'economy_subscriptions' as tabela,
    COUNT(*) as total
FROM economy_subscriptions
UNION ALL
SELECT 
    'economy_subscription_plans' as tabela,
    COUNT(*) as total
FROM economy_subscription_plans;

-- 8.3. Verificar estrutura
SELECT 
    table_name as tabela,
    column_name as coluna,
    data_type as tipo
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('economy_subscriptions', 'economy_subscription_plans')
ORDER BY table_name, ordinal_position;

-- ============================================
-- 🎯 MIGRAÇÃO CONCLUÍDA NO BANCO
-- ============================================

-- PRÓXIMO PASSO: Atualizar backend (código Node.js)
-- Arquivo de referência: MIGRATION_BACKEND_SUBSCRIPTIONS.md
