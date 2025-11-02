const { supabaseAdmin } = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Middleware para registrar ações administrativas no audit log
 * 
 * @param {string} actionType - Tipo da ação (ex: 'user.credits.add')
 * @param {string} targetType - Tipo do alvo (ex: 'user', 'tool', 'system')
 * @param {function} getTargetId - Função para extrair target_id do req
 * @param {function} getDetails - Função para extrair detalhes do req/res
 */
function auditLog(actionType, targetType, getTargetId = null, getDetails = null) {
    return async (req, res, next) => {
        // Salvar o res.json original
        const originalJson = res.json.bind(res);

        // Override res.json para capturar resposta
        res.json = function (body) {
            // Só registrar se a operação foi bem-sucedida
            if (body.success) {
                // Executar log de auditoria de forma assíncrona (não bloqueia resposta)
                setImmediate(async () => {
                    try {
                        const targetId = getTargetId ? getTargetId(req, body) : null;
                        const details = getDetails ? getDetails(req, body) : {};

                        // Extrair IP e User-Agent
                        const ipAddress = req.ip || req.connection.remoteAddress;
                        const userAgent = req.get('user-agent') || 'Unknown';

                        // Inserir no audit log
                        const { error } = await supabaseAdmin
                            .from('admin_audit_log')
                            .insert({
                                admin_id: req.user.id,
                                action_type: actionType,
                                target_type: targetType,
                                target_id: targetId,
                                details: details,
                                ip_address: ipAddress,
                                user_agent: userAgent
                            });

                        if (error) {
                            logger.error('Erro ao registrar audit log', {
                                error: error.message,
                                actionType,
                                adminId: req.user.id
                            });
                        } else {
                            logger.info('Audit log registrado', {
                                actionType,
                                adminId: req.user.id,
                                targetType,
                                targetId
                            });
                        }
                    } catch (err) {
                        logger.error('Exceção ao registrar audit log', {
                            error: err.message,
                            actionType
                        });
                    }
                });
            }

            // Chamar o res.json original
            return originalJson(body);
        };

        next();
    };
}

/**
 * Funções auxiliares para extração de dados
 */

// Extrair ID do usuário dos params
const getUserId = (req) => req.params.id;

// Extrair detalhes de alteração de créditos
const getCreditsDetails = (req, res) => ({
    action: req.body.action || 'add',
    amount: req.body.amount,
    type: req.body.type || 'bonus',
    reason: req.body.reason || 'N/A',
    previous_balance: res.data?.previous_balance || 0,
    new_balance: res.data?.new_balance || 0
});

// Extrair detalhes de alteração de role
const getRoleDetails = (req, res) => ({
    previous_role: res.data?.previous_role || 'unknown',
    new_role: req.body.role,
    target_user_name: res.data?.full_name || 'N/A'
});

// Extrair detalhes de desativação de usuário
const getDeactivateDetails = (req, res) => ({
    reason: req.body.reason || 'N/A',
    target_user_name: res.data?.full_name || 'N/A'
});

// Extrair detalhes genéricos do body
const getBodyDetails = (req) => ({
    ...req.body,
    timestamp: new Date().toISOString()
});

module.exports = {
    auditLog,
    // Helpers
    getUserId,
    getCreditsDetails,
    getRoleDetails,
    getDeactivateDetails,
    getBodyDetails
};
