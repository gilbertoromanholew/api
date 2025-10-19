/**
 * Health Check Controller
 * Rota pública para verificar se a API está funcionando
 */

import os from 'os';

/**
 * GET /api/health
 * Retorna status da API e informações básicas do sistema
 */
export const getHealth = async (req, res) => {
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    
    const healthInfo = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(uptime),
        memory: {
            rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
        },
        system: {
            platform: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version,
            hostname: os.hostname()
        }
    };
    
    res.status(200).json(healthInfo);
};
