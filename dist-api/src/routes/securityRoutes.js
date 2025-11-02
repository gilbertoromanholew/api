/**
 * Rotas para gerenciamento do sistema de bloqueio de IPs
 * AUDITORIA: Adicionado requireAdmin para proteger endpoints sensíveis
 */

import express from 'express';
import { ipBlockingSystem } from '../utils/ipBlockingSystem.js';
import { requireAuth, requireAdmin } from '../middlewares/adminAuth.js';
import logger from '../config/logger.js';

const router = express.Router();

/**
 * GET /security/stats
 * Estatísticas gerais do sistema de bloqueio
 * AUDITORIA: Adicionado requireAdmin
 */
router.get('/stats', requireAuth, requireAdmin, (req, res) => {
    try {
        const stats = ipBlockingSystem.getStats();
        
        logger.info('Admin consultou estatísticas de segurança', {
            adminId: req.user.id
        });
        
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Erro ao buscar stats de segurança', {
            adminId: req.user.id,
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /security/blocked
 * Lista de IPs permanentemente bloqueados
 * AUDITORIA: Adicionado requireAdmin
 */
router.get('/blocked', requireAuth, requireAdmin, (req, res) => {
    try {
        const blocked = ipBlockingSystem.getBlockedIPs();
        
        logger.info('Admin listou IPs bloqueados', {
            adminId: req.user.id,
            count: blocked.length
        });
        
        res.json({
            success: true,
            total: blocked.length,
            data: blocked,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Erro ao listar IPs bloqueados', {
            adminId: req.user.id,
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /security/suspended
 * Lista de IPs temporariamente suspensos
 * AUDITORIA: Adicionado requireAdmin
 */
router.get('/suspended', requireAuth, requireAdmin, (req, res) => {
    try {
        const suspended = ipBlockingSystem.getSuspendedIPs();
        
        logger.info('Admin listou IPs suspensos', {
            adminId: req.user.id,
            count: suspended.length
        });
        
        res.json({
            success: true,
            total: suspended.length,
            data: suspended,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Erro ao listar IPs suspensos', {
            adminId: req.user.id,
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /security/warnings
 * Lista de IPs com avisos (tentativas registradas)
 * AUDITORIA: Adicionado requireAdmin
 */
router.get('/warnings', requireAuth, requireAdmin, (req, res) => {
    try {
        const warnings = ipBlockingSystem.getWarningIPs();
        
        logger.info('Admin listou IPs com avisos', {
            adminId: req.user.id,
            count: warnings.length
        });
        
        res.json({
            success: true,
            total: warnings.length,
            data: warnings,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Erro ao listar IPs com avisos', {
            adminId: req.user.id,
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /security/check/:ip
 * Verifica o status de um IP específico
 * AUDITORIA: Adicionado requireAdmin
 */
router.get('/check/:ip', requireAuth, requireAdmin, (req, res) => {
    try {
        const { ip } = req.params;
        const status = ipBlockingSystem.checkIP(ip);
        
        logger.info('Admin verificou status de IP', {
            adminId: req.user.id,
            checkedIP: ip,
            status
        });
        
        res.json({
            success: true,
            ip: ip,
            status: status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Erro ao verificar IP', {
            adminId: req.user.id,
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /security/unblock/:ip
 * Remover bloqueio permanente de um IP (apenas admin)
 * AUDITORIA: Adicionado requireAdmin e logging
 */
router.post('/unblock/:ip', requireAuth, requireAdmin, (req, res) => {
    try {
        const { ip } = req.params;
        const result = ipBlockingSystem.unblockIP(ip);
        
        if (result) {
            logger.security('Admin desbloqueou IP', {
                adminId: req.user.id,
                unblockedIP: ip
            });
            
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
        logger.error('Erro ao desbloquear IP', {
            adminId: req.user.id,
            ip: req.params.ip,
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /security/unsuspend/:ip
 * Remover suspensão temporária de um IP (apenas admin)
 * AUDITORIA: Adicionado requireAdmin e logging
 */
router.post('/unsuspend/:ip', requireAuth, requireAdmin, (req, res) => {
    try {
        const { ip } = req.params;
        const result = ipBlockingSystem.unsuspendIP(ip);
        
        if (result) {
            logger.security('Admin removeu suspensão de IP', {
                adminId: req.user.id,
                unsuspendedIP: ip
            });
            
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
        logger.error('Erro ao remover suspensão', {
            adminId: req.user.id,
            ip: req.params.ip,
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /security/cleanup
 * Limpar suspensões expiradas (manutenção)
 * AUDITORIA: Adicionado requireAdmin e logging
 */
router.post('/cleanup', requireAuth, requireAdmin, (req, res) => {
    try {
        const cleaned = ipBlockingSystem.cleanupExpired();
        
        logger.info('Admin limpou suspensões expiradas', {
            adminId: req.user.id,
            cleanedCount: cleaned
        });
        
        res.json({
            success: true,
            message: `Cleaned ${cleaned} expired suspensions`,
            cleaned: cleaned,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Erro ao limpar suspensões', {
            adminId: req.user.id,
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /security/all
 * Obter todas as informações de segurança de uma vez
 * AUDITORIA: Adicionado requireAdmin
 */
router.get('/all', requireAuth, requireAdmin, (req, res) => {
    try {
        const stats = ipBlockingSystem.getStats();
        const blocked = ipBlockingSystem.getBlockedIPs();
        const suspended = ipBlockingSystem.getSuspendedIPs();
        const warnings = ipBlockingSystem.getWarningIPs();
        
        logger.info('Admin consultou todas info de segurança', {
            adminId: req.user.id
        });
        
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
        logger.error('Erro ao buscar todas info de segurança', {
            adminId: req.user.id,
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /security/suspend-manual/:ip
 * Suspender IP manualmente por 1 hora (admin)
 * AUDITORIA: Adicionado requireAdmin e logging
 */
router.post('/suspend-manual/:ip', requireAuth, requireAdmin, (req, res) => {
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
        
        logger.security('Admin suspendeu IP manualmente', {
            adminId: req.user.id,
            suspendedIP: ip,
            until: result.until,
            suspensionNumber: result.suspensionNumber
        });
        
        res.json({
            success: true,
            message: result.message,
            ip: ip,
            until: result.until,
            suspensionNumber: result.suspensionNumber,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Erro ao suspender IP manualmente', {
            adminId: req.user.id,
            ip: req.params.ip,
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /security/block-manual/:ip
 * Bloquear IP manualmente de forma permanente (admin)
 * AUDITORIA: Adicionado requireAdmin e logging
 */
router.post('/block-manual/:ip', requireAuth, requireAdmin, (req, res) => {
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
        
        logger.security('Admin bloqueou IP permanentemente', {
            adminId: req.user.id,
            blockedIP: ip,
            previousState: result.previousState
        });
        
        res.json({
            success: true,
            message: result.message,
            ip: ip,
            previousState: result.previousState,
            action: 'permanently_blocked',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Erro ao bloquear IP manualmente', {
            adminId: req.user.id,
            ip: req.params.ip,
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /security/unified
 * Lista unificada de IPs com paginação, filtros e busca
 * Query params: page, limit, filter (all|normal|warning|suspended|blocked), search
 * AUDITORIA: Adicionado requireAdmin
 */
router.get('/unified', requireAuth, requireAdmin, async (req, res) => {
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
        const { getAllowedIPsList, getDynamicIPInfo } = await import('../config/allowedIPs.js');
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
        
        // Adicionar autorizados COM NÍVEL DE ACESSO
        // ✅ INCLUIR TODOS OS IPs AUTORIZADOS, mesmo sem histórico
        authorizedIPs.forEach(ipEntry => {
            const ipAddress = typeof ipEntry === 'string' ? ipEntry : ipEntry.ip;
            const ipInfo = getDynamicIPInfo(ipAddress);
            
            // ✅ AUTORIZAÇÃO SOBRESCREVE QUALQUER STATUS
            securityMap.set(ipAddress, {
                status: 'authorized',
                securityInfo: {
                    authorizedAt: ipInfo?.authorizedAt || new Date().toISOString(),
                    source: 'dynamic',
                    accessLevel: ipInfo?.level || 'guest',
                    reason: ipInfo?.reason || ''
                }
            });
            
            // Se o IP não existe nos stats, adicionar
            const ipExists = allIPStats.some(stat => stat.ip === ipAddress);
            if (!ipExists) {
                allIPStats.push({
                    ip: ipAddress,
                    total_attempts: 0,
                    authorized: 0,
                    denied: 0,
                    last_seen: new Date().toISOString()
                });
            }
        });

        // Combinar dados de IPs com status de segurança
        let unifiedIPs = allIPStats.map(ipData => {
            const security = securityMap.get(ipData.ip);
            
            // Determinar nível de acesso do IP
            let accessLevel = null;
            if (allowedIPsData.permanent.includes(ipData.ip)) {
                accessLevel = 'admin';
            } else if (allowedIPsData.fromEnv.includes(ipData.ip)) {
                accessLevel = 'trusted';
            } else if (security && security.securityInfo.accessLevel) {
                accessLevel = security.securityInfo.accessLevel;
            }
            
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
                security: security ? {
                    ...security.securityInfo,
                    accessLevel: accessLevel
                } : {
                    attempts: 0,
                    remainingAttempts: 5,
                    accessLevel: accessLevel
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
 * GET /security/history/:ip
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
 * POST /security/warn-manual/:ip
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
 * POST /security/clear-status/:ip
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
 * POST /security/add-ip
 * Adicionar IP manualmente com status inicial
 */
router.post('/add-ip', async (req, res) => {
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

        // 🔒 PROTEÇÃO: Trusted não pode bloquear/suspender/avisar IPs permanentes (admin)
        const { getIPAccessLevel } = await import('../middlewares/accessLevel.js');
        const targetLevel = await getIPAccessLevel(ip);
        const requesterIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket.remoteAddress;
        const requesterLevel = await getIPAccessLevel(requesterIP);
        
        if (targetLevel === 'admin' && requesterLevel !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Cannot block/suspend admin IPs. Only admins can manage admin IPs.'
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
 * GET /security/allowed-ips
 * Listar todos os IPs autorizados
 * AUDITORIA: Adicionado requireAdmin e logging
 */
router.get('/allowed-ips', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { getAllowedIPsList } = await import('../config/allowedIPs.js');
        const list = getAllowedIPsList();
        
        logger.info('Admin consultou lista de IPs autorizados', {
            adminId: req.user.id
        });
        
        res.json({
            success: true,
            ...list,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Erro ao buscar IPs autorizados', {
            adminId: req.user.id,
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /security/authorize-ip
 * Adicionar IP à lista de autorizados (allowlist)
 * Body: { ip: string, level?: 'guest' | 'trusted', reason?: string }
 * AUDITORIA: Adicionado requireAdmin e logging
 */
router.post('/authorize-ip', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { ip, level, reason } = req.body;

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

        // Validar nível (padrão 'guest' se não fornecido)
        const accessLevel = level || 'guest';
        if (!['guest', 'trusted'].includes(accessLevel)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid access level. Use "guest" or "trusted"'
            });
        }

        const { addAllowedIP } = await import('../config/allowedIPs.js');
        const result = addAllowedIP(ip, reason, accessLevel);

        if (!result.success) {
            return res.status(400).json(result);
        }

        logger.security('Admin autorizou novo IP', {
            adminId: req.user.id,
            authorizedIP: ip,
            level: accessLevel,
            reason: reason || `IP autorizado como ${accessLevel}`
        });

        res.json(result);
    } catch (error) {
        logger.error('Erro ao autorizar IP', {
            adminId: req.user.id,
            ip: req.body.ip,
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /security/unauthorize-ip/:ip
 * Remover IP da lista de autorizados (allowlist)
 * AUDITORIA: Adicionado requireAdmin e logging
 */
router.post('/unauthorize-ip/:ip', requireAuth, requireAdmin, async (req, res) => {
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

        logger.security('Admin removeu IP autorizado', {
            adminId: req.user.id,
            removedIP: ip
        });

        res.json(result);
    } catch (error) {
        logger.error('Erro ao remover IP autorizado', {
            adminId: req.user.id,
            ip: req.params.ip,
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /security/revoke-ip/:ip
 * ALIAS para /security/unauthorize-ip/:ip (compatibilidade frontend)
 */
router.delete('/revoke-ip/:ip', requireAuth, requireAdmin, async (req, res) => {
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
            return res.status(404).json({
                success: false,
                error: `IP ${ip} não está autorizado`
            });
        }

        logger.security('Admin revogou autorização de IP', {
            adminId: req.user.id,
            revokedIP: ip
        });

        res.json({
            success: true,
            message: `Autorização do IP ${ip} revogada`
        });
    } catch (error) {
        logger.error('Erro ao revogar IP', {
            adminId: req.user.id,
            ip: req.params.ip,
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
