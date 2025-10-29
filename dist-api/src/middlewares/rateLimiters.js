/**
 * Rate Limiters para proteger a API contra abuso
 * 
 * Implementado na Fase 2 da Refatoração de Segurança
 * 
 * Estratégia:
 * - authLimiter: Protege contra brute force (login/register)
 * - apiLimiter: Protege contra DDoS (API geral)
 * - supabaseLimiter: Protege proxy Supabase
 * - registerLimiter: Protege contra spam de registros
 * 
 * IMPORTANTE: Rate limiting é feito por IP + User-Agent para evitar
 * bloqueio de proxies legítimos (Coolify, Nginx, etc)
 */

import rateLimit from 'express-rate-limit';
import { logRateLimitViolation } from '../services/auditService.js';

/**
 * Rate limiter para autenticação (login)
 * Protege contra brute force attacks
 * 
 * Limites:
 * - 5 tentativas por 15 minutos
 * - Key: IP + User-Agent (evita bloqueio de proxies)
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 tentativas
    message: {
        success: false,
        error: 'Too many authentication attempts',
        message: 'Você excedeu o limite de tentativas de login. Por favor, aguarde 15 minutos.',
        retryAfter: 15 * 60 // segundos
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    
    // Usar IP + User-Agent para evitar bloqueio de proxies
    keyGenerator: (req) => {
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'] || 'unknown';
        return `${ip}-${userAgent}`;
    },
    
    // Handler customizado para logging
    handler: (req, res) => {
        console.warn(`[Rate Limit] Auth limit exceeded - IP: ${req.ip}, User-Agent: ${req.headers['user-agent']}`);
        
        // Fase 3: Registrar violação no banco de dados
        logRateLimitViolation({
            ip: req.ip,
            userId: req.userId || req.user?.id || null,
            endpoint: req.path,
            limiterType: 'auth',
            attempts: 5,
            userAgent: req.headers['user-agent']
        }).catch(err => console.error('[Rate Limit] Failed to log violation:', err));
        
        res.status(429).json({
            success: false,
            error: 'Too many authentication attempts',
            message: 'Você excedeu o limite de tentativas de login. Por favor, aguarde 15 minutos.',
            retryAfter: 15 * 60
        });
    },
    
    // Skip rate limiting para IPs autorizados (admin via VPN)
    skip: (req) => {
        // Se estiver na VPN ZeroTier, não aplica rate limiting
        const ip = req.ip || req.connection.remoteAddress;
        if (ip && ip.startsWith('10.244.')) {
            return true;
        }
        return false;
    }
});

/**
 * Rate limiter para registro
 * Protege contra spam de registros
 * 
 * Limites:
 * - 3 registros por hora
 * - Key: IP (não user-agent, pois é mais restritivo)
 */
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // 3 registros
    message: {
        success: false,
        error: 'Too many registration attempts',
        message: 'Você excedeu o limite de registros. Por favor, aguarde 1 hora.',
        retryAfter: 60 * 60 // segundos
    },
    standardHeaders: true,
    legacyHeaders: false,
    
    // Apenas IP (mais restritivo)
    keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress;
    },
    
    handler: (req, res) => {
        console.warn(`[Rate Limit] Register limit exceeded - IP: ${req.ip}`);
        
        // Fase 3: Registrar violação
        logRateLimitViolation({
            ip: req.ip,
            userId: null,
            endpoint: req.path,
            limiterType: 'register',
            attempts: 3,
            userAgent: req.headers['user-agent']
        }).catch(err => console.error('[Rate Limit] Failed to log violation:', err));
        
        res.status(429).json({
            success: false,
            error: 'Too many registration attempts',
            message: 'Você excedeu o limite de registros por hora. Por favor, aguarde 1 hora.',
            retryAfter: 60 * 60
        });
    },
    
    skip: (req) => {
        const ip = req.ip || req.connection.remoteAddress;
        if (ip && ip.startsWith('10.244.')) {
            return true;
        }
        return false;
    }
});

/**
 * Rate limiter para reenvio de OTP
 * Protege contra spam de emails e abuso do serviço de email
 * 
 * Limites:
 * - 3 tentativas a cada 10 minutos
 * - Key: IP (mais restritivo que user-agent)
 */
export const resendOTPLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutos
    max: 3, // 3 tentativas
    message: {
        success: false,
        error: 'Muitas tentativas de reenvio',
        message: 'Você atingiu o limite de 3 reenvios em 10 minutos. Por segurança, aguarde antes de tentar novamente.',
        retryAfter: 10 * 60, // segundos
        hint: 'Verifique sua caixa de spam ou entre em contato com o suporte se não recebeu o código.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    
    // Apenas IP (previne spam de múltiplos dispositivos)
    keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress;
    },
    
    handler: (req, res) => {
        console.warn(`[Rate Limit] Resend OTP limit exceeded - IP: ${req.ip}`);
        
        // Calcular tempo restante
        const resetTime = new Date(Date.now() + 10 * 60 * 1000);
        const minutesRemaining = Math.ceil((resetTime - new Date()) / 60000);
        
        // Registrar violação no banco
        logRateLimitViolation({
            ip: req.ip,
            userId: req.body?.userId || null,
            endpoint: req.path,
            limiterType: 'resend-otp',
            attempts: 3,
            userAgent: req.headers['user-agent']
        }).catch(err => console.error('[Rate Limit] Failed to log violation:', err));
        
        res.status(429).json({
            success: false,
            error: 'Muitas tentativas de reenvio',
            message: `Aguarde um momento. Tente novamente mais tarde!`,
            hint: 'Verifique sua caixa de spam ou entre em contato com o suporte se não recebeu o código.',
            retryAfter: 10 * 60,
            waitMinutes: minutesRemaining
        });
    },
    
    skip: (req) => {
        // Skip para VPN ZeroTier
        const ip = req.ip || req.connection.remoteAddress;
        if (ip && ip.startsWith('10.244.')) {
            return true;
        }
        return false;
    }
});

/**
 * Rate limiter para API geral (rotas autenticadas)
 * Protege contra DDoS e abuso
 * 
 * Limites:
 * - 100 requisições por 15 minutos
 * - Key: User ID (se autenticado) OU IP (se não)
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requisições
    message: {
        success: false,
        error: 'Too many requests',
        message: 'Você excedeu o limite de requisições. Por favor, aguarde alguns minutos.',
        retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    
    // Rate limit por usuário (se autenticado) OU IP
    keyGenerator: (req) => {
        // Se tiver req.userId (setado pelo requireAuth), usar ele
        if (req.userId) {
            return `user-${req.userId}`;
        }
        // Se tiver req.user (setado pelo requireAuth), usar ele
        if (req.user && req.user.id) {
            return `user-${req.user.id}`;
        }
        // Se não, usar IP
        return req.ip || req.connection.remoteAddress;
    },
    
    handler: (req, res) => {
        const identifier = req.userId || req.user?.id || req.ip;
        console.warn(`[Rate Limit] API limit exceeded - Identifier: ${identifier}`);
        
        // Fase 3: Registrar violação
        logRateLimitViolation({
            ip: req.ip,
            userId: req.userId || req.user?.id || null,
            endpoint: req.path,
            limiterType: 'api',
            attempts: 100,
            userAgent: req.headers['user-agent']
        }).catch(err => console.error('[Rate Limit] Failed to log violation:', err));
        
        res.status(429).json({
            success: false,
            error: 'Too many requests',
            message: 'Você excedeu o limite de requisições. Por favor, aguarde alguns minutos.',
            retryAfter: 15 * 60
        });
    },
    
    skip: (req) => {
        const ip = req.ip || req.connection.remoteAddress;
        if (ip && ip.startsWith('10.244.')) {
            return true;
        }
        return false;
    }
});

/**
 * Rate limiter para proxy Supabase
 * Protege proxy reverso contra abuso
 * 
 * Limites:
 * - 10 requisições por minuto
 * - Key: IP + User-Agent
 */
export const supabaseLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 10, // 10 requisições
    message: {
        success: false,
        error: 'Too many Supabase requests',
        message: 'Você excedeu o limite de requisições para o Supabase. Por favor, aguarde 1 minuto.',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    
    keyGenerator: (req) => {
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'] || 'unknown';
        return `${ip}-${userAgent}`;
    },
    
    handler: (req, res) => {
        console.warn(`[Rate Limit] Supabase proxy limit exceeded - IP: ${req.ip}`);
        
        // Fase 3: Registrar violação
        logRateLimitViolation({
            ip: req.ip,
            userId: req.userId || req.user?.id || null,
            endpoint: req.path,
            limiterType: 'supabase',
            attempts: 10,
            userAgent: req.headers['user-agent']
        }).catch(err => console.error('[Rate Limit] Failed to log violation:', err));
        
        res.status(429).json({
            success: false,
            error: 'Too many Supabase requests',
            message: 'Você excedeu o limite de requisições para o Supabase. Por favor, aguarde 1 minuto.',
            retryAfter: 60
        });
    },
    
    skip: (req) => {
        const ip = req.ip || req.connection.remoteAddress;
        if (ip && ip.startsWith('10.244.')) {
            return true;
        }
        return false;
    }
});

/**
 * Rate limiter para rotas de ferramentas (execute)
 * Protege ferramentas pesadas contra abuso
 * 
 * Limites:
 * - 20 execuções por 15 minutos
 * - Key: User ID
 */
export const toolExecutionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 20, // 20 execuções
    message: {
        success: false,
        error: 'Too many tool executions',
        message: 'Você excedeu o limite de execuções de ferramentas. Por favor, aguarde alguns minutos.',
        retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    
    keyGenerator: (req) => {
        return req.userId || req.user?.id || req.ip;
    },
    
    handler: (req, res) => {
        const identifier = req.userId || req.user?.id || req.ip;
        console.warn(`[Rate Limit] Tool execution limit exceeded - User: ${identifier}, Tool: ${req.params.tool_name}`);
        
        // Fase 3: Registrar violação
        logRateLimitViolation({
            ip: req.ip,
            userId: req.userId || req.user?.id || null,
            endpoint: req.path,
            limiterType: 'tools',
            attempts: 20,
            userAgent: req.headers['user-agent'],
            metadata: { tool_name: req.params.tool_name }
        }).catch(err => console.error('[Rate Limit] Failed to log violation:', err));
        
        res.status(429).json({
            success: false,
            error: 'Too many tool executions',
            message: 'Você excedeu o limite de execuções de ferramentas. Por favor, aguarde alguns minutos.',
            retryAfter: 15 * 60
        });
    },
    
    skip: (req) => {
        const ip = req.ip || req.connection.remoteAddress;
        if (ip && ip.startsWith('10.244.')) {
            return true;
        }
        return false;
    }
});

/**
 * Rate limiter inteligente para rotas autenticadas
 * Mais permissivo para usuários PRO e autenticados
 * 
 * Estratégia:
 * - Usuários PRO: 500 req/15min (5x mais que padrão)
 * - Usuários autenticados comuns: 200 req/15min (2x mais que padrão)
 * - Usuários não autenticados: 100 req/15min (padrão)
 * - Key: User ID (se autenticado) OU IP
 */
export const smartApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    
    // Limite dinâmico baseado no tipo de usuário
    max: (req) => {
        // Usuários PRO têm limite maior
        if (req.user && req.user.role === 'pro') {
            return 500; // 5x mais permissivo
        }
        // Usuários autenticados têm limite intermediário
        if (req.userId || (req.user && req.user.id)) {
            return 200; // 2x mais permissivo
        }
        // Usuários não autenticados usam limite padrão
        return 100;
    },
    
    message: (req) => {
        const isPro = req.user && req.user.role === 'pro';
        const isAuthenticated = req.userId || (req.user && req.user.id);
        
        let limit, message;
        if (isPro) {
            limit = 500;
            message = 'Você excedeu o limite PRO de requisições. Por favor, aguarde alguns minutos.';
        } else if (isAuthenticated) {
            limit = 200;
            message = 'Você excedeu o limite de requisições. Por favor, aguarde alguns minutos.';
        } else {
            limit = 100;
            message = 'Você excedeu o limite de requisições. Por favor, aguarde alguns minutos.';
        }
        
        return {
            success: false,
            error: 'Too many requests',
            message,
            limit,
            retryAfter: 15 * 60,
            userType: isPro ? 'pro' : isAuthenticated ? 'authenticated' : 'anonymous'
        };
    },
    
    standardHeaders: true,
    legacyHeaders: false,
    
    // Rate limit por usuário (se autenticado) OU IP
    keyGenerator: (req) => {
        // Se tiver req.userId (setado pelo requireAuth), usar ele
        if (req.userId) {
            return `user-${req.userId}`;
        }
        // Se tiver req.user (setado pelo requireAuth), usar ele
        if (req.user && req.user.id) {
            return `user-${req.user.id}`;
        }
        // Se não, usar IP
        return req.ip || req.connection.remoteAddress;
    },
    
    handler: (req, res) => {
        const identifier = req.userId || req.user?.id || req.ip;
        const isPro = req.user && req.user.role === 'pro';
        const isAuthenticated = req.userId || (req.user && req.user.id);
        
        console.warn(`[Smart Rate Limit] API limit exceeded - Identifier: ${identifier}, Type: ${isPro ? 'PRO' : isAuthenticated ? 'AUTH' : 'ANON'}`);
        
        // Fase 3: Registrar violação
        logRateLimitViolation({
            ip: req.ip,
            userId: req.userId || req.user?.id || null,
            endpoint: req.path,
            limiterType: 'smart-api',
            attempts: isPro ? 500 : isAuthenticated ? 200 : 100,
            userAgent: req.headers['user-agent'],
            metadata: { userRole: req.user?.role || 'anonymous' }
        }).catch(err => console.error('[Rate Limit] Failed to log violation:', err));
        
        const limit = isPro ? 500 : isAuthenticated ? 200 : 100;
        const message = isPro 
            ? 'Você excedeu o limite PRO de requisições. Por favor, aguarde alguns minutos.'
            : 'Você excedeu o limite de requisições. Por favor, aguarde alguns minutos.';
        
        res.status(429).json({
            success: false,
            error: 'Too many requests',
            message,
            limit,
            retryAfter: 15 * 60,
            userType: isPro ? 'pro' : isAuthenticated ? 'authenticated' : 'anonymous'
        });
    },
    
    skip: (req) => {
        // Skip para VPN ZeroTier (sempre)
        const ip = req.ip || req.connection.remoteAddress;
        if (ip && ip.startsWith('10.244.')) {
            return true;
        }
        
        // Usuários PRO nunca são limitados (exceto pela VPN acima)
        if (req.user && req.user.role === 'pro') {
            return true;
        }
        
        return false;
    }
});

export default {
    authLimiter,
    registerLimiter,
    apiLimiter,
    supabaseLimiter,
    toolExecutionLimiter,
    smartApiLimiter
};
