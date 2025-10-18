/**
 * Middleware de Controle de Acesso por Níveis
 * 
 * Hierarquia:
 * - ADMIN: IPs permanentes (localhost, ZeroTier)
 * - TRUSTED: IPs do .env (ALLOWED_IPS)
 * - GUEST: IPs autorizados temporariamente via /logs
 * - UNAUTHORIZED: Todos os outros (bloqueados)
 */

import { allowedIPs } from '../config/allowedIPs.js';
import { isIPInRange } from '../utils/ipUtils.js';

// IPs permanentes (Admin)
const permanentIPs = [
    '127.0.0.1',
    '::1',
    '10.244.0.0/16'  // ZeroTier
];

/**
 * Determinar o nível de acesso de um IP
 */
export async function getIPAccessLevel(ip) {
    // Carregar configurações dinamicamente
    const { getAllowedIPsList, getDynamicIPLevel } = await import('../config/allowedIPs.js');
    const ipList = getAllowedIPsList();
    
    // Admin: IPs permanentes (suporte a CIDR)
    if (ipList.permanent.some(allowedIP => isIPInRange(ip, allowedIP))) {
        return 'admin';
    }
    
    // Trusted: IPs do .env (suporte a CIDR) OU IPs dinâmicos com nível 'trusted'
    if (ipList.fromEnv.some(allowedIP => isIPInRange(ip, allowedIP))) {
        return 'trusted';
    }
    
    // Verificar se é IP dinâmico e obter seu nível
    const dynamicLevel = getDynamicIPLevel(ip);
    if (dynamicLevel) {
        return dynamicLevel; // 'guest' ou 'trusted'
    }
    
    return 'unauthorized';
}

/**
 * Verificar se IP pode acessar uma rota específica
 */
export async function canAccessRoute(ip, method, path) {
    const level = await getIPAccessLevel(ip);
    
    // Admin: acesso total
    if (level === 'admin') {
        return { allowed: true, level: 'admin' };
    }
    
    // Trusted: não pode acessar /logs e /api/security
    if (level === 'trusted') {
        if (path.startsWith('/logs')) {
            return { 
                allowed: false, 
                level: 'trusted', 
                reason: 'Route restricted to admin only' 
            };
        }
        if (path.startsWith('/api/security')) {
            return { 
                allowed: false, 
                level: 'trusted', 
                reason: 'Security management restricted to admin only' 
            };
        }
        return { allowed: true, level: 'trusted' };
    }
    
    // Guest: /docs + endpoints das funções disponíveis (exceto _TEMPLATE)
    if (level === 'guest') {
        const allowedPaths = ['/', '/docs', '/health', '/api/functions'];
        
        // Permitir caminhos básicos
        if (allowedPaths.includes(path) || path === '/') {
            return { allowed: true, level: 'guest' };
        }
        
        // Permitir endpoints de funções (exceto _TEMPLATE)
        if (path.startsWith('/api/') && !path.startsWith('/api/security') && !path.startsWith('/api/logs')) {
            // Verificar se não é _TEMPLATE
            if (!path.includes('/_TEMPLATE/') && !path.includes('/template')) {
                return { allowed: true, level: 'guest' };
            }
        }
        
        return { 
            allowed: false, 
            level: 'guest', 
            reason: 'Guest access limited to documentation and function endpoints' 
        };
    }
    
    return { 
        allowed: false, 
        level: 'unauthorized', 
        reason: 'IP not authorized' 
    };
}

/**
 * Middleware: Requer acesso de ADMIN
 */
export async function requireAdmin(req, res, next) {
    const ip = req.ip_detected || req.ip;
    const level = await getIPAccessLevel(ip);
    
    if (level === 'admin') {
        req.accessLevel = 'admin';
        return next();
    }
    
    // Log de tentativa negada
    console.warn(`🚫 Access denied to ${req.path} for IP ${ip} (level: ${level})`);
    
    return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '🚫 Admin access required. This resource is restricted to administrators only.',
        accessLevel: level,
        yourIP: ip
    });
}

/**
 * Middleware: Requer acesso TRUSTED ou superior
 */
export async function requireTrusted(req, res, next) {
    const ip = req.ip_detected || req.ip;
    const level = await getIPAccessLevel(ip);
    
    if (level === 'admin' || level === 'trusted') {
        req.accessLevel = level;
        return next();
    }
    
    // Log de tentativa negada
    console.warn(`🚫 Access denied to ${req.path} for IP ${ip} (level: ${level})`);
    
    return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '🚫 Trusted access required. This resource is restricted.',
        accessLevel: level,
        yourIP: ip
    });
}

/**
 * Middleware: Validar acesso por rota
 */
export async function validateRouteAccess(req, res, next) {
    const ip = req.ip_detected || req.ip;
    const method = req.method;
    const path = req.path;
    
    const access = await canAccessRoute(ip, method, path);
    
    if (access.allowed) {
        req.accessLevel = access.level;
        return next();
    }
    
    // Log de tentativa negada
    console.warn(`🚫 Access denied: ${method} ${path} for IP ${ip} (level: ${access.level})`);
    
    return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `🚫 ${access.reason}`,
        accessLevel: access.level,
        yourIP: ip,
        requestedPath: path
    });
}

/**
 * Middleware: Registrar tentativas de acesso negadas
 */
const violationTracker = new Map();  // IP -> { count, lastAttempt }

export async function trackViolations(req, res, next) {
    // Só rastrear se for erro 403
    const originalJson = res.json.bind(res);
    
    res.json = async function(data) {
        if (res.statusCode === 403 && !data.success) {
            const ip = req.ip_detected || req.ip;
            const level = await getIPAccessLevel(ip);
            
            // Não rastrear admins
            if (level === 'admin') {
                return originalJson(data);
            }
            
            // Incrementar violações
            const violations = violationTracker.get(ip) || { count: 0, lastAttempt: null };
            violations.count++;
            violations.lastAttempt = new Date().toISOString();
            violationTracker.set(ip, violations);
            
            console.warn(`⚠️ Violation tracked for ${ip}: ${violations.count} attempts`);
            
            // Se guest com 3+ violações, desautorizar
            if (level === 'guest' && violations.count >= 3) {
                console.error(`🚨 IP ${ip} exceeded violation limit (3). Removing authorization.`);
                
                // Remover autorização
                import('../config/allowedIPs.js').then(module => {
                    module.removeAllowedIP(ip);
                });
                
                data.message += ' Your authorization has been revoked due to multiple violations.';
                violationTracker.delete(ip);
            }
        }
        
        return originalJson(data);
    };
    
    next();
}

/**
 * Obter estatísticas de violações
 */
export async function getViolationStats() {
    const stats = [];
    
    for (const [ip, violations] of violationTracker.entries()) {
        stats.push({
            ip,
            violations: violations.count,
            lastAttempt: violations.lastAttempt,
            level: await getIPAccessLevel(ip)
        });
    }
    
    return stats;
}
