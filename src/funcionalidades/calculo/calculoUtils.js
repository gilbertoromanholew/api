// Funções de cálculo matemático

export function somar(a, b) {
    return a + b;
}

export function subtrair(a, b) {
    return a - b;
}

export function multiplicar(a, b) {
    return a * b;
}

export function dividir(a, b) {
    if (b === 0) {
        throw new Error('Divisão por zero não permitida');
    }
    return a / b;
}

export function porcentagem(valor, percentual) {
    return (valor * percentual) / 100;
}
