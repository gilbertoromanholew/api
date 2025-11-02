// ========================================
// 🧪 TESTE RÁPIDO - BACKEND FASE 2
// ========================================
// Verificar se as mudanças no backend estão corretas

import { 
  getBalance, 
  consumeCredits, 
  addBonusCredits, 
  addPurchasedCredits,
  // Aliases para compatibilidade
  consumePoints,
  addBonusPoints,
  addPurchasedPoints
} from './src/services/creditsService.js';

console.log('✅ TESTE 1: Import do creditsService.js');
console.log('   - getBalance:', typeof getBalance);
console.log('   - consumeCredits:', typeof consumeCredits);
console.log('   - addBonusCredits:', typeof addBonusCredits);
console.log('   - addPurchasedCredits:', typeof addPurchasedCredits);

console.log('\n✅ TESTE 2: Aliases para compatibilidade');
console.log('   - consumePoints === consumeCredits:', consumePoints === consumeCredits);
console.log('   - addBonusPoints === addBonusCredits:', addBonusPoints === addBonusCredits);
console.log('   - addPurchasedPoints === addPurchasedCredits:', addPurchasedPoints === addPurchasedCredits);

console.log('\n✅ TESTE 3: Verificar se pointsService.js ainda existe');
import { existsSync } from 'fs';
const pointsServiceExists = existsSync('./src/services/pointsService.js');
console.log('   - pointsService.js existe?', pointsServiceExists ? '❌ ERRO: Arquivo não foi deletado!' : '✅ OK: Arquivo renomeado');

console.log('\n✅ TESTE 4: Verificar se creditsService.js existe');
const creditsServiceExists = existsSync('./src/services/creditsService.js');
console.log('   - creditsService.js existe?', creditsServiceExists ? '✅ OK: Arquivo criado' : '❌ ERRO: Arquivo não encontrado!');

console.log('\n🎉 TESTES CONCLUÍDOS!');
console.log('Se todos os testes passaram, o backend está pronto para Fase 3 (Frontend).');
