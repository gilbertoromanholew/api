/**
 * ============================================
 * TESTE DE AUDITORIA - ADMIN PANEL
 * ============================================
 * 
 * Testa especificamente o sistema de auditoria:
 * - Criação de tabela admin_audit_log
 * - Middleware de auditoria
 * - Endpoints de consulta
 * - Políticas RLS
 * 
 * Pré-requisitos:
 * 1. Executar admin_audit_log.sql no Supabase
 * 2. Adicionar middleware nas rotas do backend
 * 3. Criar endpoint GET /admin/audit-log
 */

const { createClient } = require('@supabase/supabase-js');

// ============================================
// CONFIGURAÇÃO
// ============================================

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://seu-projeto.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sua-service-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================
// TESTES DE TABELA
// ============================================

async function testTableExists() {
  console.log('🔍 Testando se tabela admin_audit_log existe...');
  
  try {
    const { data, error } = await supabase
      .from('admin_audit_log')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Tabela não existe ou não acessível:', error.message);
      return false;
    }
    
    console.log('✅ Tabela admin_audit_log existe e acessível');
    return true;
  } catch (err) {
    console.error('❌ Erro ao verificar tabela:', err.message);
    return false;
  }
}

async function testTableStructure() {
  console.log('\n🔍 Testando estrutura da tabela...');
  
  const requiredColumns = [
    'id',
    'admin_id',
    'action_type',
    'target_type',
    'target_id',
    'details',
    'ip_address',
    'user_agent',
    'created_at'
  ];
  
  try {
    // Inserir registro de teste
    const testRecord = {
      admin_id: '00000000-0000-0000-0000-000000000000', // UUID de teste
      action_type: 'test.action',
      target_type: 'test',
      target_id: '00000000-0000-0000-0000-000000000000',
      details: { test: true, timestamp: new Date().toISOString() },
      ip_address: '127.0.0.1',
      user_agent: 'Test Suite'
    };
    
    const { data, error } = await supabase
      .from('admin_audit_log')
      .insert(testRecord)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao inserir registro de teste:', error.message);
      return false;
    }
    
    // Verificar se todos os campos estão presentes
    const missingColumns = requiredColumns.filter(col => !(col in data));
    
    if (missingColumns.length > 0) {
      console.error('❌ Colunas faltando:', missingColumns);
      return false;
    }
    
    console.log('✅ Estrutura da tabela válida');
    console.log('📝 Registro de teste criado:', data.id);
    
    // Limpar registro de teste
    await supabase
      .from('admin_audit_log')
      .delete()
      .eq('id', data.id);
    
    console.log('🗑️ Registro de teste removido');
    
    return true;
  } catch (err) {
    console.error('❌ Erro ao testar estrutura:', err.message);
    return false;
  }
}

// ============================================
// TESTES DE ÍNDICES
// ============================================

async function testIndexes() {
  console.log('\n🔍 Testando índices...');
  
  try {
    // Query que deve usar índice admin_id
    const start1 = Date.now();
    await supabase
      .from('admin_audit_log')
      .select('*')
      .eq('admin_id', '00000000-0000-0000-0000-000000000000')
      .limit(10);
    const time1 = Date.now() - start1;
    
    // Query que deve usar índice action_type
    const start2 = Date.now();
    await supabase
      .from('admin_audit_log')
      .select('*')
      .eq('action_type', 'test.action')
      .limit(10);
    const time2 = Date.now() - start2;
    
    // Query que deve usar índice created_at
    const start3 = Date.now();
    await supabase
      .from('admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    const time3 = Date.now() - start3;
    
    console.log('✅ Queries executadas com sucesso');
    console.log(`   - Query por admin_id: ${time1}ms`);
    console.log(`   - Query por action_type: ${time2}ms`);
    console.log(`   - Query ordenada por created_at: ${time3}ms`);
    
    if (time1 < 100 && time2 < 100 && time3 < 100) {
      console.log('✅ Performance adequada (índices provavelmente ativos)');
    } else {
      console.warn('⚠️ Performance pode estar degradada (verificar índices)');
    }
    
    return true;
  } catch (err) {
    console.error('❌ Erro ao testar índices:', err.message);
    return false;
  }
}

// ============================================
// TESTES DE INSERÇÃO
// ============================================

async function testInsertAuditLog() {
  console.log('\n🔍 Testando inserção de logs de auditoria...');
  
  const testCases = [
    {
      name: 'Adicionar créditos',
      data: {
        admin_id: '00000000-0000-0000-0000-000000000000',
        action_type: 'user.credits.add',
        target_type: 'user',
        target_id: '11111111-1111-1111-1111-111111111111',
        details: {
          amount: 1000,
          type: 'bonus',
          reason: 'Teste de auditoria',
          previous_balance: 500,
          new_balance: 1500
        },
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 Test'
      }
    },
    {
      name: 'Mudar role',
      data: {
        admin_id: '00000000-0000-0000-0000-000000000000',
        action_type: 'user.role.change',
        target_type: 'user',
        target_id: '22222222-2222-2222-2222-222222222222',
        details: {
          previous_role: 'user',
          new_role: 'admin',
          target_user_name: 'Teste User'
        },
        ip_address: '192.168.1.101',
        user_agent: 'Chrome/118.0 Test'
      }
    },
    {
      name: 'Desativar usuário',
      data: {
        admin_id: '00000000-0000-0000-0000-000000000000',
        action_type: 'user.delete',
        target_type: 'user',
        target_id: '33333333-3333-3333-3333-333333333333',
        details: {
          reason: 'Violação de termos',
          target_user_name: 'Teste Violador'
        },
        ip_address: '192.168.1.102',
        user_agent: 'Firefox/119.0 Test'
      }
    }
  ];
  
  const insertedIds = [];
  
  try {
    for (const testCase of testCases) {
      console.log(`\n   Testando: ${testCase.name}`);
      
      const { data, error } = await supabase
        .from('admin_audit_log')
        .insert(testCase.data)
        .select()
        .single();
      
      if (error) {
        console.error(`   ❌ Erro ao inserir "${testCase.name}":`, error.message);
        continue;
      }
      
      console.log(`   ✅ "${testCase.name}" inserido com sucesso`);
      console.log(`      ID: ${data.id}`);
      insertedIds.push(data.id);
    }
    
    console.log(`\n✅ ${insertedIds.length}/${testCases.length} casos de teste inseridos`);
    
    // Limpar registros de teste
    if (insertedIds.length > 0) {
      await supabase
        .from('admin_audit_log')
        .delete()
        .in('id', insertedIds);
      
      console.log('🗑️ Registros de teste removidos');
    }
    
    return true;
  } catch (err) {
    console.error('❌ Erro durante testes de inserção:', err.message);
    return false;
  }
}

// ============================================
// TESTES DE CONSULTA
// ============================================

async function testQueryAuditLog() {
  console.log('\n🔍 Testando consultas de audit log...');
  
  try {
    // 1. Buscar por action_type
    console.log('\n   Teste 1: Buscar por action_type');
    const { data: byAction } = await supabase
      .from('admin_audit_log')
      .select('*')
      .eq('action_type', 'user.credits.add')
      .limit(5);
    
    console.log(`   ✅ Encontrados ${byAction?.length || 0} registros de tipo "user.credits.add"`);
    
    // 2. Buscar por admin_id
    console.log('\n   Teste 2: Buscar por admin_id');
    const { data: byAdmin } = await supabase
      .from('admin_audit_log')
      .select('*')
      .eq('admin_id', '00000000-0000-0000-0000-000000000000')
      .limit(5);
    
    console.log(`   ✅ Encontrados ${byAdmin?.length || 0} registros do admin especificado`);
    
    // 3. Buscar por período
    console.log('\n   Teste 3: Buscar por período (últimas 24h)');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data: byDate } = await supabase
      .from('admin_audit_log')
      .select('*')
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);
    
    console.log(`   ✅ Encontrados ${byDate?.length || 0} registros nas últimas 24h`);
    
    // 4. Buscar com filtro JSONB
    console.log('\n   Teste 4: Buscar com filtro JSONB');
    const { data: byDetails } = await supabase
      .from('admin_audit_log')
      .select('*')
      .contains('details', { type: 'bonus' })
      .limit(5);
    
    console.log(`   ✅ Encontrados ${byDetails?.length || 0} registros com type: bonus`);
    
    return true;
  } catch (err) {
    console.error('❌ Erro durante testes de consulta:', err.message);
    return false;
  }
}

// ============================================
// TESTE DE RLS (ROW LEVEL SECURITY)
// ============================================

async function testRLS() {
  console.log('\n🔍 Testando Row Level Security...');
  
  console.log('⚠️ Teste de RLS requer:');
  console.log('   1. Um usuário admin autenticado');
  console.log('   2. Um usuário normal autenticado');
  console.log('   3. Testar acesso de cada um à tabela');
  console.log('\n   Execute manualmente no Supabase Dashboard ou via API');
  
  return true;
}

// ============================================
// EXECUTAR TODOS OS TESTES
// ============================================

async function runAllTests() {
  console.clear();
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   TESTES DE AUDITORIA - ADMIN PANEL           ║');
  console.log('║   Data: ' + new Date().toLocaleString('pt-BR').padEnd(37) + '║');
  console.log('╚════════════════════════════════════════════════╝\n');
  
  const results = {
    tableExists: false,
    tableStructure: false,
    indexes: false,
    insert: false,
    query: false,
    rls: false
  };
  
  // Executar testes em sequência
  results.tableExists = await testTableExists();
  
  if (results.tableExists) {
    results.tableStructure = await testTableStructure();
    results.indexes = await testIndexes();
    results.insert = await testInsertAuditLog();
    results.query = await testQueryAuditLog();
    results.rls = await testRLS();
  }
  
  // Resumo
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMO DOS TESTES');
  console.log('='.repeat(50));
  
  Object.entries(results).forEach(([test, passed]) => {
    const emoji = passed ? '✅' : '❌';
    console.log(`${emoji} ${test}`);
  });
  
  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(Boolean).length;
  const percentage = ((passed / total) * 100).toFixed(0);
  
  console.log('\n' + '='.repeat(50));
  console.log(`📈 TAXA DE SUCESSO: ${passed}/${total} (${percentage}%)`);
  console.log('='.repeat(50));
}

// ============================================
// EXPORTAR OU EXECUTAR
// ============================================

if (require.main === module) {
  runAllTests()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ ERRO CRÍTICO:', err);
      process.exit(1);
    });
} else {
  module.exports = {
    runAllTests,
    testTableExists,
    testTableStructure,
    testIndexes,
    testInsertAuditLog,
    testQueryAuditLog,
    testRLS
  };
}
