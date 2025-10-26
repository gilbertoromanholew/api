-- ============================================
-- 🧹 LIMPEZA DE POLÍTICAS DUPLICADAS
-- Data: 26/10/2025
-- ============================================

-- ✅ VERIFICADO: Nenhuma dessas políticas é referenciada no código
-- É seguro remover (são duplicatas criadas acidentalmente)

-- Remover políticas duplicadas
DROP POLICY IF EXISTS "service_manage_executions" ON tools_executions;
-- ↑ Duplicata de "service_role_full_access" (faz a mesma coisa)

DROP POLICY IF EXISTS "users_view_own_executions" ON tools_executions;
-- ↑ Duplicata de "users_select_own_executions" (faz a mesma coisa)

-- ============================================
-- ✅ POLÍTICAS FINAIS (3 apenas):
-- 1. users_select_own_executions (SELECT para authenticated)
-- 2. users_insert_own_executions (INSERT para authenticated)
-- 3. service_role_full_access (ALL para service_role)
-- ============================================

-- Verificar políticas restantes
SELECT
    policyname as policy,
    roles as roles,
    cmd as comando,
    qual as usando,
    with_check as verificacao
FROM pg_policies
WHERE tablename = 'tools_executions'
ORDER BY policyname;

-- ============================================
-- ✅ Resultado esperado após limpeza:
-- 
-- | policy                         | roles              | comando | usando                | verificacao           |
-- |--------------------------------|--------------------|---------|-----------------------|----------------------|
-- | service_role_full_access       | {service_role}     | ALL     | true                  | true                 |
-- | users_insert_own_executions    | {authenticated}    | INSERT  | null                  | (uid() = user_id)    |
-- | users_select_own_executions    | {authenticated}    | SELECT  | (uid() = user_id)     | null                 |
-- 
-- Total: 3 políticas (antes: 5)
-- ============================================
