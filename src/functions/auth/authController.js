import { BaseController } from '../../core/BaseController.js';
import { supabase, supabaseAdmin, createUser, createUserSession, signOut, resendConfirmationEmail } from '../../config/supabase.js';
import { 
    isValidCPF, 
    isValidEmail, 
    isValidPassword, 
    cleanCPF,
    generateReferralCode,
    getPasswordErrorMessage 
} from './authUtils.js';

/**
 * Controller de Autenticação
 */
class AuthController extends BaseController {
    
    /**
     * POST /auth/check-cpf
     * Verifica se CPF já está cadastrado
     */
    async checkCPF(req, res) {
        return this.execute(req, res, async (req, res) => {
            const { cpf } = req.body;
            
            // Validar CPF
            if (!isValidCPF(cpf)) {
                return this.error(res, 'CPF inválido', 400);
            }
            
            const cleanedCPF = cleanCPF(cpf);
            
            // Buscar CPF no banco
            const { data, error } = await supabase
                .from('profiles')
                .select('id')
                .eq('cpf', cleanedCPF)
                .single();
            
            if (error && error.code !== 'PGRST116') { // PGRST116 = not found
                throw error;
            }
            
            return this.success(res, {
                exists: !!data,
                cpf: cleanedCPF
            });
        });
    }

    /**
     * POST /auth/check-email
     * Verifica se email já está cadastrado
     */
    async checkEmail(req, res) {
        return this.execute(req, res, async (req, res) => {
            const { email } = req.body;
            
            // Validar email
            if (!isValidEmail(email)) {
                return this.error(res, 'Email inválido', 400);
            }
            
            const normalizedEmail = email.toLowerCase().trim();
            
            // Buscar email no banco (supabase auth)
            const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
            
            if (error) {
                throw error;
            }
            
            const emailExists = users.users.some(user => 
                user.email?.toLowerCase() === normalizedEmail
            );
            
            return this.success(res, {
                available: !emailExists,
                email: normalizedEmail
            });
        });
    }
    
    /**
     * POST /auth/register
     * Cadastra novo usuário
     */
    async register(req, res) {
        return this.execute(req, res, async (req, res) => {
            const { cpf, email, password, full_name, referral_code } = req.body;
            
            // Validações
            if (!isValidCPF(cpf)) {
                return this.error(res, 'CPF inválido', 400);
            }
            
            if (!isValidEmail(email)) {
                return this.error(res, 'Email inválido', 400);
            }
            
            if (!isValidPassword(password)) {
                return this.error(res, getPasswordErrorMessage(), 400);
            }
            
            if (!full_name || full_name.trim().length < 3) {
                return this.error(res, 'Nome completo deve ter pelo menos 3 caracteres', 400);
            }
            
            const cleanedCPF = cleanCPF(cpf);
            
            // Verificar se CPF já existe
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('cpf', cleanedCPF)
                .single();
            
            if (existingProfile) {
                return this.error(res, 'CPF já cadastrado', 400);
            }
            
            // Verificar código de referência (se fornecido)
            let referredBy = null;
            if (referral_code) {
                const { data: referrer } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('referral_code', referral_code.toUpperCase())
                    .single();
                
                if (!referrer) {
                    return this.error(res, 'Código de referência inválido', 400);
                }
                
                referredBy = referrer.id;
            }
            
            // Criar usuário no Supabase Auth
            const user = await createUser(email, password, {
                full_name: full_name.trim()
            });
            
            if (!user) {
                return this.error(res, 'Erro ao criar usuário', 500);
            }
            
            // Gerar código de referência único
            let userReferralCode;
            let codeExists = true;
            
            while (codeExists) {
                userReferralCode = generateReferralCode();
                const { data } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('referral_code', userReferralCode)
                    .single();
                codeExists = !!data;
            }
            
            // Usar supabaseAdmin para bypass RLS
            if (!supabaseAdmin) {
                return this.error(res, 'Configuração do servidor incompleta', 500);
            }
            
            // Criar profile
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .insert({
                    id: user.id,
                    cpf: cleanedCPF,
                    full_name: full_name.trim(),
                    referral_code: userReferralCode,
                    referred_by: referredBy
                });
            
            if (profileError) {
                console.error('Erro ao criar profile:', profileError);
                throw profileError;
            }
            
            // Criar registro de pontos
            const signupBonus = parseInt(process.env.SIGNUP_BONUS_POINTS) || 10;
            const referralBonus = parseInt(process.env.REFERRAL_BONUS_POINTS) || 5;
            
            const { error: pointsError } = await supabaseAdmin
                .from('user_points')
                .insert({
                    user_id: user.id,
                    free_points: signupBonus,
                    free_points_limit: parseInt(process.env.FREE_POINTS_LIMIT) || 100,
                    total_earned: signupBonus
                });
            
            if (pointsError) {
                console.error('Erro ao criar pontos:', pointsError);
                throw pointsError;
            }
            
            // Registrar transação de bônus de cadastro
            await supabaseAdmin
                .from('point_transactions')
                .insert({
                    user_id: user.id,
                    type: 'signup_bonus',
                    point_type: 'free',
                    amount: signupBonus,
                    balance_before: 0,
                    balance_after: signupBonus,
                    description: 'Bônus de boas-vindas'
                });
            
            // Se foi indicado, dar bônus para quem indicou
            let referralBonusGiven = false;
            if (referredBy) {
                const { data: referrerPoints } = await supabaseAdmin
                    .from('user_points')
                    .select('free_points, free_points_limit')
                    .eq('user_id', referredBy)
                    .single();
                
                if (referrerPoints) {
                    const newPoints = Math.min(
                        referrerPoints.free_points + referralBonus,
                        referrerPoints.free_points_limit
                    );
                    const actualBonus = newPoints - referrerPoints.free_points;
                    
                    if (actualBonus > 0) {
                        await supabaseAdmin
                            .from('user_points')
                            .update({
                                free_points: newPoints,
                                total_earned: supabaseAdmin.raw(`total_earned + ${actualBonus}`)
                            })
                            .eq('user_id', referredBy);
                        
                        await supabaseAdmin
                            .from('point_transactions')
                            .insert({
                                user_id: referredBy,
                                type: 'referral_bonus',
                                point_type: 'free',
                                amount: actualBonus,
                                balance_before: referrerPoints.free_points,
                                balance_after: newPoints,
                                description: 'Bônus por indicação de amigo',
                                referred_user_id: user.id
                            });
                        
                        referralBonusGiven = true;
                    }
                }
            }
            
            return this.success(res, {
                user: {
                    id: user.id,
                    email: user.email,
                    full_name: full_name.trim(),
                    referral_code: userReferralCode
                },
                points_earned: signupBonus,
                referral_bonus_given: referralBonusGiven,
                requires_verification: true // Flag para frontend saber que precisa verificar email
            }, 'Cadastro realizado com sucesso! Enviamos um email de confirmação para você. Por favor, verifique sua caixa de entrada.', 201);
        });
    }
    
    /**
     * POST /auth/login
     * Autentica usuário
     */
    async login(req, res) {
        return this.execute(req, res, async (req, res) => {
            const { email, password } = req.body;
            
            if (!email || !password) {
                return this.error(res, 'Email e senha são obrigatórios', 400);
            }
            
            // Autenticar com Supabase
            const { user, session } = await createUserSession(email, password);
            
            if (!user || !session) {
                return this.error(res, 'Email ou senha incorretos', 401);
            }
            
            // Buscar profile e pontos
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            
            const { data: points } = await supabase
                .from('user_points')
                .select('*')
                .eq('user_id', user.id)
                .single();
            
            // Configurar cookie com token
            res.cookie('auth_token', session.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: parseInt(process.env.SESSION_MAX_AGE) || 604800000 // 7 dias
            });
            
            return this.success(res, {
                user: {
                    id: user.id,
                    email: user.email
                },
                profile,
                points,
                token: session.access_token
            }, 'Login realizado com sucesso');
        });
    }
    
    /**
     * POST /auth/logout
     * Finaliza sessão
     */
    async logout(req, res) {
        return this.execute(req, res, async (req, res) => {
            const token = req.token;
            
            if (token) {
                try {
                    await signOut(token);
                } catch (error) {
                    console.error('Erro ao fazer logout no Supabase:', error);
                }
            }
            
            // Limpar cookie
            res.clearCookie('auth_token');
            
            return this.success(res, null, 'Logout realizado com sucesso');
        });
    }
    
    /**
     * POST /auth/resend-confirmation
     * Reenvia email de confirmação
     */
    async resendConfirmation(req, res) {
        return this.execute(req, res, async (req, res) => {
            const { email } = req.body;
            
            if (!email || !isValidEmail(email)) {
                return this.error(res, 'Email inválido', 400);
            }
            
            const normalizedEmail = email.toLowerCase().trim();
            
            // Verificar se usuário existe
            const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
            
            if (listError) {
                throw listError;
            }
            
            const user = users.users.find(u => u.email?.toLowerCase() === normalizedEmail);
            
            if (!user) {
                return this.error(res, 'Email não encontrado', 404);
            }
            
            // Verificar se já está confirmado
            if (user.email_confirmed_at) {
                return this.error(res, 'Email já foi confirmado. Você pode fazer login.', 400);
            }
            
            // Reenviar email de confirmação
            await resendConfirmationEmail(normalizedEmail);
            
            return this.success(res, null, 'Email de confirmação reenviado com sucesso! Verifique sua caixa de entrada.');
        });
    }
    
    /**
     * GET /auth/session
     * Verifica sessão atual
     */
    async getSession(req, res) {
        return this.execute(req, res, async (req, res) => {
            if (!req.user) {
                return this.success(res, {
                    authenticated: false
                });
            }
            
            // Buscar dados completos
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', req.user.id)
                .single();
            
            const { data: points } = await supabase
                .from('user_points')
                .select('*')
                .eq('user_id', req.user.id)
                .single();
            
            return this.success(res, {
                authenticated: true,
                user: {
                    id: req.user.id,
                    email: req.user.email
                },
                profile,
                points
            });
        });
    }
}

// Exportar instância
const authController = new AuthController();

export default authController;
export const checkCPF = (req, res) => authController.checkCPF(req, res);
export const checkEmail = (req, res) => authController.checkEmail(req, res);
export const register = (req, res) => authController.register(req, res);
export const login = (req, res) => authController.login(req, res);
export const logout = (req, res) => authController.logout(req, res);
export const resendConfirmation = (req, res) => authController.resendConfirmation(req, res);
export const getSession = (req, res) => authController.getSession(req, res);
