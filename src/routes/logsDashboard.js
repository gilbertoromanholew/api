import { getClientIP } from '../utils/ipUtils.js';

export const getLogsDashboard = (req, res) => {
    const clientIp = getClientIP(req);
    
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
            /* Cores Primárias - Azul vibrante */
            --primary: #3b82f6;
            --primary-dark: #2563eb;
            --primary-light: #60a5fa;
            
            /* Cores Secundárias - Roxo */
            --secondary: #8b5cf6;
            --secondary-dark: #7c3aed;
            
            /* Acento - Rosa/Magenta */
            --accent: #ec4899;
            --accent-dark: #db2777;
            
            /* Estados */
            --success: #10b981;
            --success-dark: #059669;
            --danger: #ef4444;
            --danger-dark: #dc2626;
            --warning: #f59e0b;
            --warning-dark: #d97706;
            --info: #06b6d4;
            --info-dark: #0891b2;
            
            /* Textos */
            --text-primary: #1e293b;
            --text-secondary: #475569;
            --text-muted: #64748b;
            
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
        
        .toast-close {
            background: none;
            border: none;
            color: #333;
            font-size: 1.2em;
            cursor: pointer;
            padding: 5px 10px;
            transition: all 0.2s;
            opacity: 0.6;
            line-height: 1;
        }
        
        .toast-close:hover {
            opacity: 1;
            transform: scale(1.2);
            color: #000;
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
        
        /* Security Tabs */
        .tabs-container {
            display: flex;
            gap: 10px;
            border-bottom: 2px solid var(--border);
            padding-bottom: 0;
            margin-bottom: 25px;
        }
        
        .tab-btn {
            background: transparent;
            color: var(--text-muted);
            border: none;
            padding: 12px 24px;
            cursor: pointer;
            font-size: 1em;
            font-weight: 500;
            transition: all 0.3s;
            border-bottom: 3px solid transparent;
            position: relative;
            bottom: -2px;
        }
        
        .tab-btn:hover {
            color: var(--text-light);
            background: rgba(102, 126, 234, 0.1);
        }
        
        .tab-btn.active {
            color: var(--primary);
            border-bottom-color: var(--primary);
        }
        
        /* Security List */
        .security-list {
            display: grid;
            gap: 15px;
        }
        
        .security-item {
            background: rgba(15, 23, 42, 0.5);
            border-radius: 10px;
            padding: 20px;
            border-left: 4px solid var(--danger);
            display: grid;
            grid-template-columns: auto 1fr auto;
            gap: 20px;
            align-items: center;
            transition: all 0.3s;
        }
        
        .security-item:hover {
            transform: translateX(5px);
            background: rgba(15, 23, 42, 0.8);
        }
        
        .security-item.blocked {
            border-left-color: var(--danger);
        }
        
        .security-item.suspended {
            border-left-color: var(--warning);
        }
        
        .security-item.warning {
            border-left-color: var(--info);
        }
        
        .security-item-icon {
            font-size: 2.5em;
        }
        
        .security-item-info {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .security-item-ip {
            font-size: 1.3em;
            font-weight: bold;
            color: var(--text-light);
            font-family: 'Courier New', monospace;
        }
        
        .security-item-details {
            color: var(--text-muted);
            font-size: 0.9em;
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }
        
        .security-item-detail {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .security-item-actions {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .security-action-btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85em;
            font-weight: 500;
            transition: all 0.3s;
            white-space: nowrap;
        }
        
        .security-action-btn.unblock {
            background: var(--success);
            color: white;
        }
        
        .security-action-btn.unblock:hover {
            background: #059669;
            transform: scale(1.05);
        }
        
        .security-action-btn.unsuspend {
            background: var(--info);
            color: white;
        }
        
        .security-action-btn.unsuspend:hover {
            background: #2563eb;
            transform: scale(1.05);
        }
        
        .security-empty {
            text-align: center;
            padding: 40px;
            color: var(--text-muted);
            font-size: 1.1em;
        }
        
        .security-empty-icon {
            font-size: 3em;
            margin-bottom: 15px;
        }
        
        .stat-description {
            color: var(--text-muted);
            font-size: 0.85em;
            margin-top: 5px;
        }
        
        /* IP Details Panel */
        .ip-details-panel {
            display: none;
            background: var(--card-bg);
            border-radius: 15px;
            padding: 30px;
            margin-top: 25px;
            border: 2px solid var(--primary);
            box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
            animation: slideDown 0.4s ease-out;
        }
        
        .ip-details-panel.show {
            display: block;
        }
        
        @keyframes slideDown {
            from { 
                transform: translateY(-20px); 
                opacity: 0; 
            }
            to { 
                transform: translateY(0); 
                opacity: 1; 
            }
        }
        
        .details-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 2px solid var(--border);
        }
        
        .details-title {
            font-size: 1.8em;
            color: var(--primary);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .details-close {
            background: var(--danger);
            border: none;
            color: white;
            font-size: 1.1em;
            padding: 10px 20px;
            cursor: pointer;
            border-radius: 8px;
            transition: all 0.3s;
            font-weight: 600;
        }
        
        .details-close:hover {
            background: #dc2626;
            transform: scale(1.05);
        }
        
        .details-body {
            color: var(--text-light);
        }
        
        .detail-section {
            margin-bottom: 25px;
        }
        
        .detail-section-title {
            font-size: 1.2em;
            color: var(--primary);
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .detail-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }
        
        .detail-item {
            background: var(--dark-bg);
            padding: 15px;
            border-radius: 8px;
            border-left: 3px solid var(--primary);
        }
        
        .detail-label {
            color: var(--text-muted);
            font-size: 0.85em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        
        .detail-value {
            color: var(--text-light);
            font-size: 1.1em;
            font-weight: 600;
            word-break: break-all;
        }
        
        .detail-list {
            list-style: none;
        }
        
        .detail-list li {
            background: var(--dark-bg);
            padding: 12px 15px;
            margin-bottom: 8px;
            border-radius: 8px;
            border-left: 3px solid var(--info);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .detail-list li:hover {
            background: var(--border);
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
            
            .ip-details-panel {
                padding: 20px;
            }
            
            .details-title {
                font-size: 1.4em;
            }
            
            .detail-grid {
                grid-template-columns: 1fr;
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
                    <div class="metric-title">🌐 Navegadores Mais Usados</div>
                    <div class="metric-list" id="topBrowsers">
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
            
            <!-- Painel de Detalhes do IP -->
            <div class="ip-details-panel" id="ipDetailsPanel">
                <div class="details-header">
                    <h2 class="details-title">
                        <span>🔍</span>
                        <span id="detailsIPAddress">Detalhes do IP</span>
                    </h2>
                    <button class="details-close" onclick="closeIPDetails()">✖ Fechar</button>
                </div>
                <div class="details-body" id="detailsBody">
                    <!-- Conteúdo será preenchido dinamicamente -->
                </div>
            </div>
        </div>

        <!-- Security & Blocking System -->
        <div class="section">
            <div class="section-header">
                <h2 class="section-title" style="cursor: pointer; user-select: none; display: flex; align-items: center; gap: 10px;" onclick="toggleSecuritySection()">
                    <span id="security-section-icon">▼</span>
                    🛡️ Sistema de Segurança
                    <span class="badge badge-info" id="security-status-badge">Carregando...</span>
                </h2>
            </div>
            <div id="security-section-content" style="display: block; padding-top: 20px;">
                
                <!-- Estatísticas de Segurança -->
                <div class="stats-grid" style="margin-bottom: 30px;">
                    <div class="stat-card danger">
                        <div class="stat-label">🚫 IPs Bloqueados</div>
                        <div class="stat-value" id="security-blocked-count">0</div>
                        <div class="stat-description">Bloqueio permanente</div>
                    </div>
                    <div class="stat-card warning">
                        <div class="stat-label">⏳ IPs Suspensos</div>
                        <div class="stat-value" id="security-suspended-count">0</div>
                        <div class="stat-description">Suspensão temporária</div>
                    </div>
                    <div class="stat-card info">
                        <div class="stat-label">⚠️ IPs com Avisos</div>
                        <div class="stat-value" id="security-warnings-count">0</div>
                        <div class="stat-description">Tentativas registradas</div>
                    </div>
                    <div class="stat-card success">
                        <div class="stat-label">✅ Status do Sistema</div>
                        <div class="stat-value" style="font-size: 1.5em;">ATIVO</div>
                        <div class="stat-description">Proteção automática</div>
                    </div>
                </div>

                <!-- Configurações do Sistema -->
                <div class="info-box" style="margin-bottom: 30px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1)); border-left: 4px solid var(--info);">
                    <h3 style="margin-bottom: 15px; font-size: 1.2em;">⚙️ Configurações de Proteção</h3>
                    <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                        <div>
                            <div style="color: var(--text-muted); font-size: 0.9em;">Tentativas antes de suspensão</div>
                            <div style="font-size: 1.5em; font-weight: bold; color: var(--warning);" id="security-config-max-attempts">5</div>
                        </div>
                        <div>
                            <div style="color: var(--text-muted); font-size: 0.9em;">Duração da suspensão</div>
                            <div style="font-size: 1.5em; font-weight: bold; color: var(--warning);" id="security-config-suspension">60 min</div>
                        </div>
                        <div>
                            <div style="color: var(--text-muted); font-size: 0.9em;">Suspensões antes de bloqueio</div>
                            <div style="font-size: 1.5em; font-weight: bold; color: var(--danger);" id="security-config-max-suspensions">3</div>
                        </div>
                        <div>
                            <div style="color: var(--text-muted); font-size: 0.9em;">Tentativas para bloqueio direto</div>
                            <div style="font-size: 1.5em; font-weight: bold; color: var(--danger);" id="security-config-block-attempts">10</div>
                        </div>
                    </div>
                </div>

                <!-- Tabs para diferentes categorias -->
                <div class="tabs-container" style="margin-bottom: 20px;">
                    <button class="tab-btn active" data-tab="blocked" onclick="switchSecurityTab('blocked')">
                        🚫 Bloqueados (<span id="tab-blocked-count">0</span>)
                    </button>
                    <button class="tab-btn" data-tab="suspended" onclick="switchSecurityTab('suspended')">
                        ⏳ Suspensos (<span id="tab-suspended-count">0</span>)
                    </button>
                    <button class="tab-btn" data-tab="warnings" onclick="switchSecurityTab('warnings')">
                        ⚠️ Avisos (<span id="tab-warnings-count">0</span>)
                    </button>
                </div>

                <!-- Conteúdo das tabs -->
                <div id="security-tab-blocked" class="security-tab-content" style="display: block;">
                    <div id="blocked-ips-list" class="security-list">
                        <!-- Será preenchido dinamicamente -->
                    </div>
                </div>

                <div id="security-tab-suspended" class="security-tab-content" style="display: none;">
                    <div id="suspended-ips-list" class="security-list">
                        <!-- Será preenchido dinamicamente -->
                    </div>
                </div>

                <div id="security-tab-warnings" class="security-tab-content" style="display: none;">
                    <div id="warnings-ips-list" class="security-list">
                        <!-- Será preenchido dinamicamente -->
                    </div>
                </div>

            </div>
        </div>

        <!-- ZeroTier Status -->
        <div class="section">
            <div class="section-header">
                <h2 class="section-title" style="cursor: pointer; user-select: none; display: flex; align-items: center; gap: 10px;" onclick="toggleZeroTierSection()">
                    <span id="zerotier-section-icon">▶</span>
                    🔐 Rede ZeroTier
                    <span class="badge badge-success" id="zt-status-badge">Verificando...</span>
                </h2>
            </div>
            <div id="zerotier-section-content" style="display: none; padding-top: 20px;">
                <div class="stats-grid">
                    <div class="stat-card info">
                        <div class="stat-label">🌐 Network ID</div>
                        <div class="stat-value" style="font-size: 1.2em;">fada62b01530e6b6</div>
                    </div>
                    <div class="stat-card info">
                        <div class="stat-label">📡 Range IP</div>
                        <div class="stat-value" style="font-size: 1.5em;">10.244.0.0/16</div>
                    </div>
                    <div class="stat-card success">
                        <div class="stat-label">💻 Seu IP ZT</div>
                        <div class="stat-value" style="font-size: 1.5em;" id="zt-client-ip">--.--.--.--</div>
                    </div>
                    <div class="stat-card success">
                        <div class="stat-label">🔒 Status</div>
                        <div class="stat-value" style="font-size: 1.5em;" id="zt-connection-status">Verificando...</div>
                    </div>
                </div>
                
                <div style="margin-top: 20px; padding: 20px; background: rgba(102, 126, 234, 0.1); border-radius: 12px; border-left: 4px solid var(--info);">
                    <h3 style="margin: 0 0 15px 0; font-size: 16px; color: var(--info);">📱 Como adicionar novo dispositivo:</h3>
                    <ol style="margin: 0; padding-left: 25px; font-size: 14px; line-height: 2;">
                        <li><strong>Instalar ZeroTier</strong> no dispositivo
                            <br><span style="font-size: 12px; color: var(--text-muted);">
                                Windows: <a href="https://download.zerotier.com/dist/ZeroTier%20One.msi" target="_blank" style="color: var(--info);">Download MSI</a> | 
                                Android: <a href="https://play.google.com/store/apps/details?id=com.zerotier.one" target="_blank" style="color: var(--info);">Play Store</a> | 
                                iOS: <a href="https://apps.apple.com/app/zerotier-one/id1084101492" target="_blank" style="color: var(--info);">App Store</a>
                            </span>
                        </li>
                        <li><strong>Entrar na rede:</strong> <code style="background: var(--dark-bg); padding: 4px 8px; border-radius: 4px;">zerotier-cli join fada62b01530e6b6</code>
                            <br><span style="font-size: 12px; color: var(--text-muted);">No mobile: digitar o Network ID e clicar em "Join"</span>
                        </li>
                        <li><strong>Autorizar</strong> no <a href="https://my.zerotier.com" target="_blank" style="color: var(--info);">Dashboard ZeroTier</a>
                            <br><span style="font-size: 12px; color: var(--text-muted);">Marcar checkbox "Auth" ✅ para o novo dispositivo</span>
                        </li>
                        <li><strong>Pronto!</strong> Acesso automático à API via IP ZeroTier</li>
                    </ol>
                </div>
                
                <div style="margin-top: 15px; padding: 15px; background: rgba(16, 185, 129, 0.1); border-radius: 12px; border-left: 4px solid var(--success);">
                    <h4 style="margin: 0 0 10px 0; font-size: 14px; color: var(--success);">✅ Vantagens do ZeroTier:</h4>
                    <ul style="margin: 0; padding-left: 25px; font-size: 13px; line-height: 1.8; color: var(--text-muted);">
                        <li><strong>Segurança:</strong> Criptografia ponta-a-ponta automática</li>
                        <li><strong>Controle:</strong> Você escolhe quem tem acesso (dashboard web)</li>
                        <li><strong>Mobilidade:</strong> Mesmo IP independente da rede física</li>
                        <li><strong>Simplicidade:</strong> Um clique para bloquear/desbloquear dispositivos</li>
                        <li><strong>Performance:</strong> Conexão P2P quando possível (baixa latência)</li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Recent Logs -->
        <div class="section">
            <div class="section-header">
                <h2 class="section-title" style="cursor: pointer; user-select: none; display: flex; align-items: center; gap: 10px;" onclick="toggleLogsSection()">
                    <span id="logs-section-icon">▶</span>
                    📝 Logs de Acesso Recentes
                </h2>
                <div class="filters" id="logs-controls" style="display: none;">
                    <input type="number" class="filter-input" id="limitInput" 
                           placeholder="Limite (padrão: 50)" value="50" onchange="loadLogs()">
                    <select class="filter-select" id="authorizedFilter" onchange="loadLogs()">
                        <option value="">Todos os Acessos</option>
                        <option value="true">✅ Apenas Autorizados</option>
                        <option value="false">❌ Apenas Negados</option>
                    </select>
                </div>
            </div>
            <div class="table-container" id="tableContainer" style="display: none;">
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
        let countdown = 3;
        let countdownInterval;
        let refreshInterval;
        let previousStats = {};
        let logsPage = 1;
        let logsPerPage = 50;
        let isLoadingMore = false;
        let hasMoreLogs = true;
        let currentOpenIP = null; // IP do modal aberto (para auto-refresh)
        let ipStatsLimit = 12; // Limite de cards visíveis
        let showAllIPs = false; // Estado de expansão da seção de IPs
        let myIP = null; // IP do usuário atual
        
        // Estados de expansão dos cards (preservar durante refresh)
        let expandedMetrics = {}; // {metricId: true/false}
        let expandedIPCards = {}; // {ip: {browsers: true/false, platforms: true/false, endpoints: true/false}}

        // Detectar IP do usuário ao carregar a página
        async function detectMyIP() {
            try {
                // Fazer uma requisição para qualquer endpoint para que o servidor registre
                const response = await fetch('/api/logs/stats');
                const data = await response.json();
                
                // Buscar IPs registrados
                const ipsResponse = await fetch('/api/logs/ips');
                const ipsData = await ipsResponse.json();
                
                if (ipsData.success && ipsData.ips.length > 0) {
                    // O IP mais recente provavelmente é o meu
                    const sortedIPs = ipsData.ips.sort((a, b) => 
                        new Date(b.last_seen) - new Date(a.last_seen)
                    );
                    myIP = sortedIPs[0].ip;
                    console.log(\`🏠 Meu IP detectado: \${myIP}\`);
                }
            } catch (error) {
                console.error('Erro ao detectar meu IP:', error);
            }
        }

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

        // Estado de expansão dos cards
        const cardStates = {
            endpoints: false,
            browsers: false,
            devices: false
        };

        // Atualizar métricas avançadas
        function updateAdvancedMetrics(stats) {
            // Tempo médio de resposta (simulado)
            document.getElementById('avgResponseTime').textContent = '~45ms';
            
            // Endpoints mais acessados (URLs reais)
            renderExpandableMetric(
                'topEndpoints',
                stats.top_endpoints || {},
                'endpoints',
                'info',
                (url) => \`<span style="font-family: 'Courier New', monospace; font-size: 0.9em;">\${url}</span>\`
            );
            
            // Navegadores mais usados
            renderExpandableMetric(
                'topBrowsers',
                stats.top_browsers || {},
                'browsers',
                'success'
            );
            
            // Dispositivos mais usados (plataformas)
            renderExpandableMetric(
                'topDevices',
                stats.top_platforms || {},
                'devices',
                'warning'
            );
        }

        // Renderizar métrica com expansão
        function renderExpandableMetric(elementId, data, stateKey, badgeClass, labelFormatter = null) {
            const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
            const isExpanded = cardStates[stateKey];
            const itemsToShow = isExpanded ? entries : entries.slice(0, 3);
            const hasMore = entries.length > 3;
            
            if (entries.length === 0) {
                document.getElementById(elementId).innerHTML = 
                    '<div style="text-align: center; color: var(--text-muted); padding: 10px;">Sem dados</div>';
                return;
            }
            
            const itemsHtml = itemsToShow.map(([label, count]) => {
                const displayLabel = labelFormatter ? labelFormatter(label) : \`<span>\${label}</span>\`;
                return \`
                    <div class="metric-item">
                        \${displayLabel}
                        <span class="badge \${badgeClass}">\${count}</span>
                    </div>
                \`;
            }).join('');
            
            const toggleButton = hasMore ? \`
                <button 
                    class="btn-expand" 
                    onclick="toggleMetricCard('\${stateKey}')"
                    style="margin-top: 10px; width: 100%; padding: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; color: #fff; cursor: pointer; font-size: 0.85em; transition: all 0.3s ease;"
                    onmouseover="this.style.background='rgba(255,255,255,0.15)'"
                    onmouseout="this.style.background='rgba(255,255,255,0.1)'"
                >
                    \${isExpanded ? '▲ Ver menos' : \`▼ Ver todos (\${entries.length})\`}
                </button>
            \` : '';
            
            document.getElementById(elementId).innerHTML = itemsHtml + toggleButton;
        }

        // Alternar expansão de card
        function toggleMetricCard(stateKey) {
            cardStates[stateKey] = !cardStates[stateKey];
            // Re-renderizar usando os dados já carregados
            loadGeneralStats();
        }

        // Carregar estatísticas por IP
        async function loadIPStats() {
            try {
                const response = await fetch('/api/logs/ips');
                const data = await response.json();
                
                if (data.success && data.ips.length > 0) {
                    let allIPs = data.ips;
                    
                    // Separar meu IP do resto
                    let myIPData = null;
                    let otherIPs = [];
                    
                    allIPs.forEach(ip => {
                        if (ip.ip === myIP) {
                            myIPData = ip;
                        } else {
                            otherIPs.push(ip);
                        }
                    });
                    
                    // Se meu IP foi identificado, colocar no topo
                    if (myIPData) {
                        allIPs = [myIPData, ...otherIPs];
                    } else {
                        allIPs = otherIPs;
                    }
                    
                    const visibleIPs = showAllIPs ? allIPs : allIPs.slice(0, ipStatsLimit);
                    const hasMoreIPs = allIPs.length > ipStatsLimit;
                    
                    document.getElementById('ipStatsGrid').innerHTML = visibleIPs.map(ip => {
                        const isSuspicious = ip.denied > 5 || (ip.denied / ip.total_attempts) > 0.5;
                        const isMyIP = ip.ip === myIP;
                        
                        return \`
                            <div class="ip-card \${isSuspicious ? 'suspicious' : ''} \${isMyIP ? 'my-ip' : ''}" style="\${isMyIP ? 'border: 2px solid var(--success); box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);' : ''}">
                                <div style="cursor: pointer;" onclick="showIPDetails('\${ip.ip}')">
                                    <div class="ip-address">
                                        \${isMyIP ? '🏠 ' : ''}\${isSuspicious ? '⚠️ ' : ''}
                                        \${ip.ip}
                                        \${isMyIP ? '<span class="badge success" style="margin-left: 8px; font-size: 0.75em;">VOCÊ</span>' : ''}
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
                                        <span class="ip-stat-value">\${ip.countries && ip.countries.length > 0 ? ip.countries.join(', ') : 'Desconhecido'}</span>
                                    </div>
                                    <div class="ip-stat">
                                        <span class="ip-stat-label">⏰ Último:</span>
                                        <span class="ip-stat-value">\${formatTime(ip.last_seen)}</span>
                                    </div>
                                    \${isSuspicious ? '<span class="badge danger" style="margin-top: 10px;">⚠️ Suspeito</span>' : ''}
                                </div>
                                \${!isMyIP ? \`
                                    <div class="ip-card-actions" style="display: flex; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);">
                                        <button 
                                            onclick="event.stopPropagation(); suspendIPManual('\${ip.ip}')" 
                                            class="ip-action-btn suspend"
                                            style="flex: 1; padding: 8px; background: var(--warning); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: 600; transition: all 0.3s;"
                                            onmouseover="this.style.background='#d97706'"
                                            onmouseout="this.style.background='var(--warning)'"
                                            title="Suspender por 1 hora"
                                        >
                                            ⏳ Suspender
                                        </button>
                                        <button 
                                            onclick="event.stopPropagation(); blockIPManual('\${ip.ip}')" 
                                            class="ip-action-btn block"
                                            style="flex: 1; padding: 8px; background: var(--danger); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: 600; transition: all 0.3s;"
                                            onmouseover="this.style.background='#dc2626'"
                                            onmouseout="this.style.background='var(--danger)'"
                                            title="Bloquear permanentemente"
                                        >
                                            🚫 Bloquear
                                        </button>
                                    </div>
                                \` : ''}
                            </div>
                        \`;
                    }).join('') + (hasMoreIPs && !showAllIPs ? \`
                        <button 
                            class="btn-expand-ips" 
                            onclick="toggleAllIPs(event)"
                            style="grid-column: 1 / -1; padding: 15px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%); border: 2px dashed rgba(99, 102, 241, 0.3); border-radius: 12px; color: #fff; cursor: pointer; font-size: 1em; font-weight: 600; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 10px;"
                            onmouseover="this.style.background='linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)'; this.style.borderColor='rgba(99, 102, 241, 0.5)'"
                            onmouseout="this.style.background='linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)'; this.style.borderColor='rgba(99, 102, 241, 0.3)'"
                        >
                            <span style="font-size: 1.2em;">▼</span>
                            Ver todos os \${allIPs.length} IPs
                        </button>
                    \` : hasMoreIPs ? \`
                        <button 
                            class="btn-expand-ips" 
                            onclick="toggleAllIPs(event)"
                            style="grid-column: 1 / -1; padding: 15px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%); border: 2px dashed rgba(99, 102, 241, 0.3); border-radius: 12px; color: #fff; cursor: pointer; font-size: 1em; font-weight: 600; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 10px;"
                            onmouseover="this.style.background='linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)'; this.style.borderColor='rgba(99, 102, 241, 0.5)'"
                            onmouseout="this.style.background='linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)'; this.style.borderColor='rgba(99, 102, 241, 0.3)'"
                        >
                            <span style="font-size: 1.2em;">▲</span>
                            Ver menos (mostrar apenas \${ipStatsLimit})
                        </button>
                    \` : '');
                    
                    // Se o modal está aberto, atualizar também
                    if (currentOpenIP) {
                        refreshIPDetails(currentOpenIP);
                    }
                } else {
                    document.getElementById('ipStatsGrid').innerHTML = '<div class="loading">Nenhuma estatística disponível</div>';
                }
            } catch (error) {
                console.error('Erro ao carregar IP stats:', error);
            }
        }

        // Alternar visualização de todos os IPs
        function toggleAllIPs(event) {
            if (event) event.stopPropagation();
            showAllIPs = !showAllIPs;
            loadIPStats();
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
                        
                        // Formatar localização com bandeira
                        const countryFlag = log.countryCode ? getFlagEmoji(log.countryCode) : '🌍';
                        const location = log.city && log.country 
                            ? \`\${countryFlag} \${log.city}, \${log.country}\`
                            : log.country 
                            ? \`\${countryFlag} \${log.country}\`
                            : '🌍 Desconhecido';
                        
                        return \`
                            <tr class="\${rowClass}">
                                <td>\${formatDateTime(log.timestamp)}</td>
                                <td style="font-family: 'Courier New', monospace;">\${log.ip_detected || '−'}</td>
                                <td>\${location}</td>
                                <td>\${log.browser || 'Desconhecido'}</td>
                                <td>\${log.platform || 'Desconhecido'}</td>
                                <td title="\${log.url || ''}">\${truncate(log.url, 50) || '−'}</td>
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

        // Converter código de país para emoji de bandeira
        function getFlagEmoji(countryCode) {
            if (!countryCode || countryCode === 'LOCAL') return '🏠';
            const codePoints = countryCode
                .toUpperCase()
                .split('')
                .map(char => 127397 + char.charCodeAt());
            return String.fromCodePoint(...codePoints);
        }

        // Mostrar detalhes do IP
        async function showIPDetails(ip) {
            currentOpenIP = ip; // Salvar IP aberto para auto-refresh
            showToast(\`Carregando detalhes do IP: \${ip}\`, 'info');
            await refreshIPDetails(ip);
            document.getElementById('ipDetailsPanel').classList.add('show');
        }

        // Atualizar detalhes do IP (usado no auto-refresh)
        async function refreshIPDetails(ip) {
            try {
                // Buscar logs específicos deste IP
                const response = await fetch(\`/api/logs?ip=\${encodeURIComponent(ip)}\`);
                const data = await response.json();
                
                if (data.success && data.logs) {
                    const ipLogs = data.logs;
                    
                    // Calcular estatísticas
                    const totalRequests = ipLogs.length;
                    const authorized = ipLogs.filter(log => log.is_authorized).length;
                    const denied = totalRequests - authorized;
                    const endpoints = [...new Set(ipLogs.map(log => log.url).filter(u => u))];
                    const browsers = [...new Set(ipLogs.map(log => log.browser || 'Desconhecido').filter(b => b))];
                    const platforms = [...new Set(ipLogs.map(log => log.platform || 'Desconhecido').filter(p => p))];
                    
                    // Primeira e última requisição
                    const sortedLogs = ipLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                    const firstRequest = sortedLogs[0];
                    const lastRequest = sortedLogs[sortedLogs.length - 1];
                    
                    // Montar HTML da div de detalhes
                    document.getElementById('detailsIPAddress').innerHTML = \`
                        Detalhes do IP: <span style="color: var(--primary);">\${ip}</span>
                    \`;
                    
                    document.getElementById('detailsBody').innerHTML = \`
                        <!-- Estatísticas Gerais -->
                        <div class="detail-section">
                            <h3 class="detail-section-title">📊 Estatísticas Gerais</h3>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <div class="detail-label">Total de Requisições</div>
                                    <div class="detail-value">\${totalRequests}</div>
                                </div>
                                <div class="detail-item" style="border-color: var(--success);">
                                    <div class="detail-label">Autorizadas</div>
                                    <div class="detail-value" style="color: var(--success);">\${authorized}</div>
                                </div>
                                <div class="detail-item" style="border-color: var(--danger);">
                                    <div class="detail-label">Negadas</div>
                                    <div class="detail-value" style="color: var(--danger);">\${denied}</div>
                                </div>
                                <div class="detail-item" style="border-color: var(--warning);">
                                    <div class="detail-label">Taxa de Sucesso</div>
                                    <div class="detail-value" style="color: var(--warning);">\${((authorized/totalRequests)*100).toFixed(1)}%</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Informações do IP -->
                        <div class="detail-section">
                            <h3 class="detail-section-title">🌍 Informações de Geolocalização</h3>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <div class="detail-label">Endereço IP</div>
                                    <div class="detail-value" style="font-family: 'Courier New', monospace;">\${ip}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">Localização</div>
                                    <div class="detail-value">
                                        \${firstRequest.countryCode ? getFlagEmoji(firstRequest.countryCode) : '🌍'} 
                                        \${firstRequest.city && firstRequest.country 
                                            ? \`\${firstRequest.city}, \${firstRequest.regionName || ''} - \${firstRequest.country}\`
                                            : firstRequest.country || 'Desconhecido'
                                        }
                                    </div>
                                </div>
                                \${firstRequest.zip && firstRequest.zip !== 'N/A' ? \`
                                <div class="detail-item">
                                    <div class="detail-label">CEP</div>
                                    <div class="detail-value">\${firstRequest.zip}</div>
                                </div>
                                \` : ''}
                                \${firstRequest.timezone ? \`
                                <div class="detail-item">
                                    <div class="detail-label">⏰ Timezone</div>
                                    <div class="detail-value">\${firstRequest.timezone}</div>
                                </div>
                                \` : ''}
                                \${firstRequest.lat && firstRequest.lon ? \`
                                <div class="detail-item">
                                    <div class="detail-label">📍 Coordenadas</div>
                                    <div class="detail-value">
                                        <a href="https://www.google.com/maps?q=\${firstRequest.lat},\${firstRequest.lon}" target="_blank" style="color: var(--primary); text-decoration: none;">
                                            \${firstRequest.lat}, \${firstRequest.lon} 🗺️
                                        </a>
                                    </div>
                                </div>
                                \` : ''}
                                <div class="detail-item">
                                    <div class="detail-label">Primeira Requisição</div>
                                    <div class="detail-value">\${new Date(firstRequest.timestamp).toLocaleString('pt-BR')}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">Última Requisição</div>
                                    <div class="detail-value">\${new Date(lastRequest.timestamp).toLocaleString('pt-BR')}</div>
                                </div>
                            </div>
                        </div>

                        <!-- Informações de Rede -->
                        \${firstRequest.isp || firstRequest.org || firstRequest.as ? \`
                        <div class="detail-section">
                            <h3 class="detail-section-title">🌐 Informações de Rede</h3>
                            <div class="detail-grid">
                                \${firstRequest.isp && firstRequest.isp !== 'Desconhecido' ? \`
                                <div class="detail-item">
                                    <div class="detail-label">ISP (Provedor)</div>
                                    <div class="detail-value">\${firstRequest.isp}</div>
                                </div>
                                \` : ''}
                                \${firstRequest.org && firstRequest.org !== 'Desconhecido' ? \`
                                <div class="detail-item">
                                    <div class="detail-label">Organização</div>
                                    <div class="detail-value">\${firstRequest.org}</div>
                                </div>
                                \` : ''}
                                \${firstRequest.as && firstRequest.as !== 'N/A' ? \`
                                <div class="detail-item">
                                    <div class="detail-label">AS (Sistema Autônomo)</div>
                                    <div class="detail-value" style="font-family: 'Courier New', monospace; font-size: 0.9em;">\${firstRequest.as}</div>
                                </div>
                                \` : ''}
                                \${firstRequest.hosting ? \`
                                <div class="detail-item" style="border-color: var(--warning);">
                                    <div class="detail-label">🏢 Hospedagem</div>
                                    <div class="detail-value" style="color: var(--warning);">Servidor de Hospedagem</div>
                                </div>
                                \` : ''}
                                \${firstRequest.proxy ? \`
                                <div class="detail-item" style="border-color: var(--danger);">
                                    <div class="detail-label">🔒 Proxy</div>
                                    <div class="detail-value" style="color: var(--danger);">Detectado Proxy/VPN</div>
                                </div>
                                \` : ''}
                                \${firstRequest.mobile ? \`
                                <div class="detail-item" style="border-color: var(--info);">
                                    <div class="detail-label">📱 Rede Móvel</div>
                                    <div class="detail-value" style="color: var(--info);">Conexão Móvel</div>
                                </div>
                                \` : ''}
                            </div>
                        </div>
                        \` : ''}
                        
                        <!-- Endpoints Acessados -->
                        <div class="detail-section">
                            <h3 class="detail-section-title" style="cursor: pointer; user-select: none;" onclick="toggleDetailSection('endpoints-\${ip}')">
                                <span id="endpoints-\${ip}-icon">▼</span> 🔗 Endpoints Acessados (\${endpoints.length})
                            </h3>
                            <ul class="detail-list" id="endpoints-\${ip}" style="max-height: 300px; overflow-y: auto;">
                                \${endpoints.slice(0, 5).map(url => {
                                    const count = ipLogs.filter(log => log.url === url).length;
                                    return \`
                                        <li>
                                            <span style="font-family: 'Courier New', monospace; font-size: 0.9em;">\${url || 'N/A'}</span>
                                            <span class="badge info">\${count}x</span>
                                        </li>
                                    \`;
                                }).join('')}
                                \${endpoints.length > 5 ? \`<li style="display: none;" class="expand-item-endpoints-\${ip}">\${
                                    endpoints.slice(5).map(url => {
                                        const count = ipLogs.filter(log => log.url === url).length;
                                        return \`<span style="font-family: 'Courier New', monospace; font-size: 0.9em;">\${url || 'N/A'}</span> <span class="badge info">\${count}x</span>\`;
                                    }).join('</li><li style="display: none;" class="expand-item-endpoints-' + ip + '">')
                                }</li>\` : ''}
                            </ul>
                            \${endpoints.length > 5 ? \`
                                <button class="btn-expand" onclick="expandDetailList('endpoints-\${ip}')" style="margin-top: 10px; width: 100%; padding: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; color: #fff; cursor: pointer; font-size: 0.85em;">
                                    ▼ Ver todos (\${endpoints.length})
                                </button>
                            \` : ''}
                        </div>
                        
                        <!-- Navegadores Usados -->
                        <div class="detail-section">
                            <h3 class="detail-section-title" style="cursor: pointer; user-select: none;" onclick="toggleDetailSection('browsers-\${ip}')">
                                <span id="browsers-\${ip}-icon">▼</span> 🌐 Navegadores Usados
                            </h3>
                            <ul class="detail-list" id="browsers-\${ip}">
                                \${browsers.map(browser => {
                                    const count = ipLogs.filter(log => log.browser === browser).length;
                                    return \`
                                        <li>
                                            <span>\${browser}</span>
                                            <span class="badge success">\${count}x</span>
                                        </li>
                                    \`;
                                }).join('')}
                            </ul>
                        </div>
                        
                        <!-- Plataformas Usadas -->
                        <div class="detail-section">
                            <h3 class="detail-section-title" style="cursor: pointer; user-select: none;" onclick="toggleDetailSection('platforms-\${ip}')">
                                <span id="platforms-\${ip}-icon">▼</span> 💻 Plataformas Usadas
                            </h3>
                            <ul class="detail-list" id="platforms-\${ip}">
                                \${platforms.map(platform => {
                                    const count = ipLogs.filter(log => log.platform === platform).length;
                                    return \`
                                        <li>
                                            <span>\${platform}</span>
                                            <span class="badge warning">\${count}x</span>
                                        </li>
                                    \`;
                                }).join('')}
                            </ul>
                        </div>
                        
                        <!-- Tentativas Negadas (se houver) -->
                        \${denied > 0 ? \`
                            <div class="detail-section">
                                <h3 class="detail-section-title" style="color: var(--danger);">⚠️ Tentativas de Acesso Negadas</h3>
                                <div class="detail-grid">
                                    <div class="detail-item" style="border-color: var(--danger);">
                                        <div class="detail-label">Total de Tentativas Negadas</div>
                                        <div class="detail-value" style="color: var(--danger);">\${denied}</div>
                                    </div>
                                    <div class="detail-item" style="border-color: var(--danger);">
                                        <div class="detail-label">Taxa de Negação</div>
                                        <div class="detail-value" style="color: var(--danger);">\${((denied/totalRequests)*100).toFixed(1)}%</div>
                                    </div>
                                </div>
                                <ul class="detail-list">
                                    \${ipLogs.filter(log => !log.is_authorized).slice(0, 5).map(log => \`
                                        <li>
                                            <span>\${log.url || 'N/A'}</span>
                                            <span style="color: var(--text-muted); font-size: 0.85em;">
                                                \${new Date(log.timestamp).toLocaleString('pt-BR')}
                                            </span>
                                        </li>
                                    \`).join('')}
                                    \${denied > 5 ? \`<li><em>... e mais \${denied - 5} tentativas negadas</em></li>\` : ''}
                                </ul>
                            </div>
                        \` : ''}
                    \`;
                    
                    // Rolar até o painel (apenas na primeira abertura)
                    if (!document.getElementById('ipDetailsPanel').classList.contains('show')) {
                        const panel = document.getElementById('ipDetailsPanel');
                        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                    
                    // Restaurar estados de expansão salvos
                    if (expandedIPCards[ip]) {
                        Object.keys(expandedIPCards[ip]).forEach(sectionId => {
                            const section = document.getElementById(sectionId);
                            const icon = document.getElementById(sectionId + '-icon');
                            
                            if (section && icon) {
                                const isExpanded = expandedIPCards[ip][sectionId];
                                section.style.display = isExpanded ? 'block' : 'none';
                                icon.textContent = isExpanded ? '▼' : '▶';
                            }
                        });
                    }
                    
                } else {
                    showToast('Nenhum log encontrado para este IP', 'warning');
                }
            } catch (error) {
                console.error('Erro ao carregar detalhes do IP:', error);
                showToast('Erro ao carregar detalhes do IP', 'error');
            }
        }
        
        // Fechar painel de detalhes
        function closeIPDetails() {
            currentOpenIP = null; // Limpar IP aberto
            document.getElementById('ipDetailsPanel').classList.remove('show');
        }

        // Alternar expansão/colapso de seções no modal
        function toggleDetailSection(sectionId) {
            const section = document.getElementById(sectionId);
            const icon = document.getElementById(sectionId + '-icon');
            
            if (section.style.display === 'none') {
                section.style.display = 'block';
                icon.textContent = '▼';
            } else {
                section.style.display = 'none';
                icon.textContent = '▶';
            }
            
            // Salvar estado de expansão
            if (!expandedIPCards[currentOpenIP]) {
                expandedIPCards[currentOpenIP] = {};
            }
            expandedIPCards[currentOpenIP][sectionId] = (section.style.display === 'block');
        }

        // Alternar seção de logs
        function toggleLogsSection() {
            const container = document.getElementById('tableContainer');
            const controls = document.getElementById('logs-controls');
            const icon = document.getElementById('logs-section-icon');
            
            if (container.style.display === 'none') {
                container.style.display = 'block';
                controls.style.display = 'flex';
                icon.textContent = '▼';
            } else {
                container.style.display = 'none';
                controls.style.display = 'none';
                icon.textContent = '▶';
            }
        }

        // Alternar seção ZeroTier
        function toggleZeroTierSection() {
            const content = document.getElementById('zerotier-section-content');
            const icon = document.getElementById('zerotier-section-icon');
            
            if (content.style.display === 'none') {
                content.style.display = 'block';
                icon.textContent = '▼';
            } else {
                content.style.display = 'none';
                icon.textContent = '▶';
            }
        }

        // Verificar status do ZeroTier
        async function checkZeroTierStatus() {
            try {
                const response = await fetch('/zerotier/status');
                const data = await response.json();
                
                if (data.success) {
                    // Atualizar badge de status
                    const badge = document.getElementById('zt-status-badge');
                    if (data.client.isZeroTier) {
                        badge.textContent = '✅ Conectado via ZT';
                        badge.className = 'badge badge-success';
                    } else if (data.client.isLocalhost) {
                        badge.textContent = '🏠 Localhost';
                        badge.className = 'badge badge-info';
                    } else {
                        badge.textContent = '⚠️ Não conectado';
                        badge.className = 'badge badge-warning';
                    }
                    
                    // Atualizar IP do cliente
                    document.getElementById('zt-client-ip').textContent = data.client.ip;
                    
                    // Atualizar status de conexão
                    const statusEl = document.getElementById('zt-connection-status');
                    if (data.client.isZeroTier) {
                        statusEl.innerHTML = '<span style="color: var(--success);">✅ Conectado</span>';
                    } else if (data.client.isLocalhost) {
                        statusEl.innerHTML = '<span style="color: var(--info);">🏠 Local</span>';
                    } else {
                        statusEl.innerHTML = '<span style="color: var(--warning);">⚠️ Fora da rede</span>';
                    }
                }
            } catch (error) {
                console.error('Erro ao verificar ZeroTier:', error);
                document.getElementById('zt-status-badge').textContent = '❌ Erro';
                document.getElementById('zt-status-badge').className = 'badge badge-danger';
            }
        }

        // Expandir lista de detalhes (mostrar todos os itens)
        function expandDetailList(listId) {
            const items = document.querySelectorAll(\`.expand-item-\${listId}\`);
            const button = event.target;
            
            items.forEach(item => {
                item.style.display = 'list-item';
            });
            
            button.style.display = 'none';
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
            // Limitar a 3 toasts simultâneos
            const existingToasts = document.querySelectorAll('.toast');
            if (existingToasts.length >= 3) {
                // Remover o mais antigo
                existingToasts[0].remove();
            }
            
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
                <button class="toast-close" onclick="this.parentElement.remove()">✖</button>
            \`;
            
            document.body.appendChild(toast);
            
            // Auto-remover após 5 segundos
            const autoRemoveTimeout = setTimeout(() => {
                if (toast.parentElement) {
                    toast.style.animation = 'slideInRight 0.3s ease-out reverse';
                    setTimeout(() => {
                        if (toast.parentElement) toast.remove();
                    }, 300);
                }
            }, 5000);
            
            // Limpar timeout se removido manualmente
            toast.addEventListener('click', () => {
                clearTimeout(autoRemoveTimeout);
            });
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
            countdown = 3;
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

        // ============= FUNÇÕES DE SEGURANÇA =============
        
        // Toggle seção de segurança
        function toggleSecuritySection() {
            const content = document.getElementById('security-section-content');
            const icon = document.getElementById('security-section-icon');
            
            if (content.style.display === 'none') {
                content.style.display = 'block';
                icon.textContent = '▼';
                loadSecurityData();
            } else {
                content.style.display = 'none';
                icon.textContent = '▶';
            }
        }
        
        // Trocar aba de segurança
        function switchSecurityTab(tab) {
            console.log('[DEBUG] switchSecurityTab chamada com tab:', tab);
            
            // Remover active de todos os botões
            const allButtons = document.querySelectorAll('.tab-btn');
            console.log('[DEBUG] Botões encontrados:', allButtons.length);
            allButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Esconder todos os conteúdos
            const allContents = document.querySelectorAll('.security-tab-content');
            console.log('[DEBUG] Conteúdos encontrados:', allContents.length);
            allContents.forEach(content => {
                content.style.display = 'none';
            });
            
            // Ativar o botão selecionado usando data-attribute
            const selector = '.tab-btn[data-tab="' + tab + '"]';
            console.log('[DEBUG] Seletor do botão:', selector);
            const activeButton = document.querySelector(selector);
            if (activeButton) {
                activeButton.classList.add('active');
                console.log('[DEBUG] Botão ativado:', tab);
            } else {
                console.error('[ERRO] Botão não encontrado para tab:', tab);
            }
            
            // Mostrar o conteúdo selecionado
            const contentId = 'security-tab-' + tab;
            console.log('[DEBUG] ID do conteúdo:', contentId);
            const activeContent = document.getElementById(contentId);
            if (activeContent) {
                activeContent.style.display = 'block';
                console.log('[DEBUG] Conteúdo exibido:', contentId);
                console.log('[DEBUG] HTML do conteúdo:', activeContent.innerHTML.substring(0, 100));
            } else {
                console.error('[ERRO] Conteúdo não encontrado:', contentId);
            }
        }
        
        // Carregar dados de segurança
        async function loadSecurityData() {
            try {
                const response = await fetch('/api/security/all');
                const data = await response.json();
                
                if (data.success) {
                    // Atualizar estatísticas
                    document.getElementById('security-blocked-count').textContent = data.blocked.total;
                    document.getElementById('security-suspended-count').textContent = data.suspended.total;
                    document.getElementById('security-warnings-count').textContent = data.warnings.total;
                    
                    // Atualizar contadores nas tabs
                    document.getElementById('tab-blocked-count').textContent = data.blocked.total;
                    document.getElementById('tab-suspended-count').textContent = data.suspended.total;
                    document.getElementById('tab-warnings-count').textContent = data.warnings.total;
                    
                    // Atualizar configurações
                    document.getElementById('security-config-max-attempts').textContent = data.stats.config.maxAttempts;
                    document.getElementById('security-config-suspension').textContent = \`\${data.stats.config.suspensionDuration / 1000 / 60} min\`;
                    document.getElementById('security-config-max-suspensions').textContent = data.stats.config.maxSuspensions;
                    document.getElementById('security-config-block-attempts').textContent = data.stats.config.permanentBlockAttempts;
                    
                    // Atualizar badge
                    const badge = document.getElementById('security-status-badge');
                    if (data.blocked.total > 0 || data.suspended.total > 0) {
                        badge.textContent = \`\${data.blocked.total + data.suspended.total} Ameaças Bloqueadas\`;
                        badge.className = 'badge badge-danger';
                    } else {
                        badge.textContent = 'Sistema Seguro';
                        badge.className = 'badge badge-success';
                    }
                    
                    // Renderizar listas
                    renderBlockedIPs(data.blocked.list);
                    renderSuspendedIPs(data.suspended.list);
                    renderWarningIPs(data.warnings.list);
                }
            } catch (error) {
                console.error('Erro ao carregar dados de segurança:', error);
                document.getElementById('security-status-badge').textContent = 'Erro ao Carregar';
                document.getElementById('security-status-badge').className = 'badge badge-danger';
            }
        }
        
        // Renderizar IPs bloqueados
        function renderBlockedIPs(ips) {
            const container = document.getElementById('blocked-ips-list');
            
            if (ips.length === 0) {
                container.innerHTML = \`
                    <div class="security-empty">
                        <div class="security-empty-icon">✅</div>
                        <div>Nenhum IP permanentemente bloqueado</div>
                    </div>
                \`;
                return;
            }
            
            container.innerHTML = ips.map(item => \`
                <div class="security-item blocked">
                    <div class="security-item-icon">🚫</div>
                    <div class="security-item-info">
                        <div class="security-item-ip">\${item.ip}</div>
                        <div class="security-item-details">
                            <span class="security-item-detail">
                                <span>📊</span>
                                <span>\${item.attempts} tentativa(s)</span>
                            </span>
                            <span class="security-item-detail">
                                <span>⏳</span>
                                <span>\${item.suspensions} suspensão(ões)</span>
                            </span>
                            \${item.lastAttempt ? \`
                                <span class="security-item-detail">
                                    <span>🕐</span>
                                    <span>\${formatTimestamp(item.lastAttempt)}</span>
                                </span>
                            \` : ''}
                        </div>
                    </div>
                    <div class="security-item-actions">
                        <button class="security-action-btn unblock" onclick="unblockIP('\${item.ip}')">
                            ✅ Desbloquear
                        </button>
                    </div>
                </div>
            \`).join('');
        }
        
        // Renderizar IPs suspensos
        function renderSuspendedIPs(ips) {
            const container = document.getElementById('suspended-ips-list');
            
            if (ips.length === 0) {
                container.innerHTML = \`
                    <div class="security-empty">
                        <div class="security-empty-icon">✅</div>
                        <div>Nenhum IP temporariamente suspenso</div>
                    </div>
                \`;
                return;
            }
            
            container.innerHTML = ips.map(item => \`
                <div class="security-item suspended">
                    <div class="security-item-icon">⏳</div>
                    <div class="security-item-info">
                        <div class="security-item-ip">\${item.ip}</div>
                        <div class="security-item-details">
                            <span class="security-item-detail">
                                <span>⏰</span>
                                <span>Resta(m) \${item.remainingMinutes} minuto(s)</span>
                            </span>
                            <span class="security-item-detail">
                                <span>📊</span>
                                <span>\${item.attempts} tentativa(s)</span>
                            </span>
                            <span class="security-item-detail">
                                <span>🔢</span>
                                <span>Suspensão #\${item.suspensionCount}</span>
                            </span>
                        </div>
                    </div>
                    <div class="security-item-actions">
                        <button class="security-action-btn unsuspend" onclick="unsuspendIP('\${item.ip}')">
                            ✅ Remover Suspensão
                        </button>
                    </div>
                </div>
            \`).join('');
        }
        
        // Renderizar IPs com avisos
        function renderWarningIPs(ips) {
            const container = document.getElementById('warnings-ips-list');
            
            if (ips.length === 0) {
                container.innerHTML = \`
                    <div class="security-empty">
                        <div class="security-empty-icon">✅</div>
                        <div>Nenhum IP com avisos</div>
                    </div>
                \`;
                return;
            }
            
            container.innerHTML = ips.map(item => \`
                <div class="security-item warning">
                    <div class="security-item-icon">⚠️</div>
                    <div class="security-item-info">
                        <div class="security-item-ip">\${item.ip}</div>
                        <div class="security-item-details">
                            <span class="security-item-detail">
                                <span>📊</span>
                                <span>\${item.attempts} tentativa(s)</span>
                            </span>
                            <span class="security-item-detail">
                                <span>⚠️</span>
                                <span>\${item.remainingAttempts} restante(s) antes da suspensão</span>
                            </span>
                            <span class="security-item-detail">
                                <span>🔢</span>
                                <span>\${item.suspensions} suspensão(ões) anterior(es)</span>
                            </span>
                            \${item.lastAttempt ? \`
                                <span class="security-item-detail">
                                    <span>🕐</span>
                                    <span>\${formatTimestamp(item.lastAttempt)}</span>
                                </span>
                            \` : ''}
                        </div>
                    </div>
                </div>
            \`).join('');
        }
        
        // Desbloquear IP
        async function unblockIP(ip) {
            if (!confirm(\`Tem certeza que deseja desbloquear o IP \${ip}?\`)) {
                return;
            }
            
            try {
                const response = await fetch(\`/api/security/unblock/\${ip}\`, {
                    method: 'POST'
                });
                const data = await response.json();
                
                if (data.success) {
                    showToast(\`IP \${ip} desbloqueado com sucesso!\`, 'success');
                    loadSecurityData();
                } else {
                    showToast(\`Erro ao desbloquear IP: \${data.message}\`, 'error');
                }
            } catch (error) {
                console.error('Erro ao desbloquear IP:', error);
                showToast('Erro ao desbloquear IP', 'error');
            }
        }
        
        // Remover suspensão de IP
        async function unsuspendIP(ip) {
            if (!confirm(\`Tem certeza que deseja remover a suspensão do IP \${ip}?\`)) {
                return;
            }
            
            try {
                const response = await fetch(\`/api/security/unsuspend/\${ip}\`, {
                    method: 'POST'
                });
                const data = await response.json();
                
                if (data.success) {
                    showToast(\`Suspensão do IP \${ip} removida com sucesso!\`, 'success');
                    loadSecurityData();
                } else {
                    showToast(\`Erro ao remover suspensão: \${data.message}\`, 'error');
                }
            } catch (error) {
                console.error('Erro ao remover suspensão:', error);
                showToast('Erro ao remover suspensão', 'error');
            }
        }
        
        // Suspender IP manualmente (do card de IP)
        async function suspendIPManual(ip) {
            if (!confirm(\`⏳ Suspender o IP \${ip}?\n\nEste IP será suspenso por 1 hora e não poderá acessar a API durante este período.\`)) {
                return;
            }
            
            try {
                // Simula 5 tentativas não autorizadas para acionar a suspensão
                const response = await fetch(\`/api/security/suspend-manual/\${ip}\`, {
                    method: 'POST'
                });
                
                if (response.ok) {
                    const data = await response.json();
                    showToast(\`✅ IP \${ip} suspenso por 1 hora!\`, 'success');
                    loadSecurityData();
                    loadIPStats();
                } else {
                    showToast(\`❌ Erro ao suspender IP\`, 'error');
                }
            } catch (error) {
                console.error('Erro ao suspender IP:', error);
                showToast('❌ Erro ao suspender IP', 'error');
            }
        }
        
        // Bloquear IP manualmente (do card de IP)
        async function blockIPManual(ip) {
            if (!confirm(\`🚫 Bloquear PERMANENTEMENTE o IP \${ip}?\n\n⚠️ ATENÇÃO: Esta ação bloqueará o IP definitivamente!\nO IP não poderá mais acessar a API.\n\nDeseja continuar?\`)) {
                return;
            }
            
            try {
                const response = await fetch(\`/api/security/block-manual/\${ip}\`, {
                    method: 'POST'
                });
                
                if (response.ok) {
                    const data = await response.json();
                    showToast(\`✅ IP \${ip} bloqueado permanentemente!\`, 'success');
                    loadSecurityData();
                    loadIPStats();
                } else {
                    showToast(\`❌ Erro ao bloquear IP\`, 'error');
                }
            } catch (error) {
                console.error('Erro ao bloquear IP:', error);
                showToast('❌ Erro ao bloquear IP', 'error');
            }
        }
        
        // ============= FIM FUNÇÕES DE SEGURANÇA =============

        // Carregar todos os dados
        function loadAllData() {
            loadGeneralStats();
            loadIPStats();
            logsPage = 1;
            loadLogs(false);
            resetCountdown();
            
            // Auto-refresh da seção de segurança se estiver aberta
            const securityContent = document.getElementById('security-section-content');
            if (securityContent && securityContent.style.display !== 'none') {
                loadSecurityData();
            }
        }

        // Inicializar
        detectMyIP(); // Detectar IP do usuário primeiro
        checkZeroTierStatus(); // Verificar status ZeroTier
        loadAllData();
        loadSecurityData(); // Carregar dados de segurança no início
        startCountdown();
        startRefreshInterval();
        
        // Verificar ZeroTier a cada 30 segundos
        setInterval(checkZeroTierStatus, 30000);
        
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
