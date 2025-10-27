import express from 'express';
import { createClient } from '@supabase/supabase-js';
import rateLimit from 'express-rate-limit';
import {
    authLimiter,
    registerLimiter,
    resendOTPLimiter,
    apiLimiter
} from '../middlewares/rateLimiters.js';
import { createDualRateLimiter, dualStore } from '../middlewares/dualRateLimiter.js';
import { requireAuth, requireAdmin } from '../middlewares/adminAuth.js';
import { setCsrfToken, clearCsrfToken } from '../middlewares/csrfProtection.js';
import { alertStore } from '../utils/alertSystem.js';
import { 
    logLogin, 
    logFailedLogin, 
    logRegister, 
    logFailedRegister,
    logLogout 
} from '../services/auditService.js';
import { 
    secureLog, 
    secureErrorLog 
} from '../utils/maskSensitiveData.js';
import logger from '../config/logger.js';

const router = express.Router();

// Cliente Supabase (usando variáveis de ambiente)
// Em produção (Docker), usa Kong interno. Em dev, usa URL público.
const supabaseUrl = process.env.SUPABASE_INTERNAL_URL || process.env.SUPABASE_URL || 'http://supabase-kong:8000';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseAnonKey) {
    logger.warn('SUPABASE_ANON_KEY não configurada! Rotas de autenticação não funcionarão.');
}

if (!supabaseServiceKey) {
    logger.warn('SUPABASE_SERVICE_ROLE_KEY não configurada! Algumas funcionalidades podem não funcionar.');
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
 * Verifica se CPF já está cadastrado
 * Limites: 30 tentativas por IP em 10min | 20 tentativas por CPF em 10min
 * 
 * ✅ SIMPLIFICADO: Apenas verifica existência
 * - Cleanup automático via função agendada (não aqui)
 * - Usa email_confirmed_at nativo do Supabase
 */
router.post('/check-cpf', dualCPFCheckLimiter, async (req, res) => {
    try {
        const { cpf } = req.body;

        secureLog('[Auth] /check-cpf chamado', { cpf, ip: req.ip });

        if (!cpf) {
            return res.status(400).json({
                success: false,
                error: 'CPF é obrigatório'
            });
        }

        // Limpar formatação do CPF
        const cleanCPF = cpf.replace(/\D/g, '');

        // Validar CPF (algoritmo completo com dígitos verificadores)
        const { isValidCPF } = await import('../utils/authUtils.js');
        if (!isValidCPF(cleanCPF)) {
            return res.status(400).json({
                success: false,
                error: 'CPF inválido. Verifique os dígitos.'
            });
        }

        // Buscar usuário com este CPF na tabela profiles
        const { data: profileData, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, cpf, full_name, email_verified')
            .eq('cpf', cleanCPF)
            .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = not found
            secureErrorLog('[Security] Erro ao buscar CPF', profileError, { cpf: cleanCPF });
            throw profileError;
        }

        const exists = !!profileData;
        let hasPassword = false;
        let emailVerified = false;

        // Se existe, verificar se tem senha no Supabase Auth
        if (exists) {
            const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(profileData.id);
            
            if (authError) {
                secureErrorLog('[Security] Erro ao buscar usuário no Auth', authError);
            } else {
                hasPassword = !!authUser.user?.encrypted_password;
                emailVerified = profileData.email_verified || false;
            }
        }
        
        secureLog('[Auth] Verificação de CPF concluída', { 
            cpf: cleanCPF, 
            exists,
            hasPassword,
            emailVerified
        });

        res.json({
            success: true,
            data: { 
                exists,
                hasPassword,
                emailVerified
            },
            message: exists ? 'CPF já cadastrado' : 'CPF disponível'
        });
    } catch (error) {
        secureErrorLog('[Security] Erro ao verificar CPF', error, { 
            ip: req.ip 
        });
        res.status(500).json({
            success: false,
            error: 'Erro ao verificar CPF'
        });
    }
});

/**
 * POST /auth/check-email
 * Verifica se email já está cadastrado
 * 
 * ✅ OTIMIZADO: Query com índice em profiles.email
 * Performance: O(1) com idx_profiles_email_lower
 * Nota: Email sincronizado via trigger de auth.users
 */
router.post('/check-email', async (req, res) => {
    try {
        const { email } = req.body;

        secureLog('[Auth] /check-email chamado', { email });

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

        // ✅ OTIMIZADO: Buscar em profiles.email com índice
        // Performance: O(1) com idx_profiles_email_lower (case-insensitive)
        const { data: profile, error } = await supabaseAdmin
            .from('profiles')
            .select('id, email')
            .ilike('email', email)
            .maybeSingle();
            
        if (error) {
            secureErrorLog('[Security] Erro ao verificar email em profiles', error);
            return res.status(500).json({
                success: false,
                error: 'Erro ao verificar email'
            });
        }

        const emailExists = profile !== null;
        
        secureLog('[Auth] Verificação de email concluída', { 
            email, 
            exists: emailExists 
        });

        res.json({
            success: true,
            data: {
                available: !emailExists,
                exists: emailExists
            },
            message: emailExists ? 'Email já cadastrado' : 'Email disponível'
        });
    } catch (error) {
        secureErrorLog('[Security] Erro ao verificar email', error, { 
            ip: req.ip 
        });
        res.status(500).json({
            success: false,
            error: 'Erro ao verificar email'
        });
    }
});

/**
 * POST /auth/register
 * Registrar novo usuário
 * Rate limit: 3 registros por hora
 * 
 * ✅ SIMPLIFICADO: Supabase gerencia verificação via email_confirmed_at
 * - Cleanup automático via função agendada
 * - Sem rollback manual (race conditions tratadas no DB)
 */
router.post('/register', registerLimiter, async (req, res) => {
    try {
        const { email, password, full_name, cpf } = req.body;

        secureLog('[Auth] /register chamado', { email, cpf });

        // ========================================
        // VALIDAÇÕES DE ENTRADA
        // ========================================
        
        // 1. Validar campos obrigatórios
        if (!email || !password || !full_name || !cpf) {
            return res.status(400).json({
                success: false,
                error: 'Email, senha, nome completo e CPF são obrigatórios'
            });
        }

        // 2. Validar nome completo
        const { isValidFullName } = await import('../utils/authUtils.js');
        const nameValidation = isValidFullName(full_name);
        if (!nameValidation.valid) {
            return res.status(400).json({
                success: false,
                error: nameValidation.error
            });
        }

        // 3. Validar formato de email
        const { isValidEmail } = await import('../utils/authUtils.js');
        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                error: 'Por favor, insira um formato de e-mail válido.'
            });
        }

        // 4. Validar provedor de e-mail confiável
        const { isAllowedEmailProvider } = await import('../utils/authUtils.js');
        if (!isAllowedEmailProvider(email)) {
            return res.status(400).json({
                success: false,
                error: 'Por favor, use um e-mail de provedor confiável (Gmail, Outlook, Yahoo, etc).'
            });
        }

        // 5. Validar senha forte
        const { isValidPassword, getPasswordErrors } = await import('../utils/authUtils.js');
        if (!isValidPassword(password)) {
            const passwordErrors = getPasswordErrors(password);
            return res.status(400).json({
                success: false,
                error: `Senha fraca. Sua senha precisa de: ${passwordErrors.join(', ')}`
            });
        }

        // 6. Validar e limpar CPF
        const { isValidCPF, cleanCPF: cleanCPFFunc } = await import('../utils/authUtils.js');
        const cleanCPF = cleanCPFFunc(cpf);
        
        if (!isValidCPF(cleanCPF)) {
            return res.status(400).json({
                success: false,
                error: 'CPF inválido'
            });
        }

        // Gerar referral code (max 20 caracteres)
        const { data: refCodeData, error: refCodeError } = await supabaseAdmin
            .rpc('generate_referral_code');

        if (refCodeError) {
            secureErrorLog('[Auth] Erro ao gerar código de referência', refCodeError);
        }

        // Fallback: gerar código único curto (max 20 chars)
        // Formato: USER-TIMESTAMP (14 chars) = "USER-1729900000" (15 chars total)
        const referralCode = refCodeData || `U${Date.now().toString().slice(-8)}${Math.random().toString(36).substr(2, 7).toUpperCase()}`;


        // ✅ PASSO 1: Criar usuário no Supabase Auth
        secureLog('[Auth] Criando usuário em auth.users', { email });
        
        const { data: authResponse, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // ✅ Confirmar email automaticamente para permitir login imediato
            user_metadata: {
                full_name,
                cpf: cleanCPF
            }
        });

        if (authError) {
            secureErrorLog('[Auth] Erro ao criar usuário em auth.users', authError);
            
            // Mensagem de erro amigável
            if (authError.message?.includes('already registered')) {
                return res.status(409).json({
                    success: false,
                    error: 'Email já cadastrado',
                    message: 'Este email já está em uso. Por favor, faça login ou use outro email.'
                });
            }
            
            throw authError;
        }

        secureLog('[Auth] Usuário criado em auth.users', { userId: authResponse.user.id });

        // ✅ PASSO 2: Criar perfil
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert([
                {
                    id: authResponse.user.id,
                    cpf: cleanCPF,
                    full_name,
                    referral_code: referralCode,
                    email_verified: false, // ✅ Email ainda não foi verificado via OTP
                    phone_verified: false, // ✅ Telefone ainda não foi verificado
                    updated_at: new Date().toISOString()
                }
            ]);

        if (profileError) {
            secureErrorLog('[Auth] Erro ao criar perfil', profileError);
            
            // CPF duplicado (outro usuário registrou ao mesmo tempo)
            if (profileError.code === '23505') {
                return res.status(409).json({
                    success: false,
                    error: 'CPF já cadastrado',
                    message: 'Este CPF já está em uso. Por favor, use outro CPF.'
                });
            }
            
            throw profileError;
        }
        
        secureLog('[Auth] Perfil criado com sucesso', { userId: authResponse.user.id });

        // ✅ PASSO 3: V7 - Criar carteira do usuário
        // OK usar supabaseAdmin aqui: operação de sistema durante registro
        // Usuário ainda não tem token JWT válido neste momento
        const { error: walletError } = await supabaseAdmin
            .from('economy_user_wallets')
            .insert([
                {
                    user_id: authResponse.user.id,
                    bonus_credits: 100, // Bônus de cadastro
                    purchased_points: 0,
                    total_earned_bonus: 100,
                    total_purchased: 0,
                    total_spent: 0,
                    pro_weekly_allowance: 20,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ]);

        if (walletError) {
            secureErrorLog('[Auth] Erro ao criar carteira inicial', walletError);
        } else {
            // V7: Criar transação de bônus de cadastro (também OK usar Admin aqui)
            await supabaseAdmin
                .from('economy_transactions')
                .insert([
                    {
                        user_id: authResponse.user.id,
                        type: 'signup_bonus',
                        point_type: 'bonus',
                        amount: 100,
                        balance_before: 0,
                        balance_after: 100,
                        description: 'Bônus de boas-vindas',
                        created_at: new Date().toISOString()
                    }
                ]);
        }

        // ✅ PASSO 4: Gerar e salvar OTP + Token de verificação
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationToken = `${authResponse.user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 16)}`;
        const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 minutos

        const { error: otpError } = await supabaseAdmin
            .from('otp_codes')
            .insert([
                {
                    user_id: authResponse.user.id,
                    email: email,
                    code: otpCode,
                    verification_token: verificationToken,
                    expires_at: expiresAt.toISOString(),
                    created_at: new Date().toISOString()
                }
            ]);

        if (otpError) {
            secureErrorLog('[Auth] Erro ao criar OTP', otpError);
        } else {
            // Gerar link de verificação
            const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;
            
            // ✅ Log do OTP e Link para desenvolvimento
            logger.auth('OTP e Link Mágico gerados', {
                email,
                otpCode,
                verificationLink,
                expiresAt: expiresAt.toISOString()
            });
        }

        // ✅ Registrar auditoria de registro bem-sucedido
        logRegister(authResponse.user.id, req.ip, req.headers['user-agent'], { 
            full_name, 
            cpf: cleanCPF 
        }).catch(err => secureErrorLog('[Audit] Failed to log register', err));

        // ❌ NOVO FLUXO: NÃO fazer login automático
        // Usuário precisa verificar email antes de fazer login
        logger.info('Registro concluído, aguardando verificação de email', { userId: authResponse.user.id });

        res.json({
            success: true,
            message: 'Usuário registrado! Verifique seu e-mail para continuar.',
            data: {
                user: authResponse.user,
                needsVerification: true, // ✅ Indica que precisa verificar email
                email: email, // Email para mostrar na UI
                cpf: cleanCPF // CPF para fazer login após verificar
            },
            expiresIn: 3 // minutos para o código OTP
        });
    } catch (error) {
        secureErrorLog('[Security] Erro ao registrar usuário', error, {
            email: req.body.email,
            cpf: req.body.cpf
        });
        
        // ❌ Registrar auditoria de registro falhado
        logFailedRegister(
            req.body.email, 
            req.ip, 
            req.headers['user-agent'], 
            error.message, 
            { 
                full_name: req.body.full_name, 
                cpf: req.body.cpf?.replace(/\D/g, '') 
            }
        ).catch(err => secureErrorLog('[Audit] Failed to log failed register', err));

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

        logger.auth('Tentativa de login com email', {
            hasEmail: !!email,
            hasPassword: !!password
        });

        if (!email || !password) {
            logger.warn('Login rejeitado: email ou senha faltando', { email });
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
                sameSite: 'strict', // ✅ CSRF Protection
                maxAge: data.session.expires_in * 1000, // Converter para ms
                path: '/'
            });

            // Cookie de refresh token (para renovar sessão)
            res.cookie('sb-refresh-token', data.session.refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict', // ✅ CSRF Protection
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
                path: '/'
            });

            logger.auth('Cookies de sessão HTTP-only definidos no login com email', {
                userId: data.user.id,
                expiresIn: data.session.expires_in
            });
        }

        // 🔐 Gerar e enviar CSRF token
        setCsrfToken(req, res, data.session.expires_in * 1000);

        // ✅ Registrar auditoria de login bem-sucedido
        logLogin(data.user.id, req.ip, req.headers['user-agent'], { 
            email,
            method: 'email_password'
        }).catch(err => logger.error('Falha ao registrar login na auditoria', { err }));

        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            data: {
                user: data.user,
                session: data.session
            }
        });
    } catch (error) {
        logger.error('Erro ao fazer login', { email, error: error.message });
        
        // ❌ Registrar auditoria de login falhado
        logFailedLogin(email, req.ip, req.headers['user-agent'], error.message, { 
            method: 'email_password'
        }).catch(err => logger.error('Falha ao registrar login falhado na auditoria', { err }));

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
router.post('/login-cpf', authLimiter, async (req, res) => {
    try {
        const { cpf, password } = req.body;

        logger.auth('Tentativa de login com CPF', {
            hasCpf: !!cpf,
            hasPassword: !!password
        });

        if (!cpf || !password) {
            logger.warn('Login com CPF rejeitado: CPF ou senha faltando');
            return res.status(400).json({
                success: false,
                error: 'CPF e senha são obrigatórios'
            });
        }

        // Limpar formatação do CPF
        const cleanCPF = cpf.replace(/\D/g, '');
        logger.auth('CPF limpo para validação', { cleanCPF: cleanCPF.substring(0, 3) + '.***.***-**' });

        // Validar CPF (algoritmo completo com dígitos verificadores)
        const { isValidCPF } = await import('../utils/authUtils.js');
        if (!isValidCPF(cleanCPF)) {
            logger.warn('CPF inválido fornecido no login');
            return res.status(400).json({
                success: false,
                error: 'CPF inválido. Verifique os dígitos.'
            });
        }

        // 1️⃣ Buscar profile pelo CPF para pegar o ID (que é FK de auth.users.id)
        logger.auth('Buscando profile pelo CPF');
        const { data: profileData, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, cpf, full_name, email_verified')
            .eq('cpf', cleanCPF)
            .maybeSingle();

        logger.auth('Resultado da busca de profile', { 
            found: !!profileData, 
            emailVerified: profileData?.email_verified
        });

        if (profileError && profileError.code !== 'PGRST116') {
            logger.error('Erro do Supabase ao buscar profile', { profileError });
            throw profileError;
        }

        if (!profileData) {
            logger.warn('CPF não encontrado no banco');
            return res.status(401).json({
                success: false,
                error: 'CPF ou senha inválidos'
            });
        }

        // 2️⃣ Buscar email em auth.users usando o ID do profile
        logger.auth('Buscando email em auth.users', { userId: profileData.id });
        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(profileData.id);

        if (userError) {
            logger.error('Erro ao buscar usuário no auth.users', { userError });
            throw userError;
        }

        if (!user?.email) {
            logger.warn('Email não encontrado para o usuário');
            return res.status(401).json({
                success: false,
                error: 'CPF ou senha inválidos'
            });
        }

        logger.auth('Email encontrado para CPF', { email: user.email });

        // ✅ VERIFICAR SE EMAIL FOI VERIFICADO
        if (!profileData.email_verified) {
            logger.warn('Email não verificado, bloqueando login', { email: user.email });
            return res.status(403).json({
                success: false,
                error: 'Email não verificado',
                code: 'EMAIL_NOT_VERIFIED',
                data: {
                    needsVerification: true,
                    email: user.email,
                    cpf: cleanCPF
                }
            });
        }
        
        // 3️⃣ Fazer login com email + senha (Supabase verifica a senha em auth.users)
        logger.auth('Autenticando com email e senha');
        const { data, error } = await supabase.auth.signInWithPassword({
            email: user.email,
            password
        });

        if (error) {
            logger.error('Erro na autenticação com CPF', { error: error.message });
            throw error;
        }

        logger.auth('Login com CPF realizado com sucesso', { userId: data.user.id });

        // ✅ FIXAR SESSÃO: Setar cookies HTTP-only para autenticação
        if (data.session) {
            // Cookie de access token (usado pelo requireAuth middleware)
            res.cookie('sb-access-token', data.session.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // HTTPS apenas em produção
                sameSite: 'strict', // ✅ CSRF Protection
                maxAge: data.session.expires_in * 1000, // Converter para ms
                path: '/'
            });

            // Cookie de refresh token (para renovar sessão)
            res.cookie('sb-refresh-token', data.session.refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict', // ✅ CSRF Protection
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
                path: '/'
            });

            logger.auth('Cookies de sessão definidos no login com CPF', {
                userId: data.user.id,
                expiresIn: data.session.expires_in
            });
        }

        // 🔐 Gerar e enviar CSRF token
        setCsrfToken(req, res, data.session.expires_in * 1000);

        // ✅ Registrar auditoria de login com CPF bem-sucedido
        logLogin(data.user.id, req.ip, req.headers['user-agent'], { 
            cpf: cleanCPF,
            method: 'cpf_password'
        }).catch(err => logger.error('Falha ao registrar login CPF na auditoria', { err }));

        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            data: {
                user: data.user,
                session: data.session
            }
        });
    } catch (error) {
        logger.error('Erro crítico ao fazer login com CPF', { error: error.message });
        
        // ❌ Registrar auditoria de login falhado
        const { cpf } = req.body;
        const cleanCPFForLog = cpf ? cpf.replace(/\D/g, '') : 'unknown';
        logFailedLogin(cleanCPFForLog, req.ip, req.headers['user-agent'], error.message, { 
            method: 'cpf_password'
        }).catch(err => logger.error('Falha ao registrar login CPF falhado na auditoria', { err }));

        // Mensagem de erro mais clara
        let errorMessage = 'CPF ou senha inválidos';
        
        // Verificar se é erro de senha incorreta
        if (error.message?.toLowerCase().includes('invalid login credentials') || 
            error.message?.toLowerCase().includes('email not confirmed') ||
            error.message?.toLowerCase().includes('invalid') ||
            error.message?.toLowerCase().includes('incorrect')) {
            errorMessage = 'Senha incorreta. Verifique e tente novamente.';
        }

        res.status(401).json({
            success: false,
            error: errorMessage,
            message: errorMessage // Sempre incluir ambos para compatibilidade frontend
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
                    logger.auth('User ID encontrado para logout', { userId });
                }
            } catch (err) {
                logger.error('Não foi possível obter usuário para auditoria de logout', { error: err.message });
            }
        }

        // Fazer logout (não importa se falhar, vamos limpar os cookies de qualquer forma)
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                logger.warn('Erro não crítico no signOut do Supabase', { error: error.message });
            }
        } catch (err) {
            logger.warn('SignOut do Supabase falhou (não crítico)', { error: err.message });
        }

        // Limpar cookies de sessão (SEMPRE fazer isso, mesmo se signOut falhar)
        res.clearCookie('sb-access-token', { path: '/' });
        res.clearCookie('sb-refresh-token', { path: '/' });
        
        // 🔐 Limpar CSRF token
        clearCsrfToken(res);

        logger.auth('Logout realizado e cookies limpos', { userId });

        // ✅ Registrar auditoria de logout
        if (userId) {
            logLogout(userId, req.ip, req.headers['user-agent'])
                .catch(err => logger.error('Falha ao registrar logout na auditoria', { err }));
        }

        res.json({
            success: true,
            message: 'Logout realizado com sucesso'
        });
    } catch (error) {
        logger.error('Erro ao fazer logout', { error: error.message });
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
        logger.error('Erro ao obter sessão', { error: error.message });
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
 * Aceita: email OU cpf
 */
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, cpf, code } = req.body;

        if ((!email && !cpf) || !code) {
            return res.status(400).json({
                success: false,
                error: 'Email ou CPF e código são obrigatórios'
            });
        }

        let userEmail = email;
        let userId = null;

        // Se foi enviado CPF, buscar o email
        if (cpf) {
            const cleanCPF = cpf.replace(/\D/g, '');
            
            // Buscar profile pelo CPF
            const { data: profile, error: profileError } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('cpf', cleanCPF)
                .maybeSingle();

            if (profileError) throw profileError;

            if (!profile) {
                return res.status(404).json({
                    success: false,
                    error: 'CPF não encontrado'
                });
            }

            userId = profile.id;

            // Buscar email do usuário
            const { data: authUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
            
            if (userError || !authUser.user) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }

            userEmail = authUser.user.email;
        }

        // Buscar código OTP válido
        const { data: otpData, error: otpError } = await supabaseAdmin
            .from('otp_codes')
            .select('*')
            .eq('email', userEmail)
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
            secureErrorLog('[Auth] Erro ao confirmar email', confirmError);
        }

        // ✅ Atualizar flag de verificação no profiles
        const { error: profileUpdateError } = await supabaseAdmin
            .from('profiles')
            .update({ 
                email_verified: true,
                email_verified_at: new Date().toISOString()
            })
            .eq('id', otpData.user_id);

        if (profileUpdateError) {
            secureErrorLog('[Auth] Erro ao atualizar email_verified no profile', profileUpdateError);
        }

        secureLog('[Auth] Email verificado com sucesso', { 
            userId: otpData.user_id,
            email: userEmail,
            email_verified: true
        });

        res.json({
            success: true,
            message: 'Email verificado com sucesso!',
            data: {
                verified: true,
                user_id: otpData.user_id,
                email_verified: true
            }
        });
    } catch (error) {
        secureErrorLog('[Security] Erro ao verificar OTP', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao verificar código',
            message: error.message
        });
    }
});

/**
 * GET /auth/verify-email-link/:token
 * Verificar email através do link mágico
 * Alternativa ao código OTP
 */
router.get('/verify-email-link/:token', async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token é obrigatório'
            });
        }

        secureLog('[Auth] Verificando token de email', { token: token.substring(0, 20) + '...' });

        // Buscar token válido
        const { data: otpData, error: otpError } = await supabaseAdmin
            .from('otp_codes')
            .select('*')
            .eq('verification_token', token)
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
                error: 'Link inválido ou expirado'
            });
        }

        // Marcar token como usado
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
            secureErrorLog('[Auth] Erro ao confirmar email via link', confirmError);
        }

        // ✅ Atualizar flag de verificação no profiles
        const { error: profileUpdateError } = await supabaseAdmin
            .from('profiles')
            .update({ 
                email_verified: true,
                email_verified_at: new Date().toISOString()
            })
            .eq('id', otpData.user_id);

        if (profileUpdateError) {
            secureErrorLog('[Auth] Erro ao atualizar email_verified no profile (link)', profileUpdateError);
        }

        secureLog('[Auth] Email verificado via link mágico', { 
            userId: otpData.user_id,
            email: otpData.email,
            email_verified: true
        });

        res.json({
            success: true,
            message: 'Email verificado com sucesso!',
            data: {
                verified: true,
                user_id: otpData.user_id,
                email: otpData.email,
                email_verified: true
            }
        });
    } catch (error) {
        secureErrorLog('[Security] Erro ao verificar link de email', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao verificar link',
            message: error.message
        });
    }
});

/**
 * POST /auth/reset-password
 * Redefinir senha após verificação OTP
 */
router.post('/reset-password', async (req, res) => {
    try {
        const { cpf, code, newPassword } = req.body;

        if (!cpf || !code || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'CPF, código e nova senha são obrigatórios'
            });
        }

        // Validar senha (8-12 caracteres)
        if (newPassword.length < 8 || newPassword.length > 12) {
            return res.status(400).json({
                success: false,
                error: 'Senha deve ter entre 8 e 12 caracteres'
            });
        }

        const cleanCPF = cpf.replace(/\D/g, '');

        // Buscar profile pelo CPF
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('cpf', cleanCPF)
            .maybeSingle();

        if (profileError) throw profileError;

        if (!profile) {
            return res.status(404).json({
                success: false,
                error: 'CPF não encontrado'
            });
        }

        // Buscar usuário
        const { data: authUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
        
        if (userError || !authUser.user) {
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }

        // Verificar OTP válido
        const { data: otpData, error: otpError } = await supabaseAdmin
            .from('otp_codes')
            .select('*')
            .eq('email', authUser.user.email)
            .eq('code', code)
            .is('used_at', null)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (otpError) throw otpError;

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

        // Atualizar senha do usuário
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            profile.id,
            { password: newPassword }
        );

        if (updateError) {
            secureErrorLog('[Security] Erro ao atualizar senha', updateError);
            throw updateError;
        }

        secureLog('[Auth] Senha redefinida com sucesso', { 
            userId: profile.id,
            cpf: cleanCPF
        });

        res.json({
            success: true,
            message: 'Senha redefinida com sucesso!'
        });
    } catch (error) {
        secureErrorLog('[Security] Erro ao redefinir senha', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao redefinir senha',
            message: error.message
        });
    }
});

/**
 * POST /auth/resend-otp
 * Reenviar código OTP
 * Rate limit: 3 tentativas a cada 10 minutos
 * Aceita: email OU cpf
 * 🔒 PROTEÇÃO: Device lock - apenas 1 dispositivo por vez
 */
router.post('/resend-otp', resendOTPLimiter, async (req, res) => {
    try {
        const { email, cpf, deviceToken } = req.body;

        if (!email && !cpf) {
            return res.status(400).json({
                success: false,
                error: 'Email ou CPF é obrigatório'
            });
        }

        let user = null;
        let userEmail = '';

        // Buscar por CPF
        if (cpf) {
            const cleanCPF = cpf.replace(/\D/g, '');
            
            // Buscar profile pelo CPF
            const { data: profile, error: profileError } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('cpf', cleanCPF)
                .maybeSingle();

            if (profileError) throw profileError;

            if (!profile) {
                return res.status(404).json({
                    success: false,
                    error: 'CPF não encontrado'
                });
            }

            // Buscar usuário pelo ID
            const { data: authUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
            
            if (userError || !authUser.user) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }

            user = authUser.user;
            userEmail = user.email;

            // Nota: Permitir reenvio mesmo se email já verificado
            // Serve tanto para confirmação inicial quanto recuperação de senha

            // 🔒 VERIFICAR DEVICE LOCK
            const { data: lockCheck, error: lockError } = await supabaseAdmin
                .rpc('check_otp_device_lock', {
                    p_user_id: user.id,
                    p_device_token: deviceToken || null
                });

            if (lockError) {
                secureErrorLog('[Security] Erro ao verificar device lock', lockError);
                // Continuar mesmo com erro (degradação graciosa)
            } else if (lockCheck && lockCheck.length > 0) {
                const lock = lockCheck[0];
                
                if (lock.is_locked && !lock.can_proceed) {
                    // Outro dispositivo está verificando
                    const minutesRemaining = Math.ceil(
                        (new Date(lock.expires_at) - new Date()) / 60000
                    );
                    
                    return res.status(409).json({
                        success: false,
                        error: 'Verificação em andamento',
                        message: 'Outro dispositivo está verificando este código. Aguarde a expiração ou use o dispositivo original.',
                        hint: 'Se você não iniciou verificação em outro dispositivo, aguarde alguns minutos.',
                        waitMinutes: minutesRemaining,
                        retryAfter: lock.expires_at,
                        code: 'DEVICE_LOCK_ACTIVE'
                    });
                }
            }
        }
        // Buscar por email
        else if (email) {
            const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();

            if (userError) throw userError;

            user = users?.find(u => u.email === email);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }

            userEmail = email;
        }

        // Invalidar códigos antigos não utilizados
        const { data: invalidatedCodes, error: invalidateError } = await supabaseAdmin
            .from('otp_codes')
            .update({ used_at: new Date().toISOString() })
            .eq('email', userEmail)
            .is('used_at', null)
            .select();

        if (invalidateError) {
            logger.error('Erro ao invalidar códigos OTP antigos', { userEmail, invalidateError });
        } else if (invalidatedCodes && invalidatedCodes.length > 0) {
            logger.info('Códigos OTP anteriores invalidados', { 
                userEmail, 
                count: invalidatedCodes.length 
            });
        }

        // 🔒 GERAR DEVICE TOKEN (se não foi fornecido)
        let finalDeviceToken = deviceToken;
        if (!finalDeviceToken) {
            const { data: newToken, error: tokenError } = await supabaseAdmin
                .rpc('generate_device_token');
            
            if (!tokenError && newToken) {
                finalDeviceToken = newToken;
            } else {
                // Fallback: gerar token localmente
                finalDeviceToken = `DEV_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
            }
        }

        // Gerar novo código OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 minutos

        // Salvar OTP no banco com device lock
        const { error: otpError } = await supabaseAdmin
            .from('otp_codes')
            .insert([
                {
                    user_id: user.id,
                    email: userEmail,
                    code: otpCode,
                    device_token: finalDeviceToken,
                    expires_at: expiresAt.toISOString(),
                    created_at: new Date().toISOString()
                }
            ]);

        if (otpError) {
            throw otpError;
        }

        // Log do OTP (mascarado em produção)
        secureLog('[Auth] OTP reenviado com device lock', { 
            email: userEmail,
            otp: otpCode,
            deviceToken: finalDeviceToken,
            expiresAt: expiresAt.toISOString() 
        });

        // TODO: Enviar email com código OTP via Resend
        if (process.env.NODE_ENV !== 'production') {
            logger.auth('Código OTP reenviado (DEV)', {
                email: userEmail,
                otpCode,
                deviceToken: finalDeviceToken,
                expiresAt: expiresAt.toISOString()
            });
        }

        res.json({
            success: true,
            message: 'Código reenviado com sucesso!',
            data: {
                email: userEmail, // Email completo (frontend vai mascarar)
                userId: user.id,
                deviceToken: finalDeviceToken // Retornar para frontend armazenar
            },
            expiresIn: 3 // minutos
        });
    } catch (error) {
        secureErrorLog('[Security] Erro ao reenviar OTP', error);
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
 * Rate limit: 3 tentativas a cada 10 minutos
 */
router.post('/resend-confirmation', resendOTPLimiter, async (req, res) => {
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
            logger.error('Erro ao invalidar códigos OTP antigos do resend', { email, invalidateError });
        } else if (invalidatedCodes && invalidatedCodes.length > 0) {
            logger.info('Códigos OTP anteriores invalidados no resend', { 
                email, 
                count: invalidatedCodes.length 
            });
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
        logger.auth('Código OTP reenviado (resend-confirmation)', {
            email,
            otpCode,
            expiresAt: expiresAt.toISOString()
        });

        res.json({
            success: true,
            message: 'Email de confirmação reenviado com sucesso!',
            expiresIn: 3 // minutos
        });
    } catch (error) {
        logger.error('Erro ao reenviar confirmação de email', { error: error.message });
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
router.post('/verify-email-token', authLimiter, async (req, res) => {
    try {
        const { email, code, token } = req.body;
        const otpCode = code || token; // Aceita ambos os nomes

        logger.auth('Verificando código OTP para confirmação de email', { email });

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

        logger.auth('Resultado da busca de código OTP', { 
            found: !!otpData,
            hasError: !!otpError
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
        logger.auth('Confirmando email do usuário no Supabase Auth', { userId: otpData.user_id });
        
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
            logger.error('Erro ao confirmar email no Supabase Auth', { 
                userId: otpData.user_id, 
                error: confirmError 
            });
            throw new Error(`Erro ao confirmar email: ${confirmError.message}`);
        }
        
        logger.auth('Email confirmado com sucesso', { userId: otpData.user_id });

        // Atualizar perfil
        logger.auth('Atualizando perfil do usuário', { userId: otpData.user_id });
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ 
                email_verified: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', otpData.user_id);

        if (profileError) {
            logger.error('Erro ao atualizar perfil após confirmação de email', { 
                userId: otpData.user_id, 
                profileError 
            });
        }

        // Buscar dados completos do usuário
        logger.auth('Buscando dados completos do usuário', { userId: otpData.user_id });
        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(otpData.user_id);

        if (userError) {
            logger.error('Erro ao buscar dados do usuário', { userId: otpData.user_id, userError });
            throw new Error(`Erro ao buscar usuário: ${userError.message}`);
        }

        // Buscar email e senha do usuário para criar sessão
        logger.auth('Criando sessão para login automático', { userId: otpData.user_id });
        
        // Buscar profile para pegar dados adicionais
        const { data: profileData } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', otpData.user_id)
            .single();

        logger.auth('Email confirmado - retornando dados para login automático', { userId: otpData.user_id, email });

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
        logger.error('Erro ao verificar email', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Erro ao verificar código',
            message: error.message
        });
    }
});

/**
 * POST /auth/forgot-password
 * Solicita recuperação de senha via código OTP
 * Rate limit: 5 solicitações em 15 minutos
 */
router.post('/forgot-password', rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 solicitações por janela
    message: {
        success: false,
        error: 'Muitas solicitações de recuperação. Aguarde alguns minutos.'
    }
}), async (req, res) => {
    try {
        const { cpf } = req.body;

        logger.auth('Endpoint /forgot-password chamado', { hasCpf: !!cpf });

        if (!cpf) {
            return res.status(400).json({
                success: false,
                error: 'CPF é obrigatório'
            });
        }

        // Buscar profile pelo CPF
        const cleanCPF = cpf.replace(/\D/g, '');
        
        const { data: profileData, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, email_verified')
            .eq('cpf', cleanCPF)
            .maybeSingle();

        if (profileError || !profileData) {
            // Por segurança, não revelar se CPF existe ou não
            logger.security('CPF não encontrado, retornando sucesso por segurança', { cpf: maskSensitiveData(cleanCPF) });
            return res.json({
                success: true,
                message: 'Se este CPF estiver cadastrado, você receberá um código para recuperar sua senha.'
            });
        }

        // ✅ VERIFICAR SE EMAIL FOI VERIFICADO
        if (!profileData.email_verified) {
            logger.security('Email não verificado, bloqueando recuperação de senha', { userId: profileData.id });
            return res.status(403).json({
                success: false,
                error: 'Email não verificado',
                code: 'EMAIL_NOT_VERIFIED',
                data: {
                    needsVerification: true,
                    cpf: cleanCPF
                }
            });
        }

        // Buscar email do usuário
        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(profileData.id);

        if (userError || !user) {
            logger.security('Usuário não encontrado no Auth, retornando sucesso por segurança', { userId: profileData.id });
            return res.json({
                success: true,
                message: 'Se este CPF estiver cadastrado, você receberá um código para recuperar sua senha.'
            });
        }

        const userEmail = user.email;

        // Gerar código OTP (10 minutos de validade para reset de senha)
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

        // Salvar OTP no banco
        const { error: otpError } = await supabaseAdmin
            .from('otp_codes')
            .insert([{
                user_id: profileData.id,
                email: userEmail,
                code: otpCode,
                expires_at: expiresAt.toISOString(),
                created_at: new Date().toISOString()
            }]);

        if (otpError) {
            logger.error('Erro ao salvar OTP', { userId: profileData.id, error: otpError.message });
            throw otpError;
        }

        // Tentar enviar email via Supabase (opcional, não bloqueia se falhar)
        try {
            logger.info('Tentando enviar email de recuperação via Supabase', { userId: profileData.id, email: maskSensitiveData(userEmail) });
            const { error: emailError } = await supabaseAdmin.auth.resetPasswordForEmail(userEmail, {
                redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth?mode=password-reset`
            });

            if (emailError) {
                // Verificar se é erro de rate limit do Supabase
                if (emailError.status === 429 || emailError.code === 'over_email_send_rate_limit') {
                    logger.warn('Rate limit do Supabase atingido, mas código OTP já foi gerado e salvo', { userId: profileData.id });
                } else {
                    logger.error('Erro ao enviar email via Supabase', { userId: profileData.id, error: emailError.message });
                }
            } else {
                logger.auth('Email de recuperação enviado via Supabase', { userId: profileData.id });
            }
        } catch (emailError) {
            logger.warn('Falha ao enviar email via Supabase, mas código OTP continua válido', { userId: profileData.id, error: emailError.message });
        }

        // Log do código (ambiente de desenvolvimento)
        logger.auth('Código de recuperação de senha gerado', {
            userId: profileData.id,
            cpf: maskSensitiveData(cleanCPF),
            email: maskSensitiveData(userEmail),
            otpCode: process.env.NODE_ENV === 'development' ? otpCode : '******',
            expiresAt: expiresAt.toISOString()
        });

        // Retornar sucesso com email parcialmente mascarado
        const maskedEmail = userEmail.replace(/(.{3})(.*)(@.*)/, '$1***$3');

        res.json({
            success: true,
            message: 'Código enviado com sucesso!',
            data: {
                email: maskedEmail,
                cpf: cleanCPF
            }
        });
    } catch (error) {
        logger.error('Erro ao solicitar recuperação de senha', { error: error.message });
        
        // Tratamento específico de erros
        if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
            return res.status(429).json({
                success: false,
                error: 'Muitas solicitações de recuperação. Por favor, aguarde alguns minutos antes de tentar novamente.',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: 60 // segundos
            });
        }

        res.status(500).json({
            success: false,
            error: 'Erro ao processar solicitação. Tente novamente em alguns instantes.'
        });
    }
});

/**
 * POST /auth/reset-password
 * Redefine senha usando código OTP
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
        const { cpf, code, newPassword } = req.body;

        logger.auth('Endpoint /reset-password chamado', { hasCpf: !!cpf, hasCode: !!code });

        if (!cpf || !code || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'CPF, código e nova senha são obrigatórios'
            });
        }

        // Validar força da senha
        const { isValidPassword, getPasswordErrors } = await import('../utils/authUtils.js');
        if (!isValidPassword(newPassword)) {
            const passwordErrors = getPasswordErrors(newPassword);
            return res.status(400).json({
                success: false,
                error: `Senha fraca. Sua senha precisa de: ${passwordErrors.join(', ')}`,
                code: 'WEAK_PASSWORD'
            });
        }

        // Limpar CPF
        const cleanCPF = cpf.replace(/\D/g, '');

        // Buscar profile pelo CPF
        const { data: profileData, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('cpf', cleanCPF)
            .maybeSingle();

        if (profileError || !profileData) {
            return res.status(404).json({
                success: false,
                error: 'CPF não encontrado'
            });
        }

        // Buscar email do usuário
        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(profileData.id);

        if (userError || !user) {
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }

        const userEmail = user.email;

        // Buscar código OTP válido
        const { data: otpData, error: otpError } = await supabaseAdmin
            .from('otp_codes')
            .select('*')
            .eq('email', userEmail)
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

        // Atualizar senha no Supabase Auth
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            profileData.id,
            { password: newPassword }
        );

        if (updateError) {
            logger.error('Erro ao atualizar senha', { userId: profileData.id, error: updateError.message });
            throw updateError;
        }

        logger.auth('Senha redefinida com sucesso', { userId: profileData.id, cpf: maskSensitiveData(cleanCPF) });

        res.json({
            success: true,
            message: 'Senha redefinida com sucesso! Você já pode fazer login.',
            data: {
                cpf: cleanCPF
            }
        });
    } catch (error) {
        logger.error('Erro ao redefinir senha', { error: error.message });
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
        logger.error('Erro ao consultar status de rate limit', { error: error.message });
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
        logger.error('Erro ao buscar estatísticas de segurança', { adminEmail: req.user.email, error: error.message });
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

        logger.security('Admin resetando rate limit', { adminEmail: req.user.email, ip, cpf: cpf ? maskSensitiveData(cpf) : undefined, resetAll });

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
        logger.error('Erro ao resetar rate limit', { adminEmail: req.user.email, error: error.message });
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
        logger.error('Erro ao buscar alertas', { adminEmail: req.user.email, error: error.message });
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
        logger.security('Admin processando alertas manualmente', { adminEmail: req.user.email });
        
        const { processAlertQueue } = await import('../utils/alertSystem.js');
        const result = await processAlertQueue();

        res.json({
            success: true,
            data: result,
            message: `${result.sent} alertas enviados, ${result.failed} falharam`,
            admin: req.user.email
        });
    } catch (error) {
        logger.error('Erro ao processar alertas', { adminEmail: req.user.email, error: error.message });
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
        logger.error('Erro ao buscar dashboard', { adminEmail: req.user.email, error: error.message });
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar dashboard',
            message: error.message
        });
    }
});

export default router;

