import express from 'express';
import cors from 'cors';
import { ipFilter } from './src/middlewares/ipFilter.js';
import { errorHandler, notFoundHandler } from './src/middlewares/errorHandler.js';
import { getApiInfo } from './src/routes/index.js';
import { getApiDocs } from './src/routes/docs.js';
import { getLogsDashboard } from './src/routes/logsDashboard.js';
import { autoLoadRoutes } from './src/core/routeLoader.js';
import logsRoutes from './src/routes/logsRoutes.js';
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

// Auto-carregar funcionalidades do diretório src/funcionalidades/
await autoLoadRoutes(app);

// Handlers de erro (devem ser os ÚLTIMOS middlewares)
app.use(notFoundHandler);  // 404 - Rota não encontrada
app.use(errorHandler);     // Erro genérico

// Iniciar servidor
app.listen(config.port, config.host, () => {
    console.log(`🚀 Servidor rodando na porta ${config.port}`);
    console.log(`📍 Acesse: http://localhost:${config.port}`);
    console.log(`📖 Documentação: http://localhost:${config.port}/docs`);
    console.log(`📊 Dashboard: http://localhost:${config.port}/logs\n`);
});
