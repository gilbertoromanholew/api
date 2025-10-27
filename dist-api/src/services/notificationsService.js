/**
 * ============================================
 * 🔔 NOTIFICATIONS SERVICE
 * ============================================
 * Serviço centralizado para gerenciamento de notificações
 * Integrado com WebSocket para notificações em tempo real
 * ============================================
 */

import { supabase, supabaseAdmin } from '../config/supabase.js';
import logger from '../config/logger.js';
import { emitNotification } from './socketService.js';

/**
 * Criar notificação e emitir via WebSocket
 * 
 * @param {string} userId - ID do usuário
 * @param {object} notification - Dados da notificação
 * @param {string} notification.type - Tipo: 'achievement', 'credits', 'level_up', 'admin', 'system', 'tool'
 * @param {string} notification.title - Título da notificação
 * @param {string} notification.message - Mensagem detalhada
 * @param {object} notification.data - Dados adicionais em JSON
 * @param {Date} notification.expiresAt - Data de expiração (opcional)
 */
export async function createNotification(userId, notification) {
    try {
        const { type, title, message, data = {}, expiresAt = null } = notification;

        // Validar tipo de notificação
        const validTypes = ['achievement', 'credits', 'level_up', 'subscription', 'admin', 'system', 'tool'];
        if (!validTypes.includes(type)) {
            throw new Error(`Tipo de notificação inválido: ${type}`);
        }

        // Inserir no banco usando service_role para bypassar RLS
        const { data: notificationData, error } = await supabaseAdmin
            .from('user_notifications')
            .insert({
                user_id: userId,
                type,
                title,
                message,
                data,
                expires_at: expiresAt
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        // 🔌 WebSocket: Emitir notificação em tempo real
        emitNotification(userId, {
            id: notificationData.id,
            type,
            title,
            message,
            data,
            createdAt: notificationData.created_at
        });

        logger.info(`🔔 Notificação criada e emitida via WebSocket`, {
            userId,
            type,
            title,
            notificationId: notificationData.id
        });

        return { data: notificationData, error: null };
    } catch (error) {
        logger.error(`Erro ao criar notificação`, { userId, error: error.message });
        return { data: null, error };
    }
}

/**
 * Buscar notificações do usuário
 * 
 * @param {string} userId - ID do usuário
 * @param {string} userToken - Token JWT do usuário
 * @param {object} options - Opções de filtro
 * @param {boolean} options.unreadOnly - Apenas não lidas
 * @param {number} options.limit - Limite de resultados
 * @param {string} options.type - Filtrar por tipo
 */
export async function getUserNotifications(userId, userToken, options = {}) {
    try {
        const { unreadOnly = false, limit = 50, type = null } = options;

        // Criar cliente com JWT do usuário (RLS ativo)
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

        // Construir query
        let query = supabaseWithAuth
            .from('user_notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        // Filtros opcionais
        if (unreadOnly) {
            query = query.eq('is_read', false);
        }

        if (type) {
            query = query.eq('type', type);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return { data, error: null };
    } catch (error) {
        logger.error(`Erro ao buscar notificações`, { userId, error: error.message });
        return { data: null, error };
    }
}

/**
 * Marcar notificação como lida
 * 
 * @param {string} userId - ID do usuário
 * @param {string} userToken - Token JWT do usuário
 * @param {string} notificationId - ID da notificação
 */
export async function markAsRead(userId, userToken, notificationId) {
    try {
        // Criar cliente com JWT do usuário (RLS ativo)
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
            .rpc('mark_notification_as_read', {
                notification_id: notificationId
            });

        if (error) {
            throw error;
        }

        logger.info(`📖 Notificação marcada como lida`, { userId, notificationId });

        return { data, error: null };
    } catch (error) {
        logger.error(`Erro ao marcar notificação como lida`, { userId, notificationId, error: error.message });
        return { data: null, error };
    }
}

/**
 * Marcar todas notificações como lidas
 * 
 * @param {string} userId - ID do usuário
 * @param {string} userToken - Token JWT do usuário
 */
export async function markAllAsRead(userId, userToken) {
    try {
        // Criar cliente com JWT do usuário (RLS ativo)
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
            .rpc('mark_all_notifications_as_read');

        if (error) {
            throw error;
        }

        logger.info(`📖 Todas notificações marcadas como lidas`, { userId, count: data });

        return { data, error: null };
    } catch (error) {
        logger.error(`Erro ao marcar todas notificações como lidas`, { userId, error: error.message });
        return { data: null, error };
    }
}

/**
 * Deletar notificação
 * 
 * @param {string} userId - ID do usuário
 * @param {string} userToken - Token JWT do usuário
 * @param {string} notificationId - ID da notificação
 */
export async function deleteNotification(userId, userToken, notificationId) {
    try {
        // Criar cliente com JWT do usuário (RLS ativo)
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

        const { error } = await supabaseWithAuth
            .from('user_notifications')
            .delete()
            .eq('id', notificationId)
            .eq('user_id', userId); // RLS garante, mas adiciona segurança extra

        if (error) {
            throw error;
        }

        logger.info(`🗑️ Notificação deletada`, { userId, notificationId });

        return { data: true, error: null };
    } catch (error) {
        logger.error(`Erro ao deletar notificação`, { userId, notificationId, error: error.message });
        return { data: null, error };
    }
}

/**
 * Contar notificações não lidas
 * 
 * @param {string} userId - ID do usuário
 * @param {string} userToken - Token JWT do usuário
 */
export async function getUnreadCount(userId, userToken) {
    try {
        // Criar cliente com JWT do usuário (RLS ativo)
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

        const { count, error } = await supabaseWithAuth
            .from('user_notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) {
            throw error;
        }

        return { data: count || 0, error: null };
    } catch (error) {
        logger.error(`Erro ao contar notificações não lidas`, { userId, error: error.message });
        return { data: null, error };
    }
}

// ============================================
// HELPERS: Notificações específicas de negócio
// ============================================

/**
 * Criar notificação de conquista desbloqueada
 */
export async function notifyAchievementUnlocked(userId, achievement) {
    return createNotification(userId, {
        type: 'achievement',
        title: `🏆 Conquista Desbloqueada!`,
        message: `Você desbloqueou: ${achievement.title}`,
        data: {
            achievementId: achievement.id,
            points: achievement.points,
            icon: achievement.icon
        }
    });
}

/**
 * Criar notificação de créditos recebidos
 */
export async function notifyCreditsReceived(userId, amount, reason) {
    return createNotification(userId, {
        type: 'credits',
        title: `💰 Créditos Recebidos`,
        message: `Você recebeu ${amount} créditos! ${reason}`,
        data: {
            amount,
            reason
        }
    });
}

/**
 * Criar notificação de level up
 */
export async function notifyLevelUp(userId, newLevel, rewards) {
    return createNotification(userId, {
        type: 'level_up',
        title: `🎉 Level Up!`,
        message: `Parabéns! Você alcançou o nível ${newLevel}`,
        data: {
            newLevel,
            rewards
        }
    });
}

/**
 * Criar notificação administrativa
 */
export async function notifyAdmin(userId, title, message, data = {}) {
    return createNotification(userId, {
        type: 'admin',
        title: `🔔 ${title}`,
        message,
        data
    });
}
