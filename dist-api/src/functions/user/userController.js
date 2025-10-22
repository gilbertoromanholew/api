import { supabase, supabaseAdmin } from '../../config/supabase.js';

/**
 * GET /api/user/profile
 * Retorna perfil completo do usuário
 */
export async function getProfile(req, res) {
    try {
        const userId = req.user.id;
        
        // Buscar perfil
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();
        
        if (profileError) {
            throw new Error('Erro ao buscar perfil');
        }
        
        // Buscar pontos
        const { data: points, error: pointsError } = await supabase
            .from('user_points')
            .select('*')
            .eq('user_id', userId)
            .single();
        
        if (pointsError) {
            throw new Error('Erro ao buscar pontos');
        }
        
        // Buscar dados de autenticação (email)
        const { data: { user }, error: authError } = await supabase.auth.getUser(req.user.token);
        
        if (authError) {
            throw new Error('Erro ao buscar dados de autenticação');
        }
        
        return res.json({
            success: true,
            data: {
                profile: {
                    user_id: userId,
                    email: user.email,
                    email_confirmed: user.email_confirmed_at !== null,
                    full_name: profile.full_name,
                    cpf: profile.cpf,
                    referral_code: profile.referral_code,
                    referred_by: profile.referred_by,
                    welcome_popup_shown: profile.welcome_popup_shown || false,
                    created_at: profile.created_at
                },
                points: {
                    free_points: points.free_points,
                    paid_points: points.paid_points,
                    total: points.free_points + points.paid_points,
                    free_points_limit: points.free_points_limit,
                    total_earned: points.total_earned,
                    total_purchased: points.total_purchased,
                    total_spent: points.total_spent
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
 * PUT /api/user/profile
 * Atualiza perfil do usuário (apenas nome completo)
 */
export async function updateProfile(req, res) {
    try {
        const userId = req.user.id;
        const { full_name } = req.body;
        
        if (!full_name || full_name.trim().length < 3) {
            return res.status(400).json({
                success: false,
                error: 'Nome completo inválido (mínimo 3 caracteres)'
            });
        }
        
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({ full_name: full_name.trim() })
            .eq('user_id', userId)
            .select()
            .single();
        
        if (error) {
            throw new Error('Erro ao atualizar perfil');
        }
        
        return res.json({
            success: true,
            data: {
                full_name: data.full_name,
                updated_at: data.updated_at
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
 * GET /api/user/stats
 * Retorna estatísticas do usuário
 */
export async function getStats(req, res) {
    try {
        const userId = req.user.id;
        
        // Contar total de transações
        const { count: totalTransactions } = await supabase
            .from('point_transactions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
        
        // Contar uso de ferramentas
        const { count: toolUsageCount } = await supabase
            .from('point_transactions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('type', 'tool_usage');
        
        // Buscar ferramenta mais usada
        const { data: toolUsages } = await supabase
            .from('point_transactions')
            .select('tool_name')
            .eq('user_id', userId)
            .eq('type', 'tool_usage')
            .not('tool_name', 'is', null);
        
        // Contar frequência de cada ferramenta
        const toolFrequency = {};
        toolUsages?.forEach(tx => {
            toolFrequency[tx.tool_name] = (toolFrequency[tx.tool_name] || 0) + 1;
        });
        
        const mostUsedTool = Object.entries(toolFrequency)
            .sort(([, a], [, b]) => b - a)[0];
        
        // Buscar pontos
        const { data: points } = await supabase
            .from('user_points')
            .select('*')
            .eq('user_id', userId)
            .single();
        
        // Contar referrals
        const { count: referralCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('referred_by', userId);
        
        // Buscar compras (quando Stripe estiver implementado)
        const { count: purchaseCount, data: purchases } = await supabase
            .from('purchases')
            .select('amount', { count: 'exact' })
            .eq('user_id', userId)
            .eq('status', 'completed');
        
        const totalSpent = purchases?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        
        return res.json({
            success: true,
            data: {
                points: {
                    total_earned: points?.total_earned || 0,
                    total_purchased: points?.total_purchased || 0,
                    total_spent: points?.total_spent || 0,
                    current_balance: (points?.free_points || 0) + (points?.paid_points || 0)
                },
                usage: {
                    total_transactions: totalTransactions || 0,
                    tools_used: toolUsageCount || 0,
                    most_used_tool: mostUsedTool ? {
                        name: mostUsedTool[0],
                        count: mostUsedTool[1]
                    } : null
                },
                referrals: {
                    total_referred: referralCount || 0,
                    bonus_earned: (referralCount || 0) * 5 // 5 pontos por indicação
                },
                purchases: {
                    total_purchases: purchaseCount || 0,
                    total_spent_brl: totalSpent
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
 * GET /api/user/referrals
 * Lista usuários indicados
 */
export async function getReferrals(req, res) {
    try {
        const userId = req.user.id;
        
        const { data, error } = await supabase
            .from('profiles')
            .select('full_name, created_at')
            .eq('referred_by', userId)
            .order('created_at', { ascending: false });
        
        if (error) {
            throw new Error('Erro ao buscar indicações');
        }
        
        return res.json({
            success: true,
            data: {
                total: data.length,
                referrals: data.map(ref => ({
                    name: ref.full_name,
                    joined_at: ref.created_at
                }))
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
