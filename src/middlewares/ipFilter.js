import { allowedIPs } from '../config/allowedIPs.js';

// Middleware para bloquear requisições de IPs não autorizados
export const ipFilter = (req, res, next) => {
    // Pega o IP real considerando proxies/CDN
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                     req.headers['x-real-ip'] || 
                     req.ip;
    
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
    console.log(`\n📍 IP ANALYSIS:`);
    console.log(`   🎯 Detected (used for auth): ${clientInfo.ip_detected}`);
    console.log(`   📦 Raw (req.ip): ${clientInfo.ip_raw}`);
    console.log(`   🔀 X-Forwarded-For: ${clientInfo.ip_forwarded_for || 'Not set'}`);
    console.log(`   🔗 X-Real-IP: ${clientInfo.ip_real || 'Not set'}`);
    console.log(`   🔌 Socket: ${clientInfo.ip_socket || 'Not set'}`);
    console.log(`\n� LOCATION:`);
    console.log(`   Country: ${clientInfo.country || 'Unknown'}`);
    console.log(`   City: ${clientInfo.city || 'Unknown'}`);
    console.log(`\n💻 CLIENT:`);
    console.log(`   Browser: ${clientInfo.browser}`);
    console.log(`   Platform: ${clientInfo.platform}`);
    console.log(`   User Agent: ${clientInfo.user_agent || 'Not provided'}`);
    console.log(`\n📄 REQUEST:`);
    console.log(`   Method: ${req.method}`);
    console.log(`   URL: ${req.url}`);
    console.log(`   Referer: ${clientInfo.referer || 'Direct access'}`);
    console.log(`   Language: ${clientInfo.accept_language || 'Not specified'}`);
    console.log(`\n✅ AUTHORIZATION: ${clientInfo.is_authorized ? '✅ YES - ACCESS GRANTED' : '❌ NO - ACCESS DENIED'}`);
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

