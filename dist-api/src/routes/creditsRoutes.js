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
    console.log('💰 [Credits] Buscando saldo para:', userId);
    
    const balance = await getBalance(userId, userToken);
    
    console.log('✅ [Credits] Saldo encontrado:', {
      bonus: balance.bonus_credits,
      purchased: balance.purchased_points,
      total: balance.total_credits
    });
    
    return res.json({
      success: true,
      data: balance
    });
  } catch (error) {
    console.error('❌ [Credits] Erro ao buscar saldo:', error);
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
    console.error('❌ [Credits] Erro ao buscar histórico:', error);
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
    console.error('❌ [Credits] Erro ao verificar ferramenta:', error);
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
    console.error('❌ [Credits] Erro ao consumir pontos:', error);
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
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ [Credits] Erro ao adicionar bônus:', error);
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
    console.error('❌ [Credits] Erro ao adicionar pontos comprados:', error);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
