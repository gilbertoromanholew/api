-- ========================================
-- ALTERNATIVA FINAL: Criar aliases em public
-- ========================================
-- Como o Supabase JS sempre adiciona 'public.' antes,
-- vamos criar tabelas/views DIRETO no schema public
-- que apontam para os schemas reais via FOREIGN TABLE

-- Opção mais simples: Mover TUDO para public
-- Execute este SQL para MOVER as tabelas dos schemas customizados para public

-- 1. MOVER tools.catalog → public.tools_catalog
ALTER TABLE tools.catalog SET SCHEMA public;
ALTER TABLE public.catalog RENAME TO tools_catalog;

-- 2. MOVER tools.executions → public.tools_executions
ALTER TABLE tools.executions SET SCHEMA public;
ALTER TABLE public.executions RENAME TO tools_executions;

-- 3. MOVER economy.user_wallets → public.economy_user_wallets
ALTER TABLE economy.user_wallets SET SCHEMA public;
ALTER TABLE public.user_wallets RENAME TO economy_user_wallets;

-- 4. MOVER economy.transactions → public.economy_transactions
ALTER TABLE economy.transactions SET SCHEMA public;
ALTER TABLE public.transactions RENAME TO economy_transactions;

-- 5. MOVER economy.purchases → public.economy_purchases
ALTER TABLE economy.purchases SET SCHEMA public;
ALTER TABLE public.purchases RENAME TO economy_purchases;

-- 6. MOVER economy.subscriptions → public.economy_subscriptions
ALTER TABLE economy.subscriptions SET SCHEMA public;
ALTER TABLE public.subscriptions RENAME TO economy_subscriptions;

-- 7. MOVER social.referrals → public.social_referrals
ALTER TABLE social.referrals SET SCHEMA public;
ALTER TABLE public.referrals RENAME TO social_referrals;

-- ========================================
-- VERIFICAÇÃO
-- ========================================
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%\_%' 
ORDER BY tablename;
