import express from 'express';
import { getProfile, updateProfile, getStats, getReferrals } from './userController.js';
import { requireAuth } from '../auth/authMiddleware.js';
import { validate } from '../../middlewares/validator.js';

const router = express.Router();

/**
 * Todas as rotas de usuário requerem autenticação
 */

// GET /api/user/profile - Perfil completo
router.get('/profile', requireAuth, getProfile);

// PUT /api/user/profile - Atualizar perfil (nome)
router.put(
    '/profile',
    requireAuth,
    validate({
        type: 'object',
        properties: {
            full_name: { type: 'string', minLength: 3, maxLength: 100 }
        },
        required: ['full_name'],
        additionalProperties: false
    }),
    updateProfile
);

// GET /api/user/stats - Estatísticas do usuário
router.get('/stats', requireAuth, getStats);

// GET /api/user/referrals - Lista de indicações
router.get('/referrals', requireAuth, getReferrals);

export default router;
