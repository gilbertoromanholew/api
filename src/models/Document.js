/**
 * Model de exemplo: Document
 * 
 * Representa um documento PDF ou outro tipo de arquivo.
 */

export class Document {
    constructor(data) {
        this.id = data.id || null;
        this.filename = data.filename || '';
        this.originalName = data.originalName || '';
        this.mimeType = data.mimeType || '';
        this.size = data.size || 0;
        this.text = data.text || '';
        this.pages = data.pages || 0;
        this.uploadedBy = data.uploadedBy || null;
        this.createdAt = data.createdAt || new Date();
    }

    // Validar documento
    validate() {
        const errors = [];

        if (!this.filename) {
            errors.push('Nome do arquivo é obrigatório');
        }

        if (!this.mimeType) {
            errors.push('Tipo de arquivo é obrigatório');
        }

        if (this.mimeType === 'application/pdf' && this.pages === 0) {
            errors.push('PDF deve ter pelo menos 1 página');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    // Verificar se é PDF
    isPDF() {
        return this.mimeType === 'application/pdf';
    }

    // Retornar informações básicas
    toJSON() {
        return {
            id: this.id,
            filename: this.filename,
            originalName: this.originalName,
            mimeType: this.mimeType,
            size: this.size,
            pages: this.pages,
            createdAt: this.createdAt,
            // text não é retornado por padrão (pode ser muito grande)
        };
    }

    // Retornar informações completas (incluindo texto)
    toFullJSON() {
        return {
            ...this.toJSON(),
            text: this.text,
        };
    }
}

export default Document;
