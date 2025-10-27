/**
 * 📊 WINSTON LOGGER CONFIGURATION
 * 
 * Sistema de logging profissional para a API com:
 * - Níveis de log (debug, info, warn, error)
 * - Formatação customizada e legível
 * - Rotação automática de arquivos
 * - Separação desenvolvimento/produção
 * - Metadata estruturada
 * 
 * USO:
 * import logger from '../config/logger.js'
 * 
 * logger.debug('Debug info', { userId: 123 })
 * logger.info('User logged in', { email: 'user@example.com' })
 * logger.warn('Rate limit exceeded', { ip: '192.168.1.1' })
 * logger.error('Database connection failed', { error: err.message })
 */

import winston from 'winston'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Detectar ambiente
const isDevelopment = process.env.NODE_ENV !== 'production'
const isTest = process.env.NODE_ENV === 'test'

// ============================================
// FORMATAÇÃO CUSTOMIZADA
// ============================================

/**
 * Formato para arquivos de log
 * Exemplo: 2025-10-27 15:45:23 [INFO]: User logged in {"userId":123}
 */
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

/**
 * Formato para console (desenvolvimento)
 * Exemplo: 2025-10-27 15:45:23 [INFO]: User logged in
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    // Mensagem base
    let log = `${timestamp} [${level}]: ${message}`
    
    // Adicionar metadata se existir
    const metaKeys = Object.keys(meta)
    if (metaKeys.length > 0) {
      // Remover campos internos do winston
      const cleanMeta = { ...meta }
      delete cleanMeta.timestamp
      delete cleanMeta.level
      delete cleanMeta.message
      
      if (Object.keys(cleanMeta).length > 0) {
        log += ` ${JSON.stringify(cleanMeta)}`
      }
    }
    
    // Adicionar stack trace se for erro
    if (stack) {
      log += `\n${stack}`
    }
    
    return log
  })
)

// ============================================
// TRANSPORTS (onde os logs vão)
// ============================================

const transports = []

// 1. Console (sempre em desenvolvimento, apenas erros em produção)
if (!isTest) {
  transports.push(
    new winston.transports.Console({
      level: isDevelopment ? 'debug' : 'error',
      format: consoleFormat
    })
  )
}

// 2. Arquivo de ERROS (sempre ativo)
transports.push(
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    tailable: true
  })
)

// 3. Arquivo COMBINADO (apenas em desenvolvimento)
if (isDevelopment) {
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      level: 'debug',
      format: fileFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 3,
      tailable: true
    })
  )
}

// 4. Arquivo de INFO (produção)
if (!isDevelopment && !isTest) {
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'app.log'),
      level: 'info',
      format: fileFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    })
  )
}

// ============================================
// CRIAR LOGGER
// ============================================

const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  transports,
  // Prevenir crash em caso de erro no logger
  exitOnError: false
})

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Log de operação com duração
 * @param {string} operation - Nome da operação
 * @param {Function} fn - Função a executar
 * @returns {Promise<any>}
 */
logger.timed = async function(operation, fn) {
  const start = Date.now()
  try {
    const result = await fn()
    const duration = Date.now() - start
    logger.info(`${operation} completed`, { duration: `${duration}ms` })
    return result
  } catch (error) {
    const duration = Date.now() - start
    logger.error(`${operation} failed`, { 
      duration: `${duration}ms`,
      error: error.message,
      stack: error.stack
    })
    throw error
  }
}

/**
 * Log de request HTTP
 * @param {Object} req - Express request
 * @param {number} statusCode - Status code da resposta
 * @param {number} duration - Duração em ms
 */
logger.http = function(req, statusCode, duration) {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'
  logger.log(level, 'HTTP Request', {
    method: req.method,
    url: req.url,
    status: statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent')
  })
}

/**
 * Log de autenticação
 * @param {string} action - Ação (login, logout, register)
 * @param {string} userId - ID do usuário
 * @param {boolean} success - Se foi bem-sucedido
 * @param {Object} meta - Metadata adicional
 */
logger.auth = function(action, userId, success, meta = {}) {
  const level = success ? 'info' : 'warn'
  logger.log(level, `Auth: ${action}`, {
    userId,
    success,
    ...meta
  })
}

/**
 * Log de ferramenta executada
 * @param {string} toolSlug - Slug da ferramenta
 * @param {string} userId - ID do usuário
 * @param {boolean} success - Se foi bem-sucedido
 * @param {Object} meta - Metadata adicional
 */
logger.tool = function(toolSlug, userId, success, meta = {}) {
  const level = success ? 'info' : 'error'
  logger.log(level, `Tool: ${toolSlug}`, {
    userId,
    success,
    ...meta
  })
}

/**
 * Log de segurança (rate limit, IP blocking, etc)
 * @param {string} event - Evento de segurança
 * @param {Object} meta - Metadata
 */
logger.security = function(event, meta = {}) {
  logger.warn(`Security: ${event}`, meta)
}

// ============================================
// EXPORT
// ============================================

export default logger

/**
 * EXEMPLOS DE USO:
 * 
 * // Log simples
 * logger.info('Server started on port 3000')
 * logger.error('Database connection failed', { error: err.message })
 * 
 * // Com metadata estruturada
 * logger.info('User created', { 
 *   userId: '123',
 *   email: 'user@example.com',
 *   role: 'user'
 * })
 * 
 * // Log de operação com duração
 * await logger.timed('Load users', async () => {
 *   return await db.users.findMany()
 * })
 * 
 * // Log HTTP
 * logger.http(req, 200, 150)
 * 
 * // Log de autenticação
 * logger.auth('login', userId, true, { method: 'email' })
 * 
 * // Log de ferramenta
 * logger.tool('calculo-fgts', userId, true, { 
 *   credits: 30,
 *   duration: '1.2s'
 * })
 * 
 * // Log de segurança
 * logger.security('Rate limit exceeded', { 
 *   ip: '192.168.1.1',
 *   endpoint: '/api/auth/login'
 * })
 */
