-- Adicionar colunas de verificação na tabela profiles
-- Para rastrear verificação de email e telefone de forma independente do Supabase Auth

-- 1. Adicionar coluna para verificação de email
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- 2. Adicionar coluna para data de verificação de email
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;

-- 3. Adicionar coluna para verificação de telefone
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- 4. Adicionar coluna para data de verificação de telefone
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE;

-- 5. Criar índice para queries de verificação
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified 
ON public.profiles(email_verified);

CREATE INDEX IF NOT EXISTS idx_profiles_phone_verified 
ON public.profiles(phone_verified);

-- 6. Comentários explicativos
COMMENT ON COLUMN public.profiles.email_verified IS 'Indica se o usuário verificou o email via código OTP (independente do Supabase Auth)';
COMMENT ON COLUMN public.profiles.email_verified_at IS 'Data e hora em que o email foi verificado via código OTP';
COMMENT ON COLUMN public.profiles.phone_verified IS 'Indica se o usuário verificou o telefone via SMS/código';
COMMENT ON COLUMN public.profiles.phone_verified_at IS 'Data e hora em que o telefone foi verificado';

-- 7. Atualizar usuários existentes (opcional - marcar emails como não verificados)
-- Descomente a linha abaixo se quiser forçar re-verificação de todos os usuários
-- UPDATE public.profiles SET email_verified = FALSE WHERE email_verified IS NULL;
