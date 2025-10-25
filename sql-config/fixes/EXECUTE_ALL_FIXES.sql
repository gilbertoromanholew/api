-- =========================================
-- 🛠️ EXECUTAR TODAS AS CORREÇÕES PRÉ-V8
-- =========================================
-- Este script contém TODAS as correções necessárias
-- Execute TUDO de uma vez no Supabase SQL Editor
-- =========================================

-- =========================================
-- FIX 1: Adicionar coluna welcome_popup_shown
-- =========================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS welcome_popup_shown BOOLEAN DEFAULT FALSE;

-- Marcar usuários existentes como já visualizaram
UPDATE public.profiles 
SET welcome_popup_shown = TRUE 
WHERE created_at < NOW() - INTERVAL '1 hour';

COMMENT ON COLUMN public.profiles.welcome_popup_shown IS 'Flag para controlar se usuário já viu popup de boas-vindas';

-- =========================================
-- FIX 2: Corrigir função generate_referral_code
-- =========================================
-- ERRO: relation "users" does not exist
-- SOLUÇÃO: Buscar em public.profiles em vez de users

-- Primeiro, dropar a função existente (pode ter tipo de retorno diferente)
DROP FUNCTION IF EXISTS generate_referral_code();

-- Recriar com a correção
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        -- Gerar código aleatório de 8 caracteres
        code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Verificar se já existe (buscar em public.profiles, não auth.users)
        SELECT COUNT(*) > 0 INTO exists FROM public.profiles WHERE referral_code = code;
        
        EXIT WHEN NOT exists;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- FIX 3: Garantir que RLS está configurado corretamente
-- =========================================

-- Tools catalog: permitir SELECT para anon (já deve estar, mas garantir)
DROP POLICY IF EXISTS "Allow public read access to tools" ON public.tools_catalog;
CREATE POLICY "Allow public read access to tools" 
ON public.tools_catalog FOR SELECT 
TO anon, authenticated 
USING (is_active = true);

-- Profiles: permitir authenticated atualizar seu próprio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (id = auth.uid());

-- =========================================
-- VERIFICAÇÕES FINAIS
-- =========================================

-- 1. Verificar coluna adicionada
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'welcome_popup_shown';

-- 2. Testar função de referral code
SELECT 
    generate_referral_code() AS codigo_gerado,
    length(generate_referral_code()) AS tamanho
;

-- 3. Verificar RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('tools_catalog', 'profiles')
ORDER BY tablename, policyname;

-- 4. Contar usuários marcados
SELECT 
    COUNT(*) FILTER (WHERE welcome_popup_shown = TRUE) AS ja_visualizaram,
    COUNT(*) FILTER (WHERE welcome_popup_shown = FALSE) AS nao_visualizaram,
    COUNT(*) AS total_usuarios
FROM public.profiles;

-- 5. Verificar ferramentas ativas
SELECT COUNT(*) AS total_ferramentas_ativas 
FROM public.tools_catalog 
WHERE is_active = true;

-- =========================================
-- RESULTADOS ESPERADOS:
-- =========================================
-- ✅ welcome_popup_shown: boolean | false | YES
-- ✅ codigo_gerado: string 8 chars (ex: "A1B2C3D4")
-- ✅ tamanho: 8
-- ✅ RLS policies: 2+ policies listadas
-- ✅ ja_visualizaram: N (usuários antigos)
-- ✅ nao_visualizaram: 0 (novos usuários)
-- ✅ total_ferramentas_ativas: 15
-- =========================================

-- FIM DO SCRIPT
