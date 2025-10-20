import rateLimit from 'express-rate-limit';
import { analyzeAndAlert } from '../utils/alertSystem.js';

/**
 * DUAL RATE LIMITER - FASE 2/3
 * 
 * Sistema de rate limiting que rastreia tentativas por IP E por CPF simultaneamente.
 * 
 * ESTRATÉGIA:
 * - Limiter por IP: Mais permissivo (permite múltiplos CPFs do mesmo IP)
 * - Limiter por CPF: Mais restritivo (protege contas individuais)
 * - Bloqueio progressivo: Informa qual dos dois limites foi excedido
 * - Whitelist: IPs confiáveis pulam o rate limiting
 * - NOVO (Fase 3): Sistema de alertas integrado
 * 
 * ARQUITETURA:
 * - MemoryStore customizado com TTL automático
 * - Rastreamento separado de IP e CPF
 * - Logging detalhado de todas as tentativas
 * - Análise de ameaças e geração de alertas
 */

// ============================================================================
// CUSTOM MEMORY STORE - Rastreia IP e CPF separadamente
// ============================================================================

class DualMemoryStore {
    constructor() {
        this.ipHits = new Map(); // Map<IP, { count, resetTime }>
        this.cpfHits = new Map(); // Map<CPF, { count, resetTime, ip }>
        this.logs = []; // Array de logs para análise
        this.maxLogs = 1000; // Limite de logs em memória

        // Limpeza automática a cada 5 minutos
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    /**
     * Registra uma tentativa por IP
     */
    incrementIP(ip, windowMs) {
        const now = Date.now();
        const resetTime = now + windowMs;

        if (!this.ipHits.has(ip)) {
            this.ipHits.set(ip, { count: 1, resetTime });
        } else {
            const data = this.ipHits.get(ip);
            if (now > data.resetTime) {
                // Janela expirou, resetar
                this.ipHits.set(ip, { count: 1, resetTime });
            } else {
                // Incrementar contador
                data.count++;
            }
        }

        return this.ipHits.get(ip).count;
    }

    /**
     * Registra uma tentativa por CPF
     */
    incrementCPF(cpf, ip, windowMs) {
        const now = Date.now();
        const resetTime = now + windowMs;

        if (!this.cpfHits.has(cpf)) {
            this.cpfHits.set(cpf, { count: 1, resetTime, ip });
        } else {
            const data = this.cpfHits.get(cpf);
            if (now > data.resetTime) {
                // Janela expirou, resetar
                this.cpfHits.set(cpf, { count: 1, resetTime, ip });
            } else {
                // Incrementar contador
                data.count++;
                data.ip = ip; // Atualizar último IP usado
            }
        }

        return this.cpfHits.get(cpf).count;
    }

    /**
     * Consulta tentativas por IP
     */
    getIPCount(ip) {
        if (!this.ipHits.has(ip)) return 0;
        
        const data = this.ipHits.get(ip);
        if (Date.now() > data.resetTime) {
            this.ipHits.delete(ip);
            return 0;
        }
        
        return data.count;
    }

    /**
     * Consulta tentativas por CPF
     */
    getCPFCount(cpf) {
        if (!this.cpfHits.has(cpf)) return 0;
        
        const data = this.cpfHits.get(cpf);
        if (Date.now() > data.resetTime) {
            this.cpfHits.delete(cpf);
            return 0;
        }
        
        return data.count;
    }

    /**
     * Retorna tempo restante de bloqueio (em segundos)
     */
    getTimeRemaining(ip, cpf) {
        const now = Date.now();
        let ipTime = 0;
        let cpfTime = 0;

        if (this.ipHits.has(ip)) {
            const data = this.ipHits.get(ip);
            if (now < data.resetTime) {
                ipTime = Math.ceil((data.resetTime - now) / 1000);
            }
        }

        if (cpf && this.cpfHits.has(cpf)) {
            const data = this.cpfHits.get(cpf);
            if (now < data.resetTime) {
                cpfTime = Math.ceil((data.resetTime - now) / 1000);
            }
        }

        return {
            ip: ipTime,
            cpf: cpfTime,
            max: Math.max(ipTime, cpfTime)
        };
    }

    /**
     * Adiciona log de tentativa
     */
    addLog(entry) {
        this.logs.push({
            ...entry,
            timestamp: new Date().toISOString()
        });

        // Limitar tamanho do array
        if (this.logs.length > this.maxLogs) {
            this.logs.shift(); // Remove o mais antigo
        }
    }

    /**
     * Retorna logs recentes (últimas N tentativas)
     */
    getRecentLogs(limit = 100) {
        return this.logs.slice(-limit);
    }

    /**
     * Retorna estatísticas gerais
     */
    getStats() {
        return {
            totalIPsTracked: this.ipHits.size,
            totalCPFsTracked: this.cpfHits.size,
            totalLogsStored: this.logs.length,
            activeIPs: Array.from(this.ipHits.entries())
                .filter(([_, data]) => Date.now() < data.resetTime)
                .map(([ip, data]) => ({ ip, count: data.count })),
            activeCPFs: Array.from(this.cpfHits.entries())
                .filter(([_, data]) => Date.now() < data.resetTime)
                .map(([cpf, data]) => ({ cpf: cpf.substring(0, 3) + '.***.***-**', count: data.count, ip: data.ip }))
        };
    }

    /**
     * Limpeza de registros expirados
     */
    cleanup() {
        const now = Date.now();
        let cleaned = 0;

        // Limpar IPs expirados
        for (const [ip, data] of this.ipHits.entries()) {
            if (now > data.resetTime) {
                this.ipHits.delete(ip);
                cleaned++;
            }
        }

        // Limpar CPFs expirados
        for (const [cpf, data] of this.cpfHits.entries()) {
            if (now > data.resetTime) {
                this.cpfHits.delete(cpf);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`[Dual Rate Limiter] Limpeza automática: ${cleaned} registros expirados removidos`);
        }
    }

    /**
     * Reseta contadores de um IP específico
     */
    resetIP(ip) {
        this.ipHits.delete(ip);
        console.log(`[Dual Rate Limiter] Contador de IP resetado: ${ip}`);
    }

    /**
     * Reseta contadores de um CPF específico
     */
    resetCPF(cpf) {
        this.cpfHits.delete(cpf);
        console.log(`[Dual Rate Limiter] Contador de CPF resetado: ${cpf.substring(0, 3)}.***.***-**`);
    }

    /**
     * Reseta todos os contadores (use com cuidado!)
     */
    resetAll() {
        this.ipHits.clear();
        this.cpfHits.clear();
        console.log('[Dual Rate Limiter] Todos os contadores foram resetados');
    }
}

// Instância global do store
const dualStore = new DualMemoryStore();

// ============================================================================
// WHITELIST DE IPs CONFIÁVEIS
// ============================================================================

const trustedIPs = new Set();

// Carregar IPs confiáveis da variável de ambiente
if (process.env.TRUSTED_IPS) {
    const ips = process.env.TRUSTED_IPS.split(',').map(ip => ip.trim());
    ips.forEach(ip => trustedIPs.add(ip));
    console.log(`[Dual Rate Limiter] ${trustedIPs.size} IPs confiáveis carregados`);
}

/**
 * Verifica se um IP está na whitelist
 */
function isTrustedIP(ip) {
    return trustedIPs.has(ip);
}

/**
 * Adiciona IP à whitelist (runtime)
 */
function addTrustedIP(ip) {
    trustedIPs.add(ip);
    console.log(`[Dual Rate Limiter] IP adicionado à whitelist: ${ip}`);
}

/**
 * Remove IP da whitelist (runtime)
 */
function removeTrustedIP(ip) {
    trustedIPs.delete(ip);
    console.log(`[Dual Rate Limiter] IP removido da whitelist: ${ip}`);
}

// ============================================================================
// MIDDLEWARE DE RATE LIMITING DUAL
// ============================================================================

/**
 * Cria um middleware de rate limiting dual (IP + CPF)
 * 
 * @param {Object} options - Configurações
 * @param {number} options.ipMax - Máximo de tentativas por IP
 * @param {number} options.cpfMax - Máximo de tentativas por CPF
 * @param {number} options.ipWindowMs - Janela de tempo para IP (ms)
 * @param {number} options.cpfWindowMs - Janela de tempo para CPF (ms)
 * @param {string} options.message - Mensagem de erro genérica
 * @param {Function} options.extractCPF - Função para extrair CPF do request
 */
function createDualRateLimiter(options = {}) {
    const {
        ipMax = 20,
        cpfMax = 10,
        ipWindowMs = 10 * 60 * 1000, // 10 minutos
        cpfWindowMs = 15 * 60 * 1000, // 15 minutos
        message = 'Por segurança, bloqueamos temporariamente o acesso. Tente novamente em alguns minutos.',
        extractCPF = (req) => req.body?.cpf || null
    } = options;

    return async (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const cpf = extractCPF(req);

        // Whitelist bypass
        if (isTrustedIP(ip)) {
            console.log(`[Dual Rate Limiter] IP confiável bypass: ${ip}`);
            return next();
        }

        // Rastrear tentativas
        const ipCount = dualStore.incrementIP(ip, ipWindowMs);
        const cpfCount = cpf ? dualStore.incrementCPF(cpf, ip, cpfWindowMs) : 0;

        // Verificar limites
        const ipBlocked = ipCount > ipMax;
        const cpfBlocked = cpf && cpfCount > cpfMax;

        // Log da tentativa
        dualStore.addLog({
            ip,
            cpf: cpf ? cpf.substring(0, 3) + '.***.***-**' : null,
            ipCount,
            cpfCount,
            ipBlocked,
            cpfBlocked,
            path: req.path,
            method: req.method
        });

        // Decisão de bloqueio
        if (ipBlocked || cpfBlocked) {
            const timeRemaining = dualStore.getTimeRemaining(ip, cpf);
            const blockReason = ipBlocked && cpfBlocked ? 'both' : ipBlocked ? 'ip' : 'cpf';

            console.warn(`[Dual Rate Limiter] BLOQUEIO - IP: ${ip} | CPF: ${cpf ? cpf.substring(0, 3) + '.***.***-**' : 'N/A'} | Motivo: ${blockReason} | Tempo restante: ${timeRemaining.max}s`);

            return res.status(429).json({
                success: false,
                error: message,
                blockedBy: blockReason, // 'ip', 'cpf', ou 'both'
                retryAfter: timeRemaining.max,
                details: {
                    ipAttempts: ipCount,
                    cpfAttempts: cpfCount,
                    ipLimit: ipMax,
                    cpfLimit: cpfMax
                }
            });
        }

        // Analisar tentativas e gerar alertas se necessário (Fase 3)
        try {
            analyzeAndAlert({
                ip,
                cpf,
                ipAttempts: ipCount,
                cpfAttempts: cpfCount,
                ipLimit: ipMax,
                cpfLimit: cpfMax
            });
        } catch (err) {
            console.error('[Dual Rate Limiter] Erro ao analisar alertas:', err);
            // Não bloquear requisição por erro no sistema de alertas
        }

        // Adicionar informações ao request para uso posterior
        req.rateLimitInfo = {
            ip,
            cpf,
            ipCount,
            cpfCount,
            ipLimit: ipMax,
            cpfLimit: cpfMax
        };

        next();
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    dualStore,
    createDualRateLimiter,
    isTrustedIP,
    addTrustedIP,
    removeTrustedIP
};
