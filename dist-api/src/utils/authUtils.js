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
 * Requisitos: 8-12 chars, maiúscula, minúscula, número, símbolo
 */
export function isValidPassword(password) {
    if (!password) return false;

    const hasMinMaxChars = password.length >= 8 && password.length <= 12;
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return hasMinMaxChars && hasLowercase && hasUppercase && hasNumber && hasSymbol;
}

/**
 * Obter erros específicos de validação de senha
 * Retorna array com requisitos faltantes
 */
export function getPasswordErrors(password) {
    if (!password) return ['Senha é obrigatória'];
    
    const errors = [];
    
    if (password.length < 8) errors.push('mínimo 8 caracteres');
    if (password.length > 12) errors.push('máximo 12 caracteres');
    if (!/[A-Z]/.test(password)) errors.push('uma letra maiúscula');
    if (!/[a-z]/.test(password)) errors.push('uma letra minúscula');
    if (!/\d/.test(password)) errors.push('um número');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('um símbolo (!@#$%&*)');
    
    return errors;
}

/**
 * Validar email
 */
export function isValidEmail(email) {
    if (!email) return false;
    return /^\S+@\S+\.\S+$/.test(email);
}

/**
 * Lista de provedores de e-mail permitidos
 */
const ALLOWED_EMAIL_PROVIDERS = [
    'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'yahoo.com.br',
    'icloud.com', 'protonmail.com', 'live.com', 'msn.com', 'uol.com.br',
    'bol.com.br', 'terra.com.br', 'ig.com.br', 'globo.com', 'r7.com'
];

/**
 * Validar provedor de e-mail confiável
 */
export function isAllowedEmailProvider(email) {
    if (!email) return false;
    const domain = email.toLowerCase().split('@')[1];
    return ALLOWED_EMAIL_PROVIDERS.includes(domain);
}

/**
 * Validar nome completo
 * Requisitos: mínimo 2 palavras, mínimo 2 letras cada, apenas letras, sem nomes fake
 */
export function isValidFullName(name) {
    if (!name) return { valid: false, error: 'Nome é obrigatório.' };
    
    // Remover espaços extras e dividir em partes
    const nameParts = name.trim().split(/\s+/).filter(part => part.length > 0);
    
    // Verificar se tem pelo menos 2 palavras (nome + sobrenome)
    if (nameParts.length < 2) {
        return { valid: false, error: 'Por favor, insira seu nome completo (nome e sobrenome).' };
    }
    
    // Verificar se cada parte tem pelo menos 2 caracteres
    const hasShortParts = nameParts.some(part => part.length < 2);
    if (hasShortParts) {
        return { valid: false, error: 'Nome e sobrenome devem ter pelo menos 2 letras cada.' };
    }
    
    // Verificar se contém apenas letras (permite acentos e espaços)
    const nameRegex = /^[A-Za-zÀ-ÿ\s]+$/;
    if (!nameRegex.test(name)) {
        return { valid: false, error: 'O nome deve conter apenas letras.' };
    }
    
    // Verificar se não é um nome genérico/fake comum
    const fakeNames = ['teste', 'test', 'aa', 'bb', 'xx', 'aaa', 'bbb', 'xxx', 'asdf', 'qwerty', 'fulano', 'ciclano'];
    const lowerName = name.toLowerCase();
    const containsFakeName = fakeNames.some(fake => lowerName.includes(fake));
    if (containsFakeName) {
        return { valid: false, error: 'Por favor, insira seu nome real.' };
    }
    
    return { valid: true };
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
