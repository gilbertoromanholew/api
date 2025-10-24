/**
 * ============================================
 * 💎 SUBSCRIPTION ROUTES - V7
 * ============================================
 * Rotas para sistema de assinaturas Pro
 * ============================================
 */

import express from 'express';
import { requireAuth } from '../middlewares/adminAuth.js';
import * as subscriptionService from '../services/subscriptionService.js';

const router = express.Router();

/**
 * GET /api/subscription/plans
 * Lista todos os planos disponíveis (ativos)
 * Auth: Não requerida (público)
 */
router.get(
  '/plans',
  async (req, res) => {
    try {
      const { data, error } = await subscriptionService.getPlans();

      if (error) {
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }

      return res.json({
        success: true,
        data: {
          plans: data,
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
 * GET /api/subscription/status
 * Retorna status de assinatura do usuário logado
 * Auth: Obrigatória
 */
router.get(
  '/status',
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

      const isPro = await subscriptionService.isPro(userId);
      const { data: subscription, error } = await subscriptionService.getActiveSubscription(userId);

      return res.json({
        success: true,
        data: {
          isPro,
          subscription: subscription || null,
          benefits: isPro ? {
            weeklyAllowance: 20,
            pointsMultiplier: 2.1,
            unlimitedPlannings: true,
            prioritySupport: true
          } : null
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
 * POST /api/subscription/cancel
 * Cancela assinatura do usuário logado
 * Auth: Obrigatória
 */
router.post(
  '/cancel',
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

      const { data, error } = await subscriptionService.cancelSubscription(userId);

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      return res.json({
        success: true,
        message: 'Assinatura cancelada com sucesso. Você continuará tendo acesso Pro até o fim do período pago.',
        data: {
          subscription: data,
          expiresAt: data.end_date
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
 * POST /api/subscription/checkout
 * Inicia processo de checkout para assinatura Pro
 * Auth: Obrigatória
 * Body: { planSlug: 'pro' }
 */
router.post(
  '/checkout',
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const { planSlug } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado'
        });
      }

      if (!planSlug) {
        return res.status(400).json({
          success: false,
          error: 'planSlug é obrigatório'
        });
      }

      // TODO: Integrar com Stripe
      // const session = await stripe.checkout.sessions.create({...});

      return res.json({
        success: true,
        message: 'Checkout ainda não implementado. Aguarde integração com Stripe.',
        data: {
          planSlug,
          nextStep: 'Integrar Stripe API'
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
 * POST /api/subscription/webhook/stripe
 * Processa webhooks do Stripe
 * Auth: Não requerida (validação via signature Stripe)
 */
router.post(
  '/webhook/stripe',
  async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'];
      const event = req.body;

      // TODO: Validar assinatura Stripe
      const { success, error } = await subscriptionService.handleStripeWebhook(event);

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      return res.json({
        success: true,
        message: 'Webhook processado'
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
 * GET /api/subscription/history
 * Retorna histórico de assinaturas do usuário
 * Auth: Obrigatória
 */
router.get(
  '/history',
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

      const { data, error } = await subscriptionService.getSubscriptionHistory(userId);

      if (error) {
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }

      return res.json({
        success: true,
        data: {
          subscriptions: data,
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
