/**
 * ============================================
 * 👥 PRESENCE ROUTES (ADMIN ONLY)
 * ============================================
 * Endpoints para consulta de presença online
 * Apenas para administradores
 * ============================================
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth, requireAdmin } from '../middlewares/adminAuth.js';
import {
    getOnlineUsers,
    getPresenceStats
} from '../services/presenceService.js';
import logger from '../config/logger.js';

const router = express.Router();

// ============================================
// RATE LIMITING (Admin - mais restritivo)
// ============================================

const adminLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 30, // 30 requests por minuto (admins consultam frequentemente)
    message: 'Muitas requisições. Tente novamente em 1 minuto.',
    standardHeaders: true,
    legacyHeaders: false
});

// ============================================
// ENDPOINTS
// ============================================

/**
 * GET /api/presence/online
 * Buscar usuários online no momento
 * (Apenas admins)
 */
router.get('/online', requireAuth, requireAdmin, adminLimiter, async (req, res) => {
    try {
        const userToken = req.user.token;

        const { data, error } = await getOnlineUsers(userToken);

        if (error) {
            logger.error('Erro ao buscar usuários online', { error: error.message });
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar usuários online',
                error: error.message
            });
        }

        res.json({
            success: true,
            data: data || [],
            count: data?.length || 0
        });
    } catch (error) {
        logger.error('Erro ao buscar usuários online', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar usuários online',
            error: error.message
        });
    }
});

/**
 * GET /api/presence/stats
 * Buscar estatísticas de presença
 * (Apenas admins)
 */
router.get('/stats', requireAuth, requireAdmin, adminLimiter, async (req, res) => {
    try {
        const userToken = req.user.token;

        const { data, error } = await getPresenceStats(userToken);

        if (error) {
            logger.error('Erro ao buscar estatísticas de presença', { error: error.message });
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar estatísticas',
                error: error.message
            });
        }

        res.json({
            success: true,
            data: {
                totalUsers: parseInt(data.total_users) || 0,
                onlineNow: parseInt(data.online_now) || 0,
                activeToday: parseInt(data.active_today) || 0,
                activeWeek: parseInt(data.active_week) || 0,
                newToday: parseInt(data.new_today) || 0
            }
        });
    } catch (error) {
        logger.error('Erro ao buscar estatísticas de presença', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar estatísticas',
            error: error.message
        });
    }
});

export default router;
