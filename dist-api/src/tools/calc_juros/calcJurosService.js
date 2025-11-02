/**
 * LÓGICA DE NEGÓCIO: Cálculo de Juros
 * 
 * Cálculo de juros simples e compostos com múltiplos índices
 */

/**
 * Processa os dados da ferramenta
 * 
 * @param {Object} dados - Dados de entrada
 * @param {number} dados.capital - Valor do capital inicial
 * @param {number} dados.taxa - Taxa de juros (%)
 * @param {number} dados.periodo - Período em meses
 * @param {string} dados.tipo - Tipo: 'simples' ou 'composto'
 * @param {string} dados.indice - Índice: 'cdi', 'selic', 'ipca', 'fixo' (opcional)
 * @returns {Object} Resultado processado
 */
export async function processar(dados) {
    console.log('[calc_juros] Processando dados:', dados);

    const { capital, taxa, periodo, tipo = 'simples', indice = 'fixo' } = dados;

    // Validações
    if (capital <= 0) {
        throw new Error('Capital deve ser maior que zero');
    }
    if (taxa <= 0) {
        throw new Error('Taxa deve ser maior que zero');
    }
    if (periodo <= 0) {
        throw new Error('Período deve ser maior que zero');
    }

    // Taxa mensal (converter de % para decimal)
    const taxaMensal = taxa / 100;

    let montante;
    let juros;
    let evolucao = [];

    // Cálculo baseado no tipo
    if (tipo === 'simples') {
        // Juros Simples: M = C * (1 + i * t)
        juros = capital * taxaMensal * periodo;
        montante = capital + juros;

        // Evolução mensal
        for (let mes = 0; mes <= periodo; mes++) {
            const jurosMes = capital * taxaMensal * mes;
            const montanteMes = capital + jurosMes;
            evolucao.push({
                mes,
                capital,
                juros: jurosMes,
                montante: montanteMes
            });
        }

    } else if (tipo === 'composto') {
        // Juros Compostos: M = C * (1 + i)^t
        montante = capital * Math.pow(1 + taxaMensal, periodo);
        juros = montante - capital;

        // Evolução mensal
        for (let mes = 0; mes <= periodo; mes++) {
            const montanteMes = capital * Math.pow(1 + taxaMensal, mes);
            const jurosMes = montanteMes - capital;
            evolucao.push({
                mes,
                capital,
                juros: jurosMes,
                montante: montanteMes
            });
        }

    } else {
        throw new Error('Tipo inválido. Use "simples" ou "composto"');
    }

    // Informações do índice
    const infoIndice = obterInfoIndice(indice, taxa);

    // Cálculo de taxa equivalente anual
    const taxaAnual = tipo === 'simples' 
        ? taxa * 12 
        : ((Math.pow(1 + taxaMensal, 12) - 1) * 100);

    const resultado = {
        // Entrada
        entrada: {
            capital: parseFloat(capital.toFixed(2)),
            taxa: parseFloat(taxa.toFixed(2)),
            periodo,
            tipo,
            indice
        },

        // Resultado
        resultado: {
            montante: parseFloat(montante.toFixed(2)),
            juros: parseFloat(juros.toFixed(2)),
            rentabilidade_percentual: parseFloat(((juros / capital) * 100).toFixed(2)),
            taxa_mensal: parseFloat(taxa.toFixed(2)),
            taxa_anual: parseFloat(taxaAnual.toFixed(2))
        },

        // Evolução mensal
        evolucao: evolucao.map(item => ({
            mes: item.mes,
            capital: parseFloat(item.capital.toFixed(2)),
            juros: parseFloat(item.juros.toFixed(2)),
            montante: parseFloat(item.montante.toFixed(2))
        })),

        // Informações do índice
        indice: infoIndice,

        // Comparação
        comparacao: gerarComparacao(capital, periodo, taxa),

        // Timestamp
        timestamp: new Date().toISOString()
    };

    return resultado;
}

/**
 * Obter informações sobre o índice
 */
function obterInfoIndice(indice, taxa) {
    const indices = {
        'fixo': {
            nome: 'Taxa Fixa',
            descricao: 'Taxa de juros fixa ao longo do período',
            referencia: `${taxa}% a.m.`
        },
        'cdi': {
            nome: 'CDI',
            descricao: 'Certificado de Depósito Interbancário',
            referencia: 'Taxa do mercado interbancário',
            taxa_atual_estimada: 11.65 // Exemplo - pode integrar com API
        },
        'selic': {
            nome: 'SELIC',
            descricao: 'Sistema Especial de Liquidação e de Custódia',
            referencia: 'Taxa básica de juros da economia',
            taxa_atual_estimada: 11.75 // Exemplo - pode integrar com API
        },
        'ipca': {
            nome: 'IPCA',
            descricao: 'Índice de Preços ao Consumidor Amplo',
            referencia: 'Inflação oficial do Brasil',
            taxa_atual_estimada: 4.82 // Exemplo - pode integrar com API
        },
        'poupanca': {
            nome: 'Poupança',
            descricao: 'Rendimento da caderneta de poupança',
            referencia: '0,5% a.m. + TR',
            taxa_atual_estimada: 0.5
        }
    };

    return indices[indice] || indices['fixo'];
}

/**
 * Gerar comparação com outros tipos de investimento
 */
function gerarComparacao(capital, periodo, taxa) {
    const taxaMensal = taxa / 100;

    // Calcular diferentes cenários
    const simples = capital * (1 + taxaMensal * periodo);
    const composto = capital * Math.pow(1 + taxaMensal, periodo);
    const poupanca = capital * Math.pow(1 + 0.005, periodo); // ~0.5% a.m.
    const cdi100 = capital * Math.pow(1 + 0.01165, periodo); // ~11.65% a.a.

    return {
        cenarios: [
            {
                tipo: 'Juros Simples',
                montante: parseFloat(simples.toFixed(2)),
                rentabilidade: parseFloat(((simples - capital) / capital * 100).toFixed(2))
            },
            {
                tipo: 'Juros Compostos',
                montante: parseFloat(composto.toFixed(2)),
                rentabilidade: parseFloat(((composto - capital) / capital * 100).toFixed(2))
            },
            {
                tipo: 'Poupança',
                montante: parseFloat(poupanca.toFixed(2)),
                rentabilidade: parseFloat(((poupanca - capital) / capital * 100).toFixed(2))
            },
            {
                tipo: 'CDI 100%',
                montante: parseFloat(cdi100.toFixed(2)),
                rentabilidade: parseFloat(((cdi100 - capital) / capital * 100).toFixed(2))
            }
        ],
        melhor_opcao: Math.max(simples, composto, poupanca, cdi100) === composto 
            ? 'Juros Compostos' 
            : Math.max(simples, composto, poupanca, cdi100) === simples
                ? 'Juros Simples'
                : Math.max(poupanca, cdi100) === cdi100
                    ? 'CDI 100%'
                    : 'Poupança'
    };
}

export default {
    processar
};
