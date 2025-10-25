import { supabase, supabaseAdmin } from '../../config/supabase.js';
import { supabaseQuery } from '../../config/supabaseRest.js';
import { consumePoints, canUseTool } from '../points/pointsService.js';
// Fase 3: Auditoria de execução de ferramentas
import { logToolExecution } from '../../services/auditService.js';

/**
 * GET /api/tools/list
 * Lista todas as ferramentas disponíveis com seus custos
 */
export async function listTools(req, res) {
    try {
        console.log('🔍 [Tools] Buscando ferramentas do banco...')
        
        // ✅ USAR supabaseAdmin para ignorar RLS (tabela é pública)
        const { data, error } = await supabaseAdmin
            .from('tools_catalog')
            .select('*')
            .eq('is_active', true)
            .order('category, name');
        
        if (error) {
            console.error('❌ [Tools] Erro ao buscar ferramentas:', error);
            throw new Error('Erro ao buscar ferramentas');
        }
        
        console.log(`📊 [Tools] Total de ferramentas encontradas: ${data?.length || 0}`)
        
        if (!data || data.length === 0) {
            console.warn('⚠️ [Tools] NENHUMA ferramenta encontrada no banco!')
            console.warn('   Verificar:')
            console.warn('   1. Tabela tools_catalog tem dados?')
            console.warn('   2. Todas estão com is_active = false?')
            console.warn('   3. Permissões RLS bloqueando leitura?')
        }
        
        // Agrupar por categoria
        const categories = {};
        data.forEach(tool => {
            const category = tool.category || 'Outros';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push({
                slug: tool.slug,
                name: tool.name,
                display_name: tool.name,
                description: tool.description,
                points_cost: tool.cost_in_points,
                base_cost: tool.cost_in_points,
                icon: tool.icon_url || '🛠️'
            });
        });
        
        console.log('📂 [Tools] Categorias:', Object.keys(categories))
        Object.keys(categories).forEach(cat => {
            console.log(`   - ${cat}: ${categories[cat].length} ferramentas`)
        })
        
        return res.json({
            success: true,
            data: {
                categories,
                total_tools: data.length
            }
        });
    } catch (error) {
        console.error('❌ [Tools] Exceção:', error)
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
        
        // V7: Buscar da tools.catalog por slug
        const { data, error } = await supabase
            .from('tools_catalog')
            .select('*')
            .eq('slug', tool_name)
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
                tool_name: data.slug,
                display_name: data.name,
                description: data.description,
                category: data.category,
                points_cost: data.cost_in_points,
                is_active: data.is_active,
                icon: data.icon,
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
 * Fase 3: Registra execução no audit log
 */
export async function executeTool(req, res) {
    const startTime = Date.now(); // Fase 3: Medir tempo de execução
    
    try {
        const userId = req.user.id;
        const { tool_name } = req.params;
        const { params } = req.body; // Parâmetros específicos da ferramenta
        
        // V7: Verificar se ferramenta existe e está ativa
        const { data: tool, error: toolError } = await supabase
            .from('tools_catalog')
            .select('*')
            .eq('slug', tool_name)
            .eq('is_active', true)
            .single();
        
        if (toolError || !tool) {
            // Fase 3: Registrar tentativa falhada
            const executionTime = Date.now() - startTime;
            logToolExecution(
                userId,
                tool_name,
                params,
                req.ip,
                req.headers['user-agent'],
                executionTime,
                false,
                'Ferramenta não encontrada ou inativa'
            ).catch(err => console.error('[Audit] Failed to log tool execution:', err));
            
            return res.status(404).json({
                success: false,
                error: 'Ferramenta não encontrada ou inativa'
            });
        }
        
        // Consumir pontos
        try {
            const consumption = await consumePoints(userId, tool.cost_in_points, {
                type: 'tool_usage',
                description: `Uso da ferramenta: ${tool.name}`,
                tool_name: tool_name
            });
            
            // AQUI: Executar a lógica da ferramenta
            // Por enquanto, retornar sucesso com dados de consumo
            // TODO: Integrar com as ferramentas reais
            
            // Fase 3: Registrar execução bem-sucedida
            const executionTime = Date.now() - startTime;
            logToolExecution(
                userId,
                tool_name,
                params,
                req.ip,
                req.headers['user-agent'],
                executionTime,
                true,
                null
            ).catch(err => console.error('[Audit] Failed to log tool execution:', err));
            
            return res.json({
                success: true,
                message: `Ferramenta "${tool.name}" executada com sucesso`,
                data: {
                    tool: {
                        name: tool_name,
                        display_name: tool.name,
                        cost: tool.cost_in_points
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
            // Fase 3: Registrar falha (pontos insuficientes)
            const executionTime = Date.now() - startTime;
            logToolExecution(
                userId,
                tool_name,
                params,
                req.ip,
                req.headers['user-agent'],
                executionTime,
                false,
                error.message
            ).catch(err => console.error('[Audit] Failed to log tool execution:', err));
            
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
    } catch (error) {
        // Fase 3: Registrar erro geral
        const executionTime = Date.now() - startTime;
        logToolExecution(
            req.user?.id,
            req.params.tool_name,
            req.body.params,
            req.ip,
            req.headers['user-agent'],
            executionTime,
            false,
            error.message
        ).catch(err => console.error('[Audit] Failed to log tool execution:', err));
        
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
        
        // V7: Buscar de tools.executions com join
        const { data, error, count } = await supabase
            .from('tools_executions')
            .select(`
                *,
                tool:tool_id (
                    name,
                    slug,
                    category,
                    icon
                )
            `, { count: 'exact' })
            .eq('user_id', userId)
            .order('executed_at', { ascending: false })
            .range(offset, offset + limit - 1);
        
        if (error) {
            throw new Error('Erro ao buscar histórico de uso');
        }
        
        const totalPages = Math.ceil(count / limit);
        
        // Mapear para formato esperado
        const enriched = data.map(exec => ({
            id: exec.id,
            tool_name: exec.tool?.slug || exec.tool_id,
            display_name: exec.tool?.name || exec.tool_id,
            category: exec.tool?.category,
            icon: exec.tool?.icon,
            points_cost: exec.cost_in_points,
            success: exec.success,
            created_at: exec.executed_at,
            result: exec.result,
            error_message: exec.error_message,
            tool_info: exec.tool
        }));
        
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
