export const getApiInfo = (req, res) => {
    res.json({
        message: 'Bem-vindo à API! Aqui estão os comandos e funções disponíveis.',
        endpoints: [
            'POST /validate-cpf: Valida um CPF (envie JSON: {"cpf": "12345678901"})',
            'POST /read-pdf: Lê um arquivo PDF e retorna o texto extraído (envie o arquivo PDF via form-data com chave "pdf")'
        ],
        functions: [
            'isValidCPF(cpf): Valida o formato de um CPF'
        ]
    });
};
