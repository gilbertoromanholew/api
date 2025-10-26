import * as service from './exemploTestService.js';
import { supabaseAdmin } from '../../config/supabase.js';

/**
 * POST /api/tools/exemplo-test/execute
 * Executa a ferramenta de teste
 */
export async function execute(req, res) {
    try {
        console.log('\n🔧 [Exemplo Test] Executando ferramenta de teste...');
        
        const userId = req.user.id;
        const { mensagem } = req.body;
        
        if (!mensagem) {
            return res.status(400).json({
                success: false,
                error: 'Campo "mensagem" é obrigatório'
            });
        }
        
        // Processar com service
        const resultado = await service.processar({ mensagem, userId });
        
        console.log('✅ [Exemplo Test] Processado com sucesso');
        
        // Registrar execução (sem deduzir pontos - é apenas teste)
        await supabaseAdmin.from('tools_executions').insert({
            user_id: userId,
            tool_id: '00000000-0000-0000-0000-000000000000', // UUID fake para teste
            points_used: 0,
            input_data: req.body,
            output_data: resultado,
            success: true
        });
        
        return res.json({
            success: true,
            resultado
        });
        
    } catch (error) {
        console.error('❌ [Exemplo Test] Erro:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * GET /api/tools/exemplo-test/info
 * Retorna informações da ferramenta
 */
export function getInfo(req, res) {
    return res.json({
        success: true,
        tool: {
            slug: 'exemplo-test',
            name: 'Exemplo de Teste V9',
            version: '1.0.0',
            description: 'Ferramenta de teste para validar auto-discovery',
            status: 'operational',
            autoDiscovered: true
        }
    });
}
