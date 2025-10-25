-- ============================================================================
-- AUDITORIA COMPLETA DETALHADA POR TABELA
-- Data: 25/10/2025
-- Descrição: Mostra TODAS as informações de CADA tabela individualmente
-- ============================================================================

-- ============================================================================
-- CONSULTA UNIFICADA: TODAS AS TABELAS COM TODOS OS DETALHES
-- ============================================================================

DO $$
DECLARE
  r_table RECORD;
  r_column RECORD;
  r_constraint RECORD;
  r_index RECORD;
  r_policy RECORD;
  r_trigger RECORD;
  table_count INTEGER;
BEGIN
  RAISE NOTICE '╔════════════════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║          AUDITORIA COMPLETA DO BANCO DE DADOS - SCHEMA PUBLIC             ║';
  RAISE NOTICE '║                        Data: %                              ║', NOW()::DATE;
  RAISE NOTICE '╚════════════════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  
  -- Contar tabelas
  SELECT COUNT(*) INTO table_count FROM pg_tables WHERE schemaname = 'public';
  RAISE NOTICE '📊 TOTAL DE TABELAS NO SCHEMA PUBLIC: %', table_count;
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  -- Loop por cada tabela
  FOR r_table IN 
    SELECT tablename, tableowner, hasindexes, hastriggers, rowsecurity
    FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename
  LOOP
    RAISE NOTICE '╔════════════════════════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║ TABELA: %                                                            ', RPAD(r_table.tablename, 60);
    RAISE NOTICE '╚════════════════════════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Informações Gerais:';
    RAISE NOTICE '   • Owner: %', r_table.tableowner;
    RAISE NOTICE '   • RLS Habilitado: %', CASE WHEN r_table.rowsecurity THEN '✅ SIM' ELSE '❌ NÃO' END;
    RAISE NOTICE '   • Possui Índices: %', CASE WHEN r_table.hasindexes THEN '✅ SIM' ELSE '❌ NÃO' END;
    RAISE NOTICE '   • Possui Triggers: %', CASE WHEN r_table.hastriggers THEN '✅ SIM' ELSE '❌ NÃO' END;
    RAISE NOTICE '';
    
    -- Contar registros
    EXECUTE format('SELECT COUNT(*) FROM %I', r_table.tablename) INTO table_count;
    RAISE NOTICE '📊 Total de Registros: %', table_count;
    RAISE NOTICE '';
    
    -- COLUNAS
    RAISE NOTICE '┌─────────────────────────────────────────────────────────────────────────┐';
    RAISE NOTICE '│ 📋 COLUNAS                                                               │';
    RAISE NOTICE '└─────────────────────────────────────────────────────────────────────────┘';
    RAISE NOTICE '';
    
    FOR r_column IN
      SELECT 
        column_name,
        ordinal_position,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = r_table.tablename
      ORDER BY ordinal_position
    LOOP
      RAISE NOTICE '   % | % | % | % | Default: %',
        LPAD(r_column.ordinal_position::TEXT, 2, '0'),
        RPAD(r_column.column_name, 30),
        RPAD(
          CASE 
            WHEN r_column.character_maximum_length IS NOT NULL 
            THEN r_column.data_type || '(' || r_column.character_maximum_length || ')'
            ELSE r_column.data_type
          END, 
          25
        ),
        CASE WHEN r_column.is_nullable = 'YES' THEN 'NULL    ' ELSE 'NOT NULL' END,
        COALESCE(SUBSTRING(r_column.column_default, 1, 40), '-');
    END LOOP;
    RAISE NOTICE '';
    
    -- CONSTRAINTS
    RAISE NOTICE '┌─────────────────────────────────────────────────────────────────────────┐';
    RAISE NOTICE '│ 🔗 CONSTRAINTS                                                           │';
    RAISE NOTICE '└─────────────────────────────────────────────────────────────────────────┘';
    RAISE NOTICE '';
    
    table_count := 0;
    FOR r_constraint IN
      SELECT
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      LEFT JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      LEFT JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.table_schema = 'public' AND tc.table_name = r_table.tablename
      ORDER BY tc.constraint_type, tc.constraint_name
    LOOP
      table_count := table_count + 1;
      IF r_constraint.constraint_type = 'PRIMARY KEY' THEN
        RAISE NOTICE '   🔑 PRIMARY KEY: % (%)', r_constraint.constraint_name, r_constraint.column_name;
      ELSIF r_constraint.constraint_type = 'FOREIGN KEY' THEN
        RAISE NOTICE '   🔗 FOREIGN KEY: % (% → %.%) [ON DELETE: %]',
          r_constraint.constraint_name,
          r_constraint.column_name,
          r_constraint.foreign_table_name,
          r_constraint.foreign_column_name,
          COALESCE(r_constraint.delete_rule, 'NO ACTION');
      ELSIF r_constraint.constraint_type = 'UNIQUE' THEN
        RAISE NOTICE '   ⭐ UNIQUE: % (%)', r_constraint.constraint_name, r_constraint.column_name;
      ELSIF r_constraint.constraint_type = 'CHECK' THEN
        RAISE NOTICE '   ✓ CHECK: %', r_constraint.constraint_name;
      END IF;
    END LOOP;
    
    IF table_count = 0 THEN
      RAISE NOTICE '   (Nenhuma constraint)';
    END IF;
    RAISE NOTICE '';
    
    -- ÍNDICES
    RAISE NOTICE '┌─────────────────────────────────────────────────────────────────────────┐';
    RAISE NOTICE '│ 📑 ÍNDICES                                                               │';
    RAISE NOTICE '└─────────────────────────────────────────────────────────────────────────┘';
    RAISE NOTICE '';
    
    table_count := 0;
    FOR r_index IN
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = r_table.tablename
      ORDER BY indexname
    LOOP
      table_count := table_count + 1;
      RAISE NOTICE '   📌 %', r_index.indexname;
      RAISE NOTICE '      %', r_index.indexdef;
      RAISE NOTICE '';
    END LOOP;
    
    IF table_count = 0 THEN
      RAISE NOTICE '   (Nenhum índice)';
      RAISE NOTICE '';
    END IF;
    
    -- POLÍTICAS RLS
    RAISE NOTICE '┌─────────────────────────────────────────────────────────────────────────┐';
    RAISE NOTICE '│ 🔒 POLÍTICAS RLS                                                         │';
    RAISE NOTICE '└─────────────────────────────────────────────────────────────────────────┘';
    RAISE NOTICE '';
    
    table_count := 0;
    FOR r_policy IN
      SELECT policyname, cmd, roles::TEXT, qual, with_check
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = r_table.tablename
      ORDER BY policyname
    LOOP
      table_count := table_count + 1;
      RAISE NOTICE '   🛡️ Policy: %', r_policy.policyname;
      RAISE NOTICE '      Comando: %', r_policy.cmd;
      RAISE NOTICE '      Roles: %', r_policy.roles;
      RAISE NOTICE '      USING: %', COALESCE(r_policy.qual, 'true');
      IF r_policy.with_check IS NOT NULL THEN
        RAISE NOTICE '      WITH CHECK: %', r_policy.with_check;
      END IF;
      RAISE NOTICE '';
    END LOOP;
    
    IF table_count = 0 THEN
      RAISE NOTICE '   ⚠️ NENHUMA POLÍTICA RLS CONFIGURADA!';
      RAISE NOTICE '';
    END IF;
    
    -- TRIGGERS
    RAISE NOTICE '┌─────────────────────────────────────────────────────────────────────────┐';
    RAISE NOTICE '│ ⚡ TRIGGERS                                                              │';
    RAISE NOTICE '└─────────────────────────────────────────────────────────────────────────┘';
    RAISE NOTICE '';
    
    table_count := 0;
    FOR r_trigger IN
      SELECT trigger_name, event_manipulation, action_timing, action_statement
      FROM information_schema.triggers
      WHERE trigger_schema = 'public' AND event_object_table = r_table.tablename
      ORDER BY trigger_name
    LOOP
      table_count := table_count + 1;
      RAISE NOTICE '   ⚡ Trigger: %', r_trigger.trigger_name;
      RAISE NOTICE '      Evento: % %', r_trigger.action_timing, r_trigger.event_manipulation;
      RAISE NOTICE '      Action: %', r_trigger.action_statement;
      RAISE NOTICE '';
    END LOOP;
    
    IF table_count = 0 THEN
      RAISE NOTICE '   (Nenhum trigger)';
      RAISE NOTICE '';
    END IF;
    
    RAISE NOTICE '════════════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '';
  END LOOP;
  
  -- RESUMO FINAL
  RAISE NOTICE '╔════════════════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                          RESUMO FINAL DA AUDITORIA                         ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  
  -- Total de tabelas
  SELECT COUNT(*) INTO table_count FROM pg_tables WHERE schemaname = 'public';
  RAISE NOTICE '📊 Total de Tabelas: %', table_count;
  
  -- Total de colunas
  SELECT COUNT(*) INTO table_count FROM information_schema.columns WHERE table_schema = 'public';
  RAISE NOTICE '📋 Total de Colunas: %', table_count;
  
  -- Total de constraints
  SELECT COUNT(*) INTO table_count FROM information_schema.table_constraints WHERE table_schema = 'public';
  RAISE NOTICE '🔗 Total de Constraints: %', table_count;
  
  -- Total de índices
  SELECT COUNT(*) INTO table_count FROM pg_indexes WHERE schemaname = 'public';
  RAISE NOTICE '📑 Total de Índices: %', table_count;
  
  -- Total de políticas RLS
  SELECT COUNT(*) INTO table_count FROM pg_policies WHERE schemaname = 'public';
  RAISE NOTICE '🔒 Total de Políticas RLS: %', table_count;
  
  -- Total de triggers
  SELECT COUNT(DISTINCT trigger_name) INTO table_count FROM information_schema.triggers WHERE trigger_schema = 'public';
  RAISE NOTICE '⚡ Total de Triggers: %', table_count;
  
  -- Tabelas com RLS
  SELECT COUNT(*) INTO table_count FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;
  RAISE NOTICE '🛡️ Tabelas com RLS Habilitado: %', table_count;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ AUDITORIA COMPLETA FINALIZADA!';
  RAISE NOTICE '';
  
END $$;

-- ============================================================================
-- CONSULTAS COMPLEMENTARES
-- ============================================================================

-- Views
SELECT 
  '📺 VIEWS' as tipo,
  table_name as nome,
  LENGTH(view_definition) as tamanho_definicao
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- Funções
SELECT
  '⚙️ FUNCTIONS' as tipo,
  p.proname as nome,
  pg_get_function_arguments(p.oid) as argumentos,
  l.lanname as linguagem
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN pg_language l ON p.prolang = l.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- ENUMs
SELECT
  '🏷️ ENUMS' as tipo,
  t.typname AS nome,
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS valores
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;

-- Tamanhos
SELECT
  '💾 TAMANHOS' as tipo,
  tablename as nome,
  pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS tamanho_total,
  pg_size_pretty(pg_relation_size('public.'||tablename)) AS tamanho_tabela,
  pg_size_pretty(pg_total_relation_size('public.'||tablename) - pg_relation_size('public.'||tablename)) AS tamanho_indices
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.'||tablename) DESC
LIMIT 10;

-- ============================================================================
-- FIM DA AUDITORIA DETALHADA
-- ============================================================================
