import { allowedIPs } from '../config/allowedIPs.js';
import { accessLogger } from '../utils/accessLogger.js';
import { getClientIP, isIPInRange, getConnectionOrigin } from '../utils/ipUtils.js';
import { ipBlockingSystem } from '../utils/ipBlockingSystem.js';

// Cache de geolocalização (evitar chamadas excessivas à API)
const geoCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

// Função para obter geolocalização do IP
async function getIPGeolocation(ip) {
    // IPs locais não precisam de geolocalização
    if (ip === '127.0.0.1' || ip === 'localhost' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        return { country: 'Local', city: 'Localhost', countryCode: 'LOCAL' };
    }

    // Verificar cache
    const cached = geoCache.get(ip);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        return cached.data;
    }

    try {
        // Usar ip-api.com com TODOS os campos disponíveis
        // fields=66846719 retorna todos os campos disponíveis
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=66846719`, {
            timeout: 3000 // 3 segundos timeout
        });
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.status === 'success') {
                const geoData = {
                    country: data.country || 'Desconhecido',
                    city: data.city || 'Desconhecido',
                    countryCode: data.countryCode || 'XX',
                    region: data.region || '',
                    regionName: data.regionName || '',
                    isp: data.isp || 'Desconhecido',
                    org: data.org || 'Desconhecido',
                    as: data.as || 'N/A',
                    lat: data.lat || 0,
                    lon: data.lon || 0,
                    timezone: data.timezone || 'UTC',
                    zip: data.zip || 'N/A',
                    hosting: data.hosting || false,
                    proxy: data.proxy || false,
                    mobile: data.mobile || false
                };
                
                // Armazenar no cache
                geoCache.set(ip, {
                    data: geoData,
                    timestamp: Date.now()
                });
                
                return geoData;
            }
        }
    } catch (error) {
        console.error(`❌ Erro ao buscar geolocalização para ${ip}:`, error.message);
    }

    // Fallback se falhar
    return {
        country: 'Desconhecido',
        city: 'Desconhecido',
        countryCode: 'XX',
        region: '',
        regionName: '',
        isp: 'Desconhecido',
        org: 'Desconhecido',
        as: 'N/A',
        lat: 0,
        lon: 0,
        timezone: 'UTC',
        zip: 'N/A',
        hosting: false,
        proxy: false,
        mobile: false
    };
}

// Middleware para bloquear requisições de IPs não autorizados
export const ipFilter = async (req, res, next) => {
    // Pega o IP real considerando proxies/CDN
    const clientIp = getClientIP(req);
    
    // Buscar geolocalização do IP
    const geoData = await getIPGeolocation(clientIp);
    
    // Coletar o máximo de informações do cliente
    const clientInfo = {
        // Informações de IP (TODAS as variações)
        ip_detected: clientIp,                                    // IP que usamos para autorização
        ip_raw: req.ip,                                           // IP que o Express vê diretamente
        ip_forwarded_for: req.headers['x-forwarded-for'] || null, // IP(s) passados por proxies
        ip_real: req.headers['x-real-ip'] || null,               // IP real (header comum em nginx)
        ip_socket: req.socket.remoteAddress || null,              // IP da conexão do socket
        
        // Explicação dos IPs
        ip_explanation: {
            detected: 'IP usado para autorização (prioriza headers de proxy)',
            raw: 'IP que o Express vê diretamente (geralmente o proxy interno)',
            forwarded_for: 'Header X-Forwarded-For - IP real do cliente passado pelo proxy',
            real: 'Header X-Real-IP - Alternativa ao X-Forwarded-For',
            socket: 'IP da conexão TCP direta'
        },
        
        // Informações de Localização (expandido com todos os dados da ip-api.com)
        country: req.headers['cf-ipcountry'] || req.headers['x-country-code'] || geoData.country,
        countryCode: geoData.countryCode,
        city: req.headers['cf-ipcity'] || geoData.city,
        region: geoData.region,
        regionName: geoData.regionName,
        
        // Informações de Rede (ISP, Org, AS)
        isp: geoData.isp,
        org: geoData.org,
        as: geoData.as,
        
        // Coordenadas geográficas
        lat: geoData.lat,
        lon: geoData.lon,
        
        // Timezone e CEP
        timezone: geoData.timezone,
        zip: geoData.zip,
        
        // Flags de segurança
        hosting: geoData.hosting, // É servidor de hospedagem?
        proxy: geoData.proxy, // É proxy?
        mobile: geoData.mobile, // É rede móvel?
        
        // Informações do Cliente
        user_agent: req.headers['user-agent'] || null,
        browser: parseBrowser(req.headers['user-agent']),
        platform: parsePlatform(req.headers['user-agent']),
        
        // Informações da Requisição
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        hostname: req.hostname,
        
        // Headers úteis
        referer: req.headers['referer'] || req.headers['referrer'] || null,
        origin: req.headers['origin'] || null,
        accept_language: req.headers['accept-language'] || null,
        accept_encoding: req.headers['accept-encoding'] || null,
        
        // Informações de Conexão
        connection: req.headers['connection'] || null,
        host: req.headers['host'] || null,
        
        // Timestamp
        timestamp: new Date().toISOString(),
        timestamp_unix: Date.now(),
        
        // Status de Autorização (agora suporta CIDR)
        is_authorized: allowedIPs.some(allowedIP => isIPInRange(clientIp, allowedIP)),
        allowed_ips: allowedIPs
    };
    
    // Detectar origem da conexão
    const origin = getConnectionOrigin(clientIp);
    
    // Log completo no console
    console.log('\n' + '='.repeat(80));
    console.log(`${origin.icon} IP FILTER - CLIENT ACCESS ATTEMPT`);
    console.log('='.repeat(80));
    console.log(`⏰ Time: ${clientInfo.timestamp}`);
    console.log(`\n📍 IP ANALYSIS:`);
    console.log(`   🎯 Detected (used for auth): ${clientInfo.ip_detected}`);
    console.log(`   ${origin.icon} Origin: ${origin.network} (${origin.type})`);
    console.log(`   📦 Raw (req.ip): ${clientInfo.ip_raw}`);
    console.log(`   🔀 X-Forwarded-For: ${clientInfo.ip_forwarded_for || 'Not set'}`);
    console.log(`   🔗 X-Real-IP: ${clientInfo.ip_real || 'Not set'}`);
    console.log(`   🔌 Socket: ${clientInfo.ip_socket || 'Not set'}`);
    console.log(`\n🌍 LOCATION:`);
    console.log(`   Country: ${clientInfo.country || 'Unknown'} (${clientInfo.countryCode || 'XX'})`);
    console.log(`   City: ${clientInfo.city || 'Unknown'}`);
    if (origin.type === 'zerotier') {
        console.log(`\n� ZEROTIER INFO:`);
        console.log(`   Network: fada62b01530e6b6`);
        console.log(`   Range: 10.244.0.0/16`);
        console.log(`   Security: Encrypted P2P connection`);
    }
    console.log(`\n�💻 CLIENT:`);
    console.log(`   Browser: ${clientInfo.browser}`);
    console.log(`   Platform: ${clientInfo.platform}`);
    console.log(`   User Agent: ${clientInfo.user_agent || 'Not provided'}`);
    console.log(`\n📄 REQUEST:`);
    console.log(`   Method: ${req.method}`);
    console.log(`   URL: ${req.url}`);
    console.log(`   Referer: ${clientInfo.referer || 'Direct access'}`);
    console.log(`   Language: ${clientInfo.accept_language || 'Not specified'}`);
    console.log(`\n${clientInfo.is_authorized ? '✅' : '❌'} AUTHORIZATION: ${clientInfo.is_authorized ? '✅ YES - ACCESS GRANTED' : '❌ NO - ACCESS DENIED'}`);
    console.log('='.repeat(80) + '\n');
    
    // Registrar TODOS os acessos no sistema de logs (sem filtros)
    accessLogger.addLog(clientInfo);
    
    // Verificar autorização (agora suporta CIDR)
    if (!clientInfo.is_authorized) {
        // Verificar se IP está bloqueado ou suspenso
        const blockStatus = ipBlockingSystem.checkIP(clientIp);
        
        if (blockStatus.blocked) {
            // IP bloqueado ou suspenso
            const statusCode = blockStatus.type === 'permanent' ? 403 : 429;
            const emoji = blockStatus.type === 'permanent' ? '🚫' : '⏳';
            
            return res.status(statusCode).json({
                success: false,
                error: blockStatus.type === 'permanent' ? 'Access Permanently Blocked' : 'Access Temporarily Suspended',
                message: blockStatus.message,
                type: blockStatus.type,
                yourIP: clientIp,
                origin: origin.network,
                timestamp: new Date().toISOString(),
                ...(blockStatus.type === 'temporary' && {
                    suspendedUntil: blockStatus.until,
                    remainingMinutes: blockStatus.remainingMinutes
                }),
                notice: `${emoji} Your IP has been ${blockStatus.type === 'permanent' ? 'permanently blocked' : 'temporarily suspended'} due to repeated unauthorized access attempts.`
            });
        }
        
        // Registrar tentativa não autorizada no sistema de bloqueio
        const attemptResult = ipBlockingSystem.recordUnauthorizedAttempt(clientIp, {
            url: req.url,
            method: req.method,
            userAgent: req.headers['user-agent'],
            country: clientInfo.country,
            origin: origin.network
        });
        
        // Resposta baseada no status
        let warningMessage = '';
        let statusDetails = {};
        
        if (attemptResult.status === 'blocked') {
            // Acabou de ser bloqueado permanentemente
            warningMessage = `🚫 Your IP has been permanently blocked after ${attemptResult.attempts || attemptResult.suspensions} violations.`;
            statusDetails = {
                type: 'permanent_block',
                reason: attemptResult.reason,
                totalAttempts: attemptResult.attempts,
                totalSuspensions: attemptResult.suspensions
            };
        } else if (attemptResult.status === 'suspended') {
            // Acabou de ser suspenso
            warningMessage = `⏳ Your IP has been temporarily suspended for ${attemptResult.remainingMinutes} minutes. This is suspension #${attemptResult.suspensionNumber} of ${ipBlockingSystem.config.maxSuspensions} allowed.`;
            statusDetails = {
                type: 'temporary_suspension',
                suspendedUntil: attemptResult.until,
                remainingMinutes: attemptResult.remainingMinutes,
                suspensionNumber: attemptResult.suspensionNumber,
                maxSuspensions: ipBlockingSystem.config.maxSuspensions
            };
        } else if (attemptResult.status === 'warning') {
            // Ainda permitido, mas com aviso
            warningMessage = `⚠️ Warning: ${attemptResult.remainingAttempts} unauthorized attempts remaining before temporary suspension.`;
            statusDetails = {
                type: 'warning',
                attempts: attemptResult.attempts,
                remainingAttempts: attemptResult.remainingAttempts,
                maxAttempts: ipBlockingSystem.config.maxAttempts
            };
        }
        
        return res.status(403).json({ 
            success: false,
            error: 'Access Denied',
            message: 'Unauthorized access attempt detected. Your IP address is not authorized to access this API.',
            yourIP: clientIp,
            origin: origin.network,
            timestamp: new Date().toISOString(),
            security: statusDetails,
            warning: warningMessage
        });
    }
    
    next();
};

// Função auxiliar para detectar o navegador
function parseBrowser(userAgent) {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    if (userAgent.includes('MSIE') || userAgent.includes('Trident')) return 'Internet Explorer';
    if (userAgent.includes('curl')) return 'cURL';
    if (userAgent.includes('Postman')) return 'Postman';
    if (userAgent.includes('Insomnia')) return 'Insomnia';
    return 'Other';
}

// Função auxiliar para detectar a plataforma
function parsePlatform(userAgent) {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac OS')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    return 'Other';
}

