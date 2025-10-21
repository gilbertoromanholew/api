/**
 * Rotas de Auditoria (Admin)
 * 
 * Fase 3: Auditoria e Logging
 * 
 * Estas rotas permitem que administradores visualizem:
 * - Logs de autenticação
 * - Logs de operações
 * - Violações de rate limit
 * - Atividades suspeitas
 * - Estatísticas gerais
 */

import express from 'express';
import { requireAuth, requireAdmin } from '../middlewares/adminAuth.js';
import {
    getAuditStats,
    getFailedLoginAttempts,
    getSuspiciousActivities,
    getTopRateLimitViolators,
    getUserAuthLogs,
    getUserOperationLogs
} from '../services/auditService.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

/**
 * GET /audit/stats
 * Estatísticas gerais de auditoria (admin)
 */
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { user_id } = req.query;
        
        const stats = await getAuditStats(user_id || null);
        
        if (!stats) {
            return res.status(500).json({
                success: false,
                error: 'Erro ao obter estatísticas'
            });
        }
        
        return res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('[Audit API] Erro ao obter estatísticas:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /audit/failed-logins
 * Tentativas de login falhadas (últimas 24h)
 */
router.get('/failed-logins', requireAuth, requireAdmin, async (req, res) => {
    try {
        const attempts = await getFailedLoginAttempts();
        
        return res.json({
            success: true,
            data: {
                attempts,
                total: attempts.length
            }
        });
    } catch (error) {
        console.error('[Audit API] Erro ao obter tentativas falhadas:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /audit/suspicious-activities
 * Atividades suspeitas (múltiplos IPs)
 */
router.get('/suspicious-activities', requireAuth, requireAdmin, async (req, res) => {
    try {
        const activities = await getSuspiciousActivities();
        
        return res.json({
            success: true,
            data: {
                activities,
                total: activities.length
            }
        });
    } catch (error) {
        console.error('[Audit API] Erro ao obter atividades suspeitas:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /audit/rate-limit-violations
 * Top violadores de rate limit
 */
router.get('/rate-limit-violations', requireAuth, requireAdmin, async (req, res) => {
    try {
        const violators = await getTopRateLimitViolators();
        
        return res.json({
            success: true,
            data: {
                violators,
                total: violators.length
            }
        });
    } catch (error) {
        console.error('[Audit API] Erro ao obter violadores de rate limit:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /audit/user/:user_id/auth
 * Logs de autenticação de um usuário específico
 */
router.get('/user/:user_id/auth', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { user_id } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        
        const logs = await getUserAuthLogs(user_id, limit);
        
        return res.json({
            success: true,
            data: {
                logs,
                total: logs.length,
                user_id
            }
        });
    } catch (error) {
        console.error('[Audit API] Erro ao obter logs de autenticação:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /audit/user/:user_id/operations
 * Logs de operações de um usuário específico
 */
router.get('/user/:user_id/operations', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { user_id } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        
        const logs = await getUserOperationLogs(user_id, limit);
        
        return res.json({
            success: true,
            data: {
                logs,
                total: logs.length,
                user_id
            }
        });
    } catch (error) {
        console.error('[Audit API] Erro ao obter logs de operações:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /audit/auth-logs
 * Todos os logs de autenticação (paginado, admin)
 */
router.get('/auth-logs', requireAuth, requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const action = req.query.action; // Filtro opcional por ação
        const success = req.query.success; // Filtro opcional por sucesso
        const offset = (page - 1) * limit;
        
        let query = supabase
            .from('auth_audit_log')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        
        // Aplicar filtros
        if (action) {
            query = query.eq('action', action);
        }
        if (success !== undefined) {
            query = query.eq('success', success === 'true');
        }
        
        const { data, error, count } = await query;
        
        if (error) {
            throw new Error('Erro ao buscar logs de autenticação');
        }
        
        const totalPages = Math.ceil(count / limit);
        
        return res.json({
            success: true,
            data: {
                logs: data,
                pagination: {
                    page,
                    limit,
                    total: count,
                    total_pages: totalPages,
                    has_next: page < totalPages,
                    has_prev: page > 1
                }
            }
        });
    } catch (error) {
        console.error('[Audit API] Erro ao buscar logs de autenticação:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /audit/operation-logs
 * Todos os logs de operações (paginado, admin)
 */
router.get('/operation-logs', requireAuth, requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const operation = req.query.operation; // Filtro opcional
        const success = req.query.success; // Filtro opcional
        const offset = (page - 1) * limit;
        
        let query = supabase
            .from('operations_audit_log')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        
        // Aplicar filtros
        if (operation) {
            query = query.eq('operation', operation);
        }
        if (success !== undefined) {
            query = query.eq('success', success === 'true');
        }
        
        const { data, error, count } = await query;
        
        if (error) {
            throw new Error('Erro ao buscar logs de operações');
        }
        
        const totalPages = Math.ceil(count / limit);
        
        return res.json({
            success: true,
            data: {
                logs: data,
                pagination: {
                    page,
                    limit,
                    total: count,
                    total_pages: totalPages,
                    has_next: page < totalPages,
                    has_prev: page > 1
                }
            }
        });
    } catch (error) {
        console.error('[Audit API] Erro ao buscar logs de operações:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /audit/my-logs
 * Logs do usuário autenticado (não precisa ser admin)
 */
router.get('/my-logs', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const type = req.query.type || 'auth'; // 'auth' ou 'operations'
        const limit = parseInt(req.query.limit) || 20;
        
        if (type === 'auth') {
            const logs = await getUserAuthLogs(userId, limit);
            return res.json({
                success: true,
                data: {
                    type: 'auth',
                    logs,
                    total: logs.length
                }
            });
        } else if (type === 'operations') {
            const logs = await getUserOperationLogs(userId, limit);
            return res.json({
                success: true,
                data: {
                    type: 'operations',
                    logs,
                    total: logs.length
                }
            });
        } else {
            return res.status(400).json({
                success: false,
                error: 'Tipo inválido. Use "auth" ou "operations".'
            });
        }
    } catch (error) {
        console.error('[Audit API] Erro ao buscar logs do usuário:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
