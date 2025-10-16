import { allowedIPs } from '../config/allowedIPs.js';

// Middleware para bloquear requisições de IPs não autorizados
export const ipFilter = (req, res, next) => {
    // Pega o IP real considerando proxies/CDN
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                     req.headers['x-real-ip'] || 
                     req.ip;
    
    // Coletar o máximo de informações do cliente
    const clientInfo = {
        // Informações de IP
        ip_detected: clientIp,
        ip_raw: req.ip,
        ip_forwarded: req.headers['x-forwarded-for'] || null,
        ip_real: req.headers['x-real-ip'] || null,
        
        // Informações de Localização (se disponível via proxy)
        country: req.headers['cf-ipcountry'] || req.headers['x-country-code'] || null,
        city: req.headers['cf-ipcity'] || null,
        
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
        
        // Status de Autorização
        is_authorized: allowedIPs.includes(clientIp),
        allowed_ips: allowedIPs
    };
    
    // Log completo no console
    console.log('\n' + '='.repeat(80));
    console.log('🔍 IP FILTER - CLIENT ACCESS ATTEMPT');
    console.log('='.repeat(80));
    console.log(`⏰ Time: ${clientInfo.timestamp}`);
    console.log(`📍 IP: ${clientInfo.ip_detected}`);
    console.log(`🌍 Country: ${clientInfo.country || 'Unknown'}`);
    console.log(`🏙️  City: ${clientInfo.city || 'Unknown'}`);
    console.log(`💻 User Agent: ${clientInfo.user_agent}`);
    console.log(`🌐 Browser: ${clientInfo.browser}`);
    console.log(`🖥️  Platform: ${clientInfo.platform}`);
    console.log(`📄 URL: ${req.method} ${req.url}`);
    console.log(`🔗 Referer: ${clientInfo.referer || 'Direct access'}`);
    console.log(`🌍 Language: ${clientInfo.accept_language || 'Not specified'}`);
    console.log(`✅ Authorized: ${clientInfo.is_authorized ? '✅ YES' : '❌ NO'}`);
    console.log('='.repeat(80) + '\n');
    
    if (!allowedIPs.includes(clientIp)) {
        return res.status(403).json({ 
            error: 'Hackers are not allowed here. Please go away ;)',
            debug: clientInfo  // Todas as informações do cliente
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

