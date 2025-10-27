/**
 * ============================================
 * 🏆 ACHIEVEMENTS ROUTES - V7
 * ============================================
 * Rotas para sistema de conquistas
 * ============================================
 */

import express from 'express';
import { requireAuth, optionalAuth } from '../middlewares/adminAuth.js';
import * as achievementsService from '../services/achievementsService.js';

const router = express.Router();

/**
 * GET /api/achievements
 * Lista todas as conquistas disponíveis
 * Auth: Opcional (se logado, mostra progresso)
 */
router.get(
  '/',
  optionalAuth,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const { data, error } = await achievementsService.getAllAchievements(userId);
      
      if (error) {
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }

      return res.json({
        success: true,
        data: {
          achievements: data,
          total: data.length
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * GET /api/achievements/me
 * Lista conquistas do usuário logado
 * Auth: Obrigatória
 */
router.get(
  '/me',
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { data, error } = await achievementsService.getUserAchievements(userId);

      if (error) {
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }

      return res.json({
        success: true,
        data
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * GET /api/achievements/user/:userId
 * Lista conquistas de um usuário específico
 * Auth: Obrigatória (deve ser próprio perfil ou admin)
 */
router.get(
  '/user/:userId',
  requireAuth,
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Verificar se está acessando próprio perfil ou se tem permissão
      if (req.user?.id !== userId && !req.user?.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Você não tem permissão para ver conquistas deste usuário'
        });
      }

      const { data, error } = await achievementsService.getUserAchievements(userId);

      if (error) {
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }

      return res.json({
        success: true,
        data
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * GET /api/achievements/showcase/:userId
 * Retorna vitrine de conquistas do usuário (máx 3)
 * Auth: Não requerida (perfil público)
 */
router.get(
  '/showcase/:userId',
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { data, error } = await achievementsService.getShowcase(userId);

      if (error) {
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }

      return res.json({
        success: true,
        data: {
          showcase: data,
          maxSlots: 3
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * PUT /api/achievements/showcase
 * Atualiza vitrine de conquistas do usuário logado
 * Auth: Obrigatória
 * Body: { achievementIds: [uuid1, uuid2, uuid3] }
 */
router.put(
  '/showcase',
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const { achievementIds } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado'
        });
      }

      const { data, error } = await achievementsService.updateShowcase(userId, achievementIds);

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      return res.json({
        success: true,
        message: 'Vitrine atualizada com sucesso!',
        data: {
          showcase: data
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * GET /api/achievements/recent
 * Lista conquistas desbloqueadas recentemente (últimas 10)
 * Auth: Obrigatória
 */
router.get(
  '/recent',
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado'
        });
      }

      const { data, error } = await achievementsService.getRecentUnlocks(userId, 10);

      if (error) {
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }

      return res.json({
        success: true,
        data: {
          recentUnlocks: data,
          total: data.length
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * GET /api/achievements/leaderboard
 * Ranking de usuários por conquistas
 * Auth: Não requerida (público)
 * Query: ?limit=10
 */
router.get(
  '/leaderboard',
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const { data, error } = await achievementsService.getLeaderboard(limit);

      if (error) {
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }

      return res.json({
        success: true,
        data: {
          leaderboard: data,
          total: data.length
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

export default router;
