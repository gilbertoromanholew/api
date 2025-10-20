import express from 'express';
import { createClient } from '@supabase/supabase-js';

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
 */
router.post('/check-cpf', async (req, res) => {
    try {
        const { cpf } = req.body;

        if (!cpf) {
            return res.status(400).json({
                success: false,
                error: 'CPF é obrigatório'
            });
        }

        // Limpar formatação do CPF
        const cleanCPF = cpf.replace(/\D/g, '');

        // Buscar usuário com este CPF
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('cpf', cleanCPF)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
            throw error;
        }

        res.json({
            success: true,
            exists: !!data,
            message: data ? 'CPF já cadastrado' : 'CPF disponível'
        });
    } catch (error) {
        console.error('Erro ao verificar CPF:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao verificar CPF',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
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

        // Verificar se email existe no auth.users através do SDK Admin
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

        if (error) {
            throw error;
        }

        const emailExists = users?.some(user => user.email === email);

        res.json({
            success: true,
            exists: emailExists,
            message: emailExists ? 'Email já cadastrado' : 'Email disponível'
        });
    } catch (error) {
        console.error('Erro ao verificar email:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao verificar email',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /auth/register
 * Registrar novo usuário
 */
router.post('/register', async (req, res) => {
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

        // Gerar referral code
        const { data: refCodeData, error: refCodeError } = await supabaseAdmin
            .rpc('generate_referral_code');

        if (refCodeError) {
            console.error('Erro ao gerar código de referência:', refCodeError);
        }

        const referralCode = refCodeData || 'DEFAULT';

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
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

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
            }
        });
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao registrar usuário',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
});

/**
 * POST /auth/login
 * Fazer login
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
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
router.post('/resend-otp', async (req, res) => {
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

        // Invalidar códigos antigos
        await supabaseAdmin
            .from('otp_codes')
            .update({ used_at: new Date().toISOString() })
            .eq('email', email)
            .is('used_at', null);

        // Gerar novo código OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

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
            message: 'Código reenviado com sucesso!'
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

export default router;

