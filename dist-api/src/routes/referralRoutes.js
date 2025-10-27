/**
 * Referrals Routes
 * Endpoints para sistema de indicação
 */

import express from 'express';
import * as referralService from '../services/referralService.js';
import { requireAuth, requireAdmin } from '../middlewares/adminAuth.js';
import logger from '../config/logger.js';

const router = express.Router();

/**
 * GET /api/referrals/my-code
 * Obter código de referral do usuário (autenticado)
 */
router.get('/my-code', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await referralService.getReferralCode(userId);

    if (error) {
      return res.status(500).json({
        success: false,
        error: error
      });
    }

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Erro ao obter código de referral', { userId: req.user?.id, error: error.message });
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/referrals/apply
 * Aplicar código de referral de um amigo (autenticado)
 */
router.post('/apply', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Código de indicação é obrigatório'
      });
    }

    const { data, error } = await referralService.applyReferralCode(userId, code);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error
      });
    }

    return res.json({
      success: true,
      message: `Código aplicado! Você ganhou ${data.bonusReceived} créditos bônus.`,
      data
    });
  } catch (error) {
    logger.error('Erro ao aplicar código de referral', { userId: req.user?.id, error: error.message });
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/referrals/stats
 * Obter estatísticas de indicações do usuário (autenticado)
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await referralService.getReferralStats(userId);

    if (error) {
      return res.status(500).json({
        success: false,
        error: error
      });
    }

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Erro ao obter estatísticas de referral', { userId: req.user?.id, error: error.message });
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/referrals/complete
 * Marcar referral como completo (interno)
 * Chamado quando usuário indicado faz primeira ação significativa
 */
router.post('/complete', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await referralService.completeReferral(userId);

    if (error) {
      // Não retornar erro se não houver referral pendente
      return res.json({
        success: true,
        data: { message: 'Nenhum referral pendente' }
      });
    }

    // Recompensar quem indicou
    await referralService.rewardReferrer(userId, 50);

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Erro ao completar referral', { userId: req.user?.id, error: error.message });
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
