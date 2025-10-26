import * as service from './geradorPdfService.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { config } from './geradorPdfRoutes.js';

/**
 * POST /api/tools/gerador-pdf/execute
 * Gera PDF personalizado
 */
export async function execute(req, res) {
    try {
        const userId = req.user.id;
        const { titulo, conteudo, autor } = req.body;

        // Validação de entrada
        if (!titulo || !conteudo) {
            return res.status(400).json({
                error: 'Campos obrigatórios: titulo, conteudo'
            });
        }

        // 1. Buscar custo da ferramenta
        const { data: tool, error: toolError } = await supabaseAdmin
            .from('tools_catalog')
            .select('cost_in_points, id')
            .eq('slug', config.slug)
            .single();

        if (toolError || !tool) {
            console.error('[gerador-pdf] Ferramenta não encontrada no catálogo');
            return res.status(500).json({ error: 'Ferramenta não configurada' });
        }

        // 2. Deduzir pontos
        const { error: debitError } = await supabaseAdmin.rpc('debit_credits', {
            p_user_id: userId,
            p_amount: tool.cost_in_points,
            p_reason: `Uso da ferramenta: ${config.name}`
        });

        if (debitError) {
            console.error('[gerador-pdf] Erro ao debitar pontos:', debitError);
            return res.status(400).json({ error: 'Saldo insuficiente' });
        }

        // 3. Gerar PDF
        const resultado = await service.gerarPdf({
            titulo,
            conteudo,
            autor: autor || 'Sistema V9'
        });

        // 4. Registrar execução
        await supabaseAdmin.from('tools_executions').insert({
            user_id: userId,
            tool_id: tool.id,
            points_used: tool.cost_in_points,
            input_data: { titulo, conteudo, autor },
            output_data: {
                titulo: resultado.titulo,
                tamanho: resultado.tamanho,
                paginas: resultado.paginas
            },
            success: true
        });

        // Retornar PDF como base64
        return res.json({
            success: true,
            resultado: {
                titulo: resultado.titulo,
                autor: resultado.autor,
                tamanho: resultado.tamanho,
                paginas: resultado.paginas,
                pdfBase64: resultado.pdfBase64,
                timestamp: resultado.timestamp
            }
        });

    } catch (error) {
        console.error('[gerador-pdf] Erro:', error);
        return res.status(500).json({
            error: error.message || 'Erro ao gerar PDF'
        });
    }
}

/**
 * GET /api/tools/gerador-pdf/info
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
                    execute: 'POST /api/tools/gerador-pdf/execute',
                    info: 'GET /api/tools/gerador-pdf/info'
                },
                usage: {
                    body: {
                        titulo: 'string - Título do documento',
                        conteudo: 'string - Conteúdo do PDF (texto simples)',
                        autor: 'string - Autor do documento (opcional)'
                    }
                },
                output: {
                    pdfBase64: 'string - PDF codificado em base64 (para download no frontend)'
                }
            }
        });
    } catch (error) {
        console.error('[gerador-pdf] Erro ao obter info:', error);
        return res.status(500).json({ error: error.message });
    }
}
