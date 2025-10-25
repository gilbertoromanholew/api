import { supabaseAdmin } from './src/config/supabase.js';

console.log('🧪 Testando acesso a schemas...\n');

// Teste 1: Acessar com schema.table
console.log('1️⃣ Testando: tools.catalog');
const test1 = await supabaseAdmin.from('tools.catalog').select('*').limit(1);
console.log('Erro:', test1.error?.message || 'Nenhum');
console.log('Data:', test1.data ? `${test1.data.length} registros` : 'null\n');

// Teste 2: Acessar sem schema (assumindo schema search_path)
console.log('2️⃣ Testando: catalog (sem schema)');
const test2 = await supabaseAdmin.from('catalog').select('*').limit(1);
console.log('Erro:', test2.error?.message || 'Nenhum');
console.log('Data:', test2.data ? `${test2.data.length} registros` : 'null\n');

// Teste 3: Verificar schema search_path via RPC/SQL
console.log('3️⃣ Testando: rpc para verificar search_path');
const test3 = await supabaseAdmin.rpc('show_search_path');
console.log('Erro:', test3.error?.message || 'Nenhum');
console.log('Data:', test3.data || 'null\n');

// Teste 4: Query raw SQL
console.log('4️⃣ Testando: SQL direto');
const test4 = await supabaseAdmin.rpc('exec_sql', { 
  query: 'SELECT * FROM tools.catalog LIMIT 1;'
});
console.log('Erro:', test4.error?.message || 'Nenhum');
console.log('Data:', test4.data || 'null\n');

console.log('✅ Testes concluídos');
process.exit(0);
