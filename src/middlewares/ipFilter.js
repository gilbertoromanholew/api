import { allowedIPs } from '../config/allowedIPs.js';

// Middleware para bloquear requisições de IPs não autorizados
export const ipFilter = (req, res, next) => {
    // Log temporário para debug - remover depois
    console.log('🔍 IP detectado:', req.ip);
    console.log('📋 IPs permitidos:', allowedIPs);
    console.log('🌐 Headers:', req.headers['x-forwarded-for'], req.headers['x-real-ip']);
    
    if (!allowedIPs.includes(req.ip)) {
        return res.status(403).json({ 
            error: 'Amigo(a), pare de tentar hackear! Grato! ;)',
            debug_ip: req.ip  // Temporário para debug
        });
    }
    next();
};

