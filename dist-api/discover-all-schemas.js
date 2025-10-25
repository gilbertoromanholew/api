/**
 * Script para inspecionar TODOS os schemas do Supabase
 * Descobre automaticamente schemas, tabelas e colunas
 * Identifica tabelas obsoletas que podem ser excluídas
 */

import { createClient } from '@supabase/supabase-js';

// Credenciais do Supabase (Coolify)
const SUPABASE_URL = 'https://mpanel.samm.host';
const SUPABASE_SERVICE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MDgzNjAyMCwiZXhwIjo0OTE2NTA5NjIwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.5-gIzyxIrbWSRhrdPAOLpMf_xfoANe4JSpKjjOs4NiY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
};

function header(text) {
  console.log(`\n${colors.cyan}${'='.repeat(100)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  ${text}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(100)}${colors.reset}\n`);
}

function section(text) {
  console.log(`\n${colors.blue}${'─'.repeat(100)}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}  ${text}${colors.reset}`);
  console.log(`${colors.blue}${'─'.repeat(100)}${colors.reset}\n`);
}

// Tabelas obsoletas conhecidas da V6 (podem ser excluídas)
const V6_OBSOLETE_TABLES = [
  'tool_costs',
  'tool_usage_stats', 
  'user_points',
  'point_transactions'
];

async function getTablesInSchema(schemaName) {
  try {
    // Tentar descobrir via REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Accept-Profile': schemaName
      }
    });

    if (!response.ok) {
      return [];
    }

    const apiDoc = await response.json();
    
    // A resposta é um OpenAPI spec, extrair as tabelas dos paths
    if (apiDoc.paths) {
      const tables = Object.keys(apiDoc.paths)
        .filter(path => path.startsWith('/'))
        .map(path => path.substring(1))
        .filter(t => t && !t.includes('{'));
      return [...new Set(tables)];
    }

    return [];
  } catch (err) {
    console.log(`${colors.dim}   Erro ao listar tabelas do schema ${schemaName}: ${err.message}${colors.reset}`);
    return [];
  }
}

async function getTableInfo(tableName, schemaName) {
  try {
    // Obter amostra para descobrir colunas
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=*&limit=1`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Accept-Profile': schemaName
      }
    });

    let columns = [];
    if (response.ok) {
      const sampleData = await response.json();
      if (sampleData && sampleData.length > 0) {
        columns = Object.keys(sampleData[0]).map(name => ({
          column_name: name,
          data_type: typeof sampleData[0][name]
        }));
      }
    }

    // Obter contagem de registros
    const countResponse = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=*`, {
      method: 'HEAD',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Accept-Profile': schemaName,
        'Prefer': 'count=exact'
      }
    });
    
    let rowCount = 0;
    const contentRange = countResponse.headers.get('content-range');
    if (contentRange) {
      rowCount = parseInt(contentRange.split('/')[1]) || 0;
    }

    return { columns, rowCount };
  } catch (err) {
    return { columns: [], rowCount: 0, error: err.message };
  }
}

function isObsoleteTable(tableName, schemaName) {
  // Tabela está na lista de obsoletas da V6?
  if (schemaName === 'public' && V6_OBSOLETE_TABLES.includes(tableName)) {
    return {
      obsolete: true,
      reason: 'Tabela V6 obsoleta - dados migrados para schema V7',
      replacement: getV7Replacement(tableName)
    };
  }

  // Tabela de backup?
  if (tableName.startsWith('_backup_') || tableName.includes('_old_') || tableName.includes('_deprecated_')) {
    return {
      obsolete: true,
      reason: 'Tabela de backup/temporária',
      replacement: null
    };
  }

  return { obsolete: false };
}

function getV7Replacement(v6TableName) {
  const replacements = {
    'tool_costs': 'tools.catalog',
    'tool_usage_stats': 'tools.executions',
    'user_points': 'economy.user_wallets',
    'point_transactions': 'economy.transactions'
  };
  return replacements[v6TableName] || null;
}

async function inspectAllSchemas() {
  header('DESCOBERTA AUTOMÁTICA DE SCHEMAS - SUPABASE');

  console.log(`${colors.cyan}🔗 Conectado a:${colors.reset} ${SUPABASE_URL}\n`);

  // Schemas conhecidos para inspecionar
  const schemasToInspect = ['public', 'tools', 'economy'];

  const allTables = [];
  const obsoleteTables = [];

  for (const schema of schemasToInspect) {
    section(`SCHEMA: ${schema}`);

    const tables = await getTablesInSchema(schema);
    
    if (tables.length === 0) {
      console.log(`${colors.dim}  (vazio ou inacessível)${colors.reset}\n`);
      continue;
    }

    console.log(`${colors.yellow}📊 ${tables.length} tabela(s) encontrada(s)${colors.reset}\n`);

    for (const table of tables) {
      const fullName = schema === 'public' ? table : `${schema}.${table}`;
      const { columns, rowCount, error } = await getTableInfo(table, schema);
      
      const obsoleteInfo = isObsoleteTable(table, schema);
      
      const tableInfo = {
        schema,
        table,
        fullName,
        columns: columns || [],
        rowCount,
        obsolete: obsoleteInfo.obsolete,
        obsoleteReason: obsoleteInfo.reason,
        replacement: obsoleteInfo.replacement,
        error
      };

      allTables.push(tableInfo);
      
      if (obsoleteInfo.obsolete) {
        obsoleteTables.push(tableInfo);
      }

      // Exibir informações da tabela
      const statusIcon = obsoleteInfo.obsolete ? '🗑️ ' : '✅';
      const statusColor = obsoleteInfo.obsolete ? colors.red : colors.green;
      
      console.log(`${statusColor}${statusIcon} ${table}${colors.reset}`);
      console.log(`   ${colors.dim}Registros: ${rowCount.toLocaleString()}${colors.reset}`);
      
      if (columns && columns.length > 0) {
        console.log(`   ${colors.dim}Colunas (${columns.length}):${colors.reset}`);
        columns.slice(0, 10).forEach(col => {
          console.log(`     • ${col.column_name} ${colors.dim}[${col.data_type}]${colors.reset}`);
        });
        if (columns.length > 10) {
          console.log(`     ${colors.dim}... e mais ${columns.length - 10} coluna(s)${colors.reset}`);
        }
      }

      if (obsoleteInfo.obsolete) {
        console.log(`   ${colors.red}⚠️  OBSOLETO: ${obsoleteInfo.reason}${colors.reset}`);
        if (obsoleteInfo.replacement) {
          console.log(`   ${colors.yellow}➜  Substituído por: ${obsoleteInfo.replacement}${colors.reset}`);
        }
      }

      if (error) {
        console.log(`   ${colors.red}❌ Erro: ${error}${colors.reset}`);
      }

      console.log();
    }
  }

  // Resumo de tabelas obsoletas
  if (obsoleteTables.length > 0) {
    header('⚠️  TABELAS OBSOLETAS - PODEM SER EXCLUÍDAS');

    console.log(`${colors.red}Encontradas ${obsoleteTables.length} tabela(s) obsoleta(s):${colors.reset}\n`);

    obsoleteTables.forEach(t => {
      console.log(`${colors.red}🗑️  ${t.fullName}${colors.reset}`);
      console.log(`   ${colors.dim}Motivo: ${t.obsoleteReason}${colors.reset}`);
      console.log(`   ${colors.dim}Registros: ${t.rowCount.toLocaleString()}${colors.reset}`);
      if (t.replacement) {
        console.log(`   ${colors.yellow}Substituída por: ${t.replacement}${colors.reset}`);
      }
      console.log();
    });

    console.log(`${colors.yellow}📋 SQL para excluir tabelas obsoletas:${colors.reset}\n`);
    console.log(`${colors.dim}-- Executar no SQL Editor do Supabase${colors.reset}`);
    obsoleteTables.forEach(t => {
      const schemaPrefix = t.schema === 'public' ? '' : `"${t.schema}".`;
      console.log(`DROP TABLE IF EXISTS ${schemaPrefix}"${t.table}" CASCADE;`);
    });
    console.log();
  } else {
    header('✅ NENHUMA TABELA OBSOLETA ENCONTRADA');
  }

  // Estatísticas finais
  header('📊 ESTATÍSTICAS DO BANCO DE DADOS');

  const v7Tables = allTables.filter(t => !t.obsolete);
  const totalRows = v7Tables.reduce((sum, t) => sum + t.rowCount, 0);

  console.log(`${colors.green}Schemas inspecionados:${colors.reset} ${schemasToInspect.length}`);
  console.log(`${colors.green}Tabelas V7 (ativas):${colors.reset} ${v7Tables.length}`);
  console.log(`${colors.red}Tabelas obsoletas:${colors.reset} ${obsoleteTables.length}`);
  console.log(`${colors.green}Total de registros:${colors.reset} ${totalRows.toLocaleString()}`);
  
  console.log(`\n${colors.cyan}Distribuição por schema:${colors.reset}`);
  const schemaStats = {};
  v7Tables.forEach(t => {
    if (!schemaStats[t.schema]) schemaStats[t.schema] = { count: 0, rows: 0 };
    schemaStats[t.schema].count++;
    schemaStats[t.schema].rows += t.rowCount;
  });
  
  Object.entries(schemaStats).forEach(([schema, stats]) => {
    console.log(`  ${colors.yellow}${schema}:${colors.reset} ${stats.count} tabela(s), ${stats.rows.toLocaleString()} registro(s)`);
  });

  header('✅ INSPEÇÃO CONCLUÍDA');
}

// Executar inspeção
inspectAllSchemas().catch(err => {
  console.error(`\n${colors.red}ERRO FATAL:${colors.reset}`, err);
  process.exit(1);
});
