-- ============================================
-- MIGRATION: OTP Device Lock (Segurança Multi-dispositivo)
-- Data: 22 de outubro de 2025
-- Versão: 1.0.0
-- ============================================

-- Problema: Dois dispositivos podem tentar verificar o mesmo OTP simultaneamente
-- Solução: Adicionar device_token para lock de verificação

BEGIN;

-- ============================================
-- 1. ADICIONAR COLUNA device_token
-- ============================================

ALTER TABLE public.otp_codes
ADD COLUMN IF NOT EXISTS device_token TEXT;

COMMENT ON COLUMN public.otp_codes.device_token IS 
'Token único gerado pelo primeiro dispositivo que inicia verificação. 
Impede que outros dispositivos reenviem código até expiração (3 min).';

-- ============================================
-- 2. ÍNDICE PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_otp_codes_device_token 
ON public.otp_codes (user_id, device_token, expires_at)
WHERE device_token IS NOT NULL AND used_at IS NULL;

-- ============================================
-- 3. FUNÇÃO PARA GERAR DEVICE TOKEN
-- ============================================

CREATE OR REPLACE FUNCTION generate_device_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    -- Gerar token único baseado em timestamp + random
    RETURN 'DEV_' || 
           TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || '_' || 
           SUBSTRING(MD5(RANDOM()::TEXT), 1, 8);
END;
$$;

COMMENT ON FUNCTION generate_device_token IS 
'Gera token único para identificar dispositivo que iniciou verificação.
Formato: DEV_20251022143045_a1b2c3d4';

-- ============================================
-- 4. FUNÇÃO PARA VERIFICAR LOCK
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

COMMENT ON FUNCTION check_otp_device_lock IS 
'Verifica se há lock de outro dispositivo tentando verificar OTP.
Retorna:
- is_locked: Se há lock ativo
- locked_by_device: Token do dispositivo que criou o lock
- expires_at: Quando o lock expira
- can_proceed: Se o dispositivo atual pode prosseguir';

-- ============================================
-- 5. EXEMPLO DE USO
-- ============================================

-- Verificar se pode enviar OTP:
-- SELECT * FROM check_otp_device_lock('user-uuid', 'DEV_20251022143045_a1b2c3d4');

-- Inserir OTP com device lock:
-- INSERT INTO otp_codes (user_id, email, code, device_token, expires_at, created_at)
-- VALUES (
--     'user-uuid',
--     'email@example.com',
--     '123456',
--     generate_device_token(),
--     NOW() + INTERVAL '3 minutes',
--     NOW()
-- );

COMMIT;

-- ============================================
-- ESTATÍSTICAS
-- ============================================

DO $$
DECLARE
    v_total_otp INTEGER;
    v_with_device_token INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_otp FROM public.otp_codes;
    SELECT COUNT(*) INTO v_with_device_token FROM public.otp_codes WHERE device_token IS NOT NULL;
    
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE 'MIGRATION 004 CONCLUÍDA';
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE 'Total de OTPs: %', v_total_otp;
    RAISE NOTICE 'OTPs com device token: %', v_with_device_token;
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE 'Device lock ativado! Multi-dispositivo protegido.';
END $$;
