# 🔄 GUIA: Como Mudar Categorias Facilmente

## 🎯 Objetivo

Sistema **100% flexível** para mudar, adicionar ou remover categorias sem quebrar nada.

---

## 📊 Como Funciona Atualmente

### Categorias são **dinâmicas** e vêm do banco:

```sql
SELECT DISTINCT category FROM tool_costs WHERE is_active = true;
```

**Resultado atual:**
- Planejamento
- Trabalhista
- Previdenciário
- Cálculos
- Validações

### Endpoint `/api/tools/list` agrupa automaticamente:

```javascript
// src/functions/tools/toolsController.js (linha 14)
const categories = {};
data.forEach(tool => {
  const category = tool.category || 'Outros';
  if (!categories[category]) {
    categories[category] = [];
  }
  categories[category].push(tool);
});
```

**✅ Qualquer mudança no banco reflete automaticamente na API!**

---

## 🔧 Operações Comuns

### 1. **Renomear Categoria**

```sql
-- De "Trabalhista" para "Direito do Trabalho"
UPDATE tool_costs 
SET category = 'Direito do Trabalho'
WHERE category = 'Trabalhista';
```

**Efeito:** Todas as ferramentas da categoria antiga passam para a nova  
**API:** Atualiza automaticamente no próximo request  
**Frontend:** Sem mudanças necessárias

---

### 2. **Mover Ferramenta para Outra Categoria**

```sql
-- Mover "Calculadora de Rescisão" para "Premium"
UPDATE tool_costs 
SET category = 'Premium'
WHERE tool_name = 'calc_rescisao';
```

---

### 3. **Criar Nova Categoria**

```sql
-- Adicionar ferramenta em nova categoria "Internacional"
INSERT INTO tool_costs (
  tool_name,
  display_name,
  description,
  points_cost,
  category,  -- Nova categoria aqui!
  icon
) VALUES (
  'calc_internacional',
  'Cálculo Internacional',
  'Converte salários entre países',
  2,
  'Internacional',
  '🌍'
);
```

**✅ Categoria "Internacional" aparece automaticamente na API!**

---

### 4. **Remover Categoria (desativando ferramentas)**

```sql
-- Desativar todas as ferramentas de uma categoria
UPDATE tool_costs 
SET is_active = false
WHERE category = 'Validações';
```

**Efeito:** Ferramentas somem da listagem mas continuam no banco

---

### 5. **Reordenar Categorias**

A API não ordena categorias por padrão. Para ordenar:

**Opção A: Prefixo numérico**
```sql
UPDATE tool_costs SET category = '1 - Planejamento' WHERE category = 'Planejamento';
UPDATE tool_costs SET category = '2 - Trabalhista' WHERE category = 'Trabalhista';
UPDATE tool_costs SET category = '3 - Cálculos' WHERE category = 'Cálculos';
```

**Opção B: Adicionar coluna de ordenação**
```sql
ALTER TABLE tool_costs ADD COLUMN category_order INTEGER DEFAULT 999;

UPDATE tool_costs SET category_order = 1 WHERE category = 'Planejamento';
UPDATE tool_costs SET category_order = 2 WHERE category = 'Trabalhista';
-- etc

-- Depois no controller:
ORDER BY category_order, tool_name
```

---

## 🎨 Integração com Frontend

### 1. **Sem Configuração Fixa** (Recomendado ✅)

Frontend busca categorias da API dinamicamente:

```javascript
// tools-website-builder/src/pages/dashboard/Ferramentas.vue
const { data } = await api.get('/tools/list')

// data.categories já vem agrupado:
// {
//   "Planejamento": [...],
//   "Trabalhista": [...],
//   ...
// }

const categoryNames = Object.keys(data.categories)
// ['Planejamento', 'Trabalhista', 'Previdenciário', ...]
```

**Vantagem:** Mudou no banco, muda no frontend automaticamente!

---

### 2. **Com Metadados (Opcional)**

Se quiser ícones e cores personalizadas por categoria:

**Backend - Adicionar tabela auxiliar:**

```sql
CREATE TABLE category_metadata (
  category_name TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  order_index INTEGER DEFAULT 999
);

INSERT INTO category_metadata VALUES
  ('Planejamento', 'Planejamento Jurídico', '🎯', '#8B5CF6', 1),
  ('Trabalhista', 'Ferramentas Trabalhistas', '⚖️', '#3B82F6', 2),
  ('Previdenciário', 'Previdência Social', '🏛️', '#10B981', 3);
```

**Endpoint modificado:**

```javascript
// toolsController.js
export async function listTools(req, res) {
  // Buscar ferramentas
  const { data: tools } = await supabase
    .from('tool_costs')
    .select('*')
    .eq('is_active', true)

  // Buscar metadados
  const { data: metadata } = await supabase
    .from('category_metadata')
    .select('*')
    .order('order_index')

  // Agrupar
  const categories = {}
  tools.forEach(tool => {
    const cat = tool.category
    if (!categories[cat]) {
      categories[cat] = {
        tools: [],
        metadata: metadata.find(m => m.category_name === cat) || {}
      }
    }
    categories[cat].tools.push(tool)
  })

  return res.json({ success: true, data: { categories } })
}
```

**Frontend usa metadados:**

```vue
<div 
  v-for="(catData, catName) in categories" 
  :key="catName"
  :style="{ borderColor: catData.metadata.color }"
>
  <h2>
    {{ catData.metadata.icon }} {{ catData.metadata.display_name }}
  </h2>
  <div v-for="tool in catData.tools" :key="tool.tool_name">
    {{ tool.display_name }}
  </div>
</div>
```

---

## 🔄 Cenários Práticos

### Cenário 1: Divórcio Amigável 😊
**Quero:** Separar "Trabalhista" em duas categorias

```sql
-- Criar subcategorias
UPDATE tool_costs 
SET category = 'Trabalhista - Cálculos'
WHERE tool_name IN ('calc_rescisao', 'calc_ferias', 'calc_13_salario');

UPDATE tool_costs 
SET category = 'Trabalhista - Planejamento'
WHERE tool_name = 'planejamento_trabalhista';
```

**✅ API mostra 2 categorias separadas automaticamente**

---

### Cenário 2: Rebranding 🎨
**Quero:** Mudar todos os nomes em português

```sql
UPDATE tool_costs SET category = 'Planejamento Jurídico' WHERE category = 'Planejamento';
UPDATE tool_costs SET category = 'Direito do Trabalho' WHERE category = 'Trabalhista';
UPDATE tool_costs SET category = 'Direito Previdenciário' WHERE category = 'Previdenciário';
UPDATE tool_costs SET category = 'Financeiro' WHERE category = 'Cálculos';
UPDATE tool_costs SET category = 'Verificadores' WHERE category = 'Validações';
```

**✅ Tudo atualizado em 5 comandos**

---

### Cenário 3: Versão Premium 💎
**Quero:** Criar categoria especial "Premium" com ferramentas de 5 pontos

```sql
-- Mover ferramentas de planejamento para Premium
UPDATE tool_costs 
SET 
  category = 'Premium',
  points_cost = 5
WHERE category = 'Planejamento';
```

**✅ Nova categoria "Premium" aparece na API**

---

### Cenário 4: A/B Testing 🧪
**Quero:** Testar categorias diferentes sem mudar produção

```sql
-- Criar tabela de teste
CREATE TABLE tool_costs_test AS SELECT * FROM tool_costs;

-- Fazer mudanças na teste
UPDATE tool_costs_test SET category = 'Novo Nome' WHERE ...;

-- No código, alternar entre tabelas:
const table = process.env.TEST_MODE === 'true' ? 'tool_costs_test' : 'tool_costs'
const { data } = await supabase.from(table).select('*')
```

---

## 📊 Consultas Úteis

### Ver todas as categorias atuais:
```sql
SELECT 
  category,
  COUNT(*) as total_ferramentas,
  SUM(points_cost) as pontos_totais
FROM tool_costs
WHERE is_active = true
GROUP BY category
ORDER BY category;
```

### Ver ferramentas por categoria:
```sql
SELECT 
  category,
  tool_name,
  display_name,
  points_cost
FROM tool_costs
WHERE is_active = true
ORDER BY category, tool_name;
```

### Encontrar ferramentas sem categoria:
```sql
SELECT * FROM tool_costs WHERE category IS NULL OR category = '';
```

---

## 🚨 Cuidados Importantes

### ❌ **NÃO FAÇA:**

```sql
-- ERRADO: Deletar ferramentas
DELETE FROM tool_costs WHERE category = 'Antiga';
```

**Problema:** Perde histórico de transações!

### ✅ **FAÇA:**

```sql
-- CERTO: Desativar ferramentas
UPDATE tool_costs 
SET is_active = false
WHERE category = 'Antiga';
```

---

### ❌ **NÃO FAÇA:**

```sql
-- ERRADO: Mudar tool_name (é a chave!)
UPDATE tool_costs 
SET tool_name = 'novo_nome'
WHERE tool_name = 'nome_antigo';
```

**Problema:** Quebra referências em `point_transactions`!

### ✅ **FAÇA:**

```sql
-- CERTO: Mudar display_name (visível ao usuário)
UPDATE tool_costs 
SET display_name = 'Novo Nome Bonito'
WHERE tool_name = 'nome_tecnico_fixo';
```

---

## 🎯 Resumo

| O que mudar | Como | Impacto |
|-------------|------|---------|
| Nome da categoria | `UPDATE category` | Automático na API |
| Ordem das categorias | Adicionar coluna `order` | Modificar controller |
| Ícone/cor | Tabela `category_metadata` | Modificar frontend |
| Mover ferramenta | `UPDATE category` WHERE `tool_name` | Automático |
| Criar categoria | INSERT com nova `category` | Automático |
| Remover categoria | `UPDATE is_active = false` | Automático |

---

## 📝 Checklist de Mudança

- [ ] 1. Fazer backup do banco
- [ ] 2. Executar UPDATE/INSERT no Supabase
- [ ] 3. Testar endpoint `/api/tools/list`
- [ ] 4. Verificar frontend (cache?)
- [ ] 5. Testar execução de ferramenta
- [ ] 6. Verificar histórico de uso
- [ ] 7. Documentar mudança

---

## 🔗 Arquivos Relacionados

- `database/seed_tools.sql` - Ferramentas iniciais
- `src/functions/tools/toolsController.js` - Agrupamento por categoria
- `tools-website-builder/src/utils/constants.js` - Constantes do frontend (opcional)

---

**Conclusão:** Sistema **100% flexível** - mude categorias sem medo! 🚀

**Status:** ✅ Guia Completo  
**Última revisão:** 18/10/2025
