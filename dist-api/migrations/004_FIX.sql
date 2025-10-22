-- ============================================
-- FIX: Corrigir ambiguidade na função check_otp_device_lock
-- Execute este SQL no Supabase
-- ============================================

CREATE OR REPLACE FUNCTION check_otp_device_lock(
    p_user_id UUID,
    p_device_token TEXT DEFAULT NULL
)
RETURNS TABLE (
    is_locked BOOLEAN,
    locked_by_device TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    can_proceed BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_device_token TEXT;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Buscar lock ativo (OTP não usado e não expirado)
    SELECT 
        otp.device_token,
        otp.expires_at
    INTO v_device_token, v_expires_at
    FROM public.otp_codes otp
    WHERE 
        otp.user_id = p_user_id
        AND otp.device_token IS NOT NULL
        AND otp.used_at IS NULL
        AND otp.expires_at > NOW()
    ORDER BY otp.created_at DESC
    LIMIT 1;
    
    -- Se não há lock ativo, pode proceder
    IF v_device_token IS NULL THEN
        RETURN QUERY SELECT 
            FALSE::BOOLEAN,
            NULL::TEXT,
            NULL::TIMESTAMP WITH TIME ZONE,
            TRUE::BOOLEAN;
        RETURN;
    END IF;
    
    -- Se há lock, verificar se é do mesmo dispositivo
    IF p_device_token IS NOT NULL AND v_device_token = p_device_token THEN
        -- Mesmo dispositivo, pode proceder
        RETURN QUERY SELECT 
            TRUE::BOOLEAN,
            v_device_token,
            v_expires_at,
            TRUE::BOOLEAN;
        RETURN;
    END IF;
    
    -- Lock de outro dispositivo, bloquear
    RETURN QUERY SELECT 
        TRUE::BOOLEAN,
        v_device_token,
        v_expires_at,
        FALSE::BOOLEAN;
    RETURN;
END;
$$;

-- ============================================
-- TESTAR A FUNÇÃO CORRIGIDA
-- ============================================

-- Teste 1: Sem lock ativo (deve retornar can_proceed=TRUE)
SELECT * FROM check_otp_device_lock(
    '00000000-0000-0000-0000-000000000000'::UUID,
    'DEV_TEST_123'
);

-- Teste 2: Gerar device token
SELECT generate_device_token() as device_token;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- Teste 1: is_locked=FALSE, can_proceed=TRUE
-- Teste 2: DEV_20251022143045_a1b2c3d4 (exemplo)
-- ✅ Função corrigida e funcionando!
