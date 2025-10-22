-- ============================================
-- VERIFICAÇÃO DA MIGRATION 004
-- Execute este SQL no Supabase para confirmar que tudo foi criado
-- ============================================

-- 1. Verificar se coluna device_token foi adicionada
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'otp_codes' 
  AND column_name = 'device_token';
-- ✅ Deve retornar: device_token | text | YES | NULL

-- 2. Verificar se índice foi criado
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
  AND tablename = 'otp_codes' 
  AND indexname = 'idx_otp_codes_device_token';
-- ✅ Deve retornar o índice com definição completa

-- 3. Verificar se funções foram criadas
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name IN ('generate_device_token', 'check_otp_device_lock');
-- ✅ Deve retornar 2 linhas:
--    - generate_device_token | FUNCTION | text
--    - check_otp_device_lock | FUNCTION | record

-- 4. TESTAR FUNÇÃO generate_device_token
SELECT generate_device_token() as device_token;
-- ✅ Deve retornar algo como: DEV_20251022143045_a1b2c3d4

-- 5. TESTAR FUNÇÃO check_otp_device_lock (sem lock)
SELECT * FROM check_otp_device_lock(
    '00000000-0000-0000-0000-000000000000'::UUID, -- UUID fake para teste
    'DEV_TEST_123'
);
-- ✅ Deve retornar: is_locked=FALSE, can_proceed=TRUE

-- 6. Ver estrutura completa da tabela otp_codes
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'otp_codes'
ORDER BY ordinal_position;
-- ✅ Deve incluir: id, user_id, email, code, device_token, expires_at, used_at, created_at

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- Se todos os queries acima retornaram resultados:
-- ✅ Migration 004 instalada com sucesso!
-- ✅ Sistema de device lock está ATIVO
-- ✅ Pronto para testar multi-dispositivo
