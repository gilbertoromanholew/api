import express from 'express';
import { accessLogger } from '../utils/accessLogger.js';

const router = express.Router();

// GET /api/logs - Todos os logs
router.get('/api/logs', (req, res) => {
    const { limit, ip, authorized } = req.query;
    
    const filters = {};
    if (limit) filters.limit = parseInt(limit);
    if (ip) filters.ip = ip;
    if (authorized !== undefined) filters.authorized = authorized === 'true';
    
    const logs = Object.keys(filters).length > 0 
        ? accessLogger.getFilteredLogs(filters)
        : accessLogger.getAllLogs();
    
    res.json({
        success: true,
        total: logs.length,
        logs: logs
    });
});

// GET /api/logs/stats - Estatísticas gerais
router.get('/api/logs/stats', (req, res) => {
    const stats = accessLogger.getGeneralStats();
    res.json({
        success: true,
        stats: stats
    });
});

// GET /api/logs/ips - Estatísticas por IP
router.get('/api/logs/ips', (req, res) => {
    const ipStats = accessLogger.getIPStats();
    res.json({
        success: true,
        total_ips: ipStats.length,
        ips: ipStats
    });
});

// POST /api/logs/clear - Limpar logs (apenas para IPs autorizados)
router.post('/api/logs/clear', (req, res) => {
    accessLogger.clearAllLogs();
    res.json({
        success: true,
        message: 'All logs cleared successfully'
    });
});

export default router;
