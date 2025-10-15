import dotenv from 'dotenv';

dotenv.config();

// Configurações centralizadas da aplicação
export const config = {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    logLevel: process.env.LOG_LEVEL || 'info',
    logFile: process.env.LOG_FILE === 'true',
};

export default config;
