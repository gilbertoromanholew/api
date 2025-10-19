import { createProxyMiddleware } from 'http-proxy-middleware';

/**
 * Middleware de Proxy Reverso para Supabase
 * 
 * Encaminha requests de /supabase/* para o Supabase Kong Gateway interno
 * Isso permite manter o Supabase privado enquanto expõe via proxy
 */

// URL interna do Supabase Kong (sem domínio público)
// Em DEV: usa mpanel.samm.host direto (fora do Docker)
// Em PROD: usa supabase-kong:8000 (dentro da rede Docker)
const SUPABASE_INTERNAL_URL = process.env.SUPABASE_INTERNAL_URL || 'http://supabase-kong:8000';

console.log(`📡 Proxy Supabase configurado para: ${SUPABASE_INTERNAL_URL}`);

/**
 * Configuração do proxy reverso
 */
export const supabaseProxy = createProxyMiddleware({
    target: SUPABASE_INTERNAL_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/supabase': '', // Remove /supabase do path antes de enviar pro Supabase
    },
    
    // Headers personalizados
    onProxyReq: (proxyReq, req, res) => {
        // Log para debug (remover em produção se quiser)
        console.log(`🔄 Proxy Supabase: ${req.method} ${req.path} → ${SUPABASE_INTERNAL_URL}${req.path.replace('/supabase', '')}`);
        
        // Adicionar headers customizados se necessário
        proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
        proxyReq.setHeader('X-Forwarded-Proto', req.protocol);
        
        // Preservar headers de autenticação
        if (req.headers['authorization']) {
            proxyReq.setHeader('Authorization', req.headers['authorization']);
        }
        if (req.headers['apikey']) {
            proxyReq.setHeader('apikey', req.headers['apikey']);
        }
    },
    
    // Tratamento de respostas
    onProxyRes: (proxyRes, req, res) => {
        // Adicionar headers CORS se necessário
        proxyRes.headers['Access-Control-Allow-Origin'] = process.env.FRONTEND_URL || '*';
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, apikey';
    },
    
    // Tratamento de erros
    onError: (err, req, res) => {
        console.error('❌ Erro no proxy Supabase:', err.message);
        res.status(502).json({
            success: false,
            error: 'Bad Gateway',
            message: 'Erro ao conectar com Supabase',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    },
    
    // Logging detalhado (apenas em desenvolvimento)
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'warn'
});

/**
 * Middleware para OPTIONS (CORS preflight)
 */
export const supabaseProxyCors = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');
        return res.sendStatus(200);
    }
    next();
};

export default supabaseProxy;
