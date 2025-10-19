-- Tabela para armazenar códigos OTP (One-Time Password)
-- Usada para verificação de email durante o registro

CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Índices para performance
    CONSTRAINT otp_codes_code_check CHECK (length(code) = 6)
);

-- Índice para buscar códigos por email e código
CREATE INDEX IF NOT EXISTS idx_otp_codes_email_code ON otp_codes(email, code);

-- Índice para buscar códigos por user_id
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_id ON otp_codes(user_id);

-- Índice para limpar códigos expirados
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);

-- RLS (Row Level Security) - apenas admin pode acessar
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Política: apenas service_role pode acessar
CREATE POLICY "Service role can manage OTP codes" ON otp_codes
    FOR ALL
    USING (auth.role() = 'service_role');

-- Função para limpar códigos expirados automaticamente (pode ser chamada por cron)
CREATE OR REPLACE FUNCTION clean_expired_otp_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM otp_codes
    WHERE expires_at < NOW()
    AND used_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários
COMMENT ON TABLE otp_codes IS 'Armazena códigos OTP para verificação de email';
COMMENT ON COLUMN otp_codes.user_id IS 'Referência ao usuário que receberá o código';
COMMENT ON COLUMN otp_codes.email IS 'Email para onde o código foi enviado';
COMMENT ON COLUMN otp_codes.code IS 'Código de 6 dígitos';
COMMENT ON COLUMN otp_codes.expires_at IS 'Data/hora de expiração do código (geralmente 10 minutos)';
COMMENT ON COLUMN otp_codes.used_at IS 'Data/hora em que o código foi usado (NULL se ainda não foi usado)';
