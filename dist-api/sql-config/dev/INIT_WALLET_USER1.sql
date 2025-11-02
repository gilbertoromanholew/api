-- ========================================
-- INICIALIZAR CARTEIRA - USUÁRIO 1
-- ========================================
-- Email: sammaraadv7@gmail.com
-- ID: bf7ffe6d-2799-4932-87c0-85642b1a4d5a

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
    'bf7ffe6d-2799-4932-87c0-85642b1a4d5a'::uuid,
    100,         -- 100 créditos bônus
    200,         -- 200 créditos comprados
    0,
    100,
    NOW(),
    NOW()
)
ON CONFLICT (user_id) 
DO UPDATE SET
    bonus_credits = EXCLUDED.bonus_credits,
    purchased_credits = EXCLUDED.purchased_credits,
    updated_at = NOW();

-- 2️⃣ VERIFICAR
SELECT 
    user_id,
    bonus_credits AS "Créditos Bônus",
    purchased_credits AS "Créditos Comprados",
    (bonus_credits + purchased_credits) AS "Total Disponível",
    total_spent AS "Total Gasto",
    created_at AS "Criado em"
FROM economy_user_wallets
WHERE user_id = 'bf7ffe6d-2799-4932-87c0-85642b1a4d5a'::uuid;

-- ✅ RESULTADO ESPERADO:
-- Créditos Bônus: 100
-- Créditos Comprados: 200
-- Total Disponível: 300
