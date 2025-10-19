-- ============================================
-- DESABILITAR RLS EM tool_costs (RECOMENDADO)
-- ============================================

-- Opção 1: Desabilitar RLS completamente (ferramemtas são públicas)
ALTER TABLE tool_costs DISABLE ROW LEVEL SECURITY;

-- ============================================
-- OU Opção 2: Criar política de leitura pública
-- ============================================

-- ALTER TABLE tool_costs ENABLE ROW LEVEL SECURITY;
-- 
-- -- Permitir leitura pública de ferramentas ativas
-- CREATE POLICY "Ferramentas públicas" ON tool_costs
--     FOR SELECT
--     USING (is_active = true);
-- 
-- -- Permitir admin service role fazer tudo
-- CREATE POLICY "Admin total" ON tool_costs
--     FOR ALL
--     USING (auth.role() = 'service_role');
