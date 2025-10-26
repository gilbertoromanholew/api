import express from 'express';
import { requireAuth } from '../../middlewares/adminAuth.js';
import * as controller from './calculadoraSimplesController.js';

const router = express.Router();

/**
 * CONFIGURAÇÃO DA FERRAMENTA
 * Usada pelo sistema de auto-discovery
 */
export const config = {
    slug: 'calculadora-simples',
    name: 'Calculadora Simples',
    version: '1.0.0',
    description: 'Realiza operações matemáticas básicas (soma, subtração, multiplicação, divisão)',
    category: 'Utilitários',
    author: 'Sistema V9'
};

/**
 * ROTAS
 */

// POST /api/tools/calculadora-simples/execute
router.post('/execute', requireAuth, controller.execute);

// GET /api/tools/calculadora-simples/info
router.get('/info', controller.getInfo);

export { router };
