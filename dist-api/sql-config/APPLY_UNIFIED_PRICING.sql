/**
 * ========================================
 * FIX: Remover constraint antiga antes de atualizar
 * ========================================
 * 
 * Data: 2025-10-26
 * 
 * PROBLEMA:
 * - Constraint "check_planning_costs" está bloqueando a atualização
 * - Foi criada no sistema antigo com validações diferentes
 * 
 * SOLUÇÃO:
 * 1. Remover constraint antiga
 * 2. Aplicar novos valores
 * 3. (Opcional) Criar nova constraint se necessário
 */

-- ========================================
-- PARTE 1: REMOVER CONSTRAINT ANTIGA
-- ========================================

ALTER TABLE tools_catalog
DROP CONSTRAINT IF EXISTS check_planning_costs;

ALTER TABLE tools_catalog
DROP CONSTRAINT IF EXISTS check_planning_cost_logic;

-- ========================================
-- PARTE 2: ATUALIZAR CUSTOS BASE DOS PLANEJAMENTOS
-- ========================================

UPDATE tools_catalog
SET 
  planning_lite_cost_free = 5,     -- Base Lite: 5 créditos
  planning_premium_cost_free = 15, -- Base Premium: 15 créditos
  planning_monthly_limit = 20,     -- 20 usos grátis/mês para PRO
  planning_lite_cost_pro = NULL,   -- ❌ REMOVER: não usamos mais
  planning_premium_cost_pro = NULL -- ❌ REMOVER: não usamos mais
WHERE is_planning = true;

-- ========================================
-- PARTE 3: FERRAMENTAS NORMAIS
-- ========================================

-- SIMPLES (1 crédito base)
UPDATE tools_catalog
SET 
  cost_in_points = 1,
  cost_free_plan = 2,
  cost_stage_plan = 2,
  cost_professional_plan = 1
WHERE slug IN (
  'validador_cpf',
  'validador_cnpj',
  'ia_cep'
);

-- MÉDIAS (2 créditos base)
UPDATE tools_catalog
SET 
  cost_in_points = 2,
  cost_free_plan = 4,
  cost_stage_plan = 3,
  cost_professional_plan = 2
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

-- COMPLEXAS (3 créditos base)
UPDATE tools_catalog
SET 
  cost_in_points = 3,
  cost_free_plan = 6,
  cost_stage_plan = 5,
  cost_professional_plan = 3
WHERE slug IN (
  'extrator_cnis'
);

-- ========================================
-- PARTE 4: VERIFICAÇÃO
-- ========================================

-- Ver planejamentos atualizados
SELECT 
  slug,
  name,
  is_planning,
  planning_lite_cost_free as lite_base,
  planning_premium_cost_free as premium_base,
  planning_monthly_limit as limite_mensal,
  planning_lite_cost_pro as lite_pro_old,
  planning_premium_cost_pro as premium_pro_old,
  'Gratuito: Lite=' || (planning_lite_cost_free * 2) || ', Premium=' || (planning_premium_cost_free * 2) as exemplo_gratuito,
  'Estágio: Lite=' || CEIL(planning_lite_cost_free * 1.5) || ', Premium=' || CEIL(planning_premium_cost_free * 1.5) as exemplo_estagio,
  'PRO (após 20): Lite=' || planning_lite_cost_free || ', Premium=' || planning_premium_cost_free as exemplo_pro
FROM tools_catalog
WHERE is_planning = true
ORDER BY slug;

-- Ver ferramentas normais atualizadas
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
  AVG(CASE WHEN is_planning = false THEN cost_in_points ELSE planning_lite_cost_free END) as custo_medio_base
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

-- ========================================
-- SUCESSO!
-- ========================================

SELECT '✅ Sistema de precificação unificado aplicado com sucesso!' as status;
