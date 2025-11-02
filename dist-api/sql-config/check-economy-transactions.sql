-- Descobrir estrutura da tabela economy_transactions
-- Execute no Supabase SQL Editor

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'economy_transactions'
ORDER BY ordinal_position;
