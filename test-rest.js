// Teste direto com API REST do Supabase
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testando API REST do Supabase...\n');

try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/tool_costs?is_active=eq.true&select=*`, {
        headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        console.error(`❌ HTTP ${response.status}: ${response.statusText}`);
        const text = await response.text();
        console.error(text);
    } else {
        const data = await response.json();
        console.log(`✅ ${data.length} ferramentas encontradas:\n`);
        data.forEach(tool => {
            console.log(`   - ${tool.display_name} (${tool.points_cost} pts) [${tool.category}]`);
        });
        
        console.log('\n📊 Estrutura da primeira ferramenta:');
        if (data[0]) {
            console.log(JSON.stringify(data[0], null, 2));
        }
    }
} catch (error) {
    console.error('❌ Erro:', error.message);
}
