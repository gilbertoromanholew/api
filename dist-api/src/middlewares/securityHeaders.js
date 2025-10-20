/**
 * Middleware de Security Headers
 * Implementa Content-Security-Policy e outros headers de segurança
 * para proteger contra XSS, clickjacking, MIME sniffing, etc.
 * 
 * Vulnerabilidade #7 (LGPD/Security Audit)
 */

/**
 * Content Security Policy (CSP)
 * Previne XSS e outros ataques de injeção
 */
export function contentSecurityPolicy(req, res, next) {
    const cspDirectives = [
        // Script sources
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
        
        // Style sources
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
        
        // Font sources
        "font-src 'self' https://fonts.gstatic.com data:",
        
        // Image sources
        "img-src 'self' data: https: http:",
        
        // Connect sources (APIs)
        "connect-src 'self' https://mpanel.samm.host https://api.samm.host",
        
        // Frame sources (iframes)
        "frame-src 'self'",
        
        // Object sources (Flash, etc)
        "object-src 'none'",
        
        // Base URI
        "base-uri 'self'",
        
        // Form action
        "form-action 'self'",
        
        // Frame ancestors (clickjacking protection)
        "frame-ancestors 'self'",
        
        // Upgrade insecure requests
        "upgrade-insecure-requests"
    ];

    res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
    next();
}

/**
 * X-Content-Type-Options
 * Previne MIME sniffing attacks
 */
export function noSniff(req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
}

/**
 * X-Frame-Options
 * Previne clickjacking attacks
 */
export function frameOptions(req, res, next) {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
}

/**
 * X-XSS-Protection
 * Ativa proteção XSS do browser (legacy support)
 */
export function xssProtection(req, res, next) {
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
}

/**
 * Strict-Transport-Security (HSTS)
 * Force HTTPS por 1 ano
 */
export function strictTransportSecurity(req, res, next) {
    // Só ativa HSTS em produção e HTTPS
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    next();
}

/**
 * Referrer-Policy
 * Controla quanto de informação de referrer é enviada
 */
export function referrerPolicy(req, res, next) {
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
}

/**
 * Permissions-Policy (Feature-Policy)
 * Controla acesso a features do browser
 */
export function permissionsPolicy(req, res, next) {
    const policies = [
        'geolocation=(self)',
        'microphone=()',
        'camera=()',
        'payment=()',
        'usb=()',
        'magnetometer=()',
        'gyroscope=()',
        'accelerometer=()'
    ];
    
    res.setHeader('Permissions-Policy', policies.join(', '));
    next();
}

/**
 * Remove headers sensíveis que expõem tecnologia
 */
export function removeServerHeaders(req, res, next) {
    res.removeHeader('X-Powered-By');
    next();
}

/**
 * Middleware composto que aplica todos os security headers
 * Use este para aplicar todas as proteções de uma vez
 */
export function securityHeaders(req, res, next) {
    // Remove headers sensíveis primeiro
    res.removeHeader('X-Powered-By');
    
    // CSP
    const cspDirectives = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: https: http:",
        "connect-src 'self' https://mpanel.samm.host https://api.samm.host",
        "frame-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'self'",
        "upgrade-insecure-requests"
    ];
    res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
    
    // Anti-MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Anti-clickjacking
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    
    // XSS Protection (legacy)
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // HSTS (só em produção)
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions Policy
    const policies = [
        'geolocation=(self)',
        'microphone=()',
        'camera=()',
        'payment=()',
        'usb=()',
        'magnetometer=()',
        'gyroscope=()',
        'accelerometer=()'
    ];
    res.setHeader('Permissions-Policy', policies.join(', '));
    
    next();
}

export default securityHeaders;
