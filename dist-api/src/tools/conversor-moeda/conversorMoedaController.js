import * as service from './conversorMoedaService.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { config } from './conversorMoedaRoutes.js';

/**
 * POST /api/tools/conversor-moeda/execute
 * Converte valor entre moedas
 */
export async function execute(req, res) {
    try {
        const userId = req.user.id;
        const { valor, moedaOrigem, moedaDestino } = req.body;

        // Validação de entrada
        if (!valor || !moedaOrigem || !moedaDestino) {
            return res.status(400).json({
                error: 'Campos obrigatórios: valor, moedaOrigem, moedaDestino'
            });
        }

        // 1. Buscar custo da ferramenta
        const { data: tool, error: toolError } = await supabaseAdmin
            .from('tools_catalog')
            .select('cost_in_points, id')
            .eq('slug', config.slug)
            .single();

        if (toolError || !tool) {
            console.error('[conversor-moeda] Ferramenta não encontrada no catálogo');
            return res.status(500).json({ error: 'Ferramenta não configurada' });
        }

        // 2. Deduzir pontos
        const { error: debitError } = await supabaseAdmin.rpc('debit_credits', {
            p_user_id: userId,
            p_amount: tool.cost_in_points,
            p_reason: `Uso da ferramenta: ${config.name}`
        });

        if (debitError) {
            console.error('[conversor-moeda] Erro ao debitar pontos:', debitError);
            return res.status(400).json({ error: 'Saldo insuficiente' });
        }

        // 3. Executar conversão
        const resultado = await service.converter({
            valor,
            moedaOrigem: moedaOrigem.toUpperCase(),
            moedaDestino: moedaDestino.toUpperCase()
        });

        // 4. Registrar execução
        await supabaseAdmin.from('tools_executions').insert({
            user_id: userId,
            tool_id: tool.id,
            points_used: tool.cost_in_points,
            input_data: { valor, moedaOrigem, moedaDestino },
            output_data: resultado,
            success: true
        });

        return res.json({
            success: true,
            resultado
        });

    } catch (error) {
        console.error('[conversor-moeda] Erro:', error);
        return res.status(500).json({
            error: error.message || 'Erro ao processar conversão'
        });
    }
}

/**
 * GET /api/tools/conversor-moeda/info
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
                    execute: 'POST /api/tools/conversor-moeda/execute',
                    info: 'GET /api/tools/conversor-moeda/info',
                    moedas: 'GET /api/tools/conversor-moeda/moedas-disponiveis'
                },
                usage: {
                    body: {
                        valor: 'number - Valor a converter',
                        moedaOrigem: 'string - Código da moeda origem (ex: BRL, USD)',
                        moedaDestino: 'string - Código da moeda destino (ex: USD, EUR)'
                    }
                }
            }
        });
    } catch (error) {
        console.error('[conversor-moeda] Erro ao obter info:', error);
        return res.status(500).json({ error: error.message });
    }
}

/**
 * GET /api/tools/conversor-moeda/moedas-disponiveis
 * Retorna lista de moedas suportadas
 */
export async function getMoedasDisponiveis(req, res) {
    try {
        const moedas = service.getMoedasSuportadas();
        return res.json({
            success: true,
            moedas
        });
    } catch (error) {
        console.error('[conversor-moeda] Erro ao obter moedas:', error);
        return res.status(500).json({ error: error.message });
    }
}
