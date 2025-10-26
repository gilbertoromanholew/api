/**
 * ========================================
 * MIGRAÇÃO: Sistema de Custos Diferenciados por Plano
 * ========================================
 * 
 * Data: 2025-10-26
 * Objetivo: Implementar custos diferentes por plano e controle mensal de usos
 * 
 * ESTRUTURA ATUAL (tools_catalog):
 * ✅ is_planning BOOLEAN
 * ✅ planning_base_cost INTEGER (experimental para gratuito)
 * ✅ planning_full_cost INTEGER (completo para gratuito)
 * ✅ planning_monthly_limit INTEGER (20 usos/mês para pro)
 * ✅ planning_pro_overflow_cost INTEGER (após limite)
 * ✅ access_level VARCHAR ('free' ou 'professional')
 * 
 * NOVO SISTEMA:
 * 1. Ferramentas normais: custos diferenciados por plano
 * 2. Planejamentos: custos experimental/completo + limite mensal
 * 3. Controle de uso mensal por ferramenta
 */

-- ========================================
-- PARTE 0: REMOVER CONSTRAINTS ANTIGAS
-- ========================================

-- Remover constraint que pode impedir a migração
ALTER TABLE tools_catalog
DROP CONSTRAINT IF EXISTS check_planning_cost_logic;

-- ========================================
-- PARTE 1: ADICIONAR COLUNAS DE CUSTO DIFERENCIADO
-- ========================================

-- Custos para ferramentas NORMAIS (não-planejamento)
ALTER TABLE tools_catalog
ADD COLUMN IF NOT EXISTS cost_free_plan INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cost_stage_plan INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cost_professional_plan INTEGER DEFAULT NULL;

-- Renomear colunas de planejamento para clareza
-- (Apenas se ainda não foram renomeadas)
DO $$
BEGIN
  -- Renomear planning_base_cost → planning_lite_cost_free
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tools_catalog' 
    AND column_name = 'planning_base_cost'
  ) THEN
    ALTER TABLE tools_catalog
    RENAME COLUMN planning_base_cost TO planning_lite_cost_free;
  END IF;

  -- Renomear planning_full_cost → planning_premium_cost_free
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tools_catalog' 
    AND column_name = 'planning_full_cost'
  ) THEN
    ALTER TABLE tools_catalog
    RENAME COLUMN planning_full_cost TO planning_premium_cost_free;
  END IF;

  -- Renomear planning_pro_overflow_cost → planning_premium_cost_pro
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tools_catalog' 
    AND column_name = 'planning_pro_overflow_cost'
  ) THEN
    ALTER TABLE tools_catalog
    RENAME COLUMN planning_pro_overflow_cost TO planning_premium_cost_pro;
  END IF;
END $$;

-- Adicionar custo lite para planos profissionais (após limite)
ALTER TABLE tools_catalog
ADD COLUMN IF NOT EXISTS planning_lite_cost_pro INTEGER DEFAULT NULL;

-- ========================================
-- PARTE 2: POPULAR DADOS INICIAIS
-- ========================================

-- Ferramentas NORMAIS: Definir custos por plano
-- Gratuito paga 2x | Estágio paga 1.5x | Profissional paga 1x
UPDATE tools_catalog
SET 
  cost_free_plan = cost_in_points * 2,           -- Gratuito: dobro
  cost_stage_plan = CEIL(cost_in_points * 1.5),  -- Estágio: 50% a mais
  cost_professional_plan = cost_in_points         -- Profissional: preço base
WHERE is_planning = false;

-- Ferramentas de PLANEJAMENTO: Definir custos
UPDATE tools_catalog
SET 
  -- GRATUITO:
  planning_lite_cost_free = 1,     -- Experimental: 1 crédito
  planning_premium_cost_free = 15, -- Completo: 15 créditos
  
  -- PROFISSIONAL (após 20 usos grátis):
  planning_lite_cost_pro = 1,      -- Experimental: 1 crédito
  planning_premium_cost_pro = 6    -- Completo: 6 créditos (60% desconto)
WHERE is_planning = true;

-- ========================================
-- PARTE 3: CRIAR TABELA DE CONTROLE MENSAL
-- ========================================

CREATE TABLE IF NOT EXISTS tools_usage_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES tools_catalog(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- Formato: 2025-10-01 (primeiro dia do mês)
  uses_count INTEGER DEFAULT 0 CHECK (uses_count >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Um registro único por usuário, ferramenta e mês
  UNIQUE(user_id, tool_id, month)
);

-- ========================================
-- PARTE 4: CRIAR ÍNDICES PARA PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_tools_usage_monthly_user_month 
ON tools_usage_monthly(user_id, month);

CREATE INDEX IF NOT EXISTS idx_tools_usage_monthly_tool_month 
ON tools_usage_monthly(tool_id, month);

CREATE INDEX IF NOT EXISTS idx_tools_usage_monthly_composite 
ON tools_usage_monthly(user_id, tool_id, month);

-- ========================================
-- PARTE 5: ADICIONAR COMENTÁRIOS
-- ========================================

COMMENT ON COLUMN tools_catalog.cost_free_plan IS 
'Custo em créditos para usuários do plano GRATUITO (ferramentas normais)';

COMMENT ON COLUMN tools_catalog.cost_stage_plan IS 
'Custo em créditos para planos ESTÁGIO (diário/semanal) - ferramentas normais';

COMMENT ON COLUMN tools_catalog.cost_professional_plan IS 
'Custo em créditos para plano PROFISSIONAL MENSAL (ferramentas normais)';

COMMENT ON COLUMN tools_catalog.planning_lite_cost_free IS 
'Custo modo EXPERIMENTAL para plano GRATUITO (planejamentos)';

COMMENT ON COLUMN tools_catalog.planning_premium_cost_free IS 
'Custo modo COMPLETO para plano GRATUITO (planejamentos)';

COMMENT ON COLUMN tools_catalog.planning_lite_cost_pro IS 
'Custo modo EXPERIMENTAL para planos PROFISSIONAIS após limite mensal';

COMMENT ON COLUMN tools_catalog.planning_premium_cost_pro IS 
'Custo modo COMPLETO para planos PROFISSIONAIS após limite mensal';

COMMENT ON TABLE tools_usage_monthly IS 
'Controle de usos mensais de ferramentas por usuário - reset automático todo mês';

-- ========================================
-- PARTE 6: FUNCTION PARA INCREMENTAR USO
-- ========================================

-- Remover function existente se houver
DROP FUNCTION IF EXISTS increment_tool_usage(UUID, UUID);

CREATE OR REPLACE FUNCTION increment_tool_usage(
  p_user_id UUID,
  p_tool_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_current_month DATE;
  v_uses_count INTEGER;
BEGIN
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
$$ LANGUAGE plpgsql;

-- ========================================
-- PARTE 7: FUNCTION PARA OBTER USOS DO MÊS
-- ========================================

-- Remover function existente se houver
DROP FUNCTION IF EXISTS get_monthly_usage(UUID, UUID);

CREATE OR REPLACE FUNCTION get_monthly_usage(
  p_user_id UUID,
  p_tool_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_current_month DATE;
  v_uses_count INTEGER;
BEGIN
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
$$ LANGUAGE plpgsql;

-- ========================================
-- PARTE 8: VERIFICAR MIGRAÇÃO
-- ========================================

-- Verificar ferramentas normais
SELECT 
  name,
  category,
  cost_in_points as base,
  cost_free_plan as gratuito,
  cost_stage_plan as estagio,
  cost_professional_plan as profissional
FROM tools_catalog
WHERE is_planning = false AND is_active = true
LIMIT 5;

-- Verificar planejamentos
SELECT 
  name,
  planning_lite_cost_free as experimental_free,
  planning_premium_cost_free as completo_free,
  planning_lite_cost_pro as experimental_pro,
  planning_premium_cost_pro as completo_pro,
  planning_monthly_limit as limite_mensal
FROM tools_catalog
WHERE is_planning = true AND is_active = true;

-- Verificar se tabela foi criada
SELECT COUNT(*) as total_registros FROM tools_usage_monthly;

-- ========================================
-- PARTE 9: CRIAR POLICY RLS
-- ========================================

-- Habilitar RLS
ALTER TABLE tools_usage_monthly ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários só veem seus próprios registros
CREATE POLICY "Usuários podem ver apenas seus usos"
ON tools_usage_monthly
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Sistema pode inserir/atualizar
CREATE POLICY "Sistema pode gerenciar usos"
ON tools_usage_monthly
FOR ALL
USING (true)
WITH CHECK (true);

-- ========================================
-- RESULTADOS ESPERADOS
-- ========================================

/**
 * Após migração:
 * 
 * 1. Ferramentas NORMAIS:
 *    - Gratuito: paga 2x (ex: 2 créditos)
 *    - Estágio: paga 1.5x (ex: 2 créditos arredondado)
 *    - Profissional: paga 1x (ex: 1 crédito)
 * 
 * 2. Ferramentas de PLANEJAMENTO:
 *    - Gratuito:
 *      * Experimental: 1 crédito
 *      * Completo: 15 créditos
 *    - Profissional:
 *      * 20 usos grátis/mês
 *      * Após limite:
 *        - Experimental: 1 crédito
 *        - Completo: 6 créditos
 * 
 * 3. Controle Mensal:
 *    - Tabela tools_usage_monthly criada
 *    - Functions para incrementar/consultar
 *    - Reset automático a cada mês
 */
