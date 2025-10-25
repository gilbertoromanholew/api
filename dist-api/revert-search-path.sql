-- ========================================
-- REVERTER search_path para o PADRÃO
-- ========================================
-- Execute este SQL para desfazer as alterações do fix-search-path.sql

-- 1. Remover search_path customizado do role authenticator
ALTER ROLE authenticator RESET search_path;

-- 2. Remover search_path customizado do role anon
ALTER ROLE anon RESET search_path;

-- 3. Remover search_path customizado do role authenticated
ALTER ROLE authenticated RESET search_path;

-- 4. Remover search_path customizado do role service_role
ALTER ROLE service_role RESET search_path;

-- 5. Recarregar configurações do PostgreSQL
SELECT pg_reload_conf();

-- ========================================
-- VERIFICAÇÃO: Confirmar que voltou ao padrão
-- ========================================
SELECT rolname, rolconfig 
FROM pg_roles 
WHERE rolname IN ('authenticator', 'anon', 'authenticated', 'service_role');

-- O search_path deve ter voltado ao padrão ou estar vazio para esses roles
