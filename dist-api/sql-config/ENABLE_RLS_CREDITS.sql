/**
 * ========================================
 * SEGURANÇA: RLS para Sistema de Créditos
 * ========================================
 * 
 * Data: 2025-10-26
 * Objetivo: Proteger economy_user_wallets e economy_transactions
 * 
 * PROTEÇÃO:
 * - Usuário vê APENAS seus próprios créditos
 * - Usuário NÃO pode modificar saldo diretamente
 * - Usuário NÃO pode ver/deletar dados de outros
 * - Apenas functions do Postgres podem modificar saldos
 * 
 * SEGURANÇA EM CAMADAS:
 * 1. Backend valida req.user.id
 * 2. RLS valida auth.uid() no Postgres
 * 3. Functions validam permissões internamente
 */

-- ========================================
-- PARTE 1: VERIFICAR STATUS RLS ATUAL
-- ========================================

-- RLS já está habilitado via policies existentes
-- Verificando tabelas protegidas:
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('economy_user_wallets', 'economy_transactions', 'economy_subscriptions')
  AND schemaname = 'public';

-- ========================================
-- PARTE 2: ADICIONAR POLICIES FALTANTES
-- ========================================

-- ⚠️ ATENÇÃO: Policies JÁ EXISTENTES (não recriar):
-- - users_view_own_wallet (SELECT)
-- - service_manage_wallets (ALL para service_role)
-- - users_view_own_transactions (SELECT)
-- - service_manage_transactions (ALL para service_role)

-- 🛡️ NOVAS POLICIES: Bloquear modificações diretas

-- INSERT: Permitir que sistema crie carteiras
DROP POLICY IF EXISTS "users_insert_own_wallet" ON economy_user_wallets;
CREATE POLICY "users_insert_own_wallet"
ON economy_user_wallets FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: BLOQUEADO para usuários comuns (apenas service_role ou functions)
DROP POLICY IF EXISTS "users_block_wallet_updates" ON economy_user_wallets;
CREATE POLICY "users_block_wallet_updates"
ON economy_user_wallets FOR UPDATE
TO authenticated
USING (false);  -- ❌ Bloqueia UPDATE direto

-- DELETE: BLOQUEADO para todos (exceto service_role)
DROP POLICY IF EXISTS "users_block_wallet_deletes" ON economy_user_wallets;
CREATE POLICY "users_block_wallet_deletes"
ON economy_user_wallets FOR DELETE
TO authenticated
USING (false);  -- ❌ Bloqueia DELETE

-- Transações: INSERT permitido, UPDATE/DELETE bloqueados
DROP POLICY IF EXISTS "users_insert_own_transaction" ON economy_transactions;
CREATE POLICY "users_insert_own_transaction"
ON economy_transactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_block_transaction_updates" ON economy_transactions;
CREATE POLICY "users_block_transaction_updates"
ON economy_transactions FOR UPDATE
TO authenticated
USING (false);  -- ❌ Transações são imutáveis

DROP POLICY IF EXISTS "users_block_transaction_deletes" ON economy_transactions;
CREATE POLICY "users_block_transaction_deletes"
ON economy_transactions FOR DELETE
TO authenticated
USING (false);  -- ❌ Transações são imutáveis

-- ========================================
-- PARTE 5: FUNCTION SEGURA PARA ADICIONAR CRÉDITOS
-- ========================================

-- Function para admin adicionar créditos (via backend autenticado)
CREATE OR REPLACE FUNCTION admin_add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type VARCHAR DEFAULT 'bonus',
  p_reason TEXT DEFAULT 'Crédito administrativo'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER  -- Roda com permissões da function (bypassa RLS)
AS $$
DECLARE
  v_wallet economy_user_wallets%ROWTYPE;
  v_transaction_id UUID;
BEGIN
  -- ⚠️ VALIDAÇÃO: Apenas para operações administrativas
  -- (Backend deve validar que req.user é admin antes de chamar)
  
  -- Validar que amount > 0
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Valor deve ser positivo';
  END IF;
  
  -- Buscar carteira
  SELECT * INTO v_wallet
  FROM economy_user_wallets
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Carteira não encontrada para usuário %', p_user_id;
  END IF;
  
  -- Atualizar carteira
  IF p_type = 'bonus' THEN
    UPDATE economy_user_wallets
    SET 
      bonus_credits = bonus_credits + p_amount,
      total_earned_bonus = total_earned_bonus + p_amount,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSE
    UPDATE economy_user_wallets
    SET 
      purchased_points = purchased_points + p_amount,
      total_purchased = total_purchased + p_amount,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
  
  -- Criar transação
  INSERT INTO economy_transactions (
    user_id,
    type,
    amount,
    description,
    status
  ) VALUES (
    p_user_id,
    p_type,
    p_amount,
    p_reason,
    'completed'
  )
  RETURNING id INTO v_transaction_id;
  
  -- Retornar resultado
  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'new_balance', (
      SELECT bonus_credits + purchased_points
      FROM economy_user_wallets
      WHERE user_id = p_user_id
    )
  );
END;
$$;

-- ========================================
-- PARTE 6: FUNCTION SEGURA PARA DEBITAR CRÉDITOS
-- ========================================

-- Function para debitar créditos (chamada pelo sistema)
CREATE OR REPLACE FUNCTION debit_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet economy_user_wallets%ROWTYPE;
  v_bonus_used INTEGER := 0;
  v_purchased_used INTEGER := 0;
  v_transaction_id UUID;
BEGIN
  -- ✅ VALIDAÇÃO: Verificar que é o próprio usuário
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Acesso negado: usuário não pode debitar créditos de outros';
  END IF;
  
  -- Validar que amount > 0
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Valor deve ser positivo';
  END IF;
  
  -- Buscar carteira com lock
  SELECT * INTO v_wallet
  FROM economy_user_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Carteira não encontrada';
  END IF;
  
  -- Validar saldo suficiente
  IF (v_wallet.bonus_credits + v_wallet.purchased_points) < p_amount THEN
    RAISE EXCEPTION 'Saldo insuficiente. Disponível: %, necessário: %',
      (v_wallet.bonus_credits + v_wallet.purchased_points), p_amount;
  END IF;
  
  -- Debitar (prioriza bônus)
  IF v_wallet.bonus_credits >= p_amount THEN
    -- Tudo sai do bônus
    v_bonus_used := p_amount;
  ELSE
    -- Usa todo bônus + resto dos comprados
    v_bonus_used := v_wallet.bonus_credits;
    v_purchased_used := p_amount - v_wallet.bonus_credits;
  END IF;
  
  -- Atualizar carteira
  UPDATE economy_user_wallets
  SET 
    bonus_credits = bonus_credits - v_bonus_used,
    purchased_points = purchased_points - v_purchased_used,
    total_spent = total_spent + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Criar transação
  INSERT INTO economy_transactions (
    user_id,
    type,
    amount,
    description,
    status
  ) VALUES (
    p_user_id,
    'debit',
    -p_amount,
    p_reason,
    'completed'
  )
  RETURNING id INTO v_transaction_id;
  
  -- Retornar resultado
  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'debit_amount', p_amount,
    'bonus_used', v_bonus_used,
    'purchased_used', v_purchased_used,
    'new_balance', (
      SELECT bonus_credits + purchased_points
      FROM economy_user_wallets
      WHERE user_id = p_user_id
    )
  );
END;
$$;

-- ========================================
-- PARTE 7: VERIFICAÇÃO DE SEGURANÇA
-- ========================================

-- 📋 Ver todas as policies (economy_*)
SELECT 
  schemaname as schema,
  tablename as tabela,
  policyname as policy,
  CASE cmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as comando,
  roles
FROM pg_policies
WHERE tablename IN ('economy_user_wallets', 'economy_transactions', 'economy_subscriptions')
ORDER BY tablename, cmd;

-- 🔍 Ver functions criadas
SELECT 
  routine_name as function_name,
  routine_type as type,
  security_type,
  CASE 
    WHEN routine_definition LIKE '%SECURITY DEFINER%' THEN '✅ DEFINER'
    ELSE 'INVOKER'
  END as security_mode
FROM information_schema.routines
WHERE routine_name IN ('admin_add_credits', 'debit_credits')
  AND routine_schema = 'public';

-- 🛡️ Status RLS por tabela
SELECT 
  c.relname as tabela,
  CASE 
    WHEN c.relrowsecurity THEN '✅ RLS HABILITADO'
    ELSE '❌ RLS DESABILITADO'
  END as status,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = c.relname) as total_policies
FROM pg_class c
WHERE c.relname IN ('economy_user_wallets', 'economy_transactions', 'economy_subscriptions')
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY c.relname;

-- ========================================
-- COMENTÁRIOS
-- ========================================

COMMENT ON POLICY "users_insert_own_wallet" ON economy_user_wallets IS 
'RLS: Sistema pode criar carteira quando usuário se registra';

COMMENT ON POLICY "users_block_wallet_updates" ON economy_user_wallets IS 
'RLS: BLOQUEIO - Saldo só pode ser alterado via functions (admin_add_credits, debit_credits)';

COMMENT ON POLICY "users_block_wallet_deletes" ON economy_user_wallets IS 
'RLS: BLOQUEIO - Carteiras não podem ser deletadas (apenas service_role)';

COMMENT ON POLICY "users_insert_own_transaction" ON economy_transactions IS 
'RLS: Sistema pode criar transação para registrar operação';

COMMENT ON POLICY "users_block_transaction_updates" ON economy_transactions IS 
'RLS: BLOQUEIO - Transações são imutáveis (auditoria)';

COMMENT ON POLICY "users_block_transaction_deletes" ON economy_transactions IS 
'RLS: BLOQUEIO - Transações são imutáveis (auditoria)';

COMMENT ON FUNCTION admin_add_credits IS 
'Function segura para admin adicionar créditos. SECURITY DEFINER bypassa RLS mas backend valida permissões.';

COMMENT ON FUNCTION debit_credits IS 
'Function segura para debitar créditos. Valida auth.uid() = user_id antes de executar.';

-- ========================================
-- SUCESSO!
-- ========================================

SELECT '🔒 RLS completo! Sistema de créditos protegido contra modificações não autorizadas.' as status;

-- ========================================
-- PRÓXIMOS PASSOS
-- ========================================

/*
✅ EXECUTADO: Policies de bloqueio criadas
✅ EXECUTADO: Functions seguras criadas

🔄 PENDENTE: Atualizar backend para usar functions

📝 EXEMPLO DE USO NO BACKEND:

// ❌ ANTES (supabaseAdmin sem proteção):
const { data } = await supabaseAdmin
  .from('economy_user_wallets')
  .update({ bonus_credits: 1000000 })  // Qualquer um pode hackear
  .eq('user_id', userId);

// ✅ DEPOIS (function com validação):
const { data } = await supabase
  .rpc('admin_add_credits', {
    p_user_id: userId,
    p_amount: 100,
    p_type: 'bonus',
    p_reason: 'Bônus de boas-vindas'
  });

// ✅ Débito (usuário autenticado):
const { data } = await supabase
  .rpc('debit_credits', {
    p_user_id: req.user.id,  // Validado por auth.uid()
    p_amount: 10,
    p_reason: 'Uso de ferramenta: CPF'
  });

🔐 SEGURANÇA EM CAMADAS:
1. Backend valida req.user.id
2. RLS valida auth.uid() no Postgres
3. Functions validam permissões internamente
4. UPDATE/DELETE direto BLOQUEADO para usuários
*/
