import { supabase, supabaseAdmin } from '../config/supabase.js';
import { emitCreditsUpdate, emitLevelUp } from './socketService.js';

/**
 * ========================================
 * SERVIÇO DE CRÉDITOS - CENTRALIZADO
 * ========================================
 * Este é o ÚNICO lugar que deve acessar economy_user_wallets
 * e economy_transactions para gerenciamento de créditos.
 * 
 * ❌ NUNCA acesse economy_user_wallets diretamente de outros arquivos
 * ✅ SEMPRE use as funções deste serviço
 */

// ========================================
// FUNÇÕES DE CONSULTA
// ========================================

/**
 * Obter saldo completo do usuário
 * ✅ MÁXIMA SEGURANÇA: Usa JWT do usuário + RLS
 * @param {string} userId - ID do usuário
 * @param {string} userToken - JWT token do usuário (de req.user.token)
 */
export async function getBalance(userId, userToken) {
    // Criar cliente Supabase com JWT do usuário
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
        .from('economy_user_wallets')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (error) {
        throw new Error('Erro ao buscar carteira do usuário: ' + error.message);
    }
    
    if (!data) {
        throw new Error('Carteira não encontrada');
    }
    
    return {
        bonus_credits: data.bonus_credits,
        purchased_credits: data.purchased_credits,
        total_credits: data.bonus_credits + data.purchased_credits,
        total_earned_bonus: data.total_earned_bonus,
        total_purchased: data.total_purchased,
        total_spent: data.total_spent,
        pro_weekly_allowance: data.pro_weekly_allowance,
        last_allowance_date: data.last_allowance_date,
        // Aliases para compatibilidade com código antigo
        purchased_points: data.purchased_credits,
        free_points: data.bonus_credits,
        paid_points: data.purchased_credits,
        total_points: data.bonus_credits + data.purchased_credits,
        availableCredits: data.bonus_credits + data.purchased_credits // Para planning tools
    };
}

/**
 * Obter histórico de transações (paginado)
 * ✅ MÁXIMA SEGURANÇA: Usa JWT do usuário + RLS
 * @param {string} userId - ID do usuário
 * @param {string} userToken - JWT token do usuário
 * @param {object} options - Opções de paginação
 */
export async function getHistory(userId, userToken, options = {}) {
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 20;
    const type = options.type; // opcional: filtrar por tipo
    
    const offset = (page - 1) * limit;
    
    // Criar cliente Supabase com JWT do usuário
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
    
    let query = supabaseWithAuth
        .from('economy_transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
    
    if (type) {
        query = query.eq('type', type);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
        throw new Error('Erro ao buscar histórico de créditos: ' + error.message);
    }
    
    const totalPages = Math.ceil(count / limit);
    
    return {
        transactions: data,
        pagination: {
            page,
            limit,
            total: count,
            total_pages: totalPages,
            has_next: page < totalPages,
            has_prev: page > 1
        }
    };
}

/**
 * Obter custo de uma ferramenta
 */
export async function getToolCost(toolName) {
    const { data, error } = await supabase
        .from('tools_catalog')
        .select('*')
        .eq('slug', toolName)
        .eq('is_active', true)
        .single();
    
    if (error || !data) {
        throw new Error(`Ferramenta "${toolName}" não encontrada ou inativa`);
    }
    
    return {
        tool_name: data.slug,
        display_name: data.name,
        points_cost: data.cost_in_points,
        ...data
    };
}

/**
 * Verificar se usuário tem créditos suficientes para uma ferramenta
 */
export async function canUseTool(userId, toolName) {
    const tool = await getToolCost(toolName);
    const balance = await getBalance(userId);
    
    const totalPoints = balance.total_credits;
    const canUse = totalPoints >= tool.points_cost;
    const missing = canUse ? 0 : tool.points_cost - totalPoints;
    
    return {
        can_use: canUse,
        tool_cost: tool.points_cost,
        current_balance: totalPoints,
        missing_points: missing,
        tool
    };
}

// ========================================
// FUNÇÕES DE MODIFICAÇÃO
// ========================================

/**
 * Consumir créditos (prioriza gratuitos, depois pagos)
 * ✅ MÁXIMA SEGURANÇA: Usa JWT do usuário + function RLS
 * @param {string} userId - ID do usuário
 * @param {string} userToken - JWT token do usuário
 * @param {number} amount - Quantidade a debitar
 * @param {object} metadata - Metadados da operação
 */
export async function consumeCredits(userId, userToken, amount, metadata = {}) {
    if (amount <= 0) {
        throw new Error('Quantidade de créditos deve ser maior que zero');
    }
    
    // Criar cliente Supabase com JWT do usuário
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
    
    // Usar function do Postgres (valida auth.uid() = user_id internamente)
    const { error } = await supabaseWithAuth
        .rpc('deduct_credits', {
            p_user_id: userId,
            p_amount: amount,
            p_description: metadata.description || `Uso de ferramenta: ${metadata.tool_name || 'desconhecida'}`
        });
    
    if (error) {
        // Tratar erros específicos
        if (error.message.includes('Créditos insuficientes')) {
            throw new Error(`Créditos insuficientes`);
        }
        if (error.message.includes('Carteira não encontrada')) {
            throw new Error('Carteira não encontrada');
        }
        throw new Error('Erro ao consumir créditos: ' + error.message);
    }

    // Buscar novo saldo após débito
    const newBalance = await getBalance(userId, userToken);

    // � REGISTRAR USO DA FERRAMENTA em tool_usage_tracking
    try {
        await supabaseWithAuth
            .from('tool_usage_tracking')
            .insert({
                user_id: userId,
                tool_slug: metadata.tool_slug || metadata.tool_name || 'unknown',
                credits_used: amount,
                success: true,
                created_at: new Date().toISOString()
            });
    } catch (trackError) {
        console.error('⚠️ Erro ao registrar uso da ferramenta:', trackError);
        // Não falhar a operação se o tracking falhar
    }

    // �🔌 WebSocket: Notificar usuário sobre gasto de créditos
    emitCreditsUpdate(userId, {
        balance: newBalance.total_credits,
        change: -amount, // Valor negativo indica gasto
        type: 'consumption',
        reason: metadata.description || `Ferramenta: ${metadata.tool_name || 'uso de créditos'}`
    });
    
    // Retornar no formato esperado
    return {
        consumed: amount,
        previous_balance: newBalance.total_credits + amount,
        new_balance: newBalance.total_credits,
        success: true
    };
}

/**
 * Adicionar créditos bônus/gratuitos
 * Usado por: promo codes, referrals, admin, etc.
 * ✅ RLS ATIVO: Usa function admin_add_credits() - SECURITY DEFINER
 * ⚠️ Backend DEVE validar permissões antes de chamar
 */
export async function addBonusCredits(userId, amount, metadata = {}) {
    if (amount <= 0) {
        throw new Error('Quantidade de créditos deve ser maior que zero');
    }
    
    // Usar function do Postgres (bypassa RLS com segurança)
    const { data, error } = await supabaseAdmin
        .rpc('admin_add_credits', {
            p_user_id: userId,
            p_amount: amount,
            p_type: 'bonus',
            p_reason: metadata.description || 'Adição de créditos bônus'
        });
    
    if (error) {
        throw new Error('Erro ao adicionar créditos bônus: ' + error.message);
    }

    // 🔌 WebSocket: Notificar usuário sobre atualização de créditos
    emitCreditsUpdate(userId, {
        balance: data.new_balance,
        change: amount,
        type: 'bonus',
        reason: metadata.description || 'Créditos bônus recebidos'
    });

    // TODO: Implementar detecção de level-up quando estrutura de levels estiver pronta
    // Se houver level-up, emitir: emitLevelUp(userId, { newLevel, rewards })
    
    return {
        added: amount,
        new_balance: data.new_balance,
        total_credits: data.new_balance,
        transaction_id: data.transaction_id,
        success: data.success
    };
}

/**
 * Adicionar créditos comprados
 * Usado por: Stripe payments, manual admin purchases, etc.
 * ✅ RLS ATIVO: Usa function admin_add_credits() - SECURITY DEFINER
 * ⚠️ Backend DEVE validar permissões antes de chamar
 */
export async function addPurchasedCredits(userId, amount, metadata = {}) {
    if (amount <= 0) {
        throw new Error('Quantidade de créditos deve ser maior que zero');
    }
    
    // Usar function do Postgres (bypassa RLS com segurança)
    const { data, error } = await supabaseAdmin
        .rpc('admin_add_credits', {
            p_user_id: userId,
            p_amount: amount,
            p_type: 'purchase', // Tipo 'purchase' (não 'bonus')
            p_reason: metadata.description || 'Compra de créditos'
        });
    
    if (error) {
        throw new Error('Erro ao adicionar créditos comprados: ' + error.message);
    }

    // 🔌 WebSocket: Notificar usuário sobre atualização de créditos
    emitCreditsUpdate(userId, {
        balance: data.new_balance,
        change: amount,
        type: 'purchase',
        reason: metadata.description || 'Compra de créditos realizada'
    });
    
    return {
        added: amount,
        new_balance: data.new_balance,
        total_credits: data.new_balance,
        transaction_id: data.transaction_id,
        success: data.success
    };
}

// ========================================
// ALIASES PARA COMPATIBILIDADE
// ========================================

export const consumePoints = consumeCredits; // Alias para compatibilidade com código antigo
export const addBonusPoints = addBonusCredits; // Alias para compatibilidade com código antigo
export const addPurchasedPoints = addPurchasedCredits; // Alias para compatibilidade com código antigo
export const addFreePoints = addBonusCredits; // Alias para compatibilidade com código antigo
export const addPaidPoints = addPurchasedCredits; // Alias para compatibilidade com código antigo
