/**
 * LÓGICA DE NEGÓCIO: Calculadora Simples
 * 
 * Realiza operações matemáticas básicas
 */

export async function calcular(dados) {
    const { numero1, numero2, operacao } = dados;

    // Converter para números
    const n1 = parseFloat(numero1);
    const n2 = parseFloat(numero2);

    // Validar números
    if (isNaN(n1) || isNaN(n2)) {
        throw new Error('Números inválidos');
    }

    let resultado;
    let operacaoRealizada;

    switch (operacao.toLowerCase()) {
        case 'soma':
        case '+':
            resultado = n1 + n2;
            operacaoRealizada = 'Soma';
            break;

        case 'subtracao':
        case 'subtração':
        case '-':
            resultado = n1 - n2;
            operacaoRealizada = 'Subtração';
            break;

        case 'multiplicacao':
        case 'multiplicação':
        case '*':
        case 'x':
            resultado = n1 * n2;
            operacaoRealizada = 'Multiplicação';
            break;

        case 'divisao':
        case 'divisão':
        case '/':
            if (n2 === 0) {
                throw new Error('Divisão por zero não permitida');
            }
            resultado = n1 / n2;
            operacaoRealizada = 'Divisão';
            break;

        default:
            throw new Error(`Operação inválida: ${operacao}. Use: soma, subtracao, multiplicacao ou divisao`);
    }

    return {
        numero1: n1,
        numero2: n2,
        operacao: operacaoRealizada,
        resultado: resultado,
        expressao: `${n1} ${getSymbol(operacao)} ${n2} = ${resultado}`,
        timestamp: new Date().toISOString()
    };
}

/**
 * Helper: Retorna símbolo da operação
 */
function getSymbol(operacao) {
    switch (operacao.toLowerCase()) {
        case 'soma':
        case '+':
            return '+';
        case 'subtracao':
        case 'subtração':
        case '-':
            return '-';
        case 'multiplicacao':
        case 'multiplicação':
        case '*':
        case 'x':
            return '×';
        case 'divisao':
        case 'divisão':
        case '/':
            return '÷';
        default:
            return operacao;
    }
}
