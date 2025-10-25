-- =========================================
-- ADICIONAR 200 PONTOS COMPRADOS
-- Usuário: eccb1a6b-ef70-4ab4-a245-001ba1d936a2
-- =========================================

-- Verificar se o usuário já tem carteira
DO $$
DECLARE
    user_exists BOOLEAN;
    current_purchased INTEGER;
    current_total_purchased INTEGER;
BEGIN
    -- Verificar se usuário existe na tabela economy_user_wallets
    SELECT EXISTS(
        SELECT 1 FROM public.economy_user_wallets
        WHERE user_id = 'eccb1a6b-ef70-4ab4-a245-001ba1d936a2'
    ) INTO user_exists;

    IF user_exists THEN
        -- Usuário já tem carteira, atualizar purchased_points e total_purchased
        SELECT purchased_points, total_purchased
        INTO current_purchased, current_total_purchased
        FROM public.economy_user_wallets
        WHERE user_id = 'eccb1a6b-ef70-4ab4-a245-001ba1d936a2';

        UPDATE public.economy_user_wallets
        SET
            purchased_points = purchased_points + 200,
            total_purchased = total_purchased + 200,
            updated_at = NOW()
        WHERE user_id = 'eccb1a6b-ef70-4ab4-a245-001ba1d936a2';

        RAISE NOTICE '✅ Carteira atualizada! Adicionados 200 pontos comprados.';
        RAISE NOTICE '   Antes: purchased_points=%, total_purchased=%', current_purchased, current_total_purchased;
        RAISE NOTICE '   Agora: purchased_points=%, total_purchased=%', current_purchased + 200, current_total_purchased + 200;

    ELSE
        -- Usuário não tem carteira, criar uma nova
        INSERT INTO public.economy_user_wallets (
            user_id,
            bonus_credits,
            purchased_points,
            total_earned_bonus,
            total_purchased,
            total_spent,
            created_at,
            updated_at
        ) VALUES (
            'eccb1a6b-ef70-4ab4-a245-001ba1d936a2',
            0,      -- bonus_credits inicial
            200,    -- purchased_points (os 200 pontos comprados)
            0,      -- total_earned_bonus
            200,    -- total_purchased (os 200 pontos comprados)
            0,      -- total_spent
            NOW(),  -- created_at
            NOW()   -- updated_at
        );

        RAISE NOTICE '✅ Nova carteira criada com 200 pontos comprados!';
    END IF;
END $$;

-- Verificar resultado
SELECT
    user_id,
    bonus_credits,
    purchased_points,
    (bonus_credits + purchased_points) AS total_credits,
    total_earned_bonus,
    total_purchased,
    total_spent,
    created_at,
    updated_at
FROM public.economy_user_wallets
WHERE user_id = 'eccb1a6b-ef70-4ab4-a245-001ba1d936a2';

-- =========================================
-- RESULTADO ESPERADO:
-- =========================================
-- ✅ 200 pontos comprados adicionados ao usuário
-- ✅ Carteira criada ou atualizada conforme necessário
-- ✅ Saldo total recalculado corretamente
-- =========================================