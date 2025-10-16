import { allowedIPs } from '../config/allowedIPs.js';

// Middleware para bloquear requisições de IPs não autorizados
export const ipFilter = (req, res, next) => {
    // Pega o IP real considerando proxies/CDN
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                     req.headers['x-real-ip'] || 
                     req.ip;
    
    // Log temporário para debug
    console.log('🔍 DEBUG IP Filter:');
    console.log('   Cliente IP:', clientIp);
    console.log('   IPs Permitidos:', allowedIPs);
    console.log('   Autorizado?', allowedIPs.includes(clientIp));
    
    if (!allowedIPs.includes(clientIp)) {
        return res.status(403).json({ 
            error: 'Hackers are not allowed here. Please go away ;)',
            debug: { your_ip: clientIp, allowed: allowedIPs }  // Temporário
        });
    }
    next();
};

