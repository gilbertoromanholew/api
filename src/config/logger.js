import winston from 'winston';
import dotenv from 'dotenv';

dotenv.config();

// Definir níveis de log personalizados
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Definir cores para cada nível
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(colors);

// Formato de exibição dos logs
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} [${info.level}]: ${info.message}`,
    ),
);

// Determinar onde os logs serão salvos
const transports = [
    // Console sempre ativo
    new winston.transports.Console(),
];

// Adicionar arquivo de log se configurado
if (process.env.LOG_FILE === 'true') {
    transports.push(
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
        }),
        new winston.transports.File({
            filename: 'logs/all.log',
        }),
    );
}

// Criar o logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels,
    format,
    transports,
});

export default logger;
