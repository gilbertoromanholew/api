import express from 'express';
import { listTools, getToolDetails, executeTool, getUsageHistory } from './toolsController.js';
import { requireAuth } from '../auth/authMiddleware.js';
import { optionalAuth } from '../auth/authMiddleware.js';
import { validate } from '../../middlewares/validator.js';

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
router.post(
    '/execute/:tool_name',
    requireAuth,
    validate({
        type: 'object',
        properties: {
            params: { 
                type: 'object',
                description: 'Parâmetros específicos da ferramenta'
            }
        },
        additionalProperties: true // Permite propriedades adicionais
    }),
    executeTool
);

export default router;
