/**
 * Script de teste direto para endpoints admin
 * Execute: node test-admin-endpoints.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

console.log('🔍 TESTANDO QUERIES DO BACKEND\n');

async function testStatsQueries() {
  console.log('📊 1. Testando queries do endpoint /admin/stats...\n');
  
  try {
    // 1. Contar usuários totais
    console.log('   → Contando usuários totais...');
    const { count: totalUsers, error: e1 } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true });
    
    if (e1) throw new Error(`Erro ao contar users: ${e1.message}`);
    console.log(`   ✅ Total usuários: ${totalUsers}`);

    // 2. Contar usuários por role
    console.log('   → Contando usuários por role...');
    const { data: roleStats, error: e2 } = await supabaseAdmin
      .from('profiles')
      .select('role');
    
    if (e2) throw new Error(`Erro ao buscar roles: ${e2.message}`);
    
    const roleCount = roleStats.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    console.log(`   ✅ Usuários por role:`, roleCount);

    // 3. Usuários últimos 30 dias
    console.log('   → Contando novos usuários (30 dias)...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { count: newUsers, error: e3 } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());
    
    if (e3) throw new Error(`Erro ao contar novos users: ${e3.message}`);
    console.log(`   ✅ Novos usuários (30 dias): ${newUsers}`);

    // 4. Total de créditos
    console.log('   → Buscando créditos do sistema...');
    const { data: wallets, error: e4 } = await supabaseAdmin
      .from('economy_user_wallets')
      .select('bonus_credits, purchased_points, total_spent');
    
    if (e4) throw new Error(`Erro ao buscar wallets: ${e4.message}`);
    
    const creditsStats = wallets.reduce((acc, wallet) => ({
      totalBonus: acc.totalBonus + (wallet.bonus_credits || 0),
      totalPurchased: acc.totalPurchased + (wallet.purchased_points || 0),
      totalSpent: acc.totalSpent + (wallet.total_spent || 0)
    }), { totalBonus: 0, totalPurchased: 0, totalSpent: 0 });
    
    console.log(`   ✅ Créditos:`, creditsStats);

    // 5. Ferramentas mais usadas
    console.log('   → Buscando uso de ferramentas...');
    try {
      const { data: toolUsage, error: e5 } = await supabaseAdmin
        .from('tools_usage')
        .select('tool_slug')
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      if (e5) {
        console.log(`   ⚠️  Tabela tools_usage: ${e5.message}`);
        console.log(`   ℹ️  Retornando array vazio (esperado)`);
      } else {
        console.log(`   ✅ Tools usage encontrados: ${toolUsage?.length || 0}`);
      }
    } catch (toolErr) {
      console.log(`   ⚠️  Erro em tools_usage (será ignorado): ${toolErr.message}`);
    }

    console.log('\n✅ TESTE /admin/stats: PASSOU\n');
    
  } catch (error) {
    console.error('\n❌ ERRO em /admin/stats:');
    console.error(`   Mensagem: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    process.exit(1);
  }
}

async function testToolsQueries() {
  console.log('🔧 2. Testando queries do endpoint /admin/tools...\n');
  
  try {
    console.log('   → Buscando transações de ferramentas...');
    const { data: toolsUsage, error } = await supabaseAdmin
      .from('economy_transactions')
      .select('description, amount, created_at, type')
      .eq('type', 'debit')
      .like('description', '%Uso de ferramenta%')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw new Error(`Erro ao buscar transactions: ${error.message}`);
    
    console.log(`   ✅ Transações encontradas: ${toolsUsage?.length || 0}`);
    
    // Agrupar por ferramenta
    const toolStats = {};
    toolsUsage.forEach(usage => {
      const toolName = usage.description.replace('Uso de ferramenta: ', '').trim();
      if (!toolStats[toolName]) {
        toolStats[toolName] = {
          name: toolName,
          totalUses: 0,
          totalCredits: 0,
          lastUsed: usage.created_at
        };
      }
      toolStats[toolName].totalUses += 1;
      toolStats[toolName].totalCredits += Math.abs(usage.amount);
    });

    const toolsArray = Object.values(toolStats)
      .sort((a, b) => b.totalUses - a.totalUses);

    console.log(`   ✅ Ferramentas únicas: ${toolsArray.length}`);
    if (toolsArray.length > 0) {
      console.log(`   📊 Top 3:`, toolsArray.slice(0, 3));
    }

    console.log('\n✅ TESTE /admin/tools: PASSOU\n');
    
  } catch (error) {
    console.error('\n❌ ERRO em /admin/tools:');
    console.error(`   Mensagem: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    process.exit(1);
  }
}

async function testAuditLog() {
  console.log('📝 3. Testando queries do endpoint /admin/audit-log...\n');
  
  try {
    console.log('   → Buscando audit log...');
    const { data: auditLogs, error, count } = await supabaseAdmin
      .from('admin_audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw new Error(`Erro ao buscar audit log: ${error.message}`);
    
    console.log(`   ✅ Registros encontrados: ${count || 0}`);
    if (auditLogs?.length > 0) {
      console.log(`   📋 Primeiro registro:`, auditLogs[0]);
    }

    console.log('\n✅ TESTE /admin/audit-log: PASSOU\n');
    
  } catch (error) {
    console.error('\n❌ ERRO em /admin/audit-log:');
    console.error(`   Mensagem: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    process.exit(1);
  }
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║  TESTE DE QUERIES BACKEND - ADMIN ENDPOINTS   ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  
  try {
    await testStatsQueries();
    await testToolsQueries();
    await testAuditLog();
    
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║  ✅ TODOS OS TESTES PASSARAM!                  ║');
    console.log('╚════════════════════════════════════════════════╝\n');
    
    console.log('💡 Se as queries funcionam aqui mas retornam 500 na API,');
    console.log('   o problema pode ser:');
    console.log('   1. Middleware de autenticação');
    console.log('   2. Validação de IP');
    console.log('   3. Erro no código do endpoint específico\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ALGUM TESTE FALHOU\n');
    process.exit(1);
  }
}

runAllTests();
