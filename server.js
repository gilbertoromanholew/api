import express from 'express';
import cors from 'cors';
import { ipFilter } from './src/middlewares/ipFilter.js';
import { errorHandler, notFoundHandler } from './src/middlewares/errorHandler.js';
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
app.use(cors());
app.use(express.json());

// Middleware de segurança - filtro de IP
app.use(ipFilter);

// Rotas de sistema (documentação e logs)
app.get('/', getApiInfo);           // JSON com toda documentação
app.get('/docs', getApiDocs);       // Página HTML bonita
app.get('/logs', getLogsDashboard); // Dashboard de logs em tempo real
app.use(logsRoutes);                // API de logs
app.use('/zerotier', zerotierRoutes); // API ZeroTier (status e info)
app.use('/api/security', securityRoutes); // API de segurança (bloqueios e suspensões)

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
