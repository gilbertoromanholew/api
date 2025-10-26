/**
 * ============================================
 * SISTEMA DE PLANEJAMENTOS - BACKEND
 * ============================================
 * Controle de acesso e cobrança diferenciada
 * para ferramentas de planejamento
 */

import { Router } from 'express';
import { requireAuth } from '../middlewares/adminAuth.js';
import { getBalance } from '../services/pointsService.js';
import { supabase } from '../config/supabase.js';

const router = Router();

/**
 * Calcula o custo real de usar uma ferramenta
 * VALIDAÇÃO 100% NO BACKEND - NUNCA CONFIAR NO FRONTEND
 */
router.post('/calculate-cost', requireAuth, async (req, res) => {
  try {
    const { toolId, experienceType = 'experimental' } = req.body;
    const userId = req.user.id;

    // Validações básicas
    if (!toolId) {
      return res.status(400).json({ error: 'toolId é obrigatório' });
    }

    if (!['experimental', 'full'].includes(experienceType)) {
      return res.status(400).json({ error: 'experienceType inválido' });
    }

    // 1. Buscar dados da ferramenta
    const { data: tool, error: toolError } = await supabase
      .from('tools_catalog')
      .select('*')
      .eq('id', toolId)
      .single();

    if (toolError || !tool) {
      return res.status(404).json({ error: 'Ferramenta não encontrada' });
    }

    // 2. Verificar assinatura do usuário (tabela economy_subscriptions)
    const { data: subscription } = await supabase
      .from('economy_subscriptions')
      .select('plan_id, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
    
    // Buscar detalhes do plano se houver assinatura
    let isPro = false;
    if (subscription) {
      const { data: plan } = await supabase
        .from('economy_subscription_plans')
        .select('slug')
        .eq('id', subscription.plan_id)
        .single();
      
      // Verificar se é plano Expert (qualquer variação)
      isPro = plan && plan.slug?.toLowerCase().includes('expert');
    }

    // 3. Buscar carteira do usuário usando serviço centralizado ✅
    const balance = await getBalance(userId);
    const availableCredits = balance.availableCredits;

    // 4. Calcular custo baseado em regras de negócio
    let cost = 0;
    let usageInfo = null;
    let accessType = null;
    let freeCost = null; // 🎯 Preço que FREE pagaria (para mostrar riscado no PRO)

    if (tool.is_planning) {
      // === FERRAMENTA DE PLANEJAMENTO ===
      
      if (isPro) {
        // PRO: Verificar uso mensal
        const currentMonth = getCurrentMonthYear(); // 🎯 Função centralizada
        
        const { data: usage } = await supabase
          .from('tool_usage_tracking')
          .select('usage_count')
          .eq('user_id', userId)
          .eq('tool_id', toolId)
          .eq('month_year', currentMonth)
          .single();

        const usageCount = usage?.usage_count || 0;

        if (usageCount < tool.planning_monthly_limit) {
          // Dentro do limite mensal - GRÁTIS
          cost = 0;
          accessType = 'pro_included';
          usageInfo = {
            remaining: tool.planning_monthly_limit - usageCount,
            used: usageCount,
            limit: tool.planning_monthly_limit,
            resetDate: getNextMonthFirstDay() // 🎯 Retorna "2025-11-01T00:00:01.000Z"
          };
        } else {
          // Excedeu limite - paga 2x
          cost = tool.planning_pro_overflow_cost;
          accessType = 'pro_overflow';
          usageInfo = {
            remaining: 0,
            used: usageCount,
            limit: tool.planning_monthly_limit,
            overflow: true,
            resetDate: getNextMonthFirstDay() // 🎯 Retorna "2025-11-01T00:00:01.000Z"
          };
        }

        // 💰 Calcular quanto FREE pagaria (para mostrar riscado)
        if (experienceType === 'full') {
          freeCost = tool.planning_full_cost; // 15 pts
        } else {
          freeCost = tool.planning_base_cost; // 3 pts
        }
      } else {
        // GRATUITO: Experimental (1x) ou Full (5x)
        if (experienceType === 'full') {
          cost = tool.planning_full_cost;
          accessType = 'free_full';
        } else {
          cost = tool.planning_base_cost;
          accessType = 'free_experimental';
        }
      }
    } else {
      // === FERRAMENTA NORMAL (IA ou Complementar) ===
      
      // Verificar se é IA e usuário é gratuito
      if (tool.slug.startsWith('ia_') && !isPro) {
        return res.status(403).json({ 
          error: 'Ferramentas de IA são exclusivas para assinantes',
          requiresPro: true
        });
      }
      
      cost = tool.cost_in_points || 0;
      accessType = 'standard';
    }

    res.json({
      success: true,
      cost,
      freeCost, // 💰 Preço que FREE pagaria (null se usuário for FREE)
      accessType,
      usageInfo,
      experienceType,
      tool: {
        id: tool.id,
        name: tool.name,
        slug: tool.slug,
        is_planning: tool.is_planning
      },
      user: {
        isPro,
        tier: subscription?.tier || 'free',
        availableCredits
      }
    });

  } catch (error) {
    console.error('❌ Erro ao calcular custo:', error);
    res.status(500).json({ error: 'Erro ao calcular custo da ferramenta' });
  }
});

/**
 * Executa ferramenta COM validação de créditos e limites
 * NUNCA CONFIAR NO CUSTO VINDO DO FRONTEND
 */
router.post('/use', requireAuth, async (req, res) => {
  try {
    const { toolId, experienceType = 'experimental', ...toolParams } = req.body;
    const userId = req.user.id;

    // Validações
    if (!toolId) {
      return res.status(400).json({ error: 'toolId é obrigatório' });
    }

    // 1. Calcular custo REAL (backend)
    const costCalc = await calculateToolCost(userId, toolId, experienceType);
    
    if (!costCalc.success) {
      return res.status(costCalc.status || 400).json({ error: costCalc.error });
    }

    const { cost, accessType, usageInfo, tool } = costCalc;

    // 2. Verificar saldo de créditos
    const { data: credits, error: creditsError } = await supabase
      .from('credits')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (creditsError || !credits) {
      return res.status(500).json({ error: 'Erro ao verificar créditos' });
    }

    if (credits.balance < cost) {
      return res.status(402).json({ 
        error: 'Créditos insuficientes',
        required: cost,
        available: credits.balance,
        shortfall: cost - credits.balance
      });
    }

    // 3. Deduzir créditos (se houver custo)
    if (cost > 0) {
      const experienceLabel = experienceType === 'full' ? ' (Experiência Completa)' : '';
      const overflowLabel = accessType === 'pro_overflow' ? ' (Uso Extra)' : '';
      
      const { error: deductError } = await supabase.rpc('deduct_credits', {
        p_user_id: userId,
        p_amount: cost,
        p_description: `${tool.name}${experienceLabel}${overflowLabel}`
      });

      if (deductError) {
        console.error('❌ Erro ao deduzir créditos:', deductError);
        return res.status(500).json({ error: 'Erro ao processar pagamento' });
      }
    }

    // 4. Registrar uso mensal (se planejamento PRO)
    if (tool.is_planning && (accessType === 'pro_included' || accessType === 'pro_overflow')) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      const { error: usageError } = await supabase.rpc('increment_tool_usage', {
        p_user_id: userId,
        p_tool_id: toolId,
        p_month_year: currentMonth
      });

      if (usageError) {
        console.error('⚠️ Erro ao registrar uso:', usageError);
        // Não bloqueia a execução, apenas loga
      }
    }

    // 5. Executar lógica da ferramenta
    const result = await executeToolLogic(tool, toolParams, experienceType);

    // 6. Registrar log de auditoria
    await supabase.from('tool_usage_logs').insert({
      user_id: userId,
      tool_id: toolId,
      cost,
      access_type: accessType,
      experience_type: experienceType,
      success: result.success
    });

    res.json({
      success: true,
      result,
      transaction: {
        cost,
        accessType,
        experienceType,
        usageInfo
      }
    });

  } catch (error) {
    console.error('❌ Erro ao executar ferramenta:', error);
    res.status(500).json({ error: 'Erro ao executar ferramenta' });
  }
});

/**
 * Obtém uso mensal do usuário em ferramentas de planejamento
 */
router.get('/my-usage', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const monthYear = req.query.monthYear || getCurrentMonthYear(); // 🎯 Função centralizada

    // Validar formato do mês
    if (!/^\d{4}-\d{2}$/.test(monthYear)) {
      return res.status(400).json({ error: 'Formato de mês inválido. Use YYYY-MM' });
    }

    const { data, error } = await supabase.rpc('get_user_monthly_usage', {
      p_user_id: userId,
      p_month_year: monthYear
    });

    if (error) {
      console.error('❌ Erro ao buscar uso mensal:', error);
      return res.status(500).json({ error: 'Erro ao buscar dados de uso' });
    }

    res.json({
      success: true,
      month: monthYear,
      monthStart: getCurrentMonthStart(), // 🎯 "2025-10-01T00:00:01.000Z"
      nextReset: getNextMonthFirstDay(), // 🎯 "2025-11-01T00:00:01.000Z"
      daysUntilReset: getDaysUntilReset(), // 🎯 Dias restantes
      tools: data || []
    });

  } catch (error) {
    console.error('❌ Erro ao obter uso mensal:', error);
    res.status(500).json({ error: 'Erro ao obter dados de uso' });
  }
});

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Calcula custo de ferramenta (função interna reutilizável)
 */
async function calculateToolCost(userId, toolId, experienceType) {
  try {
    // Buscar ferramenta
    const { data: tool, error: toolError } = await supabase
      .from('tools_catalog')
      .select('*')
      .eq('id', toolId)
      .single();

    if (toolError || !tool) {
      return { success: false, error: 'Ferramenta não encontrada', status: 404 };
    }

    // Verificar assinatura
    const { data: subscription } = await supabase
      .from('economy_subscriptions')
      .select('plan_id, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    // Buscar detalhes do plano se houver assinatura
    let isPro = false;
    if (subscription) {
      const { data: plan } = await supabase
        .from('economy_subscription_plans')
        .select('slug')
        .eq('id', subscription.plan_id)
        .single();
      
      // Verificar se é plano Expert (qualquer variação)
      isPro = plan && plan.slug?.toLowerCase().includes('expert');
    }

    let cost = 0;
    let usageInfo = null;
    let accessType = null;

    if (tool.is_planning) {
      if (isPro) {
        const currentMonth = getCurrentMonthYear(); // 🎯 Função centralizada
        
        const { data: usage } = await supabase
          .from('tool_usage_tracking')
          .select('usage_count')
          .eq('user_id', userId)
          .eq('tool_id', toolId)
          .eq('month_year', currentMonth)
          .single();

        const usageCount = usage?.usage_count || 0;

        if (usageCount < tool.planning_monthly_limit) {
          cost = 0;
          accessType = 'pro_included';
          usageInfo = {
            remaining: tool.planning_monthly_limit - usageCount,
            used: usageCount,
            limit: tool.planning_monthly_limit,
            resetDate: getNextMonthFirstDay() // 🎯 Adicionar resetDate
          };
        } else {
          cost = tool.planning_pro_overflow_cost;
          accessType = 'pro_overflow';
          usageInfo = {
            remaining: 0,
            used: usageCount,
            limit: tool.planning_monthly_limit,
            overflow: true,
            resetDate: getNextMonthFirstDay() // 🎯 Adicionar resetDate
          };
        }
      } else {
        cost = experienceType === 'full' ? tool.planning_full_cost : tool.planning_base_cost;
        accessType = experienceType === 'full' ? 'free_full' : 'free_experimental';
      }
    } else {
      if (tool.slug.startsWith('ia_') && !isPro) {
        return { success: false, error: 'Ferramenta exclusiva para PRO', status: 403 };
      }
      cost = tool.cost_in_points || 0;
      accessType = 'standard';
    }

    return {
      success: true,
      cost,
      accessType,
      usageInfo,
      tool
    };

  } catch (error) {
    console.error('❌ Erro ao calcular custo:', error);
    return { success: false, error: 'Erro interno', status: 500 };
  }
}

/**
 * Executa lógica específica de cada ferramenta
 * TODO: Implementar lógica real de cada ferramenta
 */
async function executeToolLogic(tool, params, experienceType) {
  // Aqui viria a lógica específica de cada ferramenta
  // Por enquanto, retorna um mock
  
  const features = experienceType === 'full' ? 
    'Acesso completo a todos os recursos' : 
    'Versão experimental com recursos limitados';
  
  return {
    success: true,
    message: `Ferramenta ${tool.name} executada com sucesso`,
    experienceType,
    features,
    data: {
      // Resultado da execução da ferramenta
    }
  };
}

/**
 * ============================================
 * UTILITÁRIOS DE PERÍODO MENSAL
 * ============================================
 * Centraliza toda lógica de renovação mensal
 * Período: Sempre dia 1 às 00:00:01 no horário de Brasília (UTC-3)
 * 
 * IMPORTANTE: Brasil usa UTC-3 (ou UTC-2 no horário de verão, mas o horário de verão foi abolido)
 * Exemplos:
 * - 01/11/2025 00:00:01 BRT (Brasília) = 01/11/2025 03:00:01 UTC
 * - Reset acontece às 00:00:01 da manhã do dia 1 NO HORÁRIO LOCAL DO BRASIL
 */

// Fuso horário de Brasília: UTC-3 (BRT - Brasilia Time)
const BRASILIA_OFFSET_HOURS = -3;

/**
 * Retorna o mês/ano atual no fuso horário de Brasília (formato YYYY-MM)
 * @returns {string} Exemplo: "2025-10"
 */
function getCurrentMonthYear() {
  const now = new Date();
  // Converter para horário de Brasília (UTC-3)
  const brasiliaTime = new Date(now.getTime() + (BRASILIA_OFFSET_HOURS * 60 * 60 * 1000));
  return brasiliaTime.toISOString().slice(0, 7); // "2025-10"
}

/**
 * Retorna a data/hora exata do próximo reset no horário de Brasília
 * Reset: dia 1 do próximo mês às 00:00:01 BRT (Brasília Time)
 * @returns {string} ISO 8601 em UTC (convertido de Brasília)
 */
function getNextMonthFirstDay() {
  const now = new Date();
  
  // Converter para horário de Brasília
  const brasiliaTime = new Date(now.getTime() + (BRASILIA_OFFSET_HOURS * 60 * 60 * 1000));
  
  // Próximo mês no horário de Brasília
  const nextMonth = brasiliaTime.getUTCMonth() + 1;
  const year = nextMonth > 11 ? brasiliaTime.getUTCFullYear() + 1 : brasiliaTime.getUTCFullYear();
  const month = nextMonth > 11 ? 0 : nextMonth;
  
  // Criar data: dia 1 do próximo mês às 00:00:01 no horário de Brasília
  const resetBrasilia = new Date(Date.UTC(
    year,
    month,
    1,  // Dia 1
    0,  // 00 horas (Brasília)
    0,  // 00 minutos
    1   // 01 segundo
  ));
  
  // Converter de volta para UTC (subtrair o offset de Brasília)
  const resetUTC = new Date(resetBrasilia.getTime() - (BRASILIA_OFFSET_HOURS * 60 * 60 * 1000));
  
  return resetUTC.toISOString(); // "2025-11-01T03:00:01.000Z" (que é 01/11 00:00:01 em Brasília)
}

/**
 * Retorna a data/hora do início do mês atual no horário de Brasília
 * @returns {string} ISO 8601 em UTC (convertido de Brasília)
 */
function getCurrentMonthStart() {
  const now = new Date();
  
  // Converter para horário de Brasília
  const brasiliaTime = new Date(now.getTime() + (BRASILIA_OFFSET_HOURS * 60 * 60 * 1000));
  
  // Início do mês atual no horário de Brasília
  const monthStartBrasilia = new Date(Date.UTC(
    brasiliaTime.getUTCFullYear(),
    brasiliaTime.getUTCMonth(),
    1,  // Dia 1
    0,  // 00 horas
    0,  // 00 minutos
    1   // 01 segundo
  ));
  
  // Converter para UTC
  const monthStartUTC = new Date(monthStartBrasilia.getTime() - (BRASILIA_OFFSET_HOURS * 60 * 60 * 1000));
  
  return monthStartUTC.toISOString();
}

/**
 * Verifica se uma data está dentro do período mensal atual (horário de Brasília)
 * @param {string|Date} date - Data a verificar
 * @returns {boolean} true se está no mês atual
 */
function isInCurrentMonth(date) {
  const targetDate = new Date(date);
  
  // Converter ambas as datas para horário de Brasília
  const targetBrasilia = new Date(targetDate.getTime() + (BRASILIA_OFFSET_HOURS * 60 * 60 * 1000));
  const currentMonthYear = getCurrentMonthYear();
  const targetMonthYear = targetBrasilia.toISOString().slice(0, 7);
  
  return currentMonthYear === targetMonthYear;
}

/**
 * Calcula quantos dias faltam para o próximo reset (horário de Brasília)
 * @returns {number} Dias restantes
 */
function getDaysUntilReset() {
  const now = new Date();
  const nextReset = new Date(getNextMonthFirstDay());
  const diffMs = nextReset - now;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export default router;
