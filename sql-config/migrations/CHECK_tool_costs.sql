-- Verificar estrutura da tabela tool_costs
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tool_costs'
ORDER BY ordinal_position;
