import express from 'express';
import cors from 'cors';
import { ipFilter } from './src/middlewares/ipFilter.js';
import { errorHandler, notFoundHandler } from './src/middlewares/errorHandler.js';
import { requireAdmin, trackViolations } from './src/middlewares/accessLevel.js';
import { getApiInfo } from './src/routes/index.js';
import { getApiDocs } from './src/routes/docs.js';
import { getLogsDashboard } from './src/routes/logsDashboard.js';
import { autoLoadRoutes } from './src/core/routeLoader.js';
import logsRoutes from './src/routes/logsRoutes.js';
import zerotierRoutes from './src/routes/zerotier.js';
import securityRoutes from './src/routes/securityRoutes.js';
import config from './src/config/index.js';

const app = express();

// Middlewares globais
app.use(cors({
    origin: [
        'https://api.samm.host',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        /^http:\/\/10\.244\.\d+\.\d+:\d+$/,  // ZeroTier range (10.244.0.0/16)
        /^http:\/\/localhost:\d+$/,          // Localhost com qualquer porta
        /^http:\/\/127\.0\.0\.1:\d+$/        // 127.0.0.1 com qualquer porta
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// Middleware de segurança - filtro de IP
app.use(ipFilter);

// Middleware de rastreamento de violações
app.use(trackViolations);

// Rotas de sistema (documentação e logs)
app.get('/', getApiInfo);           // JSON com toda documentação (público)
app.get('/docs', getApiDocs);       // Página HTML bonita (público)
// Rotas de sistema (documentação e logs)
app.get('/', getApiInfo);           // JSON com toda documentação (público)
app.get('/docs', getApiDocs);       // Página HTML bonita (público)
app.get('/logs', requireAdmin, getLogsDashboard); // 🔒 Dashboard APENAS para admin

// Rota para listar funções disponíveis (ADMIN ONLY - expõe estrutura interna)
app.get('/api/functions', requireAdmin, async (req, res) => {
    try {
        const { readdir, readFile } = await import('fs/promises');
        const { join, dirname } = await import('path');
        const { fileURLToPath } = await import('url');
        
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        const functionsPath = join(__dirname, 'src/functions');
        
        const folders = await readdir(functionsPath, { withFileTypes: true });
        const functions = [];
        
        for (const folder of folders) {
            if (folder.isDirectory() && !folder.name.startsWith('_')) {
                const functionInfo = {
                    name: folder.name,
                    path: `/${folder.name}`,
                    description: 'Sem descrição disponível',
                    endpoints: []
                };
                
                // Tentar ler README.md
                try {
                    const readmePath = join(functionsPath, folder.name, 'README.md');
                    const readmeContent = await readFile(readmePath, 'utf-8');
                    const firstLine = readmeContent.split('\n').find(line => line.trim() && !line.startsWith('#'));
                    if (firstLine) {
                        functionInfo.description = firstLine.trim();
                    }
                } catch (err) {
                    // README não existe
                }
                
                // Tentar descobrir rotas
                try {
                    const routesPath = join(functionsPath, folder.name, `${folder.name}Routes.js`);
                    const routesContent = await readFile(routesPath, 'utf-8');
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
        
        res.json({
            success: true,
            total: functions.length,
            functions: functions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            functions: [],
            error: error.message
        });
    }
});

app.use('/api/logs', requireAdmin, logsRoutes);   // 🔒 API de logs APENAS para admin
app.use('/zerotier', requireAdmin, zerotierRoutes); // 🔒 ZeroTier APENAS para admin
app.use('/api/security', requireAdmin, securityRoutes); // 🔒 Segurança APENAS para admin

// Auto-carregar funcionalidades do diretório src/functions/
await autoLoadRoutes(app);

// Handlers de erro (devem ser os ÚLTIMOS middlewares)
app.use(notFoundHandler);  // 404 - Rota não encontrada
app.use(errorHandler);     // Erro genérico

// Iniciar servidor
app.listen(config.server.port, config.server.host, () => {
    console.log(`🚀 Servidor rodando na porta ${config.server.port}`);
    console.log(`📍 Acesse: http://localhost:${config.server.port}`);
    console.log(`📖 Documentação: http://localhost:${config.server.port}/docs`);
    console.log(`📊 Dashboard: http://localhost:${config.server.port}/logs`);
    console.log(`🔐 ZeroTier Status: http://localhost:${config.server.port}/zerotier/status\n`);
});
