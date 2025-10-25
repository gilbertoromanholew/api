/**
 * Tools Service
 * Gerencia tracking de uso de ferramentas e estatísticas
 */

import { supabase, supabaseAdmin } from '../config/supabase.js';

/**
 * Registrar uso de uma ferramenta
 * @param {string} userId - ID do usuário
 * @param {string} toolName - Nome da ferramenta (slug)
 * @param {object} options - Opções adicionais
 * @returns {Promise<{data, error}>}
 */
export async function trackToolUsage(userId, toolName, options = {}) {
  try {
    const { durationSeconds, success = true, metadata = {}, costInPoints = 0 } = options;

    // V7: Buscar tool_id do catálogo
    const { data: tool } = await supabaseAdmin
      .from('tools_catalog')
      .select('id')
      .eq('slug', toolName)
      .single();

    if (!tool) {
      console.warn(`Ferramenta ${toolName} não encontrada no catálogo`);
      return { data: null, error: 'Ferramenta não encontrada' };
    }

    // V7: Inserir em tools.executions
    const { data, error } = await supabaseAdmin
      .from('tools_executions')
      .insert({
        user_id: userId,
        tool_id: tool.id,
        cost_in_points: costInPoints,
        success,
        result: metadata,
        executed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao registrar uso de ferramenta:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Erro inesperado ao registrar uso:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Obter ferramentas mais usadas da plataforma
 * @param {number} limit - Número de ferramentas a retornar
 * @returns {Promise<{data, error}>}
 */
export async function getMostUsedTools(limit = 4) {
  try {
    // V7: Buscar de tools.executions
    const { data: executions, error: execError } = await supabaseAdmin
      .from('tools_executions')
      .select('tool_id')
      .eq('success', true)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (execError) {
      console.error('Erro ao buscar execuções:', execError);
      return { data: [], error: null }; // Retorna vazio ao invés de erro
    }

    if (!executions || executions.length === 0) {
      return { data: [], error: null }; // Nenhuma execução ainda
    }

    // Contar ocorrências por tool_id
    const counts = {};
    executions.forEach(item => {
      if (item.tool_id) {
        counts[item.tool_id] = (counts[item.tool_id] || 0) + 1;
      }
    });

    // Ordenar por contagem
    const sorted = Object.entries(counts)
      .map(([tool_id, usage_count]) => ({ tool_id, usage_count }))
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, limit);

    if (sorted.length === 0) {
      return { data: [], error: null };
    }

    // Buscar detalhes das ferramentas
    const toolIds = sorted.map(t => t.tool_id);
    const { data: tools, error: toolsError } = await supabaseAdmin
      .from('tools_catalog')
      .select('*')
      .in('id', toolIds)
      .eq('is_active', true);

    if (toolsError) {
      console.error('Erro ao buscar ferramentas:', toolsError);
      return { data: [], error: null };
    }

    if (!tools || tools.length === 0) {
      return { data: [], error: null };
    }

    // Mapear para formato esperado
    const mostUsed = sorted
      .map(item => {
        const tool = tools.find(t => t.id === item.tool_id);
        if (!tool) return null;
        
        return {
          tool_name: tool.slug,
          title: tool.name,
          description: tool.description,
          usage_count: item.usage_count,
          route: `/dashboard/ferramentas?tool=${tool.slug}`
        };
      })
      .filter(Boolean);

    return { data: mostUsed, error: null };
  } catch (error) {
    console.error('Erro inesperado ao buscar ferramentas:', error);
    return { data: [], error: null }; // Retorna vazio em caso de erro
  }
}

/**
 * Obter estatísticas de uso de ferramentas de um usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<{data, error}>}
 */
export async function getUserToolStats(userId) {
  try {
    // V7: Buscar execuções do usuário
    const { data: executions, error } = await supabaseAdmin
      .from('tools_executions')
      .select('tool_id, success, executed_at, result')
      .eq('user_id', userId)
      .order('executed_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar estatísticas do usuário:', error);
      return { data: null, error };
    }

    if (!executions || executions.length === 0) {
      return {
        data: {
          totalUses: 0,
          successfulUses: 0,
          successRate: 0,
          mostUsedTools: [],
          recentActivity: []
        },
        error: null
      };
    }

    // Buscar informações das ferramentas
    const toolIds = [...new Set(executions.map(e => e.tool_id))];
    const { data: tools } = await supabaseAdmin
      .from('tools_catalog')
      .select('id, name, slug')
      .in('id', toolIds);

    const toolMap = {};
    tools?.forEach(tool => {
      toolMap[tool.id] = tool;
    });

    // Agregar estatísticas
    const totalUses = executions.length;
    const successfulUses = executions.filter(e => e.success).length;
    const toolCounts = {};
    
    executions.forEach(item => {
      const toolId = item.tool_id;
      toolCounts[toolId] = (toolCounts[toolId] || 0) + 1;
    });

    const mostUsed = Object.entries(toolCounts)
      .map(([tool_id, count]) => {
        const tool = toolMap[tool_id];
        return {
          tool_name: tool?.slug || tool?.name || tool_id,
          display_name: tool?.name || tool_id,
          count
        };
      })
      .sort((a, b) => b.count - a.count);

    // Mapear atividade recente
    const recentActivity = executions.slice(0, 10).map(exec => ({
      tool_id: exec.tool_id,
      tool_name: toolMap[exec.tool_id]?.slug || exec.tool_id,
      display_name: toolMap[exec.tool_id]?.name || exec.tool_id,
      success: exec.success,
      used_at: exec.executed_at,
      result: exec.result
    }));

    return {
      data: {
        totalUses,
        successfulUses,
        successRate: totalUses > 0 ? (successfulUses / totalUses * 100).toFixed(1) : 0,
        mostUsedTools: mostUsed,
        recentActivity
      },
      error: null
    };
  } catch (error) {
    console.error('Erro inesperado ao buscar estatísticas:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Obter histórico de uso de ferramentas do usuário (para página Minhas Atividades)
 * @param {string} userId - ID do usuário
 * @param {number} limit - Limite de registros
 * @returns {Promise<{data, error}>}
 */
export async function getUserToolHistory(userId, limit = 50) {
  try {
    // V7: Buscar execuções com join nas ferramentas
    const { data: executions, error } = await supabaseAdmin
      .from('tools_executions')
      .select(`
        id,
        tool_id,
        success,
        executed_at,
        cost_in_points,
        result,
        error_message,
        tools:tool_id (
          name,
          slug,
          category
        )
      `)
      .eq('user_id', userId)
      .order('executed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar histórico:', error);
      return { data: null, error };
    }

    // Mapear para formato esperado pelo frontend
    const history = executions?.map(exec => ({
      id: exec.id,
      tool_id: exec.tool_id,
      tool_name: exec.tools?.slug || exec.tool_id,
      display_name: exec.tools?.name || exec.tool_id,
      category: exec.tools?.category,
      success: exec.success,
      used_at: exec.executed_at,
      points_cost: exec.cost_in_points,
      result: exec.result,
      error_message: exec.error_message
    })) || [];

    return { data: history, error: null };
  } catch (error) {
    console.error('Erro inesperado ao buscar histórico:', error);
    return { data: null, error: error.message };
  }
}
