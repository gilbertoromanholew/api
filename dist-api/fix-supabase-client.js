import { readFileSync, writeFileSync } from 'fs';

console.log('🔧 CORRIGINDO USO DE SUPABASE CLIENT\n');
console.log('='.repeat(70));

const fixes = [
  {
    file: 'src/functions/points/pointsController.js',
    changes: [
      {
        find: "import { supabase } from '../../config/supabase.js';",
        replace: "import { supabaseAdmin } from '../../config/supabase.js';"
      },
      {
        find: /const { data, error } = await supabase\n\s+\.from\('economy_user_wallets'\)/g,
        replace: "const { data, error } = await supabaseAdmin\n            .from('economy_user_wallets')"
      },
      {
        find: /const { data, error } = await supabase\n\s+\.from\('economy_transactions'\)/g,
        replace: "const { data, error } = await supabaseAdmin\n            .from('economy_transactions')"
      }
    ]
  }
];

let totalChanges = 0;

fixes.forEach(({ file, changes }) => {
  try {
    let content = readFileSync(file, 'utf-8');
    let fileChanges = 0;
    
    changes.forEach(({ find, replace }) => {
      const before = content;
      
      if (typeof find === 'string') {
        content = content.replace(find, replace);
      } else {
        content = content.replace(find, replace);
      }
      
      if (content !== before) {
        fileChanges++;
      }
    });
    
    if (fileChanges > 0) {
      writeFileSync(file, content, 'utf-8');
      console.log(`✅ ${file} (${fileChanges} alterações)`);
      totalChanges += fileChanges;
    } else {
      console.log(`⏭️  ${file} (nenhuma alteração necessária)`);
    }
    
  } catch (err) {
    console.log(`❌ ${file} - ERRO: ${err.message}`);
  }
});

console.log('\n' + '='.repeat(70));
console.log(`🎯 Total: ${totalChanges} alterações realizadas\n`);

process.exit(0);
