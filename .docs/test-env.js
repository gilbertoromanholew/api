// Teste de variáveis de ambiente
import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 Verificando variáveis de ambiente:\n');

const checks = [
    { name: 'SUPABASE_URL', value: process.env.SUPABASE_URL },
    { name: 'SUPABASE_ANON_KEY', value: process.env.SUPABASE_ANON_KEY?.substring(0, 20) + '...' },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', value: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...' }
];

checks.forEach(check => {
    if (check.value) {
        console.log(`✅ ${check.name}: ${check.value}`);
    } else {
        console.log(`❌ ${check.name}: NÃO CONFIGURADA`);
    }
});

console.log('\n🌐 Testando conectividade...\n');

// Teste simples de fetch
try {
    const url = process.env.SUPABASE_URL;
    console.log(`Tentando conectar em: ${url}`);
    
    const response = await fetch(`${url}/rest/v1/`, {
        headers: {
            'apikey': process.env.SUPABASE_ANON_KEY
        }
    });
    
    console.log(`✅ Status: ${response.status} ${response.statusText}`);
    
} catch (error) {
    console.error('❌ Erro de rede:', error.message);
    console.error('\n💡 Possíveis causas:');
    console.error('   - URL do Supabase incorreta');
    console.error('   - Firewall bloqueando conexão');
    console.error('   - Proxy corporativo');
    console.error('   - Certificado SSL inválido');
}
