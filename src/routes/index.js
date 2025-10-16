export const getApiInfo = (req, res) => {
    // Pega o IP real considerando proxies/CDN (mesma lógica do ipFilter)
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                     req.headers['x-real-ip'] || 
                     req.ip;
    
    res.json({
        message: '✅ Access Granted! Welcome to the API',
        access_status: 'authorized',
        your_ip: clientIp,                    // IP real do cliente
        ip_details: {
            detected: clientIp,               // IP usado para autorização
            raw: req.ip,                      // IP que o Express vê (geralmente proxy interno)
            forwarded_for: req.headers['x-forwarded-for'] || null,
            real_ip_header: req.headers['x-real-ip'] || null
        },
        version: '2.0',
        status: 'online',
        autor: 'Gilberto Romanhole',
        
        quick_links: {
            docs: 'https://api.samm.host/docs',
            logs: 'https://api.samm.host/logs',
            github: 'https://github.com/gilbertoromanholew/api'
        }
    });
};
