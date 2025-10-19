import express from 'express';
import { getBalance, getHistory, consume, checkCanUse, addFree } from './pointsController.js';
import { requireAuth } from '../auth/authMiddleware.js';
import { validate } from '../../middlewares/validator.js';

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

// POST /api/points/consume - Consumir pontos manualmente
router.post(
    '/consume',
    requireAuth,
    validate({
        type: 'object',
        properties: {
            amount: { type: 'number', minimum: 1 },
            description: { type: 'string', minLength: 3, maxLength: 200 },
            tool_name: { type: 'string', maxLength: 100 },
            type: { 
                type: 'string', 
                enum: ['tool_usage', 'manual_consumption', 'admin_adjustment'] 
            }
        },
        required: ['amount'],
        additionalProperties: false
    }),
    consume
);

// POST /api/points/add-free - Adicionar pontos gratuitos (ADMIN)
// TODO: Adicionar middleware requireAdmin quando implementar níveis de acesso
router.post(
    '/add-free',
    requireAuth,
    validate({
        type: 'object',
        properties: {
            user_id: { type: 'string', format: 'uuid' },
            amount: { type: 'number', minimum: 1 },
            description: { type: 'string', minLength: 3, maxLength: 200 }
        },
        required: ['user_id', 'amount'],
        additionalProperties: false
    }),
    addFree
);

export default router;
