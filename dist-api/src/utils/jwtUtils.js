/**
 * 🔐 JWT UTILITIES
 * 
 * Utilitários para trabalhar com JWT tokens do Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_INTERNAL_URL || process.env.SUPABASE_URL || 'http://supabase-kong:8000';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Verificar e decodificar token JWT do Supabase
 * @param {string} token - JWT token
 * @returns {Object|null} - Dados decodificados ou null se inválido
 */
export async function verifyToken(token) {
  try {
    // Validar token com Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    // Buscar role do usuário
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, first_name, full_name')
      .eq('id', user.id)
      .single();

    return {
      userId: user.id,
      email: user.email,
      role: profile?.role || 'user',
      firstName: profile?.first_name,
      fullName: profile?.full_name
    };
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return null;
  }
}

/**
 * Extrair token do cookie ou header
 * @param {Request} req - Request do Express
 * @returns {string|null} - Token ou null
 */
export function extractToken(req) {
  // Tentar cookie primeiro
  const cookieToken = req.cookies?.['sb-access-token'];
  if (cookieToken) return cookieToken;

  // Tentar header Authorization
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

export default {
  verifyToken,
  extractToken
};
