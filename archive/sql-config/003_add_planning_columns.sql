-- =============================================
-- ADICIONAR COLUNAS DE PLANEJAMENTO NA TOOLS_CATALOG
-- =============================================
-- Execute este SQL no Supabase SQL Editor

-- Adicionar colunas se não existirem
ALTER TABLE tools_catalog 
ADD COLUMN IF NOT EXISTS is_planning BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS planning_base_cost INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS planning_full_cost INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS planning_monthly_limit INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS planning_pro_overflow_cost INTEGER DEFAULT 6;

-- Atualizar as 3 ferramentas de planejamento
UPDATE tools_catalog
SET 
  is_planning = TRUE,
  planning_base_cost = 3,        -- Experimental (gratuitos)
  planning_full_cost = 15,       -- Full (gratuitos)
  planning_monthly_limit = 20,   -- Limite mensal PRO
  planning_pro_overflow_cost = 6 -- Custo após exceder limite PRO
WHERE 
  slug LIKE 'planejamento_%' 
  OR slug IN ('planejamento-assistencial', 'planejamento-previdenciario', 'planejamento-trabalhista')
  OR name LIKE '%Planejamento%';

-- Verificar se deu certo
SELECT 
  id,
  name,
  slug,
  is_planning,
  planning_base_cost,
  planning_full_cost,
  planning_monthly_limit,
  planning_pro_overflow_cost
FROM tools_catalog
WHERE is_planning = TRUE;
