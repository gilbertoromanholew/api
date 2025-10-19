-- ============================================
-- LIMPAR TOTAL E REINSERIR
-- ============================================

-- 1. FORÇAR DELETE (ignora dependências com CASCADE se necessário)
TRUNCATE TABLE tool_costs CASCADE;

-- 2. INSERIR AS 15 FERRAMENTAS CORRETAS
INSERT INTO tool_costs (tool_name, display_name, description, points_cost, category) VALUES
-- PLANEJAMENTO (3 pontos cada)
('planejamento_previdenciario', 'Planejamento Previdenciário', 'Análise completa para aposentadoria: tempo de contribuição, simulação de cenários, melhor momento e valor do benefício', 3, 'Planejamento'),
('planejamento_trabalhista', 'Planejamento Trabalhista', 'Análise de contratos, cálculos de rescisão, direitos trabalhistas e compliance profissional', 3, 'Planejamento'),
('planejamento_assistencial', 'Planejamento Assistencial', 'Análise de benefícios assistenciais (BPC/LOAS), requisitos e documentação necessária', 3, 'Planejamento'),

-- TRABALHISTA (1 ponto cada)
('calc_rescisao', 'Calculadora de Rescisão', 'Cálculo completo de rescisão trabalhista: aviso prévio, férias, 13º, FGTS e multa de 40%', 1, 'Trabalhista'),
('calc_ferias', 'Calculadora de Férias', 'Cálculo de férias simples, proporcionais, em dobro e abono pecuniário com 1/3 constitucional', 1, 'Trabalhista'),
('calc_13_salario', 'Calculadora de 13º Salário', 'Cálculo de 13º salário proporcional e integral com descontos automáticos', 1, 'Trabalhista'),

-- PREVIDENCIÁRIO (1 ponto cada)
('extrator_cnis', 'Extrator de CNIS', 'Extração e análise automatizada de vínculos previdenciários do CNIS em PDF', 1, 'Previdenciário'),
('calc_tempo_contribuicao', 'Tempo de Contribuição', 'Cálculo de tempo de contribuição com conversão de tempo especial e regras de transição', 1, 'Previdenciário'),
('calc_acumulacao', 'Análise de Acumulação', 'Verificação de possibilidade de acumulação de benefícios previdenciários', 1, 'Previdenciário'),

-- CÁLCULOS (1 ponto cada)
('atualizacao_monetaria', 'Atualização Monetária', 'Correção de valores com IPCA, INPC, IGP-M, Selic, TR e outros índices desde 1994', 1, 'Cálculos'),
('calc_juros', 'Calculadora de Juros', 'Cálculo de juros simples e compostos com múltiplos índices', 1, 'Cálculos'),
('comparador_indices', 'Comparador de Índices', 'Compare rendimentos entre diferentes índices econômicos no mesmo período', 1, 'Cálculos'),

-- VALIDAÇÕES (1 ponto cada)
('validador_cpf', 'Validador de CPF', 'Validação e formatação de números de CPF', 1, 'Validações'),
('validador_cnpj', 'Validador de CNPJ', 'Validação e formatação de números de CNPJ', 1, 'Validações'),
('consulta_cep', 'Consulta CEP', 'Busca de endereço completo através do CEP via API dos Correios', 1, 'Validações');

-- 3. VERIFICAR RESULTADO FINAL
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

-- DEVE RETORNAR:
-- Planejamento    | 3 | 9  | 3.00
-- Trabalhista     | 3 | 3  | 1.00
-- Previdenciário  | 3 | 3  | 1.00
-- Cálculos        | 3 | 3  | 1.00
-- Validações      | 3 | 3  | 1.00
-- 
-- TOTAIS: 15 ferramentas, 5 categorias, 21 pontos
