-- Adicionar coluna verification_token na tabela otp_codes
-- Para suportar verificação via link mágico além do código OTP

ALTER TABLE public.otp_codes
ADD COLUMN IF NOT EXISTS verification_token TEXT UNIQUE;

-- Criar índice para melhor performance nas buscas por token
CREATE INDEX IF NOT EXISTS idx_otp_codes_verification_token 
ON public.otp_codes(verification_token);

-- Comentário explicativo
COMMENT ON COLUMN public.otp_codes.verification_token IS 'Token único para verificação via link mágico (alternativa ao código OTP)';
