import express from 'express';
import { listTools, getToolDetails, executeTool, getUsageHistory } from './toolsController.js';
import { requireAuth, optionalAuth } from '../../middlewares/adminAuth.js';
// Fase 2: Usar schemas Joi + rate limiter específico para execução
import { validate, toolExecutionSchema } from '../../validators/schemas.js';
import { toolExecutionLimiter } from '../../middlewares/rateLimiters.js';

const router = express.Router();

/**
 * Rotas de ferramentas
 */

// GET /api/tools/list - Lista todas as ferramentas (público)
router.get('/list', listTools);

// GET /api/tools/history - Histórico de uso (autenticado)
router.get('/history', requireAuth, getUsageHistory);

// GET /api/tools/:tool_name - Detalhes de uma ferramenta (opcional auth)
router.get('/:tool_name', optionalAuth, getToolDetails);

// POST /api/tools/execute/:tool_name - Executar ferramenta (autenticado)
// Fase 2: Rate limiting específico (20 execuções/15min) + Schema Joi
router.post(
    '/execute/:tool_name',
    requireAuth,
    toolExecutionLimiter, // Rate limiting específico para execução de ferramentas
    validate(toolExecutionSchema),
    executeTool
);

export default router;
