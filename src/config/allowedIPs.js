import dotenv from 'dotenv';

// Garantir que o .env seja carregado antes de ler as variáveis
dotenv.config();

// Carregar IPs autorizados do .env
const envIPs = process.env.ALLOWED_IPS 
    ? process.env.ALLOWED_IPS.split(',').map(ip => ip.trim())
    : [];

// Lista de IPs autorizados (sempre inclui localhost)
export const allowedIPs = [
    '127.0.0.1',           // localhost IPv4
    '::1',                 // localhost IPv6
    '10.244.0.0/16',       // ZeroTier Network (rede virtual segura)
    ...envIPs              // IPs adicionais do .env
];

