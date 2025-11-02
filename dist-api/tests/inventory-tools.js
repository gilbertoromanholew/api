/**
 * FASE 7.1: Inventário Automático de Ferramentas V9
 * 
 * Compara ferramentas no Supabase (tools_catalog) com código em src/tools/
 * e identifica gaps que precisam ser resolvidos.
 */

import { createClient } from '@supabase/supabase-js';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getToolsFromDatabase() {
    console.log('📊 Consultando tools_catalog no Supabase...\n');
    
    const { data: tools, error } = await supabase
        .from('tools_catalog')
        .select('id, slug, name, tool_type, category, cost_in_points, is_active')
        .eq('is_active', true)
        .order('tool_type', { ascending: true })
        .order('display_order', { ascending: true });
    
    if (error) {
        console.error('❌ Erro ao consultar banco:', error.message);
        return [];
    }
    
    console.log(`✅ Encontradas ${tools.length} ferramentas ativas no banco\n`);
    return tools;
}

async function getToolsFromCode() {
    console.log('📂 Escaneando pasta src/tools/...\n');
    
    const toolsPath = join(__dirname, 'src/tools');
    const folders = await readdir(toolsPath, { withFileTypes: true });
    
    const tools = folders
        .filter(f => f.isDirectory() && !f.name.startsWith('_'))
        .map(f => f.name);
    
    console.log(`✅ Encontradas ${tools.length} ferramentas no código\n`);
    return tools;
}

async function compareTools() {
    console.log('━'.repeat(70));
    console.log('🔍 FASE 7.1: INVENTÁRIO DE FERRAMENTAS V9');
    console.log('━'.repeat(70));
    console.log();
    
    const dbTools = await getToolsFromDatabase();
    const codeTools = await getToolsFromCode();
    
    // Criar sets para comparação
    const dbSlugs = new Set(dbTools.map(t => t.slug));
    const codeSlugs = new Set(codeTools);
    
    // Ferramentas no banco SEM código
    const missingCode = dbTools.filter(t => !codeSlugs.has(t.slug));
    
    // Ferramentas com código SEM banco
    const missingDB = codeTools.filter(slug => !dbSlugs.has(slug));
    
    // Ferramentas sincronizadas (existem em ambos)
    const synced = dbTools.filter(t => codeSlugs.has(t.slug));
    
    // ========================================
    // RELATÓRIO
    // ========================================
    
    console.log('📊 RESUMO DO INVENTÁRIO');
    console.log('━'.repeat(70));
    console.log(`Total no banco:          ${dbTools.length}`);
    console.log(`Total em código:         ${codeTools.length}`);
    console.log(`✅ Sincronizadas:        ${synced.length}`);
    console.log(`❌ Faltando código:      ${missingCode.length}`);
    console.log(`⚠️  Faltando no banco:   ${missingDB.length}`);
    console.log();
    
    if (synced.length > 0) {
        console.log('━'.repeat(70));
        console.log('✅ FERRAMENTAS SINCRONIZADAS (Banco + Código)');
        console.log('━'.repeat(70));
        synced.forEach(tool => {
            console.log(`   ${tool.slug.padEnd(30)} | ${tool.tool_type || 'sem tipo'} | ${tool.cost_in_points || 0} pts`);
        });
        console.log();
    }
    
    if (missingCode.length > 0) {
        console.log('━'.repeat(70));
        console.log('❌ FERRAMENTAS SEM CÓDIGO (Precisam ser criadas)');
        console.log('━'.repeat(70));
        console.log('Use: .\\create-tool.ps1 -ToolSlug "{slug}" -ToolName "{name}" -Cost {points}\n');
        
        missingCode.forEach(tool => {
            const cost = tool.cost_in_points || 50;
            const type = tool.tool_type || 'complementar';
            console.log(`   ${tool.slug.padEnd(30)} | ${tool.name.padEnd(40)} | ${type.padEnd(15)} | ${cost} pts`);
            console.log(`   Comando: .\\create-tool.ps1 -ToolSlug "${tool.slug}" -ToolName "${tool.name}" -Category "${tool.category || 'Geral'}" -Cost ${cost}`);
            console.log();
        });
    }
    
    if (missingDB.length > 0) {
        console.log('━'.repeat(70));
        console.log('⚠️  FERRAMENTAS SEM BANCO (Precisam ser cadastradas)');
        console.log('━'.repeat(70));
        console.log('Execute o SQL gerado pelo create-tool.ps1 no Supabase\n');
        
        missingDB.forEach(slug => {
            console.log(`   ${slug}`);
        });
        console.log();
    }
    
    // Estatísticas por tipo
    const byType = {};
    dbTools.forEach(tool => {
        const type = tool.tool_type || 'sem_tipo';
        if (!byType[type]) byType[type] = { total: 0, synced: 0, missing: 0 };
        byType[type].total++;
        if (codeSlugs.has(tool.slug)) {
            byType[type].synced++;
        } else {
            byType[type].missing++;
        }
    });
    
    console.log('━'.repeat(70));
    console.log('📈 ESTATÍSTICAS POR TIPO');
    console.log('━'.repeat(70));
    console.log('Tipo'.padEnd(20) + 'Total'.padEnd(10) + 'Sincronizadas'.padEnd(15) + 'Faltando Código');
    console.log('─'.repeat(70));
    
    Object.entries(byType).forEach(([type, stats]) => {
        console.log(
            type.padEnd(20) +
            stats.total.toString().padEnd(10) +
            stats.synced.toString().padEnd(15) +
            stats.missing.toString()
        );
    });
    console.log();
    
    // Conclusão
    console.log('━'.repeat(70));
    console.log('🎯 PRÓXIMAS AÇÕES');
    console.log('━'.repeat(70));
    
    if (missingCode.length > 0) {
        console.log(`1. Criar ${missingCode.length} ferramentas usando create-tool.ps1`);
        console.log(`2. Implementar lógica em cada {slug}Service.js`);
        console.log(`3. Testar endpoints /execute`);
    }
    
    if (missingDB.length > 0) {
        console.log(`4. Cadastrar ${missingDB.length} ferramentas no Supabase (executar SQL)`);
    }
    
    if (missingCode.length === 0 && missingDB.length === 0) {
        console.log('✅ TODAS AS FERRAMENTAS ESTÃO SINCRONIZADAS!');
        console.log('✅ Sistema V9 100% operacional');
    }
    
    console.log();
    console.log('━'.repeat(70));
}

// Executar
compareTools().catch(console.error);
