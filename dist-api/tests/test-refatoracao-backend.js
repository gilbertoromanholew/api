/**
 * ========================================
 * 🧪 TESTE BACKEND - REFATORAÇÃO CREDITS
 * ========================================
 * 
 * Testa a refatoração no backend (Node.js)
 * 
 * EXECUTAR:
 * cd "c:\Users\Gilberto Silva\Documents\GitHub\api\dist-api"
 * node test-refatoracao-backend.js
 */

import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.clear();
console.log('🧪 TESTE BACKEND - REFATORAÇÃO POINTS → CREDITS');
console.log('================================================\n');

let sucessos = 0;
let falhas = 0;

function teste(nome, condicao, detalhes = '') {
  if (condicao) {
    console.log(`✅ ${nome}`);
    if (detalhes) console.log(`   ${detalhes}`);
    sucessos++;
  } else {
    console.log(`❌ ${nome}`);
    if (detalhes) console.log(`   ${detalhes}`);
    falhas++;
  }
}

console.log('📁 TESTE 1: Verificar arquivos renomeados');
console.log('─────────────────────────────────────────');

// Verificar que arquivo antigo NÃO existe
const pointsServicePath = join(__dirname, 'src', 'services', 'pointsService.js');
const creditsServicePath = join(__dirname, 'src', 'services', 'creditsService.js');

teste(
  'pointsService.js NÃO existe (renomeado)',
  !existsSync(pointsServicePath),
  'Arquivo antigo deve ter sido deletado'
);

teste(
  'creditsService.js EXISTE',
  existsSync(creditsServicePath),
  'Novo arquivo criado com sucesso'
);

console.log('\n📦 TESTE 2: Importar módulos');
console.log('─────────────────────────────────────────');

let creditsService;
try {
  creditsService = await import('./src/services/creditsService.js');
  teste('creditsService.js importado', true);
} catch (error) {
  teste('creditsService.js importado', false, error.message);
}

console.log('\n🔧 TESTE 3: Verificar funções exportadas');
console.log('─────────────────────────────────────────');

if (creditsService) {
  teste('getBalance exportado', typeof creditsService.getBalance === 'function');
  teste('getHistory exportado', typeof creditsService.getHistory === 'function');
  teste('consumeCredits exportado', typeof creditsService.consumeCredits === 'function');
  teste('addBonusCredits exportado', typeof creditsService.addBonusCredits === 'function');
  teste('addPurchasedCredits exportado', typeof creditsService.addPurchasedCredits === 'function');

  console.log('\n🔄 TESTE 4: Verificar aliases (compatibilidade)');
  console.log('─────────────────────────────────────────');

  teste(
    'consumePoints (alias) existe',
    typeof creditsService.consumePoints === 'function',
    'Alias para compatibilidade com código antigo'
  );

  teste(
    'consumePoints === consumeCredits',
    creditsService.consumePoints === creditsService.consumeCredits,
    'Alias aponta para função correta'
  );

  teste(
    'addBonusPoints === addBonusCredits',
    creditsService.addBonusPoints === creditsService.addBonusCredits
  );

  teste(
    'addPurchasedPoints === addPurchasedCredits',
    creditsService.addPurchasedPoints === creditsService.addPurchasedCredits
  );
}

console.log('\n🛣️ TESTE 5: Verificar creditsRoutes.js');
console.log('─────────────────────────────────────────');

const creditsRoutesPath = join(__dirname, 'src', 'routes', 'creditsRoutes.js');
teste('creditsRoutes.js existe', existsSync(creditsRoutesPath));

try {
  const creditsRoutes = await import('./src/routes/creditsRoutes.js');
  teste('creditsRoutes.js importado', !!creditsRoutes.default);
} catch (error) {
  teste('creditsRoutes.js importado', false, error.message);
}

console.log('\n🔍 TESTE 6: Verificar conteúdo dos arquivos');
console.log('─────────────────────────────────────────');

import { readFileSync } from 'fs';

// Verificar creditsService.js
const creditsServiceContent = readFileSync(creditsServicePath, 'utf-8');

teste(
  'creditsService não menciona "pointsService"',
  !creditsServiceContent.includes('pointsService'),
  'Arquivo foi corretamente renomeado internamente'
);

teste(
  'creditsService menciona "creditsService"',
  creditsServiceContent.includes('SERVIÇO DE CRÉDITOS'),
  'Header do arquivo atualizado'
);

teste(
  'creditsService usa "purchased_credits"',
  creditsServiceContent.includes('purchased_credits'),
  'Referências ao banco atualizadas'
);

teste(
  'creditsService NÃO usa "purchased_points" (exceto alias)',
  creditsServiceContent.split('purchased_points').length <= 3,
  'Máximo 2 referências (aliases para compatibilidade)'
);

// Verificar creditsRoutes.js
const creditsRoutesContent = readFileSync(creditsRoutesPath, 'utf-8');

teste(
  'creditsRoutes importa de creditsService',
  creditsRoutesContent.includes('from \'../services/creditsService.js\''),
  'Import atualizado corretamente'
);

teste(
  'creditsRoutes usa consumeCredits',
  creditsRoutesContent.includes('consumeCredits'),
  'Chamadas de função atualizadas'
);

console.log('\n📊 RESUMO');
console.log('================================================');
console.log(`✅ Sucessos: ${sucessos}`);
console.log(`❌ Falhas: ${falhas}`);
console.log(`📝 Total: ${sucessos + falhas}`);

const percentual = Math.round((sucessos / (sucessos + falhas)) * 100);
console.log(`📈 Taxa de sucesso: ${percentual}%`);

if (falhas === 0) {
  console.log('\n🎉 PARABÉNS! Backend refatorado com sucesso!');
  console.log('✅ Todos os testes passaram!');
  console.log('\n📌 PRÓXIMO PASSO:');
  console.log('   1. Suba o backend: npm run dev');
  console.log('   2. Suba o frontend: npm run dev');
  console.log('   3. Faça login e execute o teste do navegador');
} else {
  console.log('\n⚠️ Alguns testes falharam.');
  console.log('Revise os erros acima antes de continuar.');
}

console.log('\n================================================\n');
