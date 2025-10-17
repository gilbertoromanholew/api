/**
 * Sistema de Bloqueio de IPs
 * Gerencia suspensões temporárias e bloqueios permanentes
 */

class IPBlockingSystem {
    constructor() {
        // Armazena tentativas não autorizadas por IP
        this.unauthorizedAttempts = new Map();
        
        // IPs temporariamente suspensos
        this.suspendedIPs = new Map();
        
        // IPs permanentemente bloqueados
        this.blockedIPs = new Set();
        
        // Configurações
        this.config = {
            maxAttempts: 5,              // Tentativas antes da suspensão
            suspensionDuration: 60 * 60 * 1000, // 1 hora em ms
            maxSuspensions: 3,           // Suspensões antes do bloqueio permanente
            permanentBlockAttempts: 10   // Tentativas para bloqueio direto
        };
    }

    /**
     * Registra uma tentativa de acesso não autorizado
     * @param {string} ip - Endereço IP
     * @param {Object} details - Detalhes da tentativa
     * @returns {Object} Status do IP (allowed, suspended, blocked)
     */
    recordUnauthorizedAttempt(ip, details = {}) {
        // Verificar se já está permanentemente bloqueado
        if (this.blockedIPs.has(ip)) {
            return {
                status: 'blocked',
                reason: 'permanent',
                message: 'IP permanently blocked due to repeated violations'
            };
        }

        // Verificar se está suspenso
        if (this.suspendedIPs.has(ip)) {
            const suspension = this.suspendedIPs.get(ip);
            
            // Verificar se a suspensão ainda está ativa
            if (Date.now() < suspension.until) {
                const remainingTime = Math.ceil((suspension.until - Date.now()) / 1000 / 60); // minutos
                return {
                    status: 'suspended',
                    reason: 'temporary',
                    until: new Date(suspension.until).toISOString(),
                    remainingMinutes: remainingTime,
                    suspensionCount: suspension.count,
                    message: `IP suspended. Try again in ${remainingTime} minutes`
                };
            } else {
                // Suspensão expirou, remover
                this.suspendedIPs.delete(ip);
            }
        }

        // Registrar tentativa
        if (!this.unauthorizedAttempts.has(ip)) {
            this.unauthorizedAttempts.set(ip, {
                count: 0,
                attempts: [],
                suspensions: 0
            });
        }

        const record = this.unauthorizedAttempts.get(ip);
        record.count++;
        record.attempts.push({
            timestamp: Date.now(),
            ...details
        });

        // Verificar se deve bloquear permanentemente (muitas tentativas)
        if (record.count >= this.config.permanentBlockAttempts) {
            this.blockedIPs.add(ip);
            return {
                status: 'blocked',
                reason: 'permanent',
                attempts: record.count,
                message: `IP permanently blocked after ${record.count} unauthorized attempts`
            };
        }

        // Verificar se deve suspender temporariamente
        if (record.count >= this.config.maxAttempts) {
            record.suspensions++;
            
            // Verificar se deve bloquear permanentemente (muitas suspensões)
            if (record.suspensions >= this.config.maxSuspensions) {
                this.blockedIPs.add(ip);
                return {
                    status: 'blocked',
                    reason: 'permanent',
                    suspensions: record.suspensions,
                    message: `IP permanently blocked after ${record.suspensions} suspensions`
                };
            }

            // Suspender temporariamente
            const until = Date.now() + this.config.suspensionDuration;
            this.suspendedIPs.set(ip, {
                since: Date.now(),
                until: until,
                count: record.suspensions,
                attempts: record.count
            });

            // Reset contador de tentativas
            record.count = 0;
            record.attempts = [];

            const remainingTime = Math.ceil(this.config.suspensionDuration / 1000 / 60);
            return {
                status: 'suspended',
                reason: 'temporary',
                until: new Date(until).toISOString(),
                remainingMinutes: remainingTime,
                suspensionNumber: record.suspensions,
                message: `IP suspended for ${remainingTime} minutes after ${this.config.maxAttempts} attempts`
            };
        }

        // Ainda permitido, mas com aviso
        const remainingAttempts = this.config.maxAttempts - record.count;
        return {
            status: 'warning',
            attempts: record.count,
            remainingAttempts: remainingAttempts,
            message: `${remainingAttempts} attempts remaining before temporary suspension`
        };
    }

    /**
     * Verifica se um IP está bloqueado ou suspenso
     * @param {string} ip - Endereço IP
     * @returns {Object} Status do IP
     */
    checkIP(ip) {
        // Bloqueio permanente
        if (this.blockedIPs.has(ip)) {
            return {
                blocked: true,
                type: 'permanent',
                message: 'IP permanently blocked'
            };
        }

        // Suspensão temporária
        if (this.suspendedIPs.has(ip)) {
            const suspension = this.suspendedIPs.get(ip);
            
            if (Date.now() < suspension.until) {
                const remainingTime = Math.ceil((suspension.until - Date.now()) / 1000 / 60);
                return {
                    blocked: true,
                    type: 'temporary',
                    until: new Date(suspension.until).toISOString(),
                    remainingMinutes: remainingTime,
                    message: `IP suspended for ${remainingTime} more minutes`
                };
            } else {
                // Suspensão expirou
                this.suspendedIPs.delete(ip);
            }
        }

        return {
            blocked: false,
            message: 'IP is allowed'
        };
    }

    /**
     * Remove bloqueio permanente de um IP (apenas admin)
     * @param {string} ip - Endereço IP
     * @returns {boolean} Sucesso
     */
    unblockIP(ip) {
        if (this.blockedIPs.has(ip)) {
            this.blockedIPs.delete(ip);
            this.unauthorizedAttempts.delete(ip);
            return true;
        }
        return false;
    }

    /**
     * Remove suspensão temporária de um IP (apenas admin)
     * @param {string} ip - Endereço IP
     * @returns {boolean} Sucesso
     */
    unsuspendIP(ip) {
        if (this.suspendedIPs.has(ip)) {
            this.suspendedIPs.delete(ip);
            return true;
        }
        return false;
    }

    /**
     * Obtém estatísticas do sistema de bloqueio
     * @returns {Object} Estatísticas
     */
    getStats() {
        return {
            totalBlocked: this.blockedIPs.size,
            totalSuspended: this.suspendedIPs.size,
            totalTracked: this.unauthorizedAttempts.size,
            config: this.config
        };
    }

    /**
     * Obtém lista de IPs bloqueados
     * @returns {Array} Lista de IPs bloqueados com detalhes
     */
    getBlockedIPs() {
        const blocked = [];
        
        for (const ip of this.blockedIPs) {
            const record = this.unauthorizedAttempts.get(ip);
            blocked.push({
                ip: ip,
                type: 'permanent',
                attempts: record?.count || 0,
                suspensions: record?.suspensions || 0,
                lastAttempt: record?.attempts[record.attempts.length - 1]?.timestamp || null
            });
        }

        return blocked.sort((a, b) => b.lastAttempt - a.lastAttempt);
    }

    /**
     * Obtém lista de IPs suspensos
     * @returns {Array} Lista de IPs suspensos com detalhes
     */
    getSuspendedIPs() {
        const suspended = [];
        const now = Date.now();
        
        for (const [ip, suspension] of this.suspendedIPs.entries()) {
            // Verificar se ainda está suspenso
            if (now < suspension.until) {
                suspended.push({
                    ip: ip,
                    type: 'temporary',
                    since: new Date(suspension.since).toISOString(),
                    until: new Date(suspension.until).toISOString(),
                    remainingMinutes: Math.ceil((suspension.until - now) / 1000 / 60),
                    suspensionCount: suspension.count,
                    attempts: suspension.attempts
                });
            } else {
                // Remover suspensão expirada
                this.suspendedIPs.delete(ip);
            }
        }

        return suspended.sort((a, b) => a.remainingMinutes - b.remainingMinutes);
    }

    /**
     * Obtém lista de IPs com avisos
     * @returns {Array} Lista de IPs com tentativas registradas
     */
    getWarningIPs() {
        const warnings = [];
        
        for (const [ip, record] of this.unauthorizedAttempts.entries()) {
            // Apenas IPs que não estão bloqueados ou suspensos
            if (!this.blockedIPs.has(ip) && !this.suspendedIPs.has(ip) && record.count > 0) {
                warnings.push({
                    ip: ip,
                    attempts: record.count,
                    remainingAttempts: this.config.maxAttempts - record.count,
                    suspensions: record.suspensions,
                    lastAttempt: record.attempts[record.attempts.length - 1]?.timestamp || null
                });
            }
        }

        return warnings.sort((a, b) => b.attempts - a.attempts);
    }

    /**
     * Limpa suspensões expiradas (manutenção)
     */
    cleanupExpired() {
        const now = Date.now();
        let cleaned = 0;

        for (const [ip, suspension] of this.suspendedIPs.entries()) {
            if (now >= suspension.until) {
                this.suspendedIPs.delete(ip);
                cleaned++;
            }
        }

        return cleaned;
    }
    
    /**
     * Bloqueia um IP manualmente (ação administrativa direta)
     * @param {string} ip - Endereço IP
     * @returns {Object} Resultado da operação
     */
    blockIPManually(ip) {
        // Remover suspensão se existir
        if (this.suspendedIPs.has(ip)) {
            this.suspendedIPs.delete(ip);
        }
        
        // Adicionar ao conjunto de bloqueados
        this.blockedIPs.add(ip);
        
        // Atualizar registro
        if (!this.unauthorizedAttempts.has(ip)) {
            this.unauthorizedAttempts.set(ip, {
                count: 10, // Marcar como bloqueado manualmente
                attempts: [],
                suspensions: 0
            });
        } else {
            const record = this.unauthorizedAttempts.get(ip);
            record.count = 10; // Garantir que está marcado
        }
        
        return {
            success: true,
            message: `IP ${ip} has been permanently blocked (manual action)`,
            previousState: this.suspendedIPs.has(ip) ? 'suspended' : 'active'
        };
    }
    
    /**
     * Suspende um IP manualmente (ação administrativa direta)
     * @param {string} ip - Endereço IP
     * @param {number} duration - Duração em milissegundos (padrão: 1 hora)
     * @returns {Object} Resultado da operação
     */
    suspendIPManually(ip, duration = null) {
        // Não suspender se já está bloqueado permanentemente
        if (this.blockedIPs.has(ip)) {
            return {
                success: false,
                message: `IP ${ip} is permanently blocked and cannot be suspended`,
                reason: 'already_blocked'
            };
        }
        
        const suspensionDuration = duration || this.config.suspensionDuration;
        const until = Date.now() + suspensionDuration;
        
        // Criar ou atualizar suspensão
        const previousSuspension = this.suspendedIPs.get(ip);
        const suspensionCount = previousSuspension ? previousSuspension.count + 1 : 1;
        
        this.suspendedIPs.set(ip, {
            since: Date.now(),
            until: until,
            count: suspensionCount,
            attempts: 5 // Marcar como suspenso manualmente
        });
        
        // Atualizar registro
        if (!this.unauthorizedAttempts.has(ip)) {
            this.unauthorizedAttempts.set(ip, {
                count: 0,
                attempts: [],
                suspensions: suspensionCount
            });
        } else {
            const record = this.unauthorizedAttempts.get(ip);
            record.suspensions = suspensionCount;
        }
        
        return {
            success: true,
            message: `IP ${ip} has been suspended for ${Math.ceil(suspensionDuration / 1000 / 60)} minutes (manual action)`,
            until: new Date(until).toISOString(),
            suspensionNumber: suspensionCount
        };
    }
}

// Instância global do sistema de bloqueio
export const ipBlockingSystem = new IPBlockingSystem();
