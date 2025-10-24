/**
 * ============================================
 * 🏆 ACHIEVEMENTS ROUTES - V7
 * ============================================
 * Rotas para sistema de conquistas
 * ============================================
 */

const express = require('express');
const router = express.Router();
const achievementsController = require('../controllers/achievementsController');
const { authenticateToken } = require('../middlewares/auth'); // Middleware de autenticação

/**
 * GET /api/achievements
 * Lista todas as conquistas disponíveis
 * Auth: Opcional (se logado, mostra progresso)
 */
router.get(
  '/',
  achievementsController.listAllAchievements
);

/**
 * GET /api/achievements/user/:userId
 * Lista conquistas de um usuário específico
 * Auth: Obrigatória (deve ser próprio perfil ou admin)
 */
router.get(
  '/user/:userId',
  authenticateToken,
  achievementsController.getUserAchievements
);

/**
 * GET /api/achievements/showcase/:userId
 * Retorna vitrine de conquistas do usuário (máx 3)
 * Auth: Não requerida (perfil público)
 */
router.get(
  '/showcase/:userId',
  achievementsController.getUserShowcase
);

/**
 * PUT /api/achievements/showcase
 * Atualiza vitrine de conquistas do usuário logado
 * Auth: Obrigatória
 * Body: { achievementIds: [uuid1, uuid2, uuid3] }
 */
router.put(
  '/showcase',
  authenticateToken,
  achievementsController.updateShowcase
);

/**
 * GET /api/achievements/recent
 * Lista conquistas desbloqueadas recentemente (últimas 10)
 * Auth: Obrigatória
 */
router.get(
  '/recent',
  authenticateToken,
  achievementsController.getRecentUnlocks
);

/**
 * GET /api/achievements/leaderboard
 * Ranking de usuários por conquistas
 * Auth: Não requerida (público)
 * Query: ?limit=10
 */
router.get(
  '/leaderboard',
  achievementsController.getLeaderboard
);

module.exports = router;
