-- ========================================
-- TABELA COMPLETA: tools_catalog
-- Com valores atualizados para sistema unificado
-- ========================================

DELETE FROM tools_catalog; -- Limpar tabela (CUIDADO: apenas em dev!)

-- FERRAMENTAS COMPLEMENTARES (SIMPLES - 1 crédito base)
INSERT INTO tools_catalog (
  id, name, slug, description, category, 
  cost_in_points, cost_free_plan, cost_stage_plan, cost_professional_plan,
  is_planning, is_active, tool_type, access_level, display_order, planning_monthly_limit
) VALUES
-- Validações (simples e rápidas)
(
  'ac2681fb-0480-4494-bdd0-56ce44b12fee',
  'validador_cpf', 'validador_cpf',
  'Validação e formatação de números de CPF',
  'Validações',
  1, 2, 2, 1, -- base=1, gratuito=2, estágio=2, pro=1
  false, true, 'complementar', 'free', 1, 20
),
(
  '2f0a8183-720d-4a9c-b59c-89d7201087de',
  'validador_cnpj', 'validador_cnpj',
  'Validação e formatação de números de CNPJ',
  'Validações',
  1, 2, 2, 1,
  false, true, 'complementar', 'free', 2, 20
),

-- FERRAMENTAS DE IA (SIMPLES - 1 crédito base)
(
  'bba2567f-2399-4fef-912c-1c1f5df425c1',
  'consulta_cep', 'ia_cep',
  'Busca de endereço completo através do CEP via API dos Correios',
  'Validações',
  1, 2, 2, 1,
  false, true, 'ia', 'free', 10, 20
),

-- FERRAMENTAS COMPLEMENTARES (MÉDIAS - 2 créditos base)
(
  '18524383-5f15-478b-9f36-85b765f0b407',
  'calc_ferias', 'calc_ferias',
  'Cálculo de férias simples, proporcionais, em dobro e abono pecuniário com 1/3 constitucional',
  'Trabalhista',
  2, 4, 3, 2,
  false, true, 'complementar', 'free', 3, 20
),
(
  'de82725a-8e00-4fa8-961e-9adfc2df8cee',
  'calc_13_salario', 'calc_13_salario',
  'Cálculo de 13º salário proporcional e integral com descontos automáticos',
  'Trabalhista',
  2, 4, 3, 2,
  false, true, 'complementar', 'free', 4, 20
),
(
  'e52649e9-f28f-443b-bcf4-a86e59dc9a20',
  'calc_rescisao', 'calc_rescisao',
  'Cálculo completo de rescisão trabalhista: aviso prévio, férias, 13º, FGTS e multa de 40%',
  'Trabalhista',
  2, 4, 3, 2,
  false, true, 'complementar', 'free', 5, 20
),
(
  '187c8afe-58c2-46dd-9a26-6e7304509952',
  'calc_tempo_contribuicao', 'calc_tempo_contribuicao',
  'Cálculo de tempo de contribuição com conversão de tempo especial e regras de transição',
  'Previdenciário',
  2, 4, 3, 2,
  false, true, 'complementar', 'free', 6, 20
),
(
  'efeb8ee9-eb06-4d3f-adf6-f3501a8fa520',
  'calc_acumulacao', 'calc_acumulacao',
  'Verificação de possibilidade de acumulação de benefícios previdenciários',
  'Previdenciário',
  2, 4, 3, 2,
  false, true, 'complementar', 'free', 7, 20
),
(
  'ea3dea71-7908-459d-b158-32f26ba6f926',
  'calc_juros', 'calc_juros',
  'Cálculo de juros simples e compostos com múltiplos índices',
  'Cálculos',
  2, 4, 3, 2,
  false, true, 'complementar', 'free', 8, 20
),
(
  'e42a95bf-4769-47be-b884-4573482fddda',
  'comparador_indices', 'comparador_indices',
  'Compare rendimentos entre diferentes índices econômicos no mesmo período',
  'Cálculos',
  2, 4, 3, 2,
  false, true, 'complementar', 'free', 9, 20
),
(
  'fde65e2b-b03e-4d1b-b04b-6ea486564fa6',
  'atualizacao_monetaria', 'atualizacao_monetaria',
  'Correção de valores com IPCA, INPC, IGP-M, Selic, TR e outros índices desde 1994',
  'Cálculos',
  2, 4, 3, 2,
  false, true, 'complementar', 'free', 11, 20
),

-- FERRAMENTAS COMPLEMENTARES (COMPLEXAS - 3 créditos base)
(
  '455131df-9e7c-40ba-94c8-45ad002560d8',
  'extrator_cnis', 'extrator_cnis',
  'Extração e análise automatizada de vínculos previdenciários do CNIS em PDF',
  'Previdenciário',
  3, 6, 5, 3,
  false, true, 'complementar', 'free', 12, 20
),

-- PLANEJAMENTOS (5 lite / 15 premium base)
(
  '3d0357a9-3104-4e8f-b754-7a28e7673930',
  'planejamento_previdenciario', 'planejamento_previdenciario',
  'Análise completa para aposentadoria: tempo de contribuição, simulação de cenários, melhor momento e valor do benefício',
  'Planejamento',
  NULL, NULL, NULL, NULL, -- Usa planning_*_cost_*
  true, true, 'planejamento', 'professional', 20, 20
),
(
  '26670259-fa42-4e12-b672-4adde168d7bc',
  'planejamento_trabalhista', 'planejamento_trabalhista',
  'Análise de contratos, cálculos de rescisão, direitos trabalhistas e compliance profissional',
  'Planejamento',
  NULL, NULL, NULL, NULL,
  true, true, 'planejamento', 'professional', 21, 20
),
(
  'be7d591a-7b5a-42ec-ab1b-860d251a4d88',
  'planejamento_assistencial', 'planejamento_assistencial',
  'Análise de benefícios assistenciais (BPC/LOAS), requisitos e documentação necessária',
  'Planejamento',
  NULL, NULL, NULL, NULL,
  true, true, 'planejamento', 'professional', 22, 20
);

-- Adicionar colunas de planejamento
UPDATE tools_catalog
SET 
  planning_lite_cost_free = 5,
  planning_premium_cost_free = 15
WHERE is_planning = true;

-- Verificar resultado
SELECT 
  slug,
  tool_type,
  CASE 
    WHEN is_planning THEN 'Lite: ' || planning_lite_cost_free || ' | Premium: ' || planning_premium_cost_free
    ELSE 'Fixo: ' || cost_in_points
  END as custo_base,
  CASE 
    WHEN is_planning THEN 'Gratuito: Lite ' || (planning_lite_cost_free * 2) || ', Premium ' || (planning_premium_cost_free * 2)
    ELSE 'Gratuito: ' || cost_free_plan
  END as exemplo_gratuito,
  CASE 
    WHEN is_planning THEN 'PRO (após 20): Lite ' || planning_lite_cost_free || ', Premium ' || planning_premium_cost_free
    ELSE 'PRO: ' || cost_professional_plan
  END as exemplo_pro
FROM tools_catalog
ORDER BY tool_type, display_order;
