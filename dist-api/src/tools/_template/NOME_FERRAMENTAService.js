/**
 * 🧠 LÓGICA DE NEGÓCIO: Nome da Ferramenta
 * 
 * Aqui você implementa toda a lógica específica da ferramenta.
 * 
 * RESPONSABILIDADES:
 * - Validar dados de entrada
 * - Processar cálculos/lógica
 * - Formatar saída
 * - Gerar observações/avisos
 * 
 * NÃO FAZER AQUI:
 * - Debitar pontos (Controller faz)
 * - Registrar execução (Controller faz)
 * - Acessar req/res (Controller faz)
 */

/**
 * Processa os dados da ferramenta
 * 
 * @param {Object} dados - Dados de entrada do usuário
 * @returns {Object} Resultado processado
 * 
 * EXEMPLO DE ESTRUTURA DE RETORNO:
 * {
 *   entrada: { ... },           // Dados de entrada formatados
 *   calculos: { ... },          // Passos intermediários (opcional)
 *   resultado: { ... },         // Resultado final
 *   observacoes: [ ... ]        // Avisos/dicas
 * }
 */
export async function processar(dados) {
    // ⚠️ TODO: Implementar validações específicas
    if (!dados) {
        throw new Error('Dados não fornecidos');
    }

    // ⚠️ TODO: Implementar lógica da ferramenta aqui
    console.log(`[processar] Dados recebidos:`, dados);

    // EXEMPLO: Processamento simples
    const resultado = {
        entrada: dados,
        resultado: {
            mensagem: 'Ferramenta executada com sucesso!',
            processado: true
        },
        observacoes: [
            'Exemplo de observação 1',
            'Exemplo de observação 2'
        ]
    };

    return resultado;
}

/**
 * ⚠️ TODO: Adicionar funções auxiliares específicas
 * 
 * EXEMPLOS:
 * 
 * function validarCPF(cpf) { ... }
 * function calcularJuros(valor, taxa, periodo) { ... }
 * function formatarMoeda(valor) { ... }
 * function formatarData(data) { ... }
 */
