import express from 'express';
import { requireAuth } from '../../middlewares/adminAuth.js';
import * as controller from './calcJurosController.js';

const router = express.Router();

/**
 * ROTAS DA FERRAMENTA: Cálculo de Juros
 * 
 * Todas as informações (slug, name, cost, etc) vêm do Supabase (tools_catalog).
 * Isso garante uma FONTE ÚNICA DA VERDADE e evita duplicação/dessincronia.
 */

// POST /api/tools/calc_juros/execute
router.post('/execute', requireAuth, controller.execute);

// GET /api/tools/calc_juros/info
router.get('/info', requireAuth, controller.getInfo);

export { router };
