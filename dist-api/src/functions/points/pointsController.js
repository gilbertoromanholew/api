import { supabaseAdmin } from '../../config/supabase.js';
import { consumePoints, addFreePoints, addPaidPoints, canUseTool } from './pointsService.js';

/**
 * GET /api/points/balance
 * Retorna saldo atual de pontos do usuário
 */
export async function getBalance(req, res) {
    try {
        const userId = req.user.id;
        
        console.log('💰 [Points] Buscando saldo para:', userId)
        
        // V7: Buscar da carteira
        const { data, error } = await supabaseAdmin
            .from('economy_user_wallets')
            .select('*')
            .eq('user_id', userId)
            .single();
        
        if (error) {
            console.error('❌ [Points] Erro ao buscar carteira:', error)
            throw new Error('Erro ao buscar saldo de pontos: ' + error.message);
        }
        
        if (!data) {
            console.warn('⚠️ [Points] Carteira não encontrada para:', userId)
            return res.status(404).json({
                success: false,
                error: 'Carteira não encontrada'
            });
        }
        
        console.log('✅ [Points] Carteira encontrada:', {
            bonus: data.bonus_credits,
            purchased: data.purchased_points,
            total: data.bonus_credits + data.purchased_points
        })
        
        return res.json({
            success: true,
            data: {
                // V7: Nomes corretos do banco
                bonus_credits: data.bonus_credits,
                purchased_points: data.purchased_points,
                total_credits: data.bonus_credits + data.purchased_points, // Calculado
                total_earned_bonus: data.total_earned_bonus,
                total_purchased: data.total_purchased,
                total_spent: data.total_spent,
                pro_weekly_allowance: data.pro_weekly_allowance,
                last_allowance_date: data.last_allowance_date,
                // V6: Compatibilidade com frontend (deprecated)
                purchased_credits: data.purchased_points, // Alias para purchased_points
                free_points: data.bonus_credits,
                paid_points: data.purchased_points,
                total_points: data.bonus_credits + data.purchased_points
            }
        });
    } catch (error) {
        console.error('❌ [Points] Exceção:', error)
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * GET /api/points/history
 * Retorna histórico de transações de pontos (paginado)
 */
export async function getHistory(req, res) {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const type = req.query.type; // opcional: filtrar por tipo
        
        const offset = (page - 1) * limit;
        
        // V7: Montar query
        let query = supabaseAdmin
            .from('economy_transactions')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        
        // Filtro por tipo (se fornecido)
        if (type) {
            query = query.eq('type', type);
        }
        
        const { data, error, count } = await query;
        
        if (error) {
            throw new Error('Erro ao buscar histórico de pontos');
        }
        
        const totalPages = Math.ceil(count / limit);
        
        return res.json({
            success: true,
            data: {
                transactions: data,
                pagination: {
                    page,
                    limit,
                    total: count,
                    total_pages: totalPages,
                    has_next: page < totalPages,
                    has_prev: page > 1
                }
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * POST /api/points/consume
 * Consome pontos manualmente (admin ou internal use)
 */
export async function consume(req, res) {
    try {
        const userId = req.user.id;
        const { amount, description, tool_name, type } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Quantidade de pontos inválida'
            });
        }
        
        const metadata = {
            type: type || 'manual_consumption',
            description: description || 'Consumo manual de pontos',
            tool_name: tool_name || null
        };
        
        const result = await consumePoints(userId, amount, metadata);
        
        return res.json({
            success: true,
            data: result
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * GET /api/points/can-use/:tool_name
 * Verifica se usuário tem pontos suficientes para usar uma ferramenta
 */
export async function checkCanUse(req, res) {
    try {
        const userId = req.user.id;
        const { tool_name } = req.params;
        
        if (!tool_name) {
            return res.status(400).json({
                success: false,
                error: 'Nome da ferramenta não fornecido'
            });
        }
        
        const result = await canUseTool(userId, tool_name);
        
        return res.json({
            success: true,
            data: result
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * POST /api/points/add-free (ADMIN ONLY - exemplo para futuras promoções)
 * Adiciona pontos gratuitos a um usuário
 */
export async function addFree(req, res) {
    try {
        // TODO: Adicionar middleware requireAdmin quando implementar
        const { user_id, amount, description } = req.body;
        
        if (!user_id || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Parâmetros inválidos'
            });
        }
        
        const result = await addFreePoints(user_id, amount, {
            type: 'admin_adjustment',
            description: description || 'Adição manual de pontos gratuitos'
        });
        
        return res.json({
            success: true,
            data: result
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
}
