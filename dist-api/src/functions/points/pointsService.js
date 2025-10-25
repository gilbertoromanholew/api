import { supabase, supabaseAdmin } from '../../config/supabase.js';

/**
 * Service de Pontos
 * Lógica de negócio para gerenciamento de pontos
 */

/**
 * Consumir pontos (prioriza gratuitos, depois pagos)
 */
export async function consumePoints(userId, amount, metadata = {}) {
    if (amount <= 0) {
        throw new Error('Quantidade de pontos deve ser maior que zero');
    }
    
    // V7: Buscar carteira do usuário
    const { data: wallet, error: walletError} = await supabase
        .from('economy_user_wallets')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (walletError) {
        throw new Error('Erro ao buscar carteira do usuário');
    }
    
    const totalAvailable = wallet.bonus_credits + wallet.purchased_points;
    
    if (totalAvailable < amount) {
        throw new Error(`Pontos insuficientes. Você tem ${totalAvailable}, mas precisa de ${amount}`);
    }
    
    // Calcular consumo (prioriza gratuitos/bonus)
    let remainingToConsume = amount;
    let freeConsumed = 0;
    let paidConsumed = 0;
    
    // Consumir bonus primeiro
    if (wallet.bonus_credits > 0) {
        freeConsumed = Math.min(wallet.bonus_credits, remainingToConsume);
        remainingToConsume -= freeConsumed;
    }
    
    // Se ainda falta, consumir purchased
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
        throw new Error('Erro ao atualizar pontos');
    }
    
    // Registrar transações
    const transactions = [];
    
    // Transação de consumo de bonus
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
    
    // Transação de consumo de purchased
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
 * Adicionar pontos gratuitos (respeitando limite)
 */
export async function addFreePoints(userId, amount, metadata = {}) {
    if (amount <= 0) {
        throw new Error('Quantidade de pontos deve ser maior que zero');
    }
    
    // V7: Buscar carteira do usuário
    const { data: wallet, error } = await supabase
        .from('economy_user_wallets')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (error) {
        throw new Error('Erro ao buscar carteira do usuário');
    }
    
    // Calcular quanto pode adicionar (respeitando limite - se houver)
    // Nota: wallet não tem bonus_credits_limit na estrutura real, remover verificação
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
        throw new Error('Erro ao atualizar pontos');
    }
    
    // Registrar transação
    const { data: transaction } = await supabaseAdmin
        .from('economy_transactions')
        .insert({
            user_id: userId,
            type: metadata.type || 'admin_adjustment',
            point_type: 'bonus',
            amount: amount,
            balance_before: wallet.bonus_credits,
            balance_after: newBonusCredits,
            description: metadata.description || 'Adição de pontos gratuitos',
            metadata: {
                referred_user_id: metadata.referred_user_id
            }
        })
        .select()
        .single();
    
    return {
        added: amount,
        requested: amount,
        limited: false,
        new_balance: newBonusCredits,
        transaction
    };
}

/**
 * Adicionar pontos pagos (sem limite)
 */
export async function addPaidPoints(userId, amount, metadata = {}) {
    if (amount <= 0) {
        throw new Error('Quantidade de pontos deve ser maior que zero');
    }
    
    // V7: Buscar carteira do usuário
    const { data: wallet, error } = await supabase
        .from('economy_user_wallets')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (error) {
        throw new Error('Erro ao buscar carteira do usuário');
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
        throw new Error('Erro ao atualizar pontos');
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
                stripe_payment_id: metadata.stripe_payment_id
            }
        })
        .select()
        .single();
    
    return {
        added: amount,
        new_balance: newPurchasedPoints,
        transaction
    };
}

/**
 * Obter custo de uma ferramenta
 */
export async function getToolCost(toolName) {
    // V7: Buscar de tools.catalog
    const { data, error } = await supabase
        .from('tools_catalog')
        .select('*')
        .eq('slug', toolName)
        .eq('is_active', true)
        .single();
    
    if (error || !data) {
        throw new Error(`Ferramenta "${toolName}" não encontrada ou inativa`);
    }
    
    // Manter compatibilidade com código existente
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
    
    // V7: Buscar carteira
    const { data: wallet, error } = await supabase
        .from('economy_user_wallets')
        .select('bonus_credits, purchased_points')
        .eq('user_id', userId)
        .single();
    
    if (error) {
        throw new Error('Erro ao buscar carteira do usuário');
    }
    
    const totalPoints = wallet.bonus_credits + wallet.purchased_points;
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
