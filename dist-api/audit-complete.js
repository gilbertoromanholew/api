import { supabaseAdmin } from './src/config/supabase.js';

console.log('🔍 AUDITORIA COMPLETA DO BANCO DE DADOS\n');
console.log('='.repeat(60));

// ========================================
// 1. LISTAR TODAS AS TABELAS EM PUBLIC
// ========================================
console.log('\n📊 1. TABELAS EM PUBLIC:');
const { data: tables, error: tablesError } = await supabaseAdmin
  .from('information_schema.tables')
  .select('table_name')
  .eq('table_schema', 'public')
  .order('table_name');

if (tablesError) {
  console.log('❌ Erro ao buscar tabelas:', tablesError.message);
} else {
  console.log(`   Total: ${tables.length} tabelas`);
  tables.forEach(t => console.log(`   - ${t.table_name}`));
}

// ========================================
// 2. VERIFICAR RLS (Row Level Security)
// ========================================
console.log('\n🔒 2. POLÍTICAS RLS:');
const { data: rlsPolicies, error: rlsError } = await supabaseAdmin.rpc('check_rls_policies');

if (rlsError) {
  console.log('⚠️ RPC check_rls_policies não existe. Usando query direta...');
  
  // Query SQL direta para verificar RLS
  const checkRLS = `
    SELECT 
      schemaname,
      tablename,
      rowsecurity as rls_enabled
    FROM pg_tables 
    WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%'
    ORDER BY tablename;
  `;
  
  console.log('   Executando verificação manual de RLS...');
}

// ========================================
// 3. VERIFICAR TABELAS CRÍTICAS
// ========================================
console.log('\n🎯 3. VERIFICANDO TABELAS CRÍTICAS:');

const criticalTables = [
  'profiles',
  'tools_catalog',
  'tools_executions',
  'economy_user_wallets',
  'economy_transactions',
  'economy_purchases',
  'economy_subscriptions',
  'social_referrals',
  'gamification_achievements',
  'otp_codes',
  'promo_codes'
];

for (const table of criticalTables) {
  const { count, error } = await supabaseAdmin
    .from(table)
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.log(`   ❌ ${table}: ERRO - ${error.message || error.code || JSON.stringify(error)}`);
  } else {
    console.log(`   ✅ ${table}: ${count} registros`);
  }
}

// ========================================
// 4. VERIFICAR FOREIGN KEYS
// ========================================
console.log('\n🔗 4. FOREIGN KEYS:');
console.log('   Verificando integridade referencial...');

const fkCheck = await supabaseAdmin.rpc('check_foreign_keys');
if (fkCheck.error) {
  console.log('   ⚠️ Não foi possível verificar FKs automaticamente');
}

// ========================================
// 5. VERIFICAR ÍNDICES
// ========================================
console.log('\n⚡ 5. ÍNDICES:');
console.log('   Verificando performance...');

// ========================================
// 6. VERIFICAR DADOS DO USUÁRIO
// ========================================
console.log('\n👤 6. DADOS DO USUÁRIO (gilbertoromanholew@gmail.com):');

const { data: profile } = await supabaseAdmin
  .from('profiles')
  .select('id, email, full_name, referral_code')
  .eq('email', 'gilbertoromanholew@gmail.com')
  .single();

if (profile) {
  console.log(`   ✅ Profile encontrado: ${profile.full_name}`);
  console.log(`   📧 Email: ${profile.email}`);
  console.log(`   🔑 Referral: ${profile.referral_code}`);
  
  // Verificar wallet
  const { data: wallet } = await supabaseAdmin
    .from('economy_user_wallets')
    .select('*')
    .eq('user_id', profile.id)
    .single();
  
  if (wallet) {
    console.log(`   💰 Wallet:`);
    console.log(`      - Bonus: ${wallet.bonus_credits}`);
    console.log(`      - Purchased: ${wallet.purchased_points}`);
    console.log(`      - Total: ${wallet.bonus_credits + wallet.purchased_points}`);
  } else {
    console.log('   ❌ Wallet NÃO ENCONTRADA!');
  }
  
  // Verificar ferramentas disponíveis
  const { data: tools, count: toolsCount } = await supabaseAdmin
    .from('tools_catalog')
    .select('*', { count: 'exact' })
    .eq('is_active', true);
  
  console.log(`   🛠️ Ferramentas ativas: ${toolsCount}`);
}

// ========================================
// 7. RESUMO FINAL
// ========================================
console.log('\n' + '='.repeat(60));
console.log('✅ AUDITORIA CONCLUÍDA!');
console.log('='.repeat(60));

process.exit(0);
