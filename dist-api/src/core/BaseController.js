/**
 * Classe base para todos os controllers
 * Fornece métodos utilitários e padronização de respostas
 */
export class BaseController {
    /**
     * Resposta de sucesso padronizada
     * @param {Object} res - Response object do Express
     * @param {*} data - Dados a serem retornados
     * @param {string} message - Mensagem de sucesso
     * @param {number} statusCode - Código HTTP de status
     */
    success(res, data, message = 'Operação realizada com sucesso', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data
        });
    }
    
    /**
     * Resposta de erro padronizada
     * @param {Object} res - Response object do Express
     * @param {string} message - Mensagem de erro
     * @param {number} statusCode - Código HTTP de status
     * @param {Array} errors - Lista de erros detalhados
     */
    error(res, message = 'Erro ao processar requisição', statusCode = 500, errors = null) {
        return res.status(statusCode).json({
            success: false,
            message,
            ...(errors && { errors })
        });
    }
    
    /**
     * Wrapper para try-catch automático
     * Encapsula a lógica do controller em um bloco try-catch
     * @param {Object} req - Request object do Express
     * @param {Object} res - Response object do Express
     * @param {Function} handler - Função handler do controller
     */
    async execute(req, res, handler) {
        try {
            await handler(req, res);
        } catch (error) {
            console.error('❌ Controller Error:', error);
            this.error(res, error.message, 500);
        }
    }
}
