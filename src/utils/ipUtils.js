/**
 * Utilitários para manipulação de IPs
 * Centraliza lógica de extração e detecção de IPs
 */

/**
 * Extrai o IP real do cliente considerando proxies/CDN
 * @param {Object} req - Request object do Express
 * @returns {string} IP do cliente
 */
export function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0].trim() || 
           req.headers['x-real-ip'] || 
           req.ip;
}

/**
 * Remove prefixo IPv6 do IP se presente
 * @param {string} ip - Endereço IP
 * @returns {string} IP limpo
 */
export function cleanIP(ip) {
    if (!ip) return 'unknown';
    return ip.replace(/^::ffff:/, '');
}

/**
 * Verifica se IP está em range CIDR
 * @param {string} ip - IP a ser verificado
 * @param {string} cidr - Range CIDR (ex: 10.244.0.0/16)
 * @returns {boolean}
 */
export function isIPInRange(ip, cidr) {
    // Se não for CIDR (não tem /), comparar diretamente
    if (!cidr.includes('/')) {
        return ip === cidr;
    }

    const [range, bits] = cidr.split('/');
    const mask = ~(2 ** (32 - parseInt(bits)) - 1);

    const ipInt = ipToInt(ip);
    const rangeInt = ipToInt(range);

    return (ipInt & mask) === (rangeInt & mask);
}

/**
 * Converte IP string para inteiro
 * @param {string} ip - Endereço IP
 * @returns {number}
 */
function ipToInt(ip) {
    return ip.split('.').reduce((int, oct) => (int << 8) + parseInt(oct, 10), 0) >>> 0;
}

/**
 * Detecta tipo de origem da conexão
 * @param {string} ip - Endereço IP
 * @returns {Object} Informações sobre origem
 */
export function getConnectionOrigin(ip) {
    // Localhost
    if (ip === '127.0.0.1' || ip === '::1') {
        return {
            type: 'localhost',
            network: 'Localhost',
            icon: '🏠',
            color: 'blue'
        };
    }
    
    // ZeroTier VPN
    if (ip.startsWith('10.244.')) {
        return {
            type: 'zerotier',
            network: 'ZeroTier VPN (10.244.0.0/16)',
            icon: '🔐',
            color: 'green'
        };
    }
    
    // Redes privadas (RFC 1918)
    if (ip.startsWith('192.168.') || 
        ip.startsWith('10.') || 
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) {
        return {
            type: 'local',
            network: 'Rede Local Privada',
            icon: '🏢',
            color: 'yellow'
        };
    }
    
    // Internet pública
    return {
        type: 'public',
        network: 'Internet Pública',
        icon: '🌐',
        color: 'red'
    };
}
