# 🚀 Sistema V9 - Auto-Discovery de Ferramentas

## 📊 Visão Geral

**O que mudou?**  
V8: Adicionar ferramenta = editar 5+ arquivos  
V9: Adicionar ferramenta = rodar 1 script (~45min)

**Princípio fundamental**: ZERO edição manual de `server.js` ou `main.js`

---

## 🏗️ Arquitetura V9

### Backend: Auto-Load com Glob Import

```
api/dist-api/src/
├── server.js                     ← UMA linha: autoLoadToolRoutes(app)
├── utils/
│   └── autoLoadTools.js          ← Sistema de auto-discovery
└── tools/                        ← Pasta mágica ✨
    ├── consulta-cnpj/
    │   ├── consultaCnpjRoutes.js      ← Exporta { router, config }
    │   ├── consultaCnpjController.js
    │   └── consultaCnpjService.js
    ├── calculo-fgts/
    │   ├── calculoFgtsRoutes.js       ← Exporta { router, config }
    │   ├── calculoFgtsController.js
    │   └── calculoFgtsService.js
    └── ...                        ← Adicione quantas quiser! 🎉
```

**Como funciona:**
1. `autoLoadTools.js` escaneia pasta `tools/`
2. Encontra todos `*Routes.js`
3. Importa dinamicamente
4. Registra rotas no Express automaticamente

**Resultado:** Nova ferramenta = criar pasta + 3 arquivos. ZERO edição de server.js! ✅

---

### Frontend: Config Dinâmico

```
tools-website-builder/src/
├── main.js                       ← Glob import já existe! ✅
├── config/
│   └── toolsConfig.js            ← Apenas IDs, resto vem do Supabase
└── tools/
    ├── consulta-cnpj/
    │   ├── config.js              ← export const id = 'uuid-da-tool'
    │   ├── ConsultaCnpjExecutor.vue
    │   └── ConsultaCnpj.vue
    ├── calculo-fgts/
    │   ├── config.js              ← export const id = 'uuid-da-tool'
    │   ├── CalculoFgtsExecutor.vue
    │   └── CalculoFgts.vue
    └── ...
```

**Como funciona:**
1. `config.js` tem apenas `id` (UUID do Supabase)
2. Componente chama `getToolInfo(id)` na montagem
3. `getToolInfo()` busca dados do Supabase (cache 5min)
4. Retorna: nome, descrição, custo, categoria, etc.

**Resultado:** Atualizar título/custo = editar Supabase. ZERO deploy! ✅

---

## 🎯 Fluxo de Adição de Ferramenta V9

### Passo 1: Cadastrar no Supabase (~5min)

```sql
INSERT INTO tools_catalog (
    name,
    slug,
    description,
    category,
    cost_in_points,
    tool_type,
    is_active
) VALUES (
    'Cálculo de FGTS',
    'calculo-fgts',
    'Calcula valores de FGTS com juros e correção',
    'Trabalhista',
    5,
    'calculation',
    true
) RETURNING id; -- Copie este UUID!
```

---

### Passo 2: Rodar Script Automático (~30min)

```bash
# Windows (PowerShell)
.\scripts\create-tool.ps1 -name "calculo-fgts" -id "uuid-copiado-do-supabase"

# Linux/Mac
./scripts/create-tool.sh "calculo-fgts" "uuid-copiado-do-supabase"
```

**O que o script faz:**
1. ✅ Cria pasta `api/dist-api/src/tools/calculo-fgts/`
2. ✅ Gera `calculoFgtsRoutes.js` (template)
3. ✅ Gera `calculoFgtsController.js` (template)
4. ✅ Gera `calculoFgtsService.js` (template)
5. ✅ Cria pasta `tools-website-builder/src/tools/calculo-fgts/`
6. ✅ Gera `config.js` (com ID do Supabase)
7. ✅ Gera `CalculoFgtsExecutor.vue` (template)
8. ✅ Gera `CalculoFgts.vue` (template)

**Resultado:** 8 arquivos criados, 100% estruturados, prontos para customizar! 🎉

---

### Passo 3: Implementar Lógica (~10min)

**Backend** (`calculoFgtsService.js`):
```javascript
export async function calcularFgts(dados) {
    // Sua lógica aqui
    const { salario, meses } = dados;
    const fgts = salario * 0.08 * meses;
    
    return {
        fgts,
        multa: fgts * 0.4,
        total: fgts * 1.4
    };
}
```

**Frontend** (`CalculoFgtsExecutor.vue`):
```vue
<template>
  <ToolExecutor
    :tool-id="toolId"
    :fields="fields"
    @execute="handleExecute"
  >
    <!-- Customizações aqui -->
  </ToolExecutor>
</template>

<script setup>
const fields = [
  { name: 'salario', label: 'Salário', type: 'number', required: true },
  { name: 'meses', label: 'Meses', type: 'number', required: true }
];

async function handleExecute(dados) {
  // Lógica de execução
  const response = await executeToolApi(toolId, dados);
  return response;
}
</script>
```

---

### Passo 4: Testar (~5min)

```bash
# Backend
cd api/dist-api
npm run dev
# ✅ Rota criada automaticamente: POST /api/tools/calculo-fgts/execute

# Frontend  
cd tools-website-builder
npm run dev
# ✅ Acesse: http://localhost:5173/tools/calculo-fgts
```

**Verificações:**
- [x] Ferramenta aparece na lista
- [x] Modal abre corretamente
- [x] Execução deduz pontos
- [x] Resultado é exibido
- [x] Histórico é registrado

---

## 📋 Checklist de Migração V8 → V9

### Backend

- [ ] Instalar dependência `glob`
  ```bash
  npm install glob
  ```

- [ ] Criar `src/utils/autoLoadTools.js` ✅

- [ ] Atualizar `server.js`:
  ```javascript
  // ANTES (V8)
  import consultaCnpjRoutes from './tools/consulta-cnpj/consultaCnpjRoutes.js';
  app.use('/api/tools/consulta-cnpj', consultaCnpjRoutes);
  
  // DEPOIS (V9)
  import { autoLoadToolRoutes } from './utils/autoLoadTools.js';
  await autoLoadToolRoutes(app);
  ```

- [ ] Migrar ferramentas existentes para nova estrutura

---

### Frontend

- [ ] Simplificar `config.js` de cada ferramenta:
  ```javascript
  // ANTES (V8)
  export default {
    id: 'uuid-da-tool',
    name: 'Consulta CNPJ',
    description: '...',
    category: 'Consultas',
    cost: 3
  }
  
  // DEPOIS (V9)
  export const id = 'uuid-da-tool'; // Só isso! ✨
  ```

- [ ] Criar helper `getToolInfo(id)`:
  ```javascript
  const cache = new Map();
  
  export async function getToolInfo(toolId) {
    // Verificar cache (5min TTL)
    if (cache.has(toolId)) {
      const { data, timestamp } = cache.get(toolId);
      if (Date.now() - timestamp < 300000) return data;
    }
    
    // Buscar do Supabase
    const { data, error } = await supabase
      .from('tools_catalog')
      .select('*')
      .eq('id', toolId)
      .single();
    
    if (error) throw error;
    
    // Atualizar cache
    cache.set(toolId, { data, timestamp: Date.now() });
    
    return data;
  }
  ```

- [ ] Atualizar executors para usar `getToolInfo()`

---

## 🛠️ Templates

### Backend: `{slug}Routes.js`

```javascript
import express from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import * as controller from './{slug}Controller.js';

const router = express.Router();

// Config da ferramenta (opcional, mas recomendado)
export const config = {
    slug: '{slug}',
    name: '{Name}',
    version: '1.0.0'
};

// POST /api/tools/{slug}/execute
router.post('/execute', requireAuth, controller.execute);

export { router };
export default router;
```

---

### Backend: `{slug}Controller.js`

```javascript
import * as service from './{slug}Service.js';
import { supabaseAdmin } from '../../config/supabase.js';

export async function execute(req, res) {
    try {
        const userId = req.user.id;
        const toolId = '{tool-uuid}'; // ID do Supabase
        
        // 1. Buscar ferramenta
        const { data: tool } = await supabaseAdmin
            .from('tools_catalog')
            .select('cost_in_points')
            .eq('id', toolId)
            .single();
        
        // 2. Deduzir pontos
        const { error: debitError } = await supabaseAdmin.rpc('debit_credits', {
            p_user_id: userId,
            p_amount: tool.cost_in_points,
            p_reason: 'Uso da ferramenta: {Name}'
        });
        
        if (debitError) {
            return res.status(400).json({ error: 'Saldo insuficiente' });
        }
        
        // 3. Executar lógica
        const result = await service.process(req.body);
        
        // 4. Registrar execução
        await supabaseAdmin.from('tools_executions').insert({
            user_id: userId,
            tool_id: toolId,
            points_used: tool.cost_in_points,
            input_data: req.body,
            output_data: result,
            success: true
        });
        
        return res.json({ result });
        
    } catch (error) {
        console.error('Erro ao executar {slug}:', error);
        return res.status(500).json({ error: error.message });
    }
}
```

---

### Backend: `{slug}Service.js`

```javascript
/**
 * Lógica principal da ferramenta {Name}
 */
export async function process(data) {
    // Validar entrada
    if (!data.campo1 || !data.campo2) {
        throw new Error('Campos obrigatórios faltando');
    }
    
    // Processar
    const resultado = {
        // Sua lógica aqui
    };
    
    return resultado;
}
```

---

### Frontend: `config.js`

```javascript
// V9: APENAS o ID! Resto vem do Supabase via getToolInfo()
export const id = '{tool-uuid}';
```

---

### Frontend: `{Name}Executor.vue`

```vue
<template>
  <ToolExecutor
    :tool-id="toolId"
    :fields="fields"
    @execute="handleExecute"
  >
    <template #result="{ result }">
      <!-- Customizar exibição do resultado -->
      <div class="result-container">
        <h3>Resultado:</h3>
        <pre>{{ result }}</pre>
      </div>
    </template>
  </ToolExecutor>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { id as toolId } from './config.js';
import { executeToolApi } from '@/services/toolsService';
import { getToolInfo } from '@/utils/toolInfoCache';

// Campos do formulário
const fields = [
  {
    name: 'campo1',
    label: 'Campo 1',
    type: 'text',
    required: true,
    placeholder: 'Digite aqui'
  },
  {
    name: 'campo2',
    label: 'Campo 2',
    type: 'number',
    required: true
  }
];

// Informações da ferramenta (do Supabase)
const toolInfo = ref(null);

onMounted(async () => {
  toolInfo.value = await getToolInfo(toolId);
});

async function handleExecute(formData) {
  const response = await executeToolApi(toolId, formData);
  return response.result;
}
</script>
```

---

## 📚 Comandos Úteis

### Listar ferramentas disponíveis
```javascript
import { listAvailableTools } from './utils/autoLoadTools.js';
const tools = await listAvailableTools();
console.table(tools);
```

### Validar estrutura de ferramenta
```javascript
import { validateToolStructure } from './utils/autoLoadTools.js';
const validation = await validateToolStructure('calculo-fgts');
console.log(validation);
```

### Debug: Ver rotas carregadas
```javascript
import { autoLoadToolRoutes } from './utils/autoLoadTools.js';
const stats = await autoLoadToolRoutes(app);
console.log(`✅ ${stats.loaded} ferramentas carregadas`);
console.table(stats.tools);
```

---

## 🎯 Benefícios V9

| Aspecto | V8 | V9 |
|---------|----|----|
| **Tempo para adicionar ferramenta** | ~80min | ~45min |
| **Arquivos a editar** | 8-10 | 3 (apenas lógica) |
| **server.js** | Editar sempre | NUNCA ✨ |
| **main.js** | Editar sempre | NUNCA ✨ |
| **Atualizar título/custo** | Deploy completo | Editar Supabase |
| **Risco de erro** | Alto (edição manual) | Baixo (templates) |
| **Manutenibilidade** | Baixa | Alta |

---

## 🚨 Troubleshooting

### Erro: "Cannot find module './tools/{slug}/{slug}Routes.js'"
**Causa**: Pasta ou arquivo não existe  
**Solução**: Verificar estrutura com `validateToolStructure(slug)`

### Erro: "{slug}Routes.js não exporta 'router'"
**Causa**: Export incorreto  
**Solução**: Garantir `export { router }` ou `export default router`

### Ferramenta não aparece na lista
**Causa**: Auto-discovery falhou  
**Solução**: Verificar logs do servidor, validar estrutura de pastas

### Config não carrega (frontend)
**Causa**: `getToolInfo()` não implementado  
**Solução**: Criar helper `toolInfoCache.js`

---

## 📖 Próximos Passos

- [x] **FASE 2**: Sistema de Segurança (JWT + RLS) ✅
- [ ] **FASE 3**: Auto-Discovery Backend (em progresso)
- [ ] **FASE 4**: Config Dinâmico Frontend
- [ ] **FASE 5**: Templates e Scripts
- [ ] **FASE 6**: Implementação FGTS (Exemplo)
- [ ] **FASE 7**: Migração V8 → V9
- [ ] **FASE 8**: Testes e Documentação

---

**Documentação completa**: `/api/docs/database/GUIA_SEGURANCA_JWT_RLS.md`  
**Auditoria V8**: `/api/docs/database/AUDITORIA_JWT_RLS_V8.md`
