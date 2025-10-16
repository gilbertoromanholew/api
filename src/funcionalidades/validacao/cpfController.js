import { BaseController } from '../../core/BaseController.js';
import { isValidCPF } from './cpfValidator.js';

class CPFController extends BaseController {
    async validateCPF(req, res) {
        return this.execute(req, res, async (req, res) => {
            const { cpf } = req.body;

            const isCpfValid = isValidCPF(cpf);

            if (!isCpfValid) {
                return this.error(res, 'CPF inválido', 200);
            }
            
            this.success(res, { valid: true, cpf }, 'CPF válido');
        });
    }
}

export const cpfController = new CPFController();
export const validateCPF = (req, res) => cpfController.validateCPF(req, res);
