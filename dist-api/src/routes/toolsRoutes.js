/**
 * Tools Routes
 * Endpoints para tracking de ferramentas e estatísticas
 */

import express from 'express';
import { supabase } from '../config/supabase.js';
import * as toolsService from '../services/toolsService.js';
import { requireAuth, requireAdmin } from '../middlewares/adminAuth.js';
import logger from '../config/logger.js';

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

    // ✅ CORRIGIDO: Agrupar por tool_type (planejamento, ia, complementar)
    // Não usar mais category antiga (Trabalhista, Previdenciário, etc)
    const categories = {};
    let totalTools = 0;

    tools.forEach(tool => {
      const toolType = tool.tool_type || 'complementar'; // Usar tool_type como agrupador
      const category = tool.category || 'Outros'; // Manter category para filtro interno

      if (!categories[category]) {
        categories[category] = [];
      }

      categories[category].push({
        id: tool.id,
        slug: tool.slug,
        name: tool.name,
        display_name: tool.name,
        description: tool.description,
        category: category, // ✅ Categoria antiga (Trabalhista, etc) - usado para filtro
        tool_type: toolType, // ✅ CRÍTICO: Tipo novo (planejamento, ia, complementar)
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
    logger.error('Erro ao buscar ferramentas mais usadas', { error: error.message });
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
    const userToken = req.user.token; // ✅ JWT do usuário
    const limit = parseInt(req.query.limit) || 4;

    const { data, error } = await toolsService.getMyMostUsedTools(userId, userToken, limit);

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
    logger.error('Erro ao buscar minhas ferramentas', { userId: req.user.id, error: error.message });
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
    logger.error('Erro ao buscar favoritos da plataforma', { error: error.message });
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
    logger.error('Erro ao registrar uso de ferramenta', { userId: req.user.id, error: error.message });
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/tools/stats
 * Obter estatísticas de uso do usuário (autenticado)
 * ✅ SEGURO: RLS valida auth.uid() = user_id
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userToken = req.user.token; // ✅ JWT do usuário

    const { data, error } = await toolsService.getUserToolStats(userId, userToken);

    if (error) {
      return res.status(500).json({
        success: false,
        error: error
      });
    }

    return res.json({
      success: true,
      data: data // ✅ CORRIGIDO: retornar 'data' ao invés de 'stats' (que não existe)
    });
  } catch (error) {
    logger.error('Erro ao buscar estatísticas de ferramentas', { userId: req.user.id, error: error.message });
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
    logger.error('Erro ao buscar histórico de ferramentas', { userId: req.user.id, error: error.message });
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
