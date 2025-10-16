import { BaseController } from '../../core/BaseController.js';

/**
 * Template Controller
 * Exemplo de controller usando a classe BaseController
 */
class TemplateController extends BaseController {
    /**
     * Exemplo de método do controller
     * @param {Object} req - Request do Express
     * @param {Object} res - Response do Express
     */
    async exemplo(req, res) {
        return this.execute(req, res, async (req, res) => {
            const { parametro } = req.body;
            
            // ===== SUA LÓGICA AQUI =====
            // Processe os dados, chame APIs, acesse banco de dados, etc.
            const resultado = `Você enviou: ${parametro}`;
            
            // Para operações complexas, crie funções em templateUtils.js
            // import { minhaFuncao } from './templateUtils.js';
            // const resultado = minhaFuncao(parametro);
            
            // Retorna sucesso com dados
            this.success(res, { resultado }, 'Operação realizada com sucesso');
            
            // Ou retorna erro (se necessário)
            // this.error(res, 'Algo deu errado', 400);
        });
    }
    
    /**
     * Exemplo de método GET
     */
    async listar(req, res) {
        return this.execute(req, res, async (req, res) => {
            // Exemplo: listar itens
            const items = [
                { id: 1, nome: 'Item 1' },
                { id: 2, nome: 'Item 2' }
            ];
            
            this.success(res, items, 'Lista recuperada com sucesso');
        });
    }
    
    /**
     * Exemplo de método com parâmetro na URL
     */
    async buscarPorId(req, res) {
        return this.execute(req, res, async (req, res) => {
            const { id } = req.params;
            
            // Buscar item por ID
            const item = { id: id, nome: `Item ${id}` };
            
            this.success(res, item, 'Item encontrado');
        });
    }
}

// Exportar instância do controller
export const templateController = new TemplateController();

// Exportar funções individuais para as rotas
export const exemplo = (req, res) => templateController.exemplo(req, res);
export const listar = (req, res) => templateController.listar(req, res);
export const buscarPorId = (req, res) => templateController.buscarPorId(req, res);
