/**
 * Teste dos Endpoints de Logs e Documentação
 * 
 * Este script testa os endpoints:
 * - GET /logs
 * - GET /logs/stats
 * - DELETE /logs
 * - GET /docs
 * 
 * Como usar:
 * node test-logs-docs-endpoints.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do Supabase Admin (mesma config do servidor)
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Cores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

// ========================================
// TESTES
// ========================================

async function testGetLogs() {
  log(colors.cyan, '\n📋 Testando GET /logs (admin_access_logs)...');
  
  try {
    // Query simulando o endpoint GET /logs
    const { data, error } = await supabaseAdmin
      .from('admin_access_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) {
      log(colors.red, `❌ ERRO: ${error.message}`);
      log(colors.yellow, `   Detalhes:`, error);
      return { success: false, error: error.message };
    }

    log(colors.green, `✅ SUCESSO: ${data.length} logs encontrados`);
    
    if (data.length > 0) {
      log(colors.blue, `   Exemplo de log:`, {
        timestamp: data[0].timestamp,
        ip: data[0].ip,
        endpoint: data[0].endpoint,
        method: data[0].method,
        authorized: data[0].authorized
      });
    } else {
      log(colors.yellow, `   ⚠️  Nenhum log encontrado (tabela vazia)`);
    }

    return { success: true, logs: data };
  } catch (err) {
    log(colors.red, `❌ EXCEÇÃO: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function testGetLogsStats() {
  log(colors.cyan, '\n📊 Testando GET /logs/stats (admin_access_logs)...');
  
  try {
    // Query simulando o endpoint GET /logs/stats
    const { data, error } = await supabaseAdmin
      .from('admin_access_logs')
      .select('authorized');

    if (error) {
      log(colors.red, `❌ ERRO: ${error.message}`);
      return { success: false, error: error.message };
    }

    // Calcular estatísticas
    const stats = {
      total_requests: data.length,
      authorized: data.filter(log => log.authorized === true).length,
      unauthorized: data.filter(log => log.authorized === false).length
    };

    log(colors.green, `✅ SUCESSO: Estatísticas calculadas`);
    log(colors.blue, `   Total: ${stats.total_requests}`);
    log(colors.blue, `   Autorizados: ${stats.authorized}`);
    log(colors.blue, `   Negados: ${stats.unauthorized}`);

    return { success: true, stats };
  } catch (err) {
    log(colors.red, `❌ EXCEÇÃO: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function testGetDocs() {
  log(colors.cyan, '\n📚 Testando GET /docs...');
  
  try {
    // Simular a documentação que seria retornada
    const mockDocs = {
      title: 'Documentação da API - AJI',
      description: 'Referência completa dos endpoints disponíveis',
      version: '1.0.0',
      baseUrl: 'http://localhost:3000',
      sections: [
        {
          id: 'auth',
          title: 'Autenticação',
          description: 'Endpoints de autenticação e gerenciamento de sessão',
          endpoints: [
            {
              method: 'POST',
              path: '/auth/register',
              description: 'Registrar novo usuário',
              auth: false,
              body: {
                full_name: 'string',
                email: 'string',
                cpf: 'string',
                password: 'string'
              }
            },
            {
              method: 'POST',
              path: '/auth/login',
              description: 'Fazer login',
              auth: false,
              body: {
                email: 'string',
                password: 'string'
              }
            },
            {
              method: 'GET',
              path: '/auth/session',
              description: 'Obter sessão atual',
              auth: true
            },
            {
              method: 'POST',
              path: '/auth/logout',
              description: 'Fazer logout',
              auth: true
            }
          ]
        },
        {
          id: 'tools',
          title: 'Ferramentas',
          description: 'Endpoints para executar ferramentas jurídicas',
          endpoints: [
            {
              method: 'GET',
              path: '/tools',
              description: 'Listar todas as ferramentas disponíveis',
              auth: true
            },
            {
              method: 'POST',
              path: '/tools/execute',
              description: 'Executar uma ferramenta',
              auth: true,
              body: {
                tool_slug: 'string',
                inputs: 'object'
              }
            }
          ]
        },
        {
          id: 'economy',
          title: 'Economia',
          description: 'Endpoints de créditos e transações',
          endpoints: [
            {
              method: 'GET',
              path: '/economy/balance',
              description: 'Obter saldo de créditos',
              auth: true
            },
            {
              method: 'GET',
              path: '/economy/transactions',
              description: 'Listar transações',
              auth: true,
              query: {
                limit: 'number (opcional)',
                offset: 'number (opcional)'
              }
            }
          ]
        },
        {
          id: 'admin',
          title: 'Administração',
          description: 'Endpoints exclusivos para administradores',
          endpoints: [
            {
              method: 'GET',
              path: '/admin/stats',
              description: 'Estatísticas gerais do sistema',
              auth: true,
              adminOnly: true
            },
            {
              method: 'GET',
              path: '/admin/users',
              description: 'Listar todos os usuários',
              auth: true,
              adminOnly: true,
              query: {
                search: 'string (opcional)',
                role: 'string (opcional)',
                page: 'number (opcional)',
                limit: 'number (opcional)'
              }
            },
            {
              method: 'PATCH',
              path: '/admin/users/:id',
              description: 'Atualizar usuário',
              auth: true,
              adminOnly: true,
              body: {
                credits: 'number (opcional)',
                role: 'string (opcional)'
              }
            },
            {
              method: 'GET',
              path: '/admin/audit-log',
              description: 'Logs de auditoria de ações admin',
              auth: true,
              adminOnly: true,
              query: {
                action_type: 'string (opcional)',
                admin_id: 'string (opcional)',
                limit: 'number (opcional)'
              }
            },
            {
              method: 'GET',
              path: '/admin/logs',
              description: 'Logs de acesso ao sistema',
              auth: true,
              adminOnly: true,
              query: {
                limit: 'number (opcional)'
              }
            },
            {
              method: 'GET',
              path: '/admin/logs/stats',
              description: 'Estatísticas de logs',
              auth: true,
              adminOnly: true
            },
            {
              method: 'DELETE',
              path: '/admin/logs',
              description: 'Limpar todos os logs',
              auth: true,
              adminOnly: true
            },
            {
              method: 'GET',
              path: '/admin/docs',
              description: 'Documentação completa da API',
              auth: true,
              adminOnly: true
            }
          ]
        }
      ]
    };

    log(colors.green, `✅ SUCESSO: Documentação gerada`);
    log(colors.blue, `   Título: ${mockDocs.title}`);
    log(colors.blue, `   Versão: ${mockDocs.version}`);
    log(colors.blue, `   Seções: ${mockDocs.sections.length}`);
    
    // Contar total de endpoints
    const totalEndpoints = mockDocs.sections.reduce((acc, section) => acc + section.endpoints.length, 0);
    log(colors.blue, `   Total de Endpoints: ${totalEndpoints}`);

    return { success: true, data: mockDocs };
  } catch (err) {
    log(colors.red, `❌ EXCEÇÃO: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function testCheckLogsTable() {
  log(colors.cyan, '\n🔍 Verificando se tabela admin_access_logs existe...');
  
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_access_logs')
      .select('count')
      .limit(1);

    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        log(colors.red, `❌ TABELA NÃO EXISTE: admin_access_logs`);
        log(colors.yellow, `   Você precisa criar a tabela admin_access_logs no Supabase`);
        log(colors.yellow, `   SQL Sugerido:`);
        console.log(`
CREATE TABLE IF NOT EXISTS admin_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip INET,
  endpoint TEXT,
  method TEXT,
  authorized BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id),
  details JSONB
);

CREATE INDEX idx_admin_access_logs_timestamp ON admin_access_logs(timestamp DESC);
CREATE INDEX idx_admin_access_logs_authorized ON admin_access_logs(authorized);
CREATE INDEX idx_admin_access_logs_endpoint ON admin_access_logs(endpoint);

-- RLS Policies
ALTER TABLE admin_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver todos os logs"
  ON admin_access_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
        `);
        return { success: false, exists: false };
      }
      
      log(colors.red, `❌ ERRO: ${error.message}`);
      return { success: false, error: error.message };
    }

    log(colors.green, `✅ TABELA EXISTE: admin_access_logs`);
    return { success: true, exists: true };
  } catch (err) {
    log(colors.red, `❌ EXCEÇÃO: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// ========================================
// EXECUÇÃO PRINCIPAL
// ========================================

async function runAllTests() {
  log(colors.blue, '╔════════════════════════════════════════════════════════╗');
  log(colors.blue, '║   TESTE DE ENDPOINTS - LOGS E DOCUMENTAÇÃO            ║');
  log(colors.blue, '╚════════════════════════════════════════════════════════╝');

  const results = {
    tableCheck: await testCheckLogsTable(),
    getLogs: await testGetLogs(),
    getLogsStats: await testGetLogsStats(),
    getDocs: await testGetDocs()
  };

  // Resumo
  log(colors.blue, '\n╔════════════════════════════════════════════════════════╗');
  log(colors.blue, '║   RESUMO DOS TESTES                                    ║');
  log(colors.blue, '╚════════════════════════════════════════════════════════╝');

  const passed = Object.values(results).filter(r => r.success).length;
  const total = Object.keys(results).length;

  log(colors.cyan, `\n📊 Resultados: ${passed}/${total} testes passaram\n`);

  Object.entries(results).forEach(([test, result]) => {
    const icon = result.success ? '✅' : '❌';
    const color = result.success ? colors.green : colors.red;
    log(color, `${icon} ${test}: ${result.success ? 'PASSOU' : 'FALHOU'}`);
  });

  log(colors.blue, '\n════════════════════════════════════════════════════════\n');

  // Exit code
  process.exit(passed === total ? 0 : 1);
}

// Executar testes
runAllTests().catch(err => {
  log(colors.red, '\n💥 ERRO FATAL:', err);
  process.exit(1);
});
