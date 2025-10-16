/**
 * Template Utils
 * Funções auxiliares para o Template Controller
 * 
 * Use este arquivo para:
 * - Lógica de negócio complexa
 * - Manipulação de dados
 * - Cálculos e transformações
 * - Integrações com APIs externas
 */

/**
 * Exemplo de função auxiliar
 * @param {string} input - Valor de entrada
 * @returns {string} Valor processado
 */
export function processar(input) {
    // Sua lógica aqui
    return input.toUpperCase();
}

/**
 * Exemplo de função assíncrona
 * @param {string} url - URL para buscar dados
 * @returns {Promise<Object>} Dados da API
 */
export async function buscarDadosExternos(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        throw new Error('Falha ao buscar dados externos');
    }
}

/**
 * Exemplo de validação customizada
 * @param {*} value - Valor a validar
 * @returns {boolean} True se válido
 */
export function validarCustomizado(value) {
    // Implemente sua validação
    return value !== null && value !== undefined;
}

/**
 * Exemplo de formatação de dados
 * @param {Object} rawData - Dados brutos
 * @returns {Object} Dados formatados
 */
export function formatarDados(rawData) {
    return {
        id: rawData.id,
        nome: rawData.nome?.trim(),
        criadoEm: new Date(rawData.created_at),
        // ... outros campos
    };
}
