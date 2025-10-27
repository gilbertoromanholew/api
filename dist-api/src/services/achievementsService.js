/**
 * ============================================
 * 🏆 ACHIEVEMENTS SERVICE - V7
 * ============================================
 * Lógica de negócio para sistema de gamificação
 * ============================================
 */

import { supabase, supabaseAdmin } from '../config/supabase.js';
import logger from '../config/logger.js';

/**
 * Listar todas as conquistas disponíveis
 * Se userId fornecido, inclui progresso do usuário
 */
export async function getAllAchievements(userId = null) {
    try {
        let query = supabase
            .from('gamification_achievements')
            .select('*')
            .eq('is_active', true)
            .order('display_order');

        const { data: achievements, error } = await query;

        if (error) {
            return { data: null, error };
        }

        // Se não tem userId, retornar apenas conquistas
        if (!userId) {
            return { data: achievements, error: null };
        }

        // Buscar progresso do usuário
        const { data: userProgress } = await supabase
            .from('gamification_user_achievements')
            .select('*')
            .eq('user_id', userId);

        // Combinar conquistas com progresso
        const enriched = achievements.map(achievement => {
            const progress = userProgress?.find(p => p.achievement_id === achievement.id);
            return {
                ...achievement,
                user_progress: progress?.current_progress || 0,
                is_unlocked: progress?.is_completed || false,
                unlocked_at: progress?.completed_at || null
            };
        });

        return { data: enriched, error: null };
    } catch (error) {
        return { data: null, error };
    }
}

/**
 * Obter conquistas de um usuário específico
 * Retorna: desbloqueadas, em progresso, bloqueadas
 */
export async function getUserAchievements(userId) {
    try {
        // Buscar todas conquistas
        const { data: allAchievements } = await supabase
            .from('gamification_achievements')
            .select('*')
            .eq('is_active', true)
            .order('display_order');

        // Buscar progresso do usuário
        const { data: userProgress } = await supabase
            .from('gamification_user_achievements')
            .select('*')
            .eq('user_id', userId);

        const unlocked = [];
        const inProgress = [];
        const locked = [];

        allAchievements?.forEach(achievement => {
            const progress = userProgress?.find(p => p.achievement_id === achievement.id);
            
            const enriched = {
                ...achievement,
                current_progress: progress?.current_progress || 0,
                unlocked_at: progress?.completed_at
            };

            if (progress?.is_completed) {
                unlocked.push(enriched);
            } else if (progress && progress.current_progress > 0) {
                inProgress.push(enriched);
            } else {
                // Ocultar conquistas secretas não desbloqueadas
                if (achievement.is_secret) {
                    enriched.name = '???';
                    enriched.description = 'Conquista secreta';
                    enriched.icon_emoji = '❓';
                }
                locked.push(enriched);
            }
        });

        return {
            data: {
                unlocked,
                inProgress,
                locked,
                stats: {
                    totalUnlocked: unlocked.length,
                    totalAchievements: allAchievements?.length || 0,
                    completionRate: Math.round((unlocked.length / (allAchievements?.length || 1)) * 100)
                }
            },
            error: null
        };
    } catch (error) {
        return { data: null, error };
    }
}

/**
 * Obter vitrine de conquistas de um usuário
 */
export async function getShowcase(userId) {
    try {
        const { data, error } = await supabase
            .from('gamification_achievement_showcase')
            .select(`
                display_order,
                achievements (
                    id,
                    name,
                    slug,
                    description,
                    icon_emoji,
                    reward_bonus_credits
                )
            `)
            .eq('user_id', userId)
            .order('display_order');

        if (error) {
            return { data: null, error };
        }

        // Flatten structure
        const showcase = data.map(item => ({
            ...item.achievements,
            display_order: item.display_order
        }));

        return { data: showcase, error: null };
    } catch (error) {
        return { data: null, error };
    }
}

/**
 * Atualizar vitrine de conquistas do usuário
 */
export async function updateShowcase(userId, achievementIds) {
    try {
        if (!Array.isArray(achievementIds) || achievementIds.length > 3) {
            return { data: null, error: new Error('Máximo de 3 conquistas na vitrine') };
        }

        // Verificar se usuário possui todas as conquistas
        if (achievementIds.length > 0) {
            const { data: unlocked } = await supabase
                .from('gamification_user_achievements')
                .select('achievement_id')
                .eq('user_id', userId)
                .eq('is_completed', true)
                .in('achievement_id', achievementIds);

            if (unlocked?.length !== achievementIds.length) {
                return { data: null, error: new Error('Você só pode exibir conquistas que já desbloqueou') };
            }
        }

        // Limpar vitrine atual
        await supabaseAdmin
            .from('gamification_achievement_showcase')
            .delete()
            .eq('user_id', userId);

        // Adicionar novas conquistas
        if (achievementIds.length > 0) {
            const showcaseItems = achievementIds.map((achievementId, index) => ({
                user_id: userId,
                achievement_id: achievementId,
                display_order: index + 1
            }));

            const { data, error } = await supabaseAdmin
                .from('gamification_achievement_showcase')
                .insert(showcaseItems)
                .select();

            if (error) {
                return { data: null, error };
            }

            return { data, error: null };
        }

        return { data: [], error: null };
    } catch (error) {
        return { data: null, error };
    }
}

/**
 * Obter conquistas desbloqueadas recentemente
 */
export async function getRecentUnlocks(userId, limit = 10) {
    try {
        const { data, error } = await supabase
            .from('gamification_user_achievements')
            .select(`
                completed_at,
                achievements (
                    id,
                    name,
                    slug,
                    description,
                    icon_emoji,
                    reward_bonus_credits
                )
            `)
            .eq('user_id', userId)
            .eq('is_completed', true)
            .order('completed_at', { ascending: false })
            .limit(limit);

        if (error) {
            return { data: null, error };
        }

        // Flatten structure
        const unlocks = data.map(item => ({
            ...item.achievements,
            unlocked_at: item.completed_at
        }));

        return { data: unlocks, error: null };
    } catch (error) {
        return { data: null, error };
    }
}

/**
 * Obter leaderboard de conquistas
 */
export async function getLeaderboard(limit = 10) {
    try {
        // Contar conquistas por usuário
        const { data, error } = await supabase
            .from('gamification_user_achievements')
            .select('user_id, achievements(reward_bonus_credits)')
            .eq('is_completed', true);

        if (error) {
            return { data: null, error };
        }

        // Agrupar por usuário
        const userStats = {};
        data.forEach(item => {
            if (!userStats[item.user_id]) {
                userStats[item.user_id] = {
                    achievementCount: 0,
                    totalPoints: 0
                };
            }
            userStats[item.user_id].achievementCount++;
            userStats[item.user_id].totalPoints += item.achievements?.reward_bonus_credits || 0;
        });

        // Buscar informações dos usuários
        const userIds = Object.keys(userStats);
        const { data: users } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds);

        // Combinar e ordenar
        const leaderboard = users?.map(user => ({
            id: user.id,
            name: user.full_name,
            avatar: user.avatar_url,
            achievementCount: userStats[user.id].achievementCount,
            totalPoints: userStats[user.id].totalPoints
        })).sort((a, b) => b.achievementCount - a.achievementCount)
        .slice(0, limit);

        return { data: leaderboard || [], error: null };
    } catch (error) {
        return { data: null, error };
    }
}

/**
 * Desbloquear conquista e dar recompensa
 * (Chamado internamente quando progresso atinge meta)
 */
export async function unlockAchievement(userId, achievementId) {
    try {
        // Registrar desbloqueio na tabela user_achievements
        const { data, error } = await supabaseAdmin
            .from('gamification_user_achievements')
            .update({
                is_completed: true,
                completed_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('achievement_id', achievementId)
            .select()
            .single();

        if (error) {
            return { data: null, error };
        }

        // Buscar info da conquista para dar recompensa
        const { data: achievement } = await supabase
            .from('gamification_achievements')
            .select('reward_bonus_credits')
            .eq('id', achievementId)
            .single();

        // Adicionar pontos bônus (se tiver recompensa)
        if (achievement?.reward_bonus_credits > 0) {
            // TODO: Chamar pointsService.addBonusPoints()
            logger.tool(`Bonus points earned from achievement`, { 
                userId, 
                achievementId, 
                bonusPoints: achievement.reward_bonus_credits 
            });
        }

        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
}
