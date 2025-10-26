/**
 * Service da ferramenta Exemplo de Teste V9
 * Lógica de negócio isolada
 */

/**
 * Processa a mensagem de teste
 * @param {Object} dados - Dados de entrada
 * @returns {Object} Resultado processado
 */
export async function processar(dados) {
    const { mensagem, userId } = dados;
    
    // Simular processamento
    const mensagemProcessada = mensagem.toUpperCase();
    const tamanho = mensagem.length;
    const palavras = mensagem.split(' ').length;
    
    return {
        mensagemOriginal: mensagem,
        mensagemProcessada,
        estatisticas: {
            tamanho,
            palavras,
            caracteres: tamanho,
            vogais: (mensagem.match(/[aeiouAEIOU]/g) || []).length,
            consoantes: (mensagem.match(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/g) || []).length
        },
        metadata: {
            userId,
            processadoEm: new Date().toISOString(),
            versao: '1.0.0'
        }
    };
}
