import { isValidCPF } from '../utils/cpfValidator.js';

export const validateCPF = async (req, res) => {
    const { cpf } = req.body;

    if (!cpf) {
        return res.status(400).json({ valid: false, message: 'CPF não fornecido.' });
    }

    const isCpfValid = isValidCPF(cpf);

    if (!isCpfValid) {
        return res.status(200).json({ valid: false, message: 'CPF inválido.' });
    }
    
    res.status(200).json({ valid: true, message: 'CPF válido.' });
};

