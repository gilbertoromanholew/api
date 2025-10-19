/**
 * Middlewares de Autenticação
 */

import { getUserFromToken } from '../../config/supabase.js';
import { extractTokenFromHeader } from './authUtils.js';

/**
 * Middleware: Requer autenticação
 * Valida o token JWT e anexa o usuário ao request
 */
export async function requireAuth(req, res, next) {
    try {
        // Extrair token do header ou cookie
        const authHeader = req.headers.authorization;
        const cookieToken = req.cookies?.auth_token;
        
        const token = extractTokenFromHeader(authHeader) || cookieToken;
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de autenticação não fornecido'
            });
        }
        
        // Validar token
        const user = await getUserFromToken(token);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido ou expirado'
            });
        }
        
        // Anexar usuário ao request
        req.user = user;
        req.token = token;
        
        next();
    } catch (error) {
        console.error('Erro no middleware requireAuth:', error);
        return res.status(401).json({
            success: false,
            message: 'Erro ao validar autenticação'
        });
    }
}

/**
 * Middleware: Autenticação opcional
 * Tenta validar o token, mas não bloqueia se não existir
 */
export async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const cookieToken = req.cookies?.auth_token;
        
        const token = extractTokenFromHeader(authHeader) || cookieToken;
        
        if (token) {
            const user = await getUserFromToken(token);
            if (user) {
                req.user = user;
                req.token = token;
            }
        }
        
        next();
    } catch (error) {
        // Ignora erros e continua sem usuário
        next();
    }
}

/**
 * Middleware: Verificar se email está verificado
 */
export function requireVerifiedEmail(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Autenticação necessária'
        });
    }
    
    if (!req.user.email_confirmed_at) {
        return res.status(403).json({
            success: false,
            message: 'Email não verificado. Verifique sua caixa de entrada.'
        });
    }
    
    next();
}
