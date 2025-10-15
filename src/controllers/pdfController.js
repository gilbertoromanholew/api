import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('../utils/pdfParseWrapper.cjs');

export const readPDF = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo PDF foi enviado.' });
        }

        if (req.file.mimetype !== 'application/pdf') {
            return res.status(400).json({ error: 'O arquivo enviado não é um PDF válido.' });
        }

        // Extrai o texto do PDF
        const data = await pdfParse(req.file.buffer);
        
        res.status(200).json({
            success: true,
            text: data.text,
            pages: data.numpages,
        });
    } catch (error) {
        console.error('Erro ao processar PDF:', error);
        res.status(500).json({ error: 'Erro ao processar o arquivo PDF.', details: error.message });
    }
};

