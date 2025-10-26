import express from 'express';
import { requireAuth } from '../middlewares/adminAuth.js';
import { supabase } from '../config/supabase.js';
import * as pricingService from '../services/toolsPricingService.js';

const router = express.Router();

/**
 * GET /api/pricing/:toolSlug
 * Obter precificação completa de uma ferramenta para o usuário autenticado
 */
router.get('/:toolSlug', requireAuth, async (req, res) => {
  try {
    const { toolSlug } = req.params;
    const userId = req.user.id;

    console.log(`📊 [Pricing] Consultando preço: ${toolSlug} para usuário ${userId}`);

    const pricing = await pricingService.getToolPricing(toolSlug, userId);

    return res.json({
      success: true,
      data: pricing
    });
  } catch (error) {
    console.error('❌ [Pricing] Erro:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/pricing/:toolSlug/usage
 * Obter usos mensais de uma ferramenta
 */
router.get('/:toolSlug/usage', requireAuth, async (req, res) => {
  try {
    const { toolSlug } = req.params;
    const userId = req.user.id;

    // Buscar ferramenta (usando supabase com RLS, não admin)
    const { data: tool, error } = await supabase
      .from('tools_catalog')
      .select('id')
      .eq('slug', toolSlug)
      .single();

    if (error || !tool) {
      return res.status(404).json({
        success: false,
        error: 'Ferramenta não encontrada'
      });
    }

    const usage = await pricingService.getMonthlyUsage(userId, tool.id);

    return res.json({
      success: true,
      data: {
        toolSlug,
        usedThisMonth: usage,
        month: new Date().toISOString().slice(0, 7)
      }
    });
  } catch (error) {
    console.error('❌ [Pricing] Erro ao buscar uso:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/pricing/:toolSlug/calculate
 * Calcular custo de execução (sem executar)
 */
router.post('/:toolSlug/calculate', requireAuth, async (req, res) => {
  try {
    const { toolSlug } = req.params;
    const { experienceType = 'lite' } = req.body;
    const userId = req.user.id;

    const result = await pricingService.calculateAndCharge(
      toolSlug,
      userId,
      experienceType
    );

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ [Pricing] Erro ao calcular:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
