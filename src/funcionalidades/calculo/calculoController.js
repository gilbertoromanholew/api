import { BaseController } from '../../core/BaseController.js';
import { somar, subtrair, multiplicar, dividir, porcentagem } from './calculoUtils.js';

class CalculoController extends BaseController {
    async calcular(req, res) {
        return this.execute(req, res, async (req, res) => {
            const { operacao, a, b } = req.body;

            // Mapa de operações disponíveis
            const operations = {
                somar: () => somar(Number(a), Number(b)),
                subtrair: () => subtrair(Number(a), Number(b)),
                multiplicar: () => multiplicar(Number(a), Number(b)),
                dividir: () => dividir(Number(a), Number(b)),
                porcentagem: () => porcentagem(Number(a), Number(b))
            };

            const resultado = operations[operacao]();

            this.success(res, {
                operacao,
                a: Number(a),
                b: Number(b),
                resultado
            }, `Operação '${operacao}' realizada com sucesso`);
        });
    }
}

export const calculoController = new CalculoController();
export const calcular = (req, res) => calculoController.calcular(req, res);
