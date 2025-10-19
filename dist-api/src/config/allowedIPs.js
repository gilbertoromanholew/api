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
// Estrutura: [{ ip: string, level: 'guest' | 'trusted', reason: string, authorizedAt: string }]
let dynamicIPs = [];

// Lista de IPs autorizados (combinação de todos)
export let allowedIPs = [
    ...permanentIPs,
    ...envIPs,
    ...dynamicIPs.map(entry => entry.ip)
];

// Adicionar IP à allowlist com nível de acesso
export function addAllowedIP(ip, reason = '', level = 'guest') {
    // Validar nível
    if (!['guest', 'trusted'].includes(level)) {
        return { success: false, error: 'Nível inválido. Use "guest" ou "trusted"' };
    }
    
    // Verificar se já existe (apenas o IP)
    const existingIndex = dynamicIPs.findIndex(entry => entry.ip === ip);
    
    if (existingIndex !== -1) {
        // Atualizar nível e razão do IP existente
        dynamicIPs[existingIndex] = {
            ip: ip,
            level: level,
            reason: reason,
            authorizedAt: new Date().toISOString()
        };
        
        return { 
            success: true, 
            message: `IP ${ip} atualizado para nível ${level}`,
            ip: ip,
            level: level,
            reason: reason,
            timestamp: new Date().toISOString()
        };
    }
    
    // Adicionar novo IP aos IPs dinâmicos
    dynamicIPs.push({
        ip: ip,
        level: level,
        reason: reason,
        authorizedAt: new Date().toISOString()
    });
    
    // Atualizar lista combinada
    allowedIPs = [
        ...permanentIPs,
        ...envIPs,
        ...dynamicIPs.map(entry => entry.ip)
    ];
    
    return { 
        success: true, 
        message: `IP ${ip} adicionado à lista de autorizados com nível ${level}`,
        ip: ip,
        level: level,
        reason: reason,
        timestamp: new Date().toISOString()
    };
}

// Obter nível de acesso de um IP dinâmico
export function getDynamicIPLevel(ip) {
    const entry = dynamicIPs.find(e => e.ip === ip);
    return entry ? entry.level : null;
}

// Obter informações completas de um IP dinâmico
export function getDynamicIPInfo(ip) {
    return dynamicIPs.find(e => e.ip === ip) || null;
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
    const dynamicIndex = dynamicIPs.findIndex(entry => entry.ip === ip);
    if (dynamicIndex === -1) {
        return { success: false, error: 'IP não encontrado na lista de autorizados dinâmicos' };
    }
    
    // Remover dos IPs dinâmicos (apenas em memória)
    dynamicIPs = dynamicIPs.filter(entry => entry.ip !== ip);
    
    // Atualizar lista combinada
    allowedIPs = [
        ...permanentIPs,
        ...envIPs,
        ...dynamicIPs.map(entry => entry.ip)
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

