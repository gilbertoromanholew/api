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
            padding: 25px;
        }
        
        /* Header */
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            padding: 40px;
            border-radius: 20px;
            margin-bottom: 35px;
            text-align: center;
            box-shadow: 0 15px 40px rgba(102, 126, 234, 0.4);
            position: relative;
            overflow: hidden;
        }

        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
            animation: rotate 20s linear infinite;
        }

        @keyframes rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .header h1 {
            color: white;
            font-size: 3em;
            margin-bottom: 12px;
            position: relative;
            z-index: 1;
            text-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            font-weight: 800;
            letter-spacing: -1px;
        }
        
        .header .subtitle {
            color: rgba(255,255,255,0.95);
            font-size: 1.15em;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            position: relative;
            z-index: 1;
            font-weight: 500;
        }
        
        .live-indicator {
            display: inline-block;
            width: 14px;
            height: 14px;
            background: var(--success);
            border-radius: 50%;
            animation: pulse 2s infinite;
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
        }
        
        @keyframes pulse {
            0%, 100% { 
                opacity: 1; 
                box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
                transform: scale(1);
            }
            50% { 
                opacity: 0.8; 
                box-shadow: 0 0 0 12px rgba(16, 185, 129, 0);
                transform: scale(1.1);
            }
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
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 24px;
            margin-bottom: 35px;
        }
        
        .stat-card {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
            padding: 28px;
            border-radius: 14px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            position: relative;
            overflow: hidden;
        }

        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 5px;
            height: 100%;
            background: var(--primary);
            transition: width 0.3s ease;
        }

        .stat-card::after {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, transparent 70%);
            opacity: 0;
            transition: opacity 0.3s;
        }
        
        .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            border-color: rgba(255, 255, 255, 0.15);
        }

        .stat-card:hover::before {
            width: 8px;
        }

        .stat-card:hover::after {
            opacity: 1;
        }
        
        .stat-card.success::before { background: var(--success); }
        .stat-card.danger::before { background: var(--danger); }
        .stat-card.warning::before { background: var(--warning); }
        .stat-card.info::before { background: var(--info); }

        .stat-card.success:hover { box-shadow: 0 8px 25px rgba(16, 185, 129, 0.15); }
        .stat-card.danger:hover { box-shadow: 0 8px 25px rgba(239, 68, 68, 0.15); }
        .stat-card.warning:hover { box-shadow: 0 8px 25px rgba(251, 191, 36, 0.15); }
        .stat-card.info:hover { box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15); }
        
        .stat-value {
            font-size: 2.8em;
            font-weight: 800;
            color: var(--primary);
            margin-bottom: 8px;
            position: relative;
            z-index: 1;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }
        
        .stat-card.success .stat-value { color: var(--success); }
        .stat-card.danger .stat-value { color: var(--danger); }
        .stat-card.warning .stat-value { color: var(--warning); }
        .stat-card.info .stat-value { color: var(--info); }
        
        .stat-label {
            color: var(--text-muted);
            font-size: 0.92em;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
            position: relative;
            z-index: 1;
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
            background: linear-gradient(135deg, var(--primary) 0%, #2563eb 100%);
            color: white;
            border: none;
            padding: 11px 22px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 0.92em;
            font-weight: 600;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: inline-flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
            position: relative;
            overflow: hidden;
        }

        .btn::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: translate(-50%, -50%);
            transition: width 0.6s, height 0.6s;
        }

        .btn:hover::before {
            width: 300px;
            height: 300px;
        }
        
        .btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.5);
        }

        .btn:active {
            transform: translateY(-1px);
        }
        
        .btn.danger {
            background: linear-gradient(135deg, var(--danger) 0%, #dc2626 100%);
            box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
        }
        
        .btn.danger:hover {
            box-shadow: 0 8px 25px rgba(239, 68, 68, 0.5);
        }
        
        .btn.success {
            background: linear-gradient(135deg, var(--success) 0%, #059669 100%);
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }
        
        .btn.success:hover {
            box-shadow: 0 8px 25px rgba(16, 185, 129, 0.5);
        }

        .btn.secondary {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
            border: 1px solid rgba(255, 255, 255, 0.25);
            color: var(--text-light);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .btn.secondary:hover {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
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
            gap: 18px;
            margin-bottom: 25px;
            flex-wrap: wrap;
            align-items: center;
        }
        
        .filter-input, .filter-select {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
            border: 1px solid rgba(255, 255, 255, 0.15);
            color: var(--text-light);
            padding: 12px 18px;
            border-radius: 10px;
            font-size: 0.95em;
            transition: all 0.3s;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .filter-input:focus, .filter-select:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2), 0 4px 12px rgba(0, 0, 0, 0.15);
            transform: translateY(-2px);
        }

        .filter-input::placeholder {
            color: rgba(255, 255, 255, 0.4);
        }

        /* PAINEL DE FILTROS DE LOGS - REORGANIZADO */
        .logs-filters-panel {
            display: flex;
            flex-direction: column;
            gap: 16px;
            padding: 20px;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 51, 234, 0.08) 100%);
            border: 1px solid rgba(59, 130, 246, 0.2);
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .filters-row {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
            align-items: flex-end;
        }

        .filter-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
            flex: 1;
            min-width: 180px;
        }

        .filter-label {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--text-light);
            font-weight: 600;
            font-size: 0.9em;
            letter-spacing: 0.3px;
        }

        .filter-icon {
            font-size: 1.1em;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .filter-select.modern,
        .filter-input.modern {
            background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%);
            border: 2px solid rgba(255, 255, 255, 0.2);
            color: var(--text-light);
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 0.95em;
            font-weight: 500;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            cursor: pointer;
        }

        .filter-select.modern option {
            background: #1e293b;
            color: var(--text-light);
            padding: 10px;
        }

        .filter-select.modern option:hover,
        .filter-select.modern option:checked,
        .filter-select.modern option:focus {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
        }

        .filter-select.modern:hover,
        .filter-input.modern:hover {
            border-color: rgba(59, 130, 246, 0.5);
            background: linear-gradient(135deg, rgba(30, 41, 59, 1) 0%, rgba(15, 23, 42, 1) 100%);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .filter-select.modern:focus,
        .filter-input.modern:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.25), 0 4px 16px rgba(0, 0, 0, 0.25);
            transform: translateY(-2px);
            background: linear-gradient(135deg, rgba(30, 41, 59, 1) 0%, rgba(15, 23, 42, 1) 100%);
        }

        .filter-input.modern::placeholder {
            color: rgba(255, 255, 255, 0.5);
            font-weight: 400;
        }

        .btn-clear-filters {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%);
            border: 2px solid rgba(239, 68, 68, 0.4);
            color: #f87171;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 0.95em;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            letter-spacing: 0.3px;
        }

        .btn-clear-filters:hover {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.3) 100%);
            border-color: rgba(239, 68, 68, 0.6);
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
        }

        .btn-clear-filters:active {
            transform: translateY(0);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
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
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 20px;
            padding: 5px;
        }
        
        .ip-card {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
            padding: 24px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .ip-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--primary) 0%, var(--info) 100%);
            transform: scaleX(0);
            transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .ip-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 12px 35px rgba(59, 130, 246, 0.25);
            border-color: var(--primary);
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 51, 234, 0.05) 100%);
        }

        .ip-card:hover::before {
            transform: scaleX(1);
        }
        
        .ip-card.suspicious {
            border-color: rgba(239, 68, 68, 0.4);
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.05) 100%);
        }

        .ip-card.suspicious::before {
            background: linear-gradient(90deg, var(--danger) 0%, #dc2626 100%);
        }

        .ip-card.suspicious:hover {
            box-shadow: 0 12px 35px rgba(239, 68, 68, 0.3);
            border-color: var(--danger);
        }
        
        .ip-address {
            font-family: 'Courier New', monospace;
            font-size: 1.15em;
            color: var(--primary);
            font-weight: 700;
            margin-bottom: 18px;
            display: flex;
            align-items: center;
            gap: 12px;
            padding-bottom: 12px;
            border-bottom: 2px solid rgba(255, 255, 255, 0.08);
        }
        
        .ip-stat {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            font-size: 0.92em;
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.02);
            border-radius: 6px;
            transition: all 0.3s;
        }

        .ip-stat:hover {
            background: rgba(255, 255, 255, 0.05);
            transform: translateX(4px);
        }
        
        .ip-stat-label {
            color: var(--text-muted);
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .ip-stat-value {
            color: var(--text-light);
            font-weight: 700;
            font-size: 1.05em;
        }
        
        /* Toast Notification */
        .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--card-bg);
            color: var(--text-light);
            padding: 20px 25px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.4);
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
        }
        
        .toast.error {
            border-left: 5px solid var(--danger);
        }
        
        .toast.warning {
            border-left: 5px solid var(--warning);
        }
        
        .toast.info {
            border-left: 5px solid var(--info);
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
            color: var(--text-light);
        }
        
        .toast-message {
            font-size: 0.9em;
            opacity: 0.9;
            color: var(--text-light);
        }
        
        .toast-close {
            background: none;
            border: none;
            color: var(--text-light);
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
            background: rgba(0, 0, 0, 0.92);
            backdrop-filter: blur(8px);
            z-index: 10000;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        .modal-content {
            background: var(--card-bg);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 15px;
            width: 100%;
            max-width: 550px;
            max-height: 85vh;
            overflow-y: auto;
            overflow-x: hidden;
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
            padding: 20px 22px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.15);
        }

        .modal-header h2 {
            margin: 0;
            font-size: 1.3em;
            color: var(--text-light);
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .modal-close {
            background: rgba(255, 255, 255, 0.1);
            color: var(--text-light);
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 1.1em;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
            flex-shrink: 0;
        }

        .modal-close:hover {
            background: var(--danger);
            transform: rotate(90deg);
        }

        .modal-body {
            padding: 22px;
        }

        .modal-body > div {
            margin-bottom: 18px;
        }

        .modal-body > div:last-child {
            margin-bottom: 0;
        }

        .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            padding: 18px 22px;
            border-top: 1px solid rgba(255, 255, 255, 0.15);
        }

        /* Modal de Histórico */
        .modal-history {
            max-width: 1000px;
            max-height: 90vh !important;
            height: 90vh;
            display: flex;
            flex-direction: column;
            overflow: hidden !important;
        }

        .modal-history .modal-header {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);
            border-bottom: 2px solid rgba(59, 130, 246, 0.3);
            flex-shrink: 0;
        }

        .modal-history .modal-body {
            flex: 1 1 auto;
            overflow: hidden !important;
            display: flex;
            flex-direction: column;
            min-height: 0;
            height: 100%;
        }

        .modal-history .modal-footer {
            flex-shrink: 0;
        }

        /* Sistema de Abas */
        .tabs-container {
            width: 100%;
            flex: 1 1 auto;
            display: flex;
            flex-direction: column;
            min-height: 0;
            max-height: 100%;
            overflow: hidden !important;
            height: 100%;
        }

        .tabs-header {
            flex: 0 0 auto;
            display: flex;
            gap: 0;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 10px 10px 0 0;
            padding: 8px 8px 0 8px;
            border-bottom: 2px solid rgba(255, 255, 255, 0.1);
        }

        .tab-btn {
            flex: 1;
            padding: 14px 20px;
            background: transparent;
            border: none;
            border-radius: 8px 8px 0 0;
            color: var(--text-muted);
            font-size: 0.95em;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            position: relative;
        }

        .tab-btn::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: var(--primary);
            transform: scaleX(0);
            transition: transform 0.3s;
        }

        .tab-btn:hover {
            color: var(--text-light);
            background: rgba(255, 255, 255, 0.08);
        }

        .tab-btn.active {
            color: var(--primary);
            background: rgba(59, 130, 246, 0.15);
            box-shadow: 0 -2px 10px rgba(59, 130, 246, 0.2);
        }

        .tab-btn.active::after {
            transform: scaleX(1);
        }

        .tab-icon {
            font-size: 1.2em;
        }

        .tab-label {
            font-weight: 600;
        }

        .tabs-content {
            width: 100%;
            flex: 1 1 auto;
            overflow: hidden !important;
            background: rgba(0, 0, 0, 0.1);
            min-height: 0;
            max-height: 100%;
            position: relative;
            height: 100%;
        }

        .tab-content {
            display: none;
            height: 100%;
            animation: fadeInSlide 0.4s ease-out;
            min-height: 0;
            max-height: 100%;
            overflow: hidden !important;
        }

        .tab-content.active {
            display: flex;
            flex-direction: column;
            min-height: 0;
            max-height: 100%;
            height: 100%;
        }

        .history-scroll-area {
            flex: 1 1 auto;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            padding: 20px;
            background: linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, transparent 20px);
            min-height: 0;
            max-height: 100%;
            height: 100%;
            -webkit-overflow-scrolling: touch;
        }

        .history-scroll-area::-webkit-scrollbar {
            width: 10px;
        }

        .history-scroll-area::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 5px;
        }

        .history-scroll-area::-webkit-scrollbar-thumb {
            background: rgba(59, 130, 246, 0.5);
            border-radius: 5px;
            border: 2px solid rgba(0, 0, 0, 0.2);
        }

        .history-scroll-area::-webkit-scrollbar-thumb:hover {
            background: rgba(59, 130, 246, 0.7);
        }

        @keyframes fadeInSlide {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Estilos de Formulário do Modal */
        .modal-body input[type="text"],
        .modal-body select,
        .modal-body textarea {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.25);
            color: var(--text-light);
            padding: 10px 14px;
            border-radius: 8px;
            font-size: 0.95em;
            transition: all 0.3s;
            width: 100%;
            box-sizing: border-box;
        }

        .modal-body input[type="text"]:focus,
        .modal-body select:focus,
        .modal-body textarea:focus {
            outline: none;
            border-color: var(--primary);
            background: rgba(255, 255, 255, 0.08);
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }

        .modal-body input[type="text"]::placeholder,
        .modal-body textarea::placeholder {
            color: rgba(255, 255, 255, 0.4);
        }

        .modal-body label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            font-size: 0.9em;
            color: var(--text-light);
        }

        .modal-body small {
            color: rgba(255, 255, 255, 0.5);
            display: block;
            margin-top: 5px;
            font-size: 0.8em;
            line-height: 1.4;
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

        .unified-stat-card.status-authorized .unified-stat-value {
            color: #10b981;
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
            background: rgba(255, 255, 255, 0.08);
            color: var(--text-light);
            padding: 10px 20px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.25);
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .filter-tab:hover {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.4);
        }

        .filter-tab.active {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            border-color: transparent;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
        }

        .filter-tab .count {
            background: rgba(255, 255, 255, 0.25);
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 0.85em;
            font-weight: bold;
        }

        .filter-tab.active .count {
            background: rgba(255, 255, 255, 0.35);
            font-weight: 800;
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
            background: rgba(15, 23, 42, 0.5);
            border-radius: 12px;
            padding: 20px;
            border-left: 5px solid var(--border);
            transition: all 0.3s ease;
            position: relative;
        }

        .unified-ip-card:hover {
            background: rgba(30, 41, 59, 0.9);
            transform: translateX(8px);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
            border-left-width: 6px;
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

        .unified-ip-card.status-authorized {
            border-left-color: #10b981;
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
            background: rgba(5, 150, 105, 0.25);
            color: #10b981;
            border: 1px solid rgba(5, 150, 105, 0.4);
        }

        .unified-ip-status-badge.status-warning {
            background: rgba(217, 119, 6, 0.25);
            color: #fb923c;
            border: 1px solid rgba(217, 119, 6, 0.4);
        }

        .unified-ip-status-badge.status-suspended {
            background: rgba(8, 145, 178, 0.25);
            color: #22d3ee;
            border: 1px solid rgba(8, 145, 178, 0.4);
        }

        .unified-ip-status-badge.status-blocked {
            background: rgba(220, 38, 38, 0.25);
            color: #f87171;
            border: 1px solid rgba(220, 38, 38, 0.4);
        }

        .unified-ip-status-badge.status-authorized {
            background: rgba(16, 185, 129, 0.25);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.4);
        }

        /* Access Level Badges */
        .access-level-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            border-radius: 8px;
            font-size: 0.75em;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-left: 8px;
        }

        .access-level-badge.level-admin {
            background: linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(245, 158, 11, 0.3));
            color: #fbbf24;
            border: 1px solid rgba(251, 191, 36, 0.6);
            font-weight: 700;
            box-shadow: 0 0 15px rgba(251, 191, 36, 0.3);
            animation: glow-admin 2s ease-in-out infinite;
        }

        @keyframes glow-admin {
            0%, 100% { box-shadow: 0 0 10px rgba(251, 191, 36, 0.3); }
            50% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.5); }
        }

        .access-level-badge.level-trusted {
            background: rgba(16, 185, 129, 0.25);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.4);
        }

        .access-level-badge.level-guest {
            background: rgba(59, 130, 246, 0.25);
            color: #3b82f6;
            border: 1px solid rgba(59, 130, 246, 0.4);
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
            background: rgba(255, 255, 255, 0.08);
            color: var(--text-light);
            padding: 8px 16px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.25);
            cursor: pointer;
            font-size: 0.9em;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.3s ease;
        }

        .action-btn:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.18);
            border-color: rgba(255, 255, 255, 0.4);
            transform: translateY(-3px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }

        .action-btn:active:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
        }

        .action-btn[disabled],
        .action-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
            pointer-events: none;
            filter: grayscale(50%);
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
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 10px;
            padding: 18px;
            transition: all 0.3s;
        }

        .unified-detail-section:hover {
            background: rgba(255, 255, 255, 0.12);
            border-color: rgba(255, 255, 255, 0.25);
        }

        .unified-detail-title {
            color: var(--text-light);
            font-weight: 600;
            font-size: 1.05em;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid rgba(255, 255, 255, 0.2);
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
            opacity: 0.4;
            cursor: not-allowed;
            filter: grayscale(70%);
            background: rgba(255, 255, 255, 0.03);
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
                        <div class="unified-stat-card status-authorized">
                            <div class="unified-stat-icon">🔓</div>
                            <div class="unified-stat-value" id="unified-count-authorized">0</div>
                            <div class="unified-stat-label">Autorizados</div>
                        </div>
                    </div>
                </div>

                <!-- CONTROLS: Botões de Ação -->
                <div class="unified-controls">
                    <div class="unified-controls-left">
                        <button class="btn-add-ip" onclick="openAuthorizeIPModal()" style="background: linear-gradient(135deg, #10b981, #059669);">
                            ➕ Autorizar IP
                        </button>
                        <button class="btn-refresh" onclick="loadUnifiedList()">
                            🔄 Atualizar
                        </button>
                    </div>
                    <div class="unified-controls-right">
                        <div class="auto-refresh-toggle">
                            <span>Auto-refresh:</span>
                            <div class="toggle-switch active" id="unified-auto-refresh-toggle" onclick="toggleUnifiedAutoRefresh()"></div>
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
                        <button class="filter-tab" data-filter="authorized" onclick="changeUnifiedFilter('authorized')">
                            🔓 Autorizados
                            <span class="count" id="filter-count-authorized">0</span>
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
        <!-- Modal: Autorizar IP -->
        <div id="authorizeIPModal" class="modal">
            <div class="modal-content" style="max-width: 550px;">
                <div class="modal-header">
                    <h2>🔓 Autorizar IP para Acesso à API</h2>
                    <button class="modal-close" onclick="closeAuthorizeIPModal()">✖</button>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 20px;">
                        <label for="authorize-ip-address">
                            📍 Endereço IP:
                        </label>
                        <input type="text" 
                               id="authorize-ip-address" 
                               placeholder="Ex: 192.168.1.100"
                        />
                        <small>
                            Digite o IP que você deseja autorizar a fazer requisições à API
                        </small>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label for="authorize-ip-level">
                            🎚️ Nível de Acesso:
                        </label>
                        <select id="authorize-ip-level" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--dark-border); background: var(--card-bg); color: var(--text-light); font-size: 0.95em;">
                            <option value="guest">👤 Guest - Documentação + Funções</option>
                            <option value="trusted">🤝 Trusted - API Completa (não pode gerenciar segurança)</option>
                        </select>
                        <small id="level-description" style="display: block; margin-top: 8px; padding: 10px; background: rgba(59, 130, 246, 0.1); border-left: 3px solid #3b82f6; border-radius: 4px;">
                            <strong>👤 Guest:</strong> Acesso a <code>/docs</code> e endpoints das funções disponíveis (ex: /api/exemplo, /api/pdf). Ideal para testar a API.
                        </small>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label for="authorize-ip-reason">
                            📝 Motivo (opcional):
                        </label>
                        <textarea id="authorize-ip-reason" 
                                  placeholder="Ex: Servidor de produção, desenvolvedor aprovado, cliente X, etc." 
                                  rows="3" 
                                  style="resize: vertical;"
                        ></textarea>
                        <small>
                            Adicione uma descrição para identificar este IP no futuro
                        </small>
                    </div>

                    <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 15px; margin-top: 15px;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                            <span style="font-size: 1.3em;">⚡</span>
                            <strong style="color: #10b981;">Autorização Temporária</strong>
                        </div>
                        <small style="color: rgba(255, 255, 255, 0.7); line-height: 1.5;">
                            Este IP será <strong>autorizado apenas em memória</strong> e poderá fazer requisições à API conforme o nível selecionado. <strong style="color: #fbbf24;">Ao reiniciar o servidor, esta autorização será perdida.</strong>
                        </small>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn secondary" onclick="closeAuthorizeIPModal()">
                        ❌ Cancelar
                    </button>
                    <button class="btn success" onclick="submitAuthorizeIP()">
                        🔓 Autorizar
                    </button>
                </div>
            </div>
        </div>

        <!-- Modal: Histórico de Status -->
        <div id="historyModal" class="modal">
            <div class="modal-content modal-history">
                <div class="modal-header">
                    <div>
                        <h2 style="margin: 0; display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 1.3em;">📜</span>
                            <span>Histórico do IP</span>
                        </h2>
                        <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px;">
                            <span style="color: var(--text-muted); font-size: 0.9em;">Endereço:</span>
                            <span id="history-ip-address" style="font-family: 'Courier New', monospace; color: var(--primary); font-weight: 600; font-size: 1.05em;"></span>
                        </div>
                    </div>
                    <button class="modal-close" onclick="closeHistoryModal()">✖</button>
                </div>
                
                <div class="modal-body" style="padding: 0;">
                    <!-- Sistema de Abas -->
                    <div class="tabs-container">
                        <div class="tabs-header">
                            <button class="tab-btn active" onclick="switchHistoryTab('changes')" id="tab-changes">
                                <span class="tab-icon">🔄</span>
                                <span class="tab-label">Alterações de Status</span>
                            </button>
                            <button class="tab-btn" onclick="switchHistoryTab('endpoints')" id="tab-endpoints">
                                <span class="tab-icon">🌐</span>
                                <span class="tab-label">Endpoints Acessados</span>
                            </button>
                        </div>
                        
                        <div class="tabs-content">
                            <!-- Aba: Alterações de Status -->
                            <div id="tab-content-changes" class="tab-content active">
                                <div id="history-timeline" class="history-scroll-area">
                                    <!-- Timeline será preenchida dinamicamente -->
                                </div>
                            </div>
                            
                            <!-- Aba: Endpoints Acessados -->
                            <div id="tab-content-endpoints" class="tab-content">
                                <div id="history-endpoints" class="history-scroll-area">
                                    <!-- Logs de acesso serão preenchidos dinamicamente -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer" style="background: rgba(255, 255, 255, 0.02); border-top: 2px solid rgba(255, 255, 255, 0.1);">
                    <button class="btn secondary" onclick="closeHistoryModal()" style="min-width: 120px;">
                        ✖ Fechar
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

        <!-- Rate Limiting & Alertas de Segurança (Fase 3) -->
        <div class="section">
            <div class="section-header">
                <h2 class="section-title" style="cursor: pointer; user-select: none; display: flex; align-items: center; gap: 10px;" onclick="toggleRateLimitSection()">
                    <span id="ratelimit-section-icon">▶</span>
                    🛡️ Rate Limiting & Alertas de Segurança
                    <span class="badge badge-warning" id="ratelimit-status-badge">Carregando...</span>
                </h2>
            </div>
            <div id="ratelimit-section-content" style="display: none; padding-top: 20px;">
                <!-- Stats Cards -->
                <div class="stats-grid">
                    <div class="stat-card info">
                        <div class="stat-label">🌐 IPs Monitorados</div>
                        <div class="stat-value" id="rl-ips-tracked">...</div>
                    </div>
                    <div class="stat-card info">
                        <div class="stat-label">👤 CPFs Monitorados</div>
                        <div class="stat-value" id="rl-cpfs-tracked">...</div>
                    </div>
                    <div class="stat-card warning">
                        <div class="stat-label">⚠️ Alertas Pendentes</div>
                        <div class="stat-value" id="rl-pending-alerts">...</div>
                    </div>
                    <div class="stat-card danger">
                        <div class="stat-label">🚨 Tentativas Bloqueadas (1h)</div>
                        <div class="stat-value" id="rl-blocked-1h">...</div>
                    </div>
                </div>

                <!-- Alertas Recentes -->
                <div style="margin-top: 25px;">
                    <h3 style="margin: 0 0 15px 0; font-size: 16px; color: var(--warning); display: flex; align-items: center; gap: 8px;">
                        <span>🔔</span> Alertas Recentes
                        <button class="btn" style="margin-left: auto; padding: 8px 15px; font-size: 13px;" onclick="refreshRateLimitData()">
                            🔄 Atualizar
                        </button>
                    </h3>
                    <div id="recent-alerts-container" style="max-height: 400px; overflow-y: auto;">
                        <div class="loading">Carregando alertas...</div>
                    </div>
                </div>

                <!-- Top IPs com mais tentativas -->
                <div style="margin-top: 25px;">
                    <h3 style="margin: 0 0 15px 0; font-size: 16px; color: var(--info);">
                        🏆 Top 10 IPs (Mais Tentativas)
                    </h3>
                    <div id="top-ips-container" style="max-height: 350px; overflow-y: auto;">
                        <div class="loading">Carregando top IPs...</div>
                    </div>
                </div>

                <!-- Métricas de Bloqueio -->
                <div style="margin-top: 25px; padding: 20px; background: rgba(220, 38, 38, 0.1); border-radius: 12px; border-left: 4px solid var(--danger);">
                    <h4 style="margin: 0 0 10px 0; font-size: 14px; color: var(--danger);">🛡️ Detalhes de Proteção:</h4>
                    <ul style="margin: 0; padding-left: 25px; font-size: 13px; line-height: 2; color: var(--text-muted);">
                        <li><strong>Bloqueios (Última 1h):</strong> <span id="rl-blocks-1h-detail">...</span></li>
                        <li><strong>Bloqueios (Últimas 24h):</strong> <span id="rl-blocks-24h-detail">...</span></li>
                        <li><strong>Total de Alertas Criados:</strong> <span id="rl-total-alerts">...</span></li>
                        <li><strong>Alertas por Tipo:</strong> 
                            <div id="rl-alerts-by-type" style="margin-top: 5px; padding-left: 20px;">...</div>
                        </li>
                    </ul>
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

        <!-- Métricas Avançadas -->
        <div class="section">
            <div class="section-header">
                <h2 class="section-title" style="cursor: pointer; user-select: none; display: flex; align-items: center; gap: 10px;" onclick="toggleMetricsSection()">
                    <span id="metrics-section-icon">▶</span>
                    📊 Métricas Avançadas
                </h2>
            </div>
            <div id="metrics-section-content" style="display: none; padding-top: 20px;">
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
        </div>

        <!-- Recent Logs -->
        <div class="section">
            <div class="section-header" style="flex-direction: column; align-items: stretch; gap: 20px;">
                <h2 class="section-title" style="cursor: pointer; user-select: none; display: flex; align-items: center; gap: 10px;" onclick="toggleLogsSection()">
                    <span id="logs-section-icon">▼</span>
                    📝 Logs de Acesso Recentes
                </h2>
                
                <!-- PAINEL DE FILTROS REORGANIZADO -->
                <div id="logs-controls" class="logs-filters-panel" style="display: flex;">
                    <!-- Linha 1: Quantidade e Status -->
                    <div class="filters-row">
                        <div class="filter-group">
                            <label class="filter-label">
                                <span class="filter-icon">📊</span>
                                <span>Quantidade</span>
                            </label>
                            <select class="filter-select modern" id="limitSelect" onchange="updateLogsLimit()">
                                <option value="25">25 registros</option>
                                <option value="50" selected>50 registros</option>
                                <option value="100">100 registros</option>
                                <option value="200">200 registros</option>
                                <option value="500">500 registros</option>
                                <option value="all">Todos os registros</option>
                            </select>
                        </div>
                        
                        <div class="filter-group">
                            <label class="filter-label">
                                <span class="filter-icon">🔐</span>
                                <span>Status de Acesso</span>
                            </label>
                            <select class="filter-select modern" id="authorizedFilter" onchange="loadLogs()">
                                <option value="">Todos os status</option>
                                <option value="true">✅ Apenas Autorizados</option>
                                <option value="false">❌ Apenas Negados</option>
                            </select>
                        </div>
                        
                        <div class="filter-group">
                            <label class="filter-label">
                                <span class="filter-icon">🌐</span>
                                <span>Método HTTP</span>
                            </label>
                            <select class="filter-select modern" id="methodFilter" onchange="loadLogs()">
                                <option value="">Todos os métodos</option>
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                                <option value="DELETE">DELETE</option>
                                <option value="PATCH">PATCH</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Linha 2: Busca e Ações -->
                    <div class="filters-row">
                        <div class="filter-group" style="flex: 2;">
                            <label class="filter-label">
                                <span class="filter-icon">🔗</span>
                                <span>Buscar por Endpoint</span>
                            </label>
                            <input type="text" 
                                   class="filter-input modern" 
                                   id="endpointFilter" 
                                   placeholder="Digite o endpoint (ex: /api/logs, /docs...)" 
                                   onkeyup="filterLogsLocally()">
                        </div>
                        
                        <div class="filter-group">
                            <label class="filter-label">
                                <span class="filter-icon">📍</span>
                                <span>Buscar por IP</span>
                            </label>
                            <input type="text" 
                                   class="filter-input modern" 
                                   id="ipFilter" 
                                   placeholder="Ex: 192.168.1.1" 
                                   onkeyup="filterLogsLocally()">
                        </div>
                        
                        <div class="filter-group" style="justify-content: flex-end;">
                            <button class="btn-clear-filters" onclick="clearLogsFilters()">
                                <span>🗑️</span>
                                <span>Limpar Filtros</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="table-container" id="tableContainer" style="display: block;">
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

        // ============================================
        // FASE 3: Rate Limiting & Alertas
        // ============================================

        /**
         * Carregar dados de Rate Limiting e Alertas
         * Chamado automaticamente no loadGeneralStats()
         */
        async function loadRateLimitData() {
            try {
                const response = await fetch('/auth/dashboard');
                const data = await response.json();
                
                if (!data.success) {
                    console.error('Erro ao carregar dados de rate limiting:', data.error);
                    document.getElementById('ratelimit-status-badge').textContent = 'Erro';
                    document.getElementById('ratelimit-status-badge').className = 'badge badge-danger';
                    return;
                }

                const { overview, alerts, attempts, topIPs } = data.data;

                // Atualizar badge de status
                const badge = document.getElementById('ratelimit-status-badge');
                if (overview.pendingAlerts > 0) {
                    badge.textContent = \`\${overview.pendingAlerts} Pendente(s)\`;
                    badge.className = 'badge badge-warning';
                } else {
                    badge.textContent = 'Ativo';
                    badge.className = 'badge badge-success';
                }

                // Atualizar cards de estatísticas
                document.getElementById('rl-ips-tracked').textContent = overview.totalIPsTracked || 0;
                document.getElementById('rl-cpfs-tracked').textContent = overview.totalCPFsTracked || 0;
                document.getElementById('rl-pending-alerts').textContent = overview.pendingAlerts || 0;
                document.getElementById('rl-blocked-1h').textContent = overview.blockedAttemptsLast1h || 0;

                // Atualizar métricas detalhadas
                document.getElementById('rl-blocks-1h-detail').textContent = overview.blockedAttemptsLast1h || 0;
                document.getElementById('rl-blocks-24h-detail').textContent = overview.blockedAttemptsLast24h || 0;
                document.getElementById('rl-total-alerts').textContent = alerts.stats.total || 0;

                // Alertas por tipo
                if (alerts.stats.byType) {
                    const typesList = Object.entries(alerts.stats.byType)
                        .map(([type, count]) => {
                            const typeLabels = {
                                'brute_force': '🔨 Força Bruta',
                                'suspicious_activity': '🕵️ Atividade Suspeita',
                                'account_compromise': '⚠️ Comprometimento de Conta'
                            };
                            return \`<li>\${typeLabels[type] || type}: <strong>\${count}</strong></li>\`;
                        })
                        .join('');
                    document.getElementById('rl-alerts-by-type').innerHTML = \`<ul style="margin: 0; padding-left: 20px;">\${typesList}</ul>\`;
                } else {
                    document.getElementById('rl-alerts-by-type').textContent = 'Nenhum alerta';
                }

                // Renderizar alertas recentes
                renderRecentAlerts(alerts.recent || []);

                // Renderizar top IPs
                renderTopIPs(topIPs || []);

            } catch (error) {
                console.error('Erro ao carregar dados de rate limiting:', error);
                document.getElementById('ratelimit-status-badge').textContent = 'Offline';
                document.getElementById('ratelimit-status-badge').className = 'badge badge-danger';
            }
        }

        /**
         * Renderizar lista de alertas recentes
         */
        function renderRecentAlerts(alerts) {
            const container = document.getElementById('recent-alerts-container');
            
            if (alerts.length === 0) {
                container.innerHTML = \`
                    <div style="padding: 30px; text-align: center; color: var(--text-muted);">
                        <div style="font-size: 3em; margin-bottom: 10px;">✅</div>
                        <div>Nenhum alerta de segurança</div>
                    </div>
                \`;
                return;
            }

            const alertsHTML = alerts.map(alert => {
                const typeIcons = {
                    'brute_force': '🔨',
                    'suspicious_activity': '🕵️',
                    'account_compromise': '⚠️'
                };
                const statusColors = {
                    'pending': 'warning',
                    'sent': 'success',
                    'failed': 'danger'
                };
                const statusLabels = {
                    'pending': 'Pendente',
                    'sent': 'Enviado',
                    'failed': 'Falhou'
                };

                const timestamp = new Date(alert.timestamp).toLocaleString('pt-BR');
                const icon = typeIcons[alert.type] || '🔔';
                const statusColor = statusColors[alert.status] || 'info';
                const statusLabel = statusLabels[alert.status] || alert.status;

                return \`
                    <div style="
                        padding: 15px;
                        margin-bottom: 10px;
                        background: rgba(255, 255, 255, 0.03);
                        border-radius: 8px;
                        border-left: 4px solid var(--\${statusColor});
                        transition: all 0.3s;
                    " onmouseover="this.style.background='rgba(255,255,255,0.06)'" 
                       onmouseout="this.style.background='rgba(255,255,255,0.03)'">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 1.5em;">\${icon}</span>
                                <div>
                                    <div style="font-weight: 600; font-size: 14px;">\${alert.message}</div>
                                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 3px;">
                                        📅 \${timestamp}
                                    </div>
                                </div>
                            </div>
                            <span class="badge badge-\${statusColor}" style="font-size: 11px;">
                                \${statusLabel}
                            </span>
                        </div>
                        <div style="font-size: 12px; color: var(--text-muted); padding-left: 42px;">
                            <strong>CPF:</strong> \${alert.cpf} | 
                            <strong>IP:</strong> \${alert.ip || 'N/A'}
                        </div>
                    </div>
                \`;
            }).join('');

            container.innerHTML = alertsHTML;
        }

        /**
         * Renderizar top IPs com mais tentativas
         */
        function renderTopIPs(topIPs) {
            const container = document.getElementById('top-ips-container');
            
            if (topIPs.length === 0) {
                container.innerHTML = \`
                    <div style="padding: 30px; text-align: center; color: var(--text-muted);">
                        <div style="font-size: 3em; margin-bottom: 10px;">📊</div>
                        <div>Nenhum dado disponível</div>
                    </div>
                \`;
                return;
            }

            const maxCount = topIPs[0].count;
            const topIPsHTML = topIPs.map((item, index) => {
                const percentage = (item.count / maxCount) * 100;
                const medalIcons = ['🥇', '🥈', '🥉'];
                const medal = index < 3 ? medalIcons[index] : \`\${index + 1}º\`;
                
                return \`
                    <div style="
                        margin-bottom: 12px;
                        padding: 12px;
                        background: rgba(255, 255, 255, 0.03);
                        border-radius: 8px;
                        transition: all 0.3s;
                    " onmouseover="this.style.background='rgba(255,255,255,0.06)'" 
                       onmouseout="this.style.background='rgba(255,255,255,0.03)'">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <span style="font-size: 1.3em; min-width: 35px;">\${medal}</span>
                                <span style="font-family: 'Courier New', monospace; font-weight: 600;">
                                    \${item.ip}
                                </span>
                            </div>
                            <span style="font-weight: 700; color: var(--primary);">
                                \${item.count} tentativas
                            </span>
                        </div>
                        <div style="
                            height: 6px;
                            background: rgba(255, 255, 255, 0.1);
                            border-radius: 3px;
                            overflow: hidden;
                        ">
                            <div style="
                                height: 100%;
                                width: \${percentage}%;
                                background: linear-gradient(90deg, var(--primary), var(--primary-light));
                                border-radius: 3px;
                                transition: width 0.5s ease;
                            "></div>
                        </div>
                    </div>
                \`;
            }).join('');

            container.innerHTML = topIPsHTML;
        }

        /**
         * Atualizar dados de rate limiting manualmente
         */
        async function refreshRateLimitData() {
            const btn = event.target;
            const originalText = btn.innerHTML;
            btn.innerHTML = '⏳ Atualizando...';
            btn.disabled = true;

            try {
                await loadRateLimitData();
                showToast('✅ Dados atualizados com sucesso!', 'success');
            } catch (error) {
                showToast('❌ Erro ao atualizar dados', 'error');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }

        /**
         * Toggle da seção de Rate Limiting
         */
        function toggleRateLimitSection() {
            const content = document.getElementById('ratelimit-section-content');
            const icon = document.getElementById('ratelimit-section-icon');
            
            if (content.style.display === 'none') {
                content.style.display = 'block';
                icon.textContent = '▼';
                loadRateLimitData(); // Carregar dados ao abrir
            } else {
                content.style.display = 'none';
                icon.textContent = '▶';
            }
        }

        // ============================================
        // FIM: Rate Limiting & Alertas
        // ============================================

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
                
                // Obter valores dos filtros
                const limitSelect = document.getElementById('limitSelect').value;
                const limit = limitSelect === 'all' ? 10000 : parseInt(limitSelect);
                const authorized = document.getElementById('authorizedFilter').value;
                const method = document.getElementById('methodFilter').value;
                
                let url = '/api/logs?limit=' + (limit * logsPage);
                if (authorized) url += '&authorized=' + authorized;
                if (method) url += '&method=' + method;
                
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.success && data.logs.length > 0) {
                    // Armazenar logs originais para filtro local
                    window.allLogs = data.logs;
                    
                    const logsHtml = data.logs.map(log => {
                        const isSuspicious = !log.is_authorized;
                        const isNightAccess = isNightTime(log.timestamp);
                        const rowClass = isSuspicious ? 'suspicious-row' : isNightAccess ? 'night-access' : '';
                        
                        // Formatar localização com bandeira
                        const countryFlag = log.countryCode ? getFlagEmoji(log.countryCode) : '🌍';
                        const location = log.city && log.country 
                            ? countryFlag + ' ' + log.city + ', ' + log.country
                            : log.country 
                            ? countryFlag + ' ' + log.country
                            : '🌍 Desconhecido';
                        
                        return \`
                            <tr class="\${rowClass}" data-ip="\${log.ip_detected}" data-url="\${log.url || ''}" data-method="\${log.method || 'GET'}">
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
                    
                    // Aplicar filtros locais se existirem
                    filterLogsLocally();
                    
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

        // Atualizar limite de logs
        function updateLogsLimit() {
            logsPage = 1;
            loadLogs();
        }

        // Filtrar logs localmente (sem nova requisição)
        function filterLogsLocally() {
            const endpointFilter = document.getElementById('endpointFilter').value.toLowerCase();
            const ipFilter = document.getElementById('ipFilter').value.toLowerCase();
            
            const rows = document.querySelectorAll('#logsTableBody tr');
            
            rows.forEach(row => {
                const ip = (row.getAttribute('data-ip') || '').toLowerCase();
                const url = (row.getAttribute('data-url') || '').toLowerCase();
                
                const matchEndpoint = !endpointFilter || url.includes(endpointFilter);
                const matchIP = !ipFilter || ip.includes(ipFilter);
                
                if (matchEndpoint && matchIP) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }

        // Limpar todos os filtros
        function clearLogsFilters() {
            document.getElementById('limitSelect').value = '50';
            document.getElementById('authorizedFilter').value = '';
            document.getElementById('methodFilter').value = '';
            document.getElementById('endpointFilter').value = '';
            document.getElementById('ipFilter').value = '';
            loadLogs();
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
                        
                        <!-- Logs de Acesso Recentes -->
                        <div class="detail-section">
                            <h3 class="detail-section-title" style="cursor: pointer; user-select: none;" onclick="toggleDetailSection('recent-logs-\${ip}')">
                                <span id="recent-logs-\${ip}-icon">▼</span> 📋 Logs de Acesso Recentes (últimos 15)
                            </h3>
                            <div id="recent-logs-\${ip}" style="max-height: 500px; overflow-y: auto;">
                                \${ipLogs.slice(0, 15).map((log, index) => {
                                    const statusColor = log.is_authorized ? '#10b981' : '#ef4444';
                                    const statusIcon = log.is_authorized ? '✅' : '❌';
                                    const timestamp = new Date(log.timestamp).toLocaleString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit'
                                    });
                                    
                                    return \`
                                        <div style="background: rgba(255, 255, 255, 0.03); border-left: 3px solid \${statusColor}; padding: 12px; margin-bottom: 8px; border-radius: 6px;">
                                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                                                <div style="flex: 1;">
                                                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                                        <span style="font-size: 1.1em;">\${statusIcon}</span>
                                                        <code style="background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px; font-size: 0.85em; color: #3b82f6;">\${log.method || 'GET'}</code>
                                                        <span style="font-family: 'Courier New', monospace; font-size: 0.9em; color: var(--text-light);">\${log.url || '/'}</span>
                                                    </div>
                                                    <div style="font-size: 0.8em; color: var(--text-muted); margin-left: 32px;">
                                                        🕐 \${timestamp}
                                                    </div>
                                                </div>
                                                <div style="text-align: right;">
                                                    <span style="background: \${statusColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75em; font-weight: 600;">
                                                        \${log.is_authorized ? 'AUTORIZADO' : 'NEGADO'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.85em;">
                                                \${log.browser ? \`
                                                    <div style="display: flex; align-items: center; gap: 6px;">
                                                        <span style="color: var(--text-muted);">🌐</span>
                                                        <span style="color: var(--text-light);">\${log.browser}</span>
                                                    </div>
                                                \` : ''}
                                                \${log.platform ? \`
                                                    <div style="display: flex; align-items: center; gap: 6px;">
                                                        <span style="color: var(--text-muted);">💻</span>
                                                        <span style="color: var(--text-light);">\${log.platform}</span>
                                                    </div>
                                                \` : ''}
                                                \${log.country ? \`
                                                    <div style="display: flex; align-items: center; gap: 6px;">
                                                        <span style="color: var(--text-muted);">🌍</span>
                                                        <span style="color: var(--text-light);">\${log.country}</span>
                                                    </div>
                                                \` : ''}
                                            </div>
                                        </div>
                                    \`;
                                }).join('')}
                                \${ipLogs.length > 15 ? \`
                                    <div style="text-align: center; padding: 12px; color: var(--text-muted); font-size: 0.9em;">
                                        ... e mais \${ipLogs.length - 15} acessos anteriores
                                    </div>
                                \` : ''}
                                \${ipLogs.length === 0 ? \`
                                    <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                                        Nenhum log de acesso encontrado
                                    </div>
                                \` : ''}
                            </div>
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
                        
                        <!-- Logs de Acesso Recentes -->
                        <div class="detail-section">
                            <h3 class="detail-section-title" style="cursor: pointer; user-select: none;" onclick="toggleDetailSection('recent-logs-\${ip}')">
                                <span id="recent-logs-\${ip}-icon">▼</span> 📋 Logs de Acesso Recentes
                            </h3>
                            <div id="recent-logs-\${ip}" style="max-height: 500px; overflow-y: auto;">
                                \${ipLogs.slice(0, 20).reverse().map((log, index) => {
                                    const statusColor = log.is_authorized ? '#10b981' : '#ef4444';
                                    const statusIcon = log.is_authorized ? '✅' : '❌';
                                    const statusText = log.is_authorized ? 'AUTORIZADO' : 'NEGADO';
                                    const timestamp = new Date(log.timestamp).toLocaleString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit'
                                    });
                                    
                                    return \`
                                        <div style="background: rgba(255, 255, 255, 0.03); border-left: 3px solid \${statusColor}; padding: 12px; margin-bottom: 8px; border-radius: 6px;">
                                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                                                <div style="flex: 1;">
                                                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap;">
                                                        <span style="font-size: 1.1em;">\${statusIcon}</span>
                                                        <code style="background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px; font-size: 0.85em; color: #3b82f6; font-weight: 600;">\${log.method || 'GET'}</code>
                                                        <span style="font-family: 'Courier New', monospace; font-size: 0.9em; color: var(--text-light); word-break: break-all;">\${log.url || '/'}</span>
                                                    </div>
                                                    <div style="font-size: 0.8em; color: var(--text-muted); margin-left: 32px;">
                                                        🕐 \${timestamp}
                                                    </div>
                                                </div>
                                                <div style="text-align: right; margin-left: 12px;">
                                                    <span style="background: \${statusColor}; color: white; padding: 4px 10px; border-radius: 4px; font-size: 0.75em; font-weight: 600; white-space: nowrap;">
                                                        \${statusText}
                                                    </span>
                                                </div>
                                            </div>
                                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.85em;">
                                                \${log.browser && log.browser !== 'Desconhecido' ? \`
                                                    <div style="display: flex; align-items: center; gap: 6px;">
                                                        <span style="color: var(--text-muted);">🌐</span>
                                                        <span style="color: var(--text-light);">\${log.browser}</span>
                                                    </div>
                                                \` : ''}
                                                \${log.platform && log.platform !== 'Desconhecido' ? \`
                                                    <div style="display: flex; align-items: center; gap: 6px;">
                                                        <span style="color: var(--text-muted);">💻</span>
                                                        <span style="color: var(--text-light);">\${log.platform}</span>
                                                    </div>
                                                \` : ''}
                                                \${log.country && log.country !== 'Desconhecido' ? \`
                                                    <div style="display: flex; align-items: center; gap: 6px;">
                                                        <span style="color: var(--text-muted);">🌍</span>
                                                        <span style="color: var(--text-light);">\${log.country}</span>
                                                    </div>
                                                \` : ''}
                                            </div>
                                        </div>
                                    \`;
                                }).join('')}
                                \${ipLogs.length > 20 ? \`
                                    <div style="text-align: center; padding: 12px; color: var(--text-muted); font-size: 0.9em; background: rgba(255,255,255,0.02); border-radius: 6px; margin-top: 8px;">
                                        📊 Mostrando os últimos 20 de \${ipLogs.length} acessos totais
                                    </div>
                                \` : ''}
                                \${ipLogs.length === 0 ? \`
                                    <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                                        Nenhum log de acesso encontrado
                                    </div>
                                \` : ''}
                            </div>
                        </div>
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

        // Alternar seção Métricas Avançadas
        function toggleMetricsSection() {
            const content = document.getElementById('metrics-section-content');
            const icon = document.getElementById('metrics-section-icon');
            
            if (content.style.display === 'none') {
                content.style.display = 'block';
                icon.textContent = '▼';
            } else {
                content.style.display = 'none';
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
            
            // ⏱️ Padronizado em 15s para todo o dashboard
            refreshInterval = setInterval(() => {
                if (autoRefresh) {
                    loadAllData();
                }
            }, 15000);
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
            autoRefresh: true, // ✅ Ligado por padrão
            autoRefreshInterval: null,
            autoRefreshSeconds: 15, // ⏱️ Padronizado em 15s (todo o dashboard sincronizado)
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
            document.getElementById('filter-count-authorized').textContent = summary.authorized || 0;
            
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
            const { ip, status, stats, security, isSuspicious, geo } = ipData;
            
            const statusInfo = {
                normal: { icon: '✅', label: 'Normal', color: 'success' },
                warning: { icon: '⚠️', label: 'Aviso', color: 'warning' },
                suspended: { icon: '⏳', label: 'Suspenso', color: 'info' },
                blocked: { icon: '🚫', label: 'Bloqueado', color: 'danger' },
                authorized: { icon: '🔓', label: 'Autorizado', color: 'success' }
            }[status] || { icon: '❓', label: 'Desconhecido', color: 'secondary' };
            
            // Obter nível de acesso (se for IP autorizado)
            const accessLevel = security?.accessLevel || null;
            const accessLevelInfo = accessLevel ? {
                admin: { icon: '🔑', label: 'Admin', color: 'level-admin' },
                trusted: { icon: '🤝', label: 'Trusted', color: 'level-trusted' },
                guest: { icon: '👤', label: 'Guest', color: 'level-guest' }
            }[accessLevel] : null;
            
            const actions = getAvailableActions(status, ip); // Passar o IP para verificar se é o próprio
            
            // Extrair informações de geolocalização
            const country = geo?.country || 'Desconhecido';
            const countryCode = geo?.countryCode || 'XX';
            const city = geo?.city || '';
            const regionName = geo?.regionName || '';
            const isp = geo?.isp || 'Desconhecido';
            const org = geo?.org || '';
            const as = geo?.as || '';
            const timezone = geo?.timezone || '';
            const zip = geo?.zip || '';
            const lat = geo?.lat || 0;
            const lon = geo?.lon || 0;
            const hosting = geo?.hosting || false;
            const proxy = geo?.proxy || false;
            const mobile = geo?.mobile || false;
            
            const flagEmoji = getFlagEmoji(countryCode);
            const locationStr = city && regionName ? \`\${city}, \${regionName} - \${country}\` : (city ? \`\${city}, \${country}\` : country);
            
            return \`
                <div class="unified-ip-card status-\${status}" data-ip="\${ip}">
                    <div class="unified-ip-header" onclick="toggleCardDetails('\${ip}')">
                        <div class="unified-ip-header-left">
                            <div class="unified-ip-icon">\${statusInfo.icon}</div>
                            <div>
                                <div class="unified-ip-address">
                                    \${ip}
                                    \${flagEmoji ? \`<span style="margin-left: 8px; font-size: 1.2em;">\${flagEmoji}</span>\` : ''}
                                </div>
                                <div style="font-size: 0.75em; color: rgba(255,255,255,0.6); margin-top: 2px;">
                                    📍 \${locationStr}
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                                    <span class="unified-ip-status-badge status-\${status}">
                                        \${statusInfo.label}
                                    </span>
                                    \${accessLevelInfo ? \`
                                        <span class="access-level-badge \${accessLevelInfo.color}">
                                            \${accessLevelInfo.icon} \${accessLevelInfo.label}
                                        </span>
                                    \` : ''}
                                </div>
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
                            
                            <div class="unified-detail-section">
                                <div class="unified-detail-title">
                                    🌍 Geolocalização (ip-api.com)
                                </div>
                                <ul class="unified-detail-list">
                                    <li><strong>País:</strong> \${flagEmoji} \${country} (\${countryCode})</li>
                                    \${city ? \`<li><strong>Cidade:</strong> \${city}\${regionName ? ', ' + regionName : ''}</li>\` : ''}
                                    \${zip && zip !== 'N/A' ? \`<li><strong>CEP:</strong> \${zip}</li>\` : ''}
                                    \${timezone ? \`<li><strong>Timezone:</strong> ⏰ \${timezone}</li>\` : ''}
                                    \${lat && lon ? \`<li><strong>Coordenadas:</strong> <a href="https://www.google.com/maps?q=\${lat},\${lon}" target="_blank" style="color: var(--primary);">\${lat}, \${lon} 🗺️</a></li>\` : ''}
                                </ul>
                            </div>
                            
                            <div class="unified-detail-section">
                                <div class="unified-detail-title">
                                    🌐 Informações de Rede
                                </div>
                                <ul class="unified-detail-list">
                                    \${isp && isp !== 'Desconhecido' ? \`<li><strong>ISP:</strong> \${isp}</li>\` : ''}
                                    \${org && org !== 'Desconhecido' ? \`<li><strong>Organização:</strong> \${org}</li>\` : ''}
                                    \${as && as !== 'N/A' ? \`<li><strong>AS:</strong> <span style="font-family: monospace; font-size: 0.9em;">\${as}</span></li>\` : ''}
                                    \${hosting ? \`<li><strong>⚠️ Hospedagem:</strong> <span style="color: var(--warning);">Servidor de Hospedagem Detectado</span></li>\` : ''}
                                    \${proxy ? \`<li><strong>🔒 Proxy/VPN:</strong> <span style="color: var(--danger);">Detectado</span></li>\` : ''}
                                    \${mobile ? \`<li><strong>📱 Rede Móvel:</strong> <span style="color: var(--info);">Sim</span></li>\` : ''}
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
            
            // 🔒 Ações de Segurança (Bloquear/Suspender/Avisar)
            if (status === 'normal') {
                actions.unshift({ type: 'block', icon: '🚫', label: 'Bloquear', handler: 'confirmBlockIP' });
                actions.unshift({ type: 'suspend', icon: '⏳', label: 'Suspender', handler: 'confirmSuspendIP' });
                actions.unshift({ type: 'warn', icon: '⚠️', label: 'Avisar', handler: 'confirmWarnIP' });
            }
            
            if (status === 'warning') {
                actions.unshift({ type: 'block', icon: '🚫', label: 'Bloquear', handler: 'confirmBlockIP' });
                actions.unshift({ type: 'suspend', icon: '⏳', label: 'Suspender', handler: 'confirmSuspendIP' });
                actions.unshift({ type: 'clear', icon: '✅', label: 'Limpar Aviso', handler: 'confirmClearIP' });
            }
            
            if (status === 'suspended') {
                actions.unshift({ type: 'block', icon: '🚫', label: 'Bloquear', handler: 'confirmBlockIP' });
                actions.unshift({ type: 'clear', icon: '✅', label: 'Remover Suspensão', handler: 'confirmClearIP' });
            }
            
            if (status === 'blocked') {
                actions.unshift({ type: 'clear', icon: '✅', label: 'Desbloquear', handler: 'confirmClearIP' });
            }
            
            // 🔓 Autorização de Acesso (apenas para IPs não próprios)
            if (!isOwnIP) {
                if (status === 'authorized') {
                    actions.push({ type: 'unauthorize', icon: '🔒', label: 'Revogar Acesso', handler: 'confirmUnauthorizeIPFromCard' });
                } else {
                    actions.push({ type: 'authorize', icon: '🔓', label: 'Autorizar Acesso', handler: 'confirmAuthorizeIPFromCard' });
                }
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
        
        // MODAL: AUTORIZAR IP
        function openAuthorizeIPModal() {
            const modal = document.getElementById('authorizeIPModal');
            modal.style.display = 'flex';
            document.getElementById('authorize-ip-address').value = '';
            document.getElementById('authorize-ip-level').value = 'guest';
            document.getElementById('authorize-ip-reason').value = '';
            document.getElementById('authorize-ip-address').focus();
            
            // Listener para mudar descrição do nível
            document.getElementById('authorize-ip-level').addEventListener('change', function() {
                const level = this.value;
                const description = document.getElementById('level-description');
                
                if (level === 'guest') {
                    description.innerHTML = '<strong>👤 Guest:</strong> Acesso a <code>/docs</code> e endpoints das funções disponíveis (ex: <code>/api/exemplo</code>, <code>/api/pdf</code>). Ideal para testar a API.';
                    description.style.borderColor = '#3b82f6';
                    description.style.background = 'rgba(59, 130, 246, 0.1)';
                } else if (level === 'trusted') {
                    description.innerHTML = '<strong>🤝 Trusted:</strong> API completa, incluindo todas as funções. <strong>Bloqueio:</strong> não pode acessar <code>/logs</code>, <code>/api/security</code> nem bloquear IPs admin.';
                    description.style.borderColor = '#10b981';
                    description.style.background = 'rgba(16, 185, 129, 0.1)';
                }
            });
        }
        
        function closeAuthorizeIPModal() {
            const modal = document.getElementById('authorizeIPModal');
            modal.style.display = 'none';
            // Desbloquear campo de IP ao fechar e resetar estilos
            const ipField = document.getElementById('authorize-ip-address');
            ipField.readOnly = false;
            ipField.style.background = '';
            ipField.style.cursor = '';
        }
        
        async function submitAuthorizeIP() {
            const ip = document.getElementById('authorize-ip-address').value.trim();
            const level = document.getElementById('authorize-ip-level').value;
            const reason = document.getElementById('authorize-ip-reason').value.trim();
            
            if (!ip) {
                showToast('❌ Digite um endereço IP', 'error');
                return;
            }
            
            // Validação básica - backend fará validação completa
            if (ip.length < 7) {
                showToast('❌ IP muito curto', 'error');
                return;
            }
            
            const levelIcon = level === 'guest' ? '👤' : '🤝';
            const levelName = level === 'guest' ? 'Guest' : 'Trusted';
            const defaultReason = 'IP autorizado como ' + levelName;
            
            try {
                const response = await fetch('/api/security/authorize-ip', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        ip, 
                        level,
                        reason: reason || defaultReason
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showToast(levelIcon + ' IP ' + ip + ' autorizado como ' + levelName + '!', 'success');
                    closeAuthorizeIPModal();
                    loadUnifiedList(); // Recarregar lista para mostrar o nível
                } else {
                    showToast('❌ Erro: ' + data.error, 'error');
                }
            } catch (error) {
                console.error('Erro ao autorizar IP:', error);
                showToast('❌ Erro de conexão com o servidor', 'error');
            }
        }

        // MODAL: HISTÓRICO
        async function openHistoryModal(ip) {
            const modal = document.getElementById('historyModal');
            modal.style.display = 'flex';
            document.getElementById('history-ip-address').textContent = ip;
            
            // Resetar para a primeira aba
            switchHistoryTab('changes');
            
            const timeline = document.getElementById('history-timeline');
            timeline.innerHTML = \`
                <div style="text-align: center; padding: 40px;">
                    <div class="spinner"></div>
                    <p style="margin-top: 15px; color: var(--dark-text-muted);">Carregando histórico...</p>
                </div>
            \`;
            
            const endpoints = document.getElementById('history-endpoints');
            endpoints.innerHTML = \`
                <div style="text-align: center; padding: 40px;">
                    <div class="spinner"></div>
                    <p style="margin-top: 15px; color: var(--dark-text-muted);">Carregando logs de acesso...</p>
                </div>
            \`;
            
            await Promise.all([
                loadIPHistory(ip),
                loadIPEndpointsHistory(ip)
            ]);
        }
        
        function switchHistoryTab(tabName) {
            // Remover classe active de todas as abas
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Adicionar classe active na aba selecionada
            document.getElementById(\`tab-\${tabName}\`).classList.add('active');
            document.getElementById(\`tab-content-\${tabName}\`).classList.add('active');
        }
        
        function closeHistoryModal() {
            const modal = document.getElementById('historyModal');
            modal.style.display = 'none';
        }
        
        async function loadIPEndpointsHistory(ip) {
            try {
                const response = await fetch(\`/api/logs?ip=\${encodeURIComponent(ip)}\`);
                const data = await response.json();
                
                if (data.success && data.logs && data.logs.length > 0) {
                    renderEndpointsHistory(data.logs);
                } else {
                    document.getElementById('history-endpoints').innerHTML = \`
                        <div style="text-align: center; padding: 40px; color: var(--dark-text-muted);">
                            <div style="font-size: 3em; margin-bottom: 15px;">📊</div>
                            <p><strong>Nenhum acesso registrado</strong></p>
                            <p style="margin-top: 10px;">Este IP ainda não realizou acessos</p>
                        </div>
                    \`;
                }
            } catch (error) {
                console.error('Erro ao carregar logs de endpoints:', error);
                document.getElementById('history-endpoints').innerHTML = \`
                    <div style="text-align: center; padding: 40px; color: var(--danger);">
                        <div style="font-size: 3em; margin-bottom: 15px;">❌</div>
                        <p><strong>Erro ao carregar logs</strong></p>
                    </div>
                \`;
            }
        }
        
        function renderEndpointsHistory(logs) {
            const container = document.getElementById('history-endpoints');
            
            const logsHTML = logs.slice(0, 50).map((log, index) => {
                const statusColor = log.is_authorized ? '#10b981' : '#ef4444';
                const statusBg = log.is_authorized ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
                const statusIcon = log.is_authorized ? '✅' : '❌';
                const statusText = log.is_authorized ? 'AUTORIZADO' : 'NEGADO';
                const timestamp = new Date(log.timestamp).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
                
                return \`
                    <div class="log-card" style="
                        background: linear-gradient(135deg, \${statusBg} 0%, rgba(255, 255, 255, 0.02) 100%);
                        border-left: 4px solid \${statusColor};
                        padding: 16px;
                        margin-bottom: 12px;
                        border-radius: 8px;
                        transition: all 0.3s;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    " onmouseenter="this.style.transform='translateX(4px)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.2)'"
                       onmouseleave="this.style.transform='translateX(0)'; this.style.boxShadow='0 2px 8px rgba(0, 0, 0, 0.1)'">
                        
                        <!-- Cabeçalho do Log -->
                        <div style="display: flex; justify-content: space-between; align-items: start; gap: 12px; margin-bottom: 12px;">
                            <div style="flex: 1; min-width: 0;">
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap;">
                                    <span style="font-size: 1.3em; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">\${statusIcon}</span>
                                    <code style="
                                        background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%);
                                        padding: 6px 12px;
                                        border-radius: 6px;
                                        font-size: 0.85em;
                                        color: #60a5fa;
                                        font-weight: 700;
                                        border: 1px solid rgba(59, 130, 246, 0.3);
                                        letter-spacing: 0.5px;
                                    ">\${log.method || 'GET'}</code>
                                    <span style="
                                        font-family: 'Courier New', monospace;
                                        font-size: 0.95em;
                                        color: var(--text-light);
                                        word-break: break-all;
                                        font-weight: 500;
                                    ">\${log.url || '/'}</span>
                                </div>
                                <div style="
                                    font-size: 0.85em;
                                    color: var(--text-muted);
                                    margin-left: 42px;
                                    display: flex;
                                    align-items: center;
                                    gap: 6px;
                                ">
                                    <span style="filter: grayscale(0.3);">🕐</span>
                                    <span>\${timestamp}</span>
                                </div>
                            </div>
                            <div style="text-align: right; flex-shrink: 0;">
                                <span style="
                                    background: \${statusColor};
                                    color: white;
                                    padding: 6px 14px;
                                    border-radius: 6px;
                                    font-size: 0.75em;
                                    font-weight: 700;
                                    white-space: nowrap;
                                    text-transform: uppercase;
                                    letter-spacing: 0.5px;
                                    box-shadow: 0 2px 8px \${statusColor}40;
                                ">\${statusText}</span>
                            </div>
                        </div>
                        
                        <!-- Informações Adicionais -->
                        <div style="
                            display: grid;
                            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                            gap: 10px;
                            padding-top: 12px;
                            border-top: 1px solid rgba(255,255,255,0.08);
                            font-size: 0.88em;
                        ">
                            \${log.browser && log.browser !== 'Desconhecido' ? \`
                                <div style="
                                    display: flex;
                                    align-items: center;
                                    gap: 8px;
                                    background: rgba(255, 255, 255, 0.03);
                                    padding: 6px 10px;
                                    border-radius: 6px;
                                ">
                                    <span style="font-size: 1.1em;">🌐</span>
                                    <span style="color: var(--text-light); font-weight: 500;">\${log.browser}</span>
                                </div>
                            \` : ''}
                            \${log.platform && log.platform !== 'Desconhecido' ? \`
                                <div style="
                                    display: flex;
                                    align-items: center;
                                    gap: 8px;
                                    background: rgba(255, 255, 255, 0.03);
                                    padding: 6px 10px;
                                    border-radius: 6px;
                                ">
                                    <span style="font-size: 1.1em;">💻</span>
                                    <span style="color: var(--text-light); font-weight: 500;">\${log.platform}</span>
                                </div>
                            \` : ''}
                            \${log.country && log.country !== 'Desconhecido' ? \`
                                <div style="
                                    display: flex;
                                    align-items: center;
                                    gap: 8px;
                                    background: rgba(255, 255, 255, 0.03);
                                    padding: 6px 10px;
                                    border-radius: 6px;
                                ">
                                    <span style="font-size: 1.1em;">🌍</span>
                                    <span style="color: var(--text-light); font-weight: 500;">\${log.country}</span>
                                </div>
                            \` : ''}
                        </div>
                    </div>
                \`;
            }).join('');
            
            container.innerHTML = \`
                \${logsHTML}
                \${logs.length > 50 ? \`
                    <div style="
                        text-align: center;
                        padding: 20px;
                        color: var(--text-muted);
                        font-size: 0.95em;
                        background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%);
                        border-radius: 8px;
                        margin-top: 16px;
                        border: 1px solid rgba(59, 130, 246, 0.2);
                    ">
                        <div style="font-size: 2em; margin-bottom: 8px;">📊</div>
                        <strong style="color: var(--primary);">Mostrando os últimos 50 de \${logs.length} acessos totais</strong>
                    </div>
                \` : \`
                    <div style="
                        text-align: center;
                        padding: 16px;
                        color: var(--text-muted);
                        font-size: 0.9em;
                        background: rgba(255, 255, 255, 0.02);
                        border-radius: 6px;
                        margin-top: 12px;
                    ">
                        <strong>Total de \${logs.length} acesso\${logs.length !== 1 ? 's' : ''} registrado\${logs.length !== 1 ? 's' : ''}</strong>
                    </div>
                \`}
            \`;
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
                const response = await fetch(\`/api/security/suspend-manual/\${ip}\`, {
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
                const response = await fetch(\`/api/security/block-manual/\${ip}\`, {
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

        function confirmAuthorizeIPFromCard(ip) {
            // Abrir modal de autorização diretamente (sem confirmação prévia)
            const ipField = document.getElementById('authorize-ip-address');
            ipField.value = ip;
            ipField.readOnly = true; // Bloquear edição do IP (mas mantém valor)
            ipField.style.background = 'rgba(255, 255, 255, 0.05)'; // Visual de readonly
            ipField.style.cursor = 'not-allowed';
            
            document.getElementById('authorize-ip-level').value = 'guest';
            document.getElementById('authorize-ip-reason').value = '';
            document.getElementById('authorizeIPModal').style.display = 'flex';
            
            // Atualizar descrição do nível
            const description = document.getElementById('level-description');
            description.innerHTML = '<strong>👤 Guest:</strong> Acesso a <code>/docs</code> e endpoints das funções disponíveis. Ideal para testar a API.';
            description.style.borderColor = '#3b82f6';
            
            document.getElementById('authorize-ip-reason').focus();
        }

        function confirmUnauthorizeIPFromCard(ip) {
            confirmActionData = { action: 'unauthorize', ip: ip, callback: unauthorizeIPFromCard };
            document.getElementById('confirm-action-title').textContent = '🔒 Desautorizar Acesso à API';
            document.getElementById('confirm-action-message').textContent = 
                'Você tem certeza que deseja remover a autorização deste IP? O IP não poderá mais fazer requisições à API.';
            document.getElementById('confirm-action-ip').textContent = ip;
            document.getElementById('confirm-action-btn').className = 'btn danger';
            document.getElementById('confirm-action-btn').textContent = '🔒 Desautorizar';
            document.getElementById('confirmActionModal').style.display = 'flex';
        }

        async function unauthorizeIPFromCard(ip) {
            try {
                const response = await fetch(\`/api/security/unauthorize-ip/\${ip}\`, {
                    method: 'POST'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showToast(\`🔒 IP \${ip} desautorizado com sucesso!\`, 'success');
                    loadUnifiedList(); // Recarregar lista para mostrar status atualizado
                } else {
                    showToast(\`❌ Erro: \${data.error}\`, 'error');
                }
            } catch (error) {
                console.error('Erro ao desautorizar IP:', error);
                showToast('❌ Erro de conexão', 'error');
            }
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

            // 🔄 FASE 3: Auto-refresh de Rate Limiting se estiver aberto
            const rateLimitContent = document.getElementById('ratelimit-section-content');
            if (rateLimitContent && rateLimitContent.style.display !== 'none') {
                loadRateLimitData();
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
        
        // Verificar ZeroTier a cada 15 segundos (padronizado)
        setInterval(checkZeroTierStatus, 15000);
        
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
