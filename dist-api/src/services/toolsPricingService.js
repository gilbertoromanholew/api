import { supabase, supabaseAdmin } from '../config/supabase.js';

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
  console.log(`📊 [AUDIT] Consultando uso mensal: userId=${userId}, toolId=${toolId}`);
  
  const { data, error } = await supabaseAdmin
    .rpc('get_monthly_usage', {
      p_user_id: userId,
      p_tool_id: toolId
    });

  if (error) {
    console.error('❌ [AUDIT] Erro ao buscar uso mensal:', error);
    return 0;
  }

  console.log(`✅ [AUDIT] Uso mensal obtido: ${data} usos`);
  return data || 0;
}

/**
 * Incrementar contador de uso mensal
 */
export async function incrementMonthlyUsage(userId, toolId) {
  console.log(`📊 [AUDIT] Incrementando uso: userId=${userId}, toolId=${toolId}`);
  
  const { data, error } = await supabaseAdmin
    .rpc('increment_tool_usage', {
      p_user_id: userId,
      p_tool_id: toolId
    });

  if (error) {
    console.error(`❌ [AUDIT] FALHA ao incrementar uso: ${error.message}`);
    throw new Error('Erro ao registrar uso da ferramenta');
  }

  console.log(`✅ [AUDIT] Uso incrementado com sucesso: ${data} usos totais`);
  return data;
}

/**
 * Calcular precificação completa de ferramenta de PLANEJAMENTO
 */
export async function getPlanningToolPricing(tool, userId, planSlug) {
  const hasPro = hasProfessionalBenefits(planSlug);
  const monthlyLimit = tool.planning_monthly_limit || 20;
  
  // Obter usos no mês atual
  const usedThisMonth = await getMonthlyUsage(userId, tool.id);
  const remainingFreeUses = hasPro ? Math.max(0, monthlyLimit - usedThisMonth) : 0;

  // Custos
  const liteCostFree = tool.planning_lite_cost_free || 1;
  const premiumCostFree = tool.planning_premium_cost_free || 15;
  const liteCostPro = tool.planning_lite_cost_pro || 1;
  const premiumCostPro = tool.planning_premium_cost_pro || 6;

  return {
    toolId: tool.id,
    toolSlug: tool.slug,
    toolName: tool.name,
    isPlanning: true,
    
    // Informações do plano do usuário
    userPlan: planSlug,
    hasProfessionalBenefits: hasPro,
    
    // Usos gratuitos (apenas para profissionais)
    freeUsesRemaining: remainingFreeUses,
    freeUsesTotal: hasPro ? monthlyLimit : 0,
    freeUsesUsed: hasPro ? usedThisMonth : 0,
    canUseFree: remainingFreeUses > 0,
    
    // Custos por experiência
    costs: {
      lite: {
        free: liteCostFree,
        afterLimit: liteCostPro
      },
      premium: {
        free: premiumCostFree,
        afterLimit: premiumCostPro
      }
    },
    
    // Custo que será cobrado na próxima execução
    nextUseCost: {
      lite: hasPro && remainingFreeUses > 0 ? 0 : (hasPro ? liteCostPro : liteCostFree),
      premium: hasPro && remainingFreeUses > 0 ? 0 : (hasPro ? premiumCostPro : premiumCostFree)
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
