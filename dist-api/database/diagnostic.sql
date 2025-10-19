-- ============================================
-- DIAGNÓSTICO COMPLETO
-- ============================================

-- 1. Contar TODAS as ferramentas (ativas e inativas)
SELECT COUNT(*) as total FROM tool_costs;

-- 2. Verificar se há ferramentas
SELECT * FROM tool_costs LIMIT 5;

-- 3. Verificar RLS (Row Level Security)
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'tool_costs';

-- 4. Ver políticas RLS ativas
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'tool_costs';

-- 5. Se a tabela estiver vazia, inserir novamente
-- Descomente as linhas abaixo:

-- TRUNCATE TABLE tool_costs CASCADE;
-- 
-- INSERT INTO tool_costs (tool_name, display_name, description, points_cost, category) VALUES
-- ('planejamento_previdenciario', 'Planejamento Previdenciário', 'Análise completa para aposentadoria', 3, 'Planejamento'),
-- ('planejamento_trabalhista', 'Planejamento Trabalhista', 'Análise de contratos e cálculos', 3, 'Planejamento'),
-- ('planejamento_assistencial', 'Planejamento Assistencial', 'Análise de benefícios assistenciais', 3, 'Planejamento'),
-- ('calc_rescisao', 'Calculadora de Rescisão', 'Cálculo completo de rescisão', 1, 'Trabalhista'),
-- ('calc_ferias', 'Calculadora de Férias', 'Cálculo de férias', 1, 'Trabalhista'),
-- ('calc_13_salario', 'Calculadora de 13º Salário', 'Cálculo de 13º salário', 1, 'Trabalhista'),
-- ('extrator_cnis', 'Extrator de CNIS', 'Extração de vínculos do CNIS', 1, 'Previdenciário'),
-- ('calc_tempo_contribuicao', 'Tempo de Contribuição', 'Cálculo de tempo de contribuição', 1, 'Previdenciário'),
-- ('calc_acumulacao', 'Análise de Acumulação', 'Verificação de acumulação de benefícios', 1, 'Previdenciário'),
-- ('atualizacao_monetaria', 'Atualização Monetária', 'Correção com IPCA, INPC, etc', 1, 'Cálculos'),
-- ('calc_juros', 'Calculadora de Juros', 'Cálculo de juros simples e compostos', 1, 'Cálculos'),
-- ('comparador_indices', 'Comparador de Índices', 'Compare rendimentos entre índices', 1, 'Cálculos'),
-- ('validador_cpf', 'Validador de CPF', 'Validação de CPF', 1, 'Validações'),
-- ('validador_cnpj', 'Validador de CNPJ', 'Validação de CNPJ', 1, 'Validações'),
-- ('consulta_cep', 'Consulta CEP', 'Busca de endereço por CEP', 1, 'Validações');
-- 
-- SELECT COUNT(*) as total_inserido FROM tool_costs;
