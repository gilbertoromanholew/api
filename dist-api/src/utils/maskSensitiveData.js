/**
 * 🔒 MASK SENSITIVE DATA - LGPD Compliance
 * 
 * Utilitários para mascarar dados sensíveis em logs
 * Previne vazamento de CPF, email, OTP e outros dados pessoais
 * 
 * LGPD Art. 46: Segurança dos dados pessoais
 */

/**
 * Máscara CPF para logs (LGPD compliance)
 * @param {string} cpf - CPF com ou sem formatação
 * @returns {string} CPF mascarado: ***.***.789-**
 * 
 * @example
 * maskCPF('12345678901') // '***.***.789-**'
 * maskCPF('123.456.789-01') // '***.***.789-**'
 */
export function maskCPF(cpf) {
    if (!cpf) return 'N/A';
    const clean = cpf.toString().replace(/\D/g, '');
    if (clean.length !== 11) return 'INVÁLIDO';
    return `***.***.${clean.substring(6, 9)}-**`;
}

/**
 * Máscara email para logs
 * @param {string} email
 * @returns {string} Email mascarado: u***@example.com
 * 
 * @example
 * maskEmail('user@example.com') // 'u***@example.com'
 */
export function maskEmail(email) {
    if (!email) return 'N/A';
    const [local, domain] = email.split('@');
    if (!domain) return 'INVÁLIDO';
    const maskedLocal = local.charAt(0) + '***';
    return `${maskedLocal}@${domain}`;
}

/**
 * Máscara OTP/código de verificação para logs
 * @param {string|number} otp - Código OTP
 * @returns {string} OTP mascarado: 12****
 * 
 * @example
 * maskOTP('123456') // '12****'
 * maskOTP(123456) // '12****'
 */
export function maskOTP(otp) {
    if (!otp) return 'N/A';
    const otpStr = otp.toString();
    if (otpStr.length < 4) return '****';
    return `${otpStr.substring(0, 2)}****`;
}

/**
 * Máscara IP (mantém apenas 2 primeiros octetos)
 * @param {string} ip
 * @returns {string} IP mascarado: 192.168.*.*
 * 
 * @example
 * maskIP('192.168.1.100') // '192.168.*.*'
 */
export function maskIP(ip) {
    if (!ip) return 'N/A';
    const parts = ip.split('.');
    if (parts.length !== 4) return ip; // IPv6 ou formato inválido
    return `${parts[0]}.${parts[1]}.*.*`;
}

/**
 * Log seguro para produção
 * Remove automaticamente dados sensíveis
 * 
 * @param {string} message - Mensagem do log
 * @param {object} data - Dados a serem logados
 * 
 * @example
 * secureLog('[Auth] Login', { cpf: '12345678901', email: 'user@example.com', otp: '123456' });
 * // Produção: '[Auth] Login { cpf: '***.***.789-**', email: 'u***@example.com', otp: 'HIDDEN' }'
 * // Dev: '[Auth] Login { cpf: '***.***.789-**', email: 'u***@example.com', otp: '12****' }'
 */
export function secureLog(message, data = {}) {
    const sanitized = { ...data };
    
    // Mascarar CPF
    if (sanitized.cpf) {
        sanitized.cpf = maskCPF(sanitized.cpf);
    }
    
    // Mascarar email
    if (sanitized.email) {
        sanitized.email = maskEmail(sanitized.email);
    }
    
    // Mascarar IP
    if (sanitized.ip) {
        sanitized.ip = maskIP(sanitized.ip);
    }
    
    // OTP/Código
    if (process.env.NODE_ENV === 'production') {
        // Produção: NUNCA mostrar OTP
        if (sanitized.otp) sanitized.otp = 'HIDDEN';
        if (sanitized.code) sanitized.code = 'HIDDEN';
        if (sanitized.otpCode) sanitized.otpCode = 'HIDDEN';
    } else {
        // Dev: Mostrar apenas 2 dígitos
        if (sanitized.otp) sanitized.otp = maskOTP(sanitized.otp);
        if (sanitized.code) sanitized.code = maskOTP(sanitized.code);
        if (sanitized.otpCode) sanitized.otpCode = maskOTP(sanitized.otpCode);
    }
    
    // Senha: NUNCA mostrar
    if (sanitized.password) sanitized.password = '***';
    if (sanitized.newPassword) sanitized.newPassword = '***';
    if (sanitized.oldPassword) sanitized.oldPassword = '***';
    
    // Tokens: NUNCA mostrar completos
    if (sanitized.token) {
        sanitized.token = typeof sanitized.token === 'string' && sanitized.token.length > 8
            ? sanitized.token.substring(0, 8) + '...'
            : '***';
    }
    if (sanitized.accessToken) sanitized.accessToken = '***';
    if (sanitized.refreshToken) sanitized.refreshToken = '***';
    if (sanitized.csrfToken) sanitized.csrfToken = '***';
    
    console.log(message, sanitized);
}

/**
 * Sanitizar objeto recursivamente
 * Remove dados sensíveis de objetos aninhados
 * 
 * @param {object} obj
 * @returns {object} Objeto sanitizado
 */
export function sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = Array.isArray(obj) ? [] : {};
    
    for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        
        // CPF
        if (lowerKey.includes('cpf') && typeof value === 'string') {
            sanitized[key] = maskCPF(value);
        }
        // Email
        else if (lowerKey.includes('email') && typeof value === 'string') {
            sanitized[key] = maskEmail(value);
        }
        // OTP/Code
        else if ((lowerKey.includes('otp') || lowerKey.includes('code')) && value) {
            sanitized[key] = process.env.NODE_ENV === 'production' ? 'HIDDEN' : maskOTP(value);
        }
        // Password
        else if (lowerKey.includes('password') || lowerKey.includes('senha')) {
            sanitized[key] = '***';
        }
        // Token
        else if (lowerKey.includes('token')) {
            sanitized[key] = '***';
        }
        // Recursão para objetos aninhados
        else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
        }
        // Outros valores: manter
        else {
            sanitized[key] = value;
        }
    }
    
    return sanitized;
}

/**
 * Log de erro seguro
 * @param {string} message
 * @param {Error} error
 * @param {object} context - Contexto adicional
 */
export function secureErrorLog(message, error, context = {}) {
    const sanitizedContext = sanitizeObject(context);
    
    console.error(message, {
        error: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
        ...sanitizedContext
    });
}

export default {
    maskCPF,
    maskEmail,
    maskOTP,
    maskIP,
    secureLog,
    sanitizeObject,
    secureErrorLog
};
