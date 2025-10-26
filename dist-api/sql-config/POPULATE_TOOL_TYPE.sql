-- ========================================
-- POPULAR COLUNA tool_type NAS FERRAMENTAS
-- ========================================
-- Este script categoriza as ferramentas existentes baseado no slug
-- Executar no Supabase SQL Editor

-- 1️⃣ PLANEJAMENTOS (Contrato Lite e Premium)
UPDATE tools_catalog 
SET tool_type = 'planejamento'
WHERE slug IN (
    'contrato-lite',
    'contrato-premium'
)
AND tool_type IS NULL;

-- 2️⃣ FERRAMENTAS DE IA (Assistentes, Geradores, Análises)
UPDATE tools_catalog 
SET tool_type = 'ia'
WHERE slug IN (
    'assistente-juridico',
    'gerador-peticoes',
    'analise-contratos',
    'pesquisa-jurisprudencia',
    'revisor-textos',
    'calculadora-juridica',
    'gerador-documentos'
)
AND tool_type IS NULL;

-- 3️⃣ FERRAMENTAS COMPLEMENTARES (Utilidades, Gestão, etc)
UPDATE tools_catalog 
SET tool_type = 'complementar'
WHERE slug IN (
    'conversor-pdf',
    'organizador-processos',
    'agenda-prazos',
    'gerador-relatorios',
    'validador-cpf-cnpj',
    'calculadora-prazos',
    'biblioteca-modelos'
)
AND tool_type IS NULL;

-- 4️⃣ FALLBACK: Se alguma ferramenta ficou sem tipo, define como complementar
UPDATE tools_catalog 
SET tool_type = 'complementar'
WHERE tool_type IS NULL;

-- ✅ VERIFICAR RESULTADO
SELECT 
    tool_type,
    COUNT(*) as total,
    STRING_AGG(name, ', ') as ferramentas
FROM tools_catalog
WHERE is_active = true
GROUP BY tool_type
ORDER BY 
    CASE tool_type
        WHEN 'planejamento' THEN 1
        WHEN 'ia' THEN 2
        WHEN 'complementar' THEN 3
    END;

-- Deve retornar algo como:
-- planejamento    | 2  | Contrato Lite, Contrato Premium
-- ia              | 7  | Assistente Jurídico, Gerador de Petições, ...
-- complementar    | 6  | Conversor PDF, Organizador de Processos, ...
