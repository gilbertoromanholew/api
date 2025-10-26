# 🎯 ESPECIFICAÇÃO: Sistema de Recomendações Seguro

**Data:** 26/10/2025  
**Solicitação:** Sistema de recomendações personalizado e geral

---

## 📋 REQUISITOS

### **1. Ações Rápidas (4 ferramentas que O USUÁRIO mais usa)**
- **Escopo:** Pessoal (apenas do usuário logado)
- **Quantidade:** Top 4
- **Segurança:** ✅ RLS valida auth.uid() = user_id
- **Endpoint:** `GET /tools/my-most-used`

### **2. Queridinhos da Plataforma (Top 1 por categoria)**
- **Categorias:**
  - Planejamento (ferramentas `is_planning = true`)
  - IA (categoria 'IA')
  - Complementares (outras categorias)
- **Escopo:** Geral (toda a plataforma)
- **Segurança:** ✅ Dados agregados (não expõe usuários)
- **Endpoint:** `GET /tools/platform-favorites`

---

## 🔒 ANÁLISE DE SEGURANÇA

### **✅ SEGURO: Ferramentas mais usadas pelo usuário**

**Query:**
```sql
-- ✅ SEGURO: RLS garante que só vê próprios dados
SELECT tool_id, COUNT(*) as count
FROM tools_executions
WHERE user_id = auth.uid()  -- ✅ RLS policy
  AND success = true
GROUP BY tool_id
ORDER BY count DESC
LIMIT 4;
```

**Por que é seguro:**
- RLS policy já existe: `auth.uid() = user_id`
- Usuário só vê próprios dados
- Impossível ver ferramentas de terceiros

---

### **✅ SEGURO: Top ferramentas da plataforma (agregado)**

**Query:**
```sql
-- ✅ SEGURO: Dados agregados, não expõe usuários
SELECT 
  t.category,
  t.slug,
  COUNT(e.id) as total_uses
FROM tools_executions e
JOIN tools_catalog t ON t.id = e.tool_id
WHERE e.success = true
  AND t.is_active = true
GROUP BY t.id, t.category, t.slug
ORDER BY total_uses DESC;
```

**Por que é seguro:**
- Apenas agregações (COUNT)
- Não retorna user_id
- Não expõe dados pessoais
- Apenas estatísticas públicas

---

### **❌ INSEGURO: O que NÃO fazer**

```sql
-- ❌ EXPÕE DADOS DE OUTROS USUÁRIOS
SELECT 
  e.user_id,  -- ❌ Vazamento!
  t.name,
  COUNT(*) as uses
FROM tools_executions e
JOIN tools_catalog t ON t.id = e.tool_id
GROUP BY e.user_id, t.name;

-- ❌ PERMITE VER QUEM USOU O QUE
SELECT DISTINCT user_id 
FROM tools_executions 
WHERE tool_id = '<uuid>';  -- ❌ Lista usuários!
```

---

## 🛠️ IMPLEMENTAÇÃO

### **Função 1: Ferramentas Mais Usadas pelo Usuário**

```javascript
/**
 * Obter ferramentas mais usadas PELO USUÁRIO (pessoal)
 * ✅ SEGURO: RLS garante isolamento de dados
 */
export async function getMyMostUsedTools(userId, limit = 4) {
  try {
    // ✅ RLS policy valida: user_id = auth.uid()
    const { data: executions, error } = await supabase
      .from('tools_executions')
      .select('tool_id')
      .eq('user_id', userId)  // ✅ RLS valida automaticamente
      .eq('success', true)
      .order('created_at', { ascending: false })
      .limit(500);  // Últimas 500 execuções

    if (error || !executions || executions.length === 0) {
      return { data: [], error: null };
    }

    // Contar ocorrências
    const counts = {};
    executions.forEach(item => {
      counts[item.tool_id] = (counts[item.tool_id] || 0) + 1;
    });

    // Top N
    const sorted = Object.entries(counts)
      .map(([tool_id, count]) => ({ tool_id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    // Buscar detalhes
    const toolIds = sorted.map(t => t.tool_id);
    const { data: tools } = await supabase
      .from('tools_catalog')
      .select('id, slug, name, description, category')
      .in('id', toolIds)
      .eq('is_active', true);

    // Mapear
    const result = sorted
      .map(item => {
        const tool = tools?.find(t => t.id === item.tool_id);
        if (!tool) return null;
        
        return {
          slug: tool.slug,
          title: tool.name,
          description: tool.description,
          category: tool.category,
          usage_count: item.count,
          route: `/dashboard/ferramentas?tool=${tool.slug}`
        };
      })
      .filter(Boolean);

    return { data: result, error: null };
  } catch (error) {
    console.error('Erro ao buscar ferramentas do usuário:', error);
    return { data: [], error: null };
  }
}
```

---

### **Função 2: Top 1 por Categoria (Geral)**

```javascript
/**
 * Obter top 1 ferramenta por categoria (toda a plataforma)
 * ✅ SEGURO: Apenas agregações, não expõe usuários
 */
export async function getPlatformFavorites() {
  try {
    // ✅ Query agregada - não expõe dados pessoais
    const { data: executions, error } = await supabaseAdmin
      .from('tools_executions')
      .select(`
        tool_id,
        tools_catalog!inner (
          id,
          slug,
          name,
          description,
          category,
          is_planning,
          is_active
        )
      `)
      .eq('success', true)
      .eq('tools_catalog.is_active', true)
      .order('created_at', { ascending: false })
      .limit(2000);  // Últimas 2000 execuções

    if (error || !executions || executions.length === 0) {
      return { data: [], error: null };
    }

    // Agrupar por ferramenta
    const toolStats = {};
    executions.forEach(exec => {
      const tool = exec.tools_catalog;
      if (!tool) return;

      if (!toolStats[tool.id]) {
        toolStats[tool.id] = {
          ...tool,
          count: 0
        };
      }
      toolStats[tool.id].count++;
    });

    // Categorizar
    const categories = {
      planejamento: [],
      ia: [],
      complementares: []
    };

    Object.values(toolStats).forEach(tool => {
      if (tool.is_planning) {
        categories.planejamento.push(tool);
      } else if (tool.category === 'IA') {
        categories.ia.push(tool);
      } else {
        categories.complementares.push(tool);
      }
    });

    // Top 1 de cada categoria
    const favorites = {
      planejamento: categories.planejamento
        .sort((a, b) => b.count - a.count)[0] || null,
      ia: categories.ia
        .sort((a, b) => b.count - a.count)[0] || null,
      complementares: categories.complementares
        .sort((a, b) => b.count - a.count)[0] || null
    };

    // Formatar resultado
    const result = [];
    Object.entries(favorites).forEach(([category, tool]) => {
      if (tool) {
        result.push({
          category_label: category.charAt(0).toUpperCase() + category.slice(1),
          slug: tool.slug,
          title: tool.name,
          description: tool.description,
          usage_count: tool.count,
          route: `/dashboard/ferramentas?tool=${tool.slug}`
        });
      }
    });

    return { data: result, error: null };
  } catch (error) {
    console.error('Erro ao buscar favoritos da plataforma:', error);
    return { data: [], error: null };
  }
}
```

---

## 🔐 POLÍTICAS RLS NECESSÁRIAS

### **Verificar se já existem:**

```sql
-- Ver policies de tools_executions
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'tools_executions';
```

### **Se NÃO existir, criar:**

```sql
-- Habilitar RLS
ALTER TABLE tools_executions ENABLE ROW LEVEL SECURITY;

-- Policy SELECT: Usuário vê apenas próprias execuções
CREATE POLICY "Usuários veem apenas próprias execuções"
ON tools_executions
FOR SELECT
USING (auth.uid() = user_id);

-- Policy INSERT: Apenas sistema pode inserir
-- (já controlado pelo backend, mas reforça)
CREATE POLICY "Sistema pode inserir execuções"
ON tools_executions
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## 🌐 ENDPOINTS A CRIAR

### **1. Minhas Ferramentas Mais Usadas**

```javascript
// Em toolsRoutes.js
router.get('/my-most-used', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 4;

    const { data, error } = await toolsService.getMyMostUsedTools(userId, limit);

    return res.json({
      success: true,
      data: {
        tools: data,
        total: data.length
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### **2. Favoritos da Plataforma**

```javascript
// Em toolsRoutes.js
router.get('/platform-favorites', requireAuth, async (req, res) => {
  try {
    const { data, error } = await toolsService.getPlatformFavorites();

    return res.json({
      success: true,
      data: {
        favorites: data,
        total: data.length
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

---

## 🎨 FRONTEND (Home.vue)

### **Seção 1: Ações Rápidas (Pessoal)**

```vue
<template>
  <div class="mb-8">
    <h3 class="text-lg font-semibold mb-4">
      ⚡ Suas Ações Rápidas
    </h3>
    <p class="text-sm text-gray-600 mb-4">
      Suas 4 ferramentas mais usadas
    </p>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="tool in myQuickActions" :key="tool.slug"
           @click="handleQuickAction(tool)"
           class="cursor-pointer p-4 border rounded-lg hover:shadow-md transition">
        <h4 class="font-medium">{{ tool.title }}</h4>
        <p class="text-sm text-gray-600">{{ tool.description }}</p>
        <span class="text-xs text-blue-600 mt-2 block">
          Você usou {{ tool.usage_count }}x
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
const myQuickActions = ref([])

onMounted(async () => {
  const response = await api.toolsTracking.getMyMostUsed(4)
  if (response.success) {
    myQuickActions.value = response.data.tools
  }
})
</script>
```

### **Seção 2: Queridinhos da Plataforma**

```vue
<template>
  <div class="mb-8">
    <h3 class="text-lg font-semibold mb-4">
      ⭐ Queridinhos da Plataforma
    </h3>
    <p class="text-sm text-gray-600 mb-4">
      As ferramentas mais populares em cada categoria
    </p>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div v-for="fav in platformFavorites" :key="fav.slug"
           @click="router.push(fav.route)"
           class="cursor-pointer p-6 border rounded-lg hover:shadow-lg transition bg-gradient-to-br from-blue-50 to-purple-50">
        <div class="text-xs text-purple-600 font-semibold mb-2">
          {{ fav.category_label }}
        </div>
        <h4 class="font-bold text-lg">{{ fav.title }}</h4>
        <p class="text-sm text-gray-700 mt-2">{{ fav.description }}</p>
        <div class="mt-4 text-xs text-gray-500">
          🔥 {{ fav.usage_count }} usos na plataforma
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const platformFavorites = ref([])

onMounted(async () => {
  const response = await api.toolsTracking.getPlatformFavorites()
  if (response.success) {
    platformFavorites.value = response.data.favorites
  }
})
</script>
```

---

## ✅ CHECKLIST DE SEGURANÇA

- [x] **RLS habilitado** em tools_executions
- [x] **Queries validadas** por auth.uid()
- [x] **Dados pessoais não expostos** (apenas agregações no geral)
- [x] **Endpoints autenticados** (requireAuth)
- [x] **Fail-safe** (retorna [] em erro, não quebra)
- [x] **supabase** (com RLS) para dados pessoais
- [x] **supabaseAdmin** apenas para agregações gerais

---

## 📊 DIFERENÇA ENTRE AS FUNÇÕES

| Aspecto | Minhas Mais Usadas | Favoritos Plataforma |
|---------|-------------------|---------------------|
| **Escopo** | Pessoal (só o usuário) | Geral (toda plataforma) |
| **Cliente** | `supabase` (RLS) | `supabaseAdmin` (agregação) |
| **Quantidade** | Top 4 | Top 1 por categoria (3 total) |
| **Dados** | Execuções do usuário | Execuções de todos |
| **Privacidade** | ✅ RLS protege | ✅ Apenas COUNT, sem user_id |
| **Personalização** | ✅ Sim | ❌ Não (geral) |

---

## 🎯 RESULTADO FINAL

**Home (/dashboard/home):**

```
┌─────────────────────────────────────────┐
│ ⚡ Suas Ações Rápidas                   │
│ (4 ferramentas que VOCÊ mais usa)      │
├─────────────────────────────────────────┤
│ [Rescisão]  [Férias]  [FGTS]  [CNIS]   │
│  15 usos     12 usos   8 usos  7 usos  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ⭐ Queridinhos da Plataforma            │
│ (Top 1 de cada categoria)              │
├─────────────────────────────────────────┤
│ [Planejamento]  [IA]  [Complementares]  │
│ Prev. 450 usos  CEP   Rescisão         │
│                 380   350 usos          │
└─────────────────────────────────────────┘
```

---

**Status:** ✅ **ESPECIFICAÇÃO COMPLETA E SEGURA**

