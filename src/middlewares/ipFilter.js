import { allowedIPs } from '../config/allowedIPs.js';

// Middleware para bloquear requisições de IPs não autorizados
export const ipFilter = (req, res, next) => {
    if (!allowedIPs.includes(req.ip)) {
        return res.status(403).json({ error: 'Pare de tentar hackear! ;)' });
    }
    next();
};

