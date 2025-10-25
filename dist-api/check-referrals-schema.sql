-- Verificar estrutura da tabela social.referrals
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'social' 
  AND table_name = 'referrals'
ORDER BY ordinal_position;

-- Ver dados de exemplo
SELECT * FROM social.referrals LIMIT 1;
