import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Cliente Supabase (usando variáveis de ambiente)
const supabaseUrl = process.env.SUPABASE_URL || 'http://supabase-kong:8000';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
    console.error('⚠️ SUPABASE_ANON_KEY não configurada! Rotas de autenticação não funcionarão.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

        // Buscar usuário com este CPF
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('cpf', cpf)
            .single();

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

        // Buscar usuário com este email
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
            throw error;
        }

        res.json({
            success: true,
            exists: !!data,
            message: data ? 'Email já cadastrado' : 'Email disponível'
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
        const { email, password, full_name, cpf, phone } = req.body;

        // Validações básicas
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email e senha são obrigatórios'
            });
        }

        // Criar usuário no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name,
                    cpf,
                    phone
                }
            }
        });

        if (authError) {
            throw authError;
        }

        // Criar perfil do usuário
        if (authData.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: authData.user.id,
                        email,
                        full_name,
                        cpf,
                        phone,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (profileError) {
                console.error('Erro ao criar perfil:', profileError);
                // Não retornar erro para o usuário, pois o auth já foi criado
            }
        }

        res.json({
            success: true,
            message: 'Usuário registrado com sucesso',
            user: authData.user,
            session: authData.session
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
            user: data.user,
            session: data.session
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
            user
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

export default router;
