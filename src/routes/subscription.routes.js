/**
 * ============================================
 * 💎 SUBSCRIPTION ROUTES - V7
 * ============================================
 * Rotas para sistema de assinaturas Pro
 * ============================================
 */

const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticateToken } = require('../middlewares/auth');

/**
 * GET /api/subscription/plans
 * Lista todos os planos disponíveis (ativos)
 * Auth: Não requerida (público)
 */
router.get(
  '/plans',
  subscriptionController.listPlans
);

/**
 * GET /api/subscription/status
 * Retorna status de assinatura do usuário logado
 * Auth: Obrigatória
 */
router.get(
  '/status',
  authenticateToken,
  subscriptionController.getStatus
);

/**
 * POST /api/subscription/cancel
 * Cancela assinatura do usuário logado
 * Auth: Obrigatória
 */
router.post(
  '/cancel',
  authenticateToken,
  subscriptionController.cancelSubscription
);

/**
 * POST /api/subscription/checkout
 * Inicia processo de checkout para assinatura Pro
 * Auth: Obrigatória
 * Body: { planSlug: 'pro' }
 */
router.post(
  '/checkout',
  authenticateToken,
  subscriptionController.createCheckout
);

/**
 * POST /api/subscription/webhook/stripe
 * Processa webhooks do Stripe
 * Auth: Não requerida (validação via signature Stripe)
 * IMPORTANTE: Usar express.raw() para este endpoint
 */
router.post(
  '/webhook/stripe',
  subscriptionController.handleStripeWebhook
);

/**
 * GET /api/subscription/history
 * Retorna histórico de assinaturas do usuário
 * Auth: Obrigatória
 */
router.get(
  '/history',
  authenticateToken,
  subscriptionController.getHistory
);

module.exports = router;
