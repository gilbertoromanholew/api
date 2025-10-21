/**
 * Serviço de Auditoria
 * 
 * Implementado na Fase 3 da Refatoração de Segurança
 * 
 * Responsabilidades:
 * - Registrar eventos de autenticação (login, logout, register, etc)
 * - Registrar operações de usuários (execução de ferramentas, consumo de pontos, etc)
 * - Registrar violações de rate limiting
 * - Fornecer estatísticas de auditoria
 * 
 * IMPORTANTE: Este serviço usa Supabase Service Role Key para inserir logs
 * sem restrições de RLS, mas as consultas respeitam RLS (usuários só veem seus logs)
 */

import { createClient } from '@supabase/supabase-js';

// Cliente Supabase com Service Role (bypass RLS para inserção)
const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_INTERNAL_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error('⚠️ SUPABASE_SERVICE_ROLE_KEY não configurada! Auditoria não funcionará.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// ============================================================================
// EVENTOS DE AUTENTICAÇÃO
// ============================================================================

/**
 * Registrar evento de autenticação
 * 
 * @param {Object} data - Dados do evento
 * @param {string} data.userId - ID do usuário (opcional para tentativas falhadas)
 * @param {string} data.action - Tipo de ação (login, logout, register, failed_login, etc)
 * @param {string} data.ip - IP do usuário
 * @param {string} data.userAgent - User-Agent do browser
 * @param {boolean} data.success - Se a ação foi bem-sucedida (padrão: true)
 * @param {string} data.error - Mensagem de erro (opcional)
 * @param {Object} data.metadata - Dados adicionais (opcional)
 * @returns {Promise<void>}
 */
export async function logAuthEvent(data) {
    try {
        const { error } = await supabase
            .from('auth_audit_log')
            .insert({
                user_id: data.userId || null,
                action: data.action,
                ip_address: data.ip || null,
                user_agent: data.userAgent || null,
                country: data.country || null,
                city: data.city || null,
                success: data.success !== false,
                error_message: data.error || null,
                metadata: data.metadata || null
            });
        
        if (error) {
            console.error('[Audit] Erro ao registrar evento de autenticação:', error);
        } else {
            console.log(`[Audit] ✅ Auth event logged: ${data.action} (success: ${data.success !== false})`);
        }
    } catch (error) {
        console.error('[Audit] Exception ao registrar evento de autenticação:', error);
    }
}

/**
 * Registrar login bem-sucedido
 */
export async function logLogin(userId, ip, userAgent) {
    return logAuthEvent({
        userId,
        action: 'login',
        ip,
        userAgent,
        success: true
    });
}

/**
 * Registrar tentativa de login falhada
 */
export async function logFailedLogin(email, ip, userAgent, error) {
    return logAuthEvent({
        action: 'failed_login',
        ip,
        userAgent,
        success: false,
        error: error,
        metadata: { email } // Não armazenar email em produção se não for necessário
    });
}

/**
 * Registrar logout
 */
export async function logLogout(userId, ip, userAgent) {
    return logAuthEvent({
        userId,
        action: 'logout',
        ip,
        userAgent,
        success: true
    });
}

/**
 * Registrar novo registro
 */
export async function logRegister(userId, ip, userAgent) {
    return logAuthEvent({
        userId,
        action: 'register',
        ip,
        userAgent,
        success: true
    });
}

/**
 * Registrar tentativa de registro falhada
 */
export async function logFailedRegister(email, ip, userAgent, error) {
    return logAuthEvent({
        action: 'failed_register',
        ip,
        userAgent,
        success: false,
        error: error,
        metadata: { email }
    });
}

/**
 * Registrar reset de senha
 */
export async function logPasswordReset(userId, ip, userAgent) {
    return logAuthEvent({
        userId,
        action: 'password_reset',
        ip,
        userAgent,
        success: true
    });
}

/**
 * Registrar mudança de senha
 */
export async function logPasswordChange(userId, ip, userAgent) {
    return logAuthEvent({
        userId,
        action: 'password_change',
        ip,
        userAgent,
        success: true
    });
}

// ============================================================================
// OPERAÇÕES DE USUÁRIOS
// ============================================================================

/**
 * Registrar operação de usuário
 * 
 * @param {Object} data - Dados da operação
 * @param {string} data.userId - ID do usuário
 * @param {string} data.operation - Tipo de operação (tool_execution, points_consumption, etc)
 * @param {string} data.resource - Recurso afetado (optional)
 * @param {Object} data.details - Detalhes da operação (optional)
 * @param {string} data.ip - IP do usuário
 * @param {string} data.userAgent - User-Agent
 * @param {number} data.executionTime - Tempo de execução em ms (optional)
 * @param {boolean} data.success - Se foi bem-sucedida (padrão: true)
 * @param {string} data.error - Mensagem de erro (optional)
 * @param {Object} data.metadata - Metadados adicionais (optional)
 * @returns {Promise<void>}
 */
export async function logOperation(data) {
    try {
        const { error } = await supabase
            .from('operations_audit_log')
            .insert({
                user_id: data.userId,
                operation: data.operation,
                resource: data.resource || null,
                details: data.details || null,
                ip_address: data.ip || null,
                user_agent: data.userAgent || null,
                execution_time_ms: data.executionTime || null,
                success: data.success !== false,
                error_message: data.error || null,
                metadata: data.metadata || null
            });
        
        if (error) {
            console.error('[Audit] Erro ao registrar operação:', error);
        } else {
            console.log(`[Audit] ✅ Operation logged: ${data.operation} on ${data.resource || 'N/A'} (${data.executionTime || 0}ms)`);
        }
    } catch (error) {
        console.error('[Audit] Exception ao registrar operação:', error);
    }
}

/**
 * Registrar execução de ferramenta
 */
export async function logToolExecution(userId, toolName, params, ip, userAgent, executionTime, success = true, error = null) {
    return logOperation({
        userId,
        operation: 'tool_execution',
        resource: toolName,
        details: { params },
        ip,
        userAgent,
        executionTime,
        success,
        error
    });
}

/**
 * Registrar consumo de pontos
 */
export async function logPointsConsumption(userId, amount, description, ip, userAgent) {
    return logOperation({
        userId,
        operation: 'points_consumption',
        resource: 'points',
        details: { amount, description },
        ip,
        userAgent,
        success: true
    });
}

/**
 * Registrar atualização de perfil
 */
export async function logProfileUpdate(userId, changes, ip, userAgent) {
    return logOperation({
        userId,
        operation: 'profile_update',
        resource: 'profile',
        details: { changes },
        ip,
        userAgent,
        success: true
    });
}

// ============================================================================
// VIOLAÇÕES DE RATE LIMITING
// ============================================================================

/**
 * Registrar violação de rate limiting
 * 
 * @param {Object} data - Dados da violação
 * @param {string} data.ip - IP do violador
 * @param {string} data.userId - ID do usuário (opcional)
 * @param {string} data.endpoint - Endpoint bloqueado
 * @param {string} data.limiterType - Tipo de rate limiter (auth, register, api, etc)
 * @param {number} data.attempts - Número de tentativas
 * @param {string} data.userAgent - User-Agent
 * @param {Object} data.metadata - Metadados adicionais (opcional)
 * @returns {Promise<void>}
 */
export async function logRateLimitViolation(data) {
    try {
        const { error } = await supabase
            .from('rate_limit_violations')
            .insert({
                ip_address: data.ip,
                user_id: data.userId || null,
                endpoint: data.endpoint,
                limiter_type: data.limiterType,
                attempts: data.attempts || null,
                user_agent: data.userAgent || null,
                metadata: data.metadata || null
            });
        
        if (error) {
            console.error('[Audit] Erro ao registrar violação de rate limit:', error);
        } else {
            console.warn(`[Audit] ⚠️ Rate limit violation: ${data.limiterType} on ${data.endpoint} (IP: ${data.ip})`);
        }
    } catch (error) {
        console.error('[Audit] Exception ao registrar violação de rate limit:', error);
    }
}

// ============================================================================
// MIDDLEWARE DE AUDITORIA AUTOMÁTICA
// ============================================================================

/**
 * Middleware para auditoria automática de operações
 * Registra automaticamente a operação quando a resposta é enviada
 * 
 * @param {string} operation - Tipo de operação
 * @param {string} resource - Recurso (opcional)
 * @returns {Function} Middleware Express
 */
export function auditMiddleware(operation, resource = null) {
    return async (req, res, next) => {
        const startTime = Date.now();
        
        // Interceptar res.json para capturar resultado
        const originalJson = res.json.bind(res);
        
        res.json = function(body) {
            const executionTime = Date.now() - startTime;
            
            // Registrar operação (async, não bloqueia resposta)
            logOperation({
                userId: req.userId || req.user?.id,
                operation: operation,
                resource: resource,
                details: {
                    method: req.method,
                    path: req.path,
                    query: req.query,
                    // Não registrar body completo (pode ter dados sensíveis)
                    // body: req.body
                },
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                executionTime: executionTime,
                success: body.success !== false,
                error: body.error || null
            }).catch(err => console.error('[Audit] Failed to log operation:', err));
            
            return originalJson(body);
        };
        
        next();
    };
}

// ============================================================================
// CONSULTAS E ESTATÍSTICAS
// ============================================================================

/**
 * Obter estatísticas de auditoria para um usuário
 * 
 * @param {string} userId - ID do usuário (opcional, null = todos)
 * @returns {Promise<Object>} Estatísticas
 */
export async function getAuditStats(userId = null) {
    try {
        const { data, error } = await supabase
            .rpc('get_audit_stats', { user_id_param: userId });
        
        if (error) {
            console.error('[Audit] Erro ao obter estatísticas:', error);
            return null;
        }
        
        return data[0];
    } catch (error) {
        console.error('[Audit] Exception ao obter estatísticas:', error);
        return null;
    }
}

/**
 * Obter tentativas de login falhadas (últimas 24h)
 * 
 * @returns {Promise<Array>} Lista de tentativas falhadas
 */
export async function getFailedLoginAttempts() {
    try {
        const { data, error } = await supabase
            .from('failed_login_attempts_24h')
            .select('*')
            .limit(100);
        
        if (error) {
            console.error('[Audit] Erro ao obter tentativas falhadas:', error);
            return [];
        }
        
        return data;
    } catch (error) {
        console.error('[Audit] Exception ao obter tentativas falhadas:', error);
        return [];
    }
}

/**
 * Obter atividades suspeitas (múltiplos IPs)
 * 
 * @returns {Promise<Array>} Lista de atividades suspeitas
 */
export async function getSuspiciousActivities() {
    try {
        const { data, error } = await supabase
            .from('suspicious_activities')
            .select('*')
            .limit(100);
        
        if (error) {
            console.error('[Audit] Erro ao obter atividades suspeitas:', error);
            return [];
        }
        
        return data;
    } catch (error) {
        console.error('[Audit] Exception ao obter atividades suspeitas:', error);
        return [];
    }
}

/**
 * Obter top violadores de rate limit
 * 
 * @returns {Promise<Array>} Lista de violadores
 */
export async function getTopRateLimitViolators() {
    try {
        const { data, error } = await supabase
            .from('top_rate_limit_violators')
            .select('*')
            .limit(100);
        
        if (error) {
            console.error('[Audit] Erro ao obter violadores de rate limit:', error);
            return [];
        }
        
        return data;
    } catch (error) {
        console.error('[Audit] Exception ao obter violadores de rate limit:', error);
        return [];
    }
}

/**
 * Obter logs de autenticação de um usuário
 * 
 * @param {string} userId - ID do usuário
 * @param {number} limit - Limite de registros (padrão: 50)
 * @returns {Promise<Array>} Lista de logs
 */
export async function getUserAuthLogs(userId, limit = 50) {
    try {
        const { data, error } = await supabase
            .from('auth_audit_log')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) {
            console.error('[Audit] Erro ao obter logs de autenticação:', error);
            return [];
        }
        
        return data;
    } catch (error) {
        console.error('[Audit] Exception ao obter logs de autenticação:', error);
        return [];
    }
}

/**
 * Obter logs de operações de um usuário
 * 
 * @param {string} userId - ID do usuário
 * @param {number} limit - Limite de registros (padrão: 50)
 * @returns {Promise<Array>} Lista de logs
 */
export async function getUserOperationLogs(userId, limit = 50) {
    try {
        const { data, error } = await supabase
            .from('operations_audit_log')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) {
            console.error('[Audit] Erro ao obter logs de operações:', error);
            return [];
        }
        
        return data;
    } catch (error) {
        console.error('[Audit] Exception ao obter logs de operações:', error);
        return [];
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    // Auth events
    logAuthEvent,
    logLogin,
    logFailedLogin,
    logLogout,
    logRegister,
    logFailedRegister,
    logPasswordReset,
    logPasswordChange,
    
    // Operations
    logOperation,
    logToolExecution,
    logPointsConsumption,
    logProfileUpdate,
    
    // Rate limiting
    logRateLimitViolation,
    
    // Middleware
    auditMiddleware,
    
    // Queries
    getAuditStats,
    getFailedLoginAttempts,
    getSuspiciousActivities,
    getTopRateLimitViolators,
    getUserAuthLogs,
    getUserOperationLogs
};
