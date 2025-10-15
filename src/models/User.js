/**
 * Model de exemplo: User
 * 
 * Este arquivo define a estrutura de dados de um usuário.
 * Use models para padronizar a estrutura dos seus dados.
 */

export class User {
    constructor(data) {
        this.id = data.id || null;
        this.name = data.name || '';
        this.email = data.email || '';
        this.cpf = data.cpf || '';
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    // Validar dados do usuário
    validate() {
        const errors = [];

        if (!this.name || this.name.length < 3) {
            errors.push('Nome deve ter no mínimo 3 caracteres');
        }

        if (!this.email || !this.isValidEmail(this.email)) {
            errors.push('Email inválido');
        }

        if (!this.cpf || !this.isValidCPF(this.cpf)) {
            errors.push('CPF inválido');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    // Validar email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validar CPF (integra com o validador existente)
    isValidCPF(cpf) {
        cpf = String(cpf).replace(/[^\d]+/g, '');
        if (cpf === '' || cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
        
        let add = 0;
        for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
        let rev = 11 - (add % 11);
        if (rev === 10 || rev === 11) rev = 0;
        if (rev !== parseInt(cpf.charAt(9))) return false;
        
        add = 0;
        for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
        rev = 11 - (add % 11);
        if (rev === 10 || rev === 11) rev = 0;
        
        return rev === parseInt(cpf.charAt(10));
    }

    // Retornar apenas dados seguros (sem informações sensíveis)
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            createdAt: this.createdAt,
            // Note: CPF não é retornado por padrão por questões de segurança
        };
    }
}

export default User;
