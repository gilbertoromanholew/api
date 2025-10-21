import express from 'express';
import { createClient } from '@supabase/supabase-js';
import rateLimit from 'express-rate-limit';
import {
    otpVerificationLimiter,
    otpResendLimiter,
    cpfCheckLimiter,
    registerLimiter,
    loginLimiter
} from '../middlewares/rateLimiters.js';
import { createDualRateLimiter, dualStore } from '../middlewares/dualRateLimiter.js';
import { requireAuth, requireAdmin } from '../middlewares/adminAuth.js';
import { alertStore } from '../utils/alertSystem.js';
import { 
    logLogin, 
    logFailedLogin, 
    logRegister, 
    logFailedRegister,
    logLogout 
} from '../services/auditService.js';

const router = express.Router();

// Cliente Supabase (usando variáveis de ambiente)
// Em produção (Docker), usa Kong interno. Em dev, usa URL público.
const supabaseUrl = process.env.SUPABASE_INTERNAL_URL || process.env.SUPABASE_URL || 'http://supabase-kong:8000';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseAnonKey) {
    console.error('⚠️ SUPABASE_ANON_KEY não configurada! Rotas de autenticação não funcionarão.');
}

if (!supabaseServiceKey) {
    console.error('⚠️ SUPABASE_SERVICE_ROLE_KEY não configurada! Algumas funcionalidades podem não funcionar.');
}

// Cliente com anon key (para operações públicas)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente com service role (para operações administrativas)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// DUAL RATE LIMITERS - Rastreamento IP + CPF
// ============================================================================

// Login: 20 tentativas por IP em 10min | 10 tentativas por CPF em 15min
const dualLoginLimiter = createDualRateLimiter({
    ipMax: 20,
    cpfMax: 10,
    ipWindowMs: 10 * 60 * 1000,
    cpfWindowMs: 15 * 60 * 1000,
    message: 'Por segurança, bloqueamos temporariamente o acesso. Aguarde alguns minutos ou use a opção "Esqueci minha senha".',
    extractCPF: (req) => req.body?.cpf || null
});

// Verificação de CPF: 30 tentativas por IP em 10min | 20 tentativas por CPF em 10min
const dualCPFCheckLimiter = createDualRateLimiter({
    ipMax: 30,
    cpfMax: 20,
    ipWindowMs: 10 * 60 * 1000,
    cpfWindowMs: 10 * 60 * 1000,
    message: 'Por segurança, bloqueamos temporariamente as consultas. Aguarde alguns minutos.',
    extractCPF: (req) => req.body?.cpf || null
});

/**
 * POST /auth/check-cpf
 * Verifica se CPF já está cadastrado com rate limiting dual (IP + CPF)
 * Limites: 30 tentativas por IP em 10min | 20 tentativas por CPF em 10min
 */
router.post('/check-cpf', dualCPFCheckLimiter, async (req, res) => {
    try {
        const { cpf } = req.body;

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📝 /check-cpf CHAMADO');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('CPF recebido:', cpf);
        console.log('Body completo:', JSON.stringify(req.body, null, 2));
        console.log('Headers:', JSON.stringify(req.headers, null, 2));

        if (!cpf) {
            console.log('❌ CPF não fornecido');
            return res.status(400).json({
                success: false,
                error: 'CPF é obrigatório'
            });
        }

        // Limpar formatação do CPF
        const cleanCPF = cpf.replace(/\D/g, '');
        console.log('🧹 CPF limpo:', cleanCPF);
        console.log('🧹 Tamanho do CPF limpo:', cleanCPF.length);

        // Validar se CPF tem 11 dígitos
        if (cleanCPF.length !== 11) {
            console.log('❌ CPF inválido - tamanho diferente de 11');
            return res.status(400).json({
                success: false,
                error: 'CPF deve conter 11 dígitos'
            });
        }

        // Buscar usuário com este CPF na tabela profiles
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔍 BUSCANDO NO SUPABASE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Tabela: profiles');
        console.log('Campo de busca: cpf');
        console.log('Valor de busca:', cleanCPF);
        console.log('Tipo do valor:', typeof cleanCPF);
        console.log('Cliente usado: supabaseAdmin (com service role)');
        
        const { data: profileData, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, cpf, full_name')
            .eq('cpf', cleanCPF)
            .maybeSingle();

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 RESULTADO DA BUSCA');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Encontrado:', !!profileData);
        console.log('Profile completo:', JSON.stringify(profileData, null, 2));
        console.log('Erro:', profileError ? JSON.stringify(profileError, null, 2) : 'nenhum');
        console.log('Código do erro:', profileError?.code);
        console.log('Mensagem do erro:', profileError?.message);

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = not found
            console.error('❌ Erro do Supabase:', profileError);
            throw profileError;
        }

        const exists = !!profileData;
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ RESPOSTA FINAL');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('exists:', exists);
        console.log('message:', exists ? 'CPF já cadastrado' : 'CPF disponível');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        res.json({
            success: true,
            data: {
                exists: exists
            },
            message: exists ? 'CPF já cadastrado' : 'CPF disponível'
        });
    } catch (error) {
        console.error('[SECURITY] Erro ao verificar CPF:', error.message);
        console.error('[SECURITY] Stack trace:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Erro ao verificar CPF'
            // Detalhes do erro não são expostos por segurança
        });
    }
});

/**
 * POST /auth/check-email
 * Verifica se email já está cadastrado
 */
router.post('/check-email', async (req, res) => {
    try {
        const { email } = req.body;

        console.log('📧 /check-email chamado com:', { email: email ? 'presente' : 'ausente' });

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email é obrigatório'
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Email inválido'
            });
        }

        // Buscar usuário por email usando getUserByEmail
        console.log('🔍 Buscando email em auth.users...');
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
        
        if (error) {
            console.error('❌ Erro do Supabase:', error);
            throw error;
        }

        const emailExists = users?.some(user => user.email?.toLowerCase() === email.toLowerCase());
        console.log('📊 Resultado da busca:', { email, exists: emailExists, totalUsers: users?.length });

        res.json({
            success: true,
            data: {
                available: !emailExists,
                exists: emailExists
            },
            message: emailExists ? 'Email já cadastrado' : 'Email disponível'
        });
    } catch (error) {
        console.error('[SECURITY] Erro ao verificar email:', error.message);
        console.error('[SECURITY] Stack trace:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Erro ao verificar email'
            // Detalhes do erro não são expostos por segurança
        });
    }
});

/**
 * POST /auth/register
 * Registrar novo usuário
 * Rate limit: 3 registros por hora
 */
router.post('/register', registerLimiter, async (req, res) => {
    try {
        const { email, password, full_name, cpf } = req.body;

        // Validações básicas
        if (!email || !password || !full_name || !cpf) {
            return res.status(400).json({
                success: false,
                error: 'Email, senha, nome completo e CPF são obrigatórios'
            });
        }

        // Limpar formatação do CPF
        const cleanCPF = cpf.replace(/\D/g, '');

        // Validar se CPF tem 11 dígitos
        if (cleanCPF.length !== 11) {
            return res.status(400).json({
                success: false,
                error: 'CPF deve conter 11 dígitos'
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Email inválido'
            });
        }

        // Gerar referral code
        const { data: refCodeData, error: refCodeError } = await supabaseAdmin
            .rpc('generate_referral_code');

        if (refCodeError) {
            console.error('Erro ao gerar código de referência:', refCodeError);
        }

        // Fallback: gerar código único se a função do banco falhar
        const referralCode = refCodeData || `USER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Criar usuário no Supabase Auth (com email_confirm DESABILITADO)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: false, // Usuário não confirmado ainda
            user_metadata: {
                full_name,
                cpf: cleanCPF
            }
        });

        if (authError) {
            throw authError;
        }

        // Criar perfil do usuário
        if (authData.user) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .insert([
                    {
                        id: authData.user.id,
                        cpf: cleanCPF,
                        full_name,
                        referral_code: referralCode,
                        email_verified: false,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                ]);

            if (profileError) {
                console.error('Erro ao criar perfil:', profileError);
            }

            // Criar registro de pontos inicial
            const { error: pointsError } = await supabaseAdmin
                .from('user_points')
                .insert([
                    {
                        user_id: authData.user.id,
                        free_points: 100, // Bônus de cadastro
                        paid_points: 0,
                        total_earned: 100,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                ]);

            if (pointsError) {
                console.error('Erro ao criar pontos iniciais:', pointsError);
            } else {
                // Criar transação de bônus de cadastro
                await supabaseAdmin
                    .from('point_transactions')
                    .insert([
                        {
                            user_id: authData.user.id,
                            type: 'signup_bonus',
                            point_type: 'free',
                            amount: 100,
                            balance_before: 0,
                            balance_after: 100,
                            description: 'Bônus de boas-vindas',
                            created_at: new Date().toISOString()
                        }
                    ]);
            }

            // Gerar código OTP de 6 dígitos
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 minutos

            // Salvar OTP no banco
            const { error: otpError } = await supabaseAdmin
                .from('otp_codes')
                .insert([
                    {
                        user_id: authData.user.id,
                        email: email,
                        code: otpCode,
                        expires_at: expiresAt.toISOString(),
                        created_at: new Date().toISOString()
                    }
                ]);

            if (otpError) {
                console.error('Erro ao criar OTP:', otpError);
            } else {
                // TODO: Enviar email com código OTP
                // Por enquanto, apenas logar no console do servidor
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('📧 CÓDIGO OTP GERADO');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log(`Email: ${email}`);
                console.log(`Código: ${otpCode}`);
                console.log(`Expira em: ${expiresAt.toLocaleString('pt-BR')}`);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            }
        }

        // ✅ Registrar auditoria de registro bem-sucedido
        logRegister(authData.user.id, req.ip, req.headers['user-agent'], { 
            full_name, 
            cpf: cleanCPF 
        }).catch(err => console.error('[Audit] Failed to log register:', err));

        res.json({
            success: true,
            message: 'Usuário registrado com sucesso. Verifique seu email para o código de confirmação.',
            data: {
                user: authData.user,
                session: null, // Não retorna sessão até confirmar OTP
                requiresEmailVerification: true
            },
            expiresIn: 3 // minutos
        });
    } catch (error) {
        console.error('[SECURITY] Erro ao registrar usuário:', error.message);
        
        // ❌ Registrar auditoria de registro falhado
        logFailedRegister(email, req.ip, req.headers['user-agent'], error.message, { 
            full_name, 
            cpf: cpf?.replace(/\D/g, '') 
        }).catch(err => console.error('[Audit] Failed to log failed register:', err));

        res.status(500).json({
            success: false,
            error: 'Erro ao registrar usuário',
            message: 'Não foi possível completar o registro. Tente novamente.'
            // Detalhes do erro não são expostos por segurança
        });
    }
});

/**
 * POST /auth/login
 * Fazer login com rate limiting dual (IP + CPF)
 * Limites: 20 tentativas por IP em 10min | 10 tentativas por CPF em 15min
 */
router.post('/login', dualLoginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔐 Tentativa de login:', {
            email: email || 'VAZIO',
            password: password ? '***' : 'VAZIO',
            bodyKeys: Object.keys(req.body),
            body: JSON.stringify(req.body)
        });

        if (!email || !password) {
            console.log('❌ Login rejeitado: email ou senha faltando');
            return res.status(400).json({
                success: false,
                error: 'Email e senha são obrigatórios'
            });
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw error;
        }

        // ✅ FIXAR SESSÃO: Setar cookies HTTP-only para autenticação
        if (data.session) {
            // Cookie de access token (usado pelo requireAuth middleware)
            res.cookie('sb-access-token', data.session.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // HTTPS apenas em produção
                sameSite: 'lax',
                maxAge: data.session.expires_in * 1000, // Converter para ms
                path: '/'
            });

            // Cookie de refresh token (para renovar sessão)
            res.cookie('sb-refresh-token', data.session.refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
                path: '/'
            });

            console.log('✅ Cookies de sessão definidos:', {
                access_token: 'SET (HTTP-only)',
                refresh_token: 'SET (HTTP-only)',
                expires_in: data.session.expires_in
            });
        }

        // ✅ Registrar auditoria de login bem-sucedido
        logLogin(data.user.id, req.ip, req.headers['user-agent'], { 
            email,
            method: 'email_password'
        }).catch(err => console.error('[Audit] Failed to log login:', err));

        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            data: {
                user: data.user,
                session: data.session
            }
        });
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        
        // ❌ Registrar auditoria de login falhado
        logFailedLogin(email, req.ip, req.headers['user-agent'], error.message, { 
            method: 'email_password'
        }).catch(err => console.error('[Audit] Failed to log failed login:', err));

        res.status(401).json({
            success: false,
            error: 'Credenciais inválidas',
            message: error.message
        });
    }
});

/**
 * POST /auth/login-cpf
 * Fazer login com CPF e senha
 * Rate limit: 5 tentativas a cada 15 minutos
 */
router.post('/login-cpf', loginLimiter, async (req, res) => {
    try {
        const { cpf, password } = req.body;

        console.log('🔐 Tentativa de login com CPF:', {
            cpf: cpf ? 'presente' : 'VAZIO',
            password: password ? '***' : 'VAZIO',
            bodyKeys: Object.keys(req.body)
        });

        if (!cpf || !password) {
            console.log('❌ Login rejeitado: CPF ou senha faltando');
            return res.status(400).json({
                success: false,
                error: 'CPF e senha são obrigatórios'
            });
        }

        // Limpar formatação do CPF
        const cleanCPF = cpf.replace(/\D/g, '');
        console.log('🧹 CPF limpo:', cleanCPF);

        // Validar se CPF tem 11 dígitos
        if (cleanCPF.length !== 11) {
            return res.status(400).json({
                success: false,
                error: 'CPF deve conter 11 dígitos'
            });
        }

        // 1️⃣ Buscar profile pelo CPF para pegar o ID (que é FK de auth.users.id)
        console.log('🔍 Buscando profile pelo CPF em public.profiles...');
        const { data: profileData, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, cpf, full_name')
            .eq('cpf', cleanCPF)
            .maybeSingle();

        console.log('📊 Resultado da busca profile:', { found: !!profileData, id: profileData?.id });

        if (profileError && profileError.code !== 'PGRST116') {
            console.error('❌ Erro do Supabase:', profileError);
            throw profileError;
        }

        if (!profileData) {
            console.log('❌ CPF não encontrado no banco');
            return res.status(401).json({
                success: false,
                error: 'CPF ou senha inválidos'
            });
        }

        // 2️⃣ Buscar email em auth.users usando o ID do profile
        console.log('👤 Buscando email em auth.users pelo ID:', profileData.id);
        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(profileData.id);

        if (userError) {
            console.error('❌ Erro ao buscar usuário:', userError);
            throw userError;
        }

        if (!user?.email) {
            console.log('❌ Email não encontrado para este usuário');
            return res.status(401).json({
                success: false,
                error: 'CPF ou senha inválidos'
            });
        }

        console.log('📧 Email encontrado:', user.email);

        // 3️⃣ Fazer login com email + senha (Supabase verifica a senha em auth.users)
        console.log('🔑 Tentando autenticação com email e senha...');
        const { data, error } = await supabase.auth.signInWithPassword({
            email: user.email,
            password
        });

        if (error) {
            console.error('❌ Erro na autenticação:', error.message);
            throw error;
        }

        console.log('✅ Login com CPF realizado com sucesso');

        // ✅ FIXAR SESSÃO: Setar cookies HTTP-only para autenticação
        if (data.session) {
            // Cookie de access token (usado pelo requireAuth middleware)
            res.cookie('sb-access-token', data.session.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // HTTPS apenas em produção
                sameSite: 'lax',
                maxAge: data.session.expires_in * 1000, // Converter para ms
                path: '/'
            });

            // Cookie de refresh token (para renovar sessão)
            res.cookie('sb-refresh-token', data.session.refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
                path: '/'
            });

            console.log('✅ Cookies de sessão definidos:', {
                access_token: 'SET (HTTP-only)',
                refresh_token: 'SET (HTTP-only)',
                expires_in: data.session.expires_in
            });
        }

        // ✅ Registrar auditoria de login com CPF bem-sucedido
        logLogin(data.user.id, req.ip, req.headers['user-agent'], { 
            cpf: cleanCPF,
            method: 'cpf_password'
        }).catch(err => console.error('[Audit] Failed to log login:', err));

        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            data: {
                user: data.user,
                session: data.session
            }
        });
    } catch (error) {
        console.error('Erro ao fazer login com CPF:', error);
        
        // ❌ Registrar auditoria de login falhado
        logFailedLogin(cpf, req.ip, req.headers['user-agent'], error.message, { 
            method: 'cpf_password'
        }).catch(err => console.error('[Audit] Failed to log failed login:', err));

        res.status(401).json({
            success: false,
            error: 'CPF ou senha inválidos',
            message: error.message
        });
    }
});

/**
 * POST /auth/logout
 * Fazer logout
 */
router.post('/logout', async (req, res) => {
    try {
        // Obter user_id antes de fazer logout (cookies ainda disponíveis)
        const accessToken = req.cookies?.['sb-access-token'];
        let userId = null;

        if (accessToken) {
            try {
                // Usar supabaseAdmin para validar o token
                const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
                if (!userError && user) {
                    userId = user.id;
                    console.log(`[Logout] User ID encontrado: ${userId}`);
                }
            } catch (err) {
                console.error('[Logout] Could not get user for audit:', err.message);
            }
        }

        // Fazer logout (não importa se falhar, vamos limpar os cookies de qualquer forma)
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.warn('[Logout] Supabase signOut error (não crítico):', error.message);
            }
        } catch (err) {
            console.warn('[Logout] Supabase signOut failed (não crítico):', err.message);
        }

        // Limpar cookies de sessão (SEMPRE fazer isso, mesmo se signOut falhar)
        res.clearCookie('sb-access-token', { path: '/' });
        res.clearCookie('sb-refresh-token', { path: '/' });

        console.log('✅ Logout realizado e cookies limpos');

        // ✅ Registrar auditoria de logout
        if (userId) {
            logLogout(userId, req.ip, req.headers['user-agent'])
                .catch(err => console.error('[Audit] Failed to log logout:', err));
        }

        res.json({
            success: true,
            message: 'Logout realizado com sucesso'
        });
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao fazer logout',
            message: error.message
        });
    }
});

/**
 * GET /auth/session
 * Obter sessão atual
 */
router.get('/session', async (req, res) => {
    try {
        // Pegar token do header Authorization OU do cookie
        const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies['sb-access-token'];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token não fornecido'
            });
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            data: {
                user
            }
        });
    } catch (error) {
        console.error('Erro ao obter sessão:', error);
        res.status(401).json({
            success: false,
            error: 'Sessão inválida',
            message: error.message
        });
    }
});

/**
 * POST /auth/verify-otp
 * Verificar código OTP e ativar conta
 */
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                success: false,
                error: 'Email e código são obrigatórios'
            });
        }

        // Buscar código OTP válido
        const { data: otpData, error: otpError } = await supabaseAdmin
            .from('otp_codes')
            .select('*')
            .eq('email', email)
            .eq('code', code)
            .is('used_at', null)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (otpError) {
            throw otpError;
        }

        if (!otpData) {
            return res.status(400).json({
                success: false,
                error: 'Código inválido ou expirado'
            });
        }

        // Marcar código como usado
        await supabaseAdmin
            .from('otp_codes')
            .update({ used_at: new Date().toISOString() })
            .eq('id', otpData.id);

        // Confirmar email do usuário no Supabase Auth
        const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
            otpData.user_id,
            { email_confirm: true }
        );

        if (confirmError) {
            console.error('Erro ao confirmar email:', confirmError);
        }

        // Atualizar perfil
        await supabaseAdmin
            .from('profiles')
            .update({ email_verified: true })
            .eq('id', otpData.user_id);

        // Criar sessão para o usuário (fazer login automático)
        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: email
        });

        if (sessionError) {
            console.error('Erro ao gerar sessão:', sessionError);
        }

        res.json({
            success: true,
            message: 'Email verificado com sucesso!',
            data: {
                verified: true,
                user_id: otpData.user_id
            }
        });
    } catch (error) {
        console.error('Erro ao verificar OTP:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao verificar código',
            message: error.message
        });
    }
});

/**
 * POST /auth/resend-otp
 * Reenviar código OTP
 */
router.post('/resend-otp', otpResendLimiter, async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email é obrigatório'
            });
        }

        // Buscar usuário pelo email
        const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();

        if (userError) {
            throw userError;
        }

        const user = users?.find(u => u.email === email);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }

        // Invalidar códigos antigos não utilizados (marca como "usado" ao solicitar reenvio)
        const { data: invalidatedCodes, error: invalidateError } = await supabaseAdmin
            .from('otp_codes')
            .update({ used_at: new Date().toISOString() })
            .eq('email', email)
            .is('used_at', null)
            .select();

        if (invalidateError) {
            console.error('❌ Erro ao invalidar códigos antigos:', invalidateError);
        } else if (invalidatedCodes && invalidatedCodes.length > 0) {
            console.log(`✓ ${invalidatedCodes.length} código(s) anterior(es) invalidado(s) para ${email}`);
        }

        // Gerar novo código OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 minutos

        // Salvar OTP no banco
        const { error: otpError } = await supabaseAdmin
            .from('otp_codes')
            .insert([
                {
                    user_id: user.id,
                    email: email,
                    code: otpCode,
                    expires_at: expiresAt.toISOString(),
                    created_at: new Date().toISOString()
                }
            ]);

        if (otpError) {
            throw otpError;
        }

        // TODO: Enviar email com código OTP
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 CÓDIGO OTP REENVIADO');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Email: ${email}`);
        console.log(`Código: ${otpCode}`);
        console.log(`Expira em: ${expiresAt.toLocaleString('pt-BR')}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        res.json({
            success: true,
            message: 'Código reenviado com sucesso!',
            expiresIn: 3 // minutos
        });
    } catch (error) {
        console.error('Erro ao reenviar OTP:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao reenviar código',
            message: error.message
        });
    }
});

/**
 * POST /auth/resend-confirmation
 * Alias para /auth/resend-otp (compatibilidade com frontend)
 */
router.post('/resend-confirmation', otpResendLimiter, async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email é obrigatório'
            });
        }

        // Buscar usuário pelo email
        const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();

        if (userError) {
            throw userError;
        }

        const user = users?.find(u => u.email === email);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }

        // Invalidar códigos antigos não utilizados (marca como "usado" ao solicitar reenvio)
        const { data: invalidatedCodes, error: invalidateError } = await supabaseAdmin
            .from('otp_codes')
            .update({ used_at: new Date().toISOString() })
            .eq('email', email)
            .is('used_at', null)
            .select();

        if (invalidateError) {
            console.error('❌ Erro ao invalidar códigos antigos:', invalidateError);
        } else if (invalidatedCodes && invalidatedCodes.length > 0) {
            console.log(`✓ ${invalidatedCodes.length} código(s) anterior(es) invalidado(s) para ${email}`);
        }

        // Gerar novo código OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 minutos

        // Salvar OTP no banco
        const { error: otpError } = await supabaseAdmin
            .from('otp_codes')
            .insert([
                {
                    user_id: user.id,
                    email: email,
                    code: otpCode,
                    expires_at: expiresAt.toISOString(),
                    created_at: new Date().toISOString()
                }
            ]);

        if (otpError) {
            throw otpError;
        }

        // TODO: Enviar email com código OTP
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 CÓDIGO OTP REENVIADO (resend-confirmation)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Email: ${email}`);
        console.log(`Código: ${otpCode}`);
        console.log(`Expira em: ${expiresAt.toLocaleString('pt-BR')}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        res.json({
            success: true,
            message: 'Email de confirmação reenviado com sucesso!',
            expiresIn: 3 // minutos
        });
    } catch (error) {
        console.error('Erro ao reenviar confirmação:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao reenviar email',
            message: error.message
        });
    }
});

/**
 * POST /auth/verify-email-token
 * Alias para /auth/verify-otp (compatibilidade com frontend)
 * Aceita tanto { email, code } quanto { email, token }
 */
router.post('/verify-email-token', otpVerificationLimiter, async (req, res) => {
    try {
        const { email, code, token } = req.body;
        const otpCode = code || token; // Aceita ambos os nomes

        console.log('🔍 Verificando código OTP:', { email, code: otpCode });

        if (!email || !otpCode) {
            return res.status(400).json({
                success: false,
                error: 'Email e código são obrigatórios'
            });
        }

        // Buscar código OTP válido
        const { data: otpData, error: otpError } = await supabaseAdmin
            .from('otp_codes')
            .select('*')
            .eq('email', email)
            .eq('code', otpCode)
            .is('used_at', null)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        console.log('📋 Resultado da busca OTP:', { 
            found: !!otpData, 
            error: otpError?.message,
            otpData: otpData ? { id: otpData.id, expires_at: otpData.expires_at, used_at: otpData.used_at } : null
        });

        if (otpError) {
            throw otpError;
        }

        if (!otpData) {
            return res.status(400).json({
                success: false,
                error: 'Código inválido ou expirado'
            });
        }

        // Marcar código como usado
        await supabaseAdmin
            .from('otp_codes')
            .update({ used_at: new Date().toISOString() })
            .eq('id', otpData.id);

        // Confirmar email do usuário no Supabase Auth
        console.log('📧 Confirmando email do usuário:', otpData.user_id);
        
        const now = new Date().toISOString();
        const { data: updateData, error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
            otpData.user_id,
            { 
                email_confirm: true,
                email_confirmed_at: now
                // confirmed_at é uma coluna gerada automaticamente, não pode ser definida
            }
        );

        if (confirmError) {
            console.error('❌ Erro ao confirmar email:', confirmError);
            console.error('Detalhes do erro:', JSON.stringify(confirmError, null, 2));
            throw new Error(`Erro ao confirmar email: ${confirmError.message}`);
        }
        
        console.log('✅ Email confirmado com sucesso:', {
            email_confirmed_at: now,
            updated_user: updateData
        });

        // Atualizar perfil
        console.log('👤 Atualizando perfil do usuário');
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ 
                email_verified: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', otpData.user_id);

        if (profileError) {
            console.error('❌ Erro ao atualizar perfil:', profileError);
        }

        // Buscar dados completos do usuário
        console.log('🔍 Buscando dados do usuário');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(otpData.user_id);

        if (userError) {
            console.error('❌ Erro ao buscar usuário:', userError);
            throw new Error(`Erro ao buscar usuário: ${userError.message}`);
        }

        // Buscar email e senha do usuário para criar sessão
        console.log('🔐 Criando sessão para login automático');
        
        // Buscar profile para pegar dados adicionais
        const { data: profileData } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', otpData.user_id)
            .single();

        console.log('✅ Email confirmado - retornando dados para login automático');

        res.json({
            success: true,
            message: 'Email verificado com sucesso! Você será conectado automaticamente.',
            data: {
                verified: true,
                user_id: otpData.user_id,
                email: email,
                user: {
                    ...user,
                    user_metadata: {
                        ...user.user_metadata,
                        full_name: profileData?.full_name
                    }
                },
                profile: profileData,
                // Frontend deve fazer login normal com email/senha salvos
                requiresLogin: true,
                emailConfirmed: true
            }
        });
    } catch (error) {
        console.error('Erro ao verificar email:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao verificar código',
            message: error.message
        });
    }
});

/**
 * POST /auth/forgot-password
 * Solicita recuperação de senha (envia email com link)
 * Rate limit mais permissivo (usuário legítimo precisa de acesso)
 */
router.post('/forgot-password', rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 solicitações por janela
    message: {
        success: false,
        error: 'Muitas solicitações de recuperação. Verifique seu email ou aguarde alguns minutos.'
    }
}), async (req, res) => {
    try {
        const { email, cpf } = req.body;

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔑 /forgot-password CHAMADO');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Aceita email ou CPF
        let userEmail = email;

        if (cpf && !email) {
            // Buscar email pelo CPF
            const cleanCPF = cpf.replace(/\D/g, '');
            
            const { data: profileData, error: profileError } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('cpf', cleanCPF)
                .maybeSingle();

            if (profileError || !profileData) {
                // Por segurança, não revelar se CPF existe ou não
                console.log('⚠️ CPF não encontrado, mas retornando sucesso (segurança)');
                return res.json({
                    success: true,
                    message: 'Se este CPF estiver cadastrado, você receberá um email com instruções para recuperar sua senha.'
                });
            }

            // Buscar email do usuário
            const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(profileData.id);

            if (userError || !user) {
                return res.json({
                    success: true,
                    message: 'Se este CPF estiver cadastrado, você receberá um email com instruções para recuperar sua senha.'
                });
            }

            userEmail = user.email;
        }

        if (!userEmail) {
            return res.status(400).json({
                success: false,
                error: 'Email ou CPF é obrigatório'
            });
        }

        console.log('📧 Enviando email de recuperação para:', userEmail);

        // Supabase envia email automaticamente com link de reset
        const { data, error } = await supabase.auth.resetPasswordForEmail(userEmail, {
            redirectTo: `${process.env.FRONTEND_URL || 'https://samm.host'}/redefinir-senha`
        });

        if (error) {
            console.error('❌ Erro ao enviar email de recuperação:', error);
            // Não revelar erro específico por segurança
            return res.json({
                success: true,
                message: 'Se este email estiver cadastrado, você receberá instruções para recuperar sua senha.'
            });
        }

        console.log('✅ Email de recuperação enviado com sucesso');

        res.json({
            success: true,
            message: 'Se este email estiver cadastrado, você receberá instruções para recuperar sua senha. Verifique também sua caixa de spam.',
            data: {
                emailSent: true
            }
        });
    } catch (error) {
        console.error('Erro ao solicitar recuperação de senha:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao processar solicitação',
            message: error.message
        });
    }
});

/**
 * POST /auth/reset-password
 * Redefine senha usando token do email
 */
router.post('/reset-password', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        error: 'Muitas tentativas. Aguarde alguns minutos.'
    }
}), async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Token e nova senha são obrigatórios'
            });
        }

        // Validar força da senha
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                error: 'A senha deve ter no mínimo 8 caracteres'
            });
        }

        console.log('🔑 Redefinindo senha com token');

        // Atualizar senha usando token
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            console.error('❌ Erro ao redefinir senha:', error);
            return res.status(400).json({
                success: false,
                error: 'Token inválido ou expirado',
                message: error.message
            });
        }

        console.log('✅ Senha redefinida com sucesso');

        res.json({
            success: true,
            message: 'Senha redefinida com sucesso! Você já pode fazer login.',
            data: {
                user: data.user
            }
        });
    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao redefinir senha',
            message: error.message
        });
    }
});

// ============================================================================
// ENDPOINTS DE SEGURANÇA - FASE 2
// ============================================================================

/**
 * GET /auth/rate-limit-status
 * Consulta status de rate limiting (IP + CPF)
 * Retorna informações sem comprometer segurança
 */
router.get('/rate-limit-status', async (req, res) => {
    try {
        const ip = req.ip || req.connection.remoteAddress;
        const cpf = req.query.cpf || null;

        const ipCount = dualStore.getIPCount(ip);
        const cpfCount = cpf ? dualStore.getCPFCount(cpf) : 0;
        const timeRemaining = dualStore.getTimeRemaining(ip, cpf);

        // Não revelar limites exatos (segurança)
        const ipStatus = ipCount > 0 ? 'active' : 'clear';
        const cpfStatus = cpfCount > 0 ? 'active' : 'clear';

        res.json({
            success: true,
            data: {
                ip: {
                    status: ipStatus,
                    attempts: ipCount,
                    timeRemaining: timeRemaining.ip
                },
                cpf: cpf ? {
                    status: cpfStatus,
                    attempts: cpfCount,
                    timeRemaining: timeRemaining.cpf
                } : null,
                message: timeRemaining.max > 0 
                    ? `Aguarde ${Math.ceil(timeRemaining.max / 60)} minutos antes de tentar novamente.`
                    : 'Você pode fazer login normalmente.'
            }
        });
    } catch (error) {
        console.error('Erro ao consultar status de rate limit:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao consultar status'
        });
    }
});

/**
 * GET /auth/security-stats
 * Estatísticas gerais de segurança (apenas para admins)
 * Requer: autenticação + role admin
 */
router.get('/security-stats', requireAuth, requireAdmin, async (req, res) => {
    try {
        const stats = dualStore.getStats();
        const recentLogs = dualStore.getRecentLogs(50);
        const alertStats = alertStore.getStats();
        const recentAlerts = alertStore.getAllAlerts(20);

        res.json({
            success: true,
            data: {
                rateLimiting: stats,
                alerts: alertStats,
                recentAttempts: recentLogs,
                recentAlerts,
                adminUser: {
                    id: req.user.id,
                    email: req.user.email,
                    role: req.user.role
                },
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas de segurança:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar estatísticas'
        });
    }
});

/**
 * POST /auth/reset-rate-limit
 * Reseta rate limit de um IP ou CPF específico (apenas para admins)
 * Requer: autenticação + role admin
 */
router.post('/reset-rate-limit', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { ip, cpf, resetAll } = req.body;

        console.log(`[Admin Action] Reset rate limit por ${req.user.email}: IP=${ip}, CPF=${cpf}, resetAll=${resetAll}`);

        if (resetAll === true) {
            dualStore.resetAll();
            return res.json({
                success: true,
                message: 'Todos os rate limits foram resetados',
                admin: req.user.email
            });
        }

        if (ip) {
            dualStore.resetIP(ip);
        }

        if (cpf) {
            dualStore.resetCPF(cpf);
        }

        res.json({
            success: true,
            message: 'Rate limit resetado com sucesso',
            admin: req.user.email
        });
    } catch (error) {
        console.error('Erro ao resetar rate limit:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao resetar rate limit'
        });
    }
});

/**
 * GET /auth/alerts
 * Lista todos os alertas de segurança (apenas para admins)
 * Requer: autenticação + role admin
 */
router.get('/alerts', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { limit = 100, status } = req.query;
        
        let alerts = alertStore.getAllAlerts(parseInt(limit));
        
        // Filtrar por status se fornecido
        if (status) {
            alerts = alerts.filter(a => a.status === status);
        }

        const stats = alertStore.getStats();

        res.json({
            success: true,
            data: {
                alerts,
                stats,
                filters: { limit, status },
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Erro ao buscar alertas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar alertas'
        });
    }
});

/**
 * POST /auth/alerts/process
 * Processa fila de alertas pendentes manualmente (apenas para admins)
 * Requer: autenticação + role admin
 */
router.post('/alerts/process', requireAuth, requireAdmin, async (req, res) => {
    try {
        console.log(`[Admin Action] Processamento manual de alertas por ${req.user.email}`);
        
        const { processAlertQueue } = await import('../utils/alertSystem.js');
        const result = await processAlertQueue();

        res.json({
            success: true,
            data: result,
            message: `${result.sent} alertas enviados, ${result.failed} falharam`,
            admin: req.user.email
        });
    } catch (error) {
        console.error('Erro ao processar alertas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao processar alertas',
            message: error.message
        });
    }
});

/**
 * GET /auth/dashboard
 * Dashboard completo de segurança (apenas para admins)
 * Requer: autenticação + role admin
 */
router.get('/dashboard', requireAuth, requireAdmin, async (req, res) => {
    try {
        const rateLimitStats = dualStore.getStats();
        const recentAttempts = dualStore.getRecentLogs(100);
        const alertStats = alertStore.getStats();
        const recentAlerts = alertStore.getAllAlerts(50);
        const pendingAlerts = alertStore.getPendingAlerts();

        // Calcular métricas adicionais
        const now = Date.now();
        const last1h = recentAttempts.filter(a => 
            new Date(a.timestamp).getTime() > (now - 60 * 60 * 1000)
        );
        const last24h = recentAttempts.filter(a => 
            new Date(a.timestamp).getTime() > (now - 24 * 60 * 60 * 1000)
        );

        const blockedAttemptsLast1h = last1h.filter(a => a.ipBlocked || a.cpfBlocked).length;
        const blockedAttemptsLast24h = last24h.filter(a => a.ipBlocked || a.cpfBlocked).length;

        // Top IPs com mais tentativas
        const ipCounts = {};
        recentAttempts.forEach(a => {
            ipCounts[a.ip] = (ipCounts[a.ip] || 0) + 1;
        });
        const topIPs = Object.entries(ipCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([ip, count]) => ({ ip, count }));

        res.json({
            success: true,
            data: {
                overview: {
                    totalIPsTracked: rateLimitStats.totalIPsTracked,
                    totalCPFsTracked: rateLimitStats.totalCPFsTracked,
                    totalAlertsCreated: alertStats.total,
                    pendingAlerts: pendingAlerts.length,
                    blockedAttemptsLast1h,
                    blockedAttemptsLast24h
                },
                rateLimiting: rateLimitStats,
                alerts: {
                    stats: alertStats,
                    recent: recentAlerts,
                    pending: pendingAlerts
                },
                attempts: {
                    last1h: last1h.length,
                    last24h: last24h.length,
                    recent: recentAttempts.slice(0, 20)
                },
                topIPs,
                adminUser: {
                    id: req.user.id,
                    email: req.user.email,
                    role: req.user.role
                },
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Erro ao buscar dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar dashboard',
            message: error.message
        });
    }
});

export default router;

