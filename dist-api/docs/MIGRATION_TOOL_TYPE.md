# 📊 MIGRAÇÃO: Coluna tool_type

**Data:** 26/10/2025  
**Status:** ✅ **PRONTO PARA EXECUTAR**

---

## 🎯 OBJETIVO

Adicionar coluna `tool_type` para categorização explícita de ferramentas, independente do slug ou outras colunas.

---

## ❌ PROBLEMA ANTERIOR

### **Lógica Espalhada e Complexa:**

```javascript
// Backend: getPlatformFavorites()
if (tool.is_planning) {
  categories.planejamento.push(tool);
} else if (tool.category && tool.category.toLowerCase().includes('ia')) {
  categories.ia.push(tool);
} else {
  categories.complementares.push(tool);
}

// Frontend: Ferramentas.vue
const planningTools = computed(() => {
  return tools.value.filter(tool => {
    const slug = tool.id || ''
    return slug.startsWith('planejamento_')  // ❌ Depende do padrão do slug
  })
})

const aiTools = computed(() => {
  return tools.value.filter(tool => {
    const slug = tool.id || ''
    return slug.startsWith('ia_')  // ❌ Depende do padrão do slug
  })
})
```

### **Problemas:**
1. ❌ Tipo da ferramenta definido por **slug** ou **categoria**
2. ❌ Lógica espalhada (backend e frontend diferentes)
3. ❌ Dificulta manutenção e evolução
4. ❌ Impossível ter ferramenta IA que também é planejamento
5. ❌ Queries complexas e lentas

---

## ✅ SOLUÇÃO

### **Nova coluna dedicada:**

```sql
ALTER TABLE tools_catalog
ADD COLUMN tool_type VARCHAR(50) NOT NULL DEFAULT 'complementar';

ALTER TABLE tools_catalog
ADD CONSTRAINT check_tool_type 
CHECK (tool_type IN ('planejamento', 'ia', 'complementar'));
```

### **Código simplificado:**

```javascript
// Backend: getPlatformFavorites()
const type = tool.tool_type || 'complementar';
if (categories[type]) {
  categories[type].push(tool);
}

// Frontend: Ferramentas.vue
const planningTools = computed(() => {
  return tools.value.filter(tool => tool.tool_type === 'planejamento')
})

const aiTools = computed(() => {
  return tools.value.filter(tool => tool.tool_type === 'ia')
})

const complementaryTools = computed(() => {
  return tools.value.filter(tool => tool.tool_type === 'complementar')
})
```

---

## 🔄 MIGRAÇÃO

### **1. Script SQL**

**Arquivo:** `sql-config/ADD_TOOL_TYPE_COLUMN.sql`

```sql
-- Adicionar coluna
ALTER TABLE tools_catalog
ADD COLUMN IF NOT EXISTS tool_type VARCHAR(50);

-- Popular dados baseado em lógica atual
UPDATE tools_catalog
SET tool_type = 'planejamento'
WHERE is_planning = true;

UPDATE tools_catalog
SET tool_type = 'ia'
WHERE is_planning = false
  AND category ILIKE '%IA%';

UPDATE tools_catalog
SET tool_type = 'complementar'
WHERE tool_type IS NULL;

-- Adicionar constraint
ALTER TABLE tools_catalog
ALTER COLUMN tool_type SET NOT NULL;

ALTER TABLE tools_catalog
ADD CONSTRAINT check_tool_type 
CHECK (tool_type IN ('planejamento', 'ia', 'complementar'));

-- Criar índices
CREATE INDEX idx_tools_catalog_tool_type 
ON tools_catalog(tool_type);

CREATE INDEX idx_tools_catalog_type_active 
ON tools_catalog(tool_type, is_active);
```

### **2. Executar no Supabase**

1. Abrir **SQL Editor** no Supabase
2. Copiar conteúdo de `ADD_TOOL_TYPE_COLUMN.sql`
3. Executar
4. Verificar resultado:
   ```sql
   SELECT tool_type, COUNT(*) as total
   FROM tools_catalog
   GROUP BY tool_type;
   ```

---

## 📝 ARQUIVOS MODIFICADOS

### **Backend**

#### **1. src/services/toolsService.js**

**Função:** `getPlatformFavorites()`

```diff
  const { data: executions } = await supabaseAdmin
    .from('tools_executions')
    .select(`
      tool_id,
      tools_catalog!inner (
        id,
        slug,
        name,
        description,
-       category,
-       is_planning,
+       tool_type,
        is_active
      )
    `)

- // Categorizar
- if (tool.is_planning) {
-   categories.planejamento.push(tool);
- } else if (tool.category && tool.category.toLowerCase().includes('ia')) {
-   categories.ia.push(tool);
- } else {
-   categories.complementares.push(tool);
- }

+ // Categorizar usando tool_type (muito mais simples!)
+ const type = tool.tool_type || 'complementar';
+ if (categories[type]) {
+   categories[type].push(tool);
+ }
```

**Função:** `getMyMostUsedTools()`

```diff
  const { data: tools } = await supabase
    .from('tools_catalog')
-   .select('id, slug, name, description, category')
+   .select('id, slug, name, description, tool_type')
    .in('id', toolIds)
```

---

#### **2. src/routes/toolsRoutes.js**

**Endpoint:** `GET /api/tools/list`

```diff
  categories[category].push({
    id: tool.id,
    slug: tool.slug,
    name: tool.name,
    description: tool.description,
    category: category,
+   tool_type: tool.tool_type || 'complementar',
    base_cost: tool.cost_in_points || 0,
    ...
  });
```

---

### **Frontend**

#### **3. tools-website-builder/src/pages/dashboard/Ferramentas.vue**

**Computed: planningTools**

```diff
  const planningTools = computed(() => {
-   return tools.value.filter(tool => {
-     const slug = tool.id || ''
-     return slug.startsWith('planejamento_')
-   })
+   return tools.value.filter(tool => tool.tool_type === 'planejamento')
  })
```

**Computed: aiTools**

```diff
  const aiTools = computed(() => {
-   let result = tools.value.filter(tool => {
-     const slug = tool.id || ''
-     return slug.startsWith('ia_')
-   })
+   let result = tools.value.filter(tool => tool.tool_type === 'ia')
    // ... resto do código (busca e filtros)
  })
```

**Computed: complementaryTools**

```diff
  const complementaryTools = computed(() => {
-   let result = tools.value.filter(tool => {
-     const slug = tool.id || ''
-     return !slug.startsWith('planejamento_') && !slug.startsWith('ia_')
-   })
+   let result = tools.value.filter(tool => tool.tool_type === 'complementar')
    // ... resto do código (busca e filtros)
  })
```

**Função: openTool**

```diff
  const openTool = (tool) => {
    selectedTool.value = tool
    
-   if (tool.id && (
-     tool.id.startsWith('planejamento_') || 
-     tool.slug?.startsWith('planejamento_') ||
-     tool.category === 'Planejamentos'
-   )) {
+   if (tool.tool_type === 'planejamento') {
      showPlanningModal.value = true
    } else {
      showToolModal.value = true
    }
  }
```

---

## 🎯 VANTAGENS

### **1. Código mais limpo**
```javascript
// ❌ ANTES (complexo):
if (tool.id && (
  tool.id.startsWith('planejamento_') || 
  tool.slug?.startsWith('planejamento_') ||
  tool.category === 'Planejamentos'
)) { ... }

// ✅ DEPOIS (simples):
if (tool.tool_type === 'planejamento') { ... }
```

### **2. Queries mais rápidas**
```sql
-- ❌ ANTES (sem índice):
WHERE slug LIKE 'planejamento_%'  -- Full scan

-- ✅ DEPOIS (com índice):
WHERE tool_type = 'planejamento'  -- Index scan
```

### **3. Flexibilidade futura**
```javascript
// ✅ Agora é possível:
{
  slug: 'planejamento_ia_completo',
  tool_type: 'planejamento',  // Tipo principal
  category: 'IA',              // Subcategoria
  is_planning: true            // Flag de precificação
}
```

### **4. Manutenção facilitada**
- ✅ Tipo centralizado em 1 campo
- ✅ Constraint garante valores válidos
- ✅ Código backend e frontend alinhados

---

## 🧪 TESTES

### **1. Verificar distribuição**

```sql
SELECT 
  tool_type,
  COUNT(*) as total,
  COUNT(CASE WHEN is_active = true THEN 1 END) as ativas
FROM tools_catalog
GROUP BY tool_type
ORDER BY tool_type;
```

**Resultado esperado:**
```
tool_type      | total | ativas
---------------|-------|--------
complementar   |   X   |   X
ia             |   X   |   X
planejamento   |   X   |   X
```

### **2. Testar endpoints**

```powershell
# Backend: Listar ferramentas
Invoke-WebRequest -Uri "http://localhost:3000/api/tools/list" `
  -Headers @{"Cookie"="sb-access-token=..."}

# Verificar que response contém tool_type:
# { ..., "tool_type": "planejamento", ... }

# Backend: Favoritos da plataforma
Invoke-WebRequest -Uri "http://localhost:3000/api/tools/platform-favorites" `
  -Headers @{"Cookie"="sb-access-token=..."}

# Verificar categorização:
# [
#   { "category_label": "Planejamento", "tool_type": "planejamento", ... },
#   { "category_label": "Ia", "tool_type": "ia", ... },
#   { "category_label": "Complementar", "tool_type": "complementar", ... }
# ]
```

### **3. Testar frontend**

1. Abrir `/dashboard/ferramentas`
2. Verificar que ferramentas aparecem nas abas corretas:
   - **Planejamentos** → tool_type = 'planejamento'
   - **IA** → tool_type = 'ia'
   - **Complementares** → tool_type = 'complementar'
3. Filtros de categoria devem funcionar normalmente

---

## 🔄 ROLLBACK (se necessário)

```sql
DROP INDEX IF EXISTS idx_tools_catalog_type_active;
DROP INDEX IF EXISTS idx_tools_catalog_tool_type;
ALTER TABLE tools_catalog DROP CONSTRAINT IF EXISTS check_tool_type;
ALTER TABLE tools_catalog DROP COLUMN IF EXISTS tool_type;
```

**Reverter código:**
- Git: `git checkout HEAD~1 -- src/services/toolsService.js src/routes/toolsRoutes.js`
- Frontend: `git checkout HEAD~1 -- tools-website-builder/src/pages/dashboard/Ferramentas.vue`

---

## ✅ CHECKLIST DE EXECUÇÃO

- [x] Script SQL criado (`ADD_TOOL_TYPE_COLUMN.sql`)
- [x] Backend atualizado (toolsService.js, toolsRoutes.js)
- [x] Frontend atualizado (Ferramentas.vue)
- [ ] **SQL executado no Supabase**
- [ ] **Backend reiniciado**
- [ ] **Frontend reiniciado**
- [ ] **Testes executados**
- [ ] **Verificação em produção**

---

## 📊 IMPACTO

### **Tabelas afetadas:**
- ✅ `tools_catalog` (1 coluna adicionada + 2 índices)

### **Código afetado:**
- ✅ Backend: 2 arquivos (toolsService.js, toolsRoutes.js)
- ✅ Frontend: 1 arquivo (Ferramentas.vue)

### **Downtime:**
- ⚠️ **~30 segundos** durante execução do SQL
- ✅ **Zero downtime** se executar fora de horário de pico

### **Compatibilidade:**
- ✅ **Backward compatible** (código antigo continua funcionando)
- ✅ Fallback seguro: `tool_type || 'complementar'`

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ **Criar migration SQL** → FEITO
2. ✅ **Atualizar backend** → FEITO
3. ✅ **Atualizar frontend** → FEITO
4. ⏳ **Executar no Supabase** → AGUARDANDO
5. ⏳ **Reiniciar backend** → AGUARDANDO
6. ⏳ **Testar em dev** → AGUARDANDO
7. ⏳ **Deploy em produção** → AGUARDANDO

---

**Status:** ✅ **IMPLEMENTADO - PRONTO PARA EXECUTAR SQL**  
**Próximo passo:** Execute o SQL no Supabase e reinicie o backend!

