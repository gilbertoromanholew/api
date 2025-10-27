/**
 * MIDDLEWARE DE AUTENTICAÇÃO ADMIN - FASE 3
 * 
 * Protege endpoints administrativos verificando se o usuário tem role de admin.
 * 
 * ESTRATÉGIA:
 * - Verifica sessão ativa do usuário
 * - Consulta role do usuário no banco (profiles.role)
 * - Bloqueia acesso se não for admin
 * - Retorna 401 (não autenticado) ou 403 (não autorizado)
 */

import { createClient } from '@supabase/supabase-js';
import logger from '../config/logger.js';

// Cliente Supabase
const supabaseUrl = process.env.SUPABASE_INTERNAL_URL || process.env.SUPABASE_URL || 'http://supabase-kong:8000';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Middleware: Verifica se usuário está autenticado
 */
export async function requireAuth(req, res, next) {
    try {
        // Extrair token da sessão/cookie
        const sessionCookie = req.cookies?.['sb-access-token'];
        
        if (!sessionCookie) {
            return res.status(401).json({
                success: false,
                error: 'Não autenticado',
                message: 'Você precisa estar logado para acessar este recurso.'
            });
        }

        // Validar token com Supabase
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(sessionCookie);
        
        if (error || !user) {
            return res.status(401).json({
                success: false,
                error: 'Sessão inválida',
                message: 'Sua sessão expirou. Faça login novamente.'
            });
        }

        // ✅ SEGURANÇA: Adicionar usuário E token ao request
        req.user = {
            ...user,
            id: user.id,
            token: sessionCookie // JWT para usar com RLS
        };
        next();
    } catch (error) {
        logger.error('Erro ao verificar autenticação', { error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Erro ao verificar autenticação',
            message: error.message
        });
    }
}

/**
 * Middleware: Verifica se usuário é admin
 * DEVE ser usado APÓS requireAuth
 */
export async function requireAdmin(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Não autenticado',
                message: 'Use o middleware requireAuth antes de requireAdmin.'
            });
        }

        // Buscar perfil do usuário no banco
        const { data: profile, error } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', req.user.id)
            .single();

        if (error) {
            logger.error('Erro ao buscar perfil do usuário', { userId: req.user.id, error: error.message });
            return res.status(500).json({
                success: false,
                error: 'Erro ao verificar permissões',
                message: error.message
            });
        }

        // Verificar se é admin
        if (profile.role !== 'admin') {
            logger.warn('Acesso negado - usuário não é admin', { userId: req.user.id, role: profile.role });
            return res.status(403).json({
                success: false,
                error: 'Acesso negado',
                message: 'Você não tem permissão para acessar este recurso. Apenas administradores.'
            });
        }

        // Adicionar role ao request
        req.user.role = profile.role;
        logger.auth('Admin autenticado', { userId: req.user.id });
        next();
    } catch (error) {
        logger.error('Erro ao verificar role de admin', { error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Erro ao verificar permissões',
            message: error.message
        });
    }
}

/**
 * Middleware combinado: Auth + Admin em um só
 * Conveniente para rotas que sempre precisam de admin
 */
export function requireAdminAuth(req, res, next) {
    requireAuth(req, res, (err) => {
        if (err) return next(err);
        requireAdmin(req, res, next);
    });
}

/**
 * Middleware: Autenticação opcional
 * Anexa usuário ao req se autenticado, mas NÃO bloqueia se não autenticado
 * Útil para endpoints que mudam comportamento baseado em autenticação
 */
export async function optionalAuth(req, res, next) {
    try {
        // Extrair token da sessão/cookie
        const sessionCookie = req.cookies?.['sb-access-token'];
        
        if (!sessionCookie) {
            // Sem cookie, continua sem usuário
            req.user = null;
            return next();
        }

        // Tentar validar token
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(sessionCookie);
        
        if (error || !user) {
            // Token inválido, continua sem usuário
            req.user = null;
            return next();
        }

        // Token válido, anexa usuário
        req.user = user;
        logger.auth('Usuário autenticado opcionalmente', { userId: user.id });
        next();
    } catch (error) {
        logger.error('Erro ao validar token opcional', { error: error.message });
        // Em caso de erro, continua sem usuário (não bloqueia)
        req.user = null;
        next();
    }
}
