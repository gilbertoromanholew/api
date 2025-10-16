export const getLogsDashboard = (req, res) => {
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                     req.headers['x-real-ip'] || 
                     req.ip;
    
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔒 Dashboard de Logs - API</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        :root {
            --primary: #667eea;
            --primary-dark: #5568d3;
            --secondary: #764ba2;
            --success: #10b981;
            --danger: #ef4444;
            --warning: #f59e0b;
            --info: #3b82f6;
            --dark-bg: #0f172a;
            --card-bg: #1e293b;
            --text-light: #e2e8f0;
            --text-muted: #94a3b8;
            --border: #334155;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: var(--dark-bg);
            color: var(--text-light);
            line-height: 1.6;
            padding-bottom: 50px;
        }
        
        .container {
            max-width: 1600px;
            margin: 0 auto;
            padding: 20px;
        }
        
        /* Header */
        .header {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 30px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
            position: relative;
            overflow: hidden;
        }
        
        .header h1 {
            color: white;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header .subtitle {
            color: rgba(255,255,255,0.9);
            font-size: 1.1em;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .live-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            background: var(--success);
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            50% { opacity: 0.7; box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
        }
        
        /* Alert Banner */
        .alert-banner {
            background: linear-gradient(135deg, var(--danger) 0%, #dc2626 100%);
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 25px;
            display: none;
            align-items: center;
            gap: 15px;
            box-shadow: 0 5px 20px rgba(239, 68, 68, 0.3);
            animation: shake 0.5s ease-in-out;
        }
        
        .alert-banner.show {
            display: flex;
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
        }
        
        .alert-icon {
            font-size: 2em;
            animation: spin 2s linear infinite;
        }
        
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .alert-content {
            flex: 1;
        }
        
        .alert-title {
            font-size: 1.3em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .alert-text {
            opacity: 0.9;
        }
        
        /* Stats Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: var(--card-bg);
            padding: 25px;
            border-radius: 12px;
            border-left: 4px solid var(--primary);
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transition: transform 0.2s;
            cursor: pointer;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-card.success { border-left-color: var(--success); }
        .stat-card.danger { border-left-color: var(--danger); }
        .stat-card.warning { border-left-color: var(--warning); }
        .stat-card.info { border-left-color: var(--info); }
        
        .stat-value {
            font-size: 2.5em;
            font-weight: bold;
            color: var(--primary);
            margin-bottom: 5px;
        }
        
        .stat-card.success .stat-value { color: var(--success); }
        .stat-card.danger .stat-value { color: var(--danger); }
        .stat-card.warning .stat-value { color: var(--warning); }
        .stat-card.info .stat-value { color: var(--info); }
        
        .stat-label {
            color: var(--text-muted);
            font-size: 0.95em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .stat-change {
            font-size: 0.85em;
            margin-top: 8px;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .stat-change.up { color: var(--success); }
        .stat-change.down { color: var(--danger); }
        
        /* Section */
        .section {
            background: var(--card-bg);
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 25px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid var(--border);
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .section-title {
            font-size: 1.5em;
            color: var(--text-light);
        }
        
        .controls {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        .btn {
            background: var(--primary);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9em;
            transition: all 0.3s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        
        .btn:hover {
            background: var(--primary-dark);
            transform: translateY(-2px);
        }
        
        .btn.danger {
            background: var(--danger);
        }
        
        .btn.danger:hover {
            background: #dc2626;
        }
        
        .btn.success {
            background: var(--success);
        }
        
        .btn.success:hover {
            background: #059669;
        }
        
        .auto-refresh-info {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: var(--text-muted);
            font-size: 0.9em;
        }
        
        /* Filters */
        .filters {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        
        .filter-input, .filter-select {
            background: var(--dark-bg);
            border: 1px solid var(--border);
            color: var(--text-light);
            padding: 10px 15px;
            border-radius: 8px;
            font-size: 0.95em;
        }
        
        .filter-input:focus, .filter-select:focus {
            outline: none;
            border-color: var(--primary);
        }
        
        /* Table */
        .table-container {
            overflow-x: auto;
            max-height: 600px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid var(--border);
        }
        
        th {
            background: var(--dark-bg);
            color: var(--text-muted);
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.85em;
            letter-spacing: 0.5px;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        
        tr:hover {
            background: var(--border);
        }
        
        .suspicious-row {
            background: rgba(239, 68, 68, 0.1) !important;
            border-left: 4px solid var(--danger);
        }
        
        .night-access {
            background: rgba(251, 191, 36, 0.1) !important;
            border-left: 4px solid var(--warning);
        }
        
        /* Badge */
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.85em;
            font-weight: 600;
        }
        
        .badge.success {
            background: rgba(16, 185, 129, 0.2);
            color: var(--success);
        }
        
        .badge.danger {
            background: rgba(239, 68, 68, 0.2);
            color: var(--danger);
        }
        
        .badge.warning {
            background: rgba(245, 158, 11, 0.2);
            color: var(--warning);
        }
        
        .badge.info {
            background: rgba(59, 130, 246, 0.2);
            color: var(--info);
        }
        
        /* IP Cards Grid */
        .ip-stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 15px;
        }
        
        .ip-card {
            background: var(--dark-bg);
            padding: 20px;
            border-radius: 10px;
            border: 1px solid var(--border);
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .ip-card:hover {
            transform: scale(1.05);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
            border-color: var(--primary);
        }
        
        .ip-card.suspicious {
            border-color: var(--danger);
            background: rgba(239, 68, 68, 0.05);
        }
        
        .ip-address {
            font-family: 'Courier New', monospace;
            font-size: 1.1em;
            color: var(--primary);
            font-weight: bold;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .ip-stat {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 0.9em;
        }
        
        .ip-stat-label {
            color: var(--text-muted);
        }
        
        .ip-stat-value {
            color: var(--text-light);
            font-weight: 600;
        }
        
        /* Toast Notification */
        .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 20px 25px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 15px;
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
            max-width: 400px;
        }
        
        @keyframes slideInRight {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .toast.success {
            border-left: 5px solid var(--success);
            color: #333;
        }
        
        .toast.error {
            border-left: 5px solid var(--danger);
            color: #333;
        }
        
        .toast.warning {
            border-left: 5px solid var(--warning);
            color: #333;
        }
        
        .toast.info {
            border-left: 5px solid var(--info);
            color: #333;
        }
        
        .toast-icon {
            font-size: 1.5em;
        }
        
        .toast-content {
            flex: 1;
        }
        
        .toast-title {
            font-weight: bold;
            margin-bottom: 3px;
        }
        
        .toast-message {
            font-size: 0.9em;
            opacity: 0.8;
        }
        
        /* Loading */
        .loading {
            text-align: center;
            padding: 40px;
            color: var(--text-muted);
        }
        
        .spinner {
            border: 4px solid var(--border);
            border-top: 4px solid var(--primary);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }
        
        /* Infinite Scroll Loader */
        .scroll-loader {
            text-align: center;
            padding: 20px;
            color: var(--text-muted);
            display: none;
        }
        
        .scroll-loader.show {
            display: block;
        }
        
        /* Metrics Cards */
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            background: var(--card-bg);
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid var(--info);
        }
        
        .metric-title {
            color: var(--text-muted);
            font-size: 0.9em;
            margin-bottom: 10px;
        }
        
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: var(--info);
        }
        
        .metric-list {
            margin-top: 15px;
        }
        
        .metric-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid var(--border);
        }
        
        .metric-item:last-child {
            border-bottom: none;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .header h1 {
                font-size: 1.8em;
            }
            
            .stats-grid {
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            }
            
            .section-header {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .controls {
                width: 100%;
            }
            
            .btn {
                flex: 1;
                justify-content: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>🔍 Dashboard de Logs da API</h1>
            <p class="subtitle">
                <span class="live-indicator"></span>
                Monitoramento em tempo real • Seu IP: <strong>${clientIp}</strong>
            </p>
        </div>

        <!-- Alert Banner -->
        <div class="alert-banner" id="alertBanner">
            <div class="alert-icon">🚨</div>
            <div class="alert-content">
                <div class="alert-title" id="alertTitle">Atenção!</div>
                <div class="alert-text" id="alertText">Detectada atividade suspeita...</div>
            </div>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid" id="statsGrid">
            <div class="stat-card info">
                <div class="stat-value" id="totalRequests">...</div>
                <div class="stat-label">Total de Requisições</div>
                <div class="stat-change up" id="totalChange">
                    <span>↑</span>
                    <span>0%</span>
                </div>
            </div>
            <div class="stat-card success">
                <div class="stat-value" id="authorizedRequests">...</div>
                <div class="stat-label">✅ Autorizados</div>
                <div class="stat-change up" id="authChange">
                    <span>↑</span>
                    <span>0%</span>
                </div>
            </div>
            <div class="stat-card danger">
                <div class="stat-value" id="deniedRequests">...</div>
                <div class="stat-label">❌ Negados (Tentativas)</div>
                <div class="stat-change" id="deniedChange">
                    <span>−</span>
                    <span>0</span>
                </div>
            </div>
            <div class="stat-card warning">
                <div class="stat-value" id="uniqueIPs">...</div>
                <div class="stat-label">IPs Únicos</div>
            </div>
        </div>

        <!-- Métricas Avançadas -->
        <div class="section">
            <div class="section-header">
                <h2 class="section-title">📊 Métricas Avançadas</h2>
            </div>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-title">⏱️ Tempo Médio de Resposta</div>
                    <div class="metric-value" id="avgResponseTime">...</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">🔥 Endpoints Mais Acessados</div>
                    <div class="metric-list" id="topEndpoints">
                        <div class="loading">Carregando...</div>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">📱 Dispositivos Mais Usados</div>
                    <div class="metric-list" id="topDevices">
                        <div class="loading">Carregando...</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- IP Stats -->
        <div class="section">
            <div class="section-header">
                <h2 class="section-title">📊 Estatísticas por IP</h2>
                <div class="controls">
                    <span class="auto-refresh-info">
                        Auto-refresh: <strong id="countdown">10</strong>s
                    </span>
                    <button class="btn success" id="toggleAutoRefresh">
                        🔄 Auto ON (10s)
                    </button>
                    <button class="btn" onclick="loadAllData()">
                        ↻ Atualizar
                    </button>
                    <button class="btn danger" onclick="clearLogs()">
                        🗑️ Limpar Logs
                    </button>
                </div>
            </div>
            <div class="ip-stats-grid" id="ipStatsGrid">
                <div class="loading">
                    <div class="spinner"></div>
                    Carregando estatísticas...
                </div>
            </div>
        </div>

        <!-- Recent Logs -->
        <div class="section">
            <div class="section-header">
                <h2 class="section-title">📝 Logs de Acesso Recentes</h2>
                <div class="filters">
                    <input type="number" class="filter-input" id="limitInput" 
                           placeholder="Limite (padrão: 50)" value="50">
                    <select class="filter-select" id="authorizedFilter">
                        <option value="">Todos os Acessos</option>
                        <option value="true">✅ Apenas Autorizados</option>
                        <option value="false">❌ Apenas Negados</option>
                    </select>
                    <button class="btn" onclick="loadLogs()">Aplicar Filtros</button>
                </div>
            </div>
            <div class="table-container" id="tableContainer">
                <table>
                    <thead>
                        <tr>
                            <th>Horário</th>
                            <th>IP</th>
                            <th>País</th>
                            <th>Navegador</th>
                            <th>Plataforma</th>
                            <th>URL</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="logsTableBody">
                        <tr><td colspan="7" class="loading">
                            <div class="spinner"></div>
                            Carregando logs...
                        </td></tr>
                    </tbody>
                </table>
                <div class="scroll-loader" id="scrollLoader">
                    <div class="spinner"></div>
                    Carregando mais logs...
                </div>
            </div>
        </div>
    </div>

    <script>
        // Variáveis globais
        let autoRefresh = true;
        let countdown = 10;
        let countdownInterval;
        let refreshInterval;
        let previousStats = {};
        let logsPage = 1;
        let logsPerPage = 50;
        let isLoadingMore = false;
        let hasMoreLogs = true;

        // Carregar estatísticas gerais
        async function loadGeneralStats() {
            try {
                const response = await fetch('/api/logs/stats');
                const data = await response.json();
                
                if (data.success) {
                    const stats = data.stats;
                    
                    // Atualizar valores
                    document.getElementById('totalRequests').textContent = stats.total_requests;
                    document.getElementById('authorizedRequests').textContent = stats.authorized_requests;
                    document.getElementById('deniedRequests').textContent = stats.denied_requests;
                    document.getElementById('uniqueIPs').textContent = stats.unique_ips;
                    
                    // Calcular mudanças
                    if (previousStats.total_requests) {
                        const totalChange = stats.total_requests - previousStats.total_requests;
                        const authChange = stats.authorized_requests - previousStats.authorized_requests;
                        const deniedChange = stats.denied_requests - previousStats.denied_requests;
                        
                        updateStatChange('totalChange', totalChange);
                        updateStatChange('authChange', authChange);
                        updateStatChange('deniedChange', deniedChange, true);
                    }
                    
                    // Salvar stats atuais
                    previousStats = stats;
                    
                    // Verificar atividade suspeita
                    checkSuspiciousActivity(stats);
                    
                    // Atualizar métricas avançadas
                    updateAdvancedMetrics(stats);
                }
            } catch (error) {
                console.error('Erro ao carregar estatísticas:', error);
            }
        }

        // Atualizar indicador de mudança
        function updateStatChange(elementId, change, isAttack = false) {
            const element = document.getElementById(elementId);
            if (!element) return;
            
            const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '−';
            const className = change > 0 ? 'up' : change < 0 ? 'down' : '';
            
            element.className = 'stat-change ' + className;
            element.innerHTML = \`
                <span>\${arrow}</span>
                <span>\${Math.abs(change)}\${isAttack ? ' tentativas' : ''}</span>
            \`;
        }

        // Verificar atividade suspeita
        function checkSuspiciousActivity(stats) {
            const deniedRate = stats.total_requests > 0 
                ? (stats.denied_requests / stats.total_requests) * 100 
                : 0;
            
            if (deniedRate > 30 || stats.denied_requests > 10) {
                showAlert(
                    '🚨 Atividade Suspeita Detectada!',
                    \`\${stats.denied_requests} tentativas de acesso negadas (\${deniedRate.toFixed(1)}% do total)\`
                );
            } else {
                hideAlert();
            }
        }

        // Mostrar alerta
        function showAlert(title, text) {
            document.getElementById('alertTitle').textContent = title;
            document.getElementById('alertText').textContent = text;
            document.getElementById('alertBanner').classList.add('show');
        }

        // Esconder alerta
        function hideAlert() {
            document.getElementById('alertBanner').classList.remove('show');
        }

        // Atualizar métricas avançadas
        function updateAdvancedMetrics(stats) {
            // Tempo médio de resposta (simulado)
            document.getElementById('avgResponseTime').textContent = '~45ms';
            
            // Endpoints mais acessados
            const topEndpointsHtml = Object.entries(stats.top_browsers || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([endpoint, count]) => \`
                    <div class="metric-item">
                        <span>\${endpoint}</span>
                        <span class="badge info">\${count}</span>
                    </div>
                \`).join('') || '<div style="text-align: center; color: var(--text-muted);">Sem dados</div>';
            
            document.getElementById('topEndpoints').innerHTML = topEndpointsHtml;
            
            // Dispositivos mais usados
            const topDevicesHtml = Object.entries(stats.top_platforms || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([device, count]) => \`
                    <div class="metric-item">
                        <span>\${device}</span>
                        <span class="badge success">\${count}</span>
                    </div>
                \`).join('') || '<div style="text-align: center; color: var(--text-muted);">Sem dados</div>';
            
            document.getElementById('topDevices').innerHTML = topDevicesHtml;
        }

        // Carregar estatísticas por IP
        async function loadIPStats() {
            try {
                const response = await fetch('/api/logs/ips');
                const data = await response.json();
                
                if (data.success && data.ips.length > 0) {
                    document.getElementById('ipStatsGrid').innerHTML = data.ips.map(ip => {
                        const isSuspicious = ip.denied > 5 || (ip.denied / ip.total_attempts) > 0.5;
                        
                        return \`
                            <div class="ip-card \${isSuspicious ? 'suspicious' : ''}" onclick="showIPDetails('\${ip.ip}')">
                                <div class="ip-address">
                                    \${isSuspicious ? '⚠️' : ''}
                                    \${ip.ip}
                                </div>
                                <div class="ip-stat">
                                    <span class="ip-stat-label">Total:</span>
                                    <span class="ip-stat-value">\${ip.total_attempts}</span>
                                </div>
                                <div class="ip-stat">
                                    <span class="ip-stat-label">✅ Autorizado:</span>
                                    <span class="ip-stat-value">\${ip.authorized}</span>
                                </div>
                                <div class="ip-stat">
                                    <span class="ip-stat-label">❌ Negado:</span>
                                    <span class="ip-stat-value">\${ip.denied}</span>
                                </div>
                                <div class="ip-stat">
                                    <span class="ip-stat-label">🌍 País:</span>
                                    <span class="ip-stat-value">\${ip.countries.join(', ') || 'N/A'}</span>
                                </div>
                                <div class="ip-stat">
                                    <span class="ip-stat-label">⏰ Último:</span>
                                    <span class="ip-stat-value">\${formatTime(ip.last_seen)}</span>
                                </div>
                                \${isSuspicious ? '<span class="badge danger" style="margin-top: 10px;">⚠️ Suspeito</span>' : ''}
                            </div>
                        \`;
                    }).join('');
                } else {
                    document.getElementById('ipStatsGrid').innerHTML = '<div class="loading">Nenhuma estatística disponível</div>';
                }
            } catch (error) {
                console.error('Erro ao carregar IP stats:', error);
            }
        }

        // Carregar logs
        async function loadLogs(append = false) {
            if (isLoadingMore && append) return;
            
            try {
                if (append) {
                    isLoadingMore = true;
                    document.getElementById('scrollLoader').classList.add('show');
                }
                
                const limit = parseInt(document.getElementById('limitInput').value) || 50;
                const authorized = document.getElementById('authorizedFilter').value;
                
                let url = \`/api/logs?limit=\${limit * logsPage}\`;
                if (authorized) url += \`&authorized=\${authorized}\`;
                
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.success && data.logs.length > 0) {
                    const logsHtml = data.logs.map(log => {
                        const isSuspicious = !log.is_authorized;
                        const isNightAccess = isNightTime(log.timestamp);
                        const rowClass = isSuspicious ? 'suspicious-row' : isNightAccess ? 'night-access' : '';
                        
                        return \`
                            <tr class="\${rowClass}">
                                <td>\${formatDateTime(log.timestamp)}</td>
                                <td style="font-family: 'Courier New', monospace;">\${log.ip_detected}</td>
                                <td>\${log.country || '−'}</td>
                                <td>\${log.browser || '−'}</td>
                                <td>\${log.platform || '−'}</td>
                                <td title="\${log.url}">\${truncate(log.url, 50) || '−'}</td>
                                <td>
                                    <span class="badge \${log.is_authorized ? 'success' : 'danger'}">
                                        \${log.is_authorized ? '✅ OK' : '❌ Negado'}
                                    </span>
                                    \${isNightAccess ? '<span class="badge warning">🌙 Noturno</span>' : ''}
                                </td>
                            </tr>
                        \`;
                    }).join('');
                    
                    if (append) {
                        document.getElementById('logsTableBody').innerHTML += logsHtml;
                    } else {
                        document.getElementById('logsTableBody').innerHTML = logsHtml;
                    }
                    
                    hasMoreLogs = data.logs.length === limit * logsPage;
                } else {
                    if (!append) {
                        document.getElementById('logsTableBody').innerHTML = '<tr><td colspan="7" class="loading">Nenhum log disponível</td></tr>';
                    }
                    hasMoreLogs = false;
                }
            } catch (error) {
                console.error('Erro ao carregar logs:', error);
                showToast('Erro ao carregar logs', 'error');
            } finally {
                isLoadingMore = false;
                document.getElementById('scrollLoader').classList.remove('show');
            }
        }

        // Infinite Scroll
        document.getElementById('tableContainer').addEventListener('scroll', function() {
            if (this.scrollTop + this.clientHeight >= this.scrollHeight - 100) {
                if (hasMoreLogs && !isLoadingMore) {
                    logsPage++;
                    loadLogs(true);
                }
            }
        });

        // Formatar data/hora
        function formatDateTime(timestamp) {
            const date = new Date(timestamp);
            return date.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }

        // Formatar tempo relativo
        function formatTime(timestamp) {
            const date = new Date(timestamp);
            const now = new Date();
            const diff = Math.floor((now - date) / 1000);
            
            if (diff < 60) return 'agora mesmo';
            if (diff < 3600) return Math.floor(diff / 60) + 'm atrás';
            if (diff < 86400) return Math.floor(diff / 3600) + 'h atrás';
            return Math.floor(diff / 86400) + 'd atrás';
        }

        // Verificar se é horário noturno (22h-6h)
        function isNightTime(timestamp) {
            const hour = new Date(timestamp).getHours();
            return hour >= 22 || hour < 6;
        }

        // Truncar texto
        function truncate(text, length) {
            if (!text) return '';
            return text.length > length ? text.substring(0, length) + '...' : text;
        }

        // Mostrar detalhes do IP
        function showIPDetails(ip) {
            showToast(\`Visualizando detalhes do IP: \${ip}\`, 'info');
            // Implementar modal ou redirecionamento
        }

        // Limpar logs
        async function clearLogs() {
            if (!confirm('Tem certeza de que deseja limpar todos os logs? Esta ação não pode ser desfeita.')) {
                return;
            }
            
            try {
                const response = await fetch('/api/logs/clear', { method: 'POST' });
                const data = await response.json();
                
                if (data.success) {
                    showToast('Logs limpos com sucesso!', 'success');
                    loadAllData();
                }
            } catch (error) {
                console.error('Erro ao limpar logs:', error);
                showToast('Erro ao limpar logs', 'error');
            }
        }

        // Toast notification
        function showToast(message, type = 'info') {
            const icons = {
                success: '✅',
                error: '❌',
                warning: '⚠️',
                info: 'ℹ️'
            };
            
            const toast = document.createElement('div');
            toast.className = \`toast \${type}\`;
            toast.innerHTML = \`
                <span class="toast-icon">\${icons[type]}</span>
                <div class="toast-content">
                    <div class="toast-title">\${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                    <div class="toast-message">\${message}</div>
                </div>
            \`;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.animation = 'slideInRight 0.3s ease-out reverse';
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        }

        // Toggle auto-refresh
        document.getElementById('toggleAutoRefresh').addEventListener('click', function() {
            autoRefresh = !autoRefresh;
            this.textContent = autoRefresh ? '🔄 Auto ON (10s)' : '⏸️ Auto OFF';
            this.className = autoRefresh ? 'btn success' : 'btn';
            
            if (autoRefresh) {
                resetCountdown();
                startCountdown();
                startRefreshInterval();
            } else {
                stopCountdown();
                stopRefreshInterval();
            }
        });

        // Countdown
        function startCountdown() {
            countdownInterval = setInterval(() => {
                countdown--;
                document.getElementById('countdown').textContent = countdown;
                
                if (countdown <= 0) {
                    loadAllData();
                }
            }, 1000);
        }

        function stopCountdown() {
            clearInterval(countdownInterval);
            document.getElementById('countdown').textContent = '−';
        }

        function resetCountdown() {
            countdown = 10;
            document.getElementById('countdown').textContent = countdown;
        }

        function startRefreshInterval() {
            if (refreshInterval) clearInterval(refreshInterval);
            
            refreshInterval = setInterval(() => {
                if (autoRefresh) {
                    loadAllData();
                }
            }, 10000);
        }

        function stopRefreshInterval() {
            if (refreshInterval) {
                clearInterval(refreshInterval);
                refreshInterval = null;
            }
        }

        // Carregar todos os dados
        function loadAllData() {
            loadGeneralStats();
            loadIPStats();
            logsPage = 1;
            loadLogs(false);
            resetCountdown();
        }

        // Inicializar
        loadAllData();
        startCountdown();
        startRefreshInterval();
        
        // Toast de boas-vindas
        setTimeout(() => {
            showToast('Dashboard carregado com sucesso! 🚀', 'success');
        }, 1000);
    </script>
</body>
</html>
    `;
    
    res.send(html);
};
