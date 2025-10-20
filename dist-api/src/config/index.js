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
        allowedIPs: process.env.ALLOWED_IPS?.split(',').map(ip => ip.trim()) || ['127.0.0.1', 'localhost', '::1'],
        corsOrigin: process.env.CORS_ORIGIN || '*',
        rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000, // 1 minuto
        rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100
    },
    
    // Configurações do Supabase (com fallbacks)
    supabase: {
        url: process.env.SUPABASE_URL || 'https://mpanel.samm.host',
        anonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxma2hmeXp5Z2FkenJ3dWdzZWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk4MjQ4NjgsImV4cCI6MjA0NTQwMDg2OH0.L1hcEF8NAmPaTutkq2qQU_3y-vdg2g4vZJM_0vUWJgA',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxma2hmeXp5Z2FkenJ3dWdzZWd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTgyNDg2OCwiZXhwIjoyMDQ1NDAwODY4fQ.y1R1gQOg_8FcG3YcNXIdGMTYa_y2T7KqIxg5BLIyAT4'
    },
    
    // Configurações da sessão
    session: {
        secret: process.env.SESSION_SECRET || 'seu-secret-super-seguro-aqui-min-32-chars',
        maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000
    },
    
    // Configurações do frontend
    frontend: {
        url: process.env.FRONTEND_URL || 'https://samm.host'
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

// Validar configurações críticas
if (config.security.allowedIPs.length === 0) {
    console.warn('⚠️  WARNING: Nenhum IP autorizado configurado no .env!');
    console.warn('⚠️  A API só permitirá acesso de localhost (127.0.0.1, ::1)');
}

// Compatibilidade com código antigo
config.port = config.server.port;
config.host = config.server.host;

export default config;
