-- ========================================
-- ATUALIZAR FUNÇÃO deduct_credits
-- ========================================
-- Esta função estava usando "purchased_points" (nome antigo)
-- Precisa usar "purchased_credits" (nome novo após refatoração)

CREATE OR REPLACE FUNCTION deduct_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_description TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_bonus_credits INTEGER;
    v_purchased_credits INTEGER;  -- ✅ CORRIGIDO: era purchased_points
    v_bonus_used INTEGER := 0;
    v_purchased_used INTEGER := 0;
BEGIN
    -- 1. Buscar créditos atuais com lock
    SELECT bonus_credits, purchased_credits  -- ✅ CORRIGIDO: era purchased_points
    INTO v_bonus_credits, v_purchased_credits
    FROM economy_user_wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    -- 2. Verificar se a carteira existe
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Carteira não encontrada para o usuário';
    END IF;

    -- 3. Verificar saldo suficiente
    IF (v_bonus_credits + v_purchased_credits) < p_amount THEN
        RAISE EXCEPTION 'Créditos insuficientes. Disponível: %, Necessário: %', 
            (v_bonus_credits + v_purchased_credits), p_amount;
    END IF;

    -- 4. Calcular quanto usar de cada tipo (prioridade: bônus primeiro)
    IF v_bonus_credits >= p_amount THEN
        -- Tem bônus suficiente, usar só bônus
        v_bonus_used := p_amount;
        v_purchased_used := 0;
    ELSE
        -- Usar todo o bônus e completar com comprados
        v_bonus_used := v_bonus_credits;
        v_purchased_used := p_amount - v_bonus_credits;
    END IF;

    -- 5. Atualizar carteira
    UPDATE economy_user_wallets
    SET 
        bonus_credits = bonus_credits - v_bonus_used,
        purchased_credits = purchased_credits - v_purchased_used,  -- ✅ CORRIGIDO: era purchased_points
        total_spent = total_spent + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- 6. Registrar transação
    INSERT INTO economy_transactions (
        user_id,
        type,
        amount,
        description,
        created_at
    ) VALUES (
        p_user_id,
        'debit',
        -p_amount,  -- Negativo para débito
        p_description,
        NOW()
    );

END;
$$;

-- ✅ VERIFICAR SE A FUNÇÃO FOI ATUALIZADA
SELECT 
    proname AS "Nome da Função",
    pg_get_functiondef(oid) AS "Definição"
FROM pg_proc 
WHERE proname = 'deduct_credits';

-- ✅ RESULTADO ESPERADO:
-- Deve mostrar a função com "purchased_credits" ao invés de "purchased_points"
