-- ========================================
-- INICIALIZAR CARTEIRA DE TESTE
-- ========================================
-- Execute este script para criar sua carteira e adicionar créditos de teste

-- 1️⃣ CRIAR CARTEIRA (se não existir)
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
    auth.uid(),  -- Seu ID de usuário
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

-- 2️⃣ VERIFICAR SE FOI CRIADA
SELECT 
    user_id,
    bonus_credits AS "Créditos Bônus",
    purchased_credits AS "Créditos Comprados",
    (bonus_credits + purchased_credits) AS "Total Disponível",
    total_spent AS "Total Gasto",
    created_at AS "Criado em"
FROM economy_user_wallets
WHERE user_id = auth.uid();

-- ✅ RESULTADO ESPERADO:
-- Créditos Bônus: 100
-- Créditos Comprados: 200
-- Total Disponível: 300
-- Total Gasto: 0
