/**
 * ============================================
 * 💎 SUBSCRIPTION CONTROLLER - V7
 * ============================================
 * Controller REST para sistema de assinaturas Pro
 * Gerencia planos, status, cancelamento e webhooks Stripe
 * ============================================
 */

const subscriptionService = require('../services/subscriptionService');

/**
 * GET /api/subscription/plans
 * Lista todos os planos disponíveis (ativos)
 */
async function listPlans(req, res, next) {
  try {
    const { data: plans, error } = await subscriptionService.getPlans();

    if (error) {
      throw new Error(error.message);
    }

    return res.json({
      success: true,
      data: {
        plans,
        total: plans.length
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/subscription/status
 * Retorna status de assinatura do usuário logado
 */
async function getStatus(req, res, next) {
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

    if (error && error.message !== 'No active subscription') {
      throw new Error(error.message);
    }

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
    next(error);
  }
}

/**
 * POST /api/subscription/cancel
 * Cancela assinatura do usuário logado
 * (mantém ativa até data de expiração)
 */
async function cancelSubscription(req, res, next) {
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
      throw new Error(error.message);
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
    next(error);
  }
}

/**
 * POST /api/subscription/checkout
 * Inicia processo de checkout para assinatura Pro
 * (Integração Stripe - futuro)
 */
async function createCheckout(req, res, next) {
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
    next(error);
  }
}

/**
 * POST /api/subscription/webhook/stripe
 * Processa webhooks do Stripe
 * (Integração Stripe - futuro)
 */
async function handleStripeWebhook(req, res, next) {
  try {
    const signature = req.headers['stripe-signature'];
    const payload = req.body;

    // TODO: Validar assinatura Stripe
    // const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    // const result = await subscriptionService.handleStripeWebhook(event);

    return res.json({
      success: true,
      message: 'Webhook recebido (não processado - aguardando integração Stripe)'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/subscription/history
 * Retorna histórico de assinaturas do usuário
 */
async function getHistory(req, res, next) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    const { data: history, error } = await subscriptionService.getSubscriptionHistory(userId);

    if (error) {
      throw new Error(error.message);
    }

    return res.json({
      success: true,
      data: {
        subscriptions: history,
        total: history.length
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listPlans,
  getStatus,
  cancelSubscription,
  createCheckout,
  handleStripeWebhook,
  getHistory
};
