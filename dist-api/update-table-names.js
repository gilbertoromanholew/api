import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

console.log('🔄 Atualizando referências de tabelas...\n');

const replacements = [
  // tools schema → public com prefixo
  { from: /\.from\(['"]tools\.catalog['"]\)/g, to: ".from('tools_catalog')" },
  { from: /\.from\(['"]tools\.executions['"]\)/g, to: ".from('tools_executions')" },
  
  // economy schema → public com prefixo
  { from: /\.from\(['"]economy\.user_wallets['"]\)/g, to: ".from('economy_user_wallets')" },
  { from: /\.from\(['"]economy\.transactions['"]\)/g, to: ".from('economy_transactions')" },
  { from: /\.from\(['"]economy\.purchases['"]\)/g, to: ".from('economy_purchases')" },
  { from: /\.from\(['"]economy\.subscriptions['"]\)/g, to: ".from('economy_subscriptions')" },
  { from: /\.from\(['"]economy\.subscription_plans['"]\)/g, to: ".from('economy_subscription_plans')" },
  { from: /\.from\(['"]economy\.referral_rewards['"]\)/g, to: ".from('economy_referral_rewards')" },
  
  // social schema → public com prefixo
  { from: /\.from\(['"]social\.referrals['"]\)/g, to: ".from('social_referrals')" },
  { from: /\.from\(['"]social\.friendships['"]\)/g, to: ".from('social_friendships')" },
  { from: /\.from\(['"]social\.friend_requests['"]\)/g, to: ".from('social_friend_requests')" },
  { from: /\.from\(['"]social\.user_privacy_settings['"]\)/g, to: ".from('social_user_privacy_settings')" },
];

function getAllFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    if (statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

const files = getAllFiles('./src');
let totalFiles = 0;
let totalChanges = 0;

files.forEach(file => {
  let content = readFileSync(file, 'utf-8');
  let originalContent = content;
  let fileChanges = 0;
  
  replacements.forEach(({ from, to }) => {
    const matches = content.match(from);
    if (matches) {
      content = content.replace(from, to);
      fileChanges += matches.length;
      totalChanges += matches.length;
    }
  });
  
  if (content !== originalContent) {
    writeFileSync(file, content, 'utf-8');
    totalFiles++;
    console.log(`✅ ${file.replace(/\\/g, '/')} (${fileChanges} alterações)`);
  }
});

console.log(`\n🎯 Resumo:`);
console.log(`   Arquivos modificados: ${totalFiles}`);
console.log(`   Total de alterações: ${totalChanges}`);
console.log('\n✅ Pronto! Agora teste: node server.js');
