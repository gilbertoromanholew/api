import * as service from './calc_jurosService.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { config } from './calc_jurosRoutes.js';

/**
 * POST /api/tools/calc_juros/execute
 * Executa a ferramenta
 */
export async function execute(req, res) {
    try {
        const userId = req.user.id;
        const inputData = req.body;

        // TODO: Adicionar validaÃ§Ãµes especÃ­ficas
        if (!inputData) {
            return res.status(400).json({
                error: 'Dados de entrada sÃ£o obrigatÃ³rios'
            });
        }

        // 1. Buscar custo da ferramenta
        const { data: tool, error: toolError } = await supabaseAdmin
            .from('tools_catalog')
            .select('cost_in_points, id')
            .eq('slug', config.slug)
            .single();

        if (toolError || !tool) {
            console.error('[calc_juros] Ferramenta nÃ£o encontrada no catÃ¡logo');
            return res.status(500).json({ error: 'Ferramenta nÃ£o configurada' });
        }

        // 2. Deduzir pontos
        const { error: debitError } = await supabaseAdmin.rpc('debit_credits', {
            p_user_id: userId,
            p_amount: tool.cost_in_points,
            p_reason: \Uso da ferramenta: \\
        });

        if (debitError) {
            console.error('[calc_juros] Erro ao debitar pontos:', debitError);
            return res.status(400).json({ error: 'Saldo insuficiente' });
        }

        // 3. Executar lÃ³gica da ferramenta
        const resultado = await service.processar(inputData);

        // 4. Registrar execuÃ§Ã£o
        await supabaseAdmin.from('tools_executions').insert({
            user_id: userId,
            tool_id: tool.id,
            points_used: tool.cost_in_points,
            input_data: inputData,
            output_data: resultado,
            success: true
        });

        return res.json({
            success: true,
            resultado
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
 * Retorna informaÃ§Ãµes da ferramenta
 */
export async function getInfo(req, res) {
    try {
        return res.json({
            success: true,
            tool: {
                ...config,
                status: 'operational',
                autoDiscovered: true,
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
