-- Migration 005: Welcome Popup Tracking
-- Adiciona flag para controlar se o usuário já viu o popup de boas-vindas
-- Criado em: 2025-10-22

BEGIN;

-- 1. Adicionar coluna welcome_popup_shown na tabela profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS welcome_popup_shown BOOLEAN DEFAULT FALSE;

-- 2. Comentários para documentação
COMMENT ON COLUMN public.profiles.welcome_popup_shown IS 'Indica se o usuário já visualizou o popup de boas-vindas com código de referência';

-- 3. Índice para performance (caso precise filtrar usuários que ainda não viram)
CREATE INDEX IF NOT EXISTS idx_profiles_welcome_popup_shown 
ON public.profiles(welcome_popup_shown) 
WHERE welcome_popup_shown = FALSE;

-- 4. Função para marcar popup como visualizado
CREATE OR REPLACE FUNCTION mark_welcome_popup_shown(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET welcome_popup_shown = TRUE,
      updated_at = NOW()
  WHERE id = p_user_id
    AND welcome_popup_shown = FALSE; -- Só atualiza se ainda não foi marcado
  
  RETURN FOUND; -- Retorna TRUE se atualizou, FALSE se já estava marcado
END;
$$;

-- 5. Permissões RLS (Row Level Security)
-- Permitir que usuários vejam sua própria flag
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy já existe para profiles, mas garantir que welcome_popup_shown está acessível
-- (Assumindo que já existe policy "Users can view own profile")

-- 6. Grant para função
GRANT EXECUTE ON FUNCTION mark_welcome_popup_shown(UUID) TO authenticated;

COMMIT;

-- Rollback (se necessário):
-- BEGIN;
-- DROP INDEX IF EXISTS idx_profiles_welcome_popup_shown;
-- DROP FUNCTION IF EXISTS mark_welcome_popup_shown(UUID);
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS welcome_popup_shown;
-- COMMIT;
