/**
 * Admin Panel Routes - V7
 * 
 * Endpoints administrativos para gerenciamento de usuários, créditos e sistema.
 * Todos os endpoints requerem autenticação e role de admin.
 * 
 * Rotas:
 * - GET    /api/admin/users              Lista todos os usuários
 * - GET    /api/admin/users/:id          Detalhes de um usuário
 * - POST   /api/admin/users/:id/credits  Adicionar/remover créditos
 * - PATCH  /api/admin/users/:id/role     Alterar role do usuário
 * - DELETE /api/admin/users/:id          Desativar usuário
 * - GET    /api/admin/stats              Estatísticas gerais do sistema
 * - GET    /api/admin/tools              Estatísticas de ferramentas
 * - GET    /api/admin/transactions       Histórico de transações
 */

import express from 'express';
import { requireAuth, requireAdmin } from '../middlewares/adminAuth.js';
import { supabaseAdmin } from '../config/supabase.js';
import logger from '../config/logger.js';
import { maskCPF } from '../utils/maskSensitiveData.js';

const router = express.Router();

// Aplicar middleware de autenticação e admin em todas as rotas
router.use(requireAuth);
router.use(requireAdmin);

/**
 * GET /api/admin/users
 * Lista todos os usuários com paginação
 */
router.get('/users', async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', role = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = supabaseAdmin
            .from('profiles')
            .select('id, full_name, cpf, referral_code, role, created_at', { count: 'exact' });

        // Filtro de busca (nome ou CPF)
        if (search) {
            query = query.or(`full_name.ilike.%${search}%,cpf.ilike.%${search}%`);
        }

        // Filtro de role
        if (role) {
            query = query.eq('role', role);
        }

        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data: profiles, error: profilesError, count } = await query;

        if (profilesError) {
            throw profilesError;
        }

        // Buscar dados de auth (email) e carteira para cada usuário
        const usersWithDetails = await Promise.all(
            profiles.map(async (profile) => {
                // Buscar email do auth
                const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
                
                // Buscar carteira
                const { data: wallet } = await supabaseAdmin
                    .from('economy_user_wallets')
                    .select('bonus_credits, purchased_points, total_spent')
                    .eq('user_id', profile.id)
                    .single();

                // Buscar presença (status online/offline)
                const { data: presence } = await supabaseAdmin
                    .from('user_presence')
                    .select('is_online, last_seen')
                    .eq('user_id', profile.id)
                    .single();

                return {
                    id: profile.id,
                    full_name: profile.full_name,
                    email: user?.email || 'N/A',
                    cpf: maskCPF(profile.cpf),
                    role: profile.role,
                    referral_code: profile.referral_code,
                    is_online: presence?.is_online || false,
                    last_seen: presence?.last_seen || null,
                    credits: {
                        bonus: wallet?.bonus_credits || 0,
                        purchased: wallet?.purchased_points || 0,
                        total: (wallet?.bonus_credits || 0) + (wallet?.purchased_points || 0),
                        spent: wallet?.total_spent || 0
                    },
                    created_at: profile.created_at
                };
            })
        );

        logger.info('Admin listou usuários', {
            adminId: req.user.id,
            page,
            limit,
            total: count,
            search,
            role
        });

        res.json({
            success: true,
            data: {
                users: usersWithDetails,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            }
        });
    } catch (error) {
        logger.error('Erro ao listar usuários (admin)', {
            adminId: req.user.id,
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: 'Erro ao listar usuários',
            message: error.message
        });
    }
});

/**
 * GET /api/admin/users/:id
 * Detalhes completos de um usuário
 */
router.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar perfil
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (profileError) {
            throw profileError;
        }

        // Buscar dados de auth
        const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.getUserById(id);

        // Buscar carteira
        const { data: wallet } = await supabaseAdmin
            .from('economy_user_wallets')
            .select('*')
            .eq('user_id', id)
            .single();

        // Buscar histórico de transações (últimas 50)
        const { data: transactions } = await supabaseAdmin
            .from('economy_transactions')
            .select('*')
            .eq('user_id', id)
            .order('created_at', { ascending: false })
            .limit(50);

        // Buscar ferramentas executadas (últimas 20)
        const { data: toolUsage } = await supabaseAdmin
            .from('tools_usage')
            .select('tool_slug, created_at, cost')
            .eq('user_id', id)
            .order('created_at', { ascending: false })
            .limit(20);

        // Buscar referrals feitos
        const { data: referrals } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, created_at')
            .eq('referred_by', profile.referral_code);

        logger.info('Admin visualizou detalhes de usuário', {
            adminId: req.user.id,
            targetUserId: id
        });

        res.json({
            success: true,
            data: {
                profile: {
                    id: profile.id,
                    full_name: profile.full_name,
                    email: user?.email || 'N/A',
                    cpf: profile.cpf, // Admin pode ver CPF completo
                    role: profile.role,
                    referral_code: profile.referral_code,
                    referred_by: profile.referred_by,
                    email_verified: profile.email_verified,
                    created_at: profile.created_at
                },
                wallet: {
                    bonus_credits: wallet?.bonus_credits || 0,
                    purchased_points: wallet?.purchased_points || 0,
                    total: (wallet?.bonus_credits || 0) + (wallet?.purchased_points || 0),
                    total_earned: wallet?.total_earned_bonus || 0,
                    total_purchased: wallet?.total_purchased || 0,
                    total_spent: wallet?.total_spent || 0
                },
                activity: {
                    recent_transactions: transactions || [],
                    recent_tools: toolUsage || [],
                    referrals: referrals || []
                }
            }
        });
    } catch (error) {
        logger.error('Erro ao buscar detalhes do usuário (admin)', {
            adminId: req.user.id,
            targetUserId: req.params.id,
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar detalhes do usuário',
            message: error.message
        });
    }
});

/**
 * POST /api/admin/users/:id/credits
 * Adicionar ou remover créditos de um usuário
 * 
 * Body: {
 *   amount: number (positivo para adicionar, negativo para remover),
 *   type: 'bonus' | 'purchased',
 *   reason: string (motivo da ação)
 * }
 */
router.post('/users/:id/credits', async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, type = 'bonus', reason = 'Ajuste manual do admin' } = req.body;

        if (!amount || isNaN(amount)) {
            return res.status(400).json({
                success: false,
                error: 'Amount inválido. Deve ser um número (positivo para adicionar, negativo para remover).'
            });
        }

        if (!['bonus', 'purchased'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Type inválido. Deve ser "bonus" ou "purchased".'
            });
        }

        // Buscar carteira atual
        const { data: wallet, error: walletError } = await supabaseAdmin
            .from('economy_user_wallets')
            .select('*')
            .eq('user_id', id)
            .single();

        if (walletError) {
            throw walletError;
        }

        // Calcular novos valores
        const field = type === 'bonus' ? 'bonus_credits' : 'purchased_points';
        const currentValue = wallet[field];
        const newValue = currentValue + parseInt(amount);

        // Validar que não fique negativo
        if (newValue < 0) {
            return res.status(400).json({
                success: false,
                error: `Operação inválida. O usuário possui apenas ${currentValue} créditos de tipo ${type}.`
            });
        }

        // Atualizar carteira
        const { data: updatedWallet, error: updateError } = await supabaseAdmin
            .from('economy_user_wallets')
            .update({ [field]: newValue })
            .eq('user_id', id)
            .select()
            .single();

        if (updateError) {
            throw updateError;
        }

        // Registrar transação
        await supabaseAdmin
            .from('economy_transactions')
            .insert({
                user_id: id,
                type: amount > 0 ? 'credit' : 'debit',
                amount: Math.abs(amount),
                description: reason,
                source: 'admin_panel',
                metadata: {
                    admin_id: req.user.id,
                    admin_email: req.user.email,
                    credit_type: type,
                    previous_value: currentValue,
                    new_value: newValue
                }
            });

        logger.security('Admin ajustou créditos de usuário', {
            adminId: req.user.id,
            targetUserId: id,
            amount,
            type,
            reason,
            previousValue: currentValue,
            newValue
        });

        res.json({
            success: true,
            message: `${amount > 0 ? 'Adicionados' : 'Removidos'} ${Math.abs(amount)} créditos ${type} com sucesso.`,
            data: {
                previous: currentValue,
                current: newValue,
                change: amount
            }
        });
    } catch (error) {
        logger.error('Erro ao ajustar créditos (admin)', {
            adminId: req.user.id,
            targetUserId: req.params.id,
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: 'Erro ao ajustar créditos',
            message: error.message
        });
    }
});

/**
 * PATCH /api/admin/users/:id/role
 * Alterar role do usuário
 * 
 * Body: {
 *   role: 'user' | 'admin' | 'moderator'
 * }
 */
router.patch('/users/:id/role', async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const validRoles = ['user', 'admin', 'moderator'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                error: `Role inválido. Valores permitidos: ${validRoles.join(', ')}`
            });
        }

        // Atualizar role
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({ role })
            .eq('id', id)
            .select('id, full_name, role')
            .single();

        if (error) {
            throw error;
        }

        logger.security('Admin alterou role de usuário', {
            adminId: req.user.id,
            targetUserId: id,
            newRole: role
        });

        res.json({
            success: true,
            message: `Role do usuário alterado para "${role}" com sucesso.`,
            data
        });
    } catch (error) {
        logger.error('Erro ao alterar role (admin)', {
            adminId: req.user.id,
            targetUserId: req.params.id,
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: 'Erro ao alterar role',
            message: error.message
        });
    }
});

/**
 * DELETE /api/admin/users/:id
 * Desativar usuário (não deleta, apenas marca como inativo)
 * 
 * Body: {
 *   reason: string (motivo da desativação)
 * }
 */
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason = 'Desativado pelo administrador' } = req.body;

        // Não permitir deletar próprio usuário
        if (id === req.user.id) {
            return res.status(400).json({
                success: false,
                error: 'Você não pode desativar sua própria conta.'
            });
        }

        // Desativar usuário no Supabase Auth
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
            ban_duration: '876000h' // 100 anos (efetivamente permanente)
        });

        if (authError) {
            throw authError;
        }

        // Marcar perfil como inativo
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({
                role: 'inactive',
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select('id, full_name')
            .single();

        if (error) {
            throw error;
        }

        logger.security('Admin desativou usuário', {
            adminId: req.user.id,
            targetUserId: id,
            reason
        });

        res.json({
            success: true,
            message: `Usuário ${data.full_name} desativado com sucesso.`,
            data: {
                user_id: data.id,
                reason
            }
        });
    } catch (error) {
        logger.error('Erro ao desativar usuário (admin)', {
            adminId: req.user.id,
            targetUserId: req.params.id,
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: 'Erro ao desativar usuário',
            message: error.message
        });
    }
});

/**
 * GET /api/admin/stats
 * Estatísticas gerais do sistema
 */
router.get('/stats', async (req, res) => {
    try {
        // Contar usuários totais
        const { count: totalUsers } = await supabaseAdmin
            .from('profiles')
            .select('id', { count: 'exact', head: true });

        // Contar usuários por role
        const { data: roleStats } = await supabaseAdmin
            .from('profiles')
            .select('role');

        const roleCount = roleStats.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
        }, {});

        // Usuários criados nos últimos 30 dias
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { count: newUsers } = await supabaseAdmin
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', thirtyDaysAgo.toISOString());

        // Total de créditos no sistema
        const { data: wallets } = await supabaseAdmin
            .from('economy_user_wallets')
            .select('bonus_credits, purchased_points, total_spent');

        const creditsStats = wallets.reduce((acc, wallet) => ({
            totalBonus: acc.totalBonus + (wallet.bonus_credits || 0),
            totalPurchased: acc.totalPurchased + (wallet.purchased_points || 0),
            totalSpent: acc.totalSpent + (wallet.total_spent || 0)
        }), { totalBonus: 0, totalPurchased: 0, totalSpent: 0 });

        // Ferramentas mais usadas (últimos 30 dias)
        const { data: toolUsage } = await supabaseAdmin
            .from('tools_usage')
            .select('tool_slug')
            .gte('created_at', thirtyDaysAgo.toISOString());

        const toolStats = toolUsage.reduce((acc, usage) => {
            acc[usage.tool_slug] = (acc[usage.tool_slug] || 0) + 1;
            return acc;
        }, {});

        const topTools = Object.entries(toolStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([slug, count]) => ({ slug, count }));

        logger.info('Admin consultou estatísticas do sistema', {
            adminId: req.user.id
        });

        res.json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    newLast30Days: newUsers,
                    byRole: roleCount
                },
                credits: {
                    totalBonus: creditsStats.totalBonus,
                    totalPurchased: creditsStats.totalPurchased,
                    totalInCirculation: creditsStats.totalBonus + creditsStats.totalPurchased,
                    totalSpent: creditsStats.totalSpent
                },
                tools: {
                    topUsed: topTools,
                    totalExecutions: toolUsage.length
                }
            }
        });
    } catch (error) {
        logger.error('Erro ao buscar estatísticas (admin)', {
            adminId: req.user.id,
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar estatísticas',
            message: error.message
        });
    }
});

/**
 * GET /api/admin/transactions
 * Histórico de transações do sistema
 */
router.get('/transactions', async (req, res) => {
    try {
        const { page = 1, limit = 50, type = '', userId = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = supabaseAdmin
            .from('economy_transactions')
            .select('*', { count: 'exact' });

        if (type) {
            query = query.eq('type', type);
        }

        if (userId) {
            query = query.eq('user_id', userId);
        }

        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data: transactions, error, count } = await query;

        if (error) {
            throw error;
        }

        logger.info('Admin consultou histórico de transações', {
            adminId: req.user.id,
            page,
            limit,
            type,
            userId
        });

        res.json({
            success: true,
            data: {
                transactions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            }
        });
    } catch (error) {
        logger.error('Erro ao buscar transações (admin)', {
            adminId: req.user.id,
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar transações',
            message: error.message
        });
    }
});

export default router;
