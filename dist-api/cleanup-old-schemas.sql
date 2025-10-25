-- ========================================
-- LIMPEZA: Excluir schemas antigos vazios
-- ========================================
-- Como movemos todas as tabelas para public,
-- os schemas tools, economy, social ficaram vazios
-- Vamos excluí-los para manter o banco limpo

-- 1. Verificar se os schemas estão vazios
SELECT 
    schemaname,
    COUNT(*) as total_tables
FROM pg_tables 
WHERE schemaname IN ('tools', 'economy', 'social')
GROUP BY schemaname;

-- Se o resultado acima mostrar 0 tabelas, pode prosseguir:

-- 2. DROP dos schemas vazios
DROP SCHEMA IF EXISTS tools CASCADE;
DROP SCHEMA IF EXISTS economy CASCADE;
DROP SCHEMA IF EXISTS social CASCADE;

-- 3. Verificar que foram excluídos
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name IN ('tools', 'economy', 'social');

-- Deve retornar vazio (0 linhas)

-- ========================================
-- OPCIONAL: Limpar do db_schema no Coolify
-- ========================================
-- Depois de executar este SQL, volte no Coolify e atualize:
-- PGRST_DB_SCHEMAS="public,storage,graphql_public"
-- (Remover tools, economy, social)
