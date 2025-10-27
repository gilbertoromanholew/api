/**
 * ============================================
 * 👥 USER PRESENCE SERVICE
 * ============================================
 * Serviço para rastreamento de presença online
 * Integrado com WebSocket para status em tempo real
 * ============================================
 */

import { supabase, supabaseAdmin } from '../config/supabase.js';
import logger from '../config/logger.js';

/**
 * Marcar usuário como online
 * 
 * @param {string} userId - ID do usuário
 * @param {string} socketId - ID do socket WebSocket
 * @param {string} ipAddress - Endereço IP
 * @param {string} userAgent - User agent do navegador
 */
export async function setUserOnline(userId, socketId, ipAddress = null, userAgent = null) {
    try {
        const { data, error } = await supabaseAdmin
            .rpc('set_user_online', {
                p_user_id: userId,
                p_socket_id: socketId,
                p_ip_address: ipAddress,
                p_user_agent: userAgent
            });

        if (error) {
            throw error;
        }

        logger.info(`🟢 Usuário marcado como online`, { userId, socketId });

        return { data, error: null };
    } catch (error) {
        logger.error(`Erro ao marcar usuário como online`, { userId, error: error.message });
        return { data: null, error };
    }
}

/**
 * Marcar usuário como offline
 * 
 * @param {string} userId - ID do usuário
 */
export async function setUserOffline(userId) {
    try {
        const { data, error } = await supabaseAdmin
            .rpc('set_user_offline', {
                p_user_id: userId
            });

        if (error) {
            throw error;
        }

        logger.info(`🔴 Usuário marcado como offline`, { userId });

        return { data, error: null };
    } catch (error) {
        logger.error(`Erro ao marcar usuário como offline`, { userId, error: error.message });
        return { data: null, error };
    }
}

/**
 * Atualizar heartbeat do usuário
 * (Manter status online atualizado)
 * 
 * @param {string} userId - ID do usuário
 */
export async function updateHeartbeat(userId) {
    try {
        const { data, error } = await supabaseAdmin
            .rpc('update_user_heartbeat', {
                p_user_id: userId
            });

        if (error) {
            throw error;
        }

        // Log apenas em debug mode para não poluir
        logger.debug(`💓 Heartbeat atualizado`, { userId });

        return { data, error: null };
    } catch (error) {
        logger.error(`Erro ao atualizar heartbeat`, { userId, error: error.message });
        return { data: null, error };
    }
}

/**
 * Buscar usuários online
 * (Apenas para admins)
 * 
 * @param {string} userToken - Token JWT do admin
 */
export async function getOnlineUsers(userToken) {
    try {
        // Criar cliente com JWT do admin (RLS valida role)
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseWithAuth = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${userToken}`
                    }
                }
            }
        );

        const { data, error } = await supabaseWithAuth
            .rpc('get_online_users');

        if (error) {
            throw error;
        }

        logger.info(`📊 Usuários online consultados`, { count: data?.length || 0 });

        return { data: data || [], error: null };
    } catch (error) {
        logger.error(`Erro ao buscar usuários online`, { error: error.message });
        return { data: null, error };
    }
}

/**
 * Buscar estatísticas de presença
 * (Apenas para admins)
 * 
 * @param {string} userToken - Token JWT do admin
 */
export async function getPresenceStats(userToken) {
    try {
        // Criar cliente com JWT do admin (RLS valida role)
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseWithAuth = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${userToken}`
                    }
                }
            }
        );

        const { data, error } = await supabaseWithAuth
            .rpc('get_presence_stats');

        if (error) {
            throw error;
        }

        logger.info(`📈 Estatísticas de presença consultadas`, data?.[0] || {});

        return { data: data?.[0] || null, error: null };
    } catch (error) {
        logger.error(`Erro ao buscar estatísticas de presença`, { error: error.message });
        return { data: null, error };
    }
}

/**
 * Limpar usuários inativos
 * (Considerar offline se sem heartbeat há 5 minutos)
 * 
 * Deve ser executado periodicamente (cron/interval)
 */
export async function cleanupInactiveUsers() {
    try {
        const { data, error } = await supabaseAdmin
            .rpc('cleanup_inactive_users');

        if (error) {
            throw error;
        }

        if (data > 0) {
            logger.info(`🧹 Usuários inativos marcados como offline`, { count: data });
        }

        return { data, error: null };
    } catch (error) {
        logger.error(`Erro ao limpar usuários inativos`, { error: error.message });
        return { data: null, error };
    }
}

/**
 * Iniciar serviço de limpeza automática
 * (Executar a cada 2 minutos)
 */
export function startPresenceCleanup() {
    // Executar imediatamente
    cleanupInactiveUsers();

    // Executar a cada 2 minutos
    const interval = setInterval(() => {
        cleanupInactiveUsers();
    }, 2 * 60 * 1000); // 2 minutos

    logger.info(`🧹 Serviço de limpeza de presença iniciado (intervalo: 2 min)`);

    return interval;
}
