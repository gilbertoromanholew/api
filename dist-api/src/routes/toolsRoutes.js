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
 * ✅ SEGURANÇA: Requer autenticação para evitar scraping
 */
router.get('/list', requireAuth, async (req, res) => {
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
        tool_type: tool.tool_type || 'complementar', // ✅ NOVO: Tipo explícito
        base_cost: tool.cost_in_points || 0,
        final_cost: tool.cost_in_points || 0,
        points_cost: tool.cost_in_points || 0,
        // ✅ NOVA LÓGICA: Baseado em access_level (padrão: 'free')
        // 'professional' → Requer plano profissional
        // 'free' → Todos podem usar (pagando créditos)
        requires_pro: (tool.access_level || 'free') === 'professional',
        access_level: tool.access_level || 'free',
        is_planning: tool.is_planning || false,
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
 * Obter ferramentas mais usadas da plataforma
 * ✅ SEGURO: Apenas agregações, não expõe user_id
 */
router.get('/most-used', requireAuth, async (req, res) => {
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
 * GET /api/tools/my-most-used
 * Obter ferramentas mais usadas PELO USUÁRIO (pessoal)
 * ✅ SEGURO: RLS valida auth.uid() = user_id
 */
router.get('/my-most-used', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 4;

    const { data, error } = await toolsService.getMyMostUsedTools(userId, limit);

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
    console.error('Erro ao buscar minhas ferramentas:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/tools/platform-favorites
 * Obter top 1 ferramenta por categoria (geral da plataforma)
 * ✅ SEGURO: Apenas agregações, não expõe dados pessoais
 */
router.get('/platform-favorites', requireAuth, async (req, res) => {
  try {
    const { data, error } = await toolsService.getPlatformFavorites();

    if (error) {
      return res.status(500).json({
        success: false,
        error: error
      });
    }

    return res.json({
      success: true,
      data: {
        favorites: data,
        total: data.length
      }
    });
  } catch (error) {
    console.error('Erro ao buscar favoritos da plataforma:', error);
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
