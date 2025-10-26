import express from 'express';
import { requireAuth } from '../../middlewares/adminAuth.js';
import * as controller from './geradorPdfController.js';

const router = express.Router();

/**
 * CONFIGURAÇÃO DA FERRAMENTA
 * Usada pelo sistema de auto-discovery
 */
export const config = {
    slug: 'gerador-pdf',
    name: 'Gerador de PDF',
    version: '1.0.0',
    description: 'Gera documentos PDF personalizados a partir de texto',
    category: 'Documentos',
    author: 'Sistema V9',
    library: 'pdfkit'
};

/**
 * ROTAS
 */

// POST /api/tools/gerador-pdf/execute
router.post('/execute', requireAuth, controller.execute);

// GET /api/tools/gerador-pdf/info
router.get('/info', controller.getInfo);

export { router };
