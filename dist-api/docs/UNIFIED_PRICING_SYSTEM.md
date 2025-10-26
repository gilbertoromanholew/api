# ✅ SISTEMA DE PRECIFICAÇÃO UNIFICADO

**Data:** 26/10/2025  
**Status:** ✅ **IMPLEMENTADO - PRONTO PARA TESTAR**

---

## 🎯 OBJETIVO

Unificar a lógica de precificação para que **TODAS** as ferramentas (planejamento e normais) usem o mesmo sistema de multiplicadores por plano.

---

## ❌ PROBLEMA ANTERIOR

```javascript
// PLANEJAMENTOS: Custos fixos sem multiplicar
GRATUITO: Lite 1, Premium 15  // ❌ Valor fixo
PROFISSIONAL (após 20): Lite 1, Premium 6  // ❌ Valor diferente

// FERRAMENTAS NORMAIS: Multiplicam por plano
GRATUITO: 2 × 2 = 4 créditos  // ✅ Multiplica
PROFISSIONAL: 2 × 1 = 2 créditos  // ✅ Multiplica
```

**Inconsistência:** Planejamentos não seguiam a mesma lógica!

---

## ✅ SOLUÇÃO IMPLEMENTADA

### **Sistema Unificado:**

```javascript
// TODOS multiplicam por plano:
const multipliers = {
  'free': 2,           // Gratuito paga 2x
  'stage': 1.5,        // Estágio paga 1.5x
  'professional': 1    // Profissional paga 1x
};

// PLANEJAMENTOS:
const liteCost = liteBaseCost × multiplier;
const premiumCost = premiumBaseCost × multiplier;

// FERRAMENTAS NORMAIS:
const cost = baseCost × multiplier;
```

---

## 📊 NOVOS VALORES BASE

### **Planejamentos** (`is_planning = true`):

| Modo | Base | Gratuito (×2) | Estágio (×1.5) | PRO (×1)* |
|------|------|---------------|----------------|-----------|
| **Lite** | 5 | 10 | 8 | 5 |
| **Premium** | 15 | 30 | 23 | 15 |

\* Profissional tem **20 usos grátis/mês**, depois paga o valor base (×1)

### **Ferramentas Normais** (`is_planning = false`):

| Complexidade | Exemplos | Base | Gratuito (×2) | Estágio (×1.5) | PRO (×1) |
|--------------|----------|------|---------------|----------------|----------|
| **Simples** | CPF, CNPJ, CEP | 1 | 2 | 2 | 1 |
| **Médias** | Férias, 13º, Rescisão | 2 | 4 | 3 | 2 |
| **Complexas** | Extrator CNIS (PDF) | 3 | 6 | 5 | 3 |

---

## 🔧 ARQUIVOS MODIFICADOS

### **1. Backend: toolsPricingService.js**

**Função `getPlanningToolPricing()`:**

```diff
+ // ✅ CUSTOS BASE (valores padrão no banco)
+ const liteBaseCost = tool.planning_lite_cost_free || 5;
+ const premiumBaseCost = tool.planning_premium_cost_free || 15;

+ // ✅ MULTIPLICADORES POR PLANO
+ const multipliers = { 'free': 2, 'stage': 1.5, 'professional': 1 };
+ const multiplier = multipliers[planType] || 2;

+ // ✅ CALCULAR CUSTOS FINAIS
+ const liteCostFinal = Math.ceil(liteBaseCost × multiplier);
+ const premiumCostFinal = Math.ceil(premiumBaseCost × multiplier);

  return {
    ...
+   baseCosts: { lite: liteBaseCost, premium: premiumBaseCost },
+   multiplier: multiplier,
+   costs: { lite: liteCostFinal, premium: premiumCostFinal },
    nextUseCost: {
-     lite: hasPro && remainingFreeUses > 0 ? 0 : (hasPro ? liteCostPro : liteCostFree),
+     lite: hasPro && remainingFreeUses > 0 ? 0 : liteCostFinal,
-     premium: hasPro && remainingFreeUses > 0 ? 0 : (hasPro ? premiumCostPro : premiumCostFree)
+     premium: hasPro && remainingFreeUses > 0 ? 0 : premiumCostFinal
    }
  };
```

---

### **2. SQL: UPDATE_UNIFIED_PRICING.sql**

```sql
-- Atualizar CUSTOS BASE dos planejamentos
UPDATE tools_catalog
SET 
  planning_lite_cost_free = 5,     -- Base Lite: 5 créditos
  planning_premium_cost_free = 15, -- Base Premium: 15 créditos
  planning_monthly_limit = 20      -- 20 usos grátis/mês para PRO
WHERE is_planning = true;

-- Atualizar ferramentas SIMPLES (1 crédito base)
UPDATE tools_catalog
SET cost_in_points = 1, cost_free_plan = 2, cost_stage_plan = 2, cost_professional_plan = 1
WHERE slug IN ('validador_cpf', 'validador_cnpj', 'ia_cep');

-- Atualizar ferramentas MÉDIAS (2 créditos base)
UPDATE tools_catalog
SET cost_in_points = 2, cost_free_plan = 4, cost_stage_plan = 3, cost_professional_plan = 2
WHERE slug IN ('calc_ferias', 'calc_13_salario', 'calc_rescisao', ...);

-- Atualizar ferramentas COMPLEXAS (3 créditos base)
UPDATE tools_catalog
SET cost_in_points = 3, cost_free_plan = 6, cost_stage_plan = 5, cost_professional_plan = 3
WHERE slug IN ('extrator_cnis');
```

---

## 🧪 EXEMPLOS DE COBRANÇA

### **Exemplo 1: Planejamento Previdenciário**

**Usuário Gratuito:**
- Lite (experimental): 5 × 2 = **10 créditos**
- Premium (completo): 15 × 2 = **30 créditos**

**Usuário Estágio:**
- Lite: 5 × 1.5 = **8 créditos** (arredondado)
- Premium: 15 × 1.5 = **23 créditos** (arredondado)

**Usuário Profissional:**
- **Primeiros 20 usos: GRÁTIS** 🎁
- Após limite:
  - Lite: 5 × 1 = **5 créditos**
  - Premium: 15 × 1 = **15 créditos**

---

### **Exemplo 2: Calculadora de Férias**

**Custo base:** 2 créditos

**Usuário Gratuito:** 2 × 2 = **4 créditos**  
**Usuário Estágio:** 2 × 1.5 = **3 créditos**  
**Usuário Profissional:** 2 × 1 = **2 créditos**

---

### **Exemplo 3: Validador CPF**

**Custo base:** 1 crédito

**Usuário Gratuito:** 1 × 2 = **2 créditos**  
**Usuário Estágio:** 1 × 1.5 = **2 créditos** (arredondado)  
**Usuário Profissional:** 1 × 1 = **1 crédito**

---

## ✅ VANTAGENS

1. **Consistência:** Toda ferramenta segue a mesma lógica
2. **Justo:** Quem paga mais (planos superiores) paga menos por uso
3. **Flexível:** Fácil ajustar multiplicadores ou custos base
4. **Transparente:** Usuário entende a precificação
5. **Escalável:** Novos planos só precisam adicionar multiplicador

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ **Backend atualizado** → toolsPricingService.js
2. ✅ **SQL criado** → UPDATE_UNIFIED_PRICING.sql
3. ⏳ **Executar no Supabase** → Aplicar novos valores
4. ⏳ **Reiniciar backend** → Aplicar código novo
5. ⏳ **Testar** → Validar cálculos

---

## 📋 CHECKLIST DE EXECUÇÃO

- [x] Refatorar `getPlanningToolPricing()`
- [x] Criar SQL com valores base
- [x] Criar SQL de tabela completa
- [ ] **Executar UPDATE_UNIFIED_PRICING.sql**
- [ ] **Reiniciar backend**
- [ ] **Testar planejamento Lite/Premium**
- [ ] **Testar ferramentas normais**
- [ ] **Validar com diferentes planos**

---

**Status:** ✅ **PRONTO PARA EXECUTAR**  
**Próximo:** Execute `UPDATE_UNIFIED_PRICING.sql` no Supabase!

