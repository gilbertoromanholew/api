import express from 'express';
import { getProfile, updateProfile, getStats, getReferrals } from './userController.js';
import { requireAuth } from '../../middlewares/adminAuth.js';
// Fase 2: Usar schemas Joi em vez de validação manual
import { validate, updateProfileSchema } from '../../validators/schemas.js';

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
    validate(updateProfileSchema), // Fase 2: Usar schema Joi
    updateProfile
);

// GET /api/user/stats - Estatísticas do usuário
router.get('/stats', requireAuth, getStats);

// GET /api/user/referrals - Lista de indicações
router.get('/referrals', requireAuth, getReferrals);

export default router;
