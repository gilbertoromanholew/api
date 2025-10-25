-- ============================================
-- SEED: Ferramentas Iniciais
-- Data: 25/10/2025
-- Popula tools_catalog com ferramentas básicas
-- ============================================

BEGIN;

-- Limpar ferramentas antigas (se necessário)
-- TRUNCATE TABLE public.tools_catalog CASCADE;

-- Inserir 15 ferramentas
INSERT INTO public.tools_catalog (
  slug,
  name,
  description,
  category,
  cost_in_points,
  is_active,
  icon_url,
  created_at,
  updated_at
) VALUES
  -- CALCULADORAS TRABALHISTAS
  ('calculo-rescisao', 'Cálculo de Rescisão', 'Calcule verbas rescisórias completas com 13º, férias e FGTS', 'Trabalhista', 5, true, '💰', NOW(), NOW()),
  ('calculo-ferias', 'Cálculo de Férias', 'Calcule férias proporcionais e vencidas com precisão', 'Trabalhista', 3, true, '🏖️', NOW(), NOW()),
  ('calculo-13-salario', 'Cálculo de 13º Salário', 'Calcule 13º salário proporcional e integral', 'Trabalhista', 3, true, '🎁', NOW(), NOW()),
  ('calculo-hora-extra', 'Cálculo de Horas Extras', 'Calcule horas extras 50% e 100% com adicionais', 'Trabalhista', 4, true, '⏰', NOW(), NOW()),
  
  -- CALCULADORAS PREVIDENCIÁRIAS
  ('tempo-contribuicao', 'Tempo de Contribuição', 'Calcule tempo total de contribuição ao INSS', 'Previdenciário', 6, true, '📅', NOW(), NOW()),
  ('calculo-aposentadoria', 'Cálculo de Aposentadoria', 'Simule valor de aposentadoria por idade ou tempo', 'Previdenciário', 8, true, '🧓', NOW(), NOW()),
  
  -- CALCULADORAS JURÍDICAS
  ('atualizacao-divida', 'Atualização de Dívida', 'Atualize dívidas com juros e correção monetária', 'Cível', 5, true, '📈', NOW(), NOW()),
  ('calculo-juros', 'Cálculo de Juros', 'Calcule juros simples e compostos', 'Cível', 4, true, '💵', NOW(), NOW()),
  ('prescricao-trabalhista', 'Prescrição Trabalhista', 'Verifique prazos prescricionais trabalhistas', 'Trabalhista', 3, true, '⏳', NOW(), NOW()),
  
  -- GERAÇÃO DE DOCUMENTOS
  ('peticao-inicial', 'Petição Inicial', 'Gere modelo de petição inicial trabalhista', 'Documentos', 10, true, '📄', NOW(), NOW()),
  ('contrato-trabalho', 'Contrato de Trabalho', 'Gere modelo de contrato de trabalho CLT', 'Documentos', 8, true, '📋', NOW(), NOW()),
  ('procuracao', 'Procuração', 'Gere modelo de procuração ad judicia', 'Documentos', 5, true, '✍️', NOW(), NOW()),
  
  -- FERRAMENTAS PREMIUM
  ('analise-processo', 'Análise de Processo', 'IA analisa processo e sugere estratégias (PRO)', 'IA Premium', 20, true, '🤖', NOW(), NOW()),
  ('jurisprudencia-ia', 'Busca de Jurisprudência IA', 'Busque jurisprudências relevantes com IA (PRO)', 'IA Premium', 15, true, '⚖️', NOW(), NOW()),
  ('minutas-personalizadas', 'Minutas Personalizadas IA', 'Gere minutas customizadas com IA (PRO)', 'IA Premium', 25, true, '✨', NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  cost_in_points = EXCLUDED.cost_in_points,
  is_active = EXCLUDED.is_active,
  icon_url = EXCLUDED.icon_url,
  updated_at = NOW();

-- Verificação
DO $$
DECLARE
  v_total INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total FROM public.tools_catalog WHERE is_active = true;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '✅ FERRAMENTAS POPULADAS';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE 'Total de ferramentas ativas: %', v_total;
  RAISE NOTICE '';
  
  IF v_total >= 15 THEN
    RAISE NOTICE '✅ Sucesso! % ferramentas cadastradas', v_total;
  ELSE
    RAISE WARNING '⚠️ Esperado: 15+ ferramentas. Encontrado: %', v_total;
  END IF;
  
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

COMMIT;
