-- ========================================
-- VERIFICAR quais tabelas sobraram nos schemas
-- ========================================

-- 1. Ver todas as tabelas em tools
SELECT tablename FROM pg_tables WHERE schemaname = 'tools';

-- 2. Ver todas as tabelas em economy
SELECT tablename FROM pg_tables WHERE schemaname = 'economy';

-- 3. Ver todas as tabelas em social
SELECT tablename FROM pg_tables WHERE schemaname = 'social';

-- ========================================
-- EXCLUIR as tabelas restantes DOS SCHEMAS ANTIGOS
-- ========================================
-- Só execute depois de CONFIRMAR que as tabelas
-- já existem em public com os novos nomes

-- Tools
DROP TABLE IF EXISTS tools.catalog CASCADE;
DROP TABLE IF EXISTS tools.executions CASCADE;

-- Economy
DROP TABLE IF EXISTS economy.user_wallets CASCADE;
DROP TABLE IF EXISTS economy.transactions CASCADE;
DROP TABLE IF EXISTS economy.purchases CASCADE;
DROP TABLE IF EXISTS economy.subscriptions CASCADE;
DROP TABLE IF EXISTS economy.subscription_plans CASCADE;
DROP TABLE IF EXISTS economy.referral_rewards CASCADE;

-- Social
DROP TABLE IF EXISTS social.referrals CASCADE;
DROP TABLE IF EXISTS social.friendships CASCADE;
DROP TABLE IF EXISTS social.friend_requests CASCADE;
DROP TABLE IF EXISTS social.user_privacy_settings CASCADE;

-- ========================================
-- AGORA SIM: DROP dos schemas vazios
-- ========================================
DROP SCHEMA IF EXISTS tools CASCADE;
DROP SCHEMA IF EXISTS economy CASCADE;
DROP SCHEMA IF EXISTS social CASCADE;

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================
-- Confirmar que schemas foram excluídos
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name IN ('tools', 'economy', 'social');

-- Confirmar que tabelas existem em public
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%\_%' 
ORDER BY tablename;
