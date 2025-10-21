-- ============================================
-- FERRAMENTAS REAIS DO SISTEMA
-- ============================================

-- Limpar ferramentas antigas (ATENÇÃO: Remove todas as ferramentas existentes!)
DELETE FROM tool_costs;

-- ====================
-- CATEGORIA 1: PLANEJAMENTO JURÍDICO (3 pontos cada)
-- ====================
INSERT INTO tool_costs (tool_name, display_name, description, points_cost, category)
VALUES 
    ('planejamento_previdenciario', 'Planejamento Previdenciário', 'Análise completa para aposentadoria: tempo de contribuição, simulação de cenários, melhor momento e valor do benefício', 3, 'Planejamento'),
    ('planejamento_trabalhista', 'Planejamento Trabalhista', 'Análise de contratos, cálculos de rescisão, direitos trabalhistas e compliance profissional', 3, 'Planejamento'),
    ('planejamento_assistencial', 'Planejamento Assistencial', 'Análise de benefícios assistenciais (BPC/LOAS), requisitos e documentação necessária', 3, 'Planejamento')
ON CONFLICT (tool_name) DO NOTHING;

-- ====================
-- CATEGORIA 2: FERRAMENTAS TRABALHISTAS (1 ponto cada)
-- ====================
INSERT INTO tool_costs (tool_name, display_name, description, points_cost, category)
VALUES 
    ('calc_rescisao', 'Calculadora de Rescisão', 'Cálculo completo de rescisão trabalhista: aviso prévio, férias, 13º, FGTS e multa de 40%', 1, 'Trabalhista'),
    ('calc_ferias', 'Calculadora de Férias', 'Cálculo de férias simples, proporcionais, em dobro e abono pecuniário com 1/3 constitucional', 1, 'Trabalhista'),
    ('calc_13_salario', 'Calculadora de 13º Salário', 'Cálculo de 13º salário proporcional e integral com descontos automáticos', 1, 'Trabalhista')
ON CONFLICT (tool_name) DO NOTHING;

-- ====================
-- CATEGORIA 3: FERRAMENTAS PREVIDENCIÁRIAS (1 ponto cada)
-- ====================
INSERT INTO tool_costs (tool_name, display_name, description, points_cost, category)
VALUES 
    ('extrator_cnis', 'Extrator de CNIS', 'Extração e análise automatizada de vínculos previdenciários do CNIS em PDF', 1, 'Previdenciário'),
    ('calc_tempo_contribuicao', 'Tempo de Contribuição', 'Cálculo de tempo de contribuição com conversão de tempo especial e regras de transição', 1, 'Previdenciário'),
    ('calc_acumulacao', 'Análise de Acumulação', 'Verificação de possibilidade de acumulação de benefícios previdenciários', 1, 'Previdenciário')
ON CONFLICT (tool_name) DO NOTHING;

-- ====================
-- CATEGORIA 4: CÁLCULOS E CORREÇÕES (1 ponto cada)
-- ====================
INSERT INTO tool_costs (tool_name, display_name, description, points_cost, category)
VALUES 
    ('atualizacao_monetaria', 'Atualização Monetária', 'Correção de valores com IPCA, INPC, IGP-M, Selic, TR e outros índices desde 1994', 1, 'Cálculos'),
    ('calc_juros', 'Calculadora de Juros', 'Cálculo de juros simples e compostos com múltiplos índices', 1, 'Cálculos'),
    ('comparador_indices', 'Comparador de Índices', 'Compare rendimentos entre diferentes índices econômicos no mesmo período', 1, 'Cálculos')
ON CONFLICT (tool_name) DO NOTHING;

-- ====================
-- CATEGORIA 5: VALIDAÇÕES E CONSULTAS (1 ponto cada)
-- ====================
INSERT INTO tool_costs (tool_name, display_name, description, points_cost, category)
VALUES 
    ('validador_cpf', 'Validador de CPF', 'Validação e formatação de números de CPF', 1, 'Validações'),
    ('validador_cnpj', 'Validador de CNPJ', 'Validação e formatação de números de CNPJ', 1, 'Validações'),
    ('consulta_cep', 'Consulta CEP', 'Busca de endereço completo através do CEP via API dos Correios', 1, 'Validações')
ON CONFLICT (tool_name) DO NOTHING;


-- ============================================
-- CONSULTAS DE VERIFICAÇÃO
-- ============================================

-- Resumo por categoria
SELECT 
    category,
    COUNT(*) as total_ferramentas,
    SUM(points_cost) as total_pontos,
    ROUND(AVG(points_cost), 2) as media_pontos
FROM tool_costs
WHERE is_active = true
GROUP BY category
ORDER BY 
    CASE category
        WHEN 'Planejamento' THEN 1
        WHEN 'Trabalhista' THEN 2
        WHEN 'Previdenciário' THEN 3
        WHEN 'Cálculos' THEN 4
        WHEN 'Validações' THEN 5
    END;

-- Lista completa de ferramentas
SELECT 
    category,
    tool_name,
    display_name,
    points_cost
FROM tool_costs
WHERE is_active = true
ORDER BY 
    CASE category
        WHEN 'Planejamento' THEN 1
        WHEN 'Trabalhista' THEN 2
        WHEN 'Previdenciário' THEN 3
        WHEN 'Cálculos' THEN 4
        WHEN 'Validações' THEN 5
    END,
    points_cost DESC,
    display_name;

-- Estatísticas gerais
SELECT 
    COUNT(*) as total_ferramentas,
    COUNT(DISTINCT category) as total_categorias,
    SUM(points_cost) as soma_total_pontos,
    MIN(points_cost) as menor_custo,
    MAX(points_cost) as maior_custo,
    ROUND(AVG(points_cost), 2) as custo_medio
FROM tool_costs
WHERE is_active = true;
