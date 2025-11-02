-- ========================================
-- ATUALIZAR FUNÇÃO deduct_credits (VERSÃO FINAL)
-- ========================================
-- Adicionar balance_before e balance_after na transação

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
    v_purchased_credits INTEGER;
    v_bonus_used INTEGER := 0;
    v_purchased_used INTEGER := 0;
    v_balance_before INTEGER;
    v_balance_after INTEGER;
BEGIN
    -- 1. Buscar créditos atuais com lock
    SELECT bonus_credits, purchased_credits
    INTO v_bonus_credits, v_purchased_credits
    FROM economy_user_wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    -- 2. Verificar se a carteira existe
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Carteira não encontrada';
    END IF;

    -- 3. Calcular saldo antes
    v_balance_before := v_bonus_credits + v_purchased_credits;

    -- 4. Verificar saldo suficiente
    IF v_balance_before < p_amount THEN
        RAISE EXCEPTION 'Créditos insuficientes';
    END IF;

    -- 5. Calcular quanto usar de cada tipo (prioridade: bônus primeiro)
    IF v_bonus_credits >= p_amount THEN
        v_bonus_used := p_amount;
        v_purchased_used := 0;
    ELSE
        v_bonus_used := v_bonus_credits;
        v_purchased_used := p_amount - v_bonus_credits;
    END IF;

    -- 6. Atualizar carteira
    UPDATE economy_user_wallets
    SET 
        bonus_credits = bonus_credits - v_bonus_used,
        purchased_credits = purchased_credits - v_purchased_used,
        total_spent = total_spent + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- 7. Calcular saldo depois
    v_balance_after := v_balance_before - p_amount;

    -- 8. Registrar transação COM balance_before e balance_after
    INSERT INTO economy_transactions (
        user_id,
        type,
        amount,
        description,
        balance_before,
        balance_after,
        created_at
    ) VALUES (
        p_user_id,
        'debit',
        -p_amount,  -- Negativo para débito
        p_description,
        v_balance_before,
        v_balance_after,
        NOW()
    );

END;
$$;

-- ✅ RESULTADO ESPERADO: Success. No rows returned
