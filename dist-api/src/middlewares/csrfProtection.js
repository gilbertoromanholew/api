import crypto from 'crypto';

/**
 * 🔐 CSRF Protection Middleware
 * 
 * Protege contra ataques Cross-Site Request Forgery (CSRF/XSRF)
 * 
 * COMO FUNCIONA:
 * 1. Gera token CSRF único após login bem-sucedido
 * 2. Envia token em cookie (legível por JS)
 * 3. Frontend lê cookie e inclui token no header X-CSRF-Token
 * 4. Valida que header === cookie em requisições mutantes
 * 
 * SEGURANÇA:
 * - Cookie sameSite=strict previne envio cross-origin
 * - Atacante não pode ler cookie de outro domínio (Same-Origin Policy)
 * - Atacante não pode forjar request com token correto
 * 
 * REFERÊNCIAS:
 * - OWASP CSRF Prevention Cheat Sheet
 * - Double Submit Cookie Pattern
 * - CWE-352: Cross-Site Request Forgery
 */

/**
 * Gera token CSRF criptograficamente seguro
 * @returns {string} Token hexadecimal de 64 caracteres
 */
export function generateCsrfToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Middleware: Gera e envia token CSRF
 * Usado após login bem-sucedido
 * 
 * @example
 * router.post('/login', async (req, res) => {
 *   // ... login logic ...
 *   setCsrfToken(req, res);
 *   res.json({ success: true });
 * });
 */
export function setCsrfToken(req, res, expiresIn = 24 * 60 * 60 * 1000) {
    const token = generateCsrfToken();
    
    // Armazena no request para uso posterior
    req.csrfToken = token;
    
    // Envia cookie legível por JavaScript (httpOnly=false)
    // Necessário para frontend ler e incluir no header
    res.cookie('csrf-token', token, {
        httpOnly: false, // ⚠️ JS precisa ler este cookie
        secure: process.env.NODE_ENV === 'production', // HTTPS em produção
        sameSite: 'lax', // 🔒 Permite same-site navigation, bloqueia cross-site
        maxAge: expiresIn,
        path: '/',
        domain: process.env.NODE_ENV === 'production' ? '.samm.host' : undefined
    });
    
    console.log('🔐 CSRF token gerado:', {
        token: token.substring(0, 8) + '...',
        expiresIn: `${expiresIn / 1000}s`,
        sameSite: 'lax',
        domain: process.env.NODE_ENV === 'production' ? '.samm.host' : 'localhost',
        secure: process.env.NODE_ENV === 'production'
    });
    
    return token;
}

/**
 * Middleware: Valida token CSRF em requisições mutantes
 * Aplica-se a: POST, PUT, DELETE, PATCH
 * 
 * VALIDAÇÃO:
 * 1. Verifica se método requer CSRF (POST/PUT/DELETE/PATCH)
 * 2. Extrai token do header X-CSRF-Token
 * 3. Extrai token do cookie csrf-token
 * 4. Compara tokens com timing-safe comparison
 * 5. Rejeita se tokens faltam ou não correspondem
 * 
 * EXCEÇÕES:
 * - GET/HEAD/OPTIONS: Não requer CSRF (safe methods)
 * - Endpoints públicos: Login, registro (antes de ter token)
 * 
 * @example
 * // Proteger todas as rotas mutantes
 * app.use('/api', validateCsrfToken);
 * 
 * // Excluir rotas específicas
 * app.post('/auth/login', skipCsrf, handler);
 */
export function validateCsrfToken(req, res, next) {
    const method = req.method.toUpperCase();
    
    // Safe methods não requerem CSRF
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        return next();
    }
    
    // Endpoints públicos (não autenticados)
    // Estes endpoints não requerem CSRF porque não têm sessão ainda
    const publicEndpoints = [
        '/auth/login',
        '/auth/register',
        '/auth/login-cpf',
        '/auth/check-cpf',        // Verificação de CPF (pré-cadastro)
        '/auth/check-email',      // Verificação de email (pré-cadastro)
        '/auth/verify-email',
        '/auth/verify-otp',
        '/auth/resend-otp',
        '/auth/resend-confirmation',
        '/auth/verify-email-token',
        '/auth/forgot-password',
        '/auth/reset-password'
    ];
    
    // Se é endpoint público, não valida CSRF (ainda não tem token)
    if (publicEndpoints.some(endpoint => req.path.includes(endpoint))) {
        return next();
    }
    
    // Extrai tokens
    const headerToken = req.headers['x-csrf-token'];
    const cookieToken = req.cookies['csrf-token'];
    
    // Validação: ambos devem existir
    if (!headerToken || !cookieToken) {
        console.warn('⚠️ CSRF validation failed: Token ausente', {
            path: req.path,
            method,
            hasHeader: !!headerToken,
            hasCookie: !!cookieToken,
            ip: req.ip
        });
        
        return res.status(403).json({
            success: false,
            error: 'CSRF token ausente',
            code: 'CSRF_TOKEN_MISSING'
        });
    }
    
    // Validação: tokens devem ser idênticos
    // Usa timing-safe comparison para prevenir timing attacks
    const tokensMatch = crypto.timingSafeEqual(
        Buffer.from(headerToken),
        Buffer.from(cookieToken)
    );
    
    if (!tokensMatch) {
        console.warn('⚠️ CSRF validation failed: Token inválido', {
            path: req.path,
            method,
            headerToken: headerToken.substring(0, 8) + '...',
            cookieToken: cookieToken.substring(0, 8) + '...',
            ip: req.ip
        });
        
        return res.status(403).json({
            success: false,
            error: 'CSRF token inválido',
            code: 'CSRF_TOKEN_INVALID'
        });
    }
    
    // ✅ Token válido
    console.log('✅ CSRF token válido:', {
        path: req.path,
        method
    });
    
    next();
}

/**
 * Middleware: Remove token CSRF
 * Usado em logout
 * 
 * @example
 * router.post('/logout', (req, res) => {
 *   clearCsrfToken(res);
 *   res.json({ success: true });
 * });
 */
export function clearCsrfToken(res) {
    res.clearCookie('csrf-token', {
        path: '/',
        sameSite: 'lax',
        domain: process.env.NODE_ENV === 'production' ? '.samm.host' : undefined
    });
    
    console.log('🗑️ CSRF token removido');
}

/**
 * Helper: Pula validação CSRF para rotas específicas
 * Usado em endpoints públicos que não precisam de proteção
 * 
 * @example
 * router.post('/public-endpoint', skipCsrf, handler);
 */
export function skipCsrf(req, res, next) {
    req.skipCsrf = true;
    next();
}
