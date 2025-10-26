import * as service from './calculadoraSimplesService.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { config } from './calculadoraSimplesRoutes.js';

/**
 * POST /api/tools/calculadora-simples/execute
 * Executa operação matemática
 */
export async function execute(req, res) {
    try {
        const userId = req.user.id;
        const { numero1, numero2, operacao } = req.body;

        // Validação de entrada
        if (numero1 === undefined || numero2 === undefined || !operacao) {
            return res.status(400).json({
                error: 'Campos obrigatórios: numero1, numero2, operacao'
            });
        }

        // 1. Buscar custo da ferramenta
        const { data: tool, error: toolError } = await supabaseAdmin
            .from('tools_catalog')
            .select('cost_in_points, id')
            .eq('slug', config.slug)
            .single();

        if (toolError || !tool) {
            console.error('[calculadora-simples] Ferramenta não encontrada no catálogo');
            return res.status(500).json({ error: 'Ferramenta não configurada' });
        }

        // 2. Deduzir pontos
        const { error: debitError } = await supabaseAdmin.rpc('debit_credits', {
            p_user_id: userId,
            p_amount: tool.cost_in_points,
            p_reason: `Uso da ferramenta: ${config.name}`
        });

        if (debitError) {
            console.error('[calculadora-simples] Erro ao debitar pontos:', debitError);
            return res.status(400).json({ error: 'Saldo insuficiente' });
        }

        // 3. Executar cálculo
        const resultado = await service.calcular({ numero1, numero2, operacao });

        // 4. Registrar execução
        await supabaseAdmin.from('tools_executions').insert({
            user_id: userId,
            tool_id: tool.id,
            points_used: tool.cost_in_points,
            input_data: { numero1, numero2, operacao },
            output_data: resultado,
            success: true
        });

        return res.json({
            success: true,
            resultado
        });

    } catch (error) {
        console.error('[calculadora-simples] Erro:', error);
        return res.status(500).json({
            error: error.message || 'Erro ao processar cálculo'
        });
    }
}

/**
 * GET /api/tools/calculadora-simples/info
 * Retorna informações da ferramenta
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
                    execute: 'POST /api/tools/calculadora-simples/execute',
                    info: 'GET /api/tools/calculadora-simples/info'
                },
                usage: {
                    body: {
                        numero1: 'number - Primeiro número',
                        numero2: 'number - Segundo número',
                        operacao: 'string - Operação (soma, subtracao, multiplicacao, divisao)'
                    }
                }
            }
        });
    } catch (error) {
        console.error('[calculadora-simples] Erro ao obter info:', error);
        return res.status(500).json({ error: error.message });
    }
}
