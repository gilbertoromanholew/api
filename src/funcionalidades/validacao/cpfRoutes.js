import express from 'express';
import { validateCPF } from './cpfController.js';

const router = express.Router();

router.post('/validate-cpf', validateCPF);

export default router;
