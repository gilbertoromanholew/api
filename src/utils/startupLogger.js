import os from 'os';
import https from 'https';
import fs from 'fs';
import config from '../config/index.js';

/**
 * Obtém o IP público do servidor
 * @returns {Promise<string>} IP público ou mensagem de erro
 */
async function getPublicIP() {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            resolve('Não disponível (timeout)');
        }, 5000);

        https.get('https://api.ipify.org?format=json', (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                clearTimeout(timeout);
                try {
                    const json = JSON.parse(data);
                    resolve(json.ip || 'Não disponível');
                } catch (error) {
                    resolve('Não disponível (erro ao parsear)');
                }
            });
        }).on('error', () => {
            clearTimeout(timeout);
            resolve('Não disponível (erro de conexão)');
        });
    });
}

/**
 * Obtém todas as interfaces de rede do sistema
 * @returns {Array} Lista de interfaces com seus detalhes
 */
function getNetworkInterfaces() {
    const interfaces = os.networkInterfaces();
    const result = [];
    
    for (const [name, addresses] of Object.entries(interfaces)) {
        const ipv4 = addresses.find(addr => addr.family === 'IPv4' && !addr.internal);
        const ipv6 = addresses.find(addr => addr.family === 'IPv6' && !addr.internal);
        
        if (ipv4 || ipv6) {
            result.push({
                name,
                ipv4: ipv4 ? `${ipv4.address}/${ipv4.netmask}` : 'N/A',
                ipv6: ipv6 ? `${ipv6.address}` : 'N/A',
                mac: ipv4?.mac || ipv6?.mac || 'N/A'
            });
        }
    }
    
    return result;
}

/**
 * Detecta o ambiente de execução
 * @returns {string} Nome do ambiente
 */
function detectEnvironment() {
    if (process.env.COOLIFY) return 'Coolify (Docker)';
    if (process.env.KUBERNETES_SERVICE_HOST) return 'Kubernetes';
    if (process.env.DOCKER_CONTAINER) return 'Docker';
    if (fs.existsSync('/.dockerenv')) return 'Docker';
    return 'Bare Metal / VM';
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
 * Exibe banner de inicialização
 */
function printBanner() {
    console.log('\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                    🚀 API SERVER STARTING                        ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');
}

/**
 * Exibe informações do sistema
 */
async function printSystemInfo() {
    const publicIP = await getPublicIP();
    const interfaces = getNetworkInterfaces();
    const environment = detectEnvironment();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const cpus = os.cpus();
    
    console.log('┌─────────────────────────────────────────────────────────────────┐');
    console.log('│  📊 INFORMAÇÕES DO SISTEMA                                      │');
    console.log('├─────────────────────────────────────────────────────────────────┤');
    console.log(`│  Hostname:        ${os.hostname().padEnd(46)}│`);
    console.log(`│  Plataforma:      ${os.platform().padEnd(46)}│`);
    console.log(`│  Arquitetura:     ${os.arch().padEnd(46)}│`);
    console.log(`│  Node.js:         ${process.version.padEnd(46)}│`);
    console.log(`│  Ambiente:        ${environment.padEnd(46)}│`);
    console.log(`│  CPU:             ${cpus[0].model.substring(0, 46).padEnd(46)}│`);
    console.log(`│  Cores:           ${cpus.length} cores`.padEnd(65) + '│');
    console.log(`│  RAM Total:       ${formatMemory(totalMem).padEnd(46)}│`);
    console.log(`│  RAM Usada:       ${formatMemory(usedMem).padEnd(46)}│`);
    console.log(`│  RAM Livre:       ${formatMemory(freeMem).padEnd(46)}│`);
    console.log(`│  Uptime Sistema:  ${Math.floor(os.uptime() / 60)} minutos`.padEnd(65) + '│');
    console.log('└─────────────────────────────────────────────────────────────────┘\n');
}

/**
 * Exibe informações de rede
 */
async function printNetworkInfo() {
    const publicIP = await getPublicIP();
    const interfaces = getNetworkInterfaces();
    
    console.log('┌─────────────────────────────────────────────────────────────────┐');
    console.log('│  🌐 INFORMAÇÕES DE REDE                                         │');
    console.log('├─────────────────────────────────────────────────────────────────┤');
    console.log(`│  IP Público:      ${publicIP.padEnd(46)}│`);
    console.log('├─────────────────────────────────────────────────────────────────┤');
    
    // Interfaces de rede
    if (interfaces.length > 0) {
        interfaces.forEach((iface, index) => {
            if (index > 0) console.log('│  ────────────────────────────────────────────────────────────   │');
            console.log(`│  Interface:       ${iface.name.padEnd(46)}│`);
            console.log(`│  IPv4:            ${iface.ipv4.padEnd(46)}│`);
            if (iface.ipv6 !== 'N/A') {
                console.log(`│  IPv6:            ${iface.ipv6.substring(0, 46).padEnd(46)}│`);
            }
            console.log(`│  MAC:             ${iface.mac.padEnd(46)}│`);
        });
    } else {
        console.log('│  Nenhuma interface de rede ativa detectada                     │');
    }
    
    console.log('└─────────────────────────────────────────────────────────────────┘\n');
}

/**
 * Exibe configurações do servidor
 */
function printServerConfig() {
    const allowedIPs = config.security.allowedIPs.join(', ') || '*';
    const ipBlocking = config.security.ipBlocking ? 'ATIVO' : 'DESATIVADO';
    
    console.log('┌─────────────────────────────────────────────────────────────────┐');
    console.log('│  ⚙️  CONFIGURAÇÕES DO SERVIDOR                                   │');
    console.log('├─────────────────────────────────────────────────────────────────┤');
    console.log(`│  Host:            ${config.server.host.padEnd(46)}│`);
    console.log(`│  Porta:           ${String(config.server.port).padEnd(46)}│`);
    console.log(`│  Modo:            ${(process.env.NODE_ENV || 'development').toUpperCase().padEnd(46)}│`);
    console.log('├─────────────────────────────────────────────────────────────────┤');
    console.log(`│  Frontend URL:    ${(config.frontend.url || 'N/A').padEnd(46)}│`);
    console.log('├─────────────────────────────────────────────────────────────────┤');
    console.log(`│  IP Blocking:     ${ipBlocking.padEnd(46)}│`);
    console.log('│  Allowed IPs:                                                   │');
    
    // Quebrar ALLOWED_IPs em múltiplas linhas se necessário
    const chunks = allowedIPs.match(/.{1,60}/g) || [allowedIPs];
    chunks.forEach((chunk, index) => {
        const prefix = index === 0 ? '    ' : '    ';
        console.log(`│  ${prefix}${chunk.padEnd(60)}│`);
    });
    
    console.log('└─────────────────────────────────────────────────────────────────┘\n');
}

/**
 * Exibe URLs de acesso
 */
function printAccessURLs() {
    const port = config.server.port;
    const host = config.server.host;
    
    // Determinar o host correto para URLs
    let localHost = 'localhost';
    if (host !== '0.0.0.0' && host !== '::') {
        localHost = host;
    }
    
    console.log('┌─────────────────────────────────────────────────────────────────┐');
    console.log('│  🔗 URLs DE ACESSO                                              │');
    console.log('├─────────────────────────────────────────────────────────────────┤');
    console.log(`│  API:             http://${localHost}:${port}`.padEnd(65) + '│');
    console.log(`│  Documentação:    http://${localHost}:${port}/docs`.padEnd(65) + '│');
    console.log(`│  Dashboard Logs:  http://${localHost}:${port}/logs`.padEnd(65) + '│');
    console.log(`│  Health Check:    http://${localHost}:${port}/api/health`.padEnd(65) + '│');
    console.log(`│  ZeroTier:        http://${localHost}:${port}/zerotier/status`.padEnd(65) + '│');
    console.log('└─────────────────────────────────────────────────────────────────┘\n');
}

/**
 * Exibe mensagem de prontidão
 */
function printReadyMessage() {
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ SERVIDOR PRONTO!                           ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');
}

/**
 * Exibe todos os logs de inicialização
 */
export async function logStartup() {
    try {
        printBanner();
        await printSystemInfo();
        await printNetworkInfo();
        printServerConfig();
        printAccessURLs();
        printReadyMessage();
    } catch (error) {
        console.error('❌ Erro ao exibir logs de inicialização:', error);
        // Fallback simples
        console.log(`\n🚀 Servidor rodando em http://${config.server.host}:${config.server.port}\n`);
    }
}

export default logStartup;
