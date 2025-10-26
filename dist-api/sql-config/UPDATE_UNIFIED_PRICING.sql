/**
 * ========================================
 * ATUALIZAÇÃO: Custos Base para Sistema Unificado
 * ========================================
 * 
 * Data: 2025-10-26
 * Objetivo: Definir custos base realistas para TODAS as ferramentas
 * 
 * LÓGICA UNIFICADA:
 * - TODOS os custos são multiplicados por plano:
 *   * Gratuito: base × 2
 *   * Estágio: base × 1.5
 *   * Profissional: base × 1 (após limite para planejamento)
 * 
 * VALORES SUGERIDOS:
 * 
 * PLANEJAMENTOS (is_planning = true):
 * - Lite (experimental): 5 créditos base
 * - Premium (completo): 15 créditos base
 * - Limite mensal PRO: 20 usos grátis
 * 
 * Exemplos de cobrança:
 * - Gratuito: Lite 10, Premium 30
 * - Estágio: Lite 8, Premium 23
 * - Profissional (após 20 usos): Lite 5, Premium 15
 * 
 * FERRAMENTAS NORMAIS (is_planning = false):
 * - Simples (validadores, cálculos básicos): 1 crédito base
 * - Médias (cálculos complexos, APIs): 2 créditos base
 * - Complexas (processamento PDF, IA): 3 créditos base
 * 
 * Exemplos de cobrança:
 * - Gratuito: 2, 4, 6 créditos
 * - Estágio: 1.5, 3, 4.5 créditos
 * - Profissional: 1, 2, 3 créditos
 */

-- ========================================
-- PARTE 1: PLANEJAMENTOS
-- ========================================

-- Atualizar CUSTOS BASE dos planejamentos
UPDATE tools_catalog
SET 
  planning_lite_cost_free = 5,     -- Base Lite: 5 créditos
  planning_premium_cost_free = 15, -- Base Premium: 15 créditos
  planning_monthly_limit = 20,     -- 20 usos grátis/mês para PRO
  planning_lite_cost_pro = NULL,   -- ❌ REMOVER: não usamos mais
  planning_premium_cost_pro = NULL -- ❌ REMOVER: não usamos mais
WHERE is_planning = true;

-- ========================================
-- PARTE 2: FERRAMENTAS NORMAIS
-- ========================================

-- SIMPLES (1 crédito base) - Validações rápidas
UPDATE tools_catalog
SET 
  cost_in_points = 1,
  cost_free_plan = 2,     -- Gratuito: 2
  cost_stage_plan = 2,    -- Estágio: 1.5 → arredonda para 2
  cost_professional_plan = 1  -- PRO: 1
WHERE slug IN (
  'validador_cpf',
  'validador_cnpj',
  'ia_cep'  -- Consulta CEP simples
);

-- MÉDIAS (2 créditos base) - Cálculos e processamentos
UPDATE tools_catalog
SET 
  cost_in_points = 2,
  cost_free_plan = 4,     -- Gratuito: 4
  cost_stage_plan = 3,    -- Estágio: 3
  cost_professional_plan = 2  -- PRO: 2
WHERE slug IN (
  'calc_ferias',
  'calc_13_salario',
  'calc_rescisao',
  'calc_tempo_contribuicao',
  'calc_acumulacao',
  'calc_juros',
  'comparador_indices',
  'atualizacao_monetaria'
);

-- COMPLEXAS (3 créditos base) - Processamento pesado
UPDATE tools_catalog
SET 
  cost_in_points = 3,
  cost_free_plan = 6,     -- Gratuito: 6
  cost_stage_plan = 5,    -- Estágio: 4.5 → arredonda para 5
  cost_professional_plan = 3  -- PRO: 3
WHERE slug IN (
  'extrator_cnis'  -- Processa PDF
);

-- ========================================
-- PARTE 3: VERIFICAÇÃO
-- ========================================

-- Ver planejamentos
SELECT 
  slug,
  name,
  is_planning,
  planning_lite_cost_free as lite_base,
  planning_premium_cost_free as premium_base,
  planning_monthly_limit as limite_mensal,
  'Gratuito: Lite=' || (planning_lite_cost_free * 2) || ', Premium=' || (planning_premium_cost_free * 2) as exemplo_gratuito,
  'Estágio: Lite=' || CEIL(planning_lite_cost_free * 1.5) || ', Premium=' || CEIL(planning_premium_cost_free * 1.5) as exemplo_estagio,
  'PRO: Lite=' || planning_lite_cost_free || ', Premium=' || planning_premium_cost_free as exemplo_pro
FROM tools_catalog
WHERE is_planning = true
ORDER BY slug;

-- Ver ferramentas normais
SELECT 
  slug,
  name,
  cost_in_points as base,
  cost_free_plan as gratuito,
  cost_stage_plan as estagio,
  cost_professional_plan as profissional,
  CASE 
    WHEN cost_in_points = 1 THEN 'SIMPLES'
    WHEN cost_in_points = 2 THEN 'MÉDIA'
    WHEN cost_in_points = 3 THEN 'COMPLEXA'
    ELSE 'OUTRO'
  END as nivel_complexidade
FROM tools_catalog
WHERE is_planning = false
ORDER BY cost_in_points, slug;

-- Resumo geral
SELECT 
  is_planning,
  COUNT(*) as total,
  AVG(CASE WHEN is_planning = false THEN cost_in_points ELSE planning_lite_cost_free END) as custo_medio_base,
  MIN(CASE WHEN is_planning = false THEN cost_in_points ELSE planning_lite_cost_free END) as custo_min,
  MAX(CASE WHEN is_planning = false THEN cost_premium_cost_free ELSE planning_premium_cost_free END) as custo_max
FROM tools_catalog
GROUP BY is_planning;

-- ========================================
-- COMENTÁRIOS
-- ========================================

COMMENT ON COLUMN tools_catalog.planning_lite_cost_free IS 
'Custo BASE do planejamento experimental. Será multiplicado: Gratuito×2, Estágio×1.5, PRO×1 (após 20 usos)';

COMMENT ON COLUMN tools_catalog.planning_premium_cost_free IS 
'Custo BASE do planejamento completo. Será multiplicado: Gratuito×2, Estágio×1.5, PRO×1 (após 20 usos)';

COMMENT ON COLUMN tools_catalog.cost_in_points IS 
'Custo BASE da ferramenta normal. Será multiplicado: Gratuito×2, Estágio×1.5, PRO×1';
