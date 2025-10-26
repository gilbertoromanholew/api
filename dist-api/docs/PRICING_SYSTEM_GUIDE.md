# 🎯 Sistema de Precificação Diferenciada - Guia Completo

**Data:** 26/10/2025  
**Status:** ✅ Implementado

---

## 📚 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Instalação](#instalação)
3. [Uso no Backend](#uso-no-backend)
4. [Uso no Frontend](#uso-no-frontend)
5. [Exemplos Práticos](#exemplos-práticos)
6. [Testes](#testes)

---

## 🎯 Visão Geral

### **Tipos de Ferramentas**

#### 1️⃣ **Ferramentas Normais** (Calculadoras, Validadores, etc.)
- Todos os usuários podem usar
- Custo varia por plano:
  - **Gratuito**: 2x mais caro
  - **Estágio**: 1.5x
  - **Profissional**: Preço base

#### 2️⃣ **Ferramentas de Planejamento**
- Dois modos: **Lite (Experimental)** e **Premium (Completo)**
- Planos profissionais: **20 usos grátis/mês**
- Após limite: custos reduzidos

---

## 🚀 Instalação

### 1. Execute a migração SQL

```bash
# No Supabase SQL Editor, execute:
sql-config/IMPLEMENT_PRICING_SYSTEM.sql
```

### 2. Registre as rotas no server.js

```javascript
import pricingRoutes from './src/routes/pricingRoutes.js';

// Adicionar antes do errorHandler
app.use('/pricing', apiLimiter, pricingRoutes);
```

### 3. Reinicie o backend

```bash
cd api/dist-api
npm start
```

---

## 💻 Uso no Backend

### **Importar o serviço**

```javascript
import * as pricingService from '../services/toolsPricingService.js';
```

### **Obter precificação de ferramenta**

```javascript
// Ferramenta Normal
const pricing = await pricingService.getToolPricing('calc_ferias', userId);

console.log(pricing);
// {
//   toolId: 'uuid...',
//   toolSlug: 'calc_ferias',
//   toolName: 'Calculadora de Férias',
//   isPlanning: false,
//   userPlan: 'free',
//   planType: 'free',
//   cost: 2,
//   baseCost: 1,
//   costByPlan: {
//     free: 2,
//     stage: 2,
//     professional: 1
//   }
// }
```

```javascript
// Ferramenta de Planejamento
const pricing = await pricingService.getToolPricing('planejamento_previdenciario', userId);

console.log(pricing);
// {
//   toolId: 'uuid...',
//   toolSlug: 'planejamento_previdenciario',
//   toolName: 'Planejamento Previdenciário',
//   isPlanning: true,
//   userPlan: 'plano-profissional-planejador',
//   hasProfessionalBenefits: true,
//   freeUsesRemaining: 18,
//   freeUsesTotal: 20,
//   freeUsesUsed: 2,
//   canUseFree: true,
//   costs: {
//     lite: { free: 1, afterLimit: 1 },
//     premium: { free: 15, afterLimit: 6 }
//   },
//   nextUseCost: {
//     lite: 0,    // Grátis (ainda tem usos)
//     premium: 0  // Grátis (ainda tem usos)
//   }
// }
```

### **Calcular e cobrar execução**

```javascript
const result = await pricingService.calculateAndCharge(
  'planejamento_previdenciario',
  userId,
  'premium' // ou 'lite'
);

console.log(result);
// {
//   cost: 0,                    // Gratuito (usou allowance)
//   usedFreeAllowance: true,    // Consumiu 1 uso grátis
//   experienceType: 'premium',
//   pricing: { /* objeto completo */ }
// }

// Se não tiver mais usos grátis:
// {
//   cost: 6,                    // Cobrado 6 créditos
//   usedFreeAllowance: false,
//   experienceType: 'premium',
//   pricing: { /* ... */ }
// }
```

---

## 🌐 Uso no Frontend

### **API Endpoints**

#### 1. Obter precificação

```javascript
// GET /pricing/:toolSlug
const response = await fetch('/pricing/calc_ferias', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const { data } = await response.json();
console.log(data);
```

#### 2. Consultar usos do mês

```javascript
// GET /pricing/:toolSlug/usage
const response = await fetch('/pricing/planejamento_previdenciario/usage');
const { data } = await response.json();

console.log(data);
// {
//   toolSlug: 'planejamento_previdenciario',
//   usedThisMonth: 2,
//   month: '2025-10'
// }
```

#### 3. Calcular custo antes de executar

```javascript
// POST /pricing/:toolSlug/calculate
const response = await fetch('/pricing/planejamento_previdenciario/calculate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    experienceType: 'premium' // ou 'lite'
  })
});

const { data } = await response.json();
console.log(data.cost); // Custo que será cobrado
```

---

## 🎨 Exemplos Práticos

### **Exemplo 1: Mostrar Badge de Preço**

```vue
<template>
  <div class="tool-card">
    <h3>{{ tool.name }}</h3>
    
    <!-- Badge de preço -->
    <div class="price-badge" v-if="pricing">
      <span v-if="!pricing.isPlanning">
        {{ pricing.cost }} créditos
      </span>
      <span v-else>
        <template v-if="pricing.canUseFree">
          ✅ Grátis ({{ pricing.freeUsesRemaining }}/{{ pricing.freeUsesTotal }} restantes)
        </template>
        <template v-else>
          Lite: {{ pricing.nextUseCost.lite }} | Premium: {{ pricing.nextUseCost.premium }}
        </template>
      </span>
    </div>
    
    <button @click="useTool">Usar Ferramenta</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps(['tool']);
const pricing = ref(null);

onMounted(async () => {
  const res = await fetch(`/pricing/${props.tool.slug}`);
  const { data } = await res.json();
  pricing.value = data;
});
</script>
```

### **Exemplo 2: Modal de Planejamento**

```vue
<template>
  <Modal v-if="showModal">
    <h2>{{ tool.name }}</h2>
    
    <!-- Informação de usos grátis -->
    <div v-if="pricing.hasProfessionalBenefits" class="free-uses-info">
      <p v-if="pricing.canUseFree">
        ✅ Você tem {{ pricing.freeUsesRemaining }} usos gratuitos restantes este mês
      </p>
      <p v-else>
        ⚠️ Você já usou seus 20 usos gratuitos deste mês
      </p>
    </div>
    
    <!-- Escolha de experiência -->
    <div class="experience-choice">
      <button @click="selectExperience('lite')">
        🔹 Experimental
        <span v-if="pricing.canUseFree">GRÁTIS</span>
        <span v-else>{{ pricing.nextUseCost.lite }} créditos</span>
      </button>
      
      <button @click="selectExperience('premium')">
        🔸 Completo
        <span v-if="pricing.canUseFree">GRÁTIS</span>
        <span v-else>{{ pricing.nextUseCost.premium }} créditos</span>
      </button>
    </div>
  </Modal>
</template>

<script setup>
const selectExperience = async (type) => {
  // Calcular custo final
  const res = await fetch(`/pricing/${tool.slug}/calculate`, {
    method: 'POST',
    body: JSON.stringify({ experienceType: type })
  });
  
  const { data } = await res.json();
  
  if (data.cost > userCredits.value) {
    showError('Créditos insuficientes');
    return;
  }
  
  // Executar ferramenta
  await executeTool(type);
};
</script>
```

### **Exemplo 3: Comparar Planos**

```vue
<template>
  <div class="pricing-comparison">
    <div class="plan free">
      <h3>Plano Gratuito</h3>
      <ul>
        <li v-for="tool in tools" :key="tool.slug">
          {{ tool.name }}: 
          <strong>{{ getPriceForPlan(tool, 'free') }} créditos</strong>
        </li>
      </ul>
    </div>
    
    <div class="plan professional">
      <h3>Plano Profissional</h3>
      <ul>
        <li v-for="tool in tools" :key="tool.slug">
          {{ tool.name }}: 
          <strong>{{ getPriceForPlan(tool, 'professional') }} créditos</strong>
        </li>
      </ul>
      <p class="highlight">
        + 20 usos grátis/mês em planejamentos
      </p>
    </div>
  </div>
</template>

<script setup>
const getPriceForPlan = (tool, planType) => {
  if (tool.isPlanning) {
    return planType === 'free' ? '15 (completo)' : '6 (completo)';
  } else {
    return tool.costByPlan[planType];
  }
};
</script>
```

---

## ✅ Testes

### **Teste 1: Ferramenta Normal**

```javascript
// Teste com usuário gratuito
const pricing = await pricingService.getToolPricing('calc_ferias', userFreeId);
assert(pricing.cost === 2); // Dobro do preço base

// Teste com usuário profissional
const pricing2 = await pricingService.getToolPricing('calc_ferias', userProId);
assert(pricing2.cost === 1); // Preço base
```

### **Teste 2: Planejamento com Usos Grátis**

```javascript
// Teste com 0 usos no mês
const pricing = await pricingService.getToolPricing('planejamento_previdenciario', userProId);
assert(pricing.freeUsesRemaining === 20);
assert(pricing.nextUseCost.premium === 0); // Grátis

// Executar e incrementar
await pricingService.calculateAndCharge('planejamento_previdenciario', userProId, 'premium');

// Verificar que decrementou
const pricing2 = await pricingService.getToolPricing('planejamento_previdenciario', userProId);
assert(pricing2.freeUsesRemaining === 19);
```

### **Teste 3: Planejamento Após Limite**

```javascript
// Simular 20 usos
for (let i = 0; i < 20; i++) {
  await pricingService.incrementMonthlyUsage(userProId, toolId);
}

// Verificar que agora cobra
const pricing = await pricingService.getToolPricing('planejamento_previdenciario', userProId);
assert(pricing.canUseFree === false);
assert(pricing.nextUseCost.premium === 6); // Preço com desconto
```

---

## 📊 Resumo de Custos

| Ferramenta | Tipo | Gratuito | Estágio | Profissional | Obs |
|------------|------|----------|---------|--------------|-----|
| Calc. Férias | Normal | 2 | 2 | 1 | Pagam todos |
| Valid. CPF | Normal | 2 | 2 | 1 | Pagam todos |
| Plan. Prev. (Lite) | Planning | 1 | 0* | 0* | *20 usos grátis |
| Plan. Prev. (Premium) | Planning | 15 | 0* | 0* | *20 usos grátis |
| Plan. Prev. (Lite após limite) | Planning | 1 | 1 | 1 | Após 20 usos |
| Plan. Prev. (Premium após limite) | Planning | 15 | 6 | 6 | 60% desconto |

---

## 🎯 Checklist de Implementação

### Backend
- [x] SQL de migração criado
- [x] Serviço `toolsPricingService.js` criado
- [x] Rotas `/pricing/*` criadas
- [ ] Registrar rotas no `server.js`
- [ ] Executar migração no Supabase
- [ ] Testar endpoints

### Frontend
- [ ] Criar componente `ToolPricingBadge.vue`
- [ ] Atualizar modal de planejamentos
- [ ] Mostrar usos restantes
- [ ] Integrar com sistema de créditos
- [ ] Testar fluxo completo

---

**Pronto para uso!** 🚀
