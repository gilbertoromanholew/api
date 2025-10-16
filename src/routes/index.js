export const getApiInfo = (req, res) => {
    res.json({
        message: '✅ Access Granted! Welcome to the API',
        access_status: 'authorized',
        your_ip: req.ip,
        version: '2.0',
        status: 'online',
        
        documentation: {
            interactive_docs: {
                url: 'https://api.samm.host/docs',
                description: '📚 Visit our beautiful interactive documentation page',
                action: 'Click the link above to explore all endpoints with examples and code snippets'
            }
        },
        
        quick_links: {
            docs: 'https://api.samm.host/docs',
            github: 'https://github.com/gilbertoromanholew/api'
        }
    });
};
