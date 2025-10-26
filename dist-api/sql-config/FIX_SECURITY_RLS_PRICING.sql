/**
 * ========================================
 * CORREÇÕES CRÍTICAS DE SEGURANÇA - RLS
 * ========================================
 * 
 * Data: 26/10/2025
 * Motivo: Auditoria revelou vulnerabilidade CRÍTICA em tools_usage_monthly
 * 
 * PROBLEMA:
 * Policy "Sistema pode gerenciar usos" com USING (true) permite que
 * qualquer usuário manipule registros de outros usuários.
 * 
 * RISCO:
 * - Usuários podem zerar usos grátis de terceiros
 * - Podem inserir registros falsos
 * - Podem deletar dados de uso
 * 
 * SOLUÇÃO:
 * Substituir policy permissiva por policies restritivas que validam auth.uid()
 */

-- ========================================
-- PARTE 1: REMOVER POLICY INSEGURA
-- ========================================

DROP POLICY IF EXISTS "Sistema pode gerenciar usos" ON tools_usage_monthly;

-- ========================================
-- PARTE 2: CRIAR POLICIES SEGURAS
-- ========================================

-- Policy INSERT: Usuário só pode inserir para si mesmo
CREATE POLICY "Usuários podem inserir próprios usos"
ON tools_usage_monthly
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy UPDATE: Usuário só pode atualizar próprios registros
CREATE POLICY "Usuários podem atualizar próprios usos"
ON tools_usage_monthly
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy DELETE: Bloquear DELETE completamente
-- (Não criar nenhuma policy de DELETE = ninguém pode deletar)

-- Se precisar permitir DELETE apenas para próprio usuário:
-- CREATE POLICY "Usuários podem deletar próprios usos"
-- ON tools_usage_monthly
-- FOR DELETE
-- USING (auth.uid() = user_id);

-- ========================================
-- PARTE 3: ADICIONAR VALIDAÇÃO NAS FUNCTIONS
-- ========================================

-- Function: increment_tool_usage
DROP FUNCTION IF EXISTS increment_tool_usage(UUID, UUID);

CREATE OR REPLACE FUNCTION increment_tool_usage(
  p_user_id UUID,
  p_tool_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_current_month DATE;
  v_uses_count INTEGER;
BEGIN
  -- ✅ VALIDAÇÃO: Usuário só pode incrementar próprio contador
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Permissão negada: você não pode incrementar usos de outro usuário';
  END IF;

  -- Obter primeiro dia do mês atual
  v_current_month := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  
  -- Incrementar ou criar registro
  INSERT INTO tools_usage_monthly (user_id, tool_id, month, uses_count)
  VALUES (p_user_id, p_tool_id, v_current_month, 1)
  ON CONFLICT (user_id, tool_id, month)
  DO UPDATE SET 
    uses_count = tools_usage_monthly.uses_count + 1,
    updated_at = NOW()
  RETURNING uses_count INTO v_uses_count;
  
  RETURN v_uses_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: get_monthly_usage
DROP FUNCTION IF EXISTS get_monthly_usage(UUID, UUID);

CREATE OR REPLACE FUNCTION get_monthly_usage(
  p_user_id UUID,
  p_tool_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_current_month DATE;
  v_uses_count INTEGER;
BEGIN
  -- ✅ VALIDAÇÃO: Usuário só pode consultar próprio contador
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Permissão negada: você não pode consultar usos de outro usuário';
  END IF;

  -- Obter primeiro dia do mês atual
  v_current_month := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  
  -- Buscar contagem de usos
  SELECT uses_count INTO v_uses_count
  FROM tools_usage_monthly
  WHERE user_id = p_user_id
    AND tool_id = p_tool_id
    AND month = v_current_month;
  
  RETURN COALESCE(v_uses_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- PARTE 4: VERIFICAR CORREÇÕES
-- ========================================

-- Listar policies ativas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tools_usage_monthly'
ORDER BY policyname;

-- Resultado esperado: 3 policies
-- 1. "Usuários podem ver apenas seus usos" (SELECT)
-- 2. "Usuários podem inserir próprios usos" (INSERT)
-- 3. "Usuários podem atualizar próprios usos" (UPDATE)

-- ========================================
-- PARTE 5: TESTAR SEGURANÇA
-- ========================================

-- TESTE 1: Tentar incrementar contador de outro usuário (deve falhar)
-- SELECT increment_tool_usage(
--   '<uuid_outro_usuario>',  -- UUID de outro usuário
--   '<uuid_ferramenta>'
-- );
-- Resultado esperado: ERROR: Permissão negada

-- TESTE 2: Incrementar próprio contador (deve funcionar)
-- SELECT increment_tool_usage(
--   auth.uid(),  -- Próprio UUID
--   '<uuid_ferramenta>'
-- );
-- Resultado esperado: 1, 2, 3... (contador incrementado)

-- TESTE 3: Tentar inserir registro para outro usuário (deve falhar)
-- INSERT INTO tools_usage_monthly (user_id, tool_id, month, uses_count)
-- VALUES (
--   '<uuid_outro_usuario>',  -- UUID de outro usuário
--   '<uuid_ferramenta>',
--   '2025-10-01',
--   100
-- );
-- Resultado esperado: ERROR: new row violates row-level security policy

-- ========================================
-- CONCLUSÃO
-- ========================================

/**
 * ANTES (INSEGURO):
 * - Policy com USING (true) permitia qualquer manipulação
 * - Functions sem validação de permissões
 * - Hackers podiam roubar usos grátis de outros usuários
 * 
 * DEPOIS (SEGURO):
 * - Policies validam auth.uid() = user_id
 * - Functions validam permissões antes de executar
 * - Usuário só pode manipular próprios dados
 * - DELETE bloqueado (sem policy = sem permissão)
 * 
 * STATUS: ✅ CORREÇÕES APLICADAS
 */
