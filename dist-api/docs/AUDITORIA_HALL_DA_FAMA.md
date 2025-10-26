# 🚨 AUDITORIA: Hall da Fama - Ferramentas Mais Usadas

**Data:** 26/10/2025  
**Problema Reportado:** "Hall da fama mostra ferramentas que nunca ninguém usou"

---

## 🔍 ANÁLISE DO PROBLEMA

### **Código Atual** (`toolsService.js` - linha 61)

```javascript
export async function getMostUsedTools(limit = 4) {
  // 1. Busca últimas 1000 execuções de tools_executions
  const { data: executions } = await supabaseAdmin
    .from('tools_executions')
    .select('tool_id')
    .eq('success', true)
    .order('created_at', { ascending: false })
    .limit(1000);

  // 2. Se NÃO HÁ EXECUÇÕES:
  if (!executions || executions.length === 0) {
    return { data: [], error: null }; // ✅ Retorna vazio (correto)
  }

  // 3. Conta ocorrências e ordena
  // ...
}
```

### **Endpoint no Backend** (`toolsRoutes.js` - linha 81)

```javascript
router.get('/most-used', requireAuth, async (req, res) => {
  const limit = parseInt(req.query.limit) || 4;
  
  const { data, error } = await toolsService.getMostUsedTools(limit);
  
  return res.json({
    success: true,
    data: {
      tools: data,  // ✅ Se vazio, retorna []
      total: data.length
    }
  });
});
```

---

## 🎯 HIPÓTESES DO PROBLEMA

### **Hipótese 1: Tabela `tools_executions` está VAZIA** 🔴 PROVÁVEL

**Verificação:**
```sql
SELECT COUNT(*) as total_execucoes FROM tools_executions;
-- Se retornar 0 → Problema confirmado
```

**Causa:**
- Ninguém está chamando `trackToolUsage()` quando usa ferramentas
- Frontend não registra execuções
- Migração de dados não executada

---

### **Hipótese 2: Frontend mostra dados HARDCODED** 🟡 POSSÍVEL

**Verificação:** Buscar no código do frontend

```javascript
// Possível código no frontend (tools-website-builder):
const mostUsedTools = [
  { name: 'Calculadora X', usage_count: 150 },  // ❌ FAKE!
  { name: 'Validador Y', usage_count: 120 },   // ❌ FAKE!
  // ...
];
```

---

### **Hipótese 3: API retorna fallback quando vazio** 🟢 IMPROVÁVEL

O código backend atual **NÃO** faz isso (retorna array vazio se não houver dados).

---

## 🔬 DIAGNÓSTICO COMPLETO

Execute no Supabase SQL Editor:

```sql
-- ========================================
-- DIAGNÓSTICO: Hall da Fama
-- ========================================

-- 1. Verificar se tools_executions tem dados
SELECT 
  COUNT(*) as total_execucoes,
  COUNT(DISTINCT tool_id) as ferramentas_usadas,
  COUNT(DISTINCT user_id) as usuarios_distintos,
  MIN(created_at) as primeira_execucao,
  MAX(created_at) as ultima_execucao
FROM tools_executions;

-- 2. Top 10 ferramentas mais executadas (REALIDADE)
SELECT 
  t.name,
  t.slug,
  COUNT(e.id) as total_usos,
  COUNT(DISTINCT e.user_id) as usuarios_unicos
FROM tools_executions e
JOIN tools_catalog t ON t.id = e.tool_id
WHERE e.success = true
GROUP BY t.id, t.name, t.slug
ORDER BY total_usos DESC
LIMIT 10;

-- 3. Verificar se há execuções recentes (últimos 7 dias)
SELECT 
  DATE(created_at) as dia,
  COUNT(*) as execucoes
FROM tools_executions
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY dia DESC;

-- 4. Ver últimas 5 execuções registradas
SELECT 
  e.created_at,
  t.name as ferramenta,
  e.success,
  e.user_id
FROM tools_executions e
JOIN tools_catalog t ON t.id = e.tool_id
ORDER BY e.created_at DESC
LIMIT 5;
```

**Resultados Esperados:**

**Cenário A: Tabela VAZIA**
```
total_execucoes: 0
ferramentas_usadas: 0
usuarios_distintos: 0
```
→ **PROBLEMA CONFIRMADO**: Ninguém está registrando usos

**Cenário B: Tabela COM DADOS**
```
total_execucoes: 1500
ferramentas_usadas: 12
usuarios_distintos: 45
```
→ **PROBLEMA NO FRONTEND**: Mostra dados hardcoded

---

## 🛠️ CORREÇÕES NECESSÁRIAS

### **CORREÇÃO 1: Se tabela está vazia** 🔴

#### **A. Garantir que frontend registra usos**

Verificar se o frontend chama o endpoint `/tools/track` após usar ferramenta:

```javascript
// No frontend (após executar ferramenta):
await api.post('/tools/track', {
  toolName: 'calc_ferias',  // slug da ferramenta
  durationSeconds: 5,
  success: true,
  metadata: { /* resultado */ }
});
```

#### **B. Adicionar tracking automático no sistema de pricing**

Em `toolsPricingService.js`, adicionar chamada para `trackToolUsage`:

```javascript
import * as toolsService from './toolsService.js';

export async function calculateAndCharge(toolSlug, userId, experienceType) {
  // ... código de cobrança ...
  
  // ✅ REGISTRAR USO AUTOMATICAMENTE
  await toolsService.trackToolUsage(userId, toolSlug, {
    durationSeconds: 0,
    success: true,
    metadata: { experienceType },
    costInPoints: finalCost
  });
  
  return result;
}
```

#### **C. Popular dados iniciais (dados fake para demonstração)**

```sql
-- Apenas se quiser dados de demonstração
INSERT INTO tools_executions (user_id, tool_id, success, cost_in_points, executed_at)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),  -- Pega primeiro usuário
  id,
  true,
  cost_in_points,
  NOW() - (random() * interval '30 days')  -- Data aleatória últimos 30 dias
FROM tools_catalog
WHERE is_active = true
ORDER BY random()
LIMIT 50;  -- 50 execuções fake
```

---

### **CORREÇÃO 2: Se frontend usa dados hardcoded** 🟡

#### **Arquivo a verificar:**
```
tools-website-builder/src/views/Home.vue
tools-website-builder/src/components/HallOfFame.vue
tools-website-builder/src/components/MostUsedTools.vue
```

#### **Procurar por:**
```javascript
// Dados hardcoded (ERRADO):
const mostUsedTools = [
  { name: 'Calculadora', usage_count: 150 },
  // ...
];

// Deve ser (CORRETO):
const { data } = await api.get('/tools/most-used');
```

---

## 📊 SOLUÇÃO RECOMENDADA

### **Opção 1: Tracking Automático** ✅ RECOMENDADO

Modificar `calculateAndCharge` para sempre registrar execução:

```javascript
// Em toolsPricingService.js
export async function calculateAndCharge(toolSlug, userId, experienceType) {
  const tool = await getToolBySlug(toolSlug);
  const pricing = await getToolPricing(toolSlug, userId);
  
  // Calcular custo
  const finalCost = calculateFinalCost(pricing, experienceType);
  
  // Cobrar pontos
  await consumePoints(userId, finalCost, {
    type: 'tool_usage',
    tool_name: toolSlug,
    experience_type: experienceType
  });
  
  // ✅ REGISTRAR EXECUÇÃO (NOVO)
  await trackToolUsage(userId, toolSlug, {
    success: true,
    costInPoints: finalCost,
    metadata: { 
      experienceType,
      planType: pricing.planType 
    }
  });
  
  // Incrementar contador mensal
  if (tool.is_planning) {
    await incrementMonthlyUsage(userId, tool.id);
  }
  
  return {
    success: true,
    charged: finalCost,
    // ...
  };
}
```

**Benefícios:**
- Tracking 100% automático
- Não depende do frontend
- Dados sempre corretos

---

### **Opção 2: Endpoint Manual** ⚠️ NÃO RECOMENDADO

Manter como está e confiar que frontend sempre chama `/tools/track`.

**Problemas:**
- Frontend pode esquecer de chamar
- Erros de rede perdem dados
- Inconsistência entre cobranças e tracking

---

## 🧪 TESTE DE VALIDAÇÃO

Após correção, executar:

```sql
-- 1. Verificar se execuções estão sendo registradas
SELECT COUNT(*) FROM tools_executions 
WHERE created_at >= NOW() - INTERVAL '1 hour';
-- Deve aumentar conforme ferramentas são usadas

-- 2. Testar endpoint
-- Fazer requisição: GET /tools/most-used
-- Deve retornar ferramentas REAIS, não hardcoded

-- 3. Comparar com economy_transactions
SELECT 
  (SELECT COUNT(*) FROM economy_transactions WHERE type = 'tool_usage') as cobranças,
  (SELECT COUNT(*) FROM tools_executions) as execuções;
-- Números devem ser próximos (cobranças ≈ execuções)
```

---

## 📝 CHECKLIST DE AÇÃO

- [ ] Executar diagnóstico SQL no Supabase
- [ ] Verificar se `tools_executions` tem dados
- [ ] Se vazio: Implementar tracking automático
- [ ] Se cheio: Verificar frontend (dados hardcoded?)
- [ ] Testar endpoint `/tools/most-used`
- [ ] Validar que hall da fama mostra dados REAIS
- [ ] Monitorar por 24h

---

## 🎯 CONCLUSÃO

**Problema identificado:**
- Hall da fama provavelmente mostra dados fake porque `tools_executions` está vazia
- Sistema de tracking existe mas **NÃO está sendo usado**

**Solução:**
- Adicionar tracking automático em `calculateAndCharge()`
- Garantir que toda cobrança = uma execução registrada

**Próximo passo:**
Execute o diagnóstico SQL para confirmar hipótese!

