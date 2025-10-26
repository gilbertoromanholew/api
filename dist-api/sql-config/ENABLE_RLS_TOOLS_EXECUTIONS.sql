-- ============================================
-- 🔒 POLÍTICAS RLS PARA tools_executions
-- Data: 26/10/2025
-- Objetivo: Proteger execuções de ferramentas com RLS
-- ============================================

-- 1️⃣ Habilitar RLS na tabela
ALTER TABLE tools_executions ENABLE ROW LEVEL SECURITY;

-- 2️⃣ Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "users_select_own_executions" ON tools_executions;
DROP POLICY IF EXISTS "users_insert_own_executions" ON tools_executions;
DROP POLICY IF EXISTS "service_role_full_access" ON tools_executions;

-- ============================================
-- 3️⃣ POLÍTICA: SELECT (Leitura)
-- Usuários podem ver APENAS suas próprias execuções
-- ============================================
CREATE POLICY "users_select_own_executions"
ON tools_executions
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

-- ============================================
-- 4️⃣ POLÍTICA: INSERT (Criação)
-- Usuários podem criar APENAS com seu próprio user_id
-- ============================================
CREATE POLICY "users_insert_own_executions"
ON tools_executions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

-- ============================================
-- 5️⃣ POLÍTICA: SERVICE ROLE (Admin Total)
-- Service role tem acesso COMPLETO (para trackToolUsage)
-- ============================================
CREATE POLICY "service_role_full_access"
ON tools_executions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 6️⃣ VERIFICAR POLÍTICAS CRIADAS
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
WHERE tablename = 'tools_executions'
ORDER BY policyname;

-- ============================================
-- 7️⃣ TESTAR RLS (executar como usuário autenticado)
-- ============================================
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claims.sub TO 'eccb1a6b-ef70-4ab4-a245-001ba1d936a2';
-- 
-- SELECT COUNT(*) FROM tools_executions WHERE user_id = 'eccb1a6b-ef70-4ab4-a245-001ba1d936a2';
-- ✅ Deve retornar contagem das execuções do usuário
-- 
-- SELECT COUNT(*) FROM tools_executions WHERE user_id != 'eccb1a6b-ef70-4ab4-a245-001ba1d936a2';
-- ❌ Deve retornar 0 (bloqueado por RLS)

-- ============================================
-- ✅ FIM
-- ============================================
