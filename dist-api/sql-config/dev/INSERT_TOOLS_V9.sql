-- ========================================
-- CADASTRAR FERRAMENTAS V9 NO BANCO
-- ========================================
-- Ferramentas que existem em código mas não no tools_catalog

-- 1. exemplo-test (ferramenta de teste)
INSERT INTO tools_catalog (
    slug,
    name,
    description,
    category,
    tool_type,
    icon,
    cost_in_points,
    is_active,
    display_order
) VALUES (
    'exemplo-test',
    'Exemplo de Teste V9',
    'Ferramenta de teste para validar sistema de auto-discovery',
    'Teste',
    'complementar',
    '🧪',
    0,
    true,
    999
) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = true;

-- 2. calculadora-simples
INSERT INTO tools_catalog (
    slug,
    name,
    description,
    category,
    tool_type,
    icon,
    cost_in_points,
    is_active,
    display_order
) VALUES (
    'calculadora-simples',
    'Calculadora Simples',
    'Calculadora com operações básicas (soma, subtração, multiplicação, divisão)',
    'Cálculos',
    'complementar',
    '🔢',
    1,
    true,
    100
) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = true;

-- 3. conversor-moeda
INSERT INTO tools_catalog (
    slug,
    name,
    description,
    category,
    tool_type,
    icon,
    cost_in_points,
    is_active,
    display_order
) VALUES (
    'conversor-moeda',
    'Conversor de Moeda',
    'Converte valores entre diferentes moedas usando taxa de câmbio atual',
    'Cálculos',
    'complementar',
    '💱',
    2,
    true,
    101
) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = true;

-- 4. gerador-pdf
INSERT INTO tools_catalog (
    slug,
    name,
    description,
    category,
    tool_type,
    icon,
    cost_in_points,
    is_active,
    display_order
) VALUES (
    'gerador-pdf',
    'Gerador de PDF',
    'Gera documentos PDF a partir de templates personalizáveis',
    'Documentos',
    'complementar',
    '📄',
    3,
    true,
    102
) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = true;

-- Verificar inserção
SELECT slug, name, cost_in_points, is_active 
FROM tools_catalog 
WHERE slug IN ('exemplo-test', 'calculadora-simples', 'conversor-moeda', 'gerador-pdf')
ORDER BY slug;
