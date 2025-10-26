-- =============================================
-- PASSO 2: CRIAR FUNÇÕES SQL
-- =============================================
-- Execute este SQL DEPOIS de criar as tabelas

-- =============================================
-- FUNÇÃO 1: Incrementar uso mensal
-- =============================================
CREATE OR REPLACE FUNCTION increment_tool_usage(
  p_user_id UUID,
  p_tool_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_month_year TEXT;
BEGIN
  v_month_year := TO_CHAR(NOW(), 'YYYY-MM');
  
  INSERT INTO tool_usage_tracking (user_id, tool_id, month_year, usage_count)
  VALUES (p_user_id, p_tool_id, v_month_year, 1)
  ON CONFLICT (user_id, tool_id, month_year)
  DO UPDATE SET 
    usage_count = tool_usage_tracking.usage_count + 1,
    updated_at = NOW();
END;
$$;

-- =============================================
-- FUNÇÃO 2: Obter uso mensal de todas as ferramentas
-- =============================================
CREATE OR REPLACE FUNCTION get_monthly_usage(
  p_user_id UUID,
  p_month_year TEXT DEFAULT NULL,
  p_tool_id UUID DEFAULT NULL
)
RETURNS TABLE (
  tool_id UUID,
  tool_name TEXT,
  usage_count INT,
  month_year TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_month_year TEXT;
BEGIN
  v_month_year := COALESCE(p_month_year, TO_CHAR(NOW(), 'YYYY-MM'));
  
  RETURN QUERY
  SELECT 
    t.tool_id,
    tc.name as tool_name,
    t.usage_count,
    t.month_year
  FROM tool_usage_tracking t
  INNER JOIN tools_catalog tc ON tc.id = t.tool_id
  WHERE t.user_id = p_user_id
    AND t.month_year = v_month_year
    AND (p_tool_id IS NULL OR t.tool_id = p_tool_id);
END;
$$;

-- =============================================
-- FUNÇÃO 3: Obter uso de ferramenta específica
-- =============================================
-- PRIMEIRO: Deletar a função antiga que tem conflito
DROP FUNCTION IF EXISTS get_user_monthly_usage(UUID, TEXT);

-- AGORA: Criar a função correta
CREATE OR REPLACE FUNCTION get_user_monthly_usage(
  p_user_id UUID,
  p_tool_id UUID
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_month_year TEXT;
  v_usage_count INT;
BEGIN
  v_month_year := TO_CHAR(NOW(), 'YYYY-MM');
  
  SELECT usage_count INTO v_usage_count
  FROM tool_usage_tracking
  WHERE user_id = p_user_id
    AND tool_id = p_tool_id
    AND month_year = v_month_year;
  
  RETURN COALESCE(v_usage_count, 0);
END;
$$;

-- =============================================
-- FUNÇÃO 4: Deduzir pontos da carteira
-- =============================================
CREATE OR REPLACE FUNCTION deduct_points(
  p_user_id UUID,
  p_amount INT,
  p_description TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bonus_credits INT;
  v_purchased_points INT;
  v_remaining INT;
BEGIN
  -- Busca carteira
  SELECT bonus_credits, purchased_points 
  INTO v_bonus_credits, v_purchased_points
  FROM economy_user_wallets
  WHERE user_id = p_user_id;
  
  -- Verifica se encontrou a carteira
  IF v_bonus_credits IS NULL THEN
    RAISE EXCEPTION 'Carteira não encontrada para o usuário';
  END IF;
  
  -- Verifica se tem pontos suficientes
  IF (v_bonus_credits + v_purchased_points) < p_amount THEN
    RAISE EXCEPTION 'Pontos insuficientes. Disponível: %, Necessário: %', 
      (v_bonus_credits + v_purchased_points), p_amount;
  END IF;
  
  -- Deduz primeiro dos bonus_credits, depois dos purchased_points
  v_remaining := p_amount;
  
  IF v_bonus_credits >= v_remaining THEN
    -- Tem bonus suficiente
    UPDATE economy_user_wallets
    SET 
      bonus_credits = bonus_credits - v_remaining,
      total_spent = total_spent + p_amount,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSE
    -- Usa todo bonus e parte dos purchased
    UPDATE economy_user_wallets
    SET 
      bonus_credits = 0,
      purchased_points = purchased_points - (v_remaining - v_bonus_credits),
      total_spent = total_spent + p_amount,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$;

-- =============================================
-- TESTE DAS FUNÇÕES (opcional)
-- =============================================
-- Descomente para testar após criar as funções

-- SELECT get_user_monthly_usage(
--   'eccb1a6b-ef70-4ab4-a245-001ba1d936a2',  -- seu user_id
--   'be7d591a-7b5a-42ec-ab1b-860d251a4d88'   -- tool_id
-- );
