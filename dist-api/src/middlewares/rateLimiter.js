import rateLimit from 'express-rate-limit';

/**
 * Rate limiters para diferentes tipos de operações
 * Protege contra ataques de força bruta e abuse
 */

// Rate limiter para verificação de OTP (balanceado)
export const otpVerificationLimiter = rateLimit({
    windowMs: 20 * 60 * 1000, // 20 minutos (era 15)
    max: 10, // Máximo 10 tentativas (era 5) - código tem 6 dígitos, pode errar
    message: {
        success: false,
        error: 'Por segurança, bloqueamos temporariamente as tentativas de verificação. Aguarde alguns minutos ou solicite um novo código.',
        retryAfter: 20
    },
    standardHeaders: true, // Retorna info no `RateLimit-*` headers
    legacyHeaders: false, // Desabilita `X-RateLimit-*` headers
    skipSuccessfulRequests: true, // Zera contador em tentativa bem-sucedida
    skip: (req) => {
        // Skip para IPs permitidos (opcional)
        return false;
    }
});

// Rate limiter para reenvio de código OTP
export const otpResendLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos (era 10)
    max: 5, // Máximo 5 reenvios (era 3) - mais flexível
    message: {
        success: false,
        error: 'Já enviamos vários códigos recentemente. Verifique sua caixa de entrada e spam antes de solicitar outro.',
        retryAfter: 15
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter para verificação de CPF
export const cpfCheckLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutos (era 5)
    max: 20, // Máximo 20 verificações (era 10) - operação leve, pode ser mais permissivo
    message: {
        success: false,
        error: 'Você está consultando CPFs com muita frequência. Aguarde alguns instantes e tente novamente.',
        retryAfter: 10
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter para registro de usuário
export const registerLimiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutos (era 1 hora)
    max: 5, // Máximo 5 registros (era 3) - mais tentativas para usuários legítimos
    message: {
        success: false,
        error: 'Muitas tentativas de cadastro. Aguarde alguns minutos ou entre em contato com o suporte se estiver enfrentando dificuldades.',
        retryAfter: 30
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter para login (balanceado para prevenir DoS contra usuário legítimo)
export const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutos (era 15)
    max: 10, // Máximo 10 tentativas (era 5) - usuário pode errar senha
    message: {
        success: false,
        error: 'Por segurança, bloqueamos temporariamente o acesso. Aguarde alguns minutos ou recupere sua senha.',
        retryAfter: 10
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // ✅ Zera contador quando login bem-sucedido
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Por segurança, bloqueamos temporariamente o acesso. Aguarde alguns minutos ou recupere sua senha.',
            retryAfter: 10,
            statusCode: 429
        });
    }
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
