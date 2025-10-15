import { somar, subtrair, multiplicar, dividir, porcentagem } from './calculoUtils.js';

export const calcular = async (req, res) => {
    try {
        const { operacao, a, b } = req.body;

        if (!operacao || a === undefined || b === undefined) {
            return res.status(400).json({ 
                error: 'Parâmetros necessários: operacao, a, b' 
            });
        }

        let resultado;

        switch (operacao) {
            case 'somar':
                resultado = somar(Number(a), Number(b));
                break;
            case 'subtrair':
                resultado = subtrair(Number(a), Number(b));
                break;
            case 'multiplicar':
                resultado = multiplicar(Number(a), Number(b));
                break;
            case 'dividir':
                resultado = dividir(Number(a), Number(b));
                break;
            case 'porcentagem':
                resultado = porcentagem(Number(a), Number(b));
                break;
            default:
                return res.status(400).json({ 
                    error: 'Operação inválida. Use: somar, subtrair, multiplicar, dividir, porcentagem' 
                });
        }

        res.status(200).json({
            success: true,
            operacao,
            a: Number(a),
            b: Number(b),
            resultado
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
