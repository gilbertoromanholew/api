import express from 'express';
import { accessLogger } from '../utils/accessLogger.js';
import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// GET / - Todos os logs
router.get('/', (req, res) => {
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

// GET /stats - Estatísticas gerais
router.get('/stats', (req, res) => {
    const stats = accessLogger.getGeneralStats();
    res.json({
        success: true,
        stats: stats
    });
});

// GET /ips - Estatísticas por IP
router.get('/ips', (req, res) => {
    const ipStats = accessLogger.getIPStats();
    res.json({
        success: true,
        total_ips: ipStats.length,
        ips: ipStats
    });
});

// POST /clear - Limpar logs (apenas para IPs autorizados)
router.post('/clear', (req, res) => {
    accessLogger.clearAllLogs();
    res.json({
        success: true,
        message: 'All logs cleared successfully'
    });
});

export default router;
