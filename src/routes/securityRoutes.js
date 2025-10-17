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

export default router;
