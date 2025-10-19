import { getClientIP, getConnectionOrigin } from '../utils/ipUtils.js';

export const getApiInfo = (req, res) => {
    // Pega o IP real considerando proxies/CDN
    const clientIp = getClientIP(req);
    const origin = getConnectionOrigin(clientIp);
    
    res.json({
        success: true,
        message: '✅ Access Granted! Welcome to the API',
        
        // Status de acesso
        access: {
            status: 'authorized',
            timestamp: new Date().toISOString(),
            origin: origin.network,
            type: origin.type,
            icon: origin.icon
        },
        
        // Informações do cliente
        client: {
            ip: clientIp,
            user_agent: req.headers['user-agent'] || 'Unknown',
            method: req.method,
            protocol: req.protocol,
            hostname: req.hostname,
            language: req.headers['accept-language'] || 'Not specified'
        },
        
        // Detalhes de IP (debug)
        ip_details: {
            detected: clientIp,                                    // IP usado para autorização
            raw: req.ip,                                          // IP que o Express vê
            forwarded_for: req.headers['x-forwarded-for'] || null, // Header X-Forwarded-For
            real_ip: req.headers['x-real-ip'] || null,            // Header X-Real-IP
            socket: req.socket.remoteAddress || null               // IP da conexão TCP
        },
        
        // Informações da API
        api: {
            name: 'API Modular - Node.js & Express',
            version: '2.1.0',
            status: 'online',
            environment: process.env.NODE_ENV || 'production',
            node_version: process.version,
            uptime: process.uptime(),
            author: 'Gilberto Romanhole'
        },
        
        // Features disponíveis
        features: [
            'Arquitetura Modular com Auto-descoberta de Rotas',
            'Controle de Acesso por IP com suporte CIDR',
            'Validação Centralizada de Dados',
            'Dashboard de Logs em Tempo Real',
            'Documentação Interativa Automática',
            'Sistema de Cache Inteligente',
            'Geolocalização de IPs',
            'Suporte a ZeroTier VPN'
        ],
        
        // Quick Links
        quick_links: {
            docs: '/docs',
            logs: '/logs',
            zerotier_status: '/zerotier/status',
            api_logs: '/api/logs',
            api_stats: '/api/logs/stats',
            api_functions: '/api/functions',
            github: 'https://github.com/gilbertoromanholew/api'
        },
        
        // Endpoints disponíveis
        endpoints: {
            root: {
                path: '/',
                method: 'GET',
                description: 'API information and status'
            },
            docs: {
                path: '/docs',
                method: 'GET',
                description: 'Interactive API documentation'
            },
            logs: {
                path: '/logs',
                method: 'GET',
                description: 'Real-time logs dashboard'
            },
            zerotier: {
                path: '/zerotier/status',
                method: 'GET',
                description: 'ZeroTier network status'
            },
            functions: {
                path: '/api/functions',
                method: 'GET',
                description: 'Auto-discovered functions list'
            }
        }
    });
};
