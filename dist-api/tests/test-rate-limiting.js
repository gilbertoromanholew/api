#!/usr/bin/env node

/**
 * Script de teste para Rate Limiting Inteligente
 * Testa os diferentes tipos de usuário e limites
 */

const https = require('https');

const API_BASE = 'https://api.samm.host';

// Tokens de teste (substitua pelos reais para teste)
const TOKENS = {
    anonymous: null,
    authenticated: 'BEARER_TOKEN_COMUM', // Substitua
    pro: 'BEARER_TOKEN_PRO' // Substitua
};

function makeRequest(endpoint, token = null, userType = 'anonymous') {
    return new Promise((resolve, reject) => {
        const url = `${API_BASE}${endpoint}`;
        const options = {
            headers: {
                'User-Agent': 'RateLimit-Test-Script/1.0'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        data: json,
                        userType,
                        endpoint
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: data,
                        userType,
                        endpoint
                    });
                }
            });
        }).on('error', reject);
    });
}

async function testRateLimit(userType, token, requests = 150) {
    console.log(`\n🧪 Testando ${userType.toUpperCase()} - ${requests} requests`);
    console.log('='.repeat(50));

    let successCount = 0;
    let rateLimitCount = 0;

    for (let i = 1; i <= requests; i++) {
        try {
            const result = await makeRequest('/user/profile', token, userType);

            if (result.status === 200) {
                successCount++;
            } else if (result.status === 429) {
                rateLimitCount++;
                console.log(`❌ Request ${i}: 429 - ${result.data.message || 'Rate limited'}`);
                break; // Para no primeiro 429
            } else {
                console.log(`⚠️  Request ${i}: ${result.status} - ${result.data?.error || 'Unknown error'}`);
            }

            // Pequena pausa entre requests
            await new Promise(resolve => setTimeout(resolve, 100));

            if (i % 50 === 0) {
                console.log(`📊 Progress: ${i}/${requests} - Success: ${successCount}, Limited: ${rateLimitCount}`);
            }

        } catch (error) {
            console.error(`💥 Request ${i} failed:`, error.message);
        }
    }

    console.log(`\n📈 Resultado ${userType.toUpperCase()}:`);
    console.log(`   ✅ Sucessos: ${successCount}`);
    console.log(`   ❌ Rate Limited: ${rateLimitCount}`);
    console.log(`   📊 Taxa de sucesso: ${((successCount / (successCount + rateLimitCount)) * 100).toFixed(1)}%`);

    return { successCount, rateLimitCount };
}

async function runTests() {
    console.log('🚀 Iniciando testes de Rate Limiting Inteligente');
    console.log('Base URL:', API_BASE);
    console.log('Data:', new Date().toISOString());

    // Teste 1: Usuário anônimo (deve limitar em ~100)
    await testRateLimit('anonymous', TOKENS.anonymous, 120);

    // Teste 2: Usuário autenticado comum (deve limitar em ~200)
    await testRateLimit('authenticated', TOKENS.authenticated, 220);

    // Teste 3: Usuário PRO (não deve limitar)
    await testRateLimit('pro', TOKENS.pro, 300);

    console.log('\n🎉 Testes concluídos!');
    console.log('Verifique os logs da API para detalhes completos.');
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests().catch(console.error);
}

export { testRateLimit, makeRequest };