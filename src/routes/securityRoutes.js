/**
 * Rotas para gerenciamento do sistema de bloqueio de IPs
 */

import express from 'express';
import { ipBlockingSystem } from '../utils/ipBlockingSystem.js';

const router = express.Router();

/**
 * GET /api/security/stats
 * Estatísticas gerais do sistema de bloqueio
 */
router.get('/stats', (req, res) => {
    try {
        const stats = ipBlockingSystem.getStats();
        
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/security/blocked
 * Lista de IPs permanentemente bloqueados
 */
router.get('/blocked', (req, res) => {
    try {
        const blocked = ipBlockingSystem.getBlockedIPs();
        
        res.json({
            success: true,
            total: blocked.length,
            data: blocked,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/security/suspended
 * Lista de IPs temporariamente suspensos
 */
router.get('/suspended', (req, res) => {
    try {
        const suspended = ipBlockingSystem.getSuspendedIPs();
        
        res.json({
            success: true,
            total: suspended.length,
            data: suspended,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/security/warnings
 * Lista de IPs com avisos (tentativas registradas)
 */
router.get('/warnings', (req, res) => {
    try {
        const warnings = ipBlockingSystem.getWarningIPs();
        
        res.json({
            success: true,
            total: warnings.length,
            data: warnings,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/security/check/:ip
 * Verificar status de um IP específico
 */
router.get('/check/:ip', (req, res) => {
    try {
        const { ip } = req.params;
        const status = ipBlockingSystem.checkIP(ip);
        
        res.json({
            success: true,
            ip: ip,
            status: status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/security/unblock/:ip
 * Remover bloqueio permanente de um IP (apenas admin)
 */
router.post('/unblock/:ip', (req, res) => {
    try {
        const { ip } = req.params;
        const result = ipBlockingSystem.unblockIP(ip);
        
        if (result) {
            res.json({
                success: true,
                message: `IP ${ip} has been unblocked`,
                ip: ip,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                message: `IP ${ip} is not blocked`,
                ip: ip
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/security/unsuspend/:ip
 * Remover suspensão temporária de um IP (apenas admin)
 */
router.post('/unsuspend/:ip', (req, res) => {
    try {
        const { ip } = req.params;
        const result = ipBlockingSystem.unsuspendIP(ip);
        
        if (result) {
            res.json({
                success: true,
                message: `IP ${ip} suspension has been lifted`,
                ip: ip,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                message: `IP ${ip} is not suspended`,
                ip: ip
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/security/cleanup
 * Limpar suspensões expiradas (manutenção)
 */
router.post('/cleanup', (req, res) => {
    try {
        const cleaned = ipBlockingSystem.cleanupExpired();
        
        res.json({
            success: true,
            message: `Cleaned ${cleaned} expired suspensions`,
            cleaned: cleaned,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/security/all
 * Obter todas as informações de segurança de uma vez
 */
router.get('/all', (req, res) => {
    try {
        const stats = ipBlockingSystem.getStats();
        const blocked = ipBlockingSystem.getBlockedIPs();
        const suspended = ipBlockingSystem.getSuspendedIPs();
        const warnings = ipBlockingSystem.getWarningIPs();
        
        res.json({
            success: true,
            stats: stats,
            blocked: {
                total: blocked.length,
                list: blocked
            },
            suspended: {
                total: suspended.length,
                list: suspended
            },
            warnings: {
                total: warnings.length,
                list: warnings
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/security/suspend-manual/:ip
 * Suspender IP manualmente por 1 hora (admin)
 */
router.post('/suspend-manual/:ip', (req, res) => {
    try {
        const { ip } = req.params;
        
        // Validar formato do IP
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ip)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid IP address format'
            });
        }
        
        // Usar método direto de suspensão manual
        const result = ipBlockingSystem.suspendIPManually(ip);
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        res.json({
            success: true,
            message: result.message,
            ip: ip,
            until: result.until,
            suspensionNumber: result.suspensionNumber,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/security/block-manual/:ip
 * Bloquear IP manualmente de forma permanente (admin)
 */
router.post('/block-manual/:ip', (req, res) => {
    try {
        const { ip } = req.params;
        
        // Validar formato do IP
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ip)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid IP address format'
            });
        }
        
        // Usar método direto de bloqueio manual
        const result = ipBlockingSystem.blockIPManually(ip);
        
        res.json({
            success: true,
            message: result.message,
            ip: ip,
            previousState: result.previousState,
            action: 'permanently_blocked',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/security/unified
 * Lista unificada de IPs com paginação, filtros e busca
 * Query params: page, limit, filter (all|normal|warning|suspended|blocked), search
 */
router.get('/unified', async (req, res) => {
    try {
        const { page = 1, limit = 20, filter = 'all', search = '' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        // Importar accessLogger para obter dados de IPs
        const { accessLogger } = await import('../utils/accessLogger.js');
        
        // Obter todos os IPs do sistema
        const allIPStats = accessLogger.getIPStats();
        const blocked = ipBlockingSystem.getBlockedIPs();
        const suspended = ipBlockingSystem.getSuspendedIPs();
        const warnings = ipBlockingSystem.getWarningIPs();
        
        // Obter IPs autorizados
        const { getAllowedIPsList } = await import('../config/allowedIPs.js');
        const allowedIPsData = getAllowedIPsList();
        const authorizedIPs = allowedIPsData.dynamic || []; // Apenas IPs dinâmicos

        // Criar mapa de status de segurança por IP
        const securityMap = new Map();
        
        // Adicionar bloqueados
        blocked.forEach(item => {
            securityMap.set(item.ip, {
                status: 'blocked',
                securityInfo: {
                    blockedAt: item.blockedAt,
                    blockedReason: item.reason || 'Multiple violations',
                    attempts: item.attempts || 0
                }
            });
        });

        // Adicionar suspensos
        suspended.forEach(item => {
            securityMap.set(item.ip, {
                status: 'suspended',
                securityInfo: {
                    suspendedUntil: item.until,
                    remainingMinutes: item.remainingMinutes,
                    attempts: item.attempts,
                    suspensionCount: item.suspensionCount
                }
            });
        });

        // Adicionar avisos
        warnings.forEach(item => {
            securityMap.set(item.ip, {
                status: 'warning',
                securityInfo: {
                    attempts: item.attempts,
                    remainingAttempts: item.remainingAttempts,
                    suspensions: item.suspensions,
                    lastAttempt: item.lastAttempt
                }
            });
        });
        
        // Adicionar autorizados (apenas os que já apareceram nos logs)
        // IPs autorizados que nunca fizeram requisições não aparecem aqui
        authorizedIPs.forEach(ip => {
            // Só adicionar se o IP já existe no allIPStats (já fez alguma requisição)
            const ipExists = allIPStats.some(stat => stat.ip === ip);
            if (ipExists) {
                // Se não tiver um status de segurança pior, marcar como autorizado
                if (!securityMap.has(ip)) {
                    securityMap.set(ip, {
                        status: 'authorized',
                        securityInfo: {
                            authorizedAt: new Date().toISOString(),
                            source: 'dynamic'
                        }
                    });
                }
            }
        });

        // Combinar dados de IPs com status de segurança
        let unifiedIPs = allIPStats.map(ipData => {
            const security = securityMap.get(ipData.ip);
            
            // Extrair informações de geolocalização do primeiro log disponível
            const logs = accessLogger.getAllLogs().filter(log => log.ip_detected === ipData.ip);
            const firstLog = logs[0] || {};
            
            return {
                ip: ipData.ip,
                status: security ? security.status : 'normal',
                stats: {
                    totalAttempts: ipData.total_attempts,
                    authorized: ipData.authorized,
                    denied: ipData.denied,
                    lastSeen: ipData.last_seen
                },
                security: security ? security.securityInfo : {
                    attempts: 0,
                    remainingAttempts: 5
                },
                geo: {
                    country: firstLog.country || 'Desconhecido',
                    countryCode: firstLog.countryCode || 'XX',
                    city: firstLog.city || '',
                    region: firstLog.region || '',
                    regionName: firstLog.regionName || '',
                    isp: firstLog.isp || 'Desconhecido',
                    org: firstLog.org || '',
                    as: firstLog.as || '',
                    lat: firstLog.lat || 0,
                    lon: firstLog.lon || 0,
                    timezone: firstLog.timezone || '',
                    zip: firstLog.zip || '',
                    hosting: firstLog.hosting || false,
                    proxy: firstLog.proxy || false,
                    mobile: firstLog.mobile || false
                },
                isSuspicious: ipData.denied > 5 || (ipData.denied / ipData.total_attempts) > 0.5
            };
        });

        // ⚠️ CALCULAR SUMMARY ANTES DE BUSCA E FILTRO (para mostrar contagens corretas de todos os IPs)
        // Isso garante que as contagens nos cards de estatísticas sejam sempre corretas,
        // independente do filtro ou busca aplicada
        const allIPsCount = unifiedIPs.length;
        const summaryBeforeFilter = {
            total: allIPsCount,
            normal: unifiedIPs.filter(ip => ip.status === 'normal').length,
            warning: unifiedIPs.filter(ip => ip.status === 'warning').length,
            suspended: unifiedIPs.filter(ip => ip.status === 'suspended').length,
            blocked: unifiedIPs.filter(ip => ip.status === 'blocked').length,
            authorized: unifiedIPs.filter(ip => ip.status === 'authorized').length
        };

        // Aplicar busca (não afeta summary)
        if (search) {
            unifiedIPs = unifiedIPs.filter(ip => ip.ip.includes(search));
        }

        // Aplicar filtro por status (não afeta summary)
        if (filter !== 'all') {
            unifiedIPs = unifiedIPs.filter(ip => ip.status === filter);
        }

        // Ordenar por total de tentativas (decrescente)
        unifiedIPs.sort((a, b) => b.stats.totalAttempts - a.stats.totalAttempts);

        // Calcular paginação (AGORA com IPs filtrados)
        const totalIPs = unifiedIPs.length;
        const totalPages = Math.ceil(totalIPs / limitNum);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginatedIPs = unifiedIPs.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: paginatedIPs,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalIPs,
                totalPages: totalPages
            },
            filter: filter,
            search: search,
            summary: summaryBeforeFilter, // ✅ Usar contagens de TODOS os IPs, não filtrados
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/security/history/:ip
 * Histórico de mudanças de status de um IP
 */
router.get('/history/:ip', (req, res) => {
    try {
        const { ip } = req.params;

        // Validar formato do IP
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ip)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid IP address format'
            });
        }

        const history = ipBlockingSystem.getIPHistory(ip);

        res.json({
            success: true,
            ip: ip,
            totalChanges: history.length,
            history: history,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/security/warn-manual/:ip
 * Colocar IP em aviso manualmente
 */
router.post('/warn-manual/:ip', (req, res) => {
    try {
        const { ip } = req.params;
        const { reason = 'Manual warning by admin' } = req.body;

        // Validar formato do IP
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ip)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid IP address format'
            });
        }

        const result = ipBlockingSystem.warnIPManually(ip, reason);

        res.json({
            success: true,
            message: result.message,
            ip: ip,
            attempts: result.attempts,
            remainingAttempts: result.remainingAttempts,
            reason: reason,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/security/clear-status/:ip
 * Limpar status do IP (voltar ao normal)
 */
router.post('/clear-status/:ip', (req, res) => {
    try {
        const { ip } = req.params;

        // Validar formato do IP
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ip)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid IP address format'
            });
        }

        const result = ipBlockingSystem.clearIPStatus(ip);

        res.json({
            success: true,
            message: result.message,
            ip: ip,
            previousStatus: result.previousStatus,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/security/add-ip
 * Adicionar IP manualmente com status inicial
 */
router.post('/add-ip', (req, res) => {
    try {
        const { ip, status, reason = 'Manual addition by admin', duration = 3600000 } = req.body;

        // Validar IP
        if (!ip) {
            return res.status(400).json({
                success: false,
                error: 'IP address is required'
            });
        }

        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ip)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid IP address format'
            });
        }

        // Validar status
        const validStatuses = ['warning', 'suspended', 'blocked'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: `Status must be one of: ${validStatuses.join(', ')}`
            });
        }

        let result;

        switch (status) {
            case 'warning':
                result = ipBlockingSystem.warnIPManually(ip, reason);
                break;
            case 'suspended':
                result = ipBlockingSystem.suspendIPManually(ip, reason, duration);
                break;
            case 'blocked':
                result = ipBlockingSystem.blockIPManually(ip, reason);
                break;
        }

        res.json({
            success: true,
            message: `IP ${ip} added with status: ${status}`,
            ip: ip,
            status: status,
            reason: reason,
            details: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/security/allowed-ips
 * Listar todos os IPs autorizados
 */
router.get('/allowed-ips', async (req, res) => {
    try {
        const { getAllowedIPsList } = await import('../config/allowedIPs.js');
        const list = getAllowedIPsList();
        
        res.json({
            success: true,
            ...list,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/security/authorize-ip
 * Adicionar IP à lista de autorizados (allowlist)
 * Body: { ip: string, reason?: string }
 */
router.post('/authorize-ip', async (req, res) => {
    try {
        const { ip, reason } = req.body;

        // Validar que o IP foi fornecido
        if (!ip) {
            return res.status(400).json({
                success: false,
                error: 'IP address is required'
            });
        }

        // Validar formato do IP
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ip)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid IP address format'
            });
        }

        // Validar octetos do IP (0-255)
        const octets = ip.split('.');
        const validOctets = octets.every(octet => {
            const num = parseInt(octet, 10);
            return num >= 0 && num <= 255;
        });

        if (!validOctets) {
            return res.status(400).json({
                success: false,
                error: 'Invalid IP address: octets must be between 0-255'
            });
        }

        const { addAllowedIP } = await import('../config/allowedIPs.js');
        const result = addAllowedIP(ip, reason);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/security/unauthorize-ip/:ip
 * Remover IP da lista de autorizados (allowlist)
 */
router.post('/unauthorize-ip/:ip', async (req, res) => {
    try {
        const { ip } = req.params;

        // Validar formato do IP
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ip)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid IP address format'
            });
        }

        const { removeAllowedIP } = await import('../config/allowedIPs.js');
        const result = removeAllowedIP(ip);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
