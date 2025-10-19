/**
 * Utilitários de Autenticação
 * Validações e helpers
 */

/**
 * Validar CPF (algoritmo oficial brasileiro)
 */
export function isValidCPF(cpf) {
    if (!cpf) return false;
    
    // Remove caracteres não numéricos
    cpf = cpf.replace(/[^\d]+/g, '');
    
    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validação do primeiro dígito verificador
    let add = 0;
    for (let i = 0; i < 9; i++) {
        add += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9))) return false;
    
    // Validação do segundo dígito verificador
    add = 0;
    for (let i = 0; i < 10; i++) {
        add += parseInt(cpf.charAt(i)) * (11 - i);
    }
    rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(10))) return false;
    
    return true;
}

/**
 * Validar senha forte
 * Requisitos: 6-12 chars, maiúscula, minúscula, número, símbolo
 */
export function isValidPassword(password) {
    if (!password) return false;
    
    const hasMinMaxChars = password.length >= 6 && password.length <= 12;
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return hasMinMaxChars && hasLowercase && hasUppercase && hasNumber && hasSymbol;
}

/**
 * Validar email
 */
export function isValidEmail(email) {
    if (!email) return false;
    return /^\S+@\S+\.\S+$/.test(email);
}

/**
 * Formatar CPF (123.456.789-00)
 */
export function formatCPF(cpf) {
    if (!cpf) return '';
    cpf = cpf.replace(/[^\d]+/g, '');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Limpar CPF (apenas números)
 */
export function cleanCPF(cpf) {
    if (!cpf) return '';
    return cpf.replace(/[^\d]+/g, '');
}

/**
 * Validar código de referência
 */
export function isValidReferralCode(code) {
    if (!code) return false;
    // 8 caracteres alfanuméricos
    return /^[A-Z0-9]{8}$/.test(code);
}

/**
 * Gerar código de referência único
 */
export function generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Extrair token do header Authorization
 */
export function extractTokenFromHeader(authHeader) {
    if (!authHeader) return null;
    
    // Bearer token
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    
    return authHeader;
}

/**
 * Criar mensagem de erro de senha
 */
export function getPasswordErrorMessage() {
    return 'A senha deve ter entre 6 e 12 caracteres, incluindo: letra maiúscula, letra minúscula, número e símbolo (!@#$%^&*(),.?":{}|<>)';
}
