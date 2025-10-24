-- ============================================
-- PASSO 1: VERIFICAR DADOS ATUAIS
-- ============================================
-- Execute no Supabase SQL Editor (https://mpanel.samm.host)
-- Login: 605YRZ1QgfaGfDDZ / Qc9WRNP0h0qJY4h2Ja2GgwrVqqx9aiUv
-- ============================================

-- Verificar se tabelas existem
SELECT 
  '1. profiles' as tabela, 
  COUNT(*) as total,
  (SELECT COUNT(*) FROM public.profiles WHERE referred_by IS NOT NULL)::text as info
FROM public.profiles
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')

UNION ALL

SELECT 
  '2. user_points' as tabela, 
  COUNT(*) as total,
  COALESCE(SUM(free_points + paid_points), 0)::text || ' pontos totais' as info
FROM public.user_points
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_points')

UNION ALL

SELECT 
  '3. point_transactions' as tabela, 
  COUNT(*) as total,
  (SELECT COUNT(DISTINCT user_id) FROM public.point_transactions)::text || ' usuarios distintos' as info
FROM public.point_transactions
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'point_transactions')

UNION ALL

SELECT 
  '4. point_packages' as tabela, 
  COUNT(*) as total,
  (SELECT COUNT(*) FROM public.point_packages WHERE is_active = true)::text || ' pacotes ativos' as info
FROM public.point_packages
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'point_packages')

UNION ALL

SELECT 
  '5. tool_costs' as tabela, 
  COUNT(*) as total,
  (SELECT COUNT(*) FROM public.tool_costs WHERE is_active = true)::text || ' ferramentas ativas' as info
FROM public.tool_costs
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tool_costs')

UNION ALL

SELECT 
  '6. purchases' as tabela, 
  COUNT(*) as total,
  COALESCE((SELECT COUNT(*) FROM public.purchases WHERE status = 'succeeded'), 0)::text || ' compras concluidas' as info
FROM public.purchases
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchases')

ORDER BY tabela;

-- ============================================
-- RESULTADO ESPERADO (exemplo):
-- ============================================
-- tabela              | total | com_referencia
-- ------------------- | ----- | --------------
-- 1. profiles         | 1     | 0 com_referencia
-- 2. user_points      | 1     | 100 pontos
-- 3. point_transactions| 1     | 1 usuarios
-- 4. point_packages   | 4     | 4 ativos
-- 5. tool_costs       | 15    | 15 ativos
-- 6. purchases        | 0     | 0 concluidas
-- ============================================

-- 📝 ANOTE ESSES NÚMEROS! Vamos verificar depois da migração.
