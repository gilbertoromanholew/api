#!/usr/bin/env node

/**
 * AUDITORIA DE CÓDIGO V6 vs V7
 * Busca por referências antigas no código
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Padrões V6 que NÃO devem existir
const V6_PATTERNS = {
  // Tabelas V6
  'user_points': 'Tabela V6 - usar economy.user_wallets',
  'point_transactions': 'Tabela V6 - usar economy.transactions',
  'tool_costs': 'Tabela V6 - usar tools.catalog',
  'tool_usage_stats': 'Tabela V6 - usar tools.executions',
  
  // Campos errados
  'purchased_credits': 'Campo errado - usar purchased_points',
  'total_credits': 'Campo calculado - usar (bonus_credits + purchased_points)',
  'credit_type': 'Campo errado - usar point_type',
  'bonus_credits_limit': 'Campo que não existe na V7',
  
  // Padrões de query V6
  '.from\\(\'user_points\'': 'Query V6 - usar economy.user_wallets',
  '.from\\(\'point_transactions\'': 'Query V6 - usar economy.transactions',
  '.from\\(\'tool_costs\'': 'Query V6 - usar tools.catalog',
  '.from\\(\'tool_usage_stats\'': 'Query V6 - usar tools.executions',
  
  // Campos de ferramenta
  '\\.cost[^_]': 'Usar cost_in_points ao invés de cost',
  '\\.status': 'Em executions, usar .success (boolean)'
};

// Diretórios para auditar
const DIRS_TO_AUDIT = [
  'c:\\Users\\Gilberto Silva\\Documents\\GitHub\\api\\dist-api\\src',
  'c:\\Users\\Gilberto Silva\\Documents\\GitHub\\tools-website-builder\\src'
];

const results = {
  errors: [],
  warnings: [],
  filesScanned: 0,
  totalIssues: 0
};

function scanFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      Object.entries(V6_PATTERNS).forEach(([pattern, message]) => {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(line)) {
          // Ignorar comentários
          if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
            return;
          }
          
          results.errors.push({
            file: filePath,
            line: index + 1,
            pattern: pattern,
            message: message,
            code: line.trim()
          });
          results.totalIssues++;
        }
      });
    });
    
    results.filesScanned++;
  } catch (err) {
    // Ignorar erros de leitura
  }
}

function scanDirectory(dir) {
  try {
    const files = readdirSync(dir);
    
    files.forEach(file => {
      const filePath = join(dir, file);
      const stat = statSync(filePath);
      
      if (stat.isDirectory()) {
        // Ignorar node_modules, .git, etc
        if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
          scanDirectory(filePath);
        }
      } else if (file.endsWith('.js') || file.endsWith('.vue') || file.endsWith('.ts')) {
        scanFile(filePath);
      }
    });
  } catch (err) {
    console.error(`${colors.red}Erro ao escanear ${dir}:${colors.reset}`, err.message);
  }
}

console.log(`${colors.cyan}${colors.bold}
╔════════════════════════════════════════════════════════╗
║     AUDITORIA DE CÓDIGO V6 → V7                       ║
╚════════════════════════════════════════════════════════╝
${colors.reset}\n`);

// Escanear todos os diretórios
DIRS_TO_AUDIT.forEach(dir => {
  console.log(`${colors.cyan}📂 Escaneando: ${dir}${colors.reset}`);
  scanDirectory(dir);
});

console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
console.log(`${colors.bold}📊 RESUMO DA AUDITORIA${colors.reset}`);
console.log(`   Arquivos escaneados: ${results.filesScanned}`);
console.log(`   Problemas encontrados: ${results.totalIssues}\n`);

if (results.totalIssues === 0) {
  console.log(`${colors.green}${colors.bold}✅ NENHUM PROBLEMA ENCONTRADO!${colors.reset}`);
  console.log(`${colors.green}   Todo o código está na V7 ✨${colors.reset}\n`);
} else {
  console.log(`${colors.red}${colors.bold}❌ PROBLEMAS ENCONTRADOS:${colors.reset}\n`);
  
  // Agrupar por arquivo
  const byFile = {};
  results.errors.forEach(err => {
    if (!byFile[err.file]) {
      byFile[err.file] = [];
    }
    byFile[err.file].push(err);
  });
  
  Object.entries(byFile).forEach(([file, errors]) => {
    console.log(`${colors.yellow}📄 ${file}${colors.reset}`);
    errors.forEach(err => {
      console.log(`   ${colors.red}Linha ${err.line}:${colors.reset} ${err.message}`);
      console.log(`   ${colors.cyan}Padrão: ${err.pattern}${colors.reset}`);
      console.log(`   ${colors.reset}${err.code}${colors.reset}\n`);
    });
  });
  
  console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Execute as correções necessárias antes de continuar${colors.reset}\n`);
}

process.exit(results.totalIssues > 0 ? 1 : 0);
