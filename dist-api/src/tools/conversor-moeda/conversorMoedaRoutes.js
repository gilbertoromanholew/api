import express from 'express';
import { requireAuth } from '../../middlewares/adminAuth.js';
import * as controller from './conversorMoedaController.js';

const router = express.Router();

/**
 * CONFIGURAÇÃO DA FERRAMENTA
 * Usada pelo sistema de auto-discovery
 */
export const config = {
    slug: 'conversor-moeda',
    name: 'Conversor de Moeda',
    version: '1.0.0',
    description: 'Converte valores entre diferentes moedas usando cotações em tempo real',
    category: 'Financeiro',
    author: 'Sistema V9',
    apiProvider: 'ExchangeRate-API'
};

/**
 * ROTAS
 */

// POST /api/tools/conversor-moeda/execute
router.post('/execute', requireAuth, controller.execute);

// GET /api/tools/conversor-moeda/info
router.get('/info', controller.getInfo);

// GET /api/tools/conversor-moeda/moedas-disponiveis
router.get('/moedas-disponiveis', controller.getMoedasDisponiveis);

export { router };
