import express from 'express';
import { calcular } from './calculoController.js';
import { validate, schemas } from '../../middlewares/validator.js';

const router = express.Router();

// Validação automática antes do controller
router.post('/calcular', validate(schemas.calculo), calcular);

export default router;
