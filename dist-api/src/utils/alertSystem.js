/**
 * SISTEMA DE ALERTAS DE SEGURANÇA - FASE 3
 * 
 * Detecta tentativas suspeitas e prepara alertas para os usuários.
 * 
 * FUNCIONALIDADES:
 * - Detecta múltiplas tentativas falhadas no mesmo CPF
 * - Detecta tentativas de múltiplos CPFs do mesmo IP
 * - Detecta padrões de ataque (força bruta, DoS)
 * - Armazena alertas para envio posterior
 * - Marca alertas como enviados/não enviados
 * 
 * TODO: Integração com SMTP ou Supabase para envio real de emails
 */

import logger from '../config/logger.js';

// ============================================================================
// STORAGE DE ALERTAS
// ============================================================================

class AlertStore {
    constructor() {
        this.alerts = []; // Array de alertas pendentes
        this.sentAlerts = new Map(); // Map<CPF, timestamp> - Evitar spam
        this.maxAlerts = 500; // Limite de alertas em memória
        this.cooldownTime = 60 * 60 * 1000; // 1 hora entre alertas do mesmo CPF
    }

    /**
     * Cria um novo alerta
     */
    createAlert(data) {
        const alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            status: 'pending', // 'pending', 'sent', 'failed'
            ...data
        };

        this.alerts.push(alert);

        // Limitar tamanho
        if (this.alerts.length > this.maxAlerts) {
            this.alerts.shift();
        }

        logger.security(`Novo alerta de segurança criado: ${alert.type}`, { 
            cpf: alert.cpf?.substring(0, 3) + '.***.***-**',
            severity: alert.severity
        });
        
        return alert;
    }

    /**
     * Verifica se pode enviar alerta para um CPF (cooldown)
     */
    canSendAlert(cpf) {
        if (!this.sentAlerts.has(cpf)) {
            return true;
        }

        const lastSent = this.sentAlerts.get(cpf);
        const now = Date.now();

        return (now - lastSent) > this.cooldownTime;
    }

    /**
     * Marca alerta como enviado
     */
    markAsSent(alertId, cpf) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.status = 'sent';
            alert.sentAt = new Date().toISOString();
            this.sentAlerts.set(cpf, Date.now());
        }
    }

    /**
     * Marca alerta como falha
     */
    markAsFailed(alertId, error) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.status = 'failed';
            alert.error = error;
        }
    }

    /**
     * Retorna alertas pendentes
     */
    getPendingAlerts() {
        return this.alerts.filter(a => a.status === 'pending');
    }

    /**
     * Retorna todos os alertas (com limite)
     */
    getAllAlerts(limit = 100) {
        return this.alerts.slice(-limit).reverse();
    }

    /**
     * Estatísticas de alertas
     */
    getStats() {
        const now = Date.now();
        const last24h = this.alerts.filter(a => 
            new Date(a.timestamp).getTime() > (now - 24 * 60 * 60 * 1000)
        );

        return {
            total: this.alerts.length,
            pending: this.alerts.filter(a => a.status === 'pending').length,
            sent: this.alerts.filter(a => a.status === 'sent').length,
            failed: this.alerts.filter(a => a.status === 'failed').length,
            last24h: last24h.length,
            byType: {
                bruteForce: this.alerts.filter(a => a.type === 'brute_force').length,
                suspiciousActivity: this.alerts.filter(a => a.type === 'suspicious_activity').length,
                accountCompromise: this.alerts.filter(a => a.type === 'account_compromise').length
            }
        };
    }
}

// Instância global
const alertStore = new AlertStore();

// ============================================================================
// DETECTORES DE AMEAÇAS
// ============================================================================

/**
 * Detecta tentativa de força bruta em um CPF
 */
function detectBruteForce(cpf, attempts, limit) {
    const threshold = limit * 0.7; // 70% do limite = alerta
    
    if (attempts >= threshold && alertStore.canSendAlert(cpf)) {
        return alertStore.createAlert({
            type: 'brute_force',
            severity: 'high',
            cpf,
            title: 'Tentativas de Força Bruta Detectadas',
            message: `Detectamos ${attempts} tentativas de login em sua conta. Se não foi você, recomendamos alterar sua senha imediatamente.`,
            data: {
                attempts,
                limit,
                percentage: Math.round((attempts / limit) * 100)
            },
            actions: [
                { label: 'Alterar Senha', url: '/redefinir-senha' },
                { label: 'Não fui eu', url: '/suporte' }
            ]
        });
    }
    
    return null;
}

/**
 * Detecta atividade suspeita de um IP
 */
function detectSuspiciousIP(ip, cpfCount, ipAttempts) {
    // Múltiplos CPFs do mesmo IP em curto período
    if (cpfCount > 5) {
        return alertStore.createAlert({
            type: 'suspicious_activity',
            severity: 'medium',
            ip,
            title: 'Atividade Suspeita Detectada',
            message: `O IP ${ip} tentou acessar ${cpfCount} contas diferentes em curto período.`,
            data: {
                ip,
                cpfCount,
                ipAttempts
            },
            actions: [
                { label: 'Bloquear IP', action: 'block_ip' }
            ]
        });
    }
    
    return null;
}

/**
 * Detecta possível comprometimento de conta
 */
function detectAccountCompromise(cpf, ipCount, lastIPs) {
    // Mesma conta acessada de múltiplos IPs em curto período
    if (ipCount > 3) {
        return alertStore.createAlert({
            type: 'account_compromise',
            severity: 'critical',
            cpf,
            title: 'Conta Possivelmente Comprometida',
            message: `Sua conta foi acessada de ${ipCount} endereços IP diferentes recentemente.`,
            data: {
                cpf,
                ipCount,
                lastIPs: lastIPs.map(ip => ip.substring(0, 10) + '...')
            },
            actions: [
                { label: 'Bloquear Conta', action: 'lock_account' },
                { label: 'Alterar Senha', url: '/redefinir-senha' }
            ]
        });
    }
    
    return null;
}

// ============================================================================
// SERVIÇO DE ENVIO DE ALERTAS
// ============================================================================

/**
 * Processa fila de alertas pendentes
 * TODO: Implementar envio real via SMTP ou Supabase
 */
async function processAlertQueue() {
    const pending = alertStore.getPendingAlerts();
    
    if (pending.length === 0) {
        return { processed: 0, sent: 0, failed: 0 };
    }

    logger.security(`Processando fila de alertas`, { pendingCount: pending.length });

    let sent = 0;
    let failed = 0;

    for (const alert of pending) {
        try {
            // TODO: Implementar envio real de email
            // await sendEmailViaSMTP(alert);
            // OU
            // await sendEmailViaSupabase(alert);
            
            // Por enquanto, apenas simula envio e marca como enviado
            logger.security('SIMULANDO envio de email de alerta', {
                to: alert.cpf ? 'user@email.com' : 'admin@email.com',
                subject: alert.title
            });

            alertStore.markAsSent(alert.id, alert.cpf);
            sent++;
        } catch (error) {
            logger.error('Erro ao processar alerta de segurança', { alertId: alert.id, error });
            alertStore.markAsFailed(alert.id, error.message);
            failed++;
        }
    }

    logger.security('Processamento de alertas concluído', { sent, failed });

    return { processed: pending.length, sent, failed };
}

/**
 * Inicia worker de processamento automático
 * Processa alertas a cada 5 minutos
 */
function startAlertWorker() {
    const interval = 5 * 60 * 1000; // 5 minutos

    setInterval(async () => {
        const result = await processAlertQueue();
        if (result.processed > 0) {
            logger.security('Alert Worker executado', { 
                processed: result.processed, 
                sent: result.sent, 
                failed: result.failed 
            });
        }
    }, interval);

    logger.debug('Alert Worker iniciado - processamento a cada 5 minutos');
}

// ============================================================================
// FUNÇÕES AUXILIARES PARA INTEGRAÇÃO
// ============================================================================

/**
 * Analisa tentativas e cria alertas se necessário
 * Chamado pelo dualRateLimiter após cada tentativa
 */
function analyzeAndAlert({ ip, cpf, ipAttempts, cpfAttempts, ipLimit, cpfLimit }) {
    const alerts = [];

    // Detectar força bruta no CPF
    if (cpf && cpfAttempts > 0) {
        const bruteForceAlert = detectBruteForce(cpf, cpfAttempts, cpfLimit);
        if (bruteForceAlert) {
            alerts.push(bruteForceAlert);
        }
    }

    // Detectar atividade suspeita no IP
    // (implementar lógica de contagem de CPFs únicos por IP se necessário)

    return alerts;
}

/**
 * TODO: Implementar envio real de email via SMTP
 */
async function sendEmailViaSMTP(alert) {
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransport({ ... });
    // await transporter.sendMail({ ... });
    throw new Error('SMTP não configurado - TODO');
}

/**
 * TODO: Implementar envio real de email via Supabase
 */
async function sendEmailViaSupabase(alert) {
    // const { data, error } = await supabase.auth.admin.generateLink({
    //   type: 'email',
    //   ...
    // });
    throw new Error('Supabase Email não configurado - TODO');
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    alertStore,
    detectBruteForce,
    detectSuspiciousIP,
    detectAccountCompromise,
    analyzeAndAlert,
    processAlertQueue,
    startAlertWorker
};
