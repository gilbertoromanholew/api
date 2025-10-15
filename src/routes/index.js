export const getApiInfo = (req, res) => {
    res.json({
        message: 'Bem-vindo à API! Aqui estão as funcionalidades disponíveis.',
        funcionalidades: {
            validacao: [
                'POST /validate-cpf: Valida um CPF brasileiro'
            ],
            pdf: [
                'POST /read-pdf: Extrai texto de um arquivo PDF'
            ],
            calculo: [
                'POST /calcular: Realiza operações matemáticas (somar, subtrair, multiplicar, dividir, porcentagem)'
            ],
            extras: [
                'Em breve...'
            ]
        },
        exemplos: {
            validate_cpf: {
                metodo: 'POST',
                url: '/validate-cpf',
                body: { cpf: '12345678901' }
            },
            read_pdf: {
                metodo: 'POST',
                url: '/read-pdf',
                body: 'form-data com key "pdf"'
            },
            calcular: {
                metodo: 'POST',
                url: '/calcular',
                body: { operacao: 'somar', a: 10, b: 5 }
            }
        }
    });
};
