import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ipFilter } from './src/middlewares/ipFilter.js';
import { errorHandler, notFoundHandler } from './src/middlewares/errorHandler.js';
import { requireAdmin, trackViolations, validateRouteAccess } from './src/middlewares/accessLevel.js';
import { requireAuth, optionalAuth } from './src/middlewares/adminAuth.js';
import { getApiInfo } from './src/routes/index.js';
import { getApiDocs } from './src/routes/docs.js';
import { getLogsDashboard } from './src/routes/logsDashboard.js';
import { autoLoadRoutes } from './src/core/routeLoader.js';
import { autoLoadToolRoutes } from './src/utils/autoLoadTools.js';
import logsRoutes from './src/routes/logsRoutes.js';
import zerotierRoutes from './src/routes/zerotier.js';
import securityRoutes from './src/routes/securityRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
// Fase 3: Rotas de auditoria
import auditRoutes from './src/routes/auditRoutes.js';
// V7: Rotas de conquistas e assinaturas
import achievementsRoutes from './src/routes/achievementsRoutes.js';
import subscriptionRoutes from './src/routes/subscriptionRoutes.js';
// V7: Novas features - Tools, Promo Codes, Referrals
import toolsRoutes from './src/routes/toolsRoutes.js';
import planningToolsRoutes from './src/routes/planningToolsRoutes.js';
import promoCodesRoutes from './src/routes/promoCodesRoutes.js';
import referralRoutes from './src/routes/referralRoutes.js';
import creditsRoutes from './src/routes/creditsRoutes.js'; // Sistema centralizado de pontos
import pricingRoutes from './src/routes/pricingRoutes.js'; // Sistema de precificação diferenciada
import adminRoutes from './src/routes/adminRoutes.js'; // V7: Admin Panel
import notificationsRoutes from './src/routes/notificationsRoutes.js'; // V8: Sistema de notificações
import presenceRoutes from './src/routes/presenceRoutes.js'; // V8: Sistema de presença online
import { supabaseProxy, supabaseProxyCors } from './src/middlewares/supabaseProxy.js';
import securityHeaders from './src/middlewares/securityHeaders.js';
import config from './src/config/index.js';
// Fase 2: Rate Limiting
import { 
    authLimiter, 
    registerLimiter, 
    apiLimiter, 
    supabaseLimiter,
    smartApiLimiter 
} from './src/middlewares/rateLimiters.js';
// Fase 1: CSRF Protection
import { validateCsrfToken } from './src/middlewares/csrfProtection.js';
// V8: WebSocket para atualizações em tempo real
import { initializeSocket } from './src/services/socketService.js';
import { startPresenceCleanup } from './src/services/presenceService.js';

const app = express();
const httpServer = createServer(app);

// Trust proxy - IMPORTANTE: Permite que o Express confie no Traefik/Nginx
// Necessário para rate limiting e logs corretos quando atrás de proxy
app.set('trust proxy', 1);

// Security Headers (CSP, HSTS, X-Frame-Options, etc) - PRIMEIRO
app.use(securityHeaders);

// Middlewares globais
app.use(cors({
    origin: [
        // Produção
        'https://samm.host',                 // Frontend produção
        'http://samm.host',                  // Frontend produção (HTTP fallback)
        'http://177.73.207.121',             // IP público (HTTP)
        'http://177.73.207.121:80',          // IP público porta 80
        'https://177.73.207.121',            // IP público (HTTPS)
        'https://177.73.207.121:443',        // IP público porta 443
        
        // Desenvolvimento local
        'http://localhost',
        'http://localhost:80',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1',
        'http://127.0.0.1:80',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        
        // Regex patterns
        /^http:\/\/10\.244\.\d+\.\d+:\d+$/,  // ZeroTier range (10.244.0.0/16)
        /^http:\/\/localhost:\d+$/,          // Localhost com qualquer porta
        /^http:\/\/127\.0\.0\.1:\d+$/        // 127.0.0.1 com qualquer porta
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token']
}));
app.use(express.json());
app.use(cookieParser());

// 🔐 CSRF Protection - Valida tokens em requisições mutantes (POST/PUT/DELETE/PATCH)
// Endpoints públicos (login, register) são automaticamente excluídos
app.use(validateCsrfToken);

// Health check endpoint (para Docker healthcheck e frontend) - ANTES do filtro de IP
app.get('/health', (req, res) => {
    // Verificar se está em modo manutenção (via variável de ambiente)
    const isInMaintenance = process.env.MAINTENANCE_MODE === 'true';
    
    if (isInMaintenance) {
        return res.status(503).json({
            status: 'maintenance',
            maintenance: true,
            message: process.env.MAINTENANCE_MESSAGE || 'Sistema em manutenção. Voltamos em breve!',
            timestamp: new Date().toISOString(),
            estimatedReturn: process.env.MAINTENANCE_ESTIMATED_RETURN || null
        });
    }
    
    res.status(200).json({
        status: 'online',
        healthy: true,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '2.13.0'
    });
});

// Health check alternativo em /api/health
app.get('/api/health', (req, res) => {
    const isInMaintenance = process.env.MAINTENANCE_MODE === 'true';
    
    if (isInMaintenance) {
        return res.status(503).json({
            status: 'maintenance',
            maintenance: true,
            message: process.env.MAINTENANCE_MESSAGE || 'Sistema em manutenção. Voltamos em breve!',
            timestamp: new Date().toISOString(),
            estimatedReturn: process.env.MAINTENANCE_ESTIMATED_RETURN || null
        });
    }
    
    res.status(200).json({
        status: 'online',
        healthy: true,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '2.13.0'
    });
});

// =========================================================================
// 📍 ROTAS PÚBLICAS (sem filtro de IP)
// =========================================================================
// Estas rotas são acessíveis a qualquer usuário da internet

// 🔄 PROXY REVERSO SUPABASE (com rate limiting)
// Redireciona /supabase/* para o Supabase interno (sem domínio público)
// Fase 2: Rate limiting aplicado (10 req/min)
app.use('/supabase', supabaseLimiter, supabaseProxyCors, supabaseProxy);

// 🔐 ROTAS DE AUTENTICAÇÃO (customizadas, integradas com Supabase)
// Coolify roteia samm.host/api/* → container, então montamos em /auth
// Resultado final: samm.host/api/auth/* → container /auth/*
// Fase 2: Rate limiting aplicado (5 tentativas/15min para login, 3/hora para register)
app.use('/auth', authRoutes);

// =========================================================================
// 📍 V7: ROTAS DE GAMIFICAÇÃO E ECONOMIA (público/autenticado)
// =========================================================================
// Conquistas e assinaturas Pro (Nova Economia V7)
// Rate limiting inteligente aplicado (smartApiLimiter - dinâmico por tipo de usuário)
app.use('/achievements', smartApiLimiter, achievementsRoutes);
app.use('/subscription', smartApiLimiter, subscriptionRoutes);

// Tracking de ferramentas, códigos promocionais e sistema de indicação
app.use('/tools', smartApiLimiter, toolsRoutes);
app.use('/tools/planning', smartApiLimiter, planningToolsRoutes);
app.use('/promo-codes', smartApiLimiter, promoCodesRoutes);
app.use('/referrals', smartApiLimiter, referralRoutes);

// Sistema de créditos/pontos centralizado
app.use('/credits', smartApiLimiter, creditsRoutes);

// Sistema de precificação diferenciada por plano
app.use('/pricing', smartApiLimiter, pricingRoutes);

// Sistema de notificações em tempo real
app.use('/notifications', smartApiLimiter, notificationsRoutes);

// =========================================================================
// 📍 V7: ADMIN PANEL (requer autenticação + role admin)
// =========================================================================
// Painel administrativo para gerenciamento de usuários e sistema
app.use('/admin', apiLimiter, adminRoutes);

// Sistema de presença online (admin only)
app.use('/presence', apiLimiter, presenceRoutes);

// =========================================================================
// � V9: AUTO-DISCOVERY DE FERRAMENTAS
// =========================================================================
// Carrega automaticamente todas as ferramentas da pasta src/tools/
// ZERO necessidade de editar server.js manualmente! ✨
await autoLoadToolRoutes(app);

// =========================================================================
// �📍 ROTAS DE INFORMAÇÃO (público, sem autenticação)
// =========================================================================

// Rotas de sistema (documentação e logs)
app.get('/', getApiInfo);           // JSON com toda documentação (público)
app.get('/docs', getApiDocs);       // Página HTML bonita (público)

// Rota para listar funções disponíveis (público, mas pode estar limitado por nível de acesso)
app.get('/functions', async (req, res) => {
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
        
        // Detectar nível de acesso do usuário
        const { getIPAccessLevel } = await import('./src/middlewares/accessLevel.js');
        const clientIp = req.ip_detected || req.ip;
        const accessLevel = await getIPAccessLevel(clientIp);
        
        // Filtrar baseado no nível de acesso
        let filteredFunctions = functions;
        let note = '';
        
        if (accessLevel === 'guest') {
            // GUEST: não vê endpoints (apenas visualiza que funções existem)
            filteredFunctions = functions.map(func => ({
                ...func,
                endpoints: []  // Oculta todos os endpoints
            }));
            note = '👁️ Acesso de visualização: você pode ver que funções existem, mas não pode usá-las. Entre em contato com o administrador para obter acesso.';
        } else if (accessLevel === 'trusted') {
            // TRUSTED: vê TUDO (tem acesso total às functions)
            note = '✅ Acesso completo às funções: você pode usar todos os endpoints das funções carregadas dinamicamente.';
        } else if (accessLevel === 'admin') {
            // ADMIN: vê TUDO
            note = '🔓 Acesso administrativo: você tem acesso total a todas as rotas, incluindo gerenciamento da API.';
        }
        
        res.json({
            success: true,
            total: filteredFunctions.length,
            functions: filteredFunctions,
            accessLevel: accessLevel,
            note: note
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            functions: [],
            error: error.message
        });
    }
});

// =========================================================================
// 📍 ROTAS ADMINISTRATIVAS (IP Filter + requireAdmin)
// =========================================================================
// Estas rotas são acessíveis APENAS via VPN (ZeroTier) ou IPs autorizados

app.get('/logs', ipFilter, requireAdmin, getLogsDashboard); // 🔒 Dashboard APENAS para admin
app.use('/logs', ipFilter, requireAdmin, logsRoutes);   // 🔒 API de logs APENAS para admin
app.use('/zerotier', ipFilter, requireAdmin, zerotierRoutes); // 🔒 ZeroTier APENAS para admin
app.use('/security', ipFilter, requireAdmin, securityRoutes); // 🔒 Segurança APENAS para admin
// Fase 3: Rotas de auditoria (admin via VPN)
app.use('/audit', ipFilter, auditRoutes); // 🔒 Auditoria (requireAdmin já aplicado dentro das rotas)

// =========================================================================
// 📍 ROTAS DE API (funções dinâmicas)
// =========================================================================
// autoLoadRoutes monta as rotas em /{category}
// Fase 2: Rate limiting aplicado (100 req/15min por usuário autenticado)

// Auto-carregar funcionalidades do diretório src/functions/
// Rate limiting inteligente aplicado (dinâmico por tipo de usuário)
await autoLoadRoutes(app, smartApiLimiter);

// Nota: validateRouteAccess e trackViolations são aplicados dentro das rotas individuais
// via requireAuth middleware em cada controller

// Handlers de erro (devem ser os ÚLTIMOS middlewares)
app.use(notFoundHandler);  // 404 - Rota não encontrada
app.use(errorHandler);     // Erro genérico

// V8: Inicializar Socket.IO ANTES de iniciar o servidor
initializeSocket(httpServer);

// V8: Iniciar serviço de limpeza de presença (marca usuários inativos como offline)
startPresenceCleanup();

// Iniciar servidor (usando httpServer em vez de app.listen)
httpServer.listen(config.server.port, config.server.host, () => {
    // Importar e executar logs de inicialização
    import('./src/utils/startupLogger.js')
        .then(({ logStartup }) => logStartup())
        .catch(() => {
            // Fallback caso o logger falhe
            console.log(`\n🚀 Servidor rodando em ${config.server.host}:${config.server.port}\n`);
        });
    
    // Iniciar Alert Worker (Fase 3)
    import('./src/utils/alertSystem.js')
        .then(({ startAlertWorker }) => startAlertWorker())
        .catch((err) => {
            console.error('⚠️  Erro ao iniciar Alert Worker:', err);
        });
});
