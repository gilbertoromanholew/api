-- ========================================
-- INICIALIZAR CARTEIRA - USUÁRIO 2
-- ========================================
-- Email: m.gilbertoromanhole@gmail.com
-- ID: eccb1a6b-ef70-4ab4-a245-001ba1d936a2

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
    'eccb1a6b-ef70-4ab4-a245-001ba1d936a2'::uuid,
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
WHERE user_id = 'eccb1a6b-ef70-4ab4-a245-001ba1d936a2'::uuid;

-- ✅ RESULTADO ESPERADO:
-- Créditos Bônus: 100
-- Créditos Comprados: 200
-- Total Disponível: 300
