/**
 * LÓGICA DE NEGÓCIO: Conversor de Moeda
 * 
 * Converte valores entre moedas usando API pública
 * API: https://api.exchangerate-api.com (versão gratuita)
 */

/**
 * Converte valor entre moedas
 */
export async function converter(dados) {
    const { valor, moedaOrigem, moedaDestino } = dados;

    // Validar valor
    const valorNumerico = parseFloat(valor);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
        throw new Error('Valor inválido. Deve ser um número positivo.');
    }

    // Validar moedas
    if (!moedaOrigem || !moedaDestino) {
        throw new Error('Moedas de origem e destino são obrigatórias');
    }

    try {
        // Buscar taxa de câmbio da API
        const url = `https://api.exchangerate-api.com/v4/latest/${moedaOrigem}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Erro ao buscar cotação: ${response.status}`);
        }

        const data = await response.json();

        // Verificar se moeda destino existe
        if (!data.rates[moedaDestino]) {
            throw new Error(`Moeda destino não encontrada: ${moedaDestino}`);
        }

        const taxa = data.rates[moedaDestino];
        const valorConvertido = valorNumerico * taxa;

        return {
            valorOriginal: valorNumerico,
            moedaOrigem,
            moedaDestino,
            taxa,
            valorConvertido: parseFloat(valorConvertido.toFixed(2)),
            expressao: `${valorNumerico} ${moedaOrigem} = ${valorConvertido.toFixed(2)} ${moedaDestino}`,
            dataAtualizacao: data.date,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        if (error.message.includes('fetch')) {
            throw new Error('Erro ao conectar com API de câmbio. Tente novamente.');
        }
        throw error;
    }
}

/**
 * Retorna lista de moedas suportadas
 */
export function getMoedasSuportadas() {
    return {
        principais: [
            { codigo: 'BRL', nome: 'Real Brasileiro', simbolo: 'R$' },
            { codigo: 'USD', nome: 'Dólar Americano', simbolo: '$' },
            { codigo: 'EUR', nome: 'Euro', simbolo: '€' },
            { codigo: 'GBP', nome: 'Libra Esterlina', simbolo: '£' },
            { codigo: 'JPY', nome: 'Iene Japonês', simbolo: '¥' },
            { codigo: 'CAD', nome: 'Dólar Canadense', simbolo: 'C$' },
            { codigo: 'AUD', nome: 'Dólar Australiano', simbolo: 'A$' },
            { codigo: 'CHF', nome: 'Franco Suíço', simbolo: 'CHF' }
        ],
        americaLatina: [
            { codigo: 'ARS', nome: 'Peso Argentino', simbolo: '$' },
            { codigo: 'CLP', nome: 'Peso Chileno', simbolo: '$' },
            { codigo: 'MXN', nome: 'Peso Mexicano', simbolo: '$' },
            { codigo: 'COP', nome: 'Peso Colombiano', simbolo: '$' }
        ],
        outras: [
            { codigo: 'CNY', nome: 'Yuan Chinês', simbolo: '¥' },
            { codigo: 'INR', nome: 'Rupia Indiana', simbolo: '₹' },
            { codigo: 'KRW', nome: 'Won Sul-Coreano', simbolo: '₩' }
        ],
        info: 'Lista completa disponível em: https://api.exchangerate-api.com/v4/latest/USD'
    };
}
