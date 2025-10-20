import rateLimit from 'express-rate-limit';

/**
 * Rate limiters para diferentes tipos de operações
 * Protege contra ataques de força bruta e abuse
 */

// Rate limiter para verificação de OTP (mais restritivo)
export const otpVerificationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Máximo 5 tentativas por janela
    message: {
        success: false,
        error: 'Muitas tentativas de verificação. Tente novamente em 15 minutos.',
        retryAfter: 15
    },
    standardHeaders: true, // Retorna info no `RateLimit-*` headers
    legacyHeaders: false, // Desabilita `X-RateLimit-*` headers
    skip: (req) => {
        // Skip para IPs permitidos (opcional)
        return false;
    }
});

// Rate limiter para reenvio de código OTP
export const otpResendLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutos
    max: 3, // Máximo 3 reenvios por janela
    message: {
        success: false,
        error: 'Muitas solicitações de reenvio. Aguarde 10 minutos.',
        retryAfter: 10
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter para verificação de CPF
export const cpfCheckLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 10, // Máximo 10 verificações por janela
    message: {
        success: false,
        error: 'Muitas verificações de CPF. Tente novamente em alguns minutos.',
        retryAfter: 5
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter para registro de usuário
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // Máximo 3 registros por hora
    message: {
        success: false,
        error: 'Muitas tentativas de registro. Tente novamente em 1 hora.',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter para login
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Máximo 5 tentativas de login
    message: {
        success: false,
        error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
        retryAfter: 15
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter geral para rotas de autenticação
export const authGeneralLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Máximo 100 requisições por janela
    message: {
        success: false,
        error: 'Muitas requisições. Tente novamente mais tarde.',
        retryAfter: 15
    },
    standardHeaders: true,
    legacyHeaders: false
});
