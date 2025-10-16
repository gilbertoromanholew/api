import { allowedIPs } from '../config/allowedIPs.js';

// Middleware para bloquear requisições de IPs não autorizados
export const ipFilter = (req, res, next) => {
    // Pega o IP real considerando proxies/CDN
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                     req.headers['x-real-ip'] || 
                     req.ip;
    
    // Log temporário para debug - remover depois
    console.log('🔍 IP original (req.ip):', req.ip);
    console.log('🌐 IP do cliente (via headers):', clientIp);
    console.log('📋 IPs permitidos:', allowedIPs);
    console.log('✅ Autorizado?', allowedIPs.includes(clientIp));
    
    if (!allowedIPs.includes(clientIp)) {
        return res.status(403).json({ 
            error: 'Amigo(a), pare de tentar hackear! Grato! ;)',
            debug_info: {
                seu_ip: clientIp,
                req_ip: req.ip,
                x_forwarded: req.headers['x-forwarded-for'],
                x_real_ip: req.headers['x-real-ip']
            }
        });
    }
    next();
};

