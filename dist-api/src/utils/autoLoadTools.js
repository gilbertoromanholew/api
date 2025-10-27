/**
 * 🔧 Auto-Discovery de Ferramentas - Backend V9
 * 
 * Sistema que carrega automaticamente rotas de ferramentas usando glob import.
 * ELIMINA necessidade de registrar manualmente cada ferramenta no server.js.
 * 
 * FUNCIONAMENTO:
 * 1. Escaneia pasta tools/ em busca de arquivos {slug}Routes.js
 * 2. Importa dinamicamente cada arquivo
 * 3. Registra rotas automaticamente no Express
 * 
 * ESTRUTURA ESPERADA:
 * tools/
 *   ├── consulta-cnpj/
 *   │   ├── consultaCnpjRoutes.js  ← exporta { router, config }
 *   │   ├── consultaCnpjController.js
 *   │   └── consultaCnpjService.js
 *   ├── calculo-fgts/
 *   │   ├── calculoFgtsRoutes.js   ← exporta { router, config }
 *   │   ├── calculoFgtsController.js
 *   │   └── calculoFgtsService.js
 * 
 * EXEMPLO DE USO (server.js):
 * 
 * ```javascript
 * import { autoLoadToolRoutes } from './utils/autoLoadTools.js';
 * 
 * // ANTES (V8): Registrar manualmente cada ferramenta
 * // import consultaCnpjRoutes from './tools/consulta-cnpj/consultaCnpjRoutes.js';
 * // import calculoFgtsRoutes from './tools/calculo-fgts/calculoFgtsRoutes.js';
 * // app.use('/api/tools/consulta-cnpj', consultaCnpjRoutes);
 * // app.use('/api/tools/calculo-fgts', calculoFgtsRoutes);
 * 
 * // DEPOIS (V9): UMA linha carrega TUDO ✨
 * await autoLoadToolRoutes(app);
 * // ✅ Pronto! Todas ferramentas em tools/ foram carregadas automaticamente
 * ```
 */

import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Carrega automaticamente todas as rotas de ferramentas
 * 
 * @param {Express.Application} app - Instância do Express
 * @returns {Promise<Object>} Estatísticas do carregamento
 */
export async function autoLoadToolRoutes(app) {
    logger.info('Iniciando auto-discovery de ferramentas');
    
    const stats = {
        loaded: 0,
        failed: 0,
        tools: []
    };
    
    try {
        // Caminho base das ferramentas
        const toolsPath = path.join(__dirname, '../tools');
        
        // Buscar todos os arquivos *Routes.js em subpastas de tools/
        const routeFiles = await glob('*/*Routes.js', {
            cwd: toolsPath,
            absolute: false
        });
        
        logger.info(`Encontrados ${routeFiles.length} arquivos de rotas`, { toolsPath });
        
        for (const routeFile of routeFiles) {
            try {
                // Extrair informações do arquivo
                const toolFolder = path.dirname(routeFile); // ex: "consulta-cnpj"
                const routeFilename = path.basename(routeFile); // ex: "consultaCnpjRoutes.js"
                
                // Importar dinamicamente
                const fullPath = path.join(toolsPath, routeFile);
                const toolModule = await import(`file://${fullPath}`);
                
                // Validar estrutura
                if (!toolModule.router) {
                    throw new Error(`${routeFile} não exporta 'router'`);
                }
                
                // Extrair config (opcional)
                const config = toolModule.config || { slug: toolFolder };
                const slug = config.slug || toolFolder;
                
                // Registrar rota
                app.use(`/api/tools/${slug}`, toolModule.router);
                
                stats.loaded++;
                stats.tools.push({
                    slug,
                    file: routeFile,
                    config
                });
                
                logger.tool(`Ferramenta carregada: ${slug}`, { file: routeFile, config });
                
            } catch (error) {
                stats.failed++;
                logger.error(`Falha ao carregar ferramenta: ${routeFile}`, { error: error.message });
            }
        }
        
        logger.info(`Auto-discovery concluído: ${stats.loaded} sucesso, ${stats.failed} falhas`, stats);
        
        return stats;
        
    } catch (error) {
        logger.error('Erro fatal no auto-discovery', { error: error.message, stack: error.stack });
        throw error;
    }
}

/**
 * Lista todas as ferramentas disponíveis (útil para debug)
 * 
 * @returns {Promise<Array>} Lista de ferramentas
 */
export async function listAvailableTools() {
    const toolsPath = path.join(__dirname, '../tools');
    const routeFiles = await glob('*/*Routes.js', {
        cwd: toolsPath,
        absolute: false
    });
    
    const tools = [];
    
    for (const routeFile of routeFiles) {
        try {
            const fullPath = path.join(toolsPath, routeFile);
            const toolModule = await import(`file://${fullPath}`);
            
            const config = toolModule.config || {};
            const toolFolder = path.dirname(routeFile);
            const slug = config.slug || toolFolder;
            
            tools.push({
                slug,
                name: config.name || slug,
                file: routeFile,
                hasRouter: !!toolModule.router,
                hasConfig: !!toolModule.config
            });
        } catch (error) {
            logger.error(`Erro ao listar ferramenta: ${routeFile}`, { error: error.message });
        }
    }
    
    return tools;
}

/**
 * Valida se uma ferramenta está corretamente estruturada
 * 
 * @param {string} toolSlug - Slug da ferramenta (ex: "consulta-cnpj")
 * @returns {Promise<Object>} Resultado da validação
 */
export async function validateToolStructure(toolSlug) {
    const toolsPath = path.join(__dirname, '../tools');
    const toolPath = path.join(toolsPath, toolSlug);
    
    const validation = {
        valid: true,
        errors: [],
        warnings: [],
        files: {}
    };
    
    try {
        // Verificar se pasta existe
        const fs = await import('fs/promises');
        await fs.access(toolPath);
        
        // Verificar arquivos obrigatórios
        const requiredFiles = [
            `${camelize(toolSlug)}Routes.js`,
            `${camelize(toolSlug)}Controller.js`,
            `${camelize(toolSlug)}Service.js`
        ];
        
        for (const file of requiredFiles) {
            const filePath = path.join(toolPath, file);
            try {
                await fs.access(filePath);
                validation.files[file] = '✅ Existe';
            } catch {
                validation.files[file] = '❌ Faltando';
                validation.errors.push(`Arquivo obrigatório faltando: ${file}`);
                validation.valid = false;
            }
        }
        
        // Verificar estrutura do Routes.js
        if (validation.files[requiredFiles[0]] === '✅ Existe') {
            const routesPath = path.join(toolPath, requiredFiles[0]);
            const routesModule = await import(`file://${routesPath}`);
            
            if (!routesModule.router) {
                validation.errors.push('Routes.js não exporta "router"');
                validation.valid = false;
            }
            
            if (!routesModule.config) {
                validation.warnings.push('Routes.js não exporta "config" (recomendado)');
            }
        }
        
    } catch (error) {
        validation.valid = false;
        validation.errors.push(`Pasta não encontrada: ${toolSlug}`);
    }
    
    return validation;
}

/**
 * Helper: Converter slug kebab-case para camelCase
 * 
 * @param {string} str - String em kebab-case (ex: "consulta-cnpj")
 * @returns {string} String em camelCase (ex: "consultaCnpj")
 */
function camelize(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

export default autoLoadToolRoutes;
