-- ============================================
-- VER DADOS REAIS DO BANCO
-- ============================================

-- 1. Meu perfil completo
SELECT * FROM public.profiles WHERE email = 'gilbertoromanholew@gmail.com';

-- 2. Minha wallet (ver nomes das colunas e valores)
SELECT * FROM economy.user_wallets LIMIT 1;

-- 3. Minhas transações
SELECT * FROM economy.transactions ORDER BY created_at DESC LIMIT 5;

-- 4. Ferramentas disponíveis no catálogo
SELECT * FROM tools.catalog ORDER BY name LIMIT 20;

-- 5. Ver colunas da wallet para atualizar a documentação
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'economy' AND table_name = 'user_wallets'
ORDER BY ordinal_position;

-- 6. Ver colunas do catalog
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'tools' AND table_name = 'catalog'
ORDER BY ordinal_position;

-- 7. Ver colunas das transactions
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'economy' AND table_name = 'transactions'
ORDER BY ordinal_position;

-- 8. Ver colunas das executions
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'tools' AND table_name = 'executions'
ORDER BY ordinal_position;
