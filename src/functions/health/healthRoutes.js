/**
 * Health Check Routes
 * Rota pública para monitoramento
 */

import { getHealth } from './healthController.js';

export default function healthRoutes(app) {
    // GET /api/health - Verificação de saúde (público)
    app.get('/health', getHealth);
}

// Configuração de acesso
healthRoutes.accessLevel = 'public'; // Rota pública (não precisa autenticação)
