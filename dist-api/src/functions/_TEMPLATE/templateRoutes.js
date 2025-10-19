import express from 'express';
import { exemplo, listar, buscarPorId } from './templateController.js';
import { validate } from '../../middlewares/validator.js';
// import { requireAdmin } from '../../middlewares/accessLevel.js'; // ⚠️ Descomente se precisar restringir alguma rota para ADMIN

const router = express.Router();

/**
 * 🔒 SISTEMA DE PERMISSÕES (v2.12.0)
 * 
 * Por padrão, TODAS as rotas abaixo são automaticamente acessíveis para:
 * ✅ TRUSTED (IP confiável)
 * ✅ ADMIN (IP administrativo)
 * 
 * ❌ GUEST (IP visitante) NÃO pode acessar functions - apenas /docs
 * 
 * 🔐 Para restringir uma rota específica apenas para ADMIN:
 * router.delete('/rota/:id', requireAdmin, controller.metodo);
 * 
 * Exemplos:
 * 
 * // ✅ TRUSTED e ADMIN podem acessar (comportamento padrão)
 * router.get('/usuarios', controller.listar);
 * router.post('/usuarios', validate(schema), controller.criar);
 * 
 * // 🔒 Apenas ADMIN pode deletar
 * router.delete('/usuarios/:id', requireAdmin, controller.deletar);
 * 
 * // 🔐 Function inteira só para ADMIN (todas as rotas)
 * router.get('/secrets', requireAdmin, controller.listar);
 * router.post('/secrets', requireAdmin, controller.criar);
 */

// ===== SCHEMAS DE VALIDAÇÃO =====

const exemploSchema = {
    required: ['parametro'],
    types: {
        parametro: 'string'
    },
    length: {
        parametro: { min: 1, max: 100 }
    }
};

// ===== ROTAS =====

// ✅ TRUSTED e ADMIN podem acessar (comportamento padrão)
// POST - Criar/Processar
router.post('/template/exemplo', validate(exemploSchema), exemplo);

// GET - Listar todos
router.get('/template/listar', listar);

// GET - Buscar por ID
router.get('/template/:id', buscarPorId);

// Exemplos de outras rotas HTTP:
// ✅ TRUSTED e ADMIN podem acessar
// router.put('/template/:id', validate(schema), atualizar);

// 🔒 Apenas ADMIN pode deletar (descomente requireAdmin no topo)
// router.delete('/template/:id', requireAdmin, deletar);

// ✅ TRUSTED e ADMIN podem acessar
// router.patch('/template/:id', validate(schema), atualizarParcial);

export default router;
