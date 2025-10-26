/**
 * Tools Routes
 * Endpoints para tracking de ferramentas e estatísticas
 */

import express from 'express';
import { supabase } from '../config/supabase.js';
import * as toolsService from '../services/toolsService.js';
import { requireAuth, requireAdmin } from '../middlewares/adminAuth.js';

const router = express.Router();

/**
 * GET /api/tools/list
 * Listar todas as ferramentas ativas do catálogo
 */
router.get('/list', async (req, res) => {
  try {
    const { data: tools, error } = await supabase
      .from('tools_catalog')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    // Agrupar ferramentas por categoria (como o frontend espera)
    const categories = {};
    let totalTools = 0;

    tools.forEach(tool => {
      const category = tool.category || 'Outros';

      if (!categories[category]) {
        categories[category] = [];
      }

      categories[category].push({
        id: tool.id,
        slug: tool.slug,
        name: tool.name,
        display_name: tool.name,
        description: tool.description,
        category: category,
        base_cost: tool.cost_in_points || 0,
        final_cost: tool.cost_in_points || 0,
        points_cost: tool.cost_in_points || 0,
        requires_pro: !tool.is_free_for_pro,
        tags: [],
        is_active: tool.is_active,
        display_order: tool.display_order
      });

      totalTools++;
    });

    return res.json({
      success: true,
      data: {
        categories: categories,
        total_tools: totalTools
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/tools/most-used
 * Obter ferramentas mais usadas da plataforma (público)
 */
router.get('/most-used', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;

    const { data, error } = await toolsService.getMostUsedTools(limit);

    if (error) {
      return res.status(500).json({
        success: false,
        error: error
      });
    }

    return res.json({
      success: true,
      data: {
        tools: data,
        total: data.length
      }
    });
  } catch (error) {
    console.error('Erro ao buscar ferramentas mais usadas:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/tools/track
 * Registrar uso de ferramenta (autenticado)
 */
router.post('/track', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { toolName, durationSeconds, success, metadata } = req.body;

    if (!toolName) {
      return res.status(400).json({
        success: false,
        error: 'Nome da ferramenta é obrigatório'
      });
    }

    const { data, error } = await toolsService.trackToolUsage(userId, toolName, {
      durationSeconds,
      success,
      metadata
    });

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
    console.error('Erro ao registrar uso de ferramenta:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/tools/stats
 * Obter estatísticas de uso do usuário (autenticado)
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await toolsService.getUserToolStats(userId);

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
    console.error('Erro ao buscar estatísticas:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/tools/history
 * Obter histórico de uso de ferramentas (autenticado)
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;

    const { data, error } = await toolsService.getUserToolHistory(userId, limit);

    if (error) {
      return res.status(500).json({
        success: false,
        error: error
      });
    }

    return res.json({
      success: true,
      data: {
        history: data,
        total: data.length
      }
    });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
