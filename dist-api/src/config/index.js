import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Debug: verificar se o .env existe e tentar carregá-lo
const envPath = path.resolve(__dirname, '../../../.env');
console.log(`🔍 Procurando .env em: ${envPath}`);
console.log(`📁 Diretório atual: ${process.cwd()}`);
console.log(`📂 __dirname: ${__dirname}`);

if (fs.existsSync(envPath)) {
    console.log('✅ Arquivo .env encontrado');
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('📄 Conteúdo do .env (primeiras 200 chars):', envContent.substring(0, 200));
} else {
    console.log('❌ Arquivo .env NÃO encontrado');
    console.log('📋 Arquivos no diretório:', fs.readdirSync(path.dirname(envPath)));
}

const result = dotenv.config();
console.log('🔧 dotenv.config() result:', result);

dotenv.config();

// Debug: mostrar variáveis carregadas
console.log('🔍 Variáveis de ambiente carregadas:');
console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Definida' : '❌ Não definida');
console.log('  SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Definida' : '❌ Não definida');
console.log('  ALLOWED_IPS:', process.env.ALLOWED_IPS ? '✅ Definida' : '❌ Não definida');

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
