import dotenv from 'dotenv';

dotenv.config();

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
