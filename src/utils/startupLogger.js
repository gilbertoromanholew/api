import os from 'os';
import config from '../config/index.js';

/**
 * Obtém todas as interfaces de rede do sistema (simplificado)
 * @returns {Array} Lista de interfaces com seus detalhes
 */
function getNetworkInterfaces() {
    try {
        const interfaces = os.networkInterfaces();
        const result = [];
        
        for (const [name, addresses] of Object.entries(interfaces)) {
            const ipv4 = addresses.find(addr => addr.family === 'IPv4' && !addr.internal);
            
            if (ipv4) {
                result.push({
                    name,
                    ipv4: `${ipv4.address}`,
                    mac: ipv4.mac || 'N/A'
                });
            }
        }
        
        return result;
    } catch (error) {
        return [];
    }
}

/**
 * Detecta o ambiente de execução
 * @returns {string} Nome do ambiente
 */
function detectEnvironment() {
    if (process.env.COOLIFY) return 'Coolify';
    if (process.env.KUBERNETES_SERVICE_HOST) return 'Kubernetes';
    return 'Servidor';
}

/**
 * Formata tamanho de memória em GB
 * @param {number} bytes 
 * @returns {string}
 */
function formatMemory(bytes) {
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
}

/**
 * Exibe logs simplificados de inicialização
 */
export function logStartup() {
    try {
        const interfaces = getNetworkInterfaces();
        const environment = detectEnvironment();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        
        console.log('\n╔══════════════════════════════════════════════════════════════════╗');
        console.log('║                    🚀 API SERVER INICIADO                        ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝\n');
        
        console.log('📊 SISTEMA:');
        console.log(`   • Hostname:     ${os.hostname()}`);
        console.log(`   • Plataforma:   ${os.platform()} (${os.arch()})`);
        console.log(`   • Node.js:      ${process.version}`);
        console.log(`   • Ambiente:     ${environment}`);
        console.log(`   • RAM:          ${formatMemory(totalMem)} (${formatMemory(freeMem)} livre)`);
        console.log(`   • CPUs:         ${os.cpus().length} cores\n`);
        
        console.log('🌐 REDE:');
        if (interfaces.length > 0) {
            interfaces.forEach(iface => {
                console.log(`   • ${iface.name}: ${iface.ipv4} (${iface.mac})`);
            });
        } else {
            console.log('   • Interfaces internas apenas');
        }
        console.log('');
        
        console.log('⚙️  CONFIGURAÇÃO:');
        console.log(`   • Host:         ${config.server.host}`);
        console.log(`   • Porta:        ${config.server.port}`);
        console.log(`   • Modo:         ${process.env.NODE_ENV || 'development'}`);
        console.log(`   • Frontend:     ${config.frontend.url || 'N/A'}`);
        console.log(`   • IP Blocking:  ${config.security.ipBlocking ? 'ATIVO' : 'DESATIVADO'}`);
        console.log(`   • Allowed IPs:  ${config.security.allowedIPs.join(', ')}\n`);
        
        console.log('🔗 ACESSO:');
        const localHost = config.server.host === '0.0.0.0' ? 'localhost' : config.server.host;
        console.log(`   • API:          http://${localHost}:${config.server.port}`);
        console.log(`   • Docs:         http://${localHost}:${config.server.port}/docs`);
        console.log(`   • Dashboard:    http://${localHost}:${config.server.port}/logs`);
        console.log(`   • Health:       http://${localHost}:${config.server.port}/api/health\n`);
        
        console.log('✅ Servidor pronto para receber requisições!\n');
    } catch (error) {
        console.error('❌ Erro ao exibir logs:', error.message);
        console.log(`\n🚀 Servidor rodando em ${config.server.host}:${config.server.port}\n`);
    }
}

export default logStartup;
