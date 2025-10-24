/**
 * Promo Codes Routes
 * Endpoints para códigos promocionais
 */

import express from 'express';
import * as promoCodesService from '../services/promoCodesService.js';
import { requireAuth, requireAdmin } from '../middlewares/adminAuth.js';

const router = express.Router();

/**
 * POST /api/promo-codes/validate
 * Validar código promocional (autenticado)
 */
router.post('/validate', requireAuth, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Código é obrigatório'
      });
    }

    const { data, error } = await promoCodesService.validatePromoCode(code);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error
      });
    }

    return res.json({
      success: true,
      data: {
        code: data.code,
        type: data.type,
        value: data.value,
        description: data.description,
        valid: true
      }
    });
  } catch (error) {
    console.error('Erro ao validar código:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/promo-codes/redeem
 * Resgatar código promocional (autenticado)
 */
router.post('/redeem', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Código é obrigatório'
      });
    }

    const { data, error } = await promoCodesService.redeemPromoCode(userId, code);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error
      });
    }

    return res.json({
      success: true,
      message: 'Código resgatado com sucesso!',
      data
    });
  } catch (error) {
    console.error('Erro ao resgatar código:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/promo-codes/my-codes
 * Obter códigos já resgatados (autenticado)
 */
router.get('/my-codes', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await promoCodesService.getUserRedeemedCodes(userId);

    if (error) {
      return res.status(500).json({
        success: false,
        error: error
      });
    }

    return res.json({
      success: true,
      data: {
        codes: data,
        total: data.length
      }
    });
  } catch (error) {
    console.error('Erro ao buscar códigos resgatados:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/promo-codes/create
 * Criar novo código promocional (ADMIN apenas)
 */
router.post('/create', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      code,
      type,
      value,
      description,
      expiresAt,
      maxUses,
      metadata
    } = req.body;

    if (!code || !type || !value) {
      return res.status(400).json({
        success: false,
        error: 'Código, tipo e valor são obrigatórios'
      });
    }

    const { data, error } = await promoCodesService.createPromoCode({
      code,
      type,
      value,
      description,
      expiresAt,
      maxUses,
      metadata
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error
      });
    }

    return res.json({
      success: true,
      message: 'Código criado com sucesso!',
      data
    });
  } catch (error) {
    console.error('Erro ao criar código:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
