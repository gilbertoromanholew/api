import { supabase, supabaseAdmin } from '../config/supabase.js';

/**
 * ========================================
 * SERVIÇO DE PONTOS/CRÉDITOS - CENTRALIZADO
 * ========================================
 * Este é o ÚNICO lugar que deve acessar economy_user_wallets
 * e economy_transactions para gerenciamento de pontos.
 * 
 * ❌ NUNCA acesse economy_user_wallets diretamente de outros arquivos
 * ✅ SEMPRE use as funções deste serviço
 */

// ========================================
// FUNÇÕES DE CONSULTA
// ========================================

/**
 * Obter saldo completo do usuário
 */
export async function getBalance(userId) {
    const { data, error } = await supabaseAdmin
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
        purchased_points: data.purchased_points,
        total_credits: data.bonus_credits + data.purchased_points,
        total_earned_bonus: data.total_earned_bonus,
        total_purchased: data.total_purchased,
        total_spent: data.total_spent,
        pro_weekly_allowance: data.pro_weekly_allowance,
        last_allowance_date: data.last_allowance_date,
        // Aliases para compatibilidade
        purchased_credits: data.purchased_points,
        free_points: data.bonus_credits,
        paid_points: data.purchased_points,
        total_points: data.bonus_credits + data.purchased_points,
        availableCredits: data.bonus_credits + data.purchased_points // Para planning tools
    };
}

/**
 * Obter histórico de transações (paginado)
 */
export async function getHistory(userId, options = {}) {
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 20;
    const type = options.type; // opcional: filtrar por tipo
    
    const offset = (page - 1) * limit;
    
    let query = supabaseAdmin
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
        throw new Error('Erro ao buscar histórico de pontos: ' + error.message);
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
 * Verificar se usuário tem pontos suficientes para uma ferramenta
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
 * Consumir pontos (prioriza gratuitos, depois pagos)
 */
export async function consumePoints(userId, amount, metadata = {}) {
    if (amount <= 0) {
        throw new Error('Quantidade de pontos deve ser maior que zero');
    }
    
    // Buscar carteira
    const { data: wallet, error: walletError} = await supabase
        .from('economy_user_wallets')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (walletError) {
        throw new Error('Erro ao buscar carteira do usuário: ' + walletError.message);
    }
    
    const totalAvailable = wallet.bonus_credits + wallet.purchased_points;
    
    if (totalAvailable < amount) {
        throw new Error(`Pontos insuficientes. Você tem ${totalAvailable}, mas precisa de ${amount}`);
    }
    
    // Calcular consumo (prioriza gratuitos/bonus)
    let remainingToConsume = amount;
    let freeConsumed = 0;
    let paidConsumed = 0;
    
    if (wallet.bonus_credits > 0) {
        freeConsumed = Math.min(wallet.bonus_credits, remainingToConsume);
        remainingToConsume -= freeConsumed;
    }
    
    if (remainingToConsume > 0) {
        paidConsumed = remainingToConsume;
    }
    
    // Novos saldos
    const newBonusCredits = wallet.bonus_credits - freeConsumed;
    const newPurchasedPoints = wallet.purchased_points - paidConsumed;
    const previousBalance = totalAvailable;
    const newBalance = newBonusCredits + newPurchasedPoints;
    
    // Atualizar carteira
    const { error: updateError } = await supabaseAdmin
        .from('economy_user_wallets')
        .update({
            bonus_credits: newBonusCredits,
            purchased_points: newPurchasedPoints,
            total_spent: (wallet.total_spent || 0) + amount
        })
        .eq('user_id', userId);
    
    if (updateError) {
        throw new Error('Erro ao atualizar pontos: ' + updateError.message);
    }
    
    // Registrar transações
    const transactions = [];
    
    if (freeConsumed > 0) {
        const { data: freeTx } = await supabaseAdmin
            .from('economy_transactions')
            .insert({
                user_id: userId,
                type: metadata.type || 'tool_usage',
                point_type: 'bonus',
                amount: -freeConsumed,
                balance_before: wallet.bonus_credits,
                balance_after: newBonusCredits,
                description: metadata.description || 'Consumo de pontos',
                metadata: {
                    tool_name: metadata.tool_name
                }
            })
            .select()
            .single();
        
        if (freeTx) transactions.push(freeTx);
    }
    
    if (paidConsumed > 0) {
        const { data: paidTx } = await supabaseAdmin
            .from('economy_transactions')
            .insert({
                user_id: userId,
                type: metadata.type || 'tool_usage',
                point_type: 'purchased',
                amount: -paidConsumed,
                balance_before: wallet.purchased_points,
                balance_after: newPurchasedPoints,
                description: metadata.description || 'Consumo de pontos',
                metadata: {
                    tool_name: metadata.tool_name
                }
            })
            .select()
            .single();
        
        if (paidTx) transactions.push(paidTx);
    }
    
    return {
        consumed: amount,
        free_consumed: freeConsumed,
        paid_consumed: paidConsumed,
        previous_balance: previousBalance,
        new_balance: newBalance,
        transactions
    };
}

/**
 * Adicionar pontos bônus/gratuitos
 * Usado por: promo codes, referrals, admin, etc.
 */
export async function addBonusPoints(userId, amount, metadata = {}) {
    if (amount <= 0) {
        throw new Error('Quantidade de pontos deve ser maior que zero');
    }
    
    // Buscar carteira
    const { data: wallet, error } = await supabase
        .from('economy_user_wallets')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (error) {
        throw new Error('Erro ao buscar carteira do usuário: ' + error.message);
    }
    
    const newBonusCredits = wallet.bonus_credits + amount;
    
    // Atualizar carteira
    const { error: updateError } = await supabaseAdmin
        .from('economy_user_wallets')
        .update({
            bonus_credits: newBonusCredits,
            total_earned_bonus: (wallet.total_earned_bonus || 0) + amount
        })
        .eq('user_id', userId);
    
    if (updateError) {
        throw new Error('Erro ao atualizar pontos: ' + updateError.message);
    }
    
    // Registrar transação
    const { data: transaction } = await supabaseAdmin
        .from('economy_transactions')
        .insert({
            user_id: userId,
            type: metadata.type || 'bonus',
            point_type: 'bonus',
            amount: amount,
            balance_before: wallet.bonus_credits,
            balance_after: newBonusCredits,
            description: metadata.description || 'Adição de pontos bônus',
            metadata: {
                promo_code: metadata.promo_code,
                referred_user_id: metadata.referred_user_id,
                admin_user_id: metadata.admin_user_id,
                ...metadata.extra
            }
        })
        .select()
        .single();
    
    return {
        added: amount,
        new_balance: newBonusCredits,
        total_credits: newBonusCredits + wallet.purchased_points,
        transaction
    };
}

/**
 * Adicionar pontos comprados
 * Usado por: Stripe payments, manual admin purchases, etc.
 */
export async function addPurchasedPoints(userId, amount, metadata = {}) {
    if (amount <= 0) {
        throw new Error('Quantidade de pontos deve ser maior que zero');
    }
    
    // Buscar carteira
    const { data: wallet, error } = await supabase
        .from('economy_user_wallets')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (error) {
        throw new Error('Erro ao buscar carteira do usuário: ' + error.message);
    }
    
    const newPurchasedPoints = wallet.purchased_points + amount;
    
    // Atualizar carteira
    const { error: updateError } = await supabaseAdmin
        .from('economy_user_wallets')
        .update({
            purchased_points: newPurchasedPoints,
            total_purchased: (wallet.total_purchased || 0) + amount
        })
        .eq('user_id', userId);
    
    if (updateError) {
        throw new Error('Erro ao atualizar pontos: ' + updateError.message);
    }
    
    // Registrar transação
    const { data: transaction } = await supabaseAdmin
        .from('economy_transactions')
        .insert({
            user_id: userId,
            type: metadata.type || 'purchase',
            point_type: 'purchased',
            amount: amount,
            balance_before: wallet.purchased_points,
            balance_after: newPurchasedPoints,
            description: metadata.description || 'Compra de pontos',
            metadata: {
                stripe_payment_id: metadata.stripe_payment_id,
                payment_method: metadata.payment_method,
                ...metadata.extra
            }
        })
        .select()
        .single();
    
    return {
        added: amount,
        new_balance: newPurchasedPoints,
        total_credits: wallet.bonus_credits + newPurchasedPoints,
        transaction
    };
}

// ========================================
// ALIASES PARA COMPATIBILIDADE
// ========================================

export const addFreePoints = addBonusPoints; // Alias para compatibilidade com código antigo
export const addPaidPoints = addPurchasedPoints; // Alias para compatibilidade com código antigo
