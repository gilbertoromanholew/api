import express from 'express';
import { getBalance, getHistory, consume, checkCanUse, addFree } from './pointsController.js';
import { requireAuth } from '../auth/authMiddleware.js';
import { requireAdmin } from '../../middlewares/accessLevel.js';
// Fase 2: Usar schemas Joi
import { validate, consumePointsSchema, addFreePointsSchema } from '../../validators/schemas.js';

const router = express.Router();

/**
 * Todas as rotas de pontos requerem autenticação
 */

// GET /api/points/balance - Saldo atual
router.get('/balance', requireAuth, getBalance);

// GET /api/points/history - Histórico de transações (paginado)
router.get('/history', requireAuth, getHistory);

// GET /api/points/can-use/:tool_name - Verificar se pode usar ferramenta
router.get('/can-use/:tool_name', requireAuth, checkCanUse);

// POST /api/points/consume - Consumir pontos manualmente (Fase 2: Schema Joi)
router.post(
    '/consume',
    requireAuth,
    validate(consumePointsSchema),
    consume
);

// POST /api/points/add-free - Adicionar pontos gratuitos (ADMIN) (Fase 2: Schema Joi)
router.post(
    '/add-free',
    requireAuth,
    requireAdmin,
    validate(addFreePointsSchema),
    addFree
);

export default router;
