import { Router } from 'express';
import { checkCPF, register, login, logout, getSession } from './authController.js';
import { requireAuth, optionalAuth } from './authMiddleware.js';
import { validate } from '../../middlewares/validator.js';

const router = Router();

/**
 * Schema de validação para check-cpf
 */
const checkCPFSchema = {
    required: ['cpf'],
    types: {
        cpf: 'string'
    }
};

/**
 * Schema de validação para register
 */
const registerSchema = {
    required: ['cpf', 'email', 'password', 'full_name'],
    types: {
        cpf: 'string',
        email: 'string',
        password: 'string',
        full_name: 'string',
        referral_code: 'string'
    },
    length: {
        full_name: { min: 3, max: 255 },
        referral_code: { min: 8, max: 8 }
    }
};

/**
 * Schema de validação para login
 */
const loginSchema = {
    required: ['email', 'password'],
    types: {
        email: 'string',
        password: 'string'
    }
};

/**
 * ROTAS PÚBLICAS
 */

// POST /auth/check-cpf - Verificar se CPF existe
router.post('/check-cpf', validate(checkCPFSchema), checkCPF);

// POST /auth/register - Cadastrar novo usuário
router.post('/register', validate(registerSchema), register);

// POST /auth/login - Fazer login
router.post('/login', validate(loginSchema), login);

/**
 * ROTAS AUTENTICADAS
 */

// POST /auth/logout - Fazer logout
router.post('/logout', optionalAuth, logout);

// GET /auth/session - Verificar sessão atual
router.get('/session', optionalAuth, getSession);

export default router;
