-- =========================================
-- FIX: Corrige função generate_referral_code
-- =========================================
-- ERRO: relation "users" does not exist
-- CAUSA: Estava buscando em 'users' em vez de 'public.profiles'
-- SOLUÇÃO: Mudar para a tabela correta
-- =========================================

-- Recriar função corrigida
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

-- Testar a função
SELECT generate_referral_code() AS codigo_teste;

-- Verificar se retorna 8 caracteres
SELECT 
    generate_referral_code() AS codigo,
    length(generate_referral_code()) AS tamanho
;

-- =========================================
-- RESULTADO ESPERADO:
-- - codigo: string aleatória de 8 chars (ex: "A1B2C3D4")
-- - tamanho: 8
-- =========================================
