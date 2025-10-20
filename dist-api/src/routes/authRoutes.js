import express from 'express';
import { createClient } from '@supabase/supabase-js';
import {
    otpVerificationLimiter,
    otpResendLimiter,
    cpfCheckLimiter,
    registerLimiter,
    loginLimiter
} from '../middlewares/rateLimiter.js';

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

/**
 * POST /auth/check-cpf
 * Verifica se CPF já está cadastrado
 * Rate limit: 10 requisições a cada 5 minutos
 */
router.post('/check-cpf', cpfCheckLimiter, async (req, res) => {
    try {
        const { cpf } = req.body;

        console.log('📝 /check-cpf chamado com:', { cpf: cpf ? 'presente' : 'ausente', body: req.body });

        if (!cpf) {
            return res.status(400).json({
                success: false,
                error: 'CPF é obrigatório'
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

        // Buscar usuário com este CPF
        console.log('🔍 Buscando usuário no Supabase...');
        const { data, error } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('cpf', cleanCPF)
            .maybeSingle();

        console.log('📊 Resultado da busca:', { found: !!data, error: error?.message });

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
            console.error('❌ Erro do Supabase:', error);
            throw error;
        }

        // Mascarar email para segurança (LGPD)
        let maskedEmail = null;
        if (data?.email) {
            const [localPart, domain] = data.email.split('@');
            const visibleChars = Math.min(3, Math.floor(localPart.length / 2));
            maskedEmail = localPart.substring(0, visibleChars) + '***' + '@' + domain;
        }

        // Mascarar CPF para segurança (LGPD Art. 46)
        const maskedCPF = cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.$3-**');

        console.log('✅ Resposta preparada:', { exists: !!data, maskedEmail, maskedCPF });

        res.json({
            success: true,
            data: {
                exists: !!data,
                email: maskedEmail, // Email mascarado para segurança
                cpf: maskedCPF // CPF mascarado para segurança
            },
            message: data ? 'CPF já cadastrado' : 'CPF disponível'
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

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email é obrigatório'
            });
        }

        // Buscar apenas o usuário específico (segurança e performance)
        // Não carrega todos os usuários, apenas verifica se o email existe
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('email', email)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
            throw error;
        }

        res.json({
            success: true,
            data: {
                available: !profile
            },
            message: profile ? 'Email já cadastrado' : 'Email disponível'
        });
    } catch (error) {
        console.error('[SECURITY] Erro ao verificar email:', error.message);
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
 * Fazer login
 * Rate limit: 5 tentativas a cada 15 minutos
 */
router.post('/login', loginLimiter, async (req, res) => {
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
        res.status(401).json({
            success: false,
            error: 'Credenciais inválidas',
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
        const { error } = await supabase.auth.signOut();

        if (error) {
            throw error;
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
        // Pegar token do header Authorization
        const token = req.headers.authorization?.replace('Bearer ', '');

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

export default router;

