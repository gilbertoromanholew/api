import express from 'express';
import { requireAuth } from '../../middlewares/adminAuth.js';
import * as controller from './NOME_FERRAMENTAController.js';

const router = express.Router();

/**
 * 🔒 ROTAS DA FERRAMENTA
 * 
 * Sistema V9: FONTE ÚNICA DA VERDADE = Supabase (tools_catalog)
 * 
 * Todas as informações (slug, name, description, cost, category) são
 * buscadas diretamente do Supabase em tempo de execução.
 * 
 * BENEFÍCIOS:
 * ✅ Zero duplicação de dados
 * ✅ Atualização instantânea (mudar no Supabase = reflete imediatamente)
 * ✅ Sem dessincronia entre código e banco
 * ✅ Manutenção simplificada
 * 
 * IMPORTANTE:
 * - O slug da ferramenta é definido no nome da pasta
 * - O auto-discovery usa o nome da pasta como slug
 */

// POST /api/tools/SLUG_FERRAMENTA/execute
// Executa a ferramenta (deduz pontos, registra auditoria)
router.post('/execute', requireAuth, controller.execute);

// GET /api/tools/SLUG_FERRAMENTA/info
// Retorna informações da ferramenta (do Supabase)
router.get('/info', requireAuth, controller.getInfo);

export { router };
