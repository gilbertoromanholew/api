import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

console.log('🔍 VERIFICANDO USO DE SUPABASE CLIENT (anon vs service_role)\n');
console.log('='.repeat(70));

const files = [
  'src/services/achievementsService.js',
  'src/services/pointsService.js',
  'src/services/promoCodesService.js',
  'src/services/referralService.js',
  'src/services/subscriptionService.js',
  'src/services/toolsService.js',
  'src/controllers/pointsController.js',
  'src/controllers/toolsController.js',
  'src/controllers/userController.js',
  'src/routes/authRoutes.js'
];

let totalIssues = 0;

files.forEach(file => {
  try {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    let hasAdmin = content.includes('supabaseAdmin');
    let usesAnon = false;
    let usesAdmin = false;
    
    const anonMatches = [];
    const adminMatches = [];
    
    lines.forEach((line, idx) => {
      // Detectar uso de supabase (anon) - exclui imports e comentários
      if (line.includes('supabase.') && 
          !line.includes('supabaseAdmin') && 
          !line.includes('import') &&
          !line.trim().startsWith('//') &&
          !line.trim().startsWith('*')) {
        usesAnon = true;
        anonMatches.push({ line: idx + 1, code: line.trim() });
      }
      
      // Detectar uso de supabaseAdmin
      if (line.includes('supabaseAdmin.')) {
        usesAdmin = true;
        adminMatches.push({ line: idx + 1, code: line.trim() });
      }
    });
    
    console.log(`\n📄 ${file}`);
    console.log(`   Importa supabaseAdmin? ${hasAdmin ? '✅ SIM' : '❌ NÃO'}`);
    
    if (anonMatches.length > 0) {
      console.log(`   ⚠️  USA SUPABASE (ANON) - ${anonMatches.length} ocorrências:`);
      anonMatches.slice(0, 3).forEach(match => {
        console.log(`      Linha ${match.line}: ${match.code.substring(0, 60)}...`);
      });
      if (anonMatches.length > 3) {
        console.log(`      ... e mais ${anonMatches.length - 3} ocorrências`);
      }
      totalIssues++;
    }
    
    if (adminMatches.length > 0) {
      console.log(`   ✅ USA SUPABASEADMIN - ${adminMatches.length} ocorrências`);
    }
    
    if (!usesAnon && !usesAdmin) {
      console.log(`   ℹ️  Não usa nenhum client Supabase diretamente`);
    }
    
  } catch (err) {
    console.log(`\n❌ ${file} - ERRO: ${err.message}`);
  }
});

console.log('\n' + '='.repeat(70));
console.log(`\n🎯 RESUMO: ${totalIssues} arquivo(s) com uso de supabase (anon)`);
console.log('\n💡 SOLUÇÃO:');
console.log('   Todos os services/controllers do backend devem usar supabaseAdmin');
console.log('   porque as políticas RLS exigem service_role para INSERT/UPDATE/DELETE');
console.log('   O client anon (supabase) é apenas para o FRONTEND!\n');

process.exit(totalIssues > 0 ? 1 : 0);
