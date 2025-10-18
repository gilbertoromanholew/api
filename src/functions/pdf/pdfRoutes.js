import express from 'express';
import multer from 'multer';
import { readPDF } from './pdfController.js';
import { requireTrusted } from '../../middlewares/accessLevel.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /read-pdf - Upload e leitura de PDF (TRUSTED+)
router.post('/read-pdf', requireTrusted, upload.single('pdf'), readPDF);

export default router;
