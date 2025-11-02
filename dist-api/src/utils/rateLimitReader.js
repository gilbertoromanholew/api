/**
 * ========================================
 * RATE LIMIT READER - DINÂMICO
 * ========================================
 * Extrai informações REAIS dos rate limiters configurados
 * ao invés de valores hardcoded na documentação
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Lê o arquivo rateLimiters.js e extrai as configurações reais
 */
export function getRateLimitConfigs() {
    try {
        const rateLimiterPath = path.join(__dirname, '../middlewares/rateLimiters.js');
        const content = fs.readFileSync(rateLimiterPath, 'utf-8');

        const limiters = [];

        // Regex para extrair configuração de cada limiter
        const limiterRegex = /export const (\w+) = rateLimit\(\{[\s\S]*?windowMs:\s*([^,]+),[\s\S]*?max:\s*(\d+)/g;
        
        let match;
        while ((match = limiterRegex.exec(content)) !== null) {
            const [, name, windowMsExpr, max] = match;
            
            // Calcular windowMs (pode ser expressão como "15 * 60 * 1000")
            let windowMs;
            try {
                windowMs = eval(windowMsExpr.trim());
            } catch (e) {
                windowMs = parseInt(windowMsExpr);
            }

            // Converter para texto legível
            const windowMinutes = windowMs / (60 * 1000);
            let windowText;
            if (windowMinutes >= 60) {
                const hours = windowMinutes / 60;
                windowText = hours === 1 ? '1 hora' : `${hours} horas`;
            } else {
                windowText = windowMinutes === 1 ? '1 minuto' : `${windowMinutes} minutos`;
            }

            // Determinar descrição e paths baseado no nome
            let description, appliesTo;
            switch (name) {
                case 'authLimiter':
                    description = 'Login/Autenticação';
                    appliesTo = ['/api/auth/login', '/api/auth/login-cpf'];
                    break;
                case 'registerLimiter':
                    description = 'Registro de usuários';
                    appliesTo = ['/api/auth/register'];
                    break;
                case 'resendOTPLimiter':
                    description = 'Reenvio de código OTP';
                    appliesTo = ['/api/auth/resend-otp'];
                    break;
                case 'apiLimiter':
                    description = 'API Geral (rotas autenticadas)';
                    appliesTo = ['Rotas com requireAuth (exceto /api/credits/*)'];
                    break;
                case 'supabaseLimiter':
                    description = 'Proxy Supabase';
                    appliesTo = ['/api/supabase/*'];
                    break;
                default:
                    description = name;
                    appliesTo = ['Não documentado'];
            }

            limiters.push({
                name,
                description,
                limit: `${max} requisições`,
                window: windowText,
                maxRequests: parseInt(max),
                windowMs,
                appliesTo
            });
        }

        // Adicionar endpoints SEM rate limit (créditos)
        limiters.push({
            name: 'NENHUM',
            description: 'Créditos (sem limite)',
            limit: 'Ilimitado',
            window: 'N/A',
            maxRequests: null,
            windowMs: null,
            appliesTo: ['/api/credits/balance', '/api/credits/consume', '/api/credits/history'],
            note: 'Sem rate limit pois RLS garante que usuário só acessa seus próprios dados'
        });

        return limiters;
    } catch (error) {
        console.error('Erro ao ler configurações de rate limit:', error);
        return [];
    }
}

/**
 * Mapeia qual rate limiter se aplica a cada endpoint
 */
export function getRateLimitForEndpoint(path, method) {
    // Endpoints de autenticação
    if (path === '/api/auth/login' || path === '/api/auth/login-cpf') {
        const limiters = getRateLimitConfigs();
        const authLimiter = limiters.find(l => l.name === 'authLimiter');
        if (authLimiter) {
            return `${authLimiter.maxRequests} req / ${authLimiter.window}`;
        }
        return null;
    }

    if (path === '/api/auth/register') {
        const limiters = getRateLimitConfigs();
        const registerLimiter = limiters.find(l => l.name === 'registerLimiter');
        if (registerLimiter) {
            return `${registerLimiter.maxRequests} req / ${registerLimiter.window}`;
        }
        return null;
    }

    if (path === '/api/auth/resend-otp') {
        const limiters = getRateLimitConfigs();
        const resendLimiter = limiters.find(l => l.name === 'resendOTPLimiter');
        if (resendLimiter) {
            return `${resendLimiter.maxRequests} req / ${resendLimiter.window}`;
        }
        return null;
    }

    // Endpoints de créditos SEM rate limit
    if (path.startsWith('/api/credits/')) {
        return 'Ilimitado';
    }

    // Endpoints de supabase
    if (path.startsWith('/api/supabase/')) {
        const limiters = getRateLimitConfigs();
        const supabaseLimiter = limiters.find(l => l.name === 'supabaseLimiter');
        if (supabaseLimiter) {
            return `${supabaseLimiter.maxRequests} req / ${supabaseLimiter.window}`;
        }
        return null;
    }

    // Rotas autenticadas gerais (apiLimiter)
    const limiters = getRateLimitConfigs();
    const apiLimiter = limiters.find(l => l.name === 'apiLimiter');
    if (apiLimiter) {
        return `${apiLimiter.maxRequests} req / ${apiLimiter.window}`;
    }

    return null;
}
