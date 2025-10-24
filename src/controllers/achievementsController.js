/**
 * ============================================
 * 🏆 ACHIEVEMENTS CONTROLLER - V7
 * ============================================
 * Controller REST para sistema de conquistas
 * Endpoints para listar, visualizar e gerenciar conquistas
 * ============================================
 */

const achievementsService = require('../services/achievementsService');

/**
 * GET /api/achievements
 * Lista todas as conquistas disponíveis (exceto secretas não desbloqueadas)
 */
async function listAllAchievements(req, res, next) {
  try {
    const userId = req.user?.id; // Opcional, se logado mostra progresso
    
    const { data: achievements, error } = await achievementsService.getAllAchievements(userId);
    
    if (error) {
      throw new Error(error.message);
    }

    return res.json({
      success: true,
      data: {
        achievements,
        total: achievements.length
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/achievements/user/:userId
 * Lista conquistas de um usuário específico
 * Retorna: desbloqueadas, progresso, estatísticas
 */
async function getUserAchievements(req, res, next) {
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
      throw new Error(error.message);
    }

    return res.json({
      success: true,
      data: {
        unlocked: data.unlocked,
        inProgress: data.inProgress,
        locked: data.locked,
        stats: {
          totalUnlocked: data.unlocked.length,
          totalPoints: data.unlocked.reduce((sum, a) => sum + (a.reward_bonus_credits || 0), 0),
          completionRate: data.stats?.completionRate || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/achievements/showcase/:userId
 * Retorna vitrine de conquistas do usuário (máx 3 exibidas)
 */
async function getUserShowcase(req, res, next) {
  try {
    const { userId } = req.params;

    const { data: showcase, error } = await achievementsService.getShowcase(userId);

    if (error) {
      throw new Error(error.message);
    }

    return res.json({
      success: true,
      data: {
        showcase,
        maxSlots: 3
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/achievements/showcase
 * Atualiza vitrine de conquistas do usuário logado
 * Body: { achievementIds: [uuid1, uuid2, uuid3] } (máx 3)
 */
async function updateShowcase(req, res, next) {
  try {
    const userId = req.user?.id;
    const { achievementIds } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    // Validar array
    if (!Array.isArray(achievementIds) || achievementIds.length > 3) {
      return res.status(400).json({
        success: false,
        error: 'achievementIds deve ser um array com no máximo 3 conquistas'
      });
    }

    const { data, error } = await achievementsService.updateShowcase(userId, achievementIds);

    if (error) {
      throw new Error(error.message);
    }

    return res.json({
      success: true,
      message: 'Vitrine atualizada com sucesso!',
      data: {
        showcase: data
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/achievements/recent
 * Lista conquistas desbloqueadas recentemente (últimas 10)
 */
async function getRecentUnlocks(req, res, next) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    const { data: recentUnlocks, error } = await achievementsService.getRecentUnlocks(userId, 10);

    if (error) {
      throw new Error(error.message);
    }

    return res.json({
      success: true,
      data: {
        recentUnlocks,
        total: recentUnlocks.length
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/achievements/leaderboard
 * Ranking de usuários por conquistas
 * Query: ?limit=10 (padrão)
 */
async function getLeaderboard(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const { data: leaderboard, error } = await achievementsService.getLeaderboard(limit);

    if (error) {
      throw new Error(error.message);
    }

    return res.json({
      success: true,
      data: {
        leaderboard,
        total: leaderboard.length
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listAllAchievements,
  getUserAchievements,
  getUserShowcase,
  updateShowcase,
  getRecentUnlocks,
  getLeaderboard
};
