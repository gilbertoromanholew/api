// Script de teste de conexão Supabase
import { supabaseAdmin } from './src/config/supabase.js';

console.log('🔍 Testando conexão com Supabase (Admin)...\n');

// Testar listagem de ferramentas
const { data, error } = await supabaseAdmin
    .from('tool_costs')
    .select('*')
    .eq('is_active', true);

if (error) {
    console.error('❌ Erro:', error);
} else {
    console.log(`✅ ${data.length} ferramentas encontradas:\n`);
    data.forEach(tool => {
        console.log(`   - ${tool.display_name} (${tool.points_cost} pts) [${tool.category}]`);
    });
}

console.log('\n📊 Resultado completo:');
console.log(JSON.stringify({ data, error }, null, 2));
