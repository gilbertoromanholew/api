/**
 * Admin Panel Routes - V7
 * 
 * Endpoints administrativos para gerenciamento de usuários, créditos e sistema.
 * 
 * 🔒 SEGURANÇA:
 * - Todos os endpoints /admin/* são protegidos por ipFilter (middleware global no server.js)
 * - Endpoints de dados requerem autenticação (requireAuth) + role admin (requireAdmin)
 * - Endpoints públicos (check-ip, login) apenas validam IP antes da autenticação
 * 
 * Rotas:
 * - GET    /api/admin/check-ip             Verifica IP antes do login (público, apenas ipFilter)
 * - GET    /api/admin/check-ip-access      Verifica se IP está na whitelist ZeroTier (público)
 * - POST   /api/admin/login                Login admin (público com validação de IP)
 * - GET    /api/admin/check-admin-role     Verifica se usuário tem role admin (requer auth)
 * - GET    /api/admin/users                Lista todos os usuários (ipFilter + auth + admin)
 * - GET    /api/admin/users/:id            Detalhes de um usuário (ipFilter + auth + admin)
 * - POST   /api/admin/users/:id/credits    Adicionar/remover créditos (ipFilter + auth + admin)
 * - PATCH  /api/admin/users/:id/role       Alterar role do usuário (ipFilter + auth + admin)
 * - DELETE /api/admin/users/:id            Desativar usuário (ipFilter + auth + admin)
 * - GET    /api/admin/stats                Estatísticas gerais do sistema (ipFilter + auth + admin)
 * - GET    /api/admin/tools                Estatísticas de uso de ferramentas (ipFilter + auth + admin)
 * - GET    /api/admin/tools-discovery      Ferramentas carregadas pelo auto-discovery (ipFilter + auth + admin)
 * - GET    /api/admin/transactions         Histórico de transações (ipFilter + auth + admin)
 * - GET    /api/admin/docs                 Documentação da API (ipFilter + auth + admin)
 * - GET    /api/admin/docs-data            Dados de documentação (ipFilter + auth + admin)
 * - GET    /api/admin/audit-log            Log de auditoria (ipFilter + auth + admin)
 * - GET    /api/admin/logs                 Logs do sistema (ipFilter + auth + admin)
 * - GET    /api/admin/logs/stats           Estatísticas de logs (ipFilter + auth + admin)
 * - DELETE /api/admin/logs                 Limpar logs antigos (ipFilter + auth + admin)
 */

import express from 'express';
import { requireAuth, requireAdmin } from '../middlewares/adminAuth.js';
import { supabaseAdmin } from '../config/supabase.js';
import logger from '../config/logger.js';
import { maskCPF } from '../utils/maskSensitiveData.js';
import { checkAdminIP, isAdminIPAllowed } from '../middlewares/adminIpCheck.js';
import { getClientIP } from '../utils/ipUtils.js';
import { getRateLimitConfigs, getRateLimitForEndpoint } from '../utils/rateLimitReader.js';

const router = express.Router();

// ============================================
// ROTAS PÚBLICAS (Antes do Login)
// ============================================

/**
 * GET /api/admin/check-ip
 * Verifica se o IP do cliente está autorizado para acesso admin (antes do login)
 * Endpoint público usado pelo frontend para validar IP antes de mostrar tela de login
 */
router.get('/check-ip', checkAdminIP, (req, res) => {
    try {
        const { ip, allowed, network } = req.adminIPCheck;

        logger.info('🔍 Verificação de IP pré-login admin', {
            ip,
            allowed,
            network,
            userAgent: req.headers['user-agent']
        });

        res.json({
            success: true,
            data: {
                ip,
                allowed,
                network: network,
                message: allowed 
                    ? 'IP autorizado para acesso administrativo'
                    : 'Acesso admin restrito à rede autorizada'
            }
        });
    } catch (error) {
        logger.error('Erro ao verificar IP pré-login', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            error: 'Erro ao verificar IP',
            message: error.message
        });
    }
});

/**
 * POST /api/admin/login
 * Login específico para administradores com validação de IP
 * Endpoint público que valida: IP ZeroTier + Credenciais + Role Admin
 */
router.post('/login', checkAdminIP, async (req, res) => {
    try {
        const { cpf, password } = req.body;
        const { ip, allowed } = req.adminIPCheck;

        // Validar IP
        if (!allowed) {
            logger.warn('⚠️ Tentativa de login admin de IP não autorizado', {
                ip,
                cpf: cpf?.substring(0, 3) + '***',
                userAgent: req.headers['user-agent']
            });
            return res.status(403).json({
                success: false,
                error: 'FORBIDDEN',
                message: 'Acesso admin restrito à rede ZeroTier',
                yourIP: ip
            });
        }

        // Validar campos obrigatórios
        if (!cpf || !password) {
            return res.status(400).json({
                success: false,
                error: 'BAD_REQUEST',
                message: 'CPF e senha são obrigatórios'
            });
        }

        // Buscar usuário por CPF
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, cpf, role')
            .eq('cpf', cpf)
            .single();

        if (profileError || !profile) {
            logger.warn('⚠️ Tentativa de login admin com CPF inválido', {
                ip,
                cpf: cpf.substring(0, 3) + '***'
            });
            return res.status(401).json({
                success: false,
                error: 'INVALID_CREDENTIALS',
                message: 'CPF ou senha inválidos'
            });
        }

        // Verificar se tem role admin
        if (profile.role !== 'admin') {
            logger.warn('⚠️ Tentativa de login admin sem permissão', {
                ip,
                userId: profile.id,
                role: profile.role
            });
            return res.status(403).json({
                success: false,
                error: 'FORBIDDEN',
                message: 'Acesso negado: permissão insuficiente'
            });
        }

        // Buscar email do usuário
        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.admin.getUserById(profile.id);

        if (authError || !authUser?.email) {
            throw new Error('Erro ao buscar dados de autenticação');
        }

        // Tentar autenticar com Supabase Auth
        const { data: authData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
            email: authUser.email,
            password
        });

        if (signInError) {
            logger.warn('⚠️ Tentativa de login admin com senha inválida', {
                ip,
                userId: profile.id
            });
            return res.status(401).json({
                success: false,
                error: 'INVALID_CREDENTIALS',
                message: 'CPF ou senha inválidos'
            });
        }

        // Configurar cookies HTTP-only com os tokens
        // IMPORTANTE: Usar os mesmos nomes de cookie do login normal
        const isDevelopment = process.env.NODE_ENV === 'development';
        const cookieOptions = {
            httpOnly: true,
            secure: !isDevelopment, // HTTPS em produção
            sameSite: 'strict', // CSRF Protection
            maxAge: authData.session.expires_in * 1000, // Usar expires_in da sessão
            path: '/'
        };

        res.cookie('sb-access-token', authData.session.access_token, cookieOptions);
        res.cookie('sb-refresh-token', authData.session.refresh_token, {
            ...cookieOptions,
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 dias para refresh token
        });

        logger.security('✅ Login admin bem-sucedido', {
            ip,
            userId: profile.id,
            userName: profile.full_name,
            role: profile.role
        });

        res.json({
            success: true,
            message: 'Login admin realizado com sucesso',
            data: {
                user: {
                    id: profile.id,
                    full_name: profile.full_name,
                    role: profile.role
                },
                session: authData.session
            }
        });
    } catch (error) {
        logger.error('❌ Erro no login admin', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            error: 'INTERNAL_ERROR',
            message: 'Erro ao processar login'
        });
    }
});

// ============================================
// ROTAS AUTENTICADAS
// ============================================

/**
 * GET /api/admin/users
 * Lista todos os usuários com paginação

 */
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
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
                    .select('bonus_credits, purchased_credits, total_spent')
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
                        purchased: wallet?.purchased_credits || 0,
                        total: (wallet?.bonus_credits || 0) + (wallet?.purchased_credits || 0),
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
router.get('/users/:id', requireAuth, requireAdmin, async (req, res) => {
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
                    purchased_credits: wallet?.purchased_credits || 0,
                    total: (wallet?.bonus_credits || 0) + (wallet?.purchased_credits || 0),
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
router.post('/users/:id/credits', requireAuth, requireAdmin, async (req, res) => {
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
        const field = type === 'bonus' ? 'bonus_credits' : 'purchased_credits';
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
router.patch('/users/:id/role', requireAuth, requireAdmin, async (req, res) => {
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
router.delete('/users/:id', requireAuth, requireAdmin, async (req, res) => {
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
 * Requer: Auth + Admin Role + IP ZeroTier
 */
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
    try {
        // Validar IP ZeroTier
        const clientIP = getClientIP(req);
        if (!isAdminIPAllowed(clientIP)) {
            logger.warn('⚠️ Tentativa de acesso admin stats de IP não autorizado', {
                ip: clientIP,
                userId: req.user.id,
                userAgent: req.headers['user-agent']
            });
            return res.status(403).json({
                success: false,
                error: 'FORBIDDEN',
                message: 'IP não autorizado para acesso admin',
                yourIP: clientIP
            });
        }

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
            .select('bonus_credits, purchased_credits, total_spent');

        const creditsStats = wallets.reduce((acc, wallet) => ({
            totalBonus: acc.totalBonus + (wallet.bonus_credits || 0),
            totalPurchased: acc.totalPurchased + (wallet.purchased_credits || 0),
            totalSpent: acc.totalSpent + (wallet.total_spent || 0)
        }), { totalBonus: 0, totalPurchased: 0, totalSpent: 0 });

        // Ferramentas mais usadas (últimos 30 dias)
        // FIXME: Tabela tools_usage pode não existir ainda
        let topTools = [];
        let totalToolExecutions = 0;
        try {
            const { data: toolUsage, error: toolError } = await supabaseAdmin
                .from('tools_usage')
                .select('tool_slug')
                .gte('created_at', thirtyDaysAgo.toISOString());

            if (!toolError && toolUsage) {
                totalToolExecutions = toolUsage.length;
                const toolStats = toolUsage.reduce((acc, usage) => {
                    acc[usage.tool_slug] = (acc[usage.tool_slug] || 0) + 1;
                    return acc;
                }, {});

                topTools = Object.entries(toolStats)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([slug, count]) => ({ slug, count }));
            }
        } catch (toolErr) {
            logger.warn('⚠️ Tabela tools_usage não encontrada, retornando array vazio', { error: toolErr.message });
        }

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
                    totalExecutions: totalToolExecutions
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
 * GET /api/admin/tools
 * Estatísticas de uso de ferramentas
 */
router.get('/tools', requireAuth, requireAdmin, async (req, res) => {
    try {
        // Buscar estatísticas de uso de ferramentas
        // Coluna correta: 'type' (não 'transaction_type')
        const { data: toolsUsage, error: usageError } = await supabaseAdmin
            .from('economy_transactions')
            .select('description, amount, created_at, type')
            .eq('type', 'debit')
            .like('description', '%Uso de ferramenta%')
            .order('created_at', { ascending: false })
            .limit(100);

        if (usageError) {
            throw usageError;
        }

        // Agrupar por ferramenta
        const toolStats = {};
        toolsUsage.forEach(usage => {
            const toolName = usage.description.replace('Uso de ferramenta: ', '').trim();
            if (!toolStats[toolName]) {
                toolStats[toolName] = {
                    name: toolName,
                    totalUses: 0,
                    totalCredits: 0,
                    lastUsed: usage.created_at
                };
            }
            toolStats[toolName].totalUses += 1;
            toolStats[toolName].totalCredits += Math.abs(usage.amount);
        });

        // Converter para array e ordenar
        const toolsArray = Object.values(toolStats)
            .sort((a, b) => b.totalUses - a.totalUses);

        logger.info('Admin consultou estatísticas de ferramentas', {
            adminId: req.user.id,
            totalTools: toolsArray.length
        });

        res.json({
            success: true,
            data: {
                tools: toolsArray,
                summary: {
                    totalTools: toolsArray.length,
                    totalUses: toolsArray.reduce((sum, tool) => sum + tool.totalUses, 0),
                    totalCredits: toolsArray.reduce((sum, tool) => sum + tool.totalCredits, 0)
                }
            }
        });
    } catch (error) {
        logger.error('Erro ao buscar estatísticas de ferramentas (admin)', {
            adminId: req.user.id,
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar estatísticas de ferramentas',
            message: error.message
        });
    }
});

/**
 * GET /api/admin/tools-discovery
 * Informações sobre ferramentas carregadas pelo auto-discovery
 * Retorna quais ferramentas foram carregadas, quais falharam e seus endpoints
 */
router.get('/tools-discovery', requireAuth, requireAdmin, async (req, res) => {
    try {
        // Buscar stats do app.locals (armazenado no server.js após auto-load)
        const toolsStats = req.app.locals.toolsStats || { loaded: 0, failed: 0, tools: [] };

        logger.info('Admin consultou ferramentas descobertas', {
            adminId: req.user.id,
            loaded: toolsStats.loaded,
            failed: toolsStats.failed
        });

        res.json({
            success: true,
            data: toolsStats
        });
    } catch (error) {
        logger.error('Erro ao buscar ferramentas descobertas (admin)', {
            adminId: req.user?.id,
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar ferramentas descobertas',
            message: error.message
        });
    }
});

/**
 * GET /api/admin/transactions
 * Histórico de transações do sistema
 */
router.get('/transactions', requireAuth, requireAdmin, async (req, res) => {
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

/**
 * GET /api/admin/check-ip-access
 * Verifica se o IP do cliente está na whitelist
 * Endpoint público (não requer auth) para validação antes do login admin
 */
router.get('/check-ip-access', async (req, res) => {
    try {
        // Importar utilitários
        const { getClientIP, isIPInRange } = await import('../utils/ipUtils.js');
        const { allowedIPs } = await import('../config/allowedIPs.js');
        
        const clientIP = getClientIP(req);

        // Verificar se IP está na lista de permitidos
        const allowed = allowedIPs.some(allowedIP => {
            // Localhost
            if (clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === 'localhost') {
                return ['127.0.0.1', '::1', 'localhost'].includes(allowedIP);
            }
            // CIDR ou IP exato
            return isIPInRange(clientIP, allowedIP);
        });

        logger.info('🔒 Verificação de IP para acesso admin', {
            clientIP,
            allowed,
            allowedIPs,
            headers: {
                'x-forwarded-for': req.headers['x-forwarded-for'],
                'x-real-ip': req.headers['x-real-ip']
            }
        });

        res.json({
            success: true,
            data: {
                clientIP,
                allowed,
                network: allowed ? 'Authorized Network' : 'Unauthorized',
                message: allowed 
                    ? 'IP autorizado para acesso administrativo'
                    : 'Acesso restrito à rede ZeroTier (10.244.0.0/16)'
            }
        });
    } catch (error) {
        logger.error('Erro ao verificar IP de acesso admin', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            error: 'Erro ao verificar permissões de IP',
            message: error.message
        });
    }
});

/**
 * GET /api/admin/check-admin-role
 * Verifica se o usuário autenticado possui role de admin
 * Requer autenticação via requireAuth
 */
router.get('/check-admin-role', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        // Buscar role do usuário no profiles
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (profileError) {
            throw profileError;
        }

        const isAdmin = profile?.role === 'admin';

        logger.info('🔐 Verificação de role admin', {
            userId,
            role: profile?.role,
            isAdmin
        });

        res.json({
            success: true,
            data: {
                userId,
                role: profile?.role || 'user',
                isAdmin,
                message: isAdmin 
                    ? 'Usuário possui permissões administrativas'
                    : 'Usuário não possui permissões administrativas'
            }
        });
    } catch (error) {
        logger.error('Erro ao verificar role de admin', {
            userId: req.user?.id,
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            error: 'Erro ao verificar permissões de usuário',
            message: error.message
        });
    }
});

/**
 * GET /api/admin/docs-data
 * Retorna documentação da API em formato estruturado (JSON)
 * Frontend renderiza os dados no painel admin
 */
router.get('/docs-data', requireAuth, requireAdmin, (req, res) => {
    try {
        // 🔥 LER RATE LIMITS DINAMICAMENTE DO CÓDIGO
        const rateLimiters = getRateLimitConfigs();
        
        const docs = {
            title: 'Documentação da API',
            description: 'Referência completa dos endpoints administrativos',
            rateLimitInfo: {
                description: 'Limites de requisições configurados para proteger a API',
                limiters: rateLimiters
            },
            sections: [
                {
                    id: 'auth',
                    title: 'Autenticação',
                    description: 'Endpoints públicos para autenticação',
                    endpoints: [
                        {
                            method: 'POST',
                            path: '/api/auth/register',
                            description: 'Registrar novo usuário',
                            auth: false,
                            rateLimit: getRateLimitForEndpoint('/api/auth/register', 'POST'),
                            body: { cpf: 'string', email: 'string', password: 'string', full_name: 'string' }
                        },
                        {
                            method: 'POST',
                            path: '/api/auth/login',
                            description: 'Login com email + senha',
                            auth: false,
                            rateLimit: getRateLimitForEndpoint('/api/auth/login', 'POST'),
                            body: { email: 'string', password: 'string' }
                        },
                        {
                            method: 'POST',
                            path: '/api/auth/login-cpf',
                            description: 'Login com CPF + senha',
                            auth: false,
                            rateLimit: getRateLimitForEndpoint('/api/auth/login-cpf', 'POST'),
                            body: { cpf: 'string', password: 'string' }
                        },
                        {
                            method: 'GET',
                            path: '/api/auth/session',
                            description: 'Obter sessão do usuário atual',
                            auth: true,
                            rateLimit: getRateLimitForEndpoint('/api/auth/session', 'GET')
                        },
                        {
                            method: 'POST',
                            path: '/api/auth/logout',
                            description: 'Encerrar sessão',
                            auth: true,
                            rateLimit: getRateLimitForEndpoint('/api/auth/logout', 'POST')
                        }
                    ]
                },
                {
                    id: 'admin',
                    title: 'Administração',
                    description: 'Endpoints restritos para administradores',
                    endpoints: [
                        {
                            method: 'GET',
                            path: '/api/admin/check-ip',
                            description: 'Verifica se IP está autorizado (pré-login)',
                            auth: false
                        },
                        {
                            method: 'POST',
                            path: '/api/admin/login',
                            description: 'Login administrativo com validação de IP',
                            auth: false,
                            body: { cpf: 'string', password: 'string' }
                        },
                        {
                            method: 'GET',
                            path: '/api/admin/check-admin-role',
                            description: 'Verifica se usuário tem role admin',
                            auth: true,
                            adminOnly: true
                        },
                        {
                            method: 'GET',
                            path: '/api/admin/users',
                            description: 'Lista todos os usuários com paginação',
                            auth: true,
                            adminOnly: true,
                            query: { page: 'number', limit: 'number', search: 'string' }
                        },
                        {
                            method: 'GET',
                            path: '/api/admin/users/:id',
                            description: 'Detalhes de um usuário específico',
                            auth: true,
                            adminOnly: true
                        },
                        {
                            method: 'POST',
                            path: '/api/admin/users/:id/credits',
                            description: 'Ajustar créditos de um usuário',
                            auth: true,
                            adminOnly: true,
                            body: { amount: 'number', type: 'add|remove', reason: 'string' }
                        },
                        {
                            method: 'PATCH',
                            path: '/api/admin/users/:id/role',
                            description: 'Alterar role de um usuário',
                            auth: true,
                            adminOnly: true,
                            body: { role: 'user|admin' }
                        },
                        {
                            method: 'GET',
                            path: '/api/admin/stats',
                            description: 'Estatísticas gerais do sistema',
                            auth: true,
                            adminOnly: true
                        },
                        {
                            method: 'GET',
                            path: '/api/admin/transactions',
                            description: 'Histórico de transações',
                            auth: true,
                            adminOnly: true,
                            query: { page: 'number', limit: 'number', userId: 'uuid' }
                        },
                        {
                            method: 'GET',
                            path: '/api/admin/tools',
                            description: 'Estatísticas de uso de ferramentas',
                            auth: true,
                            adminOnly: true
                        }
                    ]
                },
                {
                    id: 'logs',
                    title: 'Logs do Sistema',
                    description: 'Monitoramento de acessos e eventos',
                    endpoints: [
                        {
                            method: 'GET',
                            path: '/logs',
                            description: 'Lista todos os logs com filtros',
                            auth: true,
                            adminOnly: true,
                            query: { limit: 'number', ip: 'string', authorized: 'boolean' }
                        },
                        {
                            method: 'GET',
                            path: '/logs/stats',
                            description: 'Estatísticas gerais de logs',
                            auth: true,
                            adminOnly: true
                        },
                        {
                            method: 'GET',
                            path: '/logs/ips',
                            description: 'Estatísticas por IP',
                            auth: true,
                            adminOnly: true
                        },
                        {
                            method: 'POST',
                            path: '/logs/clear',
                            description: 'Limpar todos os logs',
                            auth: true,
                            adminOnly: true
                        }
                    ]
                },
                {
                    id: 'credits',
                    title: 'Créditos',
                    description: 'Gerenciamento de créditos do usuário',
                    endpoints: [
                        {
                            method: 'GET',
                            path: '/api/credits/balance',
                            description: 'Obter saldo de créditos',
                            auth: true
                        },
                        {
                            method: 'GET',
                            path: '/api/credits/history',
                            description: 'Histórico de transações',
                            auth: true,
                            query: { limit: 'number' }
                        },
                        {
                            method: 'GET',
                            path: '/api/credits/can-use/:toolName',
                            description: 'Verificar se pode usar ferramenta',
                            auth: true
                        }
                    ]
                },
                {
                    id: 'tools',
                    title: 'Ferramentas',
                    description: 'Catálogo e execução de ferramentas',
                    endpoints: [
                        {
                            method: 'GET',
                            path: '/api/tools/list',
                            description: 'Listar todas as ferramentas',
                            auth: true
                        },
                        {
                            method: 'GET',
                            path: '/api/tools/:toolName',
                            description: 'Detalhes de uma ferramenta',
                            auth: true
                        },
                        {
                            method: 'POST',
                            path: '/api/tools/execute/:toolName',
                            description: 'Executar ferramenta',
                            auth: true,
                            body: { params: 'object' }
                        },
                        {
                            method: 'GET',
                            path: '/api/tools/history',
                            description: 'Histórico de uso',
                            auth: true,
                            query: { limit: 'number' }
                        }
                    ]
                }
            ]
        };

        logger.info('📚 Documentação da API requisitada', {
            userId: req.user?.id,
            ip: req.ip
        });

        res.json({
            success: true,
            data: docs
        });
    } catch (error) {
        logger.error('Erro ao gerar documentação da API', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            error: 'Erro ao gerar documentação',
            message: error.message
        });
    }
});

/**
 * GET /admin/audit-log
 * Listar log de auditoria de ações administrativas
 */
router.get('/audit-log', requireAuth, requireAdmin, async (req, res) => {
    try {
        const {
            limit = 50,
            offset = 0,
            action_type,
            admin_id,
            target_type,
            start_date,
            end_date
        } = req.query;

        // Construir query
        let query = supabaseAdmin
            .from('admin_audit_log')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

        // Aplicar filtros
        if (action_type) {
            query = query.eq('action_type', action_type);
        }
        if (admin_id) {
            query = query.eq('admin_id', admin_id);
        }
        if (target_type) {
            query = query.eq('target_type', target_type);
        }
        if (start_date) {
            query = query.gte('created_at', start_date);
        }
        if (end_date) {
            query = query.lte('created_at', end_date);
        }

        const { data: auditLogs, error, count } = await query;

        if (error) {
            throw error;
        }

        logger.info('Admin consultou audit log', {
            adminId: req.user.id,
            filters: { action_type, admin_id, target_type, start_date, end_date },
            resultCount: auditLogs?.length || 0
        });

        res.json({
            success: true,
            data: auditLogs || [],
            pagination: {
                total: count || 0,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        logger.error('Erro ao buscar audit log', {
            adminId: req.user.id,
            error: error.message
        });
        
        // Se a tabela não existir, retornar array vazio ao invés de erro
        if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
            logger.warn('⚠️ Tabela admin_audit_log não existe, retornando array vazio');
            return res.json({
                success: true,
                data: [],
                pagination: { total: 0, limit: 50, offset: 0 },
                warning: 'Tabela de auditoria não foi criada ainda'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Erro ao buscar audit log',
            message: error.message
        });
    }
});

// ============================================
// ENDPOINTS DE LOGS DO SISTEMA
// ============================================

/**
 * GET /admin/logs
 * Retorna logs de acesso ao sistema
 * Query params: limit, ip, authorized, method, startDate, endDate
 */
router.get('/logs', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { 
            limit = 100, 
            ip, 
            authorized, 
            method,
            startDate,
            endDate
        } = req.query;

        logger.info('📋 Buscando logs do sistema', {
            adminId: req.user.id,
            filters: { limit, ip, authorized, method, startDate, endDate }
        });

        // Query base
        let query = supabaseAdmin
            .from('admin_access_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(parseInt(limit));

        // Aplicar filtros
        if (ip) {
            query = query.ilike('ip', `%${ip}%`);
        }

        if (authorized !== undefined && authorized !== '') {
            query = query.eq('authorized', authorized === 'true');
        }

        if (method) {
            query = query.eq('method', method.toUpperCase());
        }

        if (startDate) {
            query = query.gte('timestamp', new Date(startDate).toISOString());
        }

        if (endDate) {
            const endDateObj = new Date(endDate);
            endDateObj.setHours(23, 59, 59, 999); // Fim do dia
            query = query.lte('timestamp', endDateObj.toISOString());
        }

        const { data: logs, error } = await query;

        if (error) {
            // Se tabela não existir, retornar array vazio
            if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
                logger.warn('⚠️ Tabela admin_access_logs não existe');
                return res.json({
                    success: true,
                    logs: [],
                    warning: 'Tabela de logs não foi criada ainda. Execute CREATE_ADMIN_ACCESS_LOGS.sql'
                });
            }
            throw error;
        }

        logger.info('✅ Logs recuperados com sucesso', {
            adminId: req.user.id,
            count: logs.length
        });

        res.json({
            success: true,
            logs: logs || []
        });

    } catch (error) {
        logger.error('Erro ao buscar logs', {
            adminId: req.user.id,
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: 'Erro ao buscar logs',
            message: error.message
        });
    }
});

/**
 * GET /admin/logs/stats
 * Retorna estatísticas dos logs
 */
router.get('/logs/stats', requireAuth, requireAdmin, async (req, res) => {
    try {
        logger.info('📊 Calculando estatísticas de logs', {
            adminId: req.user.id
        });

        const { data: logs, error } = await supabaseAdmin
            .from('admin_access_logs')
            .select('authorized');

        if (error) {
            // Se tabela não existir, retornar stats zeradas
            if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
                logger.warn('⚠️ Tabela admin_access_logs não existe');
                return res.json({
                    success: true,
                    stats: {
                        total_requests: 0,
                        authorized: 0,
                        unauthorized: 0
                    },
                    warning: 'Tabela de logs não foi criada ainda'
                });
            }
            throw error;
        }

        const stats = {
            total_requests: logs.length,
            authorized: logs.filter(log => log.authorized === true).length,
            unauthorized: logs.filter(log => log.authorized === false).length
        };

        logger.info('✅ Estatísticas calculadas', {
            adminId: req.user.id,
            stats
        });

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        logger.error('Erro ao calcular estatísticas', {
            adminId: req.user.id,
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: 'Erro ao calcular estatísticas',
            message: error.message
        });
    }
});

/**
 * DELETE /admin/logs
 * Limpa todos os logs do sistema
 */
router.delete('/logs', requireAuth, requireAdmin, async (req, res) => {
    try {
        logger.warn('🗑️ Limpando TODOS os logs do sistema', {
            adminId: req.user.id,
            adminEmail: req.user.email
        });

        const { error } = await supabaseAdmin
            .from('admin_access_logs')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta tudo

        if (error) {
            // Se tabela não existir, retornar sucesso mesmo assim
            if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
                logger.warn('⚠️ Tabela admin_access_logs não existe');
                return res.json({
                    success: true,
                    message: 'Nenhum log para limpar (tabela não existe)',
                    warning: 'Tabela de logs não foi criada ainda'
                });
            }
            throw error;
        }

        logger.info('✅ Logs limpos com sucesso', {
            adminId: req.user.id
        });

        res.json({
            success: true,
            message: 'Todos os logs foram deletados com sucesso'
        });

    } catch (error) {
        logger.error('Erro ao limpar logs', {
            adminId: req.user.id,
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: 'Erro ao limpar logs',
            message: error.message
        });
    }
});

/**
 * GET /admin/docs
 * Retorna documentação da API (mesmo conteúdo de /docs-data)
 */
router.get('/docs', requireAuth, requireAdmin, (req, res) => {
    try {
        const docs = {
            title: 'Documentação da API',
            description: 'Referência completa dos endpoints administrativos',
            sections: [
                {
                    id: 'auth',
                    title: 'Autenticação',
                    description: 'Endpoints públicos para autenticação',
                    endpoints: [
                        {
                            method: 'POST',
                            path: '/api/auth/register',
                            description: 'Registrar novo usuário',
                            auth: false,
                            body: { cpf: 'string', email: 'string', password: 'string', full_name: 'string' }
                        },
                        {
                            method: 'POST',
                            path: '/api/auth/login',
                            description: 'Login com email + senha',
                            auth: false,
                            body: { email: 'string', password: 'string' }
                        },
                        {
                            method: 'POST',
                            path: '/api/auth/login-cpf',
                            description: 'Login com CPF + senha',
                            auth: false,
                            body: { cpf: 'string', password: 'string' }
                        },
                        {
                            method: 'GET',
                            path: '/api/auth/session',
                            description: 'Obter sessão do usuário atual',
                            auth: true
                        },
                        {
                            method: 'POST',
                            path: '/api/auth/logout',
                            description: 'Encerrar sessão',
                            auth: true
                        }
                    ]
                },
                {
                    id: 'admin',
                    title: 'Administração',
                    description: 'Endpoints restritos para administradores',
                    endpoints: [
                        {
                            method: 'GET',
                            path: '/api/admin/check-ip',
                            description: 'Verifica se IP está autorizado (pré-login)',
                            auth: false
                        },
                        {
                            method: 'POST',
                            path: '/api/admin/login',
                            description: 'Login administrativo com validação de IP',
                            auth: false,
                            body: { cpf: 'string', password: 'string' }
                        },
                        {
                            method: 'GET',
                            path: '/api/admin/check-admin-role',
                            description: 'Verifica se usuário tem role admin',
                            auth: true,
                            adminOnly: true
                        },
                        {
                            method: 'GET',
                            path: '/api/admin/users',
                            description: 'Lista todos os usuários com paginação',
                            auth: true,
                            adminOnly: true,
                            query: { page: 'number', limit: 'number', search: 'string' }
                        },
                        {
                            method: 'GET',
                            path: '/api/admin/users/:id',
                            description: 'Detalhes de um usuário específico',
                            auth: true,
                            adminOnly: true
                        },
                        {
                            method: 'POST',
                            path: '/api/admin/users/:id/credits',
                            description: 'Ajustar créditos de um usuário',
                            auth: true,
                            adminOnly: true,
                            body: { amount: 'number', type: 'add|remove', reason: 'string' }
                        },
                        {
                            method: 'PATCH',
                            path: '/api/admin/users/:id/role',
                            description: 'Alterar role de um usuário',
                            auth: true,
                            adminOnly: true,
                            body: { role: 'user|admin' }
                        },
                        {
                            method: 'GET',
                            path: '/api/admin/stats',
                            description: 'Estatísticas gerais do sistema',
                            auth: true,
                            adminOnly: true
                        },
                        {
                            method: 'GET',
                            path: '/api/admin/transactions',
                            description: 'Histórico de transações',
                            auth: true,
                            adminOnly: true,
                            query: { page: 'number', limit: 'number', userId: 'uuid' }
                        },
                        {
                            method: 'GET',
                            path: '/api/admin/tools',
                            description: 'Estatísticas de uso de ferramentas',
                            auth: true,
                            adminOnly: true
                        },
                        {
                            method: 'GET',
                            path: '/api/admin/logs',
                            description: 'Logs de acesso ao sistema',
                            auth: true,
                            adminOnly: true,
                            query: { limit: 'number', ip: 'string', authorized: 'boolean', method: 'string', startDate: 'string', endDate: 'string' }
                        },
                        {
                            method: 'GET',
                            path: '/api/admin/logs/stats',
                            description: 'Estatísticas de logs',
                            auth: true,
                            adminOnly: true
                        },
                        {
                            method: 'DELETE',
                            path: '/api/admin/logs',
                            description: 'Limpar todos os logs',
                            auth: true,
                            adminOnly: true
                        },
                        {
                            method: 'GET',
                            path: '/api/admin/docs',
                            description: 'Documentação completa da API',
                            auth: true,
                            adminOnly: true
                        },
                        {
                            method: 'GET',
                            path: '/api/admin/audit-log',
                            description: 'Logs de auditoria de ações admin',
                            auth: true,
                            adminOnly: true,
                            query: { limit: 'number', action_type: 'string', admin_id: 'uuid', start_date: 'string', end_date: 'string' }
                        }
                    ]
                },
                {
                    id: 'credits',
                    title: 'Créditos',
                    description: 'Gerenciamento de créditos do usuário',
                    endpoints: [
                        {
                            method: 'GET',
                            path: '/api/credits/balance',
                            description: 'Obter saldo de créditos',
                            auth: true
                        },
                        {
                            method: 'GET',
                            path: '/api/credits/history',
                            description: 'Histórico de transações',
                            auth: true,
                            query: { limit: 'number' }
                        },
                        {
                            method: 'GET',
                            path: '/api/credits/can-use/:toolName',
                            description: 'Verificar se pode usar ferramenta',
                            auth: true
                        }
                    ]
                },
                {
                    id: 'tools',
                    title: 'Ferramentas',
                    description: 'Catálogo e execução de ferramentas',
                    endpoints: [
                        {
                            method: 'GET',
                            path: '/api/tools/list',
                            description: 'Listar todas as ferramentas',
                            auth: true
                        },
                        {
                            method: 'GET',
                            path: '/api/tools/:toolName',
                            description: 'Detalhes de uma ferramenta',
                            auth: true
                        },
                        {
                            method: 'POST',
                            path: '/api/tools/execute/:toolName',
                            description: 'Executar ferramenta',
                            auth: true,
                            body: { params: 'object' }
                        },
                        {
                            method: 'GET',
                            path: '/api/tools/history',
                            description: 'Histórico de uso',
                            auth: true,
                            query: { limit: 'number' }
                        }
                    ]
                }
            ]
        };

        logger.info('📚 Documentação da API requisitada', {
            userId: req.user?.id,
            ip: req.ip
        });

        res.json({
            success: true,
            data: docs
        });
    } catch (error) {
        logger.error('Erro ao retornar documentação', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: 'Erro ao carregar documentação'
        });
    }
});

export default router;


