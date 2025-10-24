import { supabase, supabaseAdmin } from '../../config/supabase.js';

/**
 * Service de Pontos - ATUALIZADO PARA NOVA ECONOMIA V7
 * Lógica de negócio para gerenciamento de pontos
 * 
 * MUDANÇAS V7:
 * - user_points → economy.user_wallets
 * - point_transactions → economy.transactions
 * - free_points → bonus_credits
 * - paid_points → purchased_points
 * - ENUMs antigos → economy.transaction_type
 */

/**
 * Consumir pontos (prioriza bônus, depois comprados)
 */
export async function consumePoints(userId, amount, metadata = {}) {
    if (amount <= 0) {
        throw new Error('Quantidade de pontos deve ser maior que zero');
    }
    
    // Buscar carteira atual
    const { data: wallet, error: walletError } = await supabase
        .from('economy.user_wallets')
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
    
    // Calcular consumo (prioriza bônus primeiro - FIFO)
    let remainingToConsume = amount;
    let bonusConsumed = 0;
    let purchasedConsumed = 0;
    
    // Consumir bônus primeiro
    if (wallet.bonus_credits > 0) {
        bonusConsumed = Math.min(wallet.bonus_credits, remainingToConsume);
        remainingToConsume -= bonusConsumed;
    }
    
    // Se ainda falta, consumir comprados
    if (remainingToConsume > 0) {
        purchasedConsumed = remainingToConsume;
    }
    
    // Novos saldos
    const newBonusCredits = wallet.bonus_credits - bonusConsumed;
    const newPurchasedPoints = wallet.purchased_points - purchasedConsumed;
    const previousBalance = totalAvailable;
    const newBalance = newBonusCredits + newPurchasedPoints;
    
    // Atualizar carteira
    const { error: updateError } = await supabaseAdmin
        .from('economy.user_wallets')
        .update({
            bonus_credits: newBonusCredits,
            purchased_points: newPurchasedPoints,
            updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    
    if (updateError) {
        throw new Error('Erro ao atualizar carteira');
    }
    
    // Registrar transação de débito
    const { data: transaction } = await supabaseAdmin
        .from('economy.transactions')
        .insert({
            wallet_id: wallet.id,
            user_id: userId,
            type: 'debit', // economy.transaction_type
            amount: -amount, // Negativo para débito
            description: metadata.description || 'Consumo de pontos',
            metadata: {
                tool_name: metadata.tool_name || null,
                bonus_consumed: bonusConsumed,
                purchased_consumed: purchasedConsumed,
                ...metadata
            }
        })
        .select()
        .single();
    
    return {
        consumed: amount,
        bonus_consumed: bonusConsumed,
        purchased_consumed: purchasedConsumed,
        previous_balance: previousBalance,
        new_balance: newBalance,
        transaction
    };
}

/**
 * Adicionar pontos bônus (gratuitos)
 */
export async function addBonusPoints(userId, amount, metadata = {}) {
    if (amount <= 0) {
        throw new Error('Quantidade de pontos deve ser maior que zero');
    }
    
    const { data: wallet, error } = await supabase
        .from('economy.user_wallets')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (error) {
        throw new Error('Erro ao buscar carteira do usuário');
    }
    
    const newBonusCredits = wallet.bonus_credits + amount;
    
    // Atualizar carteira
    const { error: updateError } = await supabaseAdmin
        .from('economy.user_wallets')
        .update({
            bonus_credits: newBonusCredits,
            updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    
    if (updateError) {
        throw new Error('Erro ao atualizar carteira');
    }
    
    // Registrar transação
    const { data: transaction } = await supabaseAdmin
        .from('economy.transactions')
        .insert({
            wallet_id: wallet.id,
            user_id: userId,
            type: metadata.type || 'credit', // credit, bonus, adjustment
            amount: amount, // Positivo para crédito
            description: metadata.description || 'Adição de pontos bônus',
            metadata: {
                source: metadata.source || 'manual',
                referred_user_id: metadata.referred_user_id || null,
                achievement_id: metadata.achievement_id || null,
                ...metadata
            }
        })
        .select()
        .single();
    
    return {
        added: amount,
        new_balance: newBonusCredits,
        transaction
    };
}

/**
 * Adicionar pontos comprados (sem limite)
 */
export async function addPurchasedPoints(userId, amount, metadata = {}) {
    if (amount <= 0) {
        throw new Error('Quantidade de pontos deve ser maior que zero');
    }
    
    const { data: wallet, error } = await supabase
        .from('economy.user_wallets')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (error) {
        throw new Error('Erro ao buscar carteira do usuário');
    }
    
    const newPurchasedPoints = wallet.purchased_points + amount;
    
    // Atualizar carteira
    const { error: updateError } = await supabaseAdmin
        .from('economy.user_wallets')
        .update({
            purchased_points: newPurchasedPoints,
            updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    
    if (updateError) {
        throw new Error('Erro ao atualizar carteira');
    }
    
    // Registrar transação
    const { data: transaction } = await supabaseAdmin
        .from('economy.transactions')
        .insert({
            wallet_id: wallet.id,
            user_id: userId,
            type: 'purchase', // economy.transaction_type
            amount: amount,
            description: metadata.description || 'Compra de pontos',
            metadata: {
                package_id: metadata.package_id || null,
                payment_id: metadata.payment_id || null,
                stripe_payment_id: metadata.stripe_payment_id || null,
                ...metadata
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
 * Obter custo de uma ferramenta (pelo slug ou nome)
 */
export async function getToolCost(toolIdentifier) {
    const { data, error } = await supabase
        .from('tools.catalog')
        .select('*')
        .or(`slug.eq.${toolIdentifier},name.eq.${toolIdentifier}`)
        .eq('is_active', true)
        .single();
    
    if (error || !data) {
        throw new Error(`Ferramenta "${toolIdentifier}" não encontrada ou inativa`);
    }
    
    return data;
}

/**
 * Calcular custo real da ferramenta (considera multiplicador Pro)
 */
export async function calculateToolCost(toolIdentifier, userId) {
    const tool = await getToolCost(toolIdentifier);
    
    // Verificar se usuário é Pro
    const { data: subscription } = await supabase
        .from('economy.subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .single();
    
    const isPro = !!subscription;
    const finalCost = isPro 
        ? Math.round(tool.base_cost * (tool.pro_multiplier || 1.0))
        : tool.base_cost;
    
    return {
        tool,
        base_cost: tool.base_cost,
        final_cost: finalCost,
        is_pro: isPro,
        discount: isPro ? tool.base_cost - finalCost : 0
    };
}

/**
 * Verificar se usuário tem pontos suficientes para uma ferramenta
 */
export async function canUseTool(userId, toolIdentifier) {
    const costInfo = await calculateToolCost(toolIdentifier, userId);
    
    const { data: wallet, error } = await supabase
        .from('economy.user_wallets')
        .select('bonus_credits, purchased_points')
        .eq('user_id', userId)
        .single();
    
    if (error) {
        throw new Error('Erro ao buscar carteira do usuário');
    }
    
    const totalPoints = wallet.bonus_credits + wallet.purchased_points;
    const canUse = totalPoints >= costInfo.final_cost;
    const missing = canUse ? 0 : costInfo.final_cost - totalPoints;
    
    return {
        can_use: canUse,
        tool_cost: costInfo.final_cost,
        base_cost: costInfo.base_cost,
        current_balance: totalPoints,
        missing_points: missing,
        is_pro: costInfo.is_pro,
        discount: costInfo.discount,
        tool: costInfo.tool
    };
}

/**
 * Obter saldo total do usuário
 */
export async function getUserBalance(userId) {
    const { data: wallet, error } = await supabase
        .from('economy.user_wallets')
        .select('bonus_credits, purchased_points')
        .eq('user_id', userId)
        .single();
    
    if (error) {
        throw new Error('Erro ao buscar carteira do usuário');
    }
    
    return {
        bonus_credits: wallet.bonus_credits,
        purchased_points: wallet.purchased_points,
        total: wallet.bonus_credits + wallet.purchased_points
    };
}

/**
 * Obter histórico de transações do usuário
 */
export async function getTransactionHistory(userId, limit = 20) {
    const { data: wallet } = await supabase
        .from('economy.user_wallets')
        .select('id')
        .eq('user_id', userId)
        .single();
    
    if (!wallet) {
        return [];
    }
    
    const { data: transactions, error } = await supabase
        .from('economy.transactions')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
        .limit(limit);
    
    if (error) {
        throw new Error('Erro ao buscar histórico de transações');
    }
    
    return transactions;
}

/**
 * RETROCOMPATIBILIDADE: Manter nomes antigos (deprecated)
 * @deprecated Use addBonusPoints() instead
 */
export const addFreePoints = addBonusPoints;

/**
 * @deprecated Use addPurchasedPoints() instead
 */
export const addPaidPoints = addPurchasedPoints;
