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
 * Exibe logs simplificados de inicialização (estilo dashboard limpo)
 * @param {Object} toolsStats - Estatísticas de ferramentas carregadas
 * @param {Object} functionsStats - Estatísticas de funcionalidades carregadas
 */
export function logStartup(toolsStats = null, functionsStats = null) {
    try {
        const interfaces = getNetworkInterfaces();
        const environment = detectEnvironment();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        
        // Limpar console antes de mostrar o banner
        console.clear();
        
        console.log('\n');
        console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
        console.log('║                                                                           ║');
        console.log('║                        🚀  API SERVER ONLINE                              ║');
        console.log('║                                                                           ║');
        console.log('╚═══════════════════════════════════════════════════════════════════════════╝');
        console.log('');
        
        // Sistema
        console.log('  📊  SISTEMA');
        console.log('  ├─ Node.js:', process.version);
        console.log('  ├─ Ambiente:', environment);
        console.log('  ├─ CPUs:', os.cpus().length, 'cores');
        console.log('  └─ RAM:', `${formatMemory(freeMem)} livre de ${formatMemory(totalMem)}`);
        console.log('');
        
        // Rede
        console.log('  🌐  REDE');
        if (interfaces.length > 0) {
            interfaces.forEach((iface, index) => {
                const isLast = index === interfaces.length - 1;
                const prefix = isLast ? '  └─' : '  ├─';
                console.log(`${prefix} ${iface.name}:`, iface.ipv4);
            });
        } else {
            console.log('  └─ Localhost apenas');
        }
        console.log('');
        
        // Configuração
        console.log('  ⚙️   CONFIGURAÇÃO');
        console.log('  ├─ Modo:', process.env.NODE_ENV || 'development');
        console.log('  ├─ Porta:', config.server.port);
        console.log('  ├─ IP Blocking:', config.security.ipBlocking ? '🔒 ATIVO' : '🔓 DESATIVADO');
        console.log('  └─ Frontend:', config.frontend.url || 'http://localhost:5173');
        console.log('');
        
        // Ferramentas Carregadas
        if (toolsStats && toolsStats.tools && toolsStats.tools.length > 0) {
            console.log('  🔧  FERRAMENTAS CARREGADAS');
            toolsStats.tools.forEach((tool, index) => {
                const isLast = index === toolsStats.tools.length - 1;
                const prefix = isLast ? '  └─' : '  ├─';
                
                console.log(`${prefix} ${tool.slug}`);
                if (tool.endpoints && tool.endpoints.length > 0) {
                    tool.endpoints.forEach((endpoint, eIndex) => {
                        const isLastEndpoint = eIndex === tool.endpoints.length - 1;
                        const endpointPrefix = isLast ? '     ' : '  │  ';
                        const marker = isLastEndpoint ? '└─' : '├─';
                        console.log(`${endpointPrefix}${marker} ${endpoint.method} /api/tools/${tool.slug}${endpoint.path}`);
                    });
                }
            });
            console.log('');
        }
        
        // Funcionalidades Carregadas
        if (functionsStats && functionsStats.length > 0) {
            console.log('  📦  FUNCIONALIDADES CARREGADAS');
            functionsStats.forEach((func, index) => {
                const isLast = index === functionsStats.length - 1;
                const prefix = isLast ? '  └─' : '  ├─';
                console.log(`${prefix} /${func.category}`);
            });
            console.log('');
        }
        
        // Acesso
        const localHost = config.server.host === '0.0.0.0' ? 'localhost' : config.server.host;
        console.log('  🔗  ENDPOINTS');
        console.log(`  ├─ API:        http://${localHost}:${config.server.port}`);
        console.log(`  ├─ Docs:       http://${localHost}:${config.server.port}/docs`);
        console.log(`  ├─ Dashboard:  http://${localHost}:${config.server.port}/logs`);
        console.log(`  └─ Health:     http://${localHost}:${config.server.port}/health`);
        console.log('');
        
        console.log('  ✅  Servidor pronto para requisições');
        console.log('');
        console.log('─────────────────────────────────────────────────────────────────────────────');
        console.log('');
    } catch (error) {
        console.error('❌ Erro ao exibir logs:', error.message);
        console.log(`\n🚀 Servidor rodando em ${config.server.host}:${config.server.port}\n`);
    }
}

export default logStartup;
