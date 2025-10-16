import express from 'express';
import { validateCPF } from './cpfController.js';
import { validate, schemas } from '../../middlewares/validator.js';

const router = express.Router();

// Validação automática antes do controller
router.post('/validate-cpf', validate(schemas.cpf), validateCPF);

export default router;
