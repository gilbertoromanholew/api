/**
 * Utilitários de Validação Unificados (Backend)
 * 
 * IMPORTANTE: Este arquivo deve ser idêntico ao do frontend
 * Localização frontend: tools-website-builder/src/utils/validation.js
 * 
 * Regras de validação compartilhadas entre frontend e backend.
 * Garante consistência e previne discrepâncias que causam bugs.
 */

/**
 * Configuração de validação de senha
 */
export const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 128,
  requireLowercase: true,
  requireUppercase: true,
  requireNumber: true,
  requireSpecial: true,
  minComplexityScore: 3,
  specialChars: '!@#$%^&*(),.?":{}|<>',
  blockedPasswords: [
    'password', 'Password', 'PASSWORD',
    '12345678', '123456789', '1234567890',
    'qwerty', 'abc123', 'password1',
    'senha123', 'senha1234', 'Senha123'
  ]
};

/**
 * Configuração de validação de CPF
 */
export const CPF_RULES = {
  length: 11,
  invalidSequences: [
    '00000000000', '11111111111', '22222222222',
    '33333333333', '44444444444', '55555555555',
    '66666666666', '77777777777', '88888888888',
    '99999999999'
  ]
};

/**
 * Configuração de validação de email
 */
export const EMAIL_RULES = {
  regex: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  maxLength: 254,
  blockedDomains: [
    'tempmail.com',
    '10minutemail.com',
    'guerrillamail.com',
    'mailinator.com',
    'throwaway.email'
  ]
};

/**
 * Configuração de validação de nome
 */
export const NAME_RULES = {
  minLength: 2,
  maxLength: 100,
  regex: /^[\p{L}\s\-']+$/u,
  minWords: 2
};

/**
 * Configuração de validação de telefone
 */
export const PHONE_RULES = {
  minLength: 10,
  maxLength: 11,
  regex: /^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/
};

/**
 * Valida senha
 */
export function validatePassword(password) {
  const errors = [];
  let score = 0;
  
  if (typeof password !== 'string') {
    return { valid: false, errors: ['Senha deve ser texto'], score: 0 };
  }
  
  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(`Senha deve ter no mínimo ${PASSWORD_RULES.minLength} caracteres`);
  }
  if (password.length > PASSWORD_RULES.maxLength) {
    errors.push(`Senha deve ter no máximo ${PASSWORD_RULES.maxLength} caracteres`);
  }
  
  const checks = {
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: new RegExp(`[${PASSWORD_RULES.specialChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`).test(password)
  };
  
  if (checks.hasLowercase) score++;
  if (checks.hasUppercase) score++;
  if (checks.hasNumber) score++;
  if (checks.hasSpecial) score++;
  
  if (score < PASSWORD_RULES.minComplexityScore) {
    const missing = [];
    if (PASSWORD_RULES.requireLowercase && !checks.hasLowercase) missing.push('letra minúscula');
    if (PASSWORD_RULES.requireUppercase && !checks.hasUppercase) missing.push('letra maiúscula');
    if (PASSWORD_RULES.requireNumber && !checks.hasNumber) missing.push('número');
    if (PASSWORD_RULES.requireSpecial && !checks.hasSpecial) missing.push('caractere especial');
    
    errors.push(`Senha deve conter pelo menos ${PASSWORD_RULES.minComplexityScore} dos seguintes: ${missing.join(', ')}`);
  }
  
  const lowerPassword = password.toLowerCase();
  if (PASSWORD_RULES.blockedPasswords.some(blocked => lowerPassword.includes(blocked.toLowerCase()))) {
    errors.push('Senha muito comum. Escolha uma senha mais forte');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    score,
    strength: getPasswordStrengthLabel(score)
  };
}

/**
 * Retorna label de força da senha
 */
export function getPasswordStrengthLabel(score) {
  const strengths = {
    0: { label: 'Muito fraca', color: 'red' },
    1: { label: 'Fraca', color: 'orange' },
    2: { label: 'Razoável', color: 'yellow' },
    3: { label: 'Boa', color: 'blue' },
    4: { label: 'Muito forte', color: 'green' }
  };
  
  return strengths[score] || strengths[0];
}

/**
 * Valida CPF
 */
export function validateCPF(cpf) {
  const errors = [];
  
  if (typeof cpf !== 'string') {
    return { valid: false, errors: ['CPF deve ser texto'] };
  }
  
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length !== CPF_RULES.length) {
    errors.push(`CPF deve ter ${CPF_RULES.length} dígitos`);
    return { valid: false, errors };
  }
  
  if (CPF_RULES.invalidSequences.includes(cleaned)) {
    errors.push('CPF inválido');
    return { valid: false, errors };
  }
  
  // Primeiro dígito
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  const digit1 = remainder >= 10 ? 0 : remainder;
  
  if (digit1 !== parseInt(cleaned.charAt(9))) {
    errors.push('CPF inválido (dígito verificador 1)');
    return { valid: false, errors };
  }
  
  // Segundo dígito
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  const digit2 = remainder >= 10 ? 0 : remainder;
  
  if (digit2 !== parseInt(cleaned.charAt(10))) {
    errors.push('CPF inválido (dígito verificador 2)');
    return { valid: false, errors };
  }
  
  return { valid: true, errors: [] };
}

/**
 * Valida email
 */
export function validateEmail(email) {
  const errors = [];
  
  if (typeof email !== 'string') {
    return { valid: false, errors: ['Email deve ser texto'] };
  }
  
  const cleaned = email.trim().toLowerCase();
  
  if (cleaned.length === 0) {
    errors.push('Email não pode estar vazio');
    return { valid: false, errors };
  }
  
  if (cleaned.length > EMAIL_RULES.maxLength) {
    errors.push(`Email deve ter no máximo ${EMAIL_RULES.maxLength} caracteres`);
  }
  
  if (!EMAIL_RULES.regex.test(cleaned)) {
    errors.push('Email inválido');
    return { valid: false, errors };
  }
  
  const domain = cleaned.split('@')[1];
  if (domain && EMAIL_RULES.blockedDomains.includes(domain)) {
    errors.push('Email descartável não permitido');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Valida nome
 */
export function validateName(name) {
  const errors = [];
  
  if (typeof name !== 'string') {
    return { valid: false, errors: ['Nome deve ser texto'] };
  }
  
  const cleaned = name.trim().replace(/\s+/g, ' ');
  
  if (cleaned.length < NAME_RULES.minLength) {
    errors.push(`Nome deve ter no mínimo ${NAME_RULES.minLength} caracteres`);
  }
  
  if (cleaned.length > NAME_RULES.maxLength) {
    errors.push(`Nome deve ter no máximo ${NAME_RULES.maxLength} caracteres`);
  }
  
  if (!NAME_RULES.regex.test(cleaned)) {
    errors.push('Nome contém caracteres inválidos. Use apenas letras, espaços, hífens e apóstrofos');
  }
  
  const words = cleaned.split(' ').filter(word => word.length > 0);
  if (words.length < NAME_RULES.minWords) {
    errors.push(`Nome deve conter pelo menos ${NAME_RULES.minWords} palavras (nome e sobrenome)`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Valida telefone
 */
export function validatePhone(phone) {
  const errors = [];
  
  if (typeof phone !== 'string') {
    return { valid: false, errors: ['Telefone deve ser texto'] };
  }
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length < PHONE_RULES.minLength) {
    errors.push(`Telefone deve ter no mínimo ${PHONE_RULES.minLength} dígitos`);
  }
  
  if (cleaned.length > PHONE_RULES.maxLength) {
    errors.push(`Telefone deve ter no máximo ${PHONE_RULES.maxLength} dígitos`);
  }
  
  if (phone.includes('(') || phone.includes('-')) {
    if (!PHONE_RULES.regex.test(phone)) {
      errors.push('Formato de telefone inválido. Use: (DD) 9XXXX-XXXX');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Valida formulário de registro completo
 */
export function validateRegistrationForm(data) {
  const errors = {};
  
  const nameValidation = validateName(data.name || data.full_name || '');
  if (!nameValidation.valid) {
    errors.name = nameValidation.errors;
  }
  
  const emailValidation = validateEmail(data.email || '');
  if (!emailValidation.valid) {
    errors.email = emailValidation.errors;
  }
  
  const cpfValidation = validateCPF(data.cpf || '');
  if (!cpfValidation.valid) {
    errors.cpf = cpfValidation.errors;
  }
  
  const passwordValidation = validatePassword(data.password || '');
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.errors;
  }
  
  if (data.phone) {
    const phoneValidation = validatePhone(data.phone);
    if (!phoneValidation.valid) {
      errors.phone = phoneValidation.errors;
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

// Exportação padrão
export default {
  PASSWORD_RULES,
  CPF_RULES,
  EMAIL_RULES,
  NAME_RULES,
  PHONE_RULES,
  validatePassword,
  validateCPF,
  validateEmail,
  validateName,
  validatePhone,
  validateRegistrationForm,
  getPasswordStrengthLabel
};
