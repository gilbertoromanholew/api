-- ============================================
-- 🔐 PROMOVER USUÁRIO PARA ADMIN - SEGURO
-- Data: 27/10/2025
-- ============================================

-- ⚠️ IMPORTANTE: Execute este script no Supabase SQL Editor
-- Este script promove um usuário específico para admin de forma segura

-- ============================================
-- OPÇÃO 1: PROMOVER POR EMAIL
-- ============================================

-- 1️⃣ Primeiro, CONSULTE os dados do usuário para confirmar
SELECT 
    id,
    email,
    full_name,
    cpf,
    role,
    created_at,
    email_verified
FROM profiles
WHERE email = 'SEU_EMAIL_AQUI@exemplo.com';

-- 2️⃣ Se confirmou que é o usuário correto, PROMOVA para admin
UPDATE profiles
SET 
    role = 'admin',
    updated_at = NOW()
WHERE email = 'SEU_EMAIL_AQUI@exemplo.com'
AND role != 'admin'; -- Só atualiza se ainda não for admin

-- 3️⃣ CONFIRME a mudança
SELECT 
    id,
    email,
    full_name,
    role,
    updated_at
FROM profiles
WHERE email = 'SEU_EMAIL_AQUI@exemplo.com';

-- ============================================
-- OPÇÃO 2: PROMOVER POR UUID
-- ============================================

-- 1️⃣ Primeiro, CONSULTE por UUID
SELECT 
    id,
    email,
    full_name,
    cpf,
    role,
    created_at
FROM profiles
WHERE id = 'UUID_DO_USUARIO_AQUI';

-- 2️⃣ PROMOVA para admin
UPDATE profiles
SET 
    role = 'admin',
    updated_at = NOW()
WHERE id = 'UUID_DO_USUARIO_AQUI'
AND role != 'admin';

-- 3️⃣ CONFIRME
SELECT 
    id,
    email,
    full_name,
    role,
    updated_at
FROM profiles
WHERE id = 'UUID_DO_USUARIO_AQUI';

-- ============================================
-- OPÇÃO 3: PROMOVER POR CPF
-- ============================================

-- 1️⃣ CONSULTE por CPF
SELECT 
    id,
    email,
    full_name,
    cpf,
    role,
    created_at
FROM profiles
WHERE cpf = '000.000.000-00';

-- 2️⃣ PROMOVA
UPDATE profiles
SET 
    role = 'admin',
    updated_at = NOW()
WHERE cpf = '000.000.000-00'
AND role != 'admin';

-- 3️⃣ CONFIRME
SELECT 
    id,
    email,
    full_name,
    cpf,
    role,
    updated_at
FROM profiles
WHERE cpf = '000.000.000-00';

-- ============================================
-- 📊 VERIFICAR TODOS OS ADMINS NO SISTEMA
-- ============================================

SELECT 
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at,
    email_verified
FROM profiles
WHERE role = 'admin'
ORDER BY created_at DESC;

-- ============================================
-- 🔄 REVERTER PARA USER (SE NECESSÁRIO)
-- ============================================

UPDATE profiles
SET 
    role = 'user',
    updated_at = NOW()
WHERE email = 'EMAIL_AQUI@exemplo.com'
AND role = 'admin';

-- ============================================
-- 🛡️ AUDITORIA - REGISTRAR MANUALMENTE
-- ============================================

-- Registre a ação administrativa manualmente
INSERT INTO auth_audit_log (
    user_id,
    action,
    ip_address,
    user_agent,
    success,
    metadata,
    created_at
)
SELECT 
    id,
    'admin_promotion',
    '127.0.0.1', -- IP do administrador
    'Supabase SQL Editor',
    true,
    jsonb_build_object(
        'promoted_by', 'database_admin',
        'previous_role', 'user',
        'new_role', 'admin',
        'reason', 'Promoção inicial de administrador'
    ),
    NOW()
FROM profiles
WHERE email = 'SEU_EMAIL_AQUI@exemplo.com';

-- ============================================
-- 📝 VERIFICAR POLICIES RLS PARA ADMINS
-- ============================================

-- Verificar se admins têm acesso ao auth_audit_log
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'auth_audit_log'
AND qual LIKE '%admin%';

-- Verificar se admins têm acesso ao operations_audit_log
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'operations_audit_log'
AND qual LIKE '%admin%';

-- ============================================
-- 🎯 EXEMPLO COMPLETO DE USO
-- ============================================

-- Passo a passo para promover gilberto@exemplo.com:

-- 1. Consultar
SELECT id, email, full_name, role FROM profiles WHERE email = 'gilberto@exemplo.com';

-- 2. Promover
UPDATE profiles SET role = 'admin', updated_at = NOW() WHERE email = 'gilberto@exemplo.com';

-- 3. Auditar
INSERT INTO auth_audit_log (user_id, action, success, metadata)
SELECT id, 'admin_promotion', true, '{"promoted_by": "system_admin"}'::jsonb
FROM profiles WHERE email = 'gilberto@exemplo.com';

-- 4. Confirmar
SELECT id, email, full_name, role, updated_at FROM profiles WHERE email = 'gilberto@exemplo.com';

-- ============================================
-- ✅ CHECKLIST DE SEGURANÇA
-- ============================================

/*
✅ ANTES DE PROMOVER:
1. Confirmar identidade do usuário (email, CPF, nome)
2. Verificar se o email está verificado (email_verified = true)
3. Verificar se não é um usuário suspeito
4. Verificar histórico de ações (auth_audit_log)

✅ DEPOIS DE PROMOVER:
1. Confirmar role foi atualizado para 'admin'
2. Testar login no admin panel
3. Verificar logs de auditoria
4. Confirmar acesso às rotas /admin/* no backend

✅ BOAS PRÁTICAS:
- Nunca promova mais de 2-3 admins
- Sempre registre a ação em auth_audit_log
- Mantenha backup do email e UUID do admin
- Documente quem foi promovido e quando
*/

-- ============================================
-- 🔍 DIAGNÓSTICO COMPLETO DO USUÁRIO
-- ============================================

-- Execute isso ANTES de promover para verificar se é seguro:
WITH user_data AS (
    SELECT 
        p.id,
        p.email,
        p.full_name,
        p.cpf,
        p.role,
        p.created_at,
        p.email_verified,
        w.bonus_credits,
        w.purchased_points,
        (w.bonus_credits + w.purchased_points) as total_credits
    FROM profiles p
    LEFT JOIN economy_user_wallets w ON p.id = w.user_id
    WHERE p.email = 'SEU_EMAIL_AQUI@exemplo.com'
),
login_stats AS (
    SELECT 
        COUNT(*) as total_logins,
        COUNT(*) FILTER (WHERE success = true) as successful_logins,
        COUNT(*) FILTER (WHERE success = false) as failed_logins,
        MAX(created_at) as last_login
    FROM auth_audit_log
    WHERE user_id = (SELECT id FROM user_data)
    AND action IN ('login', 'signin', 'token_refresh')
),
violations AS (
    SELECT COUNT(*) as total_violations
    FROM rate_limit_violations
    WHERE user_id = (SELECT id FROM user_data)
)
SELECT 
    u.*,
    l.total_logins,
    l.successful_logins,
    l.failed_logins,
    l.last_login,
    v.total_violations,
    CASE 
        WHEN u.email_verified = false THEN '⚠️ Email não verificado'
        WHEN v.total_violations > 5 THEN '⚠️ Muitas violações de rate limit'
        WHEN l.failed_logins > 10 THEN '⚠️ Muitas tentativas de login falhadas'
        WHEN u.created_at > NOW() - INTERVAL '1 day' THEN '⚠️ Conta muito nova'
        ELSE '✅ Usuário parece seguro'
    END as security_check
FROM user_data u
CROSS JOIN login_stats l
CROSS JOIN violations v;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
