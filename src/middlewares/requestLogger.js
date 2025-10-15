import logger from '../config/logger.js';

/**
 * Middleware para logging de requisições HTTP
 */
export const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    // Log quando a requisição é recebida
    logger.http(`${req.method} ${req.path} - IP: ${req.ip}`);
    
    // Log quando a resposta é enviada
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.http(
            `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`
        );
    });
    
    next();
};

export default requestLogger;
