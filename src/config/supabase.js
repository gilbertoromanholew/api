import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

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
                emailRedirectTo: undefined // Desabilitar email de confirmação por enquanto
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
 * Helper: Fazer logout
 */
export async function signOut(token) {
    try {
        // Criar cliente temporário com o token do usuário
        const userClient = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            }
        );
        
        const { error } = await userClient.auth.signOut();
        
        if (error) {
            throw error;
        }
        
        return true;
    } catch (error) {
        throw error;
    }
}

export default supabase;
