import logger from '../config/logger.js';

/**
 * Middleware global de tratamento de erros
 * Captura todos os erros não tratados e retorna resposta padronizada
 * @param {Error} err - Objeto de erro
 * @param {Object} req - Request object do Express
 * @param {Object} res - Response object do Express
 * @param {Function} next - Função next do Express
 */
export const errorHandler = (err, req, res, next) => {
    logger.error('Global error handler capturou erro', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    
    // Erro de validação
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Erro de validação',
            details: err.message
        });
    }
    
    // Erro de sintaxe JSON (body mal formatado)
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            error: 'JSON inválido',
            message: 'O corpo da requisição contém JSON mal formatado'
        });
    }
    
    // Erro de arquivo muito grande (multer)
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            success: false,
            error: 'Arquivo muito grande',
            message: 'O arquivo enviado excede o tamanho máximo permitido'
        });
    }
    
    // Erro genérico
    const statusCode = err.status || err.statusCode || 500;
    const response = {
        success: false,
        error: err.message || 'Erro interno do servidor'
    };
    
    // Em desenvolvimento, incluir stack trace
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }
    
    res.status(statusCode).json(response);
};

/**
 * Handler para rotas não encontradas (404)
 * @param {Object} req - Request object do Express
 * @param {Object} res - Response object do Express
 */
export const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Rota não encontrada',
        message: `A rota ${req.method} ${req.url} não existe nesta API`,
        path: req.url,
        method: req.method,
        suggestion: 'Verifique a documentação em /docs para ver as rotas disponíveis'
    });
};
