import * as service from './NOME_FERRAMENTAService.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { config } from './NOME_FERRAMENTARoutes.js';

/**
 * 🎯 POST /api/tools/SLUG_FERRAMENTA/execute
 * 
 * FLUXO:
 * 1. Valida dados de entrada
 * 2. Busca custo da ferramenta no Supabase (tools_catalog)
 * 3. Debita pontos do usuário (debit_credits)
 * 4. Executa lógica de negócio (Service)
 * 5. Registra execução para auditoria (tools_executions)
 * 6. Retorna resultado
 */
export async function execute(req, res) {
    try {
        const userId = req.user.id;
        const inputData = req.body;

        // ⚠️ TODO: Adicionar validações específicas da ferramenta
        if (!inputData) {
            return res.status(400).json({
                error: 'Dados de entrada são obrigatórios'
            });
        }

        // ETAPA 1: Buscar custo da ferramenta no Supabase
        const { data: tool, error: toolError } = await supabaseAdmin
            .from('tools_catalog')
            .select('id, cost_in_points')
            .eq('slug', config.slug)
            .single();

        if (toolError || !tool) {
            console.error(`[${config.slug}] Ferramenta não encontrada no catálogo:`, toolError);
            return res.status(500).json({ 
                error: 'Ferramenta não configurada no sistema' 
            });
        }

        // ETAPA 2: Deduzir pontos do usuário
        const { error: debitError } = await supabaseAdmin.rpc('debit_credits', {
            p_user_id: userId,
            p_amount: tool.cost_in_points,
            p_reason: `Uso da ferramenta: ${config.name}`
        });

        if (debitError) {
            console.error(`[${config.slug}] Erro ao debitar pontos:`, debitError);
            return res.status(400).json({ 
                error: 'Saldo insuficiente ou erro ao debitar pontos' 
            });
        }

        // ETAPA 3: Executar lógica da ferramenta
        const resultado = await service.processar(inputData);

        // ETAPA 4: Registrar execução (auditoria)
        await supabaseAdmin.from('tools_executions').insert({
            user_id: userId,
            tool_id: tool.id,
            points_used: tool.cost_in_points,
            input_data: inputData,
            output_data: resultado,
            success: true
        });

        // ETAPA 5: Retornar resultado
        return res.json({
            success: true,
            resultado
        });

    } catch (error) {
        console.error(`[${config.slug}] Erro ao executar:`, error);
        
        // Em caso de erro, tentar reverter pontos (opcional)
        // TODO: Implementar reversão de pontos se necessário
        
        return res.status(500).json({
            error: error.message || 'Erro ao processar ferramenta'
        });
    }
}

/**
 * 🔍 GET /api/tools/SLUG_FERRAMENTA/info
 * 
 * Retorna informações sobre a ferramenta.
 * Útil para validar se está funcionando.
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
                    execute: `POST /api/tools/${config.slug}/execute`,
                    info: `GET /api/tools/${config.slug}/info`
                }
            }
        });
    } catch (error) {
        console.error(`[${config.slug}] Erro ao obter info:`, error);
        return res.status(500).json({ error: error.message });
    }
}
