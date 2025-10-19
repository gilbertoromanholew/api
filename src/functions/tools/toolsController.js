import { supabase, supabaseAdmin } from '../../config/supabase.js';
import { supabaseQuery } from '../../config/supabaseRest.js';
import { consumePoints, canUseTool } from '../points/pointsService.js';

/**
 * GET /api/tools/list
 * Lista todas as ferramentas disponíveis com seus custos
 */
export async function listTools(req, res) {
    try {
        // Usar API REST direta (mais confiável)
        const { data, error } = await supabaseQuery('tool_costs', {
            eq: { is_active: true },
            order: { category: true, tool_name: true },
            useServiceRole: true
        });
        
        if (error) {
            throw new Error('Erro ao buscar ferramentas');
        }
        
        // Agrupar por categoria
        const categories = {};
        data.forEach(tool => {
            const category = tool.category || 'Outros';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push({
                name: tool.tool_name,
                display_name: tool.display_name,
                description: tool.description,
                points_cost: tool.points_cost,
                icon: tool.icon
            });
        });
        
        return res.json({
            success: true,
            data: {
                categories,
                total_tools: data.length
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * GET /api/tools/:tool_name
 * Detalhes de uma ferramenta específica
 */
export async function getToolDetails(req, res) {
    try {
        const { tool_name } = req.params;
        
        const { data, error } = await supabase
            .from('tool_costs')
            .select('*')
            .eq('tool_name', tool_name)
            .eq('is_active', true)
            .single();
        
        if (error || !data) {
            return res.status(404).json({
                success: false,
                error: 'Ferramenta não encontrada'
            });
        }
        
        // Se usuário está logado, verificar se pode usar
        let canUse = null;
        if (req.user) {
            try {
                canUse = await canUseTool(req.user.id, tool_name);
            } catch (err) {
                // Ignorar erro se não puder verificar
            }
        }
        
        return res.json({
            success: true,
            data: {
                ...data,
                can_use: canUse
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * POST /api/tools/execute/:tool_name
 * Executa uma ferramenta (consome pontos automaticamente)
 */
export async function executeTool(req, res) {
    try {
        const userId = req.user.id;
        const { tool_name } = req.params;
        const { params } = req.body; // Parâmetros específicos da ferramenta
        
        // Verificar se ferramenta existe e está ativa
        const { data: tool, error: toolError } = await supabase
            .from('tool_costs')
            .select('*')
            .eq('tool_name', tool_name)
            .eq('is_active', true)
            .single();
        
        if (toolError || !tool) {
            return res.status(404).json({
                success: false,
                error: 'Ferramenta não encontrada ou inativa'
            });
        }
        
        // Consumir pontos
        try {
            const consumption = await consumePoints(userId, tool.points_cost, {
                type: 'tool_usage',
                description: `Uso da ferramenta: ${tool.display_name}`,
                tool_name: tool_name
            });
            
            // AQUI: Executar a lógica da ferramenta
            // Por enquanto, retornar sucesso com dados de consumo
            // TODO: Integrar com as ferramentas reais
            
            return res.json({
                success: true,
                message: `Ferramenta "${tool.display_name}" executada com sucesso`,
                data: {
                    tool: {
                        name: tool_name,
                        display_name: tool.display_name,
                        cost: tool.points_cost
                    },
                    consumption,
                    result: {
                        // TODO: Resultado da execução da ferramenta
                        status: 'pending_implementation',
                        message: 'Integração com ferramenta em desenvolvimento'
                    }
                }
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * GET /api/tools/history
 * Histórico de uso de ferramentas do usuário
 */
export async function getUsageHistory(req, res) {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        
        const { data, error, count } = await supabase
            .from('point_transactions')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .eq('type', 'tool_usage')
            .not('tool_name', 'is', null)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        
        if (error) {
            throw new Error('Erro ao buscar histórico de uso');
        }
        
        const totalPages = Math.ceil(count / limit);
        
        // Enriquecer com informações da ferramenta
        const enriched = await Promise.all(
            data.map(async (tx) => {
                const { data: tool } = await supabase
                    .from('tool_costs')
                    .select('display_name, category, icon')
                    .eq('tool_name', tx.tool_name)
                    .single();
                
                return {
                    ...tx,
                    tool_info: tool || null
                };
            })
        );
        
        return res.json({
            success: true,
            data: {
                history: enriched,
                pagination: {
                    page,
                    limit,
                    total: count,
                    total_pages: totalPages,
                    has_next: page < totalPages,
                    has_prev: page > 1
                }
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
