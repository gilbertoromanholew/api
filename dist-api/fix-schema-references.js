import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

console.log('🔄 Corrigindo referências de schemas...\n');

const replacements = [
  // tools schema
  { from: ".from('tools.catalog')", to: ".from('catalog')" },
  { from: '.from("tools.catalog")', to: '.from("catalog")' },
  { from: ".from('tools.executions')", to: ".from('executions')" },
  { from: '.from("tools.executions")', to: '.from("executions")' },
  
  // economy schema
  { from: ".from('economy.user_wallets')", to: ".from('user_wallets')" },
  { from: '.from("economy.user_wallets")', to: '.from("user_wallets")' },
  { from: ".from('economy.transactions')", to: ".from('transactions')" },
  { from: '.from("economy.transactions")', to: '.from("transactions")' },
  { from: ".from('economy.purchases')", to: ".from('purchases')" },
  { from: '.from("economy.purchases")', to: '.from("purchases")' },
  { from: ".from('economy.subscriptions')", to: ".from('subscriptions')" },
  { from: '.from("economy.subscriptions")', to: '.from("subscriptions")' },
  
  // social schema
  { from: ".from('social.referrals')", to: ".from('referrals')" },
  { from: '.from("social.referrals")', to: '.from("referrals")' },
  { from: ".from('social.friendships')", to: ".from('friendships')" },
  { from: '.from("social.friendships")', to: '.from("friendships")' },
];

const files = globSync('src/**/*.js', { cwd: process.cwd() });

let totalChanges = 0;

files.forEach(file => {
  let content = readFileSync(file, 'utf-8');
  let changed = false;
  
  replacements.forEach(({ from, to }) => {
    if (content.includes(from)) {
      content = content.replaceAll(from, to);
      changed = true;
      totalChanges++;
    }
  });
  
  if (changed) {
    writeFileSync(file, content, 'utf-8');
    console.log(`✅ ${file}`);
  }
});

console.log(`\n🎯 Total de alterações: ${totalChanges}`);
console.log('✅ Pronto! Agora teste: node server.js');
