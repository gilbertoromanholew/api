import express from 'express';
import multer from 'multer';
import { readPDF } from './pdfController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/read-pdf', upload.single('pdf'), readPDF);

export default router;
