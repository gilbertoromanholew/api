/**
 * Middleware de validação genérico
 * Valida requisições baseado em um schema de validação
 * @param {Object} schema - Esquema de validação
 * @returns {Function} Middleware do Express
 */
export const validate = (schema) => {
    return (req, res, next) => {
        const errors = [];
        
        // Validar campos obrigatórios
        if (schema.required) {
            for (const field of schema.required) {
                if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
                    errors.push(`Campo '${field}' é obrigatório`);
                }
            }
        }
        
        // Validar tipos
        if (schema.types) {
            for (const [field, type] of Object.entries(schema.types)) {
                if (req.body[field] !== undefined) {
                    const value = req.body[field];
                    
                    if (type === 'number' && isNaN(Number(value))) {
                        errors.push(`Campo '${field}' deve ser um número`);
                    }
                    
                    if (type === 'string' && typeof value !== 'string') {
                        errors.push(`Campo '${field}' deve ser uma string`);
                    }
                    
                    if (type === 'boolean' && typeof value !== 'boolean') {
                        errors.push(`Campo '${field}' deve ser um booleano`);
                    }
                    
                    if (type === 'array' && !Array.isArray(value)) {
                        errors.push(`Campo '${field}' deve ser um array`);
                    }
                }
            }
        }
        
        // Validar valores permitidos (enum)
        if (schema.enum) {
            for (const [field, allowedValues] of Object.entries(schema.enum)) {
                if (req.body[field] && !allowedValues.includes(req.body[field])) {
                    errors.push(`Campo '${field}' deve ser um dos valores: ${allowedValues.join(', ')}`);
                }
            }
        }
        
        // Validar tamanhos (min/max length)
        if (schema.length) {
            for (const [field, { min, max }] of Object.entries(schema.length)) {
                const value = req.body[field];
                if (value) {
                    const len = String(value).length;
                    if (min && len < min) {
                        errors.push(`Campo '${field}' deve ter no mínimo ${min} caracteres`);
                    }
                    if (max && len > max) {
                        errors.push(`Campo '${field}' deve ter no máximo ${max} caracteres`);
                    }
                }
            }
        }
        
        // Se houver erros, retornar 400
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Erro de validação',
                errors: errors
            });
        }
        
        next();
    };
};

/**
 * Schemas de validação pré-definidos para reutilização
 */
export const schemas = {
    // Validação de CPF
    cpf: {
        required: ['cpf'],
        types: {
            cpf: 'string'
        },
        length: {
            cpf: { min: 11, max: 14 }
        }
    },
    
    // Validação de cálculo
    calculo: {
        required: ['operacao', 'a', 'b'],
        types: {
            a: 'number',
            b: 'number',
            operacao: 'string'
        },
        enum: {
            operacao: ['somar', 'subtrair', 'multiplicar', 'dividir', 'porcentagem']
        }
    }
};
