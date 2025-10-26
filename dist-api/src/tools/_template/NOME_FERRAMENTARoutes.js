import express from 'express';
import { requireAuth } from '../../middlewares/adminAuth.js';
import * as controller from './NOME_FERRAMENTAController.js';

const router = express.Router();

/**
 * ⚙️ CONFIGURAÇÃO DA FERRAMENTA
 * 
 * Esta configuração é usada pelo sistema de AUTO-DISCOVERY.
 * O servidor escaneia esta pasta e registra automaticamente a ferramenta.
 * 
 * IMPORTANTE:
 * - slug: DEVE SER IGUAL ao campo 'slug' no Supabase (tools_catalog)
 * - name: Nome exibido no sistema
 */
export const config = {
    slug: 'SLUG_FERRAMENTA',              // ⚠️ ALTERAR: mesmo do Supabase
    name: 'Nome da Ferramenta',           // ⚠️ ALTERAR: nome amigável
    version: '1.0.0',
    description: 'Descrição da ferramenta',
    category: 'Categoria',                // Ex: Trabalhista, Financeiro, Validadores
    author: 'Sistema V9'
};

/**
 * 🔒 ROTAS (TODAS COM AUTENTICAÇÃO)
 */

// POST /api/tools/SLUG_FERRAMENTA/execute
// Executa a ferramenta (deduz pontos, registra auditoria)
router.post('/execute', requireAuth, controller.execute);

// GET /api/tools/SLUG_FERRAMENTA/info
// Retorna informações da ferramenta (requer autenticação)
router.get('/info', requireAuth, controller.getInfo);

export { router };
