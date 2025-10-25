import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

console.log('🎮 Atualizando referências de gamification...\n');

const replacements = [
  // gamification schema → public com prefixo
  { from: /\.from\(['"]achievements['"]\)/g, to: ".from('gamification_achievements')" },
  { from: /\.from\(['"]achievement_unlocks['"]\)/g, to: ".from('gamification_achievement_unlocks')" },
  { from: /\.from\(['"]achievement_showcase['"]\)/g, to: ".from('gamification_achievement_showcase')" },
  { from: /\.from\(['"]user_achievements['"]\)/g, to: ".from('gamification_user_achievements')" },
  { from: /\.from\(['"]daily_streaks['"]\)/g, to: ".from('gamification_daily_streaks')" },
  { from: /\.from\(['"]leaderboards['"]\)/g, to: ".from('gamification_leaderboards')" },
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

if (totalChanges === 0) {
  console.log('\n⚠️ Nenhuma referência encontrada. Isso é normal se você não usa gamification ainda.');
}
