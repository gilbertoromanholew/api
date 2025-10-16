import { BaseController } from '../../core/BaseController.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('./pdfParseWrapper.cjs');

class PDFController extends BaseController {
    async readPDF(req, res) {
        return this.execute(req, res, async (req, res) => {
            if (!req.file) {
                return this.error(res, 'Nenhum arquivo PDF foi enviado', 400);
            }

            if (req.file.mimetype !== 'application/pdf') {
                return this.error(res, 'O arquivo enviado não é um PDF válido', 400);
            }

            // Extrai o texto do PDF
            const data = await pdfParse(req.file.buffer);
            
            this.success(res, {
                text: data.text,
                pages: data.numpages,
                info: data.info,
                metadata: data.metadata
            }, 'PDF processado com sucesso');
        });
    }
}

export const pdfController = new PDFController();
export const readPDF = (req, res) => pdfController.readPDF(req, res);
