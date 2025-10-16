export const getLogsDashboard = (req, res) => {
    // Pega o IP real do cliente
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                     req.headers['x-real-ip'] || 
                     req.ip;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🔒 Dashboard de Monitoramento de Acesso - API</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 30px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }
        
        .header h1 {
            color: white;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header .subtitle {
            color: rgba(255,255,255,0.9);
            font-size: 1.1em;
        }
        
        .live-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            background: #10b981;
            border-radius: 50%;
            animation: pulse 2s infinite;
            margin-right: 8px;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: #1e293b;
            padding: 25px;
            border-radius: 12px;
            border-left: 4px solid #667eea;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transition: transform 0.2s;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-card.success { border-left-color: #10b981; }
        .stat-card.danger { border-left-color: #ef4444; }
        .stat-card.warning { border-left-color: #f59e0b; }
        .stat-card.info { border-left-color: #3b82f6; }
        
        .stat-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        
        .stat-card.success .stat-value { color: #10b981; }
        .stat-card.danger .stat-value { color: #ef4444; }
        .stat-card.warning .stat-value { color: #f59e0b; }
        .stat-card.info .stat-value { color: #3b82f6; }
        
        .stat-label {
            color: #94a3b8;
            font-size: 0.95em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .section {
            background: #1e293b;
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
            border-bottom: 2px solid #334155;
        }
        
        .section-title {
            font-size: 1.5em;
            color: #f1f5f9;
        }
        
        .refresh-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9em;
            transition: background 0.3s;
        }
        
        .refresh-btn:hover {
            background: #5568d3;
        }
        
        .refresh-btn.auto {
            background: #10b981;
        }
        
        .refresh-btn.auto:hover {
            background: #059669;
        }
        
        .table-container {
            overflow-x: auto;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #334155;
        }
        
        th {
            background: #0f172a;
            color: #94a3b8;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.85em;
            letter-spacing: 0.5px;
        }
        
        tr:hover {
            background: #334155;
        }
        
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.85em;
            font-weight: 600;
        }
        
        .badge.success {
            background: #10b98120;
            color: #10b981;
        }
        
        .badge.danger {
            background: #ef444420;
            color: #ef4444;
        }
        
        .ip-stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 15px;
        }
        
        .ip-card {
            background: #0f172a;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #334155;
        }
        
        .ip-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .ip-address {
            font-family: 'Courier New', monospace;
            font-size: 1.1em;
            color: #667eea;
            font-weight: bold;
        }
        
        .ip-stat {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 0.9em;
        }
        
        .ip-stat-label {
            color: #94a3b8;
        }
        
        .ip-stat-value {
            color: #f1f5f9;
            font-weight: 600;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: #94a3b8;
        }
        
        .loading::after {
            content: '.';
            animation: loading 1.5s infinite;
        }
        
        @keyframes loading {
            0% { content: '.'; }
            33% { content: '..'; }
            66% { content: '...'; }
        }
        
        .auto-refresh-info {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #94a3b8;
            font-size: 0.9em;
            margin-left: 15px;
        }
        
        .filters {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        
        .filter-input {
            background: #0f172a;
            border: 1px solid #334155;
            color: #e2e8f0;
            padding: 10px 15px;
            border-radius: 8px;
            font-size: 0.95em;
        }
        
        .filter-input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .info-banner {
            background: linear-gradient(135deg, #3b82f620 0%, #667eea20 100%);
            border: 1px solid #667eea40;
            border-radius: 10px;
            padding: 15px 20px;
            margin-bottom: 25px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .info-banner-icon {
            font-size: 1.5em;
        }
        
        .info-banner-text {
            color: #cbd5e1;
            font-size: 0.95em;
        }
        
        .info-banner-text strong {
            color: #f1f5f9;
        }
        
        /* Detalhes expansíveis do IP */
        .ip-details {
            margin-top: 30px;
            background: #0f172a;
            border-radius: 15px;
            overflow: hidden;
            border: 2px solid #667eea;
            display: none;
        }
        
        .ip-details.show {
            display: block;
            animation: slideDown 0.3s ease-out;
        }
        
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .ip-details-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px 25px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .ip-details-header h3 {
            color: white;
            margin: 0;
            font-size: 1.5em;
        }
        
        .close-details-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            padding: 8px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1em;
            transition: all 0.3s ease;
        }
        
        .close-details-btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        .ip-details-body {
            padding: 25px;
        }
        
        .ip-details-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 25px;
        }
        
        .ip-details-stat-card {
            background: #1e293b;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        
        .ip-details-stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        
        .ip-details-stat-label {
            color: #94a3b8;
            font-size: 0.85em;
        }
        
        .ip-card {
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .ip-card:hover {
            transform: scale(1.05);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
            border-color: #667eea;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Access Logs Dashboard</h1>
            <p class="subtitle">
                <span class="live-indicator"></span>
                Monitoramento em tempo real (atualiza a cada 3s) | Seu IP: <strong>${clientIp}</strong>
            </p>
        </div>
        
        <div class="info-banner">
            <div class="info-banner-icon">ℹ️</div>
            <div class="info-banner-text">
                <strong>Smart Logging:</strong> This dashboard only tracks <strong>page visits</strong> (/, /docs, /logs, etc.). 
                API calls to <code>/api/*</code> and auto-refresh requests are <strong>excluded</strong> to show real visitor statistics.
            </div>
        </div>

        <div class="stats-grid" id="statsGrid">
            <div class="loading">Loading statistics...</div>
        </div>

        <div class="section">
            <div class="section-header">
                                <h2 class="section-title">📊 Estatísticas Gerais</h2>
                <div>
                    <span class="auto-refresh-info">
                        Auto-refresh: <strong id="countdown">10</strong>s
                    </span>
                    <button class="refresh-btn auto" id="toggleAutoRefresh">
                        🔄 Auto ON (10s)
                    </button>
                    <button class="refresh-btn" onclick="loadAllData()">
                        ↻ Atualizar Agora
                    </button>
                    <button class="refresh-btn" onclick="clearLogs()" style="background: #ef4444;">
                        🗑️ Limpar Logs
                    </button>
                </div>
            </div>
            <div class="ip-stats-grid" id="ipStatsGrid">
                <div class="loading">Carregando estatísticas de IP...</div>
            </div>
            
            <!-- Detalhes expansíveis do IP -->
            <div id="ipDetails" class="ip-details">
                <div class="ip-details-header">
                    <h3 id="ipDetailsTitle">Detalhes do IP</h3>
                    <button class="close-details-btn" onclick="closeIPDetails()">✕ Fechar</button>
                </div>
                <div class="ip-details-body">
                    <div class="ip-details-stats" id="ipDetailsStats"></div>
                    <h3 style="color: #f1f5f9; margin-bottom: 15px;">📋 Histórico de Acessos</h3>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Horário</th>
                                    <th>Método</th>
                                    <th>URL Acessada</th>
                                    <th>Navegador</th>
                                    <th>Plataforma</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody id="ipDetailsLogsTable">
                                <tr><td colspan="6" class="loading">Selecione um IP para ver os detalhes...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-header">
                <h2 class="section-title">📝 Logs de Acesso Recentes</h2>
                <div class="filters">
                    <input type="number" class="filter-input" id="limitInput" 
                           placeholder="Limite (padrão: 50)" value="50">
                    <select class="filter-input" id="authorizedFilter">
                        <option value="">Todos os Acessos</option>
                        <option value="true">Apenas Autorizados</option>
                        <option value="false">Apenas Negados</option>
                    </select>
                    <button class="refresh-btn" onclick="loadLogs()">Aplicar Filtros</button>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Horário</th>
                            <th>Endereço IP</th>
                            <th>País</th>
                            <th>Navegador</th>
                            <th>Plataforma</th>
                            <th>URL</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="logsTableBody">
                        <tr><td colspan="7" class="loading">Carregando logs...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script>
        let autoRefresh = true;
        let countdown = 3; // Contagem regressiva de 3 segundos
        let countdownInterval;
        let refreshInterval;

        // Carregar estatísticas gerais
        async function loadGeneralStats() {
            try {
                const response = await fetch('/api/logs/stats');
                const data = await response.json();
                
                if (data.success) {
                    const stats = data.stats;
                    document.getElementById('statsGrid').innerHTML = \`
                        <div class="stat-card info">
                            <div class="stat-value">\${stats.total_requests}</div>
                            <div class="stat-label">Total de Requisições</div>
                        </div>
                        <div class="stat-card success">
                            <div class="stat-value">\${stats.authorized_requests}</div>
                            <div class="stat-label">✅ Autorizados</div>
                        </div>
                        <div class="stat-card danger">
                            <div class="stat-value">\${stats.denied_requests}</div>
                            <div class="stat-label">❌ Negados</div>
                        </div>
                        <div class="stat-card warning">
                            <div class="stat-value">\${stats.unique_ips}</div>
                            <div class="stat-label">IPs Únicos</div>
                        </div>
                    \`;
                }
            } catch (error) {
                console.error('Error loading general stats:', error);
            }
        }

        // Carregar estatísticas por IP
        async function loadIPStats() {
            try {
                const response = await fetch('/api/logs/ips');
                const data = await response.json();
                
                if (data.success && data.ips.length > 0) {
                    document.getElementById('ipStatsGrid').innerHTML = data.ips.map(ip => \`
                        <div class="ip-card" onclick="showIPDetails('\${ip.ip}')">
                            <div class="ip-card-header">
                                <span class="ip-address">\${ip.ip}</span>
                                <span class="badge \${ip.authorized > ip.denied ? 'success' : 'danger'}">
                                    \${ip.total_attempts} tentativas
                                </span>
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
                                <span class="ip-stat-value">\${ip.countries.join(', ') || 'Desconhecido'}</span>
                            </div>
                            <div class="ip-stat">
                                <span class="ip-stat-label">🌐 Navegador:</span>
                                <span class="ip-stat-value">\${ip.browsers.join(', ') || 'Desconhecido'}</span>
                            </div>
                            <div class="ip-stat">
                                <span class="ip-stat-label">🖥️ Plataforma:</span>
                                <span class="ip-stat-value">\${ip.platforms.join(', ') || 'Desconhecido'}</span>
                            </div>
                            <div class="ip-stat">
                                <span class="ip-stat-label">⏰ Último Acesso:</span>
                                <span class="ip-stat-value">\${new Date(ip.last_seen).toLocaleString('pt-BR')}</span>
                            </div>
                            <div style="text-align: center; margin-top: 10px; color: #667eea; font-size: 0.85em;">
                                👆 Clique para ver detalhes
                            </div>
                        </div>
                    \`).join('');
                } else {
                    document.getElementById('ipStatsGrid').innerHTML = '<div class="loading">Nenhuma estatística de IP disponível ainda</div>';
                }
            } catch (error) {
                console.error('Error loading IP stats:', error);
            }
        }

        // Carregar logs recentes
        async function loadLogs() {
            try {
                const limit = document.getElementById('limitInput').value || 50;
                const authorized = document.getElementById('authorizedFilter').value;
                
                let url = \`/api/logs?limit=\${limit}\`;
                if (authorized) url += \`&authorized=\${authorized}\`;
                
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.success && data.logs.length > 0) {
                    document.getElementById('logsTableBody').innerHTML = data.logs.map(log => \`
                        <tr>
                            <td>\${new Date(log.timestamp).toLocaleString('pt-BR')}</td>
                            <td style="font-family: 'Courier New', monospace;">\${log.ip_detected}</td>
                            <td>\${log.country || '-'}</td>
                            <td>\${log.browser || '-'}</td>
                            <td>\${log.platform || '-'}</td>
                            <td>\${log.url || '-'}</td>
                            <td>
                                <span class="badge \${log.is_authorized ? 'success' : 'danger'}">
                                    \${log.is_authorized ? '✅ Autorizado' : '❌ Negado'}
                                </span>
                            </td>
                        </tr>
                    \`).join('');
                } else {
                    document.getElementById('logsTableBody').innerHTML = '<tr><td colspan="7" class="loading">No logs available yet</td></tr>';
                }
            } catch (error) {
                console.error('Error loading logs:', error);
            }
        }

        // Carregar todos os dados
        function loadAllData() {
            loadGeneralStats();
            loadIPStats();
            loadLogs();
            resetCountdown();
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
                    alert('✅ Logs limpos com sucesso!');
                    loadAllData();
                }
            } catch (error) {
                console.error('Erro ao limpar logs:', error);
                alert('❌ Erro ao limpar logs. Verifique o console para mais detalhes.');
            }
        }

        // Toggle auto-refresh
        document.getElementById('toggleAutoRefresh').addEventListener('click', function() {
            autoRefresh = !autoRefresh;
            this.textContent = autoRefresh ? '🔄 Auto ON (10s)' : '⏸️ Auto OFF';
            this.classList.toggle('auto', autoRefresh);
            
            if (autoRefresh) {
                resetCountdown();
                startCountdown();
                startRefreshInterval();
            } else {
                stopCountdown();
                stopRefreshInterval();
            }
        });

        // Countdown timer
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
            document.getElementById('countdown').textContent = '-';
        }

        function resetCountdown() {
            countdown = 10; // Aumentado para 10 segundos
            document.getElementById('countdown').textContent = countdown;
        }
        
        function startRefreshInterval() {
            // Limpar intervalo anterior se existir
            if (refreshInterval) clearInterval(refreshInterval);
            
            // Atualizar dados a cada 10 segundos
            refreshInterval = setInterval(() => {
                if (autoRefresh) {
                    loadAllData();
                }
            }, 10000); // 10 segundos
        }
        
        function stopRefreshInterval() {
            if (refreshInterval) {
                clearInterval(refreshInterval);
                refreshInterval = null;
            }
        }

        // Função para fechar detalhes do IP
        function closeIPDetails() {
            document.getElementById('ipDetails').classList.remove('show');
        }

        // Função para abrir detalhes do IP
        async function showIPDetails(ip) {
            const detailsDiv = document.getElementById('ipDetails');
            document.getElementById('ipDetailsTitle').textContent = \`Detalhes do IP: \${ip}\`;
            
            // Scroll suave até a div de detalhes
            detailsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            detailsDiv.classList.add('show');
            
            // Mostrar loading
            document.getElementById('ipDetailsStats').innerHTML = '<div class="loading">Carregando estatísticas...</div>';
            document.getElementById('ipDetailsLogsTable').innerHTML = '<tr><td colspan="6" style="text-align: center;">Carregando logs...</td></tr>';
            
            try {
                // Carregar logs específicos do IP
                const logsResponse = await fetch(\`/api/logs?ip=\${ip}\`);
                const logsData = await logsResponse.json();
                
                if (logsData.success && logsData.logs.length > 0) {
                    const logs = logsData.logs;
                    
                    // Calcular estatísticas
                    const totalAttempts = logs.length;
                    const authorized = logs.filter(l => l.is_authorized).length;
                    const denied = logs.filter(l => !l.is_authorized).length;
                    const uniqueUrls = [...new Set(logs.map(l => l.url))].length;
                    const browsers = [...new Set(logs.map(l => l.browser).filter(b => b))];
                    const platforms = [...new Set(logs.map(l => l.platform).filter(p => p))];
                    const countries = [...new Set(logs.map(l => l.country).filter(c => c))];
                    
                    // Renderizar estatísticas
                    document.getElementById('ipDetailsStats').innerHTML = \`
                        <div class="ip-details-stat-card">
                            <div class="ip-details-stat-value">\${totalAttempts}</div>
                            <div class="ip-details-stat-label">Total de Acessos</div>
                        </div>
                        <div class="ip-details-stat-card">
                            <div class="ip-details-stat-value" style="color: #10b981;">\${authorized}</div>
                            <div class="ip-details-stat-label">Autorizados</div>
                        </div>
                        <div class="ip-details-stat-card">
                            <div class="ip-details-stat-value" style="color: #ef4444;">\${denied}</div>
                            <div class="ip-details-stat-label">Negados</div>
                        </div>
                        <div class="ip-details-stat-card">
                            <div class="ip-details-stat-value">\${uniqueUrls}</div>
                            <div class="ip-details-stat-label">URLs Únicas</div>
                        </div>
                        <div class="ip-details-stat-card">
                            <div class="ip-details-stat-value">\${browsers.join(', ') || 'N/A'}</div>
                            <div class="ip-details-stat-label">Navegadores</div>
                        </div>
                        <div class="ip-details-stat-card">
                            <div class="ip-details-stat-value">\${platforms.join(', ') || 'N/A'}</div>
                            <div class="ip-details-stat-label">Plataformas</div>
                        </div>
                        <div class="ip-details-stat-card">
                            <div class="ip-details-stat-value">\${countries.join(', ') || 'N/A'}</div>
                            <div class="ip-details-stat-label">Países</div>
                        </div>
                        <div class="ip-details-stat-card">
                            <div class="ip-details-stat-value">\${new Date(logs[0].timestamp).toLocaleString('pt-BR')}</div>
                            <div class="ip-details-stat-label">Último Acesso</div>
                        </div>
                    \`;
                    
                    // Renderizar tabela de logs
                    document.getElementById('ipDetailsLogsTable').innerHTML = logs.map(log => \`
                        <tr>
                            <td>\${new Date(log.timestamp).toLocaleString('pt-BR')}</td>
                            <td><span class="badge info">\${log.method}</span></td>
                            <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="\${log.url}">\${log.url}</td>
                            <td>\${log.browser || 'N/A'}</td>
                            <td>\${log.platform || 'N/A'}</td>
                            <td><span class="badge \${log.is_authorized ? 'success' : 'danger'}">\${log.is_authorized ? 'Autorizado' : 'Negado'}</span></td>
                        </tr>
                    \`).join('');
                } else {
                    document.getElementById('ipDetailsStats').innerHTML = '<div class="loading">Nenhuma estatística disponível</div>';
                    document.getElementById('ipDetailsLogsTable').innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhum log encontrado para este IP</td></tr>';
                }
            } catch (error) {
                console.error('Erro ao carregar detalhes do IP:', error);
                document.getElementById('ipDetailsStats').innerHTML = '<div class="loading" style="color: #ef4444;">Erro ao carregar estatísticas</div>';
                document.getElementById('ipDetailsLogsTable').innerHTML = '<tr><td colspan="6" style="text-align: center; color: #ef4444;">Erro ao carregar logs</td></tr>';
            }
        }

        // Inicialização
        loadAllData();
        startCountdown();
        startRefreshInterval();
    </script>
</body>
</html>
    `;
    
    res.send(html);
};
