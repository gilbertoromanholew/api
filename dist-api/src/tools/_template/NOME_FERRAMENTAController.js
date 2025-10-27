import * as service from './NOME_FERRAMENTAService.js';
import { supabaseAdmin } from '../../config/supabase.js';

/**
 * 🎯 POST /api/tools/SLUG_FERRAMENTA/execute
 * 
 * FLUXO V9 (Fonte Única da Verdade = Supabase):
 * 1. Valida dados de entrada
 * 2. Busca TODOS os dados da ferramenta no Supabase (slug, name, cost, is_active)
 * 3. Verifica se ferramenta está ativa
 * 4. Debita pontos do usuário (debit_credits)
 * 5. Executa lógica de negócio (Service)
 * 6. Registra execução para auditoria (tools_executions)
 * 7. Retorna resultado
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

        // ETAPA 1: Buscar ferramenta no Supabase (FONTE ÚNICA DA VERDADE)
        // O slug é extraído do caminho da pasta pelo auto-discovery
        const toolSlug = 'SLUG_FERRAMENTA'; // ⚠️ ALTERAR para o slug real
        
        const { data: tool, error: toolError } = await supabaseAdmin
            .from('tools_catalog')
            .select('id, slug, name, cost_in_points, is_active')
            .eq('slug', toolSlug)
            .single();

        if (toolError || !tool) {
            console.error(`[${toolSlug}] Ferramenta não encontrada no catálogo:`, toolError);
            return res.status(404).json({ 
                error: 'Ferramenta não encontrada' 
            });
        }

        // ETAPA 2: Verificar se ferramenta está ativa
        if (!tool.is_active) {
            return res.status(403).json({ 
                error: 'Ferramenta temporariamente indisponível' 
            });
        }

        // ETAPA 3: Debitar pontos do usuário
        const { error: debitError } = await supabaseAdmin.rpc('debit_credits', {
            p_user_id: userId,
            p_amount: tool.cost_in_points,
            p_reason: `Uso da ferramenta: ${tool.name}`  // ✅ Nome vem do Supabase
        });

        if (debitError) {
            console.error(`[${toolSlug}] Erro ao debitar pontos:`, debitError);
            return res.status(400).json({ 
                error: 'Saldo insuficiente ou erro ao processar pontos' 
            });
        }

        // ETAPA 4: Executar lógica da ferramenta
        const resultado = await service.processar(inputData);

        // ETAPA 5: Registrar histórico de execução (auditoria)
        await supabaseAdmin.from('tools_executions').insert({
            user_id: userId,
            tool_id: tool.id,
            points_used: tool.cost_in_points,
            input_data: inputData,
            output_data: resultado,
            success: true
        });

        // ETAPA 6: Retornar resultado com metadados
        return res.json({
            success: true,
            resultado,
            metadata: {
                tool_name: tool.name,
                points_used: tool.cost_in_points
            }
        });

    } catch (error) {
        console.error(`[SLUG_FERRAMENTA] Erro ao executar:`, error);
        
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
 * Retorna informações sobre a ferramenta (do Supabase).
 * Frontend usa para exibir nome, custo, categoria, etc.
 */
export async function getInfo(req, res) {
    try {
        const toolSlug = 'SLUG_FERRAMENTA'; // ⚠️ ALTERAR para o slug real
        
        // Buscar informações do Supabase (fonte única)
        const { data: tool, error } = await supabaseAdmin
            .from('tools_catalog')
            .select('*')
            .eq('slug', toolSlug)
            .single();

        if (error || !tool) {
            return res.status(404).json({ 
                error: 'Ferramenta não encontrada' 
            });
        }

        return res.json({
            success: true,
            tool: {
                ...tool,  // ✅ Todos os dados do Supabase
                endpoints: {
                    execute: `POST /api/tools/${toolSlug}/execute`,
                    info: `GET /api/tools/${toolSlug}/info`
                }
            }
        });
    } catch (error) {
        console.error(`[SLUG_FERRAMENTA] Erro ao obter info:`, error);
        return res.status(500).json({ error: error.message });
    }
}
