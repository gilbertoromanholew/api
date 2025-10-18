import express from 'express';
import multer from 'multer';
import { readPDF } from './pdfController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /read-pdf - Upload e leitura de PDF
router.post('/read-pdf', upload.single('pdf'), readPDF);

export default router;
