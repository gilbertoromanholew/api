import { supabaseAdmin } from './src/config/supabase.js';

console.log('🧪 TESTE DIRETO DE ACESSO AO BANCO\n');

// Teste 1: SQL direto - listar tabelas
console.log('1️⃣ LISTAR TABELAS (SQL direto):');
const { data: tables, error: tablesError } = await supabaseAdmin
  .rpc('exec_sql', { 
    sql: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%_%' ORDER BY tablename LIMIT 20;`
  });

if (tablesError) {
  console.log('   ❌ Erro RPC:', tablesError.message);
  
  // Tentar via REST API
  console.log('\n2️⃣ LISTAR TABELAS VIA REST API:');
  const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });
  
  console.log('   Status:', response.status);
  if (response.ok) {
    const data = await response.json();
    console.log('   Endpoints disponíveis:', Object.keys(data.definitions || {}));
  }
} else {
  console.log('   ✅ Tabelas encontradas:', tables);
}

// Teste 2: Buscar tools_catalog (com erro detalhado)
console.log('\n3️⃣ BUSCAR TOOLS_CATALOG:');
const { data: toolsData, error: toolsError, status, statusText } = await supabaseAdmin
  .from('tools_catalog')
  .select('id, name, is_active')
  .limit(5);

console.log('   Status:', status);
console.log('   StatusText:', statusText);
console.log('   Error:', toolsError);
console.log('   Data:', toolsData);

// Teste 3: Verificar se a tabela existe (SQL direto)
console.log('\n4️⃣ VERIFICAR SE TOOLS_CATALOG EXISTE:');
const checkTableSQL = `
  SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'tools_catalog'
  ) as table_exists;
`;

console.log(`   SQL: ${checkTableSQL.trim()}`);
console.log('   (Execute este SQL manualmente no Supabase SQL Editor)\n');

process.exit(0);
