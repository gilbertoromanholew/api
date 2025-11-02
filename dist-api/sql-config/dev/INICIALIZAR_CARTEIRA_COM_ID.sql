-- ========================================
-- INICIALIZAR CARTEIRA - VERSÃO COM USER ID MANUAL
-- ========================================
-- Use este script se auth.uid() não funcionar

-- ⚠️ PASSO 1: DESCUBRA SEU USER ID
-- Execute: SELECT id, email FROM auth.users WHERE email = 'seu-email@exemplo.com';
-- Ou execute: DESCOBRIR_USER_ID.sql

-- ⚠️ PASSO 2: SUBSTITUA 'SEU-USER-ID-AQUI' abaixo pelo UUID retornado

-- 1️⃣ CRIAR CARTEIRA
INSERT INTO economy_user_wallets (
    user_id,
    bonus_credits,
    purchased_credits,
    total_spent,
    total_earned_bonus,
    created_at,
    updated_at
)
VALUES (
    'SEU-USER-ID-AQUI'::uuid,  -- ⚠️ SUBSTITUA AQUI (ex: '123e4567-e89b-12d3-a456-426614174000')
    100,         -- 100 créditos bônus
    200,         -- 200 créditos comprados
    0,           -- Nenhum gasto ainda
    100,         -- Total de bônus ganho
    NOW(),
    NOW()
)
ON CONFLICT (user_id) 
DO UPDATE SET
    bonus_credits = EXCLUDED.bonus_credits,
    purchased_credits = EXCLUDED.purchased_credits,
    updated_at = NOW();

-- 2️⃣ VERIFICAR SE FOI CRIADA (substitua também aqui)
SELECT 
    user_id,
    bonus_credits AS "Créditos Bônus",
    purchased_credits AS "Créditos Comprados",
    (bonus_credits + purchased_credits) AS "Total Disponível",
    total_spent AS "Total Gasto",
    created_at AS "Criado em"
FROM economy_user_wallets
WHERE user_id = 'SEU-USER-ID-AQUI'::uuid;  -- ⚠️ SUBSTITUA AQUI TAMBÉM

-- ✅ RESULTADO ESPERADO:
-- Créditos Bônus: 100
-- Créditos Comprados: 200
-- Total Disponível: 300
