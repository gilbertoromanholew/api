import express from 'express';

const router = express.Router();

/**
 * GET /zerotier/status
 * Retorna informações sobre a rede ZeroTier e o cliente
 */
router.get('/status', (req, res) => {
    // Detectar IP do cliente
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
                     req.headers['x-real-ip'] ||
                     req.connection?.remoteAddress ||
                     req.socket?.remoteAddress ||
                     req.ip;
    
    const cleanIp = clientIp?.replace(/^::ffff:/, '') || 'unknown';
    
    // Verificar se é ZeroTier
    const isZeroTier = cleanIp.startsWith('10.244.');
    const isLocalhost = cleanIp === '127.0.0.1' || cleanIp === '::1';
    
    // Informações da rede
    const networkInfo = {
        networkId: 'fada62b01530e6b6',
        networkName: 'API Private Network',
        range: '10.244.0.0/16',
        gateway: '25.255.255.254',
        description: 'Rede virtual segura para acesso à API',
        features: [
            'Criptografia ponta-a-ponta',
            'Controle de acesso por dispositivo',
            'IP fixo independente da rede física',
            'Baixa latência (P2P quando possível)',
            'Compatível com Windows/Mac/Linux/Android/iOS'
        ]
    };
    
    res.json({
        success: true,
        client: {
            ip: cleanIp,
            isZeroTier,
            isLocalhost,
            network: isZeroTier 
                ? 'ZeroTier VPN (10.244.0.0/16)' 
                : isLocalhost
                ? 'Localhost (Desenvolvimento)'
                : 'Outra rede',
            authorized: true, // Se chegou aqui, está autorizado
            icon: isZeroTier ? '🔐' : isLocalhost ? '🏠' : '🌐'
        },
        server: {
            zerotierNetwork: networkInfo,
            allowedRanges: [
                {
                    range: '127.0.0.1',
                    description: 'Localhost (desenvolvimento)',
                    type: 'exact'
                },
                {
                    range: '::1',
                    description: 'Localhost IPv6 (desenvolvimento)',
                    type: 'exact'
                },
                {
                    range: '10.244.0.0/16',
                    description: 'ZeroTier Network (produção)',
                    type: 'cidr',
                    covers: 'IPs de 10.244.0.1 até 10.244.255.254'
                }
            ]
        },
        message: isZeroTier 
            ? '🔐 Conectado via ZeroTier - Conexão segura e criptografada!'
            : isLocalhost
            ? '🏠 Conectado via Localhost - Modo de desenvolvimento'
            : 'ℹ️ Conectado via outra rede',
        howToConnect: !isZeroTier && !isLocalhost ? {
            title: '📱 Como conectar via ZeroTier',
            steps: [
                {
                    step: 1,
                    description: 'Instalar ZeroTier no dispositivo',
                    links: {
                        windows: 'https://download.zerotier.com/dist/ZeroTier%20One.msi',
                        mac: 'https://download.zerotier.com/dist/ZeroTier%20One.pkg',
                        linux: 'curl -s https://install.zerotier.com | sudo bash',
                        android: 'https://play.google.com/store/apps/details?id=com.zerotier.one',
                        ios: 'https://apps.apple.com/app/zerotier-one/id1084101492'
                    }
                },
                {
                    step: 2,
                    description: 'Entrar na rede via CLI ou app',
                    command: 'zerotier-cli join fada62b01530e6b6',
                    note: 'No app mobile, apenas digite o Network ID e clique em Join'
                },
                {
                    step: 3,
                    description: 'Aguardar autorização do administrador',
                    dashboardUrl: 'https://my.zerotier.com/',
                    note: 'O administrador precisa marcar seu dispositivo como autorizado no dashboard'
                },
                {
                    step: 4,
                    description: 'Acessar a API usando o IP ZeroTier',
                    example: 'http://10.244.229.5:3000',
                    note: 'Use o IP ZeroTier do servidor em vez do IP público'
                }
            ]
        } : undefined,
        dashboard: {
            url: 'https://my.zerotier.com/',
            description: 'Dashboard para gerenciar dispositivos autorizados'
        }
    });
});

/**
 * GET /zerotier/devices
 * Lista dispositivos conhecidos (simulado - em produção viria do dashboard)
 */
router.get('/devices', (req, res) => {
    res.json({
        success: true,
        network: {
            id: 'fada62b01530e6b6',
            name: 'API Private Network',
            range: '10.244.0.0/16'
        },
        note: 'Para ver a lista completa de dispositivos, acesse: https://my.zerotier.com/',
        dashboard: 'https://my.zerotier.com/',
        yourIP: req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip
    });
});

export default router;
