import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Carrega automaticamente todas as rotas de funcionalidades
 * Busca por arquivos que terminam em 'Routes.js' em src/functions/
 * 
 * @param {Object} app - Instância do Express app
 * @param {Function} rateLimiter - Middleware de rate limiting (opcional)
 * @returns {Promise<Array>} Lista de funcionalidades carregadas
 */
export async function autoLoadRoutes(app, rateLimiter = null) {
    const funcionalidadesDir = path.join(__dirname, '../functions');
    const loadedRoutes = [];
    
    logger.debug('Auto-carregando funcionalidades...');
    
    try {
        const categories = fs.readdirSync(funcionalidadesDir);
        
        for (const category of categories) {
            const categoryPath = path.join(funcionalidadesDir, category);
            
            // Ignorar arquivos, apenas processar diretórios
            if (!fs.statSync(categoryPath).isDirectory()) {
                continue;
            }
            
            // Ignorar pasta de template
            if (category === '_TEMPLATE') {
                logger.debug('Ignorando categoria template', { category });
                continue;
            }
            
            // Buscar arquivo de rotas
            const files = fs.readdirSync(categoryPath);
            const routeFile = files.find(file => file.endsWith('Routes.js'));
            
            if (routeFile) {
                try {
                    const routePath = path.join(categoryPath, routeFile);
                    const routeModule = await import(`file://${routePath}`);
                    
                    if (routeModule.default) {
                        // Registrar rotas SEM prefixo /api (Coolify já remove)
                        // Frontend: samm.host/api/{category} → Container: /{category}
                        // Fase 2: Aplicar rate limiter se fornecido
                        if (rateLimiter) {
                            app.use(`/${category}`, rateLimiter, routeModule.default);
                            logger.debug('Rota carregada com rate limiting', { category, routeFile, prefix: `/${category}` });
                        } else {
                            app.use(`/${category}`, routeModule.default);
                            logger.debug('Rota carregada', { category, routeFile, prefix: `/${category}` });
                        }
                        loadedRoutes.push({
                            category,
                            file: routeFile,
                            path: categoryPath,
                            prefix: `/${category}`
                        });
                    } else {
                        logger.warn('Arquivo de rotas sem export default', { category, routeFile });
                    }
                } catch (error) {
                    logger.error('Erro ao carregar arquivo de rotas', { category, routeFile, error: error.message });
                }
            } else {
                logger.warn('Categoria sem arquivo *Routes.js', { category });
            }
        }
        
        logger.debug('Funcionalidades carregadas com sucesso', { total: loadedRoutes.length });
        return loadedRoutes;
        
    } catch (error) {
        logger.error('Erro ao carregar funcionalidades', { error: error.message });
        return [];
    }
}

/**
 * Lista todas as funcionalidades disponíveis (para documentação)
 * @returns {Array} Lista de funcionalidades com suas informações
 */
export function listFuncionalidades() {
    const funcionalidadesDir = path.join(__dirname, '../functions');
    const funcionalidades = [];
    
    try {
        const categories = fs.readdirSync(funcionalidadesDir);
        
        for (const category of categories) {
            const categoryPath = path.join(funcionalidadesDir, category);
            
            if (!fs.statSync(categoryPath).isDirectory() || category === '_TEMPLATE') {
                continue;
            }
            
            const files = fs.readdirSync(categoryPath);
            const hasRoutes = files.some(file => file.endsWith('Routes.js'));
            const hasController = files.some(file => file.endsWith('Controller.js'));
            const hasReadme = files.includes('README.md');
            
            funcionalidades.push({
                name: category,
                hasRoutes,
                hasController,
                hasReadme,
                files: files.length
            });
        }
        
        return funcionalidades;
    } catch (error) {
        logger.error('Erro ao listar funcionalidades', { error: error.message });
        return [];
    }
}

/**
 * Obter lista de rotas descobertas para API
 * @returns {Promise<Array>} Lista de rotas
 */
export async function getDiscoveredRoutes() {
    const funcionalidadesDir = path.join(__dirname, '../functions');
    const routes = [];
    
    try {
        const categories = fs.readdirSync(funcionalidadesDir);
        
        for (const category of categories) {
            const categoryPath = path.join(funcionalidadesDir, category);
            
            if (!fs.statSync(categoryPath).isDirectory() || category === '_TEMPLATE') {
                continue;
            }
            
            const files = fs.readdirSync(categoryPath);
            const routeFile = files.find(file => file.endsWith('Routes.js'));
            
            if (routeFile) {
                routes.push({
                    name: category,
                    path: `/${category}`,
                    method: 'GET/POST',
                    description: `Funcionalidade de ${category}`
                });
            }
        }
        
        return routes;
    } catch (error) {
        logger.error('Erro ao obter rotas descobertas', { error: error.message });
        return [];
    }
}
