-- ========================================
-- SOLUÇÃO DEFINITIVA: Configurar search_path via SQL
-- ========================================
-- Execute este SQL no Supabase SQL Editor
-- Isso vai fazer os schemas tools, economy, social serem
-- acessíveis sem precisar do prefixo 'public.'

-- 1. Configurar search_path para o role authenticator (usado pelo PostgREST)
ALTER ROLE authenticator SET search_path TO public, tools, economy, social, storage, graphql_public;

-- 2. Configurar search_path para o role anon (usuários não autenticados)
ALTER ROLE anon SET search_path TO public, tools, economy, social;

-- 3. Configurar search_path para o role authenticated (usuários autenticados)
ALTER ROLE authenticated SET search_path TO public, tools, economy, social;

-- 4. Configurar search_path para o role service_role (API admin)
ALTER ROLE service_role SET search_path TO public, tools, economy, social;

-- 5. Recarregar configurações do PostgreSQL
SELECT pg_reload_conf();

-- ========================================
-- VERIFICAÇÃO: Confirmar que funcionou
-- ========================================
-- Mostrar search_path atual de cada role
SELECT rolname, rolconfig 
FROM pg_roles 
WHERE rolname IN ('authenticator', 'anon', 'authenticated', 'service_role');

-- ========================================
-- IMPORTANTE: Depois de executar este SQL
-- ========================================
-- 1. Reinicie o container PostgREST no Coolify
-- 2. Aguarde 30-60 segundos
-- 3. Execute: node test-schema-access.js
-- 4. Deve funcionar! ✅
