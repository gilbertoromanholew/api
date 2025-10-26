# 🔍 AUDITORIA COMPLETA: Sistema de Pontos e Ferramentas

**Data:** 26/10/2025  
**Objetivo:** Implementar sistema complexo de acesso a ferramentas com diferentes regras por plano

---

## 📋 REQUISITOS DO SISTEMA

### 1️⃣ **Ferramentas Normais** (Calculadoras, Validadores, etc.)

| Usuário | Acesso | Custo em Pontos |
|---------|--------|-----------------|
| **Gratuito** | ✅ Sim | Mais caro |
| **Estágio Diário** | ✅ Sim | Médio |
| **Estágio Semanal** | ✅ Sim | Médio |
| **Profissional Mensal** | ✅ Sim | Mais barato |

**Regra:** Todos pagam pontos, mas o valor varia por plano.

---

### 2️⃣ **Ferramentas de Planejamento** (Diferenciadas)

#### **Dois Modos de Uso:**
- 🔹 **Limitado/Experimental** → Mais barato
- 🔸 **Completo/Ilimitado** → Mais caro

#### **Para Plano GRATUITO:**
```
┌─────────────────────────────────────┐
│ Planejamento Previdenciário         │
├─────────────────────────────────────┤
│ 🔹 Experimental: 1 crédito          │
│ 🔸 Completo: 15 créditos            │
│                                     │
│ ⚠️ Sem usos gratuitos               │
└─────────────────────────────────────┘
```

#### **Para Planos PROFISSIONAIS:**
```
┌─────────────────────────────────────┐
│ Planejamento Previdenciário         │
├─────────────────────────────────────┤
│ ✅ Usos gratuitos: 18/20 restantes  │
│                                     │
│ Depois dos 20 usos:                 │
│ 🔹 Experimental: 1 crédito          │
│ 🔸 Completo: 6 créditos (desconto!) │
└─────────────────────────────────────┘
```

---

## 🗄️ ESTRUTURA DO BANCO DE DADOS NECESSÁRIA

### **Tabelas Atuais (preciso confirmar):**
1. `tools_catalog` → Catálogo de ferramentas
2. `economy_subscription_plans` → Planos disponíveis
3. `economy_subscriptions` → Assinaturas ativas dos usuários
4. `economy_user_wallets` → Carteira de pontos do usuário
5. `economy_transactions` → Histórico de transações
6. `tools_executions` → Histórico de uso de ferramentas

### **Novas Tabelas/Colunas Necessárias:**

#### **A. `tools_catalog` - Precisa ter:**
```sql
-- Colunas para ferramentas NORMAIS
cost_free_plan INTEGER           -- Custo para plano gratuito
cost_stage_plan INTEGER          -- Custo para planos de estágio
cost_professional_plan INTEGER   -- Custo para plano profissional

-- Colunas para ferramentas de PLANEJAMENTO
is_planning BOOLEAN              -- ✅ JÁ EXISTE
planning_experimental_cost INTEGER -- Custo modo experimental (gratuito)
planning_full_cost INTEGER         -- Custo modo completo (gratuito)
planning_monthly_limit INTEGER     -- ✅ JÁ EXISTE (20 usos/mês)
planning_pro_experimental_cost INTEGER -- Custo experimental após limite
planning_pro_full_cost INTEGER        -- Custo completo após limite
```

#### **B. `tools_usage_monthly` - Nova tabela de controle mensal:**
```sql
CREATE TABLE tools_usage_monthly (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  tool_id UUID REFERENCES tools_catalog(id),
  month DATE NOT NULL, -- Primeiro dia do mês (2025-10-01)
  uses_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, tool_id, month)
);
```

---

## 🎯 LÓGICA DE NEGÓCIO DETALHADA

### **Fluxo 1: Ferramentas Normais**

```javascript
function getToolCost(tool, userPlan) {
  // Não é planejamento, cobrar direto
  if (!tool.is_planning) {
    switch(userPlan) {
      case 'free':
        return tool.cost_free_plan || tool.cost_in_points * 2; // Dobro
      case 'estagio-profissional-diario':
      case 'estagio-profissional-semanal':
        return tool.cost_stage_plan || tool.cost_in_points * 1.5; // 50% a mais
      case 'plano-profissional-planejador':
        return tool.cost_professional_plan || tool.cost_in_points; // Preço base
      default:
        return tool.cost_in_points;
    }
  }
}
```

### **Fluxo 2: Ferramentas de Planejamento**

```javascript
async function getPlanningToolInfo(tool, userId, userPlan, experienceType) {
  // 1. Verificar usos no mês atual
  const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
  const usage = await getMonthlyUsage(userId, tool.id, currentMonth);
  
  // 2. Verificar se tem plano profissional
  const hasProfessionalPlan = ['estagio-profissional-diario', 
                                'estagio-profissional-semanal',
                                'plano-profissional-planejador'].includes(userPlan);
  
  // 3. Calcular informações
  if (hasProfessionalPlan) {
    const limit = tool.planning_monthly_limit || 20;
    const remaining = Math.max(0, limit - usage.uses_count);
    
    if (remaining > 0) {
      // Ainda tem usos grátis
      return {
        hasFreeUses: true,
        freeUsesRemaining: remaining,
        freeUsesTotal: limit,
        costAfterLimit: {
          experimental: tool.planning_pro_experimental_cost || 1,
          full: tool.planning_pro_full_cost || 6
        }
      };
    } else {
      // Acabaram os usos grátis, cobrar com desconto
      return {
        hasFreeUses: false,
        cost: experienceType === 'experimental' 
          ? tool.planning_pro_experimental_cost 
          : tool.planning_pro_full_cost
      };
    }
  } else {
    // Plano gratuito, sempre cobra
    return {
      hasFreeUses: false,
      cost: experienceType === 'experimental'
        ? tool.planning_experimental_cost || 1
        : tool.planning_full_cost || 15
    };
  }
}
```

---

## 📊 EXEMPLO DE DADOS

### **tools_catalog:**
```sql
-- Ferramenta Normal
INSERT INTO tools_catalog VALUES (
  uuid_generate_v4(),
  'Calculadora de Férias',
  'calc_ferias',
  'Trabalhista',
  1,  -- cost_in_points (base)
  2,  -- cost_free_plan (gratuito paga dobro)
  1,  -- cost_stage_plan (estágio paga normal)
  1,  -- cost_professional_plan (profissional paga normal)
  false, -- não é planejamento
  ...
);

-- Ferramenta de Planejamento
INSERT INTO tools_catalog VALUES (
  uuid_generate_v4(),
  'Planejamento Previdenciário',
  'planejamento_previdenciario',
  'Planejamento',
  3,   -- cost_in_points (não usado para planejamento)
  true, -- is_planning
  1,   -- planning_experimental_cost (gratuito experimental)
  15,  -- planning_full_cost (gratuito completo)
  20,  -- planning_monthly_limit (20 usos grátis para pro)
  1,   -- planning_pro_experimental_cost (pro após limite)
  6,   -- planning_pro_full_cost (pro após limite)
  ...
);
```

---

## ✅ PRÓXIMOS PASSOS

### **Fase 1: Estrutura do Banco**
- [ ] Confirmar estrutura atual de `tools_catalog`
- [ ] Adicionar colunas de custo diferenciado
- [ ] Criar tabela `tools_usage_monthly`
- [ ] Criar índices de performance

### **Fase 2: Backend**
- [ ] Criar serviço `toolsPricingService.js`
- [ ] Atualizar `toolsService.js` com lógica de custos
- [ ] Criar endpoint `/tools/:slug/pricing` (retorna custo para usuário)
- [ ] Criar endpoint `/tools/:slug/usage` (retorna usos no mês)
- [ ] Atualizar endpoint de execução de ferramenta

### **Fase 3: Frontend**
- [ ] Criar componente `ToolPricingBadge.vue`
- [ ] Atualizar modal de planejamentos
- [ ] Mostrar usos restantes para planos
- [ ] Mostrar custos diferenciados

### **Fase 4: Testes**
- [ ] Testar com usuário gratuito
- [ ] Testar com cada plano profissional
- [ ] Testar limite mensal
- [ ] Testar reset mensal

---

## 🚨 PRECISO DAS SEGUINTES INFORMAÇÕES

Para continuar, me envie:

1. **Schema completo de `tools_catalog`:**
   ```sql
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_name = 'tools_catalog'
   ORDER BY ordinal_position;
   ```

2. **Schema de `economy_subscription_plans`:**
   ```sql
   SELECT * FROM information_schema.columns
   WHERE table_name = 'economy_subscription_plans';
   ```

3. **Schema de `economy_subscriptions`:**
   ```sql
   SELECT * FROM information_schema.columns
   WHERE table_name = 'economy_subscriptions';
   ```

4. **Schema de `tools_executions`:**
   ```sql
   SELECT * FROM information_schema.columns
   WHERE table_name = 'tools_executions';
   ```

---

## 💡 SUGESTÕES DE MELHORIA

1. **Simplificar nomes de colunas:**
   - `planning_experimental_cost` → `planning_lite_cost`
   - `planning_full_cost` → `planning_premium_cost`

2. **Adicionar coluna de desconto percentual:**
   ```sql
   pro_discount_percentage INTEGER DEFAULT 60 -- 60% desconto para pro
   ```

3. **Histórico de preços:**
   - Criar tabela `tools_pricing_history` para auditoria

Aguardo as informações para continuar! 🚀
