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
            color: var(--dark-text-muted);  /* Usando cor clara para fundo escuro */
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
        
        @keyframes pulse {
            0%, 100% {
                opacity: 1;
                transform: scale(1);
            }
            50% {
                opacity: 0.8;
                transform: scale(1.05);
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

        /* ===========================================
           MODAIS - FASE 6
           =========================================== */

        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        .modal-content {
            background: var(--bg-primary);
            border-radius: 15px;
            width: 100%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            animation: modalSlideIn 0.3s ease;
        }

        @keyframes modalSlideIn {
            from {
                opacity: 0;
                transform: translateY(-50px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 25px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-header h2 {
            margin: 0;
            font-size: 1.5em;
            color: var(--text-light);
        }

        .modal-close {
            background: rgba(255, 255, 255, 0.1);
            color: var(--text-light);
            border: none;
            width: 35px;
            height: 35px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 1.2em;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
        }

        .modal-close:hover {
            background: var(--danger);
            transform: rotate(90deg);
        }

        .modal-body {
            padding: 25px;
        }

        .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            padding: 20px 25px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Estilos de Formulário do Modal */
        .modal-body input[type="text"],
        .modal-body select,
        .modal-body textarea {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: var(--text-light);
            padding: 12px 15px;
            border-radius: 8px;
            font-size: 1em;
            transition: all 0.3s;
            width: 100%;
        }

        .modal-body input[type="text"]:focus,
        .modal-body select:focus,
        .modal-body textarea:focus {
            outline: none;
            border-color: var(--primary);
            background: rgba(255, 255, 255, 0.08);
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .modal-body input[type="text"]::placeholder,
        .modal-body textarea::placeholder {
            color: var(--dark-text-muted);
        }

        .modal-body label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: var(--text-light);
        }

        .modal-body small {
            color: var(--dark-text-muted);
            display: block;
            margin-top: 5px;
            font-size: 0.85em;
        }

        /* ===========================================
           SEÇÃO UNIFICADA DE SEGURANÇA E IPs - FASE 3
           =========================================== */

        .unified-security-section {
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.9));
            border-radius: 15px;
            padding: 30px;
            margin: 20px 0;
        }

        /* HEADER - Estatísticas Globais */
        .unified-header {
            margin-bottom: 30px;
        }

        .unified-stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }

        .unified-stat-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s;
        }

        .unified-stat-card:hover {
            background: rgba(255, 255, 255, 0.08);
            transform: translateY(-2px);
        }

        .unified-stat-icon {
            font-size: 2em;
            margin-bottom: 10px;
        }

        .unified-stat-value {
            font-size: 2.5em;
            font-weight: bold;
            margin: 10px 0;
        }

        .unified-stat-label {
            color: var(--dark-text-muted);
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* STATUS COLORS */
        .unified-stat-card.status-normal .unified-stat-value {
            color: var(--success);
        }

        .unified-stat-card.status-warning .unified-stat-value {
            color: var(--warning);
        }

        .unified-stat-card.status-suspended .unified-stat-value {
            color: var(--info);
        }

        .unified-stat-card.status-blocked .unified-stat-value {
            color: var(--danger);
        }

        /* CONTROLS - Botões de Ação */
        .unified-controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .unified-controls-left {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }

        .unified-controls-right {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .btn-add-ip {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s;
        }

        .btn-add-ip:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4);
        }

        .btn-refresh {
            background: rgba(255, 255, 255, 0.1);
            color: var(--text-light);
            padding: 12px 24px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s;
        }

        .btn-refresh:hover {
            background: rgba(255, 255, 255, 0.15);
        }

        .auto-refresh-toggle {
            display: flex;
            align-items: center;
            gap: 10px;
            color: var(--text-light);
            font-size: 0.9em;
        }

        .auto-refresh-toggle .toggle-switch {
            width: 50px;
            height: 26px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 13px;
            position: relative;
            cursor: pointer;
            transition: all 0.3s;
        }

        .auto-refresh-toggle .toggle-switch.active {
            background: var(--success);
        }

        .auto-refresh-toggle .toggle-switch::after {
            content: '';
            position: absolute;
            width: 20px;
            height: 20px;
            background: white;
            border-radius: 50%;
            top: 3px;
            left: 3px;
            transition: all 0.3s;
        }

        .auto-refresh-toggle .toggle-switch.active::after {
            left: 27px;
        }

        /* FILTERS - Filtros e Busca */
        .unified-filters {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 25px;
        }

        .filter-tabs {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 15px;
        }

        .filter-tab {
            background: transparent;
            color: var(--dark-text-muted);
            padding: 10px 20px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .filter-tab:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.3);
        }

        .filter-tab.active {
            background: var(--primary);
            color: white;
            border-color: var(--primary);
        }

        .filter-tab .count {
            background: rgba(255, 255, 255, 0.2);
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 0.85em;
            font-weight: bold;
        }

        .filter-tab.active .count {
            background: rgba(255, 255, 255, 0.3);
        }

        .filter-search-row {
            display: flex;
            gap: 15px;
            align-items: center;
        }

        .filter-search {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 12px 15px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .filter-search input {
            flex: 1;
            background: transparent;
            border: none;
            color: var(--text-light);
            font-size: 1em;
            outline: none;
        }

        .filter-search input::placeholder {
            color: var(--dark-text-muted);
        }

        .filter-search-icon {
            color: var(--dark-text-muted);
            font-size: 1.2em;
        }

        .filter-sort {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .filter-sort select {
            background: rgba(255, 255, 255, 0.1);
            color: var(--text-light);
            padding: 12px 15px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            cursor: pointer;
            font-size: 0.95em;
        }

        /* LIST - Cards de IPs */
        .unified-list {
            display: grid;
            gap: 15px;
            margin-bottom: 25px;
        }

        .unified-ip-card {
            background: rgba(15, 23, 42, 0.6);
            border-radius: 12px;
            padding: 20px;
            border-left: 5px solid var(--border);
            transition: all 0.3s;
            position: relative;
        }

        .unified-ip-card:hover {
            background: rgba(15, 23, 42, 0.8);
            transform: translateX(5px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }

        /* STATUS BORDERS */
        .unified-ip-card.status-normal {
            border-left-color: var(--success);
        }

        .unified-ip-card.status-warning {
            border-left-color: var(--warning);
        }

        .unified-ip-card.status-suspended {
            border-left-color: var(--info);
        }

        .unified-ip-card.status-blocked {
            border-left-color: var(--danger);
        }

        /* CARD HEADER */
        .unified-ip-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            cursor: pointer;
        }

        .unified-ip-header-left {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .unified-ip-icon {
            font-size: 2em;
        }

        .unified-ip-address {
            font-family: 'Courier New', monospace;
            font-size: 1.4em;
            font-weight: bold;
            color: var(--text-light);
        }

        .unified-ip-status-badge {
            padding: 6px 14px;
            border-radius: 12px;
            font-size: 0.85em;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .unified-ip-status-badge.status-normal {
            background: rgba(5, 150, 105, 0.2);
            color: var(--success);
        }

        .unified-ip-status-badge.status-warning {
            background: rgba(217, 119, 6, 0.2);
            color: var(--warning);
        }

        .unified-ip-status-badge.status-suspended {
            background: rgba(8, 145, 178, 0.2);
            color: var(--info);
        }

        .unified-ip-status-badge.status-blocked {
            background: rgba(220, 38, 38, 0.2);
            color: var(--danger);
        }

        .unified-ip-header-right {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .expand-icon {
            color: var(--dark-text-muted);
            font-size: 1.5em;
            transition: transform 0.3s;
        }

        .unified-ip-card.expanded .expand-icon {
            transform: rotate(180deg);
        }

        /* CARD STATS (Inline) */
        .unified-ip-stats {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            padding: 15px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .unified-ip-stat {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--dark-text-muted);
            font-size: 0.9em;
        }

        .unified-ip-stat-icon {
            font-size: 1.1em;
        }

        .unified-ip-stat-value {
            color: var(--text-light);
            font-weight: 600;
        }

        /* CARD ACTIONS */
        .unified-ip-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            padding-top: 15px;
        }

        .action-btn {
            background: rgba(255, 255, 255, 0.1);
            color: var(--text-light);
            padding: 8px 16px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            cursor: pointer;
            font-size: 0.9em;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.3s;
        }

        .action-btn:hover {
            background: rgba(255, 255, 255, 0.15);
            transform: translateY(-2px);
        }

        .action-btn[disabled],
        .action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            pointer-events: none;
        }

        .action-btn.btn-warning {
            border-color: var(--warning);
            color: var(--warning);
            background: rgba(217, 119, 6, 0.1);
        }

        .action-btn.btn-warn {
            border-color: var(--warning);
            color: var(--warning);
        }

        .action-btn.btn-warn:hover {
            background: rgba(217, 119, 6, 0.2);
        }

        .action-btn.btn-suspend {
            border-color: var(--info);
            color: var(--info);
        }

        .action-btn.btn-suspend:hover {
            background: rgba(8, 145, 178, 0.2);
        }

        .action-btn.btn-block {
            border-color: var(--danger);
            color: var(--danger);
        }

        .action-btn.btn-block:hover {
            background: rgba(220, 38, 38, 0.2);
        }

        .action-btn.btn-clear {
            border-color: var(--success);
            color: var(--success);
        }

        .action-btn.btn-clear:hover {
            background: rgba(5, 150, 105, 0.2);
        }

        .action-btn.btn-history {
            border-color: var(--primary);
            color: var(--primary);
        }

        .action-btn.btn-history:hover {
            background: rgba(37, 99, 235, 0.2);
        }

        /* CARD DETAILS (Expandido) */
        .unified-ip-details {
            display: none;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            margin-top: 15px;
        }

        .unified-ip-card.expanded .unified-ip-details {
            display: block;
            animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                max-height: 0;
            }
            to {
                opacity: 1;
                max-height: 1000px;
            }
        }

        .unified-details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }

        .unified-detail-section {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 15px;
        }

        .unified-detail-title {
            color: var(--text-light);
            font-weight: 600;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .unified-detail-list {
            list-style: none;
            padding: 0;
        }

        .unified-detail-list li {
            padding: 8px 0;
            color: var(--dark-text-muted);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .unified-detail-list li:last-child {
            border-bottom: none;
        }

        /* PAGINATION */
        .unified-pagination {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 0;
        }

        .pagination-info {
            color: var(--dark-text-muted);
            font-size: 0.95em;
        }

        .pagination-controls {
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .pagination-btn {
            background: rgba(255, 255, 255, 0.1);
            color: var(--text-light);
            padding: 10px 18px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .pagination-btn:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.15);
            transform: translateY(-2px);
        }

        .pagination-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .pagination-page {
            color: var(--text-light);
            font-weight: 600;
            padding: 0 15px;
        }

        /* EMPTY STATE */
        .unified-empty-state {
            text-align: center;
            padding: 60px 20px;
            color: var(--dark-text-muted);
        }

        .unified-empty-icon {
            font-size: 4em;
            margin-bottom: 20px;
            opacity: 0.5;
        }

        .unified-empty-message {
            font-size: 1.2em;
            margin-bottom: 10px;
        }

        .unified-empty-hint {
            font-size: 0.9em;
            opacity: 0.7;
        }

        /* LOADING STATE */
        .unified-loading {
            text-align: center;
            padding: 40px 20px;
        }

        .spinner {
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top: 3px solid var(--primary);
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* RESPONSIVE */
        @media (max-width: 768px) {
            .unified-controls {
                flex-direction: column;
                align-items: stretch;
            }
            
            .unified-controls-left,
            .unified-controls-right {
                width: 100%;
                justify-content: center;
            }
            
            .filter-tabs {
                justify-content: center;
            }
            
            .filter-search-row {
                flex-direction: column;
            }
            
            .unified-ip-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }
            
            .unified-ip-actions {
                justify-content: center;
            }
            
            .unified-pagination {
                flex-direction: column;
                gap: 15px;
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
        <!-- SEÇÃO UNIFICADA: Segurança + Estatísticas de IPs -->
        <div class="section">
            <div class="section-header">
                <h2 class="section-title" style="cursor: pointer; user-select: none; display: flex; align-items: center; gap: 10px;" onclick="toggleUnifiedSection()">
                    <span id="unified-section-icon">▼</span>
                    🛡️ Gerenciamento de Segurança e IPs
                    <span class="badge badge-success" id="unified-status-badge">Sistema Ativo</span>
                </h2>
            </div>
            
            <div id="unified-section-content" class="unified-security-section" style="display: block;">
                
                <!-- HEADER: Estatísticas Globais -->
                <div class="unified-header">
                    <div class="unified-stats-grid">
                        <div class="unified-stat-card status-normal">
                            <div class="unified-stat-icon">✅</div>
                            <div class="unified-stat-value" id="unified-count-normal">0</div>
                            <div class="unified-stat-label">Normal</div>
                        </div>
                        <div class="unified-stat-card status-warning">
                            <div class="unified-stat-icon">⚠️</div>
                            <div class="unified-stat-value" id="unified-count-warning">0</div>
                            <div class="unified-stat-label">Avisos</div>
                        </div>
                        <div class="unified-stat-card status-suspended">
                            <div class="unified-stat-icon">⏳</div>
                            <div class="unified-stat-value" id="unified-count-suspended">0</div>
                            <div class="unified-stat-label">Suspensos</div>
                        </div>
                        <div class="unified-stat-card status-blocked">
                            <div class="unified-stat-icon">🚫</div>
                            <div class="unified-stat-value" id="unified-count-blocked">0</div>
                            <div class="unified-stat-label">Bloqueados</div>
                        </div>
                    </div>
                </div>

                <!-- CONTROLS: Botões de Ação -->
                <div class="unified-controls">
                    <div class="unified-controls-left">
                        <button class="btn-add-ip" onclick="openAddIPModal()">
                            ➕ Adicionar IP
                        </button>
                        <button class="btn-refresh" onclick="loadUnifiedList()">
                            🔄 Atualizar
                        </button>
                    </div>
                    <div class="unified-controls-right">
                        <div class="auto-refresh-toggle">
                            <span>Auto-refresh:</span>
                            <div class="toggle-switch" id="unified-auto-refresh-toggle" onclick="toggleUnifiedAutoRefresh()"></div>
                            <span id="unified-countdown">10s</span>
                        </div>
                    </div>
                </div>

                <!-- FILTERS: Filtros e Busca -->
                <div class="unified-filters">
                    <div class="filter-tabs">
                        <button class="filter-tab active" data-filter="all" onclick="changeUnifiedFilter('all')">
                            🌐 Todos
                            <span class="count" id="filter-count-all">0</span>
                        </button>
                        <button class="filter-tab" data-filter="normal" onclick="changeUnifiedFilter('normal')">
                            ✅ Normal
                            <span class="count" id="filter-count-normal">0</span>
                        </button>
                        <button class="filter-tab" data-filter="warning" onclick="changeUnifiedFilter('warning')">
                            ⚠️ Avisos
                            <span class="count" id="filter-count-warning">0</span>
                        </button>
                        <button class="filter-tab" data-filter="suspended" onclick="changeUnifiedFilter('suspended')">
                            ⏳ Suspensos
                            <span class="count" id="filter-count-suspended">0</span>
                        </button>
                        <button class="filter-tab" data-filter="blocked" onclick="changeUnifiedFilter('blocked')">
                            🚫 Bloqueados
                            <span class="count" id="filter-count-blocked">0</span>
                        </button>
                    </div>
                    
                    <div class="filter-search-row">
                        <div class="filter-search">
                            <span class="filter-search-icon">🔍</span>
                            <input type="text" 
                                   id="unified-search-input" 
                                   placeholder="Buscar por endereço IP..." 
                                   onkeyup="searchUnifiedList()"
                            />
                        </div>
                        <div class="filter-sort">
                            <label for="unified-sort-select">Ordenar:</label>
                            <select id="unified-sort-select" onchange="sortUnifiedList()">
                                <option value="lastSeen">Mais Recente</option>
                                <option value="attempts">Tentativas (Maior)</option>
                                <option value="ip">IP (A-Z)</option>
                                <option value="status">Status</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- LIST: Cards de IPs -->
                <div id="unified-list" class="unified-list">
                    <!-- Loading inicial -->
                    <div class="unified-loading">
                        <div class="spinner"></div>
                        <p>Carregando lista de IPs...</p>
                    </div>
                </div>

                <!-- PAGINATION: Controles de Paginação -->
                <div id="unified-pagination" class="unified-pagination" style="display: none;">
                    <div class="pagination-info">
                        Mostrando <strong id="pagination-start">1</strong> - <strong id="pagination-end">20</strong> 
                        de <strong id="pagination-total">0</strong> IPs
                    </div>
                    <div class="pagination-controls">
                        <button class="pagination-btn" id="pagination-prev" onclick="changePage('prev')" disabled>
                            ◀ Anterior
                        </button>
                        <div class="pagination-page">
                            Página <strong id="pagination-current">1</strong> / <strong id="pagination-pages">1</strong>
                        </div>
                        <button class="pagination-btn" id="pagination-next" onclick="changePage('next')">
                            Próxima ▶
                        </button>
                    </div>
                </div>

            </div>
        </div>

        <!-- Modal: Adicionar IP Manualmente -->
        <div id="addIPModal" class="modal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>➕ Adicionar IP Manualmente</h2>
                    <button class="modal-close" onclick="closeAddIPModal()">✖</button>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 20px;">
                        <label for="add-ip-address">
                            📍 Endereço IP:
                        </label>
                        <input type="text" 
                               id="add-ip-address" 
                               placeholder="Ex: 192.168.1.100"
                        />
                        <small>
                            Digite um endereço IPv4 válido
                        </small>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label for="add-ip-status">
                            🎯 Status Inicial:
                        </label>
                        <select id="add-ip-status">
                            <option value="warning">⚠️ Aviso (Preventivo)</option>
                            <option value="suspended">⏳ Suspenso (Bloqueio Temporário)</option>
                            <option value="blocked">🚫 Bloqueado (Bloqueio Permanente)</option>
                        </select>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label for="add-ip-reason">
                            📝 Motivo:
                        </label>
                        <textarea id="add-ip-reason" 
                                  placeholder="Ex: IP suspeito de ataque" 
                                  rows="3" 
                                  style="resize: vertical;"
                        ></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" onclick="closeAddIPModal()">
                        ❌ Cancelar
                    </button>
                    <button class="btn success" onclick="submitAddIP()">
                        ✅ Adicionar IP
                    </button>
                </div>
            </div>
        </div>

        <!-- Modal: Histórico de Status -->
        <div id="historyModal" class="modal">
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h2>📜 Histórico de Status</h2>
                    <button class="modal-close" onclick="closeHistoryModal()">✖</button>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 15px;">
                        <strong>IP:</strong> <span id="history-ip-address" style="font-family: 'Courier New', monospace; color: var(--primary);"></span>
                    </div>
                    <div id="history-timeline" style="max-height: 400px; overflow-y: auto;">
                        <!-- Timeline será preenchida dinamicamente -->
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" onclick="closeHistoryModal()">
                        Fechar
                    </button>
                </div>
            </div>
        </div>

        <!-- Modal: Confirmação de Ação -->
        <div id="confirmActionModal" class="modal">
            <div class="modal-content" style="max-width: 450px;">
                <div class="modal-header">
                    <h2 id="confirm-action-title">⚠️ Confirmar Ação</h2>
                    <button class="modal-close" onclick="closeConfirmModal()">✖</button>
                </div>
                <div class="modal-body">
                    <p id="confirm-action-message" style="font-size: 1.1em; line-height: 1.6;"></p>
                    <div style="margin-top: 20px; padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                        <strong>IP:</strong> 
                        <span id="confirm-action-ip" style="font-family: 'Courier New', monospace; color: var(--primary);"></span>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" onclick="closeConfirmModal()">
                        ❌ Cancelar
                    </button>
                    <button class="btn" id="confirm-action-btn" onclick="executeConfirmedAction()">
                        ✅ Confirmar
                    </button>
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
            // NOTA: Estatísticas de IP foram movidas para a "Lista Unificada de Segurança"
            // Esta função é mantida vazia para compatibilidade com loadAllData()
            // Os dados de IP agora são carregados via loadUnifiedList()
            return;
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

        // Infinite Scroll (somente se o elemento existir)
        const tableContainer = document.getElementById('tableContainer');
        if (tableContainer) {
            tableContainer.addEventListener('scroll', function() {
                if (this.scrollTop + this.clientHeight >= this.scrollHeight - 100) {
                    if (hasMoreLogs && !isLoadingMore) {
                        logsPage++;
                        loadLogs(true);
                    }
                }
            });
        }

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

        // Toggle auto-refresh (somente se o elemento existir - compatibilidade com versão antiga)
        const toggleAutoRefreshBtn = document.getElementById('toggleAutoRefresh');
        if (toggleAutoRefreshBtn) {
            toggleAutoRefreshBtn.addEventListener('click', function() {
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
        }

        // ============= FUNÇÕES DE AUTO-REFRESH (SISTEMA ANTIGO - SIMPLIFICADO) =============
        // Nota: O countdown visual foi removido. Mantido apenas refresh automático.
        
        function startRefreshInterval() {
            if (refreshInterval) clearInterval(refreshInterval);
            
            // ⏱️ Aumentado de 10s para 30s para evitar refresh excessivo
            refreshInterval = setInterval(() => {
                if (autoRefresh) {
                    loadAllData();
                }
            }, 30000);
        }

        function stopRefreshInterval() {
            if (refreshInterval) {
                clearInterval(refreshInterval);
                refreshInterval = null;
            }
        }
        
        // Funções vazias para compatibilidade (elementos não existem mais)
        function startCountdown() { /* Countdown visual removido */ }
        function stopCountdown() { /* Countdown visual removido */ }
        function resetCountdown() { /* Countdown visual removido */ }

        // ============= LISTA UNIFICADA DE SEGURANÇA E IPs =============
        
        // Variável global para modal de confirmação
        let confirmActionData = {
            action: null,
            ip: null,
            callback: null
        };
        
        // Estado global da lista unificada
        const unifiedListState = {
            allData: [],
            filteredData: [],
            displayData: [],
            currentPage: 1,
            itemsPerPage: 20,
            currentFilter: 'all',
            currentSort: 'lastSeen',
            searchTerm: '',
            autoRefresh: true,
            autoRefreshInterval: null,
            autoRefreshSeconds: 30, // ⏱️ Aumentado de 10s para 30s
            expandedCards: {}, // 💾 Preservar cards expandidos: { 'IP': true/false }
            scrollPosition: 0, // 💾 Preservar posição do scroll
            lastInteraction: Date.now(), // ⏸️ Para pausar refresh em interação
            pauseRefreshTimeout: null // ⏸️ Timeout para retomar refresh
        };
        
        // Toggle seção unificada
        function toggleUnifiedSection() {
            const content = document.getElementById('unified-section-content');
            const icon = document.getElementById('unified-section-icon');
            
            if (content.style.display === 'none') {
                content.style.display = 'block';
                icon.textContent = '▼';
                loadUnifiedList();
            } else {
                content.style.display = 'none';
                icon.textContent = '▶';
            }
        }
        
        // Carregar lista unificada
        async function loadUnifiedList(preserveState = true) {
            try {
                // 💾 SALVAR ESTADO ATUAL (antes de recarregar)
                if (preserveState) {
                    // Salvar scroll
                    const listContainer = document.getElementById('unified-list');
                    if (listContainer) {
                        unifiedListState.scrollPosition = listContainer.parentElement?.scrollTop || 0;
                    }
                    
                    // Salvar cards expandidos
                    document.querySelectorAll('.unified-ip-card.expanded').forEach(card => {
                        const ip = card.getAttribute('data-ip');
                        if (ip) unifiedListState.expandedCards[ip] = true;
                    });
                }
                
                // ⚡ Feedback visual sutil (sem loading destrutivo)
                const listContainer = document.getElementById('unified-list');
                const existingContent = listContainer?.innerHTML || '';
                
                // Adicionar indicador de atualização sutil
                const refreshIndicator = document.createElement('div');
                refreshIndicator.id = 'unified-refresh-indicator';
                refreshIndicator.style.cssText = 'position: fixed; top: 20px; right: 20px; background: rgba(37, 99, 235, 0.9); color: white; padding: 10px 20px; border-radius: 25px; font-size: 0.85em; z-index: 10000; animation: pulse 1.5s ease-in-out infinite;';
                refreshIndicator.innerHTML = '🔄 Atualizando...';
                document.body.appendChild(refreshIndicator);
                
                const params = new URLSearchParams({
                    page: unifiedListState.currentPage,
                    limit: unifiedListState.itemsPerPage,
                    filter: unifiedListState.currentFilter,
                    sort: unifiedListState.currentSort,
                    search: unifiedListState.searchTerm
                });
                
                const response = await fetch(\`/api/security/unified?\${params}\`);
                const data = await response.json();
                
                // Remover indicador
                refreshIndicator.remove();
                
                if (data.success) {
                    unifiedListState.allData = data.data || [];
                    unifiedListState.filteredData = data.data || [];
                    unifiedListState.displayData = data.data || [];
                    
                    // Atualizar estatísticas (com valores padrão)
                    const summary = data.summary || { total: 0, normal: 0, warning: 0, suspended: 0, blocked: 0 };
                    updateUnifiedStatistics(summary);
                    
                    // Renderizar cards
                    renderUnifiedCards(data.data || []);
                    
                    // ♻️ RESTAURAR ESTADO SALVO
                    if (preserveState) {
                        // Restaurar cards expandidos
                        setTimeout(() => {
                            Object.keys(unifiedListState.expandedCards).forEach(ip => {
                                if (unifiedListState.expandedCards[ip]) {
                                    const card = document.querySelector(\`[data-ip="\${ip}"]\`);
                                    if (card) {
                                        card.classList.add('expanded');
                                    }
                                }
                            });
                            
                            // Restaurar scroll
                            if (unifiedListState.scrollPosition > 0 && listContainer.parentElement) {
                                listContainer.parentElement.scrollTop = unifiedListState.scrollPosition;
                            }
                        }, 100);
                    }
                    
                    // Atualizar paginação (apenas se existir)
                    if (data.pagination) {
                        updateUnifiedPagination(data.pagination);
                    } else {
                        // Se não há paginação, esconder controles
                        const paginationDiv = document.getElementById('unified-pagination');
                        if (paginationDiv) paginationDiv.style.display = 'none';
                    }
                } else {
                    showUnifiedError(data.error || 'Erro ao carregar dados');
                }
            } catch (error) {
                console.error('Erro ao carregar lista unificada:', error);
                
                // Remover indicador em caso de erro
                const indicator = document.getElementById('unified-refresh-indicator');
                if (indicator) indicator.remove();
                
                showUnifiedError('Erro de conexão com o servidor');
            }
        }
        
        // Atualizar estatísticas
        function updateUnifiedStatistics(summary) {
            document.getElementById('unified-count-normal').textContent = summary.normal || 0;
            document.getElementById('unified-count-warning').textContent = summary.warning || 0;
            document.getElementById('unified-count-suspended').textContent = summary.suspended || 0;
            document.getElementById('unified-count-blocked').textContent = summary.blocked || 0;
            
            document.getElementById('filter-count-all').textContent = summary.total || 0;
            document.getElementById('filter-count-normal').textContent = summary.normal || 0;
            document.getElementById('filter-count-warning').textContent = summary.warning || 0;
            document.getElementById('filter-count-suspended').textContent = summary.suspended || 0;
            document.getElementById('filter-count-blocked').textContent = summary.blocked || 0;
            
            const badge = document.getElementById('unified-status-badge');
            if (summary.blocked > 0 || summary.suspended > 0) {
                badge.textContent = \`\${summary.blocked + summary.suspended} Ameaças Ativas\`;
                badge.className = 'badge badge-danger';
            } else if (summary.warning > 0) {
                badge.textContent = \`\${summary.warning} IPs em Aviso\`;
                badge.className = 'badge badge-warning';
            } else {
                badge.textContent = 'Sistema Ativo';
                badge.className = 'badge badge-success';
            }
        }
        
        // Renderizar cards
        function renderUnifiedCards(ips) {
            const listContainer = document.getElementById('unified-list');
            
            if (!ips || ips.length === 0) {
                listContainer.innerHTML = \`
                    <div class="unified-empty-state">
                        <div class="unified-empty-icon">🔍</div>
                        <div class="unified-empty-message">Nenhum IP encontrado</div>
                        <div class="unified-empty-hint">
                            \${unifiedListState.searchTerm 
                                ? 'Tente ajustar os filtros ou termo de busca' 
                                : 'Adicione IPs manualmente ou aguarde acessos à API'}
                        </div>
                    </div>
                \`;
                return;
            }
            
            const cardsHTML = ips.map(ipData => createUnifiedCard(ipData)).join('');
            listContainer.innerHTML = cardsHTML;
        }
        
        // Criar card de IP
        function createUnifiedCard(ipData) {
            const { ip, status, stats, security, isSuspicious } = ipData;
            
            const statusInfo = {
                normal: { icon: '✅', label: 'Normal', color: 'success' },
                warning: { icon: '⚠️', label: 'Aviso', color: 'warning' },
                suspended: { icon: '⏳', label: 'Suspenso', color: 'info' },
                blocked: { icon: '🚫', label: 'Bloqueado', color: 'danger' }
            }[status] || { icon: '❓', label: 'Desconhecido', color: 'secondary' };
            
            const actions = getAvailableActions(status, ip); // Passar o IP para verificar se é o próprio
            
            return \`
                <div class="unified-ip-card status-\${status}" data-ip="\${ip}">
                    <div class="unified-ip-header" onclick="toggleCardDetails('\${ip}')">
                        <div class="unified-ip-header-left">
                            <div class="unified-ip-icon">\${statusInfo.icon}</div>
                            <div>
                                <div class="unified-ip-address">\${ip}</div>
                                <span class="unified-ip-status-badge status-\${status}">
                                    \${statusInfo.label}
                                </span>
                            </div>
                        </div>
                        <div class="unified-ip-header-right">
                            <span class="expand-icon">▼</span>
                        </div>
                    </div>
                    
                    <div class="unified-ip-stats">
                        <div class="unified-ip-stat">
                            <span class="unified-ip-stat-icon">📊</span>
                            <span class="unified-ip-stat-value">\${stats.totalAttempts || 0}</span>
                            <span>tentativas</span>
                        </div>
                        <div class="unified-ip-stat">
                            <span class="unified-ip-stat-icon">✅</span>
                            <span class="unified-ip-stat-value">\${stats.authorized || 0}</span>
                            <span>autorizadas</span>
                        </div>
                        <div class="unified-ip-stat">
                            <span class="unified-ip-stat-icon">❌</span>
                            <span class="unified-ip-stat-value">\${stats.denied || 0}</span>
                            <span>negadas</span>
                        </div>
                        <div class="unified-ip-stat">
                            <span class="unified-ip-stat-icon">🕐</span>
                            <span class="unified-ip-stat-value">\${formatDateTime(stats.lastSeen)}</span>
                        </div>
                    </div>
                    
                    <div class="unified-ip-actions">
                        \${actions.map(action => {
                            const disabledAttr = action.disabled ? 'disabled' : '';
                            const onclickAttr = action.disabled ? '' : 'onclick="' + action.handler + '(&quot;' + ip + '&quot;)"';
                            return '<button class="action-btn btn-' + action.type + '" ' + disabledAttr + ' ' + onclickAttr + '>' + action.icon + ' ' + action.label + '</button>';
                        }).join('')}
                    </div>
                    
                    <div class="unified-ip-details">
                        <div class="unified-details-grid">
                            <div class="unified-detail-section">
                                <div class="unified-detail-title">
                                    🔒 Informações de Segurança
                                </div>
                                <ul class="unified-detail-list">
                                    <li><strong>Tentativas de acesso:</strong> \${security.attempts || 0}</li>
                                    <li><strong>Tentativas restantes:</strong> \${security.remainingAttempts || 'N/A'}</li>
                                    <li><strong>Contagem de suspensões:</strong> \${security.suspensionCount || 0}</li>
                                    \${security.lastSuspension ? \`<li><strong>Última suspensão:</strong> \${formatDateTime(security.lastSuspension)}</li>\` : ''}
                                    \${security.blockReason ? \`<li><strong>Motivo do bloqueio:</strong> \${security.blockReason}</li>\` : ''}
                                </ul>
                            </div>
                            
                            <div class="unified-detail-section">
                                <div class="unified-detail-title">
                                    📊 Estatísticas de Acesso
                                </div>
                                <ul class="unified-detail-list">
                                    <li><strong>Total de acessos:</strong> \${stats.totalAttempts || 0}</li>
                                    <li><strong>Autorizados:</strong> \${stats.authorized || 0}</li>
                                    <li><strong>Negados:</strong> \${stats.denied || 0}</li>
                                    <li><strong>Taxa de sucesso:</strong> \${calculateSuccessRate(stats)}%</li>
                                    <li><strong>Último acesso:</strong> \${formatDateTime(stats.lastSeen)}</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            \`;
        }
        
        // Determinar ações disponíveis
        function getAvailableActions(status, ip) {
            const actions = [
                { type: 'history', icon: '📜', label: 'Histórico', handler: 'openHistoryModal' }
            ];
            
            // ⚠️ VERIFICAR SE É O PRÓPRIO IP DO CLIENTE
            const clientIp = '${clientIp}'; // IP do cliente que está acessando o dashboard
            const isOwnIP = (ip === clientIp) || (ip === '127.0.0.1' && clientIp === '127.0.0.1');
            
            // Se for o próprio IP, mostrar alerta em vez de ações perigosas
            if (isOwnIP) {
                return [
                    { 
                        type: 'warning', 
                        icon: '🏠', 
                        label: 'Seu IP (Não pode modificar)', 
                        handler: 'showOwnIPWarning',
                        disabled: true
                    },
                    { type: 'history', icon: '📜', label: 'Ver Histórico', handler: 'openHistoryModal' }
                ];
            }
            
            if (status === 'normal') {
                actions.unshift({ type: 'warn', icon: '⚠️', label: 'Avisar', handler: 'confirmWarnIP' });
            }
            
            if (status === 'normal' || status === 'warning') {
                actions.unshift({ type: 'suspend', icon: '⏳', label: 'Suspender', handler: 'confirmSuspendIP' });
                actions.unshift({ type: 'block', icon: '🚫', label: 'Bloquear', handler: 'confirmBlockIP' });
            }
            
            if (status === 'warning' || status === 'suspended' || status === 'blocked') {
                actions.unshift({ type: 'clear', icon: '✅', label: 'Limpar Status', handler: 'confirmClearIP' });
            }
            
            return actions;
        }
        
        // Mostrar aviso quando tentar modificar próprio IP
        function showOwnIPWarning() {
            showToast('🏠 Este é o seu próprio IP! Você não pode modificá-lo para evitar se bloquear acidentalmente.', 'warning');
        }
        
        // Toggle detalhes do card
        function toggleCardDetails(ip) {
            const card = document.querySelector(\`[data-ip="\${ip}"]\`);
            if (card) {
                const isExpanded = card.classList.toggle('expanded');
                
                // 💾 SALVAR ESTADO
                unifiedListState.expandedCards[ip] = isExpanded;
                
                // ⏸️ PAUSAR REFRESH (retomar após 5s de inatividade)
                pauseAutoRefresh();
            }
        }
        
        // ⏸️ Pausar auto-refresh durante interação
        function pauseAutoRefresh() {
            unifiedListState.lastInteraction = Date.now();
            
            // Limpar timeout anterior
            if (unifiedListState.pauseRefreshTimeout) {
                clearTimeout(unifiedListState.pauseRefreshTimeout);
            }
            
            // Retomar após 5 segundos de inatividade
            unifiedListState.pauseRefreshTimeout = setTimeout(() => {
                unifiedListState.lastInteraction = null;
            }, 5000);
        }
        
        // Trocar filtro
        function changeUnifiedFilter(filter) {
            // ⏸️ PAUSAR REFRESH durante mudança de filtro
            pauseAutoRefresh();
            
            unifiedListState.currentFilter = filter;
            unifiedListState.currentPage = 1;
            
            document.querySelectorAll('.filter-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelector(\`[data-filter="\${filter}"]\`).classList.add('active');
            
            // Não preservar estado de expansão ao mudar filtro (resetar)
            unifiedListState.expandedCards = {};
            loadUnifiedList(false); // false = não preservar estado (nova visualização)
        }
        
        // Buscar por IP
        function searchUnifiedList() {
            const searchInput = document.getElementById('unified-search-input');
            unifiedListState.searchTerm = searchInput.value.trim();
            unifiedListState.currentPage = 1;
            loadUnifiedList();
        }
        
        // Ordenar lista
        function sortUnifiedList() {
            const sortSelect = document.getElementById('unified-sort-select');
            unifiedListState.currentSort = sortSelect.value;
            loadUnifiedList();
        }
        
        // Navegar páginas
        function changePage(direction) {
            if (direction === 'prev' && unifiedListState.currentPage > 1) {
                unifiedListState.currentPage--;
            } else if (direction === 'next') {
                unifiedListState.currentPage++;
            }
            loadUnifiedList();
        }
        
        // Atualizar paginação
        function updateUnifiedPagination(pagination) {
            const paginationDiv = document.getElementById('unified-pagination');
            
            // Verificar se pagination existe e tem dados válidos
            if (!pagination || !pagination.totalPages || pagination.totalPages <= 1) {
                if (paginationDiv) paginationDiv.style.display = 'none';
                return;
            }
            
            paginationDiv.style.display = 'flex';
            
            document.getElementById('pagination-start').textContent = ((pagination.page - 1) * pagination.limit) + 1;
            document.getElementById('pagination-end').textContent = Math.min(pagination.page * pagination.limit, pagination.total);
            document.getElementById('pagination-total').textContent = pagination.total;
            document.getElementById('pagination-current').textContent = pagination.page;
            document.getElementById('pagination-pages').textContent = pagination.totalPages;
            
            const prevBtn = document.getElementById('pagination-prev');
            const nextBtn = document.getElementById('pagination-next');
            
            prevBtn.disabled = pagination.page === 1;
            nextBtn.disabled = pagination.page === pagination.totalPages;
        }
        
        // Toggle auto-refresh
        function toggleUnifiedAutoRefresh() {
            const toggle = document.getElementById('unified-auto-refresh-toggle');
            unifiedListState.autoRefresh = !unifiedListState.autoRefresh;
            
            if (unifiedListState.autoRefresh) {
                toggle.classList.add('active');
                startUnifiedAutoRefresh();
            } else {
                toggle.classList.remove('active');
                stopUnifiedAutoRefresh();
            }
        }
        
        function startUnifiedAutoRefresh() {
            stopUnifiedAutoRefresh();
            
            let seconds = unifiedListState.autoRefreshSeconds;
            const countdownEl = document.getElementById('unified-countdown');
            
            unifiedListState.autoRefreshInterval = setInterval(() => {
                // ⏸️ NÃO ATUALIZAR se usuário interagiu recentemente
                const timeSinceInteraction = unifiedListState.lastInteraction 
                    ? Date.now() - unifiedListState.lastInteraction 
                    : Infinity;
                    
                if (timeSinceInteraction < 5000) {
                    // Usuário interagiu há menos de 5s, pausar countdown
                    if (countdownEl) countdownEl.textContent = '⏸️';
                    return;
                }
                
                seconds--;
                if (countdownEl) countdownEl.textContent = \`\${seconds}s\`;
                
                if (seconds <= 0) {
                    loadUnifiedList(true); // true = preservar estado
                    seconds = unifiedListState.autoRefreshSeconds;
                }
            }, 1000);
        }
        
        function stopUnifiedAutoRefresh() {
            if (unifiedListState.autoRefreshInterval) {
                clearInterval(unifiedListState.autoRefreshInterval);
                unifiedListState.autoRefreshInterval = null;
            }
        }
        
        // Mostrar erro
        function showUnifiedError(message) {
            const listContainer = document.getElementById('unified-list');
            listContainer.innerHTML = \`
                <div class="unified-empty-state">
                    <div class="unified-empty-icon">⚠️</div>
                    <div class="unified-empty-message">Erro ao Carregar</div>
                    <div class="unified-empty-hint">\${message}</div>
                    <button class="btn success" onclick="loadUnifiedList()" style="margin-top: 20px;">
                        🔄 Tentar Novamente
                    </button>
                </div>
            \`;
        }
        
        // Calcular taxa de sucesso
        function calculateSuccessRate(stats) {
            if (!stats.totalAttempts || stats.totalAttempts === 0) return 0;
            return Math.round((stats.authorized / stats.totalAttempts) * 100);
        }
        
        // ============= MODAIS E AÇÕES =============
        
        // MODAL: ADICIONAR IP
        function openAddIPModal() {
            const modal = document.getElementById('addIPModal');
            modal.style.display = 'flex';
            document.getElementById('add-ip-address').value = '';
            document.getElementById('add-ip-status').value = 'warning';
            document.getElementById('add-ip-reason').value = '';
            document.getElementById('add-ip-address').focus();
        }
        
        function closeAddIPModal() {
            const modal = document.getElementById('addIPModal');
            modal.style.display = 'none';
        }
        
        async function submitAddIP() {
            const ip = document.getElementById('add-ip-address').value.trim();
            const status = document.getElementById('add-ip-status').value;
            const reason = document.getElementById('add-ip-reason').value.trim();
            
            if (!ip) {
                showToast('❌ Digite um endereço IP', 'error');
                return;
            }
            
            const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
            if (!ipPattern.test(ip)) {
                showToast('❌ Formato de IP inválido', 'error');
                return;
            }
            
            if (!reason) {
                showToast('❌ Digite o motivo da ação', 'error');
                return;
            }
            
            try {
                const response = await fetch('/api/security/add-ip', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ip, status, reason })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showToast('✅ IP adicionado com sucesso!', 'success');
                    closeAddIPModal();
                    loadUnifiedList();
                } else {
                    showToast(\`❌ Erro: \${data.error}\`, 'error');
                }
            } catch (error) {
                console.error('Erro ao adicionar IP:', error);
                showToast('❌ Erro de conexão com o servidor', 'error');
            }
        }
        
        // MODAL: HISTÓRICO
        async function openHistoryModal(ip) {
            const modal = document.getElementById('historyModal');
            modal.style.display = 'flex';
            document.getElementById('history-ip-address').textContent = ip;
            
            const timeline = document.getElementById('history-timeline');
            timeline.innerHTML = \`
                <div style="text-align: center; padding: 40px;">
                    <div class="spinner"></div>
                    <p style="margin-top: 15px; color: var(--dark-text-muted);">Carregando histórico...</p>
                </div>
            \`;
            
            await loadIPHistory(ip);
        }
        
        function closeHistoryModal() {
            const modal = document.getElementById('historyModal');
            modal.style.display = 'none';
        }
        
        async function loadIPHistory(ip) {
            try {
                const response = await fetch(\`/api/security/history/\${ip}\`);
                const data = await response.json();
                
                if (data.success) {
                    renderHistoryTimeline(data.history);
                } else {
                    document.getElementById('history-timeline').innerHTML = \`
                        <div style="text-align: center; padding: 40px; color: var(--danger);">
                            <div style="font-size: 3em; margin-bottom: 15px;">⚠️</div>
                            <p><strong>Erro ao carregar histórico</strong></p>
                            <p style="color: var(--dark-text-muted); margin-top: 10px;">\${data.error}</p>
                        </div>
                    \`;
                }
            } catch (error) {
                console.error('Erro ao carregar histórico:', error);
                document.getElementById('history-timeline').innerHTML = \`
                    <div style="text-align: center; padding: 40px; color: var(--danger);">
                        <div style="font-size: 3em; margin-bottom: 15px;">❌</div>
                        <p><strong>Erro de conexão</strong></p>
                    </div>
                \`;
            }
        }
        
        function renderHistoryTimeline(history) {
            const timeline = document.getElementById('history-timeline');
            
            if (!history || history.length === 0) {
                timeline.innerHTML = \`
                    <div style="text-align: center; padding: 40px; color: var(--dark-text-muted);">
                        <div style="font-size: 3em; margin-bottom: 15px;">📜</div>
                        <p><strong>Nenhum histórico encontrado</strong></p>
                        <p style="margin-top: 10px;">Este IP ainda não possui mudanças de status registradas</p>
                    </div>
                \`;
                return;
            }
            
            const statusColors = {
                normal: 'var(--success)',
                warning: 'var(--warning)',
                suspended: 'var(--info)',
                blocked: 'var(--danger)'
            };
            
            const statusIcons = {
                normal: '✅',
                warning: '⚠️',
                suspended: '⏳',
                blocked: '🚫'
            };
            
            const timelineHTML = history.map((entry, index) => {
                const toColor = statusColors[entry.toStatus] || 'var(--text-muted)';
                
                return \`
                    <div style="
                        position: relative;
                        padding: 20px;
                        padding-left: 50px;
                        border-left: 3px solid \${toColor};
                        margin-bottom: \${index === history.length - 1 ? '0' : '20px'};
                    ">
                        <div style="
                            position: absolute;
                            left: -15px;
                            top: 20px;
                            width: 30px;
                            height: 30px;
                            background: \${toColor};
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 1.2em;
                            border: 3px solid var(--bg-primary);
                        ">
                            \${statusIcons[entry.toStatus] || '•'}
                        </div>
                        
                        <div style="margin-bottom: 8px;">
                            <strong style="font-size: 1.1em; color: var(--text-light);">
                                \${entry.fromStatus} → \${entry.toStatus}
                            </strong>
                        </div>
                        
                        <div style="color: var(--dark-text-muted); font-size: 0.9em; margin-bottom: 8px;">
                            🕐 \${formatDateTime(entry.timestamp)}
                        </div>
                        
                        <div style="margin-bottom: 6px;">
                            <strong>Motivo:</strong> \${entry.reason || 'Não especificado'}
                        </div>
                        
                        <div>
                            <span style="
                                display: inline-block;
                                padding: 4px 10px;
                                background: rgba(255, 255, 255, 0.1);
                                border-radius: 8px;
                                font-size: 0.85em;
                            ">
                                \${entry.triggeredBy === 'admin' ? '👤 Manual' : '🤖 Automático'}
                            </span>
                            \${entry.metadata && entry.metadata.duration ? \`
                                <span style="
                                    display: inline-block;
                                    padding: 4px 10px;
                                    background: rgba(255, 255, 255, 0.1);
                                    border-radius: 8px;
                                    font-size: 0.85em;
                                    margin-left: 8px;
                                ">
                                    ⏱️ \${entry.metadata.duration / 1000 / 60} min
                                </span>
                            \` : ''}
                        </div>
                    </div>
                \`;
            }).join('');
            
            timeline.innerHTML = timelineHTML;
        }
        
        // FUNÇÕES DE API
        async function warnIPManually(ip) {
            const reason = prompt(\`Avisar IP \${ip}\n\nDigite o motivo do aviso:\`, 'Aviso manual');
            if (!reason) return;
            
            try {
                const response = await fetch(\`/api/security/warn-manual/\${ip}\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showToast('✅ Aviso adicionado com sucesso!', 'success');
                    loadUnifiedList();
                } else {
                    showToast(\`❌ Erro: \${data.error}\`, 'error');
                }
            } catch (error) {
                console.error('Erro ao avisar IP:', error);
                showToast('❌ Erro de conexão', 'error');
            }
        }
        
        async function suspendIPManually(ip) {
            const reason = prompt(\`Suspender IP \${ip}\n\nDigite o motivo da suspensão:\`, 'Suspensão manual');
            if (!reason) return;
            
            try {
                const response = await fetch(\`/api/security/suspend/\${ip}\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showToast('✅ IP suspenso com sucesso!', 'success');
                    loadUnifiedList();
                } else {
                    showToast(\`❌ Erro: \${data.error}\`, 'error');
                }
            } catch (error) {
                console.error('Erro ao suspender IP:', error);
                showToast('❌ Erro de conexão', 'error');
            }
        }
        
        async function blockIPManually(ip) {
            const reason = prompt(\`Bloquear IP \${ip}\n\nDigite o motivo do bloqueio:\`, 'Bloqueio manual');
            if (!reason) return;
            
            try {
                const response = await fetch(\`/api/security/block/\${ip}\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showToast('✅ IP bloqueado com sucesso!', 'success');
                    loadUnifiedList();
                } else {
                    showToast(\`❌ Erro: \${data.error}\`, 'error');
                }
            } catch (error) {
                console.error('Erro ao bloquear IP:', error);
                showToast('❌ Erro de conexão', 'error');
            }
        }
        
        async function clearIPStatus(ip) {
            try {
                const response = await fetch(\`/api/security/clear-status/\${ip}\`, {
                    method: 'POST'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showToast('✅ Status limpo com sucesso!', 'success');
                    loadUnifiedList();
                } else {
                    showToast(\`❌ Erro: \${data.error}\`, 'error');
                }
            } catch (error) {
                console.error('Erro ao limpar status:', error);
                showToast('❌ Erro de conexão', 'error');
            }
        }
        
        // MODAL: CONFIRMAÇÃO
        function confirmWarnIP(ip) {
            confirmActionData = { action: 'warn', ip: ip, callback: warnIPManually };
            document.getElementById('confirm-action-title').textContent = '⚠️ Confirmar Aviso';
            document.getElementById('confirm-action-message').textContent = 
                'Você tem certeza que deseja adicionar um aviso a este IP? Esta ação registrará uma tentativa de acesso negada.';
            document.getElementById('confirm-action-ip').textContent = ip;
            document.getElementById('confirm-action-btn').className = 'btn warning';
            document.getElementById('confirm-action-btn').textContent = '⚠️ Avisar';
            document.getElementById('confirmActionModal').style.display = 'flex';
        }
        
        function confirmSuspendIP(ip) {
            confirmActionData = { action: 'suspend', ip: ip, callback: suspendIPManually };
            document.getElementById('confirm-action-title').textContent = '⏳ Confirmar Suspensão';
            document.getElementById('confirm-action-message').textContent = 
                'Você tem certeza que deseja suspender este IP temporariamente? O IP ficará bloqueado por 60 minutos.';
            document.getElementById('confirm-action-ip').textContent = ip;
            document.getElementById('confirm-action-btn').className = 'btn info';
            document.getElementById('confirm-action-btn').textContent = '⏳ Suspender';
            document.getElementById('confirmActionModal').style.display = 'flex';
        }
        
        function confirmBlockIP(ip) {
            confirmActionData = { action: 'block', ip: ip, callback: blockIPManually };
            document.getElementById('confirm-action-title').textContent = '🚫 Confirmar Bloqueio';
            document.getElementById('confirm-action-message').textContent = 
                'Você tem certeza que deseja bloquear este IP permanentemente? Esta ação só pode ser revertida manualmente.';
            document.getElementById('confirm-action-ip').textContent = ip;
            document.getElementById('confirm-action-btn').className = 'btn danger';
            document.getElementById('confirm-action-btn').textContent = '🚫 Bloquear';
            document.getElementById('confirmActionModal').style.display = 'flex';
        }
        
        function confirmClearIP(ip) {
            confirmActionData = { action: 'clear', ip: ip, callback: clearIPStatus };
            document.getElementById('confirm-action-title').textContent = '✅ Confirmar Limpeza de Status';
            document.getElementById('confirm-action-message').textContent = 
                'Você tem certeza que deseja limpar o status deste IP? Todos os avisos, suspensões e bloqueios serão removidos.';
            document.getElementById('confirm-action-ip').textContent = ip;
            document.getElementById('confirm-action-btn').className = 'btn success';
            document.getElementById('confirm-action-btn').textContent = '✅ Limpar';
            document.getElementById('confirmActionModal').style.display = 'flex';
        }
        
        function closeConfirmModal() {
            document.getElementById('confirmActionModal').style.display = 'none';
            confirmActionData = { action: null, ip: null, callback: null };
        }
        
        async function executeConfirmedAction() {
            // Salvar callback antes de fechar o modal
            const callback = confirmActionData.callback;
            const ip = confirmActionData.ip;
            
            // Fechar modal primeiro
            document.getElementById('confirmActionModal').style.display = 'none';
            
            // Executar callback se existir
            if (callback && typeof callback === 'function' && ip) {
                try {
                    await callback(ip);
                } catch (error) {
                    console.error('Erro ao executar ação:', error);
                    showToast('❌ Erro ao executar ação', 'error');
                } finally {
                    // Limpar dados após execução
                    confirmActionData = { action: null, ip: null, callback: null };
                }
            } else {
                // Limpar se não houver callback válido
                confirmActionData = { action: null, ip: null, callback: null };
            }
        }
        
        // ============= FIM LISTA UNIFICADA =============

        // Carregar todos os dados
        function loadAllData() {
            loadGeneralStats();
            loadIPStats();
            logsPage = 1;
            loadLogs(false);
            resetCountdown();
            
            // 🔄 Auto-refresh da lista unificada se estiver aberta (com preservação de estado)
            const unifiedContent = document.getElementById('unified-section-content');
            if (unifiedContent && unifiedContent.style.display !== 'none') {
                loadUnifiedList(true); // true = preservar estado
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
            console.log('[DEBUG] renderWarningIPs chamada com:', ips);
            const container = document.getElementById('warnings-ips-list');
            console.log('[DEBUG] Container warnings-ips-list encontrado:', container ? 'SIM' : 'NÃO');
            
            if (!container) {
                console.error('[ERRO] Container warnings-ips-list não encontrado!');
                return;
            }
            
            if (ips.length === 0) {
                console.log('[DEBUG] Nenhum IP com avisos, mostrando mensagem vazia');
                container.innerHTML = \`
                    <div class="security-empty">
                        <div class="security-empty-icon">✅</div>
                        <div>Nenhum IP com avisos</div>
                    </div>
                \`;
                return;
            }
            
            console.log('[DEBUG] Renderizando', ips.length, 'IPs com avisos');
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
                                    <span>\${formatDateTime(item.lastAttempt)}</span>
                                </span>
                            \` : ''}
                        </div>
                    </div>
                </div>
            \`).join('');
            console.log('[DEBUG] HTML renderizado, tamanho:', container.innerHTML.length, 'caracteres');
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

        // Inicializar
        detectMyIP(); // Detectar IP do usuário primeiro
        checkZeroTierStatus(); // Verificar status ZeroTier
        loadAllData();
        loadUnifiedList(); // Carregar lista unificada no início
        startCountdown();
        startRefreshInterval();
        startUnifiedAutoRefresh(); // Iniciar auto-refresh da lista unificada
        
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
