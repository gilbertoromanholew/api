import express from 'express';
import { requireAuth } from '../../middlewares/adminAuth.js';
import * as controller from './calc_jurosController.js';

const router = express.Router();

/**
 * CONFIGURAÃ‡ÃƒO DA FERRAMENTA
 * Usada pelo sistema de auto-discovery
 */
export const config = {
    slug: 'calc_juros',
    name: 'Cálculo de Juros',
    version: '1.0.0',
    description: 'DescriÃ§Ã£o da ferramenta Cálculo de Juros',
    category: 'Categoria',
    author: 'Sistema V9'
};

/**
 * ROTAS
 */

// POST /api/tools/calc_juros/execute
router.post('/execute', requireAuth, controller.execute);

// GET /api/tools/calc_juros/info (requer autenticaÃ§Ã£o)
router.get('/info', requireAuth, controller.getInfo);

export { router };
