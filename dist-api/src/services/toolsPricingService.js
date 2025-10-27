import { supabase, supabaseAdmin } from '../config/supabase.js';
import * as toolsService from './toolsService.js';
import logger from '../config/logger.js';

/**
 * ========================================
 * SERVIÇO DE PRECIFICAÇÃO DE FERRAMENTAS
 * ========================================
 * 
 * Gerencia custos diferenciados por plano e controle de uso mensal
 */

/**
 * Obter slug do plano do usuário
 */
export async function getUserPlanSlug(userId) {
  const { data, error } = await supabaseAdmin
    .from('economy_subscriptions')
    .select(`
      plan_id,
      status,
      end_date,
      economy_subscription_plans!inner (
        slug
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('end_date', new Date().toISOString())
    .single();

  if (error || !data) {
    return 'free'; // Plano gratuito por padrão
  }

  return data.economy_subscription_plans.slug;
}

/**
 * Categorizar tipo de plano
 */
export function categorizePlan(planSlug) {
  if (!planSlug || planSlug === 'free') {
    return 'free';
  }
  
  // Planos de estágio (diário e semanal)
  if (planSlug.includes('estagio') || planSlug.includes('diario') || planSlug.includes('semanal')) {
    return 'stage';
  }
  
  // Plano profissional mensal
  if (planSlug.includes('profissional') || planSlug.includes('professional') || planSlug.includes('planejador')) {
    return 'professional';
  }
  
  return 'free';
}

/**
 * Verificar se plano tem benefícios profissionais (usos grátis)
 */
export function hasProfessionalBenefits(planSlug) {
  const planType = categorizePlan(planSlug);
  return planType === 'stage' || planType === 'professional';
}

/**
 * Obter custo de ferramenta NORMAL (não-planejamento)
 */
export function getNormalToolCost(tool, planType) {
  switch (planType) {
    case 'free':
      return tool.cost_free_plan || tool.cost_in_points * 2;
    case 'stage':
      return tool.cost_stage_plan || Math.ceil(tool.cost_in_points * 1.5);
    case 'professional':
      return tool.cost_professional_plan || tool.cost_in_points;
    default:
      return tool.cost_in_points;
  }
}

/**
 * Obter usos da ferramenta no mês atual
 */
export async function getMonthlyUsage(userId, toolId) {
  logger.tool('Consultando uso mensal da ferramenta', { userId, toolId });
  
  const { data, error } = await supabaseAdmin
    .rpc('get_monthly_usage', {
      p_user_id: userId,
      p_tool_id: toolId
    });

  if (error) {
    logger.error('Erro ao buscar uso mensal', { userId, toolId, error });
    return 0;
  }

  logger.tool('Uso mensal obtido', { userId, toolId, usageCount: data });
  return data || 0;
}

/**
 * Incrementar contador de uso mensal
 */
export async function incrementMonthlyUsage(userId, toolId) {
  logger.tool('Incrementando uso mensal da ferramenta', { userId, toolId });
  
  const { data, error } = await supabaseAdmin
    .rpc('increment_tool_usage', {
      p_user_id: userId,
      p_tool_id: toolId
    });

  if (error) {
    logger.error('FALHA ao incrementar uso mensal', { userId, toolId, error });
    throw new Error('Erro ao registrar uso da ferramenta');
  }

  logger.tool('Uso incrementado com sucesso', { userId, toolId, totalUsages: data });
  return data;
}

/**
 * Calcular precificação completa de ferramenta de PLANEJAMENTO
 * ✅ NOVO: Agora aplica multiplicador de plano (igual ferramentas normais)
 */
export async function getPlanningToolPricing(tool, userId, planSlug) {
  const hasPro = hasProfessionalBenefits(planSlug);
  const planType = categorizePlan(planSlug);
  const monthlyLimit = tool.planning_monthly_limit || 20;
  
  // Obter usos no mês atual
  const usedThisMonth = await getMonthlyUsage(userId, tool.id);
  const remainingFreeUses = hasPro ? Math.max(0, monthlyLimit - usedThisMonth) : 0;

  // ✅ CUSTOS BASE (valores padrão no banco)
  const liteBaseCost = tool.planning_lite_cost_free || 5;  // Base: 5 créditos
  const premiumBaseCost = tool.planning_premium_cost_free || 15; // Base: 15 créditos

  // ✅ MULTIPLICADORES POR PLANO (igual ferramentas normais)
  const multipliers = {
    'free': 2,           // Gratuito paga 2x
    'stage': 1.5,        // Estágio paga 1.5x
    'professional': 1    // Profissional paga 1x (após limite)
  };
  
  const multiplier = multipliers[planType] || 2;

  // ✅ CALCULAR CUSTOS FINAIS (base × multiplicador)
  const liteCostFinal = Math.ceil(liteBaseCost * multiplier);
  const premiumCostFinal = Math.ceil(premiumBaseCost * multiplier);

  return {
    toolId: tool.id,
    toolSlug: tool.slug,
    toolName: tool.name,
    isPlanning: true,
    
    // Informações do plano do usuário
    userPlan: planSlug,
    planType: planType,
    hasProfessionalBenefits: hasPro,
    
    // Usos gratuitos (apenas para profissionais)
    freeUsesRemaining: remainingFreeUses,
    freeUsesTotal: hasPro ? monthlyLimit : 0,
    freeUsesUsed: hasPro ? usedThisMonth : 0,
    canUseFree: remainingFreeUses > 0,
    
    // ✅ CUSTOS BASE (referência)
    baseCosts: {
      lite: liteBaseCost,
      premium: premiumBaseCost
    },
    
    // ✅ MULTIPLICADOR APLICADO
    multiplier: multiplier,
    
    // ✅ CUSTOS FINAIS (já multiplicados)
    costs: {
      lite: liteCostFinal,
      premium: premiumCostFinal
    },
    
    // Custo que será cobrado na próxima execução
    nextUseCost: {
      lite: hasPro && remainingFreeUses > 0 ? 0 : liteCostFinal,
      premium: hasPro && remainingFreeUses > 0 ? 0 : premiumCostFinal
    }
  };
}

/**
 * Calcular precificação de ferramenta NORMAL
 */
export async function getNormalToolPricing(tool, userId, planSlug) {
  const planType = categorizePlan(planSlug);
  const cost = getNormalToolCost(tool, planType);

  return {
    toolId: tool.id,
    toolSlug: tool.slug,
    toolName: tool.name,
    isPlanning: false,
    
    // Informações do plano
    userPlan: planSlug,
    planType: planType,
    
    // Custo
    cost: cost,
    baseCost: tool.cost_in_points,
    
    // Detalhamento de custos por plano
    costByPlan: {
      free: tool.cost_free_plan || tool.cost_in_points * 2,
      stage: tool.cost_stage_plan || Math.ceil(tool.cost_in_points * 1.5),
      professional: tool.cost_professional_plan || tool.cost_in_points
    }
  };
}

/**
 * Obter precificação completa de qualquer ferramenta
 */
export async function getToolPricing(toolSlug, userId) {
  // Buscar ferramenta
  const { data: tool, error } = await supabaseAdmin
    .from('tools_catalog')
    .select('*')
    .eq('slug', toolSlug)
    .eq('is_active', true)
    .single();

  if (error || !tool) {
    throw new Error('Ferramenta não encontrada');
  }

  // Obter plano do usuário
  const planSlug = await getUserPlanSlug(userId);

  // Retornar precificação baseado no tipo
  if (tool.is_planning) {
    return await getPlanningToolPricing(tool, userId, planSlug);
  } else {
    return await getNormalToolPricing(tool, userId, planSlug);
  }
}

/**
 * Calcular custo de execução e atualizar contadores
 * ✅ ATUALIZADO: Agora registra TODA execução automaticamente
 */
export async function calculateAndCharge(toolSlug, userId, experienceType = 'lite') {
  const pricing = await getToolPricing(toolSlug, userId);
  let cost = 0;
  let usedFreeAllowance = false;

  if (pricing.isPlanning) {
    // Planejamento: verificar se tem usos grátis
    if (pricing.canUseFree) {
      cost = 0;
      usedFreeAllowance = true;
      // Incrementar contador
      await incrementMonthlyUsage(userId, pricing.toolId);
    } else {
      // Cobrar baseado na experiência
      cost = experienceType === 'premium' 
        ? pricing.nextUseCost.premium 
        : pricing.nextUseCost.lite;
    }
  } else {
    // Ferramenta normal: sempre cobra
    cost = pricing.cost;
  }

  // ✅ NOVO: Registrar execução automaticamente (Hall da Fama)
  try {
    await toolsService.trackToolUsage(userId, toolSlug, {
      durationSeconds: 0,
      success: true,
      costInPoints: cost,
      metadata: {
        experience_type: experienceType,
        plan_type: pricing.planType || pricing.userPlan,
        was_free: cost === 0,
        used_free_allowance: usedFreeAllowance
      }
    });
    logger.tool('Execução de ferramenta registrada', { toolSlug, cost });
  } catch (trackError) {
    // Não falha se tracking der erro (fail-safe)
    logger.warn('Erro ao registrar execução da ferramenta', { toolSlug, error: trackError.message });
  }

  return {
    cost,
    usedFreeAllowance,
    experienceType,
    pricing
  };
}

/**
 * Exportar funções
 */
export default {
  getUserPlanSlug,
  categorizePlan,
  hasProfessionalBenefits,
  getToolPricing,
  calculateAndCharge,
  getMonthlyUsage,
  incrementMonthlyUsage
};
