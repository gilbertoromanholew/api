import dotenv from 'dotenv';

// Garantir que o .env seja carregado antes de ler as variáveis
dotenv.config();

// Carregar IPs autorizados do .env
const envIPs = process.env.ALLOWED_IPS 
    ? process.env.ALLOWED_IPS.split(',').map(ip => ip.trim())
    : [];

// IPs permanentes (não podem ser removidos)
const permanentIPs = [
    '127.0.0.1',           // localhost IPv4
    '::1',                 // localhost IPv6
    '10.244.0.0/16'        // ZeroTier Network (rede virtual segura)
];

// IPs dinâmicos (apenas em memória - resetam ao reiniciar)
let dynamicIPs = [];

// Lista de IPs autorizados (combinação de todos)
export let allowedIPs = [
    ...permanentIPs,
    ...envIPs,
    ...dynamicIPs
];

// Adicionar IP à allowlist
export function addAllowedIP(ip, reason = '') {
    // Verificar se já existe
    if (allowedIPs.includes(ip)) {
        return { success: false, error: 'IP já está na lista de autorizados' };
    }
    
    // Adicionar aos IPs dinâmicos (apenas em memória)
    dynamicIPs.push(ip);
    
    // Atualizar lista combinada
    allowedIPs = [
        ...permanentIPs,
        ...envIPs,
        ...dynamicIPs
    ];
    
    return { 
        success: true, 
        message: `IP ${ip} adicionado à lista de autorizados`,
        ip: ip,
        reason: reason,
        timestamp: new Date().toISOString()
    };
}

// Remover IP da allowlist
export function removeAllowedIP(ip) {
    // Verificar se é IP permanente
    if (permanentIPs.includes(ip)) {
        return { success: false, error: 'Não é possível remover IPs permanentes (localhost)' };
    }
    
    // Verificar se é IP do .env
    if (envIPs.includes(ip)) {
        return { success: false, error: 'Não é possível remover IPs configurados no .env' };
    }
    
    // Verificar se existe nos dinâmicos
    if (!dynamicIPs.includes(ip)) {
        return { success: false, error: 'IP não encontrado na lista de autorizados dinâmicos' };
    }
    
    // Remover dos IPs dinâmicos (apenas em memória)
    dynamicIPs = dynamicIPs.filter(existingIP => existingIP !== ip);
    
    // Atualizar lista combinada
    allowedIPs = [
        ...permanentIPs,
        ...envIPs,
        ...dynamicIPs
    ];
    
    return { 
        success: true, 
        message: `IP ${ip} removido da lista de autorizados`,
        ip: ip,
        timestamp: new Date().toISOString()
    };
}

// Listar todos os IPs autorizados com metadados
export function getAllowedIPsList() {
    return {
        permanent: permanentIPs,
        fromEnv: envIPs,
        dynamic: dynamicIPs,
        all: allowedIPs,
        total: allowedIPs.length
    };
}

