import * as service from './calcJurosService.js';
import { supabaseAdmin } from '../../config/supabase.js';

/**
 * POST /api/tools/calc_juros/execute
 * Executa a ferramenta (débito de pontos + lógica)
 */
export async function execute(req, res) {
    try {
        const userId = req.user.id;
        const inputData = req.body;
        const skipDebit = req.query.skipDebit === 'true'; // Já foi debitado no frontend

        // Validação de entrada
        if (!inputData || !inputData.capital || !inputData.taxa || !inputData.periodo) {
            return res.status(400).json({
                error: 'Dados obrigatórios: capital, taxa, periodo, tipo (simples ou composto)'
            });
        }

        // 1. Buscar ferramenta no Supabase (FONTE ÚNICA DA VERDADE)
        const { data: tool, error: toolError } = await supabaseAdmin
            .from('tools_catalog')
            .select('id, slug, name, cost_in_points, is_active')
            .eq('slug', 'calc_juros')
            .single();

        if (toolError || !tool) {
            console.error('[calc_juros] Ferramenta não encontrada no catálogo:', toolError);
            return res.status(404).json({ 
                error: 'Ferramenta não encontrada' 
            });
        }

        if (!tool.is_active) {
            return res.status(403).json({ 
                error: 'Ferramenta temporariamente indisponível' 
            });
        }

        // 2. Debitar pontos do usuário (APENAS SE NÃO FOI DEBITADO NO FRONTEND)
        if (!skipDebit) {
            const { error: debitError } = await supabaseAdmin.rpc('deduct_credits', {
                p_user_id: userId,
                p_amount: tool.cost_in_points,
                p_description: `Uso da ferramenta: ${tool.name}`
            });

            if (debitError) {
                console.error('[calc_juros] Erro ao debitar pontos:', debitError);
                return res.status(400).json({ 
                    error: 'Saldo insuficiente ou erro ao processar pontos' 
                });
            }
        } else {
            console.log('[calc_juros] Débito de pontos ignorado (já processado no frontend)');
        }

        // 3. Executar lógica da ferramenta
        const resultado = await service.processar(inputData);

        // 4. Registrar histórico de execução
        await supabaseAdmin.from('tools_executions').insert({
            user_id: userId,
            tool_id: tool.id,
            points_used: skipDebit ? 0 : tool.cost_in_points, // 0 se já foi debitado
            input_data: inputData,
            output_data: resultado,
            success: true
        });

        return res.json({
            success: true,
            resultado,
            metadata: {
                tool_name: tool.name,
                points_used: skipDebit ? 0 : tool.cost_in_points
            }
        });

    } catch (error) {
        console.error('[calc_juros] Erro:', error);
        return res.status(500).json({
            error: error.message || 'Erro ao processar ferramenta'
        });
    }
}

/**
 * GET /api/tools/calc_juros/info
 * Retorna informações da ferramenta (do Supabase)
 */
export async function getInfo(req, res) {
    try {
        // Buscar informações do Supabase (fonte única)
        const { data: tool, error } = await supabaseAdmin
            .from('tools_catalog')
            .select('*')
            .eq('slug', 'calc_juros')
            .single();

        if (error || !tool) {
            return res.status(404).json({ 
                error: 'Ferramenta não encontrada' 
            });
        }

        return res.json({
            success: true,
            tool: {
                ...tool,
                endpoints: {
                    execute: 'POST /api/tools/calc_juros/execute',
                    info: 'GET /api/tools/calc_juros/info'
                }
            }
        });
    } catch (error) {
        console.error('[calc_juros] Erro ao obter info:', error);
        return res.status(500).json({ error: error.message });
    }
}
