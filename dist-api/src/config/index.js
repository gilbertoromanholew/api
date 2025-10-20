import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Debug básico
console.log('� dotenv carregado, SUPABASE_URL:', process.env.SUPABASE_URL ? '✅' : '❌');

// Configurações centralizadas da aplicação
const config = {
    // Configurações do servidor
    server: {
        port: parseInt(process.env.PORT) || 3000,
        host: process.env.HOST || '0.0.0.0',
        env: process.env.NODE_ENV || 'development'
    },
    
    // Configurações de segurança
    security: {
        allowedIPs: process.env.ALLOWED_IPS?.split(',').map(ip => ip.trim()) || [],
        corsOrigin: process.env.CORS_ORIGIN || '*',
        rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000, // 1 minuto
        rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100
    },
    
    // Configurações do Supabase
    supabase: {
        url: process.env.SUPABASE_URL,
        anonKey: process.env.SUPABASE_ANON_KEY,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    },
    
    // Configurações da sessão
    session: {
        secret: process.env.SESSION_SECRET,
        maxAge: parseInt(process.env.SESSION_MAX_AGE)
    },
    
    // Configurações do frontend
    frontend: {
        url: process.env.FRONTEND_URL
    },
    
    // Configurações de logs
    logs: {
        maxLogs: parseInt(process.env.MAX_LOGS) || 1000,
        retentionDays: parseInt(process.env.LOG_RETENTION_DAYS) || 7
    },
    
    // Configurações de upload
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: process.env.ALLOWED_MIME_TYPES?.split(',') || ['application/pdf']
    }
};

// Validar configurações críticas de segurança
if (!config.session.secret) {
    throw new Error('❌ SESSION_SECRET não configurada! Defina uma chave secreta forte no ambiente.');
}

if (config.security.allowedIPs.length === 0) {
    throw new Error('❌ ALLOWED_IPS não configurada! Defina os IPs autorizados no ambiente.');
}

if (!config.supabase.url || !config.supabase.anonKey) {
    throw new Error('❌ Configuração do Supabase incompleta! Verifique SUPABASE_URL e SUPABASE_ANON_KEY.');
}

// Compatibilidade com código antigo
config.port = config.server.port;
config.host = config.server.host;

export default config;
