export const getApiInfo = (req, res) => {
    res.json({
        message: '🎉 Bem-vindo à API! Você está autorizado!',
        status: 'online',
        versao: '2.0',
        ip_cliente: req.ip,
        
        endpoints: {
            documentacao: {
                metodo: 'GET',
                rota: '/',
                descricao: 'Retorna esta documentação'
            },
            validacao_cpf: {
                metodo: 'POST',
                rota: '/validate-cpf',
                descricao: 'Valida um CPF brasileiro',
                parametros: {
                    cpf: 'string (11 dígitos)'
                },
                exemplo_requisicao: {
                    body: { cpf: '12345678901' }
                },
                exemplo_resposta_sucesso: {
                    valid: true,
                    message: 'CPF válido.'
                },
                exemplo_resposta_erro: {
                    valid: false,
                    message: 'CPF inválido.'
                }
            },
            leitura_pdf: {
                metodo: 'POST',
                rota: '/read-pdf',
                descricao: 'Extrai texto de um arquivo PDF',
                parametros: {
                    pdf: 'arquivo (form-data)'
                },
                exemplo_resposta_sucesso: {
                    success: true,
                    text: 'Texto extraído do PDF...',
                    pages: 5
                },
                exemplo_resposta_erro: {
                    error: 'Nenhum arquivo PDF foi enviado.'
                }
            },
            calculo: {
                metodo: 'POST',
                rota: '/calcular',
                descricao: 'Realiza operações matemáticas',
                parametros: {
                    operacao: 'string (somar, subtrair, multiplicar, dividir, porcentagem)',
                    a: 'number (primeiro valor)',
                    b: 'number (segundo valor)'
                },
                operacoes_disponiveis: [
                    'somar - Soma dois números',
                    'subtrair - Subtrai dois números',
                    'multiplicar - Multiplica dois números',
                    'dividir - Divide dois números',
                    'porcentagem - Calcula percentual (a é o valor, b é o percentual)'
                ],
                exemplo_requisicao: {
                    body: { operacao: 'somar', a: 10, b: 5 }
                },
                exemplo_resposta_sucesso: {
                    success: true,
                    operacao: 'somar',
                    a: 10,
                    b: 5,
                    resultado: 15
                }
            }
        },

        funcoes_disponiveis: {
            validacao: {
                'isValidCPF(cpf)': 'Valida formato de CPF brasileiro (retorna true/false)'
            },
            calculo: {
                'somar(a, b)': 'Retorna a + b',
                'subtrair(a, b)': 'Retorna a - b',
                'multiplicar(a, b)': 'Retorna a * b',
                'dividir(a, b)': 'Retorna a / b',
                'porcentagem(valor, percentual)': 'Retorna percentual de valor'
            },
            pdf: {
                'readPDF(buffer)': 'Extrai texto de buffer de PDF'
            }
        },

        exemplos_curl: {
            validar_cpf: 'curl -X POST https://api.samm.host/validate-cpf -H "Content-Type: application/json" -d \'{"cpf": "12345678901"}\'',
            ler_pdf: 'curl -X POST https://api.samm.host/read-pdf -F "pdf=@arquivo.pdf"',
            calcular_soma: 'curl -X POST https://api.samm.host/calcular -H "Content-Type: application/json" -d \'{"operacao": "somar", "a": 10, "b": 5}\'',
            calcular_porcentagem: 'curl -X POST https://api.samm.host/calcular -H "Content-Type: application/json" -d \'{"operacao": "porcentagem", "a": 200, "b": 15}\''
        },

        seguranca: {
            filtro_ip: 'ativo',
            seu_ip: req.ip,
            status_autorizacao: 'autorizado ✅'
        },

        informacoes: {
            repositorio: 'https://github.com/gilbertoromanholew/api',
            documentacao_completa: 'Ver README.md no repositório',
            suporte: 'Entre em contato com o desenvolvedor'
        }
    });
};
