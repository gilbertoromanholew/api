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
    
    // Buscar pontos atuais
    const { data: points, error: pointsError } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (pointsError) {
        throw new Error('Erro ao buscar pontos do usuário');
    }
    
    const totalAvailable = points.free_points + points.paid_points;
    
    if (totalAvailable < amount) {
        throw new Error(`Pontos insuficientes. Você tem ${totalAvailable}, mas precisa de ${amount}`);
    }
    
    // Calcular consumo (prioriza gratuitos)
    let remainingToConsume = amount;
    let freeConsumed = 0;
    let paidConsumed = 0;
    
    // Consumir gratuitos primeiro
    if (points.free_points > 0) {
        freeConsumed = Math.min(points.free_points, remainingToConsume);
        remainingToConsume -= freeConsumed;
    }
    
    // Se ainda falta, consumir pagos
    if (remainingToConsume > 0) {
        paidConsumed = remainingToConsume;
    }
    
    // Novos saldos
    const newFreePoints = points.free_points - freeConsumed;
    const newPaidPoints = points.paid_points - paidConsumed;
    const previousBalance = totalAvailable;
    const newBalance = newFreePoints + newPaidPoints;
    
    // Atualizar pontos
    const { error: updateError } = await supabaseAdmin
        .from('user_points')
        .update({
            free_points: newFreePoints,
            paid_points: newPaidPoints,
            total_spent: points.total_spent + amount
        })
        .eq('user_id', userId);
    
    if (updateError) {
        throw new Error('Erro ao atualizar pontos');
    }
    
    // Registrar transação(ões)
    const transactions = [];
    
    // Transação de consumo de pontos gratuitos
    if (freeConsumed > 0) {
        const { data: freeTx } = await supabaseAdmin
            .from('point_transactions')
            .insert({
                user_id: userId,
                type: metadata.type || 'tool_usage',
                point_type: 'free',
                amount: -freeConsumed,
                balance_before: points.free_points,
                balance_after: newFreePoints,
                description: metadata.description || 'Consumo de pontos',
                tool_name: metadata.tool_name || null
            })
            .select()
            .single();
        
        if (freeTx) transactions.push(freeTx);
    }
    
    // Transação de consumo de pontos pagos
    if (paidConsumed > 0) {
        const { data: paidTx } = await supabaseAdmin
            .from('point_transactions')
            .insert({
                user_id: userId,
                type: metadata.type || 'tool_usage',
                point_type: 'paid',
                amount: -paidConsumed,
                balance_before: points.paid_points,
                balance_after: newPaidPoints,
                description: metadata.description || 'Consumo de pontos',
                tool_name: metadata.tool_name || null
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
    
    const { data: points, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (error) {
        throw new Error('Erro ao buscar pontos do usuário');
    }
    
    // Calcular quanto pode adicionar (respeitando limite)
    const spaceAvailable = points.free_points_limit - points.free_points;
    const actualAmount = Math.min(amount, spaceAvailable);
    
    if (actualAmount <= 0) {
        throw new Error(`Limite de pontos gratuitos atingido (${points.free_points_limit})`);
    }
    
    const newFreePoints = points.free_points + actualAmount;
    
    // Atualizar pontos
    const { error: updateError } = await supabaseAdmin
        .from('user_points')
        .update({
            free_points: newFreePoints,
            total_earned: points.total_earned + actualAmount
        })
        .eq('user_id', userId);
    
    if (updateError) {
        throw new Error('Erro ao atualizar pontos');
    }
    
    // Registrar transação
    const { data: transaction } = await supabaseAdmin
        .from('point_transactions')
        .insert({
            user_id: userId,
            type: metadata.type || 'admin_adjustment',
            point_type: 'free',
            amount: actualAmount,
            balance_before: points.free_points,
            balance_after: newFreePoints,
            description: metadata.description || 'Adição de pontos gratuitos',
            referred_user_id: metadata.referred_user_id || null
        })
        .select()
        .single();
    
    return {
        added: actualAmount,
        requested: amount,
        limited: actualAmount < amount,
        new_balance: newFreePoints,
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
    
    const { data: points, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (error) {
        throw new Error('Erro ao buscar pontos do usuário');
    }
    
    const newPaidPoints = points.paid_points + amount;
    
    // Atualizar pontos
    const { error: updateError } = await supabaseAdmin
        .from('user_points')
        .update({
            paid_points: newPaidPoints,
            total_purchased: points.total_purchased + amount
        })
        .eq('user_id', userId);
    
    if (updateError) {
        throw new Error('Erro ao atualizar pontos');
    }
    
    // Registrar transação
    const { data: transaction } = await supabaseAdmin
        .from('point_transactions')
        .insert({
            user_id: userId,
            type: metadata.type || 'purchase',
            point_type: 'paid',
            amount: amount,
            balance_before: points.paid_points,
            balance_after: newPaidPoints,
            description: metadata.description || 'Compra de pontos',
            stripe_payment_id: metadata.stripe_payment_id || null
        })
        .select()
        .single();
    
    return {
        added: amount,
        new_balance: newPaidPoints,
        transaction
    };
}

/**
 * Obter custo de uma ferramenta
 */
export async function getToolCost(toolName) {
    const { data, error } = await supabase
        .from('tool_costs')
        .select('*')
        .eq('tool_name', toolName)
        .eq('is_active', true)
        .single();
    
    if (error || !data) {
        throw new Error(`Ferramenta "${toolName}" não encontrada ou inativa`);
    }
    
    return data;
}

/**
 * Verificar se usuário tem pontos suficientes para uma ferramenta
 */
export async function canUseTool(userId, toolName) {
    const tool = await getToolCost(toolName);
    
    const { data: points, error } = await supabase
        .from('user_points')
        .select('free_points, paid_points')
        .eq('user_id', userId)
        .single();
    
    if (error) {
        throw new Error('Erro ao buscar pontos do usuário');
    }
    
    const totalPoints = points.free_points + points.paid_points;
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
