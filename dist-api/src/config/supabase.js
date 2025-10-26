import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Debug: Mostrar configuração do Supabase
console.log('\n🔧 Configuração Supabase:');
console.log(`   URL: ${process.env.SUPABASE_URL || '❌ NÃO CONFIGURADA'}`);
console.log(`   ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ NÃO CONFIGURADA'}`);
console.log(`   SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ NÃO CONFIGURADA'}\n`);

// Validar variáveis de ambiente
if (!process.env.SUPABASE_URL) {
    throw new Error('❌ SUPABASE_URL não configurada no .env');
}

if (!process.env.SUPABASE_ANON_KEY) {
    throw new Error('❌ SUPABASE_ANON_KEY não configurada no .env');
}

/**
 * Cliente Supabase com ANON KEY
 * Usado para operações que respeitam RLS (Row Level Security)
 */
export const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: false, // Não persistir no servidor
            detectSessionInUrl: false
        }
    }
);

/**
 * Cliente Supabase com SERVICE ROLE KEY
 * Usado para operações administrativas que IGNORAM RLS
 * ⚠️ USAR COM CUIDADO - Tem acesso total ao banco
 */
export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY 
    ? createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
    : null;

// Avisar se SERVICE_ROLE_KEY não está configurada
if (!supabaseAdmin) {
    console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY não configurada - Operações admin desabilitadas');
}

/**
 * Helper: Obter usuário do token JWT
 */
export async function getUserFromToken(token) {
    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error) {
            throw error;
        }
        
        return user;
    } catch (error) {
        console.error('Erro ao validar token:', error.message);
        return null;
    }
}

/**
 * Helper: Criar sessão de usuário
 */
export async function createUserSession(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            throw error;
        }
        
        return {
            user: data.user,
            session: data.session
        };
    } catch (error) {
        throw error;
    }
}

/**
 * Helper: Criar novo usuário
 */
export async function createUser(email, password, metadata = {}) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata,
                // URL para onde o usuário será redirecionado após clicar no link do email
                emailRedirectTo: process.env.FRONTEND_URL || 'http://localhost:5173/auth?confirmed=true'
            }
        });
        
        if (error) {
            throw error;
        }
        
        return data.user;
    } catch (error) {
        throw error;
    }
}

/**
 * 🔐 Helper: Criar cliente autenticado com token JWT do usuário
 * 
 * USO: Operações que o USUÁRIO faz sobre SEUS próprios dados
 * EXEMPLO: Ver carteira, histórico de transações, execuções de ferramentas
 * 
 * ✅ QUANDO USAR:
 * - SELECT de dados próprios (economy_user_wallets, economy_transactions, tools_executions)
 * - UPDATE de perfil próprio (profiles)
 * - SELECT de dados públicos (tools_catalog, gamification_achievements)
 * 
 * ❌ QUANDO NÃO USAR:
 * - Operações que acessam dados de OUTROS usuários
 * - Functions do sistema (debit_credits, increment_tool_usage)
 * - Audit logs (auth_audit_log, operations_audit_log)
 * - Views administrativas (admin_tool_revenue_stats)
 * 
 * @param {string} userToken - Token JWT do usuário autenticado (req.user.token)
 * @returns {SupabaseClient} Cliente Supabase com contexto do usuário
 */
export function createAuthenticatedClient(userToken) {
    if (!userToken) {
        throw new Error('Token do usuário é obrigatório');
    }

    return createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            },
            auth: {
                autoRefreshToken: false,
                persistSession: false,
                detectSessionInUrl: false
            }
        }
    );
}

/**
 * Helper: Fazer logout
 */
export async function signOut(token) {
    try {
        // Usar helper createAuthenticatedClient
        const userClient = createAuthenticatedClient(token);
        
        const { error } = await userClient.auth.signOut();
        
        if (error) {
            throw error;
        }
        
        return true;
    } catch (error) {
        throw error;
    }
}

/**
 * Helper: Reenviar email de confirmação
 */
export async function resendConfirmationEmail(email) {
    try {
        if (!supabaseAdmin) {
            throw new Error('Admin client não configurado');
        }

        // Gerar novo link de confirmação
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: 'signup',
            email: email,
            options: {
                redirectTo: process.env.FRONTEND_URL || 'http://localhost:5173/auth?confirmed=true'
            }
        });
        
        if (error) {
            throw error;
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

export default supabase;
