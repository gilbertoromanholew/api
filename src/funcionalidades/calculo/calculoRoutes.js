import express from 'express';
import { calcular } from './calculoController.js';

const router = express.Router();

router.post('/calcular', calcular);

export default router;
