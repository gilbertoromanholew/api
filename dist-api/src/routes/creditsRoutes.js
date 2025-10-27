/**
 * ========================================
 * ROTAS DE CRÉDITOS/PONTOS - CENTRALIZADO
 * ========================================
 * Endpoints para gerenciamento de pontos/créditos do usuário
 */

import express from 'express';
import { requireAuth } from '../middlewares/adminAuth.js';
import { requireAdmin } from '../middlewares/accessLevel.js';
import { 
  getBalance, 
  getHistory, 
  consumePoints,
  canUseTool,
  addBonusPoints,
  addPurchasedPoints
} from '../services/pointsService.js';
import { emitCreditsUpdate } from '../services/socketService.js';
import logger from '../config/logger.js';

const router = express.Router();

/**
 * GET /api/credits/balance
 * Retorna saldo atual de pontos/créditos do usuário
 * ✅ SEGURANÇA MÁXIMA: JWT do usuário + RLS no Postgres
 */
router.get('/balance', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userToken = req.user.token; // JWT do usuário
    logger.info('Buscando saldo de créditos', { userId });
    
    const balance = await getBalance(userId, userToken);
    
    logger.info('Saldo de créditos encontrado', {
      userId,
      bonus: balance.bonus_credits,
      purchased: balance.purchased_points,
      total: balance.total_credits
    });
    
    return res.json({
      success: true,
      data: balance
    });
  } catch (error) {
    logger.error('Erro ao buscar saldo de créditos', { userId: req.user.id, error: error.message });
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/credits/history
 * Retorna histórico de transações de pontos (paginado)
 * ✅ SEGURANÇA MÁXIMA: JWT do usuário + RLS no Postgres
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userToken = req.user.token;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type; // opcional: filtrar por tipo
    
    const result = await getHistory(userId, userToken, { page, limit, type });
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Erro ao buscar histórico de créditos', { userId: req.user.id, error: error.message });
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/credits/can-use/:tool_name
 * Verifica se usuário tem pontos suficientes para usar uma ferramenta
 */
router.get('/can-use/:tool_name', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { tool_name } = req.params;
    
    if (!tool_name) {
      return res.status(400).json({
        success: false,
        error: 'Nome da ferramenta não fornecido'
      });
    }
    
    const result = await canUseTool(userId, tool_name);
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Erro ao verificar se pode usar ferramenta', { userId: req.user.id, toolName: req.body.tool_name, error: error.message });
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/credits/consume
 * Consome pontos manualmente (internal use)
 * ✅ SEGURANÇA MÁXIMA: JWT do usuário + RLS no Postgres
 */
router.post('/consume', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userToken = req.user.token;
    const { amount, description, tool_name, type } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantidade de pontos inválida'
      });
    }
    
    const metadata = {
      type: type || 'manual_consumption',
      description: description || 'Consumo manual de pontos',
      tool_name: tool_name || null
    };
    
    const result = await consumePoints(userId, userToken, amount, metadata);
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Erro ao consumir pontos', { userId: req.user.id, amount: req.body.amount, error: error.message });
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/credits/add-bonus (ADMIN ONLY)
 * Adiciona pontos bônus a um usuário
 */
router.post('/add-bonus', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { user_id, amount, description } = req.body;
    
    if (!user_id || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'user_id e amount são obrigatórios'
      });
    }
    
    const result = await addBonusPoints(user_id, amount, {
      type: 'admin_adjustment',
      description: description || 'Ajuste administrativo',
      admin_user_id: req.user.id
    });
    
    // 🔌 WebSocket: Notificar usuário sobre créditos atualizados
    emitCreditsUpdate(user_id, {
      total: result.new_balance,
      bonus: result.bonus_credits,
      purchased: result.purchased_points
    });
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Erro ao adicionar bônus (admin)', { targetUserId: req.body.userId, amount: req.body.amount, error: error.message });
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/credits/add-purchased (ADMIN ONLY)
 * Adiciona pontos comprados a um usuário
 */
router.post('/add-purchased', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { user_id, amount, description, payment_id } = req.body;
    
    if (!user_id || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'user_id e amount são obrigatórios'
      });
    }
    
    const result = await addPurchasedPoints(user_id, amount, {
      type: 'purchase',
      description: description || 'Compra de pontos',
      stripe_payment_id: payment_id,
      admin_user_id: req.user.id
    });
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Erro ao adicionar pontos comprados (admin)', { targetUserId: req.body.userId, amount: req.body.amount, error: error.message });
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
