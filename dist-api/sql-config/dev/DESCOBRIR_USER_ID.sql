-- ========================================
-- DESCOBRIR SEU USER ID
-- ========================================

-- Opção 1: Listar todos os usuários (se você for admin)
SELECT 
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- Opção 2: Buscar por email (substitua pelo seu email)
-- SELECT id, email FROM auth.users WHERE email = 'seu-email@exemplo.com';

-- Opção 3: Verificar se auth.uid() funciona
SELECT 
    auth.uid() AS "Meu User ID",
    CASE 
        WHEN auth.uid() IS NULL THEN '❌ NÃO AUTENTICADO - Use Service Role Key'
        ELSE '✅ Autenticado'
    END AS "Status";
