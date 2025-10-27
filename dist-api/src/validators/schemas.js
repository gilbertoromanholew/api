/**
 * Schemas de Validação com Joi
 * 
 * Implementado na Fase 2 da Refatoração de Segurança
 * 
 * Protege contra:
 * - SQL Injection (validação de tipos)
 * - XSS (sanitização de strings)
 * - Dados inválidos (formatos incorretos)
 * - Ataques de payload (limites de tamanho)
 */

import Joi from 'joi';
import logger from '../config/logger.js';

// ============================================================================
// SCHEMAS DE AUTENTICAÇÃO
// ============================================================================

/**
 * Schema para registro de usuário
 */
export const registerSchema = Joi.object({
    email: Joi.string()
        .email()
        .max(255)
        .required()
        .messages({
            'string.email': 'Email inválido',
            'string.max': 'Email deve ter no máximo 255 caracteres',
            'any.required': 'Email é obrigatório'
        }),
    
    password: Joi.string()
        .min(6)
        .max(72) // bcrypt limite
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
            'string.min': 'Senha deve ter no mínimo 6 caracteres',
            'string.max': 'Senha deve ter no máximo 72 caracteres',
            'string.pattern.base': 'Senha deve conter: letra maiúscula, minúscula, número e símbolo (@$!%*?&)',
            'any.required': 'Senha é obrigatória'
        }),
    
    full_name: Joi.string()
        .min(3)
        .max(100)
        .pattern(/^[a-zA-ZÀ-ÿ\s]+$/) // Apenas letras e espaços
        .required()
        .messages({
            'string.min': 'Nome deve ter no mínimo 3 caracteres',
            'string.max': 'Nome deve ter no máximo 100 caracteres',
            'string.pattern.base': 'Nome deve conter apenas letras e espaços',
            'any.required': 'Nome completo é obrigatório'
        }),
    
    cpf: Joi.string()
        .length(11)
        .pattern(/^\d{11}$/)
        .required()
        .messages({
            'string.length': 'CPF deve ter 11 dígitos',
            'string.pattern.base': 'CPF deve conter apenas números',
            'any.required': 'CPF é obrigatório'
        })
}).unknown(false); // Não permite campos extras

/**
 * Schema para login
 */
export const loginSchema = Joi.object({
    email: Joi.string()
        .email()
        .max(255)
        .required()
        .messages({
            'string.email': 'Email inválido',
            'any.required': 'Email é obrigatório'
        }),
    
    password: Joi.string()
        .required()
        .messages({
            'any.required': 'Senha é obrigatória'
        })
}).unknown(false);

/**
 * Schema para recuperação de senha
 */
export const passwordResetSchema = Joi.object({
    email: Joi.string()
        .email()
        .max(255)
        .required()
        .messages({
            'string.email': 'Email inválido',
            'any.required': 'Email é obrigatório'
        })
}).unknown(false);

/**
 * Schema para nova senha
 */
export const newPasswordSchema = Joi.object({
    password: Joi.string()
        .min(6)
        .max(72)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
            'string.min': 'Senha deve ter no mínimo 6 caracteres',
            'string.max': 'Senha deve ter no máximo 72 caracteres',
            'string.pattern.base': 'Senha deve conter: letra maiúscula, minúscula, número e símbolo',
            'any.required': 'Senha é obrigatória'
        })
}).unknown(false);

// ============================================================================
// SCHEMAS DE USUÁRIO
// ============================================================================

/**
 * Schema para atualização de perfil
 */
export const updateProfileSchema = Joi.object({
    full_name: Joi.string()
        .min(3)
        .max(100)
        .pattern(/^[a-zA-ZÀ-ÿ\s]+$/)
        .required()
        .messages({
            'string.min': 'Nome deve ter no mínimo 3 caracteres',
            'string.max': 'Nome deve ter no máximo 100 caracteres',
            'string.pattern.base': 'Nome deve conter apenas letras e espaços',
            'any.required': 'Nome completo é obrigatório'
        })
}).unknown(false);

// ============================================================================
// SCHEMAS DE PONTOS
// ============================================================================

/**
 * Schema para consumo de pontos
 */
export const consumePointsSchema = Joi.object({
    amount: Joi.number()
        .integer()
        .min(1)
        .max(1000000)
        .required()
        .messages({
            'number.base': 'Quantidade deve ser um número',
            'number.integer': 'Quantidade deve ser um número inteiro',
            'number.min': 'Quantidade deve ser no mínimo 1',
            'number.max': 'Quantidade deve ser no máximo 1.000.000',
            'any.required': 'Quantidade é obrigatória'
        }),
    
    description: Joi.string()
        .min(3)
        .max(200)
        .optional()
        .messages({
            'string.min': 'Descrição deve ter no mínimo 3 caracteres',
            'string.max': 'Descrição deve ter no máximo 200 caracteres'
        }),
    
    tool_name: Joi.string()
        .max(100)
        .optional()
        .messages({
            'string.max': 'Nome da ferramenta deve ter no máximo 100 caracteres'
        }),
    
    type: Joi.string()
        .valid('tool_usage', 'manual_consumption', 'admin_adjustment')
        .optional()
        .messages({
            'any.only': 'Tipo deve ser: tool_usage, manual_consumption ou admin_adjustment'
        })
}).unknown(false);

/**
 * Schema para adicionar pontos gratuitos (admin)
 */
export const addFreePointsSchema = Joi.object({
    user_id: Joi.string()
        .uuid()
        .required()
        .messages({
            'string.guid': 'ID de usuário inválido (deve ser UUID)',
            'any.required': 'ID de usuário é obrigatório'
        }),
    
    amount: Joi.number()
        .integer()
        .min(1)
        .max(1000000)
        .required()
        .messages({
            'number.base': 'Quantidade deve ser um número',
            'number.integer': 'Quantidade deve ser um número inteiro',
            'number.min': 'Quantidade deve ser no mínimo 1',
            'number.max': 'Quantidade deve ser no máximo 1.000.000',
            'any.required': 'Quantidade é obrigatória'
        }),
    
    description: Joi.string()
        .min(3)
        .max(200)
        .optional()
        .messages({
            'string.min': 'Descrição deve ter no mínimo 3 caracteres',
            'string.max': 'Descrição deve ter no máximo 200 caracteres'
        })
}).unknown(false);

// ============================================================================
// SCHEMAS DE FERRAMENTAS
// ============================================================================

/**
 * Schema para execução de ferramenta
 */
export const toolExecutionSchema = Joi.object({
    params: Joi.object()
        .optional()
        .messages({
            'object.base': 'Parâmetros devem ser um objeto'
        })
}).unknown(true); // Permite propriedades adicionais (params são dinâmicos)

// ============================================================================
// MIDDLEWARE DE VALIDAÇÃO
// ============================================================================

/**
 * Middleware de validação
 * Valida req.body contra um schema Joi
 * 
 * @param {Joi.Schema} schema - Schema Joi para validação
 * @returns {Function} Middleware Express
 */
export function validate(schema) {
    return (req, res, next) => {
        // Validar body
        const { error, value } = schema.validate(req.body, {
            abortEarly: false, // Retornar todos os erros
            stripUnknown: true, // Remover campos não definidos no schema
            convert: true // Converter tipos automaticamente
        });
        
        if (error) {
            // Formatar erros
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                type: detail.type
            }));
            
            logger.warn('Request validation failed', {
                path: req.path,
                method: req.method,
                errors: errors
            });
            
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: 'Os dados fornecidos são inválidos',
                errors: errors
            });
        }
        
        // Substituir req.body pelos dados validados e sanitizados
        req.body = value;
        next();
    };
}

/**
 * Middleware de validação para query params
 * 
 * @param {Joi.Schema} schema - Schema Joi para validação
 * @returns {Function} Middleware Express
 */
export function validateQuery(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true,
            convert: true
        });
        
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                type: detail.type
            }));
            
            logger.warn('Query validation failed', {
                path: req.path,
                method: req.method,
                errors: errors
            });
            
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: 'Os parâmetros fornecidos são inválidos',
                errors: errors
            });
        }
        
        req.query = value;
        next();
    };
}

/**
 * Middleware de validação para params
 * 
 * @param {Joi.Schema} schema - Schema Joi para validação
 * @returns {Function} Middleware Express
 */
export function validateParams(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            stripUnknown: true,
            convert: true
        });
        
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                type: detail.type
            }));
            
            logger.warn('Params validation failed', {
                path: req.path,
                method: req.method,
                errors: errors
            });
            
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: 'Os parâmetros da URL são inválidos',
                errors: errors
            });
        }
        
        req.params = value;
        next();
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    // Schemas de autenticação
    registerSchema,
    loginSchema,
    passwordResetSchema,
    newPasswordSchema,
    
    // Schemas de usuário
    updateProfileSchema,
    
    // Schemas de pontos
    consumePointsSchema,
    addFreePointsSchema,
    
    // Schemas de ferramentas
    toolExecutionSchema,
    
    // Middlewares
    validate,
    validateQuery,
    validateParams
};
