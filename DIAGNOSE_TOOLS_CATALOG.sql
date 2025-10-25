-- ============================================
-- DIAGNÓSTICO: tools_catalog retornando 0
-- Data: 25/10/2025
-- ============================================

-- 1. Verificar se tabela existe
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename = 'tools_catalog';

-- 2. Contar TODOS os registros (ignorando filtros)
SELECT COUNT(*) as total_registros
FROM public.tools_catalog;

-- 3. Contar por status is_active
SELECT 
  is_active,
  COUNT(*) as quantidade
FROM public.tools_catalog
GROUP BY is_active;

-- 4. Listar TODAS as ferramentas (primeiras 20)
SELECT 
  id,
  slug,
  name,
  category,
  is_active,
  cost_in_points,
  created_at
FROM public.tools_catalog
ORDER BY created_at DESC
LIMIT 20;

-- 5. Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tools_catalog';

-- 6. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'tools_catalog';

-- 7. Testar query exata do backend (como anon)
SET ROLE anon;
SELECT COUNT(*) as total_como_anon
FROM public.tools_catalog
WHERE is_active = true;
RESET ROLE;

-- 8. Testar query como authenticated
SET ROLE authenticated;
SELECT COUNT(*) as total_como_authenticated
FROM public.tools_catalog
WHERE is_active = true;
RESET ROLE;

-- 9. Ver GRANTS da tabela
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'tools_catalog';
