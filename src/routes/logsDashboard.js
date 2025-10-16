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
    <title>API Access Logs Dashboard</title>
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Access Logs Dashboard</h1>
            <p class="subtitle">
                <span class="live-indicator"></span>
                Real-time monitoring | Your IP: <strong>${clientIp}</strong>
            </p>
        </div>

        <div class="stats-grid" id="statsGrid">
            <div class="loading">Loading statistics...</div>
        </div>

        <div class="section">
            <div class="section-header">
                <h2 class="section-title">📊 IP Statistics</h2>
                <div>
                    <span class="auto-refresh-info">
                        Auto-refresh: <strong id="countdown">5</strong>s
                    </span>
                    <button class="refresh-btn auto" id="toggleAutoRefresh">
                        🔄 Auto ON
                    </button>
                    <button class="refresh-btn" onclick="loadAllData()">
                        ↻ Refresh Now
                    </button>
                </div>
            </div>
            <div class="ip-stats-grid" id="ipStatsGrid">
                <div class="loading">Loading IP statistics...</div>
            </div>
        </div>

        <div class="section">
            <div class="section-header">
                <h2 class="section-title">📝 Recent Access Logs</h2>
                <div class="filters">
                    <input type="number" class="filter-input" id="limitInput" 
                           placeholder="Limit (default: 50)" value="50">
                    <select class="filter-input" id="authorizedFilter">
                        <option value="">All Access</option>
                        <option value="true">Authorized Only</option>
                        <option value="false">Denied Only</option>
                    </select>
                    <button class="refresh-btn" onclick="loadLogs()">Apply Filters</button>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>IP Address</th>
                            <th>Country</th>
                            <th>Browser</th>
                            <th>Platform</th>
                            <th>URL</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="logsTableBody">
                        <tr><td colspan="7" class="loading">Loading logs...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script>
        let autoRefresh = true;
        let countdown = 5;
        let countdownInterval;

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
                            <div class="stat-label">Total Requests</div>
                        </div>
                        <div class="stat-card success">
                            <div class="stat-value">\${stats.authorized_requests}</div>
                            <div class="stat-label">✅ Authorized</div>
                        </div>
                        <div class="stat-card danger">
                            <div class="stat-value">\${stats.denied_requests}</div>
                            <div class="stat-label">❌ Denied</div>
                        </div>
                        <div class="stat-card warning">
                            <div class="stat-value">\${stats.unique_ips}</div>
                            <div class="stat-label">Unique IPs</div>
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
                        <div class="ip-card">
                            <div class="ip-card-header">
                                <span class="ip-address">\${ip.ip}</span>
                                <span class="badge \${ip.authorized > ip.denied ? 'success' : 'danger'}">
                                    \${ip.total_attempts} attempts
                                </span>
                            </div>
                            <div class="ip-stat">
                                <span class="ip-stat-label">✅ Authorized:</span>
                                <span class="ip-stat-value">\${ip.authorized}</span>
                            </div>
                            <div class="ip-stat">
                                <span class="ip-stat-label">❌ Denied:</span>
                                <span class="ip-stat-value">\${ip.denied}</span>
                            </div>
                            <div class="ip-stat">
                                <span class="ip-stat-label">🌍 Country:</span>
                                <span class="ip-stat-value">\${ip.countries.join(', ') || 'Unknown'}</span>
                            </div>
                            <div class="ip-stat">
                                <span class="ip-stat-label">🌐 Browser:</span>
                                <span class="ip-stat-value">\${ip.browsers.join(', ') || 'Unknown'}</span>
                            </div>
                            <div class="ip-stat">
                                <span class="ip-stat-label">🖥️ Platform:</span>
                                <span class="ip-stat-value">\${ip.platforms.join(', ') || 'Unknown'}</span>
                            </div>
                            <div class="ip-stat">
                                <span class="ip-stat-label">⏰ Last Seen:</span>
                                <span class="ip-stat-value">\${new Date(ip.last_seen).toLocaleString()}</span>
                            </div>
                        </div>
                    \`).join('');
                } else {
                    document.getElementById('ipStatsGrid').innerHTML = '<div class="loading">No IP statistics available yet</div>';
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
                            <td>\${new Date(log.timestamp).toLocaleString()}</td>
                            <td style="font-family: 'Courier New', monospace;">\${log.ip_detected}</td>
                            <td>\${log.country || '-'}</td>
                            <td>\${log.browser || '-'}</td>
                            <td>\${log.platform || '-'}</td>
                            <td>\${log.url || '-'}</td>
                            <td>
                                <span class="badge \${log.is_authorized ? 'success' : 'danger'}">
                                    \${log.is_authorized ? '✅ Authorized' : '❌ Denied'}
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

        // Toggle auto-refresh
        document.getElementById('toggleAutoRefresh').addEventListener('click', function() {
            autoRefresh = !autoRefresh;
            this.textContent = autoRefresh ? '🔄 Auto ON' : '⏸️ Auto OFF';
            this.classList.toggle('auto', autoRefresh);
            
            if (autoRefresh) {
                resetCountdown();
                startCountdown();
            } else {
                stopCountdown();
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
            countdown = 5;
            document.getElementById('countdown').textContent = countdown;
        }

        // Inicialização
        loadAllData();
        startCountdown();
        
        // Atualizar dados a cada 5 segundos
        setInterval(() => {
            if (autoRefresh) {
                loadAllData();
            }
        }, 5000);
    </script>
</body>
</html>
    `;
    
    res.send(html);
};
