-- ============================================
-- 🔐 PROTEÇÃO RLS PARA PAINEL ADMINISTRATIVO
-- Data: 27/10/2025
-- Versão: V7
-- ============================================

-- ⚠️ IMPORTANTE: Execute este script no Supabase SQL Editor
-- Este script configura Row Level Security (RLS) para proteger
-- a coluna 'role' da tabela 'profiles' contra alterações não autorizadas

-- ============================================
-- VERIFICAÇÕES INICIAIS
-- ============================================

-- 1️⃣ Verificar se RLS está habilitado
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as "RLS Habilitado?"
FROM pg_tables 
WHERE tablename = 'profiles';

-- Resultado esperado: rowsecurity = true
-- Se false, prossiga para a seção de habilitação

-- 2️⃣ Verificar políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 3️⃣ Verificar constraint de valores válidos
SELECT 
    conname as "Nome do Constraint",
    contype as "Tipo",
    pg_get_constraintdef(oid) as "Definição"
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
AND conname LIKE '%role%';

-- ============================================
-- HABILITAÇÃO DE RLS
-- ============================================

-- 🔒 Habilitar Row Level Security na tabela profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ✅ Confirmar habilitação
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- ============================================
-- CRIAR CONSTRAINT PARA VALORES VÁLIDOS
-- ============================================

-- 🛡️ Garantir que apenas roles válidas sejam aceitas
-- Remove constraint antiga se existir
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS valid_roles;

-- Criar novo constraint
ALTER TABLE profiles 
ADD CONSTRAINT valid_roles 
CHECK (role IN ('user', 'moderator', 'admin'));

-- ✅ Confirmar criação
SELECT 
    conname,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
AND conname = 'valid_roles';

-- ============================================
-- POLÍTICAS RLS - LIMPEZA
-- ============================================

-- 🧹 Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "users_select_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "admins_select_all_profiles" ON profiles;
DROP POLICY IF EXISTS "admins_update_all_profiles" ON profiles;
DROP POLICY IF EXISTS "prevent_role_change_by_users" ON profiles;
DROP POLICY IF EXISTS "admins_can_change_roles" ON profiles;
DROP POLICY IF EXISTS "service_role_full_access" ON profiles;

-- ============================================
-- POLÍTICAS RLS - SELECT (Leitura)
-- ============================================

-- 📖 Usuários podem ver APENAS seu próprio perfil
CREATE POLICY "users_select_own_profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- 📖 Admins podem ver TODOS os perfis
CREATE POLICY "admins_select_all_profiles" ON profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ============================================
-- POLÍTICAS RLS - INSERT (Criação)
-- ============================================

-- ➕ Usuários podem criar apenas seu próprio perfil
-- E APENAS com role = 'user' (default)
CREATE POLICY "users_insert_own_profile" ON profiles
    FOR INSERT
    WITH CHECK (
        auth.uid() = id 
        AND role = 'user' -- ❌ Não permite criar como admin/moderator
    );

-- ============================================
-- POLÍTICAS RLS - UPDATE (Atualização)
-- ============================================

-- ✏️ Usuários podem atualizar seu próprio perfil
-- MAS NÃO PODEM ALTERAR O ROLE
CREATE POLICY "users_update_own_profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id 
        AND role = (
            -- ✅ Role deve permanecer o mesmo
            SELECT role FROM profiles WHERE id = auth.uid()
        )
    );

-- 👑 Admins podem atualizar QUALQUER perfil
-- INCLUINDO alteração de role
CREATE POLICY "admins_update_all_profiles" ON profiles
    FOR UPDATE
    USING (
        -- Admin pode atualizar qualquer perfil
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    )
    WITH CHECK (
        -- Admin pode definir qualquer role válida
        role IN ('user', 'moderator', 'admin')
    );

-- ============================================
-- POLÍTICA ESPECIAL PARA SERVICE ROLE
-- ============================================

-- 🔑 Service Role (backend com SERVICE_ROLE_KEY) tem acesso total
-- Necessário para operações do backend (registro, etc)
CREATE POLICY "service_role_full_access" ON profiles
    FOR ALL
    USING (
        -- Service role bypass RLS (auth.jwt() é null quando usa SERVICE_ROLE_KEY)
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
        OR auth.jwt()->>'role' = 'service_role'
    );

-- ============================================
-- TABELA DE AUDITORIA - MUDANÇAS DE ROLE
-- ============================================

-- 📋 Criar tabela para rastrear mudanças de role
CREATE TABLE IF NOT EXISTS admin_role_changes (
    id SERIAL PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    old_role VARCHAR(20) NOT NULL,
    new_role VARCHAR(20) NOT NULL,
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_role_changes_admin 
ON admin_role_changes(admin_id);

CREATE INDEX IF NOT EXISTS idx_role_changes_target 
ON admin_role_changes(target_user_id);

CREATE INDEX IF NOT EXISTS idx_role_changes_date 
ON admin_role_changes(created_at DESC);

-- Comentário descritivo
COMMENT ON TABLE admin_role_changes IS 'Auditoria de mudanças de role de usuários. Registra quem alterou, quando e por quê.';

-- ============================================
-- TRIGGER DE AUDITORIA
-- ============================================

-- 🔔 Função que registra mudanças de role
CREATE OR REPLACE FUNCTION log_role_changes()
RETURNS TRIGGER AS $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Detectar quem está fazendo a mudança
    admin_user_id := auth.uid();
    
    -- Se SERVICE_ROLE_KEY, não registrar admin_id
    IF current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' THEN
        admin_user_id := NULL;
    END IF;
    
    -- Registrar mudança se role foi alterada
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        INSERT INTO admin_role_changes (
            admin_id,
            target_user_id,
            old_role,
            new_role,
            created_at
        ) VALUES (
            admin_user_id,
            NEW.id,
            OLD.role,
            NEW.role,
            NOW()
        );
        
        -- Log para console (visível no Supabase Logs)
        RAISE NOTICE 'Role changed for user % from % to % by admin %', 
            NEW.id, OLD.role, NEW.role, COALESCE(admin_user_id::text, 'SERVICE_ROLE');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS role_change_audit ON profiles;

-- Criar trigger que executa APÓS UPDATE
CREATE TRIGGER role_change_audit
    AFTER UPDATE ON profiles
    FOR EACH ROW
    WHEN (OLD.role IS DISTINCT FROM NEW.role)
    EXECUTE FUNCTION log_role_changes();

-- ============================================
-- POLÍTICA RLS PARA TABELA DE AUDITORIA
-- ============================================

-- Habilitar RLS na tabela de auditoria
ALTER TABLE admin_role_changes ENABLE ROW LEVEL SECURITY;

-- 📖 Apenas admins podem ver histórico de mudanças
CREATE POLICY "admins_view_role_changes" ON admin_role_changes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ❌ Ninguém pode modificar registros de auditoria
-- (apenas INSERT via trigger, nunca UPDATE/DELETE)
CREATE POLICY "prevent_audit_modifications" ON admin_role_changes
    FOR UPDATE
    USING (false);

CREATE POLICY "prevent_audit_deletions" ON admin_role_changes
    FOR DELETE
    USING (false);

-- ✅ Service role pode inserir (via trigger)
CREATE POLICY "service_role_insert_audit" ON admin_role_changes
    FOR INSERT
    WITH CHECK (true); -- Trigger sempre pode inserir

-- ============================================
-- VERIFICAÇÕES FINAIS
-- ============================================

-- ✅ Confirmar políticas criadas
SELECT 
    policyname as "Política",
    cmd as "Comando",
    CASE 
        WHEN policyname LIKE '%admin%' THEN '👑 Admin'
        WHEN policyname LIKE '%user%' THEN '👤 Usuário'
        WHEN policyname LIKE '%service%' THEN '🔑 Service Role'
        ELSE '❓ Outro'
    END as "Tipo"
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- ✅ Confirmar trigger criado
SELECT 
    tgname as "Trigger Name",
    tgtype as "Tipo",
    tgenabled as "Habilitado?"
FROM pg_trigger
WHERE tgrelid = 'profiles'::regclass
AND tgname = 'role_change_audit';

-- ✅ Contar registros na tabela de auditoria
SELECT 
    COUNT(*) as "Total de Mudanças Registradas",
    COUNT(DISTINCT target_user_id) as "Usuários Afetados",
    COUNT(DISTINCT admin_id) as "Admins que Fizeram Mudanças"
FROM admin_role_changes;

-- ============================================
-- TESTES DE SEGURANÇA
-- ============================================

-- 🧪 TESTE 1: Usuário comum NÃO pode alterar próprio role
-- Execute este SQL logado como usuário COMUM (não admin):
/*
UPDATE profiles 
SET role = 'admin' 
WHERE id = auth.uid();
-- ❌ Deve FALHAR com erro de política RLS
*/

-- 🧪 TESTE 2: Admin PODE alterar role de outros
-- Execute este SQL logado como ADMIN:
/*
UPDATE profiles 
SET role = 'moderator' 
WHERE email = 'usuario_teste@exemplo.com';
-- ✅ Deve FUNCIONAR e registrar na tabela admin_role_changes
*/

-- 🧪 TESTE 3: Verificar registro de auditoria
/*
SELECT 
    arc.created_at,
    p_admin.full_name as "Admin",
    p_target.full_name as "Usuário Afetado",
    arc.old_role as "Role Antiga",
    arc.new_role as "Role Nova"
FROM admin_role_changes arc
LEFT JOIN profiles p_admin ON arc.admin_id = p_admin.id
LEFT JOIN profiles p_target ON arc.target_user_id = p_target.id
ORDER BY arc.created_at DESC
LIMIT 10;
*/

-- ============================================
-- ROLLBACK (APENAS SE NECESSÁRIO)
-- ============================================

-- ⚠️ CUIDADO: Este comando REMOVE todas as proteções
-- Use apenas se precisar reverter as mudanças

/*
-- Desabilitar RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_role_changes DISABLE ROW LEVEL SECURITY;

-- Remover políticas
DROP POLICY IF EXISTS "users_select_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "admins_select_all_profiles" ON profiles;
DROP POLICY IF EXISTS "admins_update_all_profiles" ON profiles;
DROP POLICY IF EXISTS "service_role_full_access" ON profiles;
DROP POLICY IF EXISTS "admins_view_role_changes" ON admin_role_changes;
DROP POLICY IF EXISTS "prevent_audit_modifications" ON admin_role_changes;
DROP POLICY IF EXISTS "prevent_audit_deletions" ON admin_role_changes;
DROP POLICY IF EXISTS "service_role_insert_audit" ON admin_role_changes;

-- Remover trigger
DROP TRIGGER IF EXISTS role_change_audit ON profiles;
DROP FUNCTION IF EXISTS log_role_changes();

-- Remover constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_roles;

-- Remover tabela de auditoria
DROP TABLE IF EXISTS admin_role_changes CASCADE;
*/

-- ============================================
-- 📝 CONCLUSÃO
-- ============================================

/*
✅ PROTEÇÕES IMPLEMENTADAS:

1. RLS HABILITADO na tabela profiles
2. CONSTRAINT para valores válidos de role (user/moderator/admin)
3. POLÍTICAS RLS:
   - Usuários só veem/editam próprio perfil
   - Usuários NÃO PODEM alterar próprio role
   - Admins veem/editam todos os perfis
   - Service Role tem acesso total (para backend)
4. AUDITORIA:
   - Tabela admin_role_changes registra todas mudanças
   - Trigger automático registra quem/quando/o quê
   - Registros de auditoria são IMUTÁVEIS (não podem ser modificados)

🛡️ SEGURANÇA:
- ❌ Usuário comum NÃO pode se promover a admin
- ❌ Usuário comum NÃO pode alterar role de outros
- ❌ Frontend NÃO pode alterar roles diretamente
- ✅ Apenas backend autenticado (SERVICE_ROLE_KEY) ou admins podem alterar roles
- ✅ Todas mudanças são registradas em auditoria
- ✅ Registros de auditoria não podem ser apagados

📊 PRÓXIMOS PASSOS:
1. Execute este script no Supabase SQL Editor
2. Verifique os resultados das consultas de verificação
3. Execute os testes de segurança
4. Confirme que a auditoria está funcionando
5. Retorne ao desenvolvimento sabendo que está SEGURO! 🎉
*/
