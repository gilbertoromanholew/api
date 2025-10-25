/**
 * Script CORRIGIDO para inspecionar schemas V7 via SQL direto
 * Agora acessa tools e economy schemas corretamente
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mpanel.samm.host';
const SUPABASE_SERVICE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MDgzNjAyMCwiZXhwIjo0OTE2NTA5NjIwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.5-gIzyxIrbWSRhrdPAOLpMf_xfoANe4JSpKjjOs4NiY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
};

function header(text) {
  console.log(`\n${colors.cyan}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${text}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}\n`);
}

async function runSQL(query) {
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
  if (error) throw error;
  return data;
}

async function inspectSchemas() {
  header('📊 INSPEÇÃO COMPLETA - SCHEMAS V7');

  console.log(`${colors.cyan}🔗 Conectado:${colors.reset} ${SUPABASE_URL}\n`);

  // 1. Verificar schema tools
  console.log(`${colors.blue}━━━ SCHEMA: tools ━━━${colors.reset}\n`);
  
  try {
    const { data: catalog, error: catalogErr } = await supabase
      .schema('tools')
      .from('catalog')
      .select('*', { count: 'exact', head: true });
    
    console.log(`${colors.green}✅ tools.catalog${colors.reset}`);
    console.log(`   Registros: ${catalog?.count || 0}`);

    const { data: executions, error: execErr } = await supabase
      .schema('tools')
      .from('executions')
      .select('*', { count: 'exact', head: true });
    
    console.log(`${colors.green}✅ tools.executions${colors.reset}`);
    console.log(`   Registros: ${executions?.count || 0}`);
  } catch (err) {
    console.log(`${colors.red}❌ Erro ao acessar schema tools: ${err.message}${colors.reset}`);
  }

  // 2. Verificar schema economy
  console.log(`\n${colors.blue}━━━ SCHEMA: economy ━━━${colors.reset}\n`);
  
  const economyTables = [
    'user_wallets',
    'transactions',
    'purchases',
    'subscriptions',
    'subscription_plans',
    'referral_rewards'
  ];

  for (const table of economyTables) {
    try {
      const { count, error } = await supabase
        .schema('economy')
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      console.log(`${colors.green}✅ economy.${table}${colors.reset}`);
      console.log(`   Registros: ${count || 0}`);
    } catch (err) {
      console.log(`${colors.red}❌ economy.${table}: ${err.message}${colors.reset}`);
    }
  }

  // 3. Verificar se usuário tem wallet
  console.log(`\n${colors.blue}━━━ VERIFICAÇÃO: Wallet do Usuário ━━━${colors.reset}\n`);
  
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('email', 'gilbertoromanholew@gmail.com')
      .single();

    if (profile) {
      console.log(`${colors.green}👤 Usuário: ${profile.full_name}${colors.reset}`);
      console.log(`   ID: ${profile.id}`);

      const { data: wallet } = await supabase
        .schema('economy')
        .from('user_wallets')
        .select('*')
        .eq('user_id', profile.id)
        .single();

      if (wallet) {
        console.log(`${colors.green}✅ Wallet encontrada!${colors.reset}`);
        console.log(`   Bônus: ${wallet.bonus_credits}`);
        console.log(`   Comprados: ${wallet.purchased_credits}`);
        console.log(`   Total: ${wallet.total_credits}`);
      } else {
        console.log(`${colors.red}❌ WALLET NÃO ENCONTRADA!${colors.reset}`);
        console.log(`${colors.yellow}   ⚠️  Precisa criar wallet para este usuário${colors.reset}`);
      }
    }
  } catch (err) {
    console.log(`${colors.red}❌ Erro: ${err.message}${colors.reset}`);
  }

  // 4. Verificar tabelas duplicadas
  console.log(`\n${colors.blue}━━━ TABELAS DUPLICADAS ━━━${colors.reset}\n`);
  
  try {
    const { count: publicPurchases } = await supabase
      .from('purchases')
      .select('*', { count: 'exact', head: true });

    const { count: economyPurchases } = await supabase
      .schema('economy')
      .from('purchases')
      .select('*', { count: 'exact', head: true });

    console.log(`${colors.yellow}⚠️  Tabela 'purchases' existe em 2 schemas:${colors.reset}`);
    console.log(`   public.purchases: ${publicPurchases || 0} registros`);
    console.log(`   economy.purchases: ${economyPurchases || 0} registros`);
    
    if (publicPurchases === 0) {
      console.log(`${colors.green}   → Recomendação: DELETAR public.purchases (vazia)${colors.reset}`);
    }
  } catch (err) {
    console.log(`${colors.red}❌ Erro: ${err.message}${colors.reset}`);
  }

  header('✅ INSPEÇÃO CONCLUÍDA');
}

inspectSchemas().catch(err => {
  console.error(`\n${colors.red}❌ ERRO:${colors.reset}`, err);
  process.exit(1);
});
