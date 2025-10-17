import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Garantir que o .env seja carregado antes de ler as variáveis
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Arquivo para persistir IPs autorizados dinamicamente
const ALLOWED_IPS_FILE = path.join(__dirname, '../../data/allowedIPs.json');

// Garantir que o diretório data existe
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

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

// Carregar IPs dinâmicos do arquivo
function loadDynamicIPs() {
    try {
        if (fs.existsSync(ALLOWED_IPS_FILE)) {
            const data = fs.readFileSync(ALLOWED_IPS_FILE, 'utf8');
            const parsed = JSON.parse(data);
            return parsed.ips || [];
        }
    } catch (error) {
        console.error('⚠️ Erro ao carregar IPs dinâmicos:', error.message);
    }
    return [];
}

// Salvar IPs dinâmicos no arquivo
function saveDynamicIPs(ips) {
    try {
        const data = {
            ips: ips,
            lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync(ALLOWED_IPS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('⚠️ Erro ao salvar IPs dinâmicos:', error.message);
        return false;
    }
}

// IPs dinâmicos (carregados do arquivo)
let dynamicIPs = loadDynamicIPs();

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
    
    // Adicionar aos IPs dinâmicos
    dynamicIPs.push(ip);
    
    // Salvar no arquivo
    if (!saveDynamicIPs(dynamicIPs)) {
        return { success: false, error: 'Erro ao salvar IP no arquivo' };
    }
    
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
    
    // Remover dos IPs dinâmicos
    dynamicIPs = dynamicIPs.filter(existingIP => existingIP !== ip);
    
    // Salvar no arquivo
    if (!saveDynamicIPs(dynamicIPs)) {
        return { success: false, error: 'Erro ao salvar alterações no arquivo' };
    }
    
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

