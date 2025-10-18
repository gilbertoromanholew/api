import { Router } from 'express';
import exemploController from './exemploController.js';
import { validate } from '../../middlewares/validator.js';
import { requireTrusted, requireAdmin } from '../../middlewares/accessLevel.js';

const router = Router();

// Schema de validação para criação de usuário
const criarUsuarioSchema = {
    required: ['nome', 'email', 'idade'],
    types: {
        nome: 'string',
        email: 'string',
        idade: 'number',
        ativo: 'boolean'
    },
    length: {
        nome: { min: 3, max: 100 },
        email: { min: 5, max: 100 }
    }
};

// Schema de validação para atualização de usuário
const atualizarUsuarioSchema = {
    types: {
        nome: 'string',
        email: 'string',
        idade: 'number',
        ativo: 'boolean'
    },
    length: {
        nome: { min: 3, max: 100 },
        email: { min: 5, max: 100 }
    }
};

/**
 * Rotas de Exemplo - CRUD de Usuários
 * 
 * Todas as rotas começam com /usuarios
 */

// GET /usuarios - Lista todos os usuários (com filtros opcionais)
router.get('/usuarios', (req, res) => exemploController.listarUsuarios(req, res));

// GET /usuarios/estatisticas - Estatísticas dos usuários
router.get('/usuarios/estatisticas', (req, res) => exemploController.estatisticas(req, res));

// GET /usuarios/:id - Busca um usuário específico
router.get('/usuarios/:id', (req, res) => exemploController.buscarUsuario(req, res));

// POST /usuarios - Cria um novo usuário (TRUSTED+)
router.post('/usuarios', requireTrusted, validate(criarUsuarioSchema), (req, res) => exemploController.criarUsuario(req, res));

// PUT /usuarios/:id - Atualiza um usuário existente (TRUSTED+)
router.put('/usuarios/:id', requireTrusted, validate(atualizarUsuarioSchema), (req, res) => exemploController.atualizarUsuario(req, res));

// DELETE /usuarios/:id - Remove um usuário (ADMIN ONLY)
router.delete('/usuarios/:id', requireAdmin, (req, res) => exemploController.deletarUsuario(req, res));

export default router;
