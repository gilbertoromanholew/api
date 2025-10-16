import express from 'express';
import { exemplo, listar, buscarPorId } from './templateController.js';
import { validate } from '../../middlewares/validator.js';

const router = express.Router();

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

// POST - Criar/Processar
router.post('/template/exemplo', validate(exemploSchema), exemplo);

// GET - Listar todos
router.get('/template/listar', listar);

// GET - Buscar por ID
router.get('/template/:id', buscarPorId);

// Exemplos de outras rotas HTTP:
// router.put('/template/:id', validate(schema), atualizar);
// router.delete('/template/:id', deletar);
// router.patch('/template/:id', validate(schema), atualizarParcial);

export default router;
