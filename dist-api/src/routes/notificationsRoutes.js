/**
 * ============================================
 * 🔔 NOTIFICATIONS ROUTES
 * ============================================
 * Endpoints para gerenciamento de notificações
 * ============================================
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middlewares/adminAuth.js';
import {
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount
} from '../services/notificationsService.js';
import logger from '../config/logger.js';

const router = express.Router();

// ============================================
// RATE LIMITING
// ============================================

// Leitura: mais permissivo (consultas frequentes)
const readLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 100, // 100 requests por minuto
    message: 'Muitas requisições de leitura. Tente novamente em 1 minuto.',
    standardHeaders: true,
    legacyHeaders: false
});

// Escrita: mais restritivo (ações menos frequentes)
const writeLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 30, // 30 requests por minuto
    message: 'Muitas requisições de escrita. Tente novamente em 1 minuto.',
    standardHeaders: true,
    legacyHeaders: false
});

// ============================================
// ENDPOINTS
// ============================================

/**
 * GET /api/notifications
 * Buscar notificações do usuário
 */
router.get('/', requireAuth, readLimiter, async (req, res) => {
    try {
        const userId = req.user.id;
        const userToken = req.user.token;

        // Parâmetros de query
        const unreadOnly = req.query.unread === 'true';
        const limit = parseInt(req.query.limit) || 50;
        const type = req.query.type || null;

        const { data, error } = await getUserNotifications(userId, userToken, {
            unreadOnly,
            limit,
            type
        });

        if (error) {
            logger.error('Erro ao buscar notificações', { userId, error: error.message });
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar notificações',
                error: error.message
            });
        }

        res.json({
            success: true,
            data: data || []
        });
    } catch (error) {
        logger.error('Erro ao buscar notificações', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar notificações',
            error: error.message
        });
    }
});

/**
 * GET /api/notifications/unread-count
 * Contar notificações não lidas
 */
router.get('/unread-count', requireAuth, readLimiter, async (req, res) => {
    try {
        const userId = req.user.id;
        const userToken = req.user.token;

        const { data, error } = await getUnreadCount(userId, userToken);

        if (error) {
            logger.error('Erro ao contar notificações não lidas', { userId, error: error.message });
            return res.status(500).json({
                success: false,
                message: 'Erro ao contar notificações',
                error: error.message
            });
        }

        res.json({
            success: true,
            unreadCount: data
        });
    } catch (error) {
        logger.error('Erro ao contar notificações não lidas', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Erro ao contar notificações',
            error: error.message
        });
    }
});

/**
 * PUT /api/notifications/:id/read
 * Marcar notificação como lida
 */
router.put('/:id/read', requireAuth, writeLimiter, async (req, res) => {
    try {
        const userId = req.user.id;
        const userToken = req.user.token;
        const notificationId = req.params.id;

        const { data, error } = await markAsRead(userId, userToken, notificationId);

        if (error) {
            logger.error('Erro ao marcar notificação como lida', { userId, notificationId, error: error.message });
            return res.status(500).json({
                success: false,
                message: 'Erro ao marcar notificação como lida',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Notificação marcada como lida'
        });
    } catch (error) {
        logger.error('Erro ao marcar notificação como lida', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Erro ao marcar notificação como lida',
            error: error.message
        });
    }
});

/**
 * PUT /api/notifications/read-all
 * Marcar todas notificações como lidas
 */
router.put('/read-all', requireAuth, writeLimiter, async (req, res) => {
    try {
        const userId = req.user.id;
        const userToken = req.user.token;

        const { data, error } = await markAllAsRead(userId, userToken);

        if (error) {
            logger.error('Erro ao marcar todas notificações como lidas', { userId, error: error.message });
            return res.status(500).json({
                success: false,
                message: 'Erro ao marcar todas notificações como lidas',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: `${data} notificações marcadas como lidas`
        });
    } catch (error) {
        logger.error('Erro ao marcar todas notificações como lidas', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Erro ao marcar todas notificações como lidas',
            error: error.message
        });
    }
});

/**
 * DELETE /api/notifications/:id
 * Deletar notificação
 */
router.delete('/:id', requireAuth, writeLimiter, async (req, res) => {
    try {
        const userId = req.user.id;
        const userToken = req.user.token;
        const notificationId = req.params.id;

        const { data, error } = await deleteNotification(userId, userToken, notificationId);

        if (error) {
            logger.error('Erro ao deletar notificação', { userId, notificationId, error: error.message });
            return res.status(500).json({
                success: false,
                message: 'Erro ao deletar notificação',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Notificação deletada com sucesso'
        });
    } catch (error) {
        logger.error('Erro ao deletar notificação', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Erro ao deletar notificação',
            error: error.message
        });
    }
});

export default router;
