export const getApiDocs = (req, res) => {
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📚 API - Documentação Completa</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        :root {
            /* Cores Primárias - Sistema mais contrastante */
            --primary: #2563eb;        /* Azul mais escuro e saturado */
            --primary-dark: #1e40af;   /* Azul muito escuro para hover */
            --primary-light: #3b82f6;  /* Azul claro para backgrounds */
            
            /* Cores Secundárias - Roxo escuro */
            --secondary: #7c3aed;      /* Roxo mais saturado */
            --secondary-dark: #6d28d9; /* Roxo muito escuro */
            
            /* Acento - Laranja vibrante (mais visível) */
            --accent: #f97316;         /* Laranja forte */
            --accent-dark: #ea580c;    
            
            /* Estados */
            --success: #059669;        /* Verde mais escuro */
            --success-dark: #047857;
            --danger: #dc2626;         /* Vermelho mais escuro */
            --danger-dark: #b91c1c;
            --warning: #d97706;        /* Laranja/Amarelo mais escuro */
            --warning-dark: #b45309;
            --info: #0891b2;           /* Ciano mais escuro */
            --info-dark: #0e7490;
            
            /* Métodos HTTP - Cores mais escuras e saturadas */
            --method-get: #ffffff;     /* Texto branco */
            --method-get-bg: #0891b2;  /* Fundo ciano escuro */
            --method-post: #ffffff;    /* Texto branco */
            --method-post-bg: #059669; /* Fundo verde escuro */
            --method-put: #ffffff;     /* Texto branco */
            --method-put-bg: #d97706;  /* Fundo laranja escuro */
            --method-delete: #ffffff;  /* Texto branco */
            --method-delete-bg: #dc2626; /* Fundo vermelho escuro */
            
            /* Textos - Alto contraste */
            --text-primary: #0f172a;   /* Quase preto */
            --text-secondary: #334155; /* Cinza escuro */
            --text-muted: #64748b;     /* Cinza médio */
            
            /* Backgrounds */
            --bg-primary: #ffffff;
            --bg-secondary: #f8fafc;
            --bg-tertiary: #f1f5f9;
            
            /* Bordas */
            --border: #e2e8f0;
            --border-dark: #cbd5e1;
            
            /* Modo Escuro */
            --dark-bg: #0f172a;
            --card-bg: #1e293b;
            --dark-border: #334155;
            --text-light: #e2e8f0;
            --dark-text-muted: #94a3b8;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1e40af 0%, #7c3aed 50%, #f97316 100%);
            color: var(--text-primary);
            line-height: 1.6;
            padding-bottom: 50px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        /* Header */
        .header {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            margin-bottom: 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 5px;
            background: linear-gradient(90deg, var(--primary), var(--secondary), var(--success));
        }
        
        .header h1 {
            color: var(--primary);
            font-size: 3em;
            margin-bottom: 10px;
            animation: fadeInDown 0.6s ease-out;
        }
        
        .header .version {
            color: var(--text-muted);
            font-size: 1.1em;
            margin-bottom: 15px;
        }
        
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--success);
            color: white;
            padding: 10px 25px;
            border-radius: 25px;
            font-weight: bold;
            margin-top: 10px;
            animation: pulse 2s infinite;
        }
        
        .status-dot {
            width: 10px;
            height: 10px;
            background: white;
            border-radius: 50%;
            animation: blink 1.5s infinite;
        }
        
        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }
        
        @keyframes fadeInDown {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        /* Stats Cards */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            text-align: center;
            transition: transform 0.3s, box-shadow 0.3s;
            cursor: pointer;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .stat-value {
            font-size: 2.5em;
            font-weight: bold;
            color: var(--primary);
            margin-bottom: 5px;
        }
        
        .stat-label {
            color: var(--text-muted);
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        /* Info Box */
        .info-box {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            margin-bottom: 25px;
            animation: fadeIn 0.6s ease-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .info-box h2 {
            color: var(--primary);
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 3px solid var(--primary);
            font-size: 1.8em;
        }
        
        /* IP Info */
        .ip-info {
            background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
            border-left: 5px solid var(--success);
        }
        
        .ip-detail {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid rgba(0,0,0,0.1);
        }
        
        .ip-detail:last-child {
            border-bottom: none;
        }
        
        .ip-label {
            font-weight: 600;
            color: #2e7d32;
        }
        
        .ip-value {
            font-family: 'Courier New', monospace;
            color: #1b5e20;
        }
        
        /* Functions List */
        #functionsList {
            display: grid;
            gap: 20px;
        }
        
        .function-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            border-left: 5px solid var(--primary);
            transition: all 0.3s;
        }
        
        .function-card:hover {
            border-left-color: var(--success);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            transform: translateX(5px);
        }
        
        .function-name {
            font-size: 1.5em;
            color: var(--primary);
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .function-desc {
            color: var(--text-secondary);
            margin-bottom: 15px;
        }
        
        .endpoints-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .endpoint-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-family: 'Courier New', monospace;
        }
        
        .method-get { background: var(--method-get-bg); color: var(--method-get); font-weight: 600; }
        .method-post { background: var(--method-post-bg); color: var(--method-post); font-weight: 600; }
        .method-put { background: var(--method-put-bg); color: var(--method-put); font-weight: 600; }
        .method-delete { background: var(--method-delete-bg); color: var(--method-delete); font-weight: 600; }
        
        /* Endpoint Section */
        .endpoint {
            background: var(--bg-secondary);
            padding: 25px;
            border-radius: 10px;
            margin-bottom: 20px;
            border-left: 5px solid var(--primary);
            transition: all 0.3s;
        }
        
        .endpoint:hover {
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            transform: translateX(5px);
        }
        
        .endpoint-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 15px;
            flex-wrap: wrap;
        }
        
        .method {
            padding: 8px 20px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 0.9em;
            color: white;
        }
        
        .method-post { background: var(--success); }
        .method-get { background: var(--info); }
        
        .endpoint-path {
            font-family: 'Courier New', monospace;
            font-size: 1.2em;
            color: var(--text-primary);
            font-weight: bold;
        }
        
        .endpoint-desc {
            margin: 15px 0;
            color: var(--text-secondary);
        }
        
        /* Code Block */
        .code-block {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            margin-top: 15px;
            position: relative;
        }
        
        .code-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #444;
        }
        
        .code-lang {
            color: var(--dark-text-muted);
            font-size: 0.85em;
            text-transform: uppercase;
        }
        
        .copy-btn {
            background: var(--primary);
            color: white;
            border: none;
            padding: 5px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.85em;
            transition: background 0.3s;
        }
        
        .copy-btn:hover {
            background: var(--primary-dark);
        }
        
        .copy-btn.copied {
            background: var(--success);
        }
        
        /* Tabs */
        .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            border-bottom: 2px solid var(--border);
        }
        
        .tab {
            padding: 10px 20px;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1em;
            color: var(--text-secondary);
            border-bottom: 3px solid transparent;
            transition: all 0.3s;
        }
        
        .tab:hover {
            color: var(--primary);
        }
        
        .tab.active {
            color: var(--primary);
            border-bottom-color: var(--primary);
            font-weight: bold;
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
            animation: fadeIn 0.3s;
        }
        
        /* API Explorer */
        .api-explorer {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            margin-top: 20px;
        }
        
        .explorer-form {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .form-label {
            font-weight: 600;
            color: #333;
        }
        
        .form-input, .form-select, .form-textarea {
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 6px;
            font-size: 1em;
            font-family: 'Courier New', monospace;
            transition: border-color 0.3s;
        }
        
        .form-input:focus, .form-select:focus, .form-textarea:focus {
            outline: none;
            border-color: var(--primary);
        }
        
        .form-textarea {
            min-height: 100px;
            resize: vertical;
        }
        
        .test-btn {
            background: var(--primary);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 1.1em;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .test-btn:hover {
            background: var(--primary-dark);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
        }
        
        .test-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
        }
        
        .response-box {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 20px;
            border-radius: 8px;
            margin-top: 15px;
            max-height: 400px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        
        /* Loading Animation */
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        /* Toast Notification */
        .toast {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: white;
            padding: 20px 25px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 15px;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .toast.success { border-left: 5px solid var(--success); }
        .toast.error { border-left: 5px solid var(--danger); }
        .toast.info { border-left: 5px solid var(--info); }
        
        /* Responsive */
        @media (max-width: 768px) {
            .header h1 {
                font-size: 2em;
            }
            
            .stats-grid {
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            }
            
            .endpoint-header {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .container {
                padding: 10px;
            }
            
            .info-box {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>🚀 API - Documentação Completa</h1>
            <p class="version">Versão 2.0 • Atualizada em tempo real</p>
            <div class="status-badge">
                <span class="status-dot"></span>
                <span id="apiStatus">ONLINE</span>
            </div>
        </div>

        <!-- Informações de Segurança -->
        <div class="info-box ip-info">
            <h2 style="cursor: pointer; user-select: none; display: flex; align-items: center; gap: 10px;" onclick="toggleSection('access-info')">
                <span id="access-info-icon">▶</span>
                🔒 Informações de Acesso
            </h2>
            <div id="access-info-content" style="display: none; margin-top: 15px;">
                <div class="ip-detail">
                    <span class="ip-label">Seu IP Público:</span>
                    <span class="ip-value" id="publicIP">Detectando...</span>
                </div>
                <div class="ip-detail">
                    <span class="ip-label">Status de Acesso:</span>
                    <span class="ip-value">✅ Autorizado</span>
                </div>
                <div class="ip-detail">
                    <span class="ip-label">Sistema de Segurança:</span>
                    <span class="ip-value">Filtro de IP Ativo</span>
                </div>
                <div class="ip-detail">
                    <span class="ip-label">User-Agent:</span>
                    <span class="ip-value" style="font-size: 0.85em;">${req.get('user-agent')}</span>
                </div>
            </div>
        </div>

        <!-- Sistema de Autenticação -->
        <div class="info-box">
            <h2 style="cursor: pointer; user-select: none; display: flex; align-items: center; gap: 10px;" onclick="toggleSection('auth-info')">
                <span id="auth-info-icon">▶</span>
                🔑 Sistema de Autenticação
            </h2>
            <div id="auth-info-content" style="display: none; margin-top: 15px;">
                <p><strong>Como funciona o controle de acesso:</strong></p>
                <ol style="margin-left: 20px; margin-top: 15px; line-height: 2;">
                    <li><strong>Filtro de IP:</strong> Apenas IPs autorizados podem acessar a API</li>
                    <li><strong>Lista Branca:</strong> IPs são configurados no arquivo <code>src/config/allowedIPs.js</code></li>
                    <li><strong>Logs de Acesso:</strong> Todos os acessos são registrados para auditoria</li>
                    <li><strong>Proteção Automática:</strong> IPs não autorizados recebem erro 403</li>
                </ol>
                <div class="code-block" style="margin-top: 20px;">
                    <div class="code-header">
                        <span class="code-lang">JavaScript - Exemplo de Configuração</span>
                        <button class="copy-btn" onclick="copyCode(this)">📋 Copiar</button>
                    </div>
                    <pre><code>// src/config/allowedIPs.js
export const allowedIPs = [
    '127.0.0.1',
    '::1',
    'SEU_IP_AQUI'
];</code></pre>
                </div>
            </div>
        </div>

        <!-- Funções Disponíveis -->
        <div class="info-box">
            <h2>📦 Funções Disponíveis</h2>
            <p style="margin-bottom: 20px;">Esta API possui <strong id="functionsCount">...</strong> funções carregadas dinamicamente.</p>
            
            <!-- Campo de Pesquisa -->
            <div style="margin-bottom: 20px;">
                <input 
                    type="text" 
                    id="searchFunctions" 
                    placeholder="🔍 Pesquisar funções ou endpoints..." 
                    style="width: 100%; padding: 12px 20px; border: 2px solid #dee2e6; border-radius: 8px; font-size: 1em; transition: all 0.3s;"
                    oninput="filterFunctions()"
                    onfocus="this.style.borderColor='var(--primary)'"
                    onblur="this.style.borderColor='#dee2e6'"
                >
            </div>
            
            <div id="functionsList">
                <div style="text-align: center; padding: 40px;">
                    <div class="loading"></div>
                    <p style="margin-top: 15px; color: var(--text-secondary);">Carregando funções...</p>
                </div>
            </div>
        </div>

        <!-- Links Úteis -->
        <div class="info-box">
            <h2>📚 Links Úteis</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 20px;">
                <a href="https://github.com/gilbertoromanholew/api" target="_blank" style="padding: 15px; background: #f8f9fa; border-radius: 8px; text-decoration: none; color: #333; border-left: 4px solid var(--primary); transition: all 0.3s;">
                    <strong>📂 Repositório GitHub</strong>
                    <p style="font-size: 0.9em; color: #666; margin-top: 5px;">Código fonte completo</p>
                </a>
                <a href="/" target="_blank" style="padding: 15px; background: #f8f9fa; border-radius: 8px; text-decoration: none; color: #333; border-left: 4px solid var(--success); transition: all 0.3s;">
                    <strong>📖 Documentação JSON</strong>
                    <p style="font-size: 0.9em; color: #666; margin-top: 5px;">Ver formato JSON da API</p>
                </a>
                <a href="/logs" target="_blank" style="padding: 15px; background: #f8f9fa; border-radius: 8px; text-decoration: none; color: #333; border-left: 4px solid var(--warning); transition: all 0.3s;">
                    <strong>📊 Dashboard de Logs</strong>
                    <p style="font-size: 0.9em; color: #666; margin-top: 5px;">Monitoramento em tempo real</p>
                </a>
            </div>
        </div>
    </div>

    <script>
        // Variáveis globais
        let startTime = Date.now();
        let allFunctionsData = []; // Armazenar dados de todas as funções
        let expandedFunctions = {}; // Controlar quais funções estão expandidas

        // Toggle de seções colapsáveis
        function toggleSection(sectionId) {
            const content = document.getElementById(sectionId + '-content');
            const icon = document.getElementById(sectionId + '-icon');
            
            if (content.style.display === 'none') {
                content.style.display = 'block';
                icon.textContent = '▼';
            } else {
                content.style.display = 'none';
                icon.textContent = '▶';
            }
        }

        // Detectar IP público do usuário
        async function detectPublicIP() {
            try {
                // Tentar pegar do nosso próprio endpoint de logs
                const response = await fetch('/api/logs/ips');
                const data = await response.json();
                
                if (data.success && data.ips.length > 0) {
                    // Pegar o IP mais recente (último acesso)
                    const mostRecentIP = data.ips.sort((a, b) => 
                        new Date(b.last_request) - new Date(a.last_request)
                    )[0];
                    
                    document.getElementById('publicIP').textContent = mostRecentIP.ip;
                    document.getElementById('publicIP').style.fontWeight = 'bold';
                    document.getElementById('publicIP').style.color = 'var(--success)';
                } else {
                    // Fallback: usar serviço externo
                    const ipResponse = await fetch('https://api.ipify.org?format=json');
                    const ipData = await ipResponse.json();
                    document.getElementById('publicIP').textContent = ipData.ip;
                }
            } catch (error) {
                console.error('Erro ao detectar IP público:', error);
                document.getElementById('publicIP').textContent = 'Não detectado';
                document.getElementById('publicIP').style.color = '#999';
            }
        }

        // Carregar funções disponíveis
        async function loadFunctions() {
            try {
                const response = await fetch('/api/functions');
                const data = await response.json();
                
                if (data.success && data.functions.length > 0) {
                    // Ordenar funções alfabeticamente (A-Z)
                    allFunctionsData = data.functions.sort((a, b) => 
                        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
                    );
                    
                    document.getElementById('functionsCount').textContent = allFunctionsData.length;
                    renderFunctions(allFunctionsData);
                } else {
                    document.getElementById('functionsCount').textContent = '0';
                    document.getElementById('functionsList').innerHTML = '<p style="text-align: center; color: var(--text-muted);">Nenhuma função encontrada</p>';
                }
            } catch (error) {
                console.error('Erro ao carregar funções:', error);
                document.getElementById('functionsList').innerHTML = '<p style="text-align: center; color: #ef4444;">Erro ao carregar funções</p>';
            }
        }
        
        // Renderizar funções na tela
        function renderFunctions(functions) {
            const html = functions.map((func, index) => \`
                <div class="function-card" id="func-card-\${index}" data-function-name="\${func.name.toLowerCase()}" style="transition: all 0.3s ease;">
                    <div class="function-name" style="cursor: default; user-select: text;">
                        📦 \${func.name}
                    </div>
                    <div class="function-desc">\${func.description}</div>
                    
                    \${func.endpoints.length > 0 ? \`
                        <div style="margin-top: 15px;">
                            <h4 style="color: var(--primary); margin-bottom: 10px; font-size: 0.95em;">
                                � Endpoints (\${func.endpoints.length})
                            </h4>
                            \${func.endpoints.map((ep, epIndex) => \`
                                <div class="endpoint-item" style="margin-bottom: 10px; border-left: 3px solid var(--primary); padding-left: 15px; background: #f8f9fa; border-radius: 5px;">
                                    <div 
                                        onclick="toggleEndpointDetails(\${index}, \${epIndex})" 
                                        style="cursor: pointer; padding: 12px 10px; display: flex; align-items: center; gap: 10px;"
                                    >
                                        <span id="endpoint-icon-\${index}-\${epIndex}" style="color: var(--primary); font-weight: bold;">▶</span>
                                        <span class="endpoint-badge method-\${ep.method.toLowerCase()}" style="margin: 0;">
                                            \${ep.method}
                                        </span>
                                        <span style="font-family: 'Courier New', monospace; font-size: 0.95em; flex: 1;">
                                            \${ep.path}
                                        </span>
                                    </div>
                                    
                                    <!-- Detalhes do endpoint (inicialmente oculto) -->
                                    <div id="endpoint-details-\${index}-\${epIndex}" style="display: none; padding: 20px 10px; border-top: 1px solid #dee2e6; background: white;">
                                        <!-- Será preenchido dinamicamente -->
                                    </div>
                                </div>
                            \`).join('')}
                        </div>
                    \` : '<p style="color: var(--text-muted); font-size: 0.9em; margin-top: 15px;">Nenhum endpoint encontrado</p>'}
                </div>
            \`).join('');
            
            document.getElementById('functionsList').innerHTML = html;
        }
        
        // Filtrar funções pela pesquisa
        function filterFunctions() {
            const searchTerm = document.getElementById('searchFunctions').value.toLowerCase();
            const cards = document.querySelectorAll('.function-card');
            let visibleCount = 0;
            
            cards.forEach(card => {
                const functionName = card.getAttribute('data-function-name');
                const cardText = card.textContent.toLowerCase();
                
                if (functionName.includes(searchTerm) || cardText.includes(searchTerm)) {
                    card.style.display = 'block';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });
            
            // Atualizar contador
            if (searchTerm) {
                document.getElementById('functionsCount').textContent = \`\${visibleCount} de \${allFunctionsData.length}\`;
            } else {
                document.getElementById('functionsCount').textContent = allFunctionsData.length;
            }
        }
        
        // Toggle detalhes de um endpoint específico
        function toggleEndpointDetails(funcIndex, endpointIndex) {
            const func = allFunctionsData[funcIndex];
            const endpoint = func.endpoints[endpointIndex];
            const detailsDiv = document.getElementById(\`endpoint-details-\${funcIndex}-\${endpointIndex}\`);
            const icon = document.getElementById(\`endpoint-icon-\${funcIndex}-\${endpointIndex}\`);
            
            // Se já está expandido, colapsar
            if (detailsDiv.style.display === 'block') {
                detailsDiv.style.display = 'none';
                icon.textContent = '▶';
                return;
            }
            
            // Expandir e gerar conteúdo
            icon.textContent = '▼';
            
            const uniqueId = \`endpoint-\${funcIndex}-\${endpointIndex}\`;
            const method = endpoint.method.toUpperCase();
            const path = endpoint.path;
            const fullUrl = \`https://api.samm.host\${path}\`;
            const exampleBody = getExampleBody(path, method);
            const isFileUpload = path.includes('pdf') || path.includes('upload') || path.includes('file');
            
            detailsDiv.innerHTML = \`
                <h4 style="color: var(--primary); margin-bottom: 15px;">📋 Exemplos de Uso</h4>
                
                <div class="tabs">
                    <button class="tab active" onclick="switchTab(event, '\${uniqueId}-curl')">cURL</button>
                    <button class="tab" onclick="switchTab(event, '\${uniqueId}-js')">JavaScript</button>
                    <button class="tab" onclick="switchTab(event, '\${uniqueId}-python')">Python</button>
                </div>
                
                <div id="\${uniqueId}-curl" class="tab-content active">
                    <div class="code-block">
                        <div class="code-header">
                            <span class="code-lang">cURL</span>
                            <button class="copy-btn" onclick="copyCode(this)">📋 Copiar</button>
                        </div>
                        <pre><code>\${generateCurlExample(method, fullUrl, exampleBody, isFileUpload)}</code></pre>
                    </div>
                </div>
                
                <div id="\${uniqueId}-js" class="tab-content">
                    <div class="code-block">
                        <div class="code-header">
                            <span class="code-lang">JavaScript (fetch)</span>
                            <button class="copy-btn" onclick="copyCode(this)">📋 Copiar</button>
                        </div>
                        <pre><code>\${generateJavaScriptExample(method, fullUrl, exampleBody, isFileUpload)}</code></pre>
                    </div>
                </div>
                
                <div id="\${uniqueId}-python" class="tab-content">
                    <div class="code-block">
                        <div class="code-header">
                            <span class="code-lang">Python (requests)</span>
                            <button class="copy-btn" onclick="copyCode(this)">📋 Copiar</button>
                        </div>
                        <pre><code>\${generatePythonExample(method, fullUrl, exampleBody, isFileUpload)}</code></pre>
                    </div>
                </div>
                
                <h4 style="color: var(--primary); margin: 25px 0 15px 0; cursor: pointer;" onclick="toggleTestForm('\${uniqueId}')">
                    <span id="test-form-icon-\${uniqueId}">▶</span> 🔬 Testar Endpoint
                </h4>
                <div id="test-form-\${uniqueId}" class="api-explorer" style="display: none;">
                    <div class="explorer-form">
                        <div class="form-group">
                            <label class="form-label">Endpoint:</label>
                            <input type="text" class="form-input" value="\${path}" readonly style="background: #f8f9fa;">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Método:</label>
                            <input type="text" class="form-input" value="\${method}" readonly style="background: #f8f9fa;">
                        </div>
                        
                        \${(method !== 'GET' && method !== 'DELETE') ? \`
                            <div class="form-group">
                                <label class="form-label">Body (JSON):</label>
                                <textarea class="form-textarea" id="explorer-body-\${uniqueId}" rows="6">\${JSON.stringify(exampleBody, null, 2)}</textarea>
                            </div>
                        \` : ''}
                        
                        <button class="btn-primary" onclick="executeEndpointRequest('\${uniqueId}', '\${path}', '\${method}')">
                            🚀 Executar Requisição
                        </button>
                    </div>
                    
                    <div class="explorer-response">
                        <h3 style="margin-bottom: 15px; color: var(--text-primary);">📋 Resposta:</h3>
                        <pre id="explorer-response-\${uniqueId}" style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6; min-height: 150px; overflow: auto;">Aguardando requisição...</pre>
                    </div>
                </div>
            \`;
            
            detailsDiv.style.display = 'block';
            
            // Scroll suave até o endpoint expandido
            detailsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        // Executar requisição de um endpoint específico
        async function executeEndpointRequest(uniqueId, endpoint, method) {
            const bodyTextarea = document.getElementById(\`explorer-body-\${uniqueId}\`);
            const responseContent = document.getElementById(\`explorer-response-\${uniqueId}\`);
            
            responseContent.textContent = 'Executando requisição...';
            
            try {
                let fetchOptions = {
                    method: method,
                    headers: {}
                };
                
                if (method !== 'GET' && method !== 'DELETE' && bodyTextarea) {
                    try {
                        const body = JSON.parse(bodyTextarea.value);
                        fetchOptions.headers['Content-Type'] = 'application/json';
                        fetchOptions.body = JSON.stringify(body);
                    } catch (e) {
                        throw new Error('JSON inválido no body');
                    }
                }
                
                const response = await fetch(endpoint, fetchOptions);
                const data = await response.json();
                
                responseContent.textContent = JSON.stringify(data, null, 2);
                
                if (response.ok) {
                    showToast('✅ Requisição realizada com sucesso!', 'success');
                } else {
                    showToast('❌ Requisição retornou erro', 'error');
                }
            } catch (error) {
                responseContent.textContent = 'Erro: ' + error.message;
                showToast('❌ Erro: ' + error.message, 'error');
            }
        }

        // Gerar card de exemplo para um endpoint
        function generateExampleCard(endpoint, func, uniqueId) {
            const method = endpoint.method.toUpperCase();
            const path = endpoint.path;
            const fullUrl = \`https://api.samm.host\${path}\`;
            
            // Gerar body de exemplo baseado no endpoint
            const exampleBody = getExampleBody(path, method);
            
            // Determinar se é upload de arquivo
            const isFileUpload = path.includes('pdf') || path.includes('upload') || path.includes('file');
            
            return \`
                <div class="endpoint">
                    <div class="endpoint-header">
                        <span class="method method-\${method.toLowerCase()}">\${method}</span>
                        <span class="endpoint-path">\${path}</span>
                    </div>
                    <p class="endpoint-desc"><strong>Função:</strong> \${func.name} | <strong>Descrição:</strong> \${func.description}</p>
                    
                    <div class="tabs">
                        <button class="tab active" onclick="switchTab(event, '\${uniqueId}-curl')">cURL</button>
                        <button class="tab" onclick="switchTab(event, '\${uniqueId}-js')">JavaScript</button>
                        <button class="tab" onclick="switchTab(event, '\${uniqueId}-python')">Python</button>
                    </div>
                    
                    <div id="\${uniqueId}-curl" class="tab-content active">
                        <div class="code-block">
                            <div class="code-header">
                                <span class="code-lang">cURL</span>
                                <button class="copy-btn" onclick="copyCode(this)">📋 Copiar</button>
                            </div>
                            <pre><code>\${generateCurlExample(method, fullUrl, exampleBody, isFileUpload)}</code></pre>
                        </div>
                    </div>
                    
                    <div id="\${uniqueId}-js" class="tab-content">
                        <div class="code-block">
                            <div class="code-header">
                                <span class="code-lang">JavaScript (Fetch)</span>
                                <button class="copy-btn" onclick="copyCode(this)">📋 Copiar</button>
                            </div>
                            <pre><code>\${generateJavaScriptExample(method, fullUrl, exampleBody, isFileUpload)}</code></pre>
                        </div>
                    </div>
                    
                    <div id="\${uniqueId}-python" class="tab-content">
                        <div class="code-block">
                            <div class="code-header">
                                <span class="code-lang">Python (Requests)</span>
                                <button class="copy-btn" onclick="copyCode(this)">📋 Copiar</button>
                            </div>
                            <pre><code>\${generatePythonExample(method, fullUrl, exampleBody, isFileUpload)}</code></pre>
                        </div>
                    </div>
                </div>
            \`;
        }

        // Gerar body de exemplo baseado no endpoint
        function getExampleBody(path, method) {
            if (method === 'GET') return null;
            
            // Exemplos específicos para endpoints conhecidos
            if (path.includes('cpf') || path.includes('validate-cpf')) {
                return { cpf: '12345678901' };
            }
            if (path.includes('calcular')) {
                return { operacao: 'somar', a: 10, b: 5 };
            }
            if (path.includes('pdf')) {
                return null; // File upload
            }
            
            // Exemplo genérico
            return { example: 'data' };
        }

        // Gerar exemplo cURL
        function generateCurlExample(method, url, body, isFileUpload) {
            let curl = \`curl -X \${method} \${url}\`;
            
            if (isFileUpload) {
                curl += \` \\\\\n  -F "pdf=@/caminho/para/arquivo.pdf"\`;
            } else if (body && method !== 'GET') {
                curl += \` \\\\\n  -H "Content-Type: application/json" \\\\\n  -d '\${JSON.stringify(body)}'\`;
            }
            
            return curl;
        }

        // Gerar exemplo JavaScript
        function generateJavaScriptExample(method, url, body, isFileUpload) {
            if (isFileUpload) {
                return \`const formData = new FormData();
formData.append('pdf', fileInput.files[0]);

fetch('\${url}', {
  method: '\${method}',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Erro:', error));\`;
            }
            
            if (body && method !== 'GET') {
                return \`fetch('\${url}', {
  method: '\${method}',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(\${JSON.stringify(body, null, 2)})
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Erro:', error));\`;
            }
            
            return \`fetch('\${url}')
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Erro:', error));\`;
        }

        // Gerar exemplo Python
        function generatePythonExample(method, url, body, isFileUpload) {
            if (isFileUpload) {
                return \`import requests

url = '\${url}'
files = {'pdf': open('arquivo.pdf', 'rb')}

response = requests.\${method.toLowerCase()}(url, files=files)
print(response.json())\`;
            }
            
            if (body && method !== 'GET') {
                return \`import requests

url = '\${url}'
data = \${JSON.stringify(body, null, 4).replace(/"/g, "'")}

response = requests.\${method.toLowerCase()}(url, json=data)
print(response.json())\`;
            }
            
            return \`import requests

url = '\${url}'

response = requests.\${method.toLowerCase()}(url)
print(response.json())\`;
        }

        // Toggle do formulário de teste
        function toggleTestForm(uniqueId) {
            const testForm = document.getElementById(\`test-form-\${uniqueId}\`);
            const icon = document.getElementById(\`test-form-icon-\${uniqueId}\`);
            
            if (testForm.style.display === 'none') {
                testForm.style.display = 'block';
                icon.textContent = '▼';
            } else {
                testForm.style.display = 'none';
                icon.textContent = '▶';
            }
        }

        // Switch de tabs
        function switchTab(event, tabId) {
            // Encontrar o container de tabs mais próximo
            const tabsContainer = event.target.parentElement;
            const parent = tabsContainer.parentElement;
            
            // Desativar todas as tabs e conteúdos dentro deste container
            tabsContainer.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            parent.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Ativar tab clicada
            event.target.classList.add('active');
            const targetContent = document.getElementById(tabId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        }

        // Copiar código
        function copyCode(button) {
            const codeBlock = button.closest('.code-block');
            const code = codeBlock.querySelector('pre code').textContent;
            
            navigator.clipboard.writeText(code).then(() => {
                const originalText = button.textContent;
                button.textContent = '✅ Copiado!';
                button.classList.add('copied');
                
                setTimeout(() => {
                    button.textContent = originalText;
                    button.classList.remove('copied');
                }, 2000);
                
                showToast('Código copiado para a área de transferência!', 'success');
            }).catch(err => {
                showToast('Erro ao copiar código', 'error');
            });
        }

        // Mostrar toast notification
        function showToast(message, type = 'info') {
            const toast = document.createElement('div');
            toast.className = \`toast \${type}\`;
            toast.innerHTML = \`
                <span style="font-size: 1.5em;">\${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
                <span>\${message}</span>
            \`;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.animation = 'slideIn 0.3s ease-out reverse';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        // Inicializar
        detectPublicIP();
        loadFunctions();
    </script>
</body>
</html>
    `;
    
    res.send(html);
};
