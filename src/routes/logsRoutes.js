import express from 'express';
import { accessLogger } from '../utils/accessLogger.js';
import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// Cache de rotas descobertas (evitar regex repetido)
let cachedFunctions = null;
let cacheTimestamp = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// GET /api/functions - Descoberta automática de funções (com cache)
router.get('/api/functions', async (req, res) => {
    try {
        // Verificar cache
        const now = Date.now();
        if (cachedFunctions && cacheTimestamp && (now - cacheTimestamp) < CACHE_TTL) {
            return res.json({
                success: true,
                total: cachedFunctions.length,
                functions: cachedFunctions,
                cached: true
            });
        }

        const functionsPath = join(__dirname, '../functions');
        const folders = await readdir(functionsPath, { withFileTypes: true });
        
        const functions = [];
        
        for (const folder of folders) {
            if (folder.isDirectory() && !folder.name.startsWith('_')) {
                const functionInfo = {
                    name: folder.name,
                    path: `/api/${folder.name}`,
                    description: 'Sem descrição disponível',
                    endpoints: []
                };
                
                // Tentar ler README.md se existir
                try {
                    const readmePath = join(functionsPath, folder.name, 'README.md');
                    const readmeContent = await readFile(readmePath, 'utf-8');
                    
                    // Extrair primeira linha como descrição
                    const firstLine = readmeContent.split('\n').find(line => line.trim() && !line.startsWith('#'));
                    if (firstLine) {
                        functionInfo.description = firstLine.trim();
                    }
                } catch (err) {
                    // README não existe, tudo bem
                }
                
                // Tentar descobrir rotas do arquivo routes
                try {
                    const routesPath = join(functionsPath, folder.name, `${folder.name}Routes.js`);
                    const routesContent = await readFile(routesPath, 'utf-8');
                    
                    // Extrair rotas usando regex (uma vez e cachear resultado)
                    const routeMatches = routesContent.matchAll(/router\.(get|post|put|delete|patch)\(['"`]([^'"`)]+)['"`]/g);
                    
                    for (const match of routeMatches) {
                        functionInfo.endpoints.push({
                            method: match[1].toUpperCase(),
                            path: match[2]
                        });
                    }
                } catch (err) {
                    // Arquivo de rotas não existe
                }
                
                functions.push(functionInfo);
            }
        }
        
        // Atualizar cache
        cachedFunctions = functions;
        cacheTimestamp = now;
        
        res.json({
            success: true,
            total: functions.length,
            functions: functions,
            cached: false
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
