const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração Supabase
const SUPABASE_URL = 'https://mpanel.samm.host';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogInNlcnZpY2Vfcm9sZSIsCiAgImlzcyI6ICJzdXBhYmFzZSIsCiAgImlhdCI6IDE3MzcxNTk2MDAsCiAgImV4cCI6IDE4OTQ5MjYwMDAKfQ.c6t0Sw68_j36J1DwJqAd25_MJQsHLIK3u9vV2IIXlVs';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Função para executar SQL e retornar resultados
async function executeSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
      // Se exec_sql não existir, tentar query direto
      const { data: directData, error: directError } = await supabase
        .from('_sql')
        .select('*')
        .limit(1);
      
      if (directError) {
        console.error('❌ Erro ao executar SQL:', directError);
        return null;
      }
      return directData;
    }
    return data;
  } catch (err) {
    console.error('❌ Erro na execução:', err.message);
    return null;
  }
}

// Função principal
async function generateDatabaseReport() {
  console.log('🔍 Iniciando auditoria completa do banco de dados...\n');

  let markdown = `# 📊 AUDITORIA COMPLETA DO BANCO DE DADOS

**Data da Auditoria:** ${new Date().toLocaleString('pt-BR')}  
**Banco:** Supabase PostgreSQL (Self-hosted Coolify)  
**URL:** ${SUPABASE_URL}

---

`;

  // ============================================================================
  // 1. LISTAR TODAS AS TABELAS
  // ============================================================================
  console.log('📋 1. Listando todas as tabelas...');
  
  const { data: tables, error: tablesError } = await supabase
    .from('pg_tables')
    .select('*')
    .eq('schemaname', 'public')
    .order('tablename');

  if (tablesError) {
    console.error('❌ Erro ao buscar tabelas:', tablesError);
  } else {
    markdown += `## 1. TABELAS DO SCHEMA PUBLIC (${tables.length} tabelas)\n\n`;
    markdown += `| # | Nome da Tabela | Owner | Índices | Triggers | RLS Habilitado |\n`;
    markdown += `|---|----------------|-------|---------|----------|----------------|\n`;
    
    tables.forEach((table, index) => {
      markdown += `| ${index + 1} | \`${table.tablename}\` | ${table.tableowner} | ${table.hasindexes ? '✅' : '❌'} | ${table.hastriggers ? '✅' : '❌'} | ${table.rowsecurity ? '✅' : '❌'} |\n`;
    });
    markdown += '\n---\n\n';
    console.log(`   ✅ ${tables.length} tabelas encontradas\n`);
  }

  // ============================================================================
  // 2. DETALHES DE CADA TABELA
  // ============================================================================
  console.log('📋 2. Detalhando estrutura de cada tabela...');
  
  markdown += `## 2. ESTRUTURA DETALHADA DAS TABELAS\n\n`;

  for (const table of tables) {
    const tableName = table.tablename;
    console.log(`   🔍 Analisando: ${tableName}...`);

    markdown += `### 📦 \`${tableName}\`\n\n`;

    // 2.1 Colunas
    const { data: columns } = await supabase.rpc('get_table_columns', { 
      p_table_schema: 'public', 
      p_table_name: tableName 
    }).catch(() => ({ data: null }));

    // Fallback: consulta direta
    if (!columns) {
      const { data: directColumns } = await supabase
        .from('information_schema.columns')
        .select('*')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position');
      
      if (directColumns && directColumns.length > 0) {
        markdown += `#### Colunas (${directColumns.length}):\n\n`;
        markdown += `| # | Nome | Tipo | Nullable | Default |\n`;
        markdown += `|---|------|------|----------|----------|\n`;
        
        directColumns.forEach((col, idx) => {
          const type = col.character_maximum_length 
            ? `${col.data_type}(${col.character_maximum_length})` 
            : col.data_type;
          markdown += `| ${idx + 1} | \`${col.column_name}\` | ${type} | ${col.is_nullable === 'YES' ? '✅' : '❌'} | ${col.column_default || '-'} |\n`;
        });
        markdown += '\n';
      }
    }

    // 2.2 Constraints
    const { data: constraints } = await supabase
      .from('information_schema.table_constraints')
      .select('*')
      .eq('table_schema', 'public')
      .eq('table_name', tableName);

    if (constraints && constraints.length > 0) {
      markdown += `#### Constraints (${constraints.length}):\n\n`;
      constraints.forEach(constraint => {
        markdown += `- **${constraint.constraint_type}**: \`${constraint.constraint_name}\`\n`;
      });
      markdown += '\n';
    }

    // 2.3 Índices
    const { data: indexes } = await supabase
      .from('pg_indexes')
      .select('*')
      .eq('schemaname', 'public')
      .eq('tablename', tableName);

    if (indexes && indexes.length > 0) {
      markdown += `#### Índices (${indexes.length}):\n\n`;
      indexes.forEach(index => {
        markdown += `- \`${index.indexname}\`: ${index.indexdef}\n`;
      });
      markdown += '\n';
    }

    // 2.4 Políticas RLS
    const { data: policies } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('schemaname', 'public')
      .eq('tablename', tableName);

    if (policies && policies.length > 0) {
      markdown += `#### Políticas RLS (${policies.length}):\n\n`;
      policies.forEach(policy => {
        markdown += `- **${policy.policyname}**\n`;
        markdown += `  - Comando: ${policy.cmd}\n`;
        markdown += `  - Roles: ${policy.roles ? policy.roles.join(', ') : 'ALL'}\n`;
        markdown += `  - USING: \`${policy.qual || 'true'}\`\n`;
        if (policy.with_check) {
          markdown += `  - WITH CHECK: \`${policy.with_check}\`\n`;
        }
        markdown += '\n';
      });
    }

    // 2.5 Triggers
    const { data: triggers } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('trigger_schema', 'public')
      .eq('event_object_table', tableName);

    if (triggers && triggers.length > 0) {
      markdown += `#### Triggers (${triggers.length}):\n\n`;
      triggers.forEach(trigger => {
        markdown += `- **${trigger.trigger_name}** (${trigger.action_timing} ${trigger.event_manipulation})\n`;
        markdown += `  - Action: ${trigger.action_statement}\n\n`;
      });
    }

    // 2.6 Contagem de registros
    try {
      const { count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      markdown += `**📊 Total de registros:** ${count || 0}\n\n`;
    } catch (err) {
      markdown += `**📊 Total de registros:** Não foi possível contar (erro de permissão)\n\n`;
    }

    markdown += `---\n\n`;
  }

  // ============================================================================
  // 3. FUNÇÕES E PROCEDURES
  // ============================================================================
  console.log('📋 3. Listando funções e procedures...');
  
  const { data: functions } = await supabase
    .from('pg_proc')
    .select('*')
    .limit(100);

  if (functions && functions.length > 0) {
    markdown += `## 3. FUNÇÕES E PROCEDURES (${functions.length})\n\n`;
    markdown += `| Nome | Tipo | Argumentos | Retorno |\n`;
    markdown += `|------|------|------------|----------|\n`;
    
    functions.forEach(func => {
      markdown += `| \`${func.proname}\` | ${func.prokind === 'f' ? 'FUNCTION' : 'PROCEDURE'} | - | - |\n`;
    });
    markdown += '\n---\n\n';
  }

  // ============================================================================
  // 4. VIEWS
  // ============================================================================
  console.log('📋 4. Listando views...');
  
  const { data: views } = await supabase
    .from('information_schema.views')
    .select('*')
    .eq('table_schema', 'public');

  if (views && views.length > 0) {
    markdown += `## 4. VIEWS (${views.length})\n\n`;
    views.forEach(view => {
      markdown += `### \`${view.table_name}\`\n\n`;
      markdown += `\`\`\`sql\n${view.view_definition}\n\`\`\`\n\n`;
    });
    markdown += '---\n\n';
  }

  // ============================================================================
  // 5. TIPOS ENUM
  // ============================================================================
  console.log('📋 5. Listando tipos ENUM...');
  
  markdown += `## 5. TIPOS ENUM\n\n`;
  markdown += `| Nome | Valores |\n`;
  markdown += `|------|----------|\n`;
  
  const enumTypes = [
    { name: 'promo_code_type', values: ['BONUS_CREDITS', 'PRO_TRIAL', 'DISCOUNT', 'REFERRAL'] },
    { name: 'promo_code_status', values: ['active', 'expired', 'disabled'] }
  ];
  
  enumTypes.forEach(enumType => {
    markdown += `| \`${enumType.name}\` | ${enumType.values.join(', ')} |\n`;
  });
  markdown += '\n---\n\n';

  // ============================================================================
  // 6. RESUMO FINAL
  // ============================================================================
  markdown += `## 6. RESUMO EXECUTIVO\n\n`;
  markdown += `- **Total de Tabelas:** ${tables.length}\n`;
  markdown += `- **Total de Views:** ${views ? views.length : 0}\n`;
  markdown += `- **Total de Funções:** ${functions ? functions.length : 0}\n`;
  markdown += `- **Total de ENUMs:** ${enumTypes.length}\n\n`;

  markdown += `### Tabelas com RLS Habilitado:\n\n`;
  const rlsTables = tables.filter(t => t.rowsecurity);
  rlsTables.forEach(t => {
    markdown += `- ✅ \`${t.tablename}\`\n`;
  });

  markdown += `\n### Tabelas SEM RLS:\n\n`;
  const noRlsTables = tables.filter(t => !t.rowsecurity);
  if (noRlsTables.length === 0) {
    markdown += `✅ Todas as tabelas têm RLS habilitado!\n`;
  } else {
    noRlsTables.forEach(t => {
      markdown += `- ⚠️ \`${t.tablename}\`\n`;
    });
  }

  markdown += `\n---\n\n`;
  markdown += `**Relatório gerado automaticamente em:** ${new Date().toLocaleString('pt-BR')}\n`;

  // Salvar em arquivo
  const outputPath = path.join(__dirname, 'DATABASE_COMPLETE_REPORT.md');
  fs.writeFileSync(outputPath, markdown, 'utf8');

  console.log(`\n✅ Relatório completo gerado: ${outputPath}`);
  console.log(`📄 Total de linhas: ${markdown.split('\n').length}`);
  console.log(`📊 Tamanho: ${(markdown.length / 1024).toFixed(2)} KB`);
}

// Executar
generateDatabaseReport()
  .then(() => {
    console.log('\n🎉 Auditoria completa finalizada!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Erro na auditoria:', err);
    process.exit(1);
  });
