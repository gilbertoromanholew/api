import { supabase, supabaseAdmin } from '../../config/supabase.js';
import { consumePoints, canUseTool, calculateToolCost } from '../../services/pointsService.js';

/**
 * Controller de Ferramentas - ATUALIZADO PARA NOVA ECONOMIA V7
 * 
 * MUDANÇAS V7:
 * - tool_costs → tools.catalog
 * - point_transactions → economy.transactions + tools.executions
 * - Suporte a multiplicador Pro
 * - Registro de execuções separado
 */

/**
 * GET /api/tools/list
 * Lista todas as ferramentas disponíveis com seus custos
 */
export async function listTools(req, res) {
    try {
        const { data, error } = await supabase
            .from('tools.catalog')
            .select('*')
            .eq('is_active', true)
            .order('category, name');
        
        if (error) {
            throw new Error('Erro ao buscar ferramentas');
        }
        
        // Se usuário está logado, calcular custos reais (com desconto Pro)
        let enrichedTools = data;
        if (req.user) {
            enrichedTools = await Promise.all(
                data.map(async (tool) => {
                    try {
                        const costInfo = await calculateToolCost(tool.slug, req.user.id);
                        return {
                            ...tool,
                            final_cost: costInfo.final_cost,
                            is_pro_user: costInfo.is_pro,
                            discount: costInfo.discount
                        };
                    } catch {
                        return {
                            ...tool,
                            final_cost: tool.base_cost,
                            is_pro_user: false,
                            discount: 0
                        };
                    }
                })
            );
        }
        
        // Agrupar por categoria
        const categories = {};
        enrichedTools.forEach(tool => {
            const category = tool.category || 'Outros';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push({
                slug: tool.slug,
                name: tool.name,
                description: tool.description,
                base_cost: tool.base_cost,
                final_cost: tool.final_cost || tool.base_cost,
                icon_url: tool.icon_url,
                discount: tool.discount || 0
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
 * GET /api/tools/:slug
 * Detalhes de uma ferramenta específica
 */
export async function getToolDetails(req, res) {
    try {
        const { slug } = req.params;
        
        const { data, error } = await supabase
            .from('tools.catalog')
            .select('*')
            .eq('slug', slug)
            .eq('is_active', true)
            .single();
        
        if (error || !data) {
            return res.status(404).json({
                success: false,
                error: 'Ferramenta não encontrada'
            });
        }
        
        // Se usuário está logado, verificar se pode usar
        let canUseInfo = null;
        if (req.user) {
            try {
                canUseInfo = await canUseTool(req.user.id, slug);
            } catch (err) {
                // Ignorar erro se não puder verificar
            }
        }
        
        return res.json({
            success: true,
            data: {
                ...data,
                can_use_info: canUseInfo
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
 * POST /api/tools/execute/:slug
 * Executa uma ferramenta (consome pontos automaticamente)
 */
export async function executeTool(req, res) {
    const startTime = Date.now();
    
    try {
        const userId = req.user.id;
        const { slug } = req.params;
        const { params } = req.body; // Parâmetros específicos da ferramenta
        
        // Buscar ferramenta e calcular custo real
        const costInfo = await calculateToolCost(slug, userId);
        
        if (!costInfo.tool) {
            return res.status(404).json({
                success: false,
                error: 'Ferramenta não encontrada ou inativa'
            });
        }
        
        // Consumir pontos
        try {
            const consumption = await consumePoints(userId, costInfo.final_cost, {
                type: 'debit',
                description: `Uso da ferramenta: ${costInfo.tool.name}`,
                tool_name: costInfo.tool.slug,
                is_pro: costInfo.is_pro,
                discount_applied: costInfo.discount
            });
            
            // Registrar execução em tools.executions
            const executionTime = Date.now() - startTime;
            const { data: execution } = await supabaseAdmin
                .from('tools.executions')
                .insert({
                    user_id: userId,
                    tool_id: costInfo.tool.id,
                    points_spent: costInfo.final_cost,
                    execution_time_ms: executionTime,
                    input_params: params || {},
                    success: true
                })
                .select()
                .single();
            
            // TODO: AQUI - Executar a lógica da ferramenta
            // Por enquanto, retornar sucesso com dados de consumo
            
            return res.json({
                success: true,
                message: `Ferramenta "${costInfo.tool.name}" executada com sucesso`,
                data: {
                    tool: {
                        slug: costInfo.tool.slug,
                        name: costInfo.tool.name,
                        base_cost: costInfo.base_cost,
                        final_cost: costInfo.final_cost,
                        discount: costInfo.discount
                    },
                    consumption,
                    execution_id: execution?.id,
                    result: {
                        // TODO: Resultado da execução da ferramenta
                        status: 'pending_implementation',
                        message: 'Integração com ferramenta em desenvolvimento'
                    }
                }
            });
        } catch (error) {
            // Registrar execução falhada
            const executionTime = Date.now() - startTime;
            await supabaseAdmin
                .from('tools.executions')
                .insert({
                    user_id: userId,
                    tool_id: costInfo.tool.id,
                    points_spent: 0,
                    execution_time_ms: executionTime,
                    input_params: params || {},
                    success: false,
                    error_message: error.message
                });
            
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
        
        // Buscar execuções do usuário
        const { data, error, count } = await supabase
            .from('tools.executions')
            .select(`
                *,
                tool:tool_id (
                    slug,
                    name,
                    description,
                    icon_url,
                    category
                )
            `, { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        
        if (error) {
            throw new Error('Erro ao buscar histórico de uso');
        }
        
        const totalPages = Math.ceil(count / limit);
        
        return res.json({
            success: true,
            data: {
                history: data,
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

/**
 * POST /api/tools/favorite/:slug
 * Adicionar ferramenta aos favoritos
 */
export async function toggleFavorite(req, res) {
    try {
        const userId = req.user.id;
        const { slug } = req.params;
        
        // Buscar ferramenta
        const { data: tool } = await supabase
            .from('tools.catalog')
            .select('id')
            .eq('slug', slug)
            .single();
        
        if (!tool) {
            return res.status(404).json({
                success: false,
                error: 'Ferramenta não encontrada'
            });
        }
        
        // Verificar se já é favorito
        const { data: existing } = await supabase
            .from('tools.user_favorites')
            .select('id')
            .eq('user_id', userId)
            .eq('tool_id', tool.id)
            .single();
        
        if (existing) {
            // Remover dos favoritos
            await supabaseAdmin
                .from('tools.user_favorites')
                .delete()
                .eq('id', existing.id);
            
            return res.json({
                success: true,
                message: 'Ferramenta removida dos favoritos',
                is_favorite: false
            });
        } else {
            // Adicionar aos favoritos
            await supabaseAdmin
                .from('tools.user_favorites')
                .insert({
                    user_id: userId,
                    tool_id: tool.id
                });
            
            return res.json({
                success: true,
                message: 'Ferramenta adicionada aos favoritos',
                is_favorite: true
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
 * GET /api/tools/favorites
 * Listar ferramentas favoritas do usuário
 */
export async function getFavorites(req, res) {
    try {
        const userId = req.user.id;
        
        const { data, error } = await supabase
            .from('tools.user_favorites')
            .select(`
                created_at,
                tool:tool_id (
                    slug,
                    name,
                    description,
                    base_cost,
                    icon_url,
                    category
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) {
            throw new Error('Erro ao buscar favoritos');
        }
        
        return res.json({
            success: true,
            data: {
                favorites: data.map(f => ({
                    ...f.tool,
                    favorited_at: f.created_at
                })),
                total: data.length
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
