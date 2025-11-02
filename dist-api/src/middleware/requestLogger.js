/**
 * ============================================
 * MIDDLEWARE: REQUEST LOGGER
 * ============================================
 * Registra todas as requisições à API na tabela admin_access_logs
 * Para monitoramento, auditoria e análise de segurança
 * ============================================
 */

import { supabaseAdmin } from '../config/supabase.js';
import logger from '../config/logger.js';

/**
 * Middleware que registra todos os acessos à API
 * 
 * Informações registradas:
 * - IP do cliente
 * - Endpoint acessado
 * - Método HTTP
 * - Se foi autorizado ou negado
 * - ID do usuário (se autenticado)
 * - Detalhes adicionais (user agent, query params, etc)
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response  
 * @param {Function} next - Express next middleware
 */
export const requestLogger = (req, res, next) => {
    // ⚠️ IMPORTANTE: Não logar as próprias rotas de logs para evitar recursão infinita
    const endpoint = req.originalUrl || req.url;
    if (endpoint.includes('/admin/logs') || endpoint.includes('/health')) {
        return next();
    }

    // Capturar dados da requisição
    const requestData = {
        ip: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0]?.trim(),
        endpoint: endpoint,
        method: req.method,
        userAgent: req.headers['user-agent'],
        referer: req.headers['referer'],
        queryParams: req.query,
        timestamp: new Date()
    };

    // Interceptar a resposta para saber se foi autorizada
    const originalSend = res.send;
    const originalJson = res.json;
    let responseLogged = false;

    // Função para registrar o log
    const logRequest = async (authorized) => {
        if (responseLogged) return; // Evita duplicação
        responseLogged = true;

        try {
            // Preparar dados para inserção
            const logEntry = {
                timestamp: requestData.timestamp.toISOString(),
                ip: requestData.ip,
                endpoint: requestData.endpoint,
                method: requestData.method,
                authorized: authorized,
                user_id: req.user?.id || null, // ID do usuário se autenticado
                details: {
                    userAgent: requestData.userAgent,
                    referer: requestData.referer,
                    queryParams: requestData.queryParams,
                    statusCode: res.statusCode
                }
            };

            // Inserir no Supabase (usando service_role key, ignora RLS)
            const { error } = await supabaseAdmin
                .from('admin_access_logs')
                .insert([logEntry]);

            if (error) {
                logger.error('❌ Erro ao registrar log de acesso:', {
                    error: error.message,
                    endpoint: requestData.endpoint
                });
            } else {
                logger.debug('📝 Log de acesso registrado:', {
                    endpoint: requestData.endpoint,
                    method: requestData.method,
                    authorized: authorized,
                    statusCode: res.statusCode
                });
            }
        } catch (err) {
            logger.error('❌ Exceção ao registrar log:', {
                error: err.message,
                endpoint: requestData.endpoint
            });
        }
    };

    // Sobrescrever res.send
    res.send = function(data) {
        const authorized = res.statusCode >= 200 && res.statusCode < 400;
        logRequest(authorized).catch(err => 
            logger.error('Erro async ao logar requisição:', err)
        );
        return originalSend.call(this, data);
    };

    // Sobrescrever res.json
    res.json = function(data) {
        const authorized = res.statusCode >= 200 && res.statusCode < 400;
        logRequest(authorized).catch(err => 
            logger.error('Erro async ao logar requisição:', err)
        );
        return originalJson.call(this, data);
    };

    // Também capturar erros que não passam por send/json
    res.on('finish', () => {
        if (!responseLogged) {
            const authorized = res.statusCode >= 200 && res.statusCode < 400;
            logRequest(authorized).catch(err => 
                logger.error('Erro async ao logar requisição (finish):', err)
            );
        }
    });

    next();
};

/**
 * Versão seletiva do logger - apenas rotas específicas
 * Use quando quiser logar apenas certos endpoints
 */
export const selectiveRequestLogger = (options = {}) => {
    const {
        includeRoutes = [],  // Array de regex ou strings
        excludeRoutes = [],  // Array de regex ou strings
        logOnlyErrors = false // Se true, só loga erros (4xx, 5xx)
    } = options;

    return (req, res, next) => {
        const endpoint = req.originalUrl || req.url;

        // Verificar se deve logar
        let shouldLog = true;

        // Verificar exclusões
        if (excludeRoutes.length > 0) {
            shouldLog = !excludeRoutes.some(route => {
                if (route instanceof RegExp) {
                    return route.test(endpoint);
                }
                return endpoint.includes(route);
            });
        }

        // Verificar inclusões (tem prioridade)
        if (includeRoutes.length > 0) {
            shouldLog = includeRoutes.some(route => {
                if (route instanceof RegExp) {
                    return route.test(endpoint);
                }
                return endpoint.includes(route);
            });
        }

        if (!shouldLog) {
            return next();
        }

        // Se chegou aqui, aplicar o logger
        return requestLogger(req, res, next);
    };
};

/**
 * Logger apenas para rotas administrativas
 */
export const adminRequestLogger = selectiveRequestLogger({
    includeRoutes: ['/admin', '/api/admin']
});

/**
 * Logger apenas para falhas de autenticação
 */
export const authFailureLogger = (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
        // Se for resposta de erro de autenticação, logar
        if (res.statusCode === 401 || res.statusCode === 403) {
            requestLogger(req, res, () => {});
        }
        return originalJson.call(this, data);
    };
    
    next();
};

export default requestLogger;
