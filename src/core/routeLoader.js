import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Carrega automaticamente todas as rotas de funcionalidades
 * Busca por arquivos que terminam em 'Routes.js' em src/functions/
 * 
 * @param {Object} app - Instância do Express app
 * @returns {Promise<Array>} Lista de funcionalidades carregadas
 */
export async function autoLoadRoutes(app) {
    const funcionalidadesDir = path.join(__dirname, '../functions');
    const loadedRoutes = [];
    
    console.log('\n📦 Auto-carregando funcionalidades...\n');
    
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
                console.log(`   ⏭️  Ignorando: ${category} (template)`);
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
                        app.use(routeModule.default);
                        loadedRoutes.push({
                            category,
                            file: routeFile,
                            path: categoryPath
                        });
                        console.log(`   ✅ ${category}/${routeFile}`);
                    } else {
                        console.log(`   ⚠️  ${category}/${routeFile} - sem export default`);
                    }
                } catch (error) {
                    console.error(`   ❌ Erro ao carregar ${category}/${routeFile}:`, error.message);
                }
            } else {
                console.log(`   ⚠️  ${category} - nenhum arquivo *Routes.js encontrado`);
            }
        }
        
        console.log(`\n✅ Total: ${loadedRoutes.length} funcionalidade(s) carregada(s)\n`);
        return loadedRoutes;
        
    } catch (error) {
        console.error('❌ Erro ao carregar funcionalidades:', error);
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
        console.error('Erro ao listar funcionalidades:', error);
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
        console.error('Erro ao obter rotas descobertas:', error);
        return [];
    }
}
