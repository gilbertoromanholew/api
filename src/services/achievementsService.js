import { supabase, supabaseAdmin } from '../config/supabase.js';
import { addBonusPoints } from './pointsService.js';

/**
 * Service de Conquistas (Achievements)
 * Lógica de negócio para sistema de gamificação
 */

/**
 * Verificar e processar progresso de conquistas
 * Chamado após ações importantes (uso de ferramenta, login, etc)
 */
export async function checkAchievementProgress(userId, eventType, eventData = {}) {
    try {
        // Buscar conquistas relacionadas ao evento
        const achievements = await getRelevantAchievements(eventType);
        
        for (const achievement of achievements) {
            await updateAchievementProgress(userId, achievement, eventData);
        }
    } catch (error) {
        console.error('[Achievements] Error checking progress:', error);
        // Não bloquear a operação principal se falhar
    }
}

/**
 * Atualizar progresso de uma conquista específica
 */
async function updateAchievementProgress(userId, achievement, eventData) {
    // Buscar ou criar progresso do usuário
    let { data: progress } = await supabase
        .from('gamification.user_achievements')
        .select('*')
        .eq('user_id', userId)
        .eq('achievement_id', achievement.id)
        .single();
    
    if (!progress) {
        // Criar novo progresso
        const { data: newProgress } = await supabaseAdmin
            .from('gamification.user_achievements')
            .insert({
                user_id: userId,
                achievement_id: achievement.id,
                current_progress: 0,
                is_completed: false
            })
            .select()
            .single();
        
        progress = newProgress;
    }
    
    if (progress.is_completed) {
        // Já completou esta conquista
        return;
    }
    
    // Incrementar progresso
    const newProgress = progress.current_progress + 1;
    const isCompleted = newProgress >= achievement.target_value;
    
    // Atualizar progresso
    await supabaseAdmin
        .from('gamification.user_achievements')
        .update({
            current_progress: newProgress,
            is_completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : null
        })
        .eq('id', progress.id);
    
    // Se completou, desbloquear e dar recompensa
    if (isCompleted) {
        await unlockAchievement(userId, achievement);
    }
}

/**
 * Desbloquear conquista e dar recompensa
 */
async function unlockAchievement(userId, achievement) {
    // Registrar desbloqueio
    const { data: unlock } = await supabaseAdmin
        .from('gamification.achievement_unlocks')
        .insert({
            user_id: userId,
            achievement_id: achievement.id
        })
        .select()
        .single();
    
    // Dar recompensa em pontos
    if (achievement.reward_points > 0) {
        await addBonusPoints(userId, achievement.reward_points, {
            type: 'bonus',
            description: `Conquista desbloqueada: ${achievement.name}`,
            source: 'achievement',
            achievement_id: achievement.id
        });
    }
    
    // TODO: Notificar usuário (WebSocket, Push, etc)
    console.log(`[Achievements] User ${userId} unlocked: ${achievement.name} (+${achievement.reward_points} pts)`);
    
    return unlock;
}

/**
 * Buscar conquistas relevantes para um tipo de evento
 */
async function getRelevantAchievements(eventType) {
    const relevanceMap = {
        'tool_execution': ['primeira-ferramenta', 'mestre-ferramentas-i', 'mestre-ferramentas-ii', 'mestre-ferramentas-iii', 'mestre-ferramentas-iv', 'mestre-ferramentas-v'],
        'first_login': ['bem-vindo'],
        'daily_login': ['guerreiro-semanal', 'campeao-mensal', 'maratonista-anual'],
        'purchase': ['primeira-compra'],
        'diverse_tools': ['explorador']
    };
    
    const slugs = relevanceMap[eventType] || [];
    
    if (slugs.length === 0) {
        return [];
    }
    
    const { data } = await supabase
        .from('gamification.achievements')
        .select('*')
        .in('slug', slugs)
        .eq('is_active', true);
    
    return data || [];
}

/**
 * Listar conquistas do usuário
 */
export async function getUserAchievements(userId, options = {}) {
    const { includeCompleted = true, includePending = true } = options;
    
    const { data, error } = await supabase
        .from('gamification.user_achievements')
        .select(`
            *,
            achievement:achievement_id (
                slug,
                name,
                description,
                type,
                icon_url,
                reward_points,
                target_value
            )
        `)
        .eq('user_id', userId);
    
    if (error) {
        throw new Error('Erro ao buscar conquistas do usuário');
    }
    
    // Filtrar por status
    let filtered = data;
    if (!includeCompleted) {
        filtered = filtered.filter(a => !a.is_completed);
    }
    if (!includePending) {
        filtered = filtered.filter(a => a.is_completed);
    }
    
    return filtered;
}

/**
 * Listar todas as conquistas disponíveis
 */
export async function getAllAchievements() {
    const { data, error } = await supabase
        .from('gamification.achievements')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
    
    if (error) {
        throw new Error('Erro ao buscar conquistas');
    }
    
    return data;
}

/**
 * Atualizar vitrine de conquistas do usuário
 */
export async function updateShowcase(userId, achievementIds) {
    if (achievementIds.length > 3) {
        throw new Error('Máximo de 3 conquistas na vitrine');
    }
    
    // Verificar se usuário possui todas as conquistas
    const { data: unlocked } = await supabase
        .from('gamification.achievement_unlocks')
        .select('achievement_id')
        .eq('user_id', userId)
        .in('achievement_id', achievementIds);
    
    if (unlocked.length !== achievementIds.length) {
        throw new Error('Você só pode exibir conquistas que já desbloqueou');
    }
    
    // Limpar vitrine atual
    await supabaseAdmin
        .from('gamification.achievement_showcase')
        .delete()
        .eq('user_id', userId);
    
    // Adicionar novas conquistas
    const showcaseItems = achievementIds.map((achievementId, index) => ({
        user_id: userId,
        achievement_id: achievementId,
        display_order: index + 1
    }));
    
    await supabaseAdmin
        .from('gamification.achievement_showcase')
        .insert(showcaseItems);
    
    return showcaseItems;
}

/**
 * Obter vitrine de conquistas de um usuário
 */
export async function getShowcase(userId) {
    const { data, error } = await supabase
        .from('gamification.achievement_showcase')
        .select(`
            display_order,
            achievement:achievement_id (
                slug,
                name,
                description,
                icon_url,
                reward_points
            )
        `)
        .eq('user_id', userId)
        .order('display_order');
    
    if (error) {
        throw new Error('Erro ao buscar vitrine');
    }
    
    return data;
}

/**
 * Processar evento de uso de ferramenta
 */
export async function onToolExecuted(userId, toolSlug) {
    await checkAchievementProgress(userId, 'tool_execution', { tool: toolSlug });
    
    // Verificar conquista de explorador (5 ferramentas diferentes)
    const { count } = await supabase
        .from('tools.executions')
        .select('tool_id', { count: 'exact', head: true })
        .eq('user_id', userId);
    
    if (count >= 5) {
        await checkAchievementProgress(userId, 'diverse_tools', { count });
    }
}

/**
 * Processar evento de login diário
 */
export async function onDailyLogin(userId) {
    // Atualizar ou criar streak
    const { data: streak } = await supabase
        .from('gamification.daily_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    const today = new Date().toISOString().split('T')[0];
    const lastActivity = streak?.last_activity_date;
    
    if (lastActivity === today) {
        // Já fez login hoje
        return;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const isConsecutive = lastActivity === yesterdayStr;
    const newStreak = isConsecutive ? (streak?.current_streak || 0) + 1 : 1;
    
    await supabaseAdmin
        .from('gamification.daily_streaks')
        .upsert({
            user_id: userId,
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, streak?.longest_streak || 0),
            last_activity_date: today
        });
    
    // Verificar conquistas de streak
    await checkAchievementProgress(userId, 'daily_login', { streak: newStreak });
}
