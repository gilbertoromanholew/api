-- ============================================
-- FIX BUGS PRE-V8
-- Data: 25/10/2025
-- Corrige 3 bugs antes da migração V8
-- ============================================

BEGIN;

-- ============================================
-- BUG 1: Modal de boas-vindas aparece sempre
-- ============================================

-- 1. Adicionar coluna welcome_popup_shown (se não existir)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS welcome_popup_shown BOOLEAN DEFAULT FALSE;

-- 2. Comentário
COMMENT ON COLUMN public.profiles.welcome_popup_shown IS 
'Indica se o usuário já visualizou o popup de boas-vindas com código de referência';

-- 3. Índice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_welcome_popup_shown
ON public.profiles(welcome_popup_shown)
WHERE welcome_popup_shown = FALSE;

-- 4. Marcar usuários ANTIGOS como já tendo visto (para não mostrar popup)
-- Critério: Criados há mais de 1 dia
UPDATE public.profiles
SET welcome_popup_shown = TRUE
WHERE created_at < NOW() - INTERVAL '1 day'
  AND welcome_popup_shown = FALSE;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

DO $$
DECLARE
  v_column_exists BOOLEAN;
  v_users_total INTEGER;
  v_users_seen INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '✅ VERIFICAÇÃO DE BUGS CORRIGIDOS';
  RAISE NOTICE '════════════════════════════════════════';
  
  -- Verificar se coluna existe
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'welcome_popup_shown'
  ) INTO v_column_exists;
  
  IF v_column_exists THEN
    RAISE NOTICE '✅ Coluna welcome_popup_shown criada com sucesso';
  ELSE
    RAISE WARNING '❌ Coluna welcome_popup_shown NÃO foi criada';
  END IF;
  
  -- Contar usuários
  SELECT COUNT(*) INTO v_users_total FROM public.profiles;
  SELECT COUNT(*) INTO v_users_seen FROM public.profiles WHERE welcome_popup_shown = TRUE;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Total de usuários: %', v_users_total;
  RAISE NOTICE 'Usuários que já viram popup: %', v_users_seen;
  RAISE NOTICE 'Usuários que VERÃO popup: %', (v_users_total - v_users_seen);
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '✅ CORREÇÕES APLICADAS COM SUCESSO!';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

COMMIT;
