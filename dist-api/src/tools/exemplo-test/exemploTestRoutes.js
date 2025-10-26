import express from 'express';
import { requireAuth } from '../../middlewares/adminAuth.js';
import * as controller from './exemploTestController.js';

const router = express.Router();

// Config da ferramenta (exportado para auto-discovery)
export const config = {
    slug: 'exemplo-test',
    name: 'Exemplo de Teste V9',
    version: '1.0.0',
    description: 'Ferramenta de teste para validar auto-discovery'
};

/**
 * POST /api/tools/exemplo-test/execute
 * Executa a ferramenta de exemplo
 */
router.post('/execute', requireAuth, controller.execute);

/**
 * GET /api/tools/exemplo-test/info
 * Retorna informações da ferramenta
 */
router.get('/info', controller.getInfo);

export { router };
export default router;
