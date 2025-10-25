-- ============================================
-- DIAGNÓSTICO: Ferramentas não carregam
-- ============================================

-- 1. Verificar se tabela existe e qual schema
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN schemaname = 'tools' THEN '✅ Schema tools (correto V7)'
    WHEN schemaname = 'public' AND tablename LIKE 'tools%' THEN '⚠️ Schema public (possível)'
    ELSE '❌ Schema inesperado'
  END as status
FROM pg_tables
WHERE tablename IN ('catalog', 'tools_catalog')
ORDER BY schemaname, tablename;

-- 2. Contar registros em todas as variações possíveis
DO $$
DECLARE
  v_count_tools_catalog INTEGER;
  v_count_tools_dot_catalog INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '🔍 DIAGNÓSTICO DE FERRAMENTAS';
  RAISE NOTICE '════════════════════════════════════════';
  
  -- Tentar public.tools_catalog
  BEGIN
    SELECT COUNT(*) INTO v_count_tools_catalog FROM public.tools_catalog;
    RAISE NOTICE '✅ public.tools_catalog existe: % registros', v_count_tools_catalog;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ public.tools_catalog NÃO existe';
  END;
  
  -- Tentar tools.catalog
  BEGIN
    SELECT COUNT(*) INTO v_count_tools_dot_catalog FROM tools.catalog;
    RAISE NOTICE '✅ tools.catalog existe: % registros', v_count_tools_dot_catalog;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ tools.catalog NÃO existe';
  END;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
END $$;

-- 3. Se tools_catalog existe, mostrar amostra
DO $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tools_catalog'
  ) INTO v_exists;
  
  IF v_exists THEN
    RAISE NOTICE '';
    RAISE NOTICE '📋 AMOSTRA DE DADOS (public.tools_catalog):';
    RAISE NOTICE '════════════════════════════════════════';
    
    -- Mostrar 3 primeiras ferramentas
    FOR rec IN (
      SELECT 
        slug,
        name,
        category,
        cost_in_points,
        is_active
      FROM public.tools_catalog
      ORDER BY category, name
      LIMIT 3
    )
    LOOP
      RAISE NOTICE 'Ferramenta: % (%) - Categoria: % - Custo: % pts - Ativa: %', 
        rec.name, rec.slug, rec.category, rec.cost_in_points, rec.is_active;
    END LOOP;
    
    RAISE NOTICE '';
  END IF;
END $$;

-- 4. Verificar permissões RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '🔒 RLS ATIVO'
    ELSE '🔓 RLS DESATIVADO'
  END as status_rls
FROM pg_tables
WHERE tablename IN ('catalog', 'tools_catalog')
  AND schemaname IN ('public', 'tools');

-- 5. Verificar policies (se RLS ativo)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('catalog', 'tools_catalog')
ORDER BY schemaname, tablename, policyname;
