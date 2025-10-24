/**
 * Tools Service
 * Gerencia tracking de uso de ferramentas e estatísticas
 */

import { supabase, supabaseAdmin } from '../config/supabase.js';

/**
 * Registrar uso de uma ferramenta
 * @param {string} userId - ID do usuário
 * @param {string} toolName - Nome da ferramenta
 * @param {object} options - Opções adicionais
 * @returns {Promise<{data, error}>}
 */
export async function trackToolUsage(userId, toolName, options = {}) {
  try {
    const { durationSeconds, success = true, metadata = {} } = options;

    const { data, error } = await supabaseAdmin
      .from('tool_usage_stats')
      .insert({
        user_id: userId,
        tool_name: toolName,
        duration_seconds: durationSeconds,
        success,
        metadata
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
    const { data, error } = await supabaseAdmin
      .from('tool_usage_stats')
      .select('tool_name')
      .eq('success', true);

    if (error) {
      console.error('Erro ao buscar ferramentas mais usadas:', error);
      return { data: null, error };
    }

    // Contar ocorrências manualmente
    const counts = {};
    data.forEach(item => {
      counts[item.tool_name] = (counts[item.tool_name] || 0) + 1;
    });

    // Ordenar por contagem e pegar top N
    const sorted = Object.entries(counts)
      .map(([tool_name, usage_count]) => ({ tool_name, usage_count }))
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, limit);

    // Mapear para formato amigável com metadados das ferramentas
    const toolsMetadata = {
      rescisao: {
        title: 'Rescisão',
        description: 'Calcular verbas rescisórias',
        icon: 'calculator',
        route: '/dashboard/ferramentas?tool=rescisao'
      },
      ferias: {
        title: 'Férias',
        description: 'Calcular férias',
        icon: 'calendar',
        route: '/dashboard/ferramentas?tool=ferias'
      },
      decimoterceiro: {
        title: '13º Salário',
        description: 'Calcular décimo terceiro',
        icon: 'money',
        route: '/dashboard/ferramentas?tool=decimoterceiro'
      },
      cnis: {
        title: 'CNIS',
        description: 'Extrair dados do CNIS',
        icon: 'document',
        route: '/dashboard/ferramentas?tool=cnis'
      },
      holerite: {
        title: 'Holerite',
        description: 'Analisar holerite',
        icon: 'document-text',
        route: '/dashboard/ferramentas?tool=holerite'
      },
      pensao: {
        title: 'Pensão Alimentícia',
        description: 'Calcular pensão',
        icon: 'users',
        route: '/dashboard/ferramentas?tool=pensao'
      }
    };

    const enrichedTools = sorted.map(tool => ({
      ...tool,
      ...(toolsMetadata[tool.tool_name] || {
        title: tool.tool_name,
        description: 'Ferramenta',
        icon: 'tool',
        route: `/dashboard/ferramentas?tool=${tool.tool_name}`
      })
    }));

    return { data: enrichedTools, error: null };
  } catch (error) {
    console.error('Erro inesperado ao buscar ferramentas:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Obter estatísticas de uso de ferramentas de um usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<{data, error}>}
 */
export async function getUserToolStats(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('tool_usage_stats')
      .select('*')
      .eq('user_id', userId)
      .order('used_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar estatísticas do usuário:', error);
      return { data: null, error };
    }

    // Agregar estatísticas
    const totalUses = data.length;
    const successfulUses = data.filter(u => u.success).length;
    const toolCounts = {};
    
    data.forEach(item => {
      toolCounts[item.tool_name] = (toolCounts[item.tool_name] || 0) + 1;
    });

    const mostUsed = Object.entries(toolCounts)
      .map(([tool_name, count]) => ({ tool_name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      data: {
        totalUses,
        successfulUses,
        successRate: totalUses > 0 ? (successfulUses / totalUses * 100).toFixed(1) : 0,
        mostUsedTools: mostUsed,
        recentActivity: data.slice(0, 10)
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
    const { data, error } = await supabaseAdmin
      .from('tool_usage_stats')
      .select('*')
      .eq('user_id', userId)
      .order('used_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar histórico:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Erro inesperado ao buscar histórico:', error);
    return { data: null, error: error.message };
  }
}
