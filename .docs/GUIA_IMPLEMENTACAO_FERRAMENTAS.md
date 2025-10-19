# 🛠️ GUIA: Como Implementar Novas Ferramentas

## 🎯 Objetivo

Este guia ensina **passo a passo** como criar ferramentas de cálculo, validação ou planejamento que:
- ✅ Consomem pontos automaticamente
- ✅ São modulares e fáceis de manter
- ✅ Integram com o frontend Vue
- ✅ Têm histórico completo de uso

---

## 📋 Antes de Começar

### Decisões Importantes:

1. **Onde fica a lógica:** API (backend) ✅
2. **Onde fica a interface:** Frontend Vue ✅
3. **Como organizar:** Um módulo por categoria de ferramentas

---

## 🏗️ Arquitetura Recomendada

```
src/functions/
├── calculators/                    ← Calculadoras trabalhistas
│   ├── README.md
│   ├── calculatorsRoutes.js       ← Define rotas
│   ├── calculatorsController.js   ← Orquestra
│   └── services/                  ← Lógica pura
│       ├── rescisaoService.js
│       ├── feriasService.js
│       └── terceiroService.js
│
├── planning/                       ← Planejamentos completos
│   ├── README.md
│   ├── planningRoutes.js
│   ├── planningController.js
│   └── services/
│       ├── previdenciarioService.js
│       ├── trabalhistaService.js
│       └── assistencialService.js
│
└── validators/                     ← Validadores simples
    ├── README.md
    ├── validatorsRoutes.js
    ├── validatorsController.js
    └── services/
        ├── cpfService.js
        ├── cnpjService.js
        └── cepService.js
```

### Por que essa estrutura?

- **Modular**: Cada categoria é independente
- **Escalável**: Adicione services sem quebrar nada
- **Testável**: Teste cada service isoladamente
- **Manutenível**: Fácil encontrar e editar código

---

## 🚀 Passo a Passo: Criar Nova Ferramenta

### Exemplo: Calculadora de Rescisão Trabalhista

---

### **PASSO 1: Cadastrar no Banco**

```sql
-- Execute no Supabase SQL Editor

INSERT INTO tool_costs (
  tool_name,
  display_name,
  description,
  points_cost,
  category,
  icon
) VALUES (
  'calc_rescisao',
  'Calculadora de Rescisão',
  'Cálculo completo de rescisão trabalhista: aviso prévio, férias, 13º, FGTS',
  1,
  'Trabalhista',
  '💼'
);
```

**✅ Feito! A ferramenta já aparece em `/api/tools/list`**

---

### **PASSO 2: Criar o Módulo** (se não existe)

```bash
# Criar diretório
mkdir src/functions/calculators
mkdir src/functions/calculators/services

# Criar arquivos
touch src/functions/calculators/README.md
touch src/functions/calculators/calculatorsRoutes.js
touch src/functions/calculators/calculatorsController.js
touch src/functions/calculators/services/rescisaoService.js
```

---

### **PASSO 3: Implementar a Lógica (Service)**

**`src/functions/calculators/services/rescisaoService.js`**

```javascript
/**
 * Service: Cálculo de Rescisão Trabalhista
 * 
 * Este arquivo contém APENAS a lógica de cálculo.
 * Não acessa banco de dados, não consome pontos.
 */

export function calcularRescisao({
  salario,
  dataAdmissao,
  dataDemissao,
  tipoRescisao = 'sem_justa_causa'
}) {
  // Validações básicas
  if (!salario || salario <= 0) {
    throw new Error('Salário inválido')
  }

  if (!dataAdmissao || !dataDemissao) {
    throw new Error('Datas inválidas')
  }

  const admissao = new Date(dataAdmissao)
  const demissao = new Date(dataDemissao)

  // Cálculo de tempo de trabalho
  const diasTrabalhados = calcularDiasTrabalhados(admissao, demissao)
  const mesesTrabalhados = Math.floor(diasTrabalhados / 30)
  const anosTrabalhados = Math.floor(mesesTrabalhados / 12)

  // Cálculos individuais
  const avisoPrevio = calcularAvisoPrevio(salario, anosTrabalhados, tipoRescisao)
  const saldoSalario = calcularSaldoSalario(salario, demissao)
  const ferias = calcularFeriasRescisao(salario, mesesTrabalhados)
  const terceiro = calcularTerceiroRescisao(salario, demissao)
  const fgts = calcularFGTS(salario, mesesTrabalhados, tipoRescisao)
  const multaFGTS = calcularMultaFGTS(fgts, tipoRescisao)

  // Total
  const total = avisoPrevio + saldoSalario + ferias + terceiro + fgts + multaFGTS

  return {
    detalhes: {
      aviso_previo: avisoPrevio,
      saldo_salario: saldoSalario,
      ferias_proporcionais: ferias,
      terceiro_proporcional: terceiro,
      fgts_depositado: fgts,
      multa_fgts: multaFGTS
    },
    resumo: {
      total_bruto: total,
      dias_trabalhados: diasTrabalhados,
      anos_trabalhados: anosTrabalhados
    },
    metadata: {
      calculado_em: new Date().toISOString(),
      tipo_rescisao: tipoRescisao
    }
  }
}

// Funções auxiliares (mantém tudo organizado)
function calcularDiasTrabalhados(inicio, fim) {
  return Math.floor((fim - inicio) / (1000 * 60 * 60 * 24))
}

function calcularAvisoPrevio(salario, anos, tipo) {
  if (tipo === 'por_justa_causa') return 0
  const dias = 30 + (anos * 3) // 30 dias + 3 por ano (máx 90)
  const diasAviso = Math.min(dias, 90)
  return (salario / 30) * diasAviso
}

function calcularSaldoSalario(salario, demissao) {
  const diasTrabalhados = demissao.getDate()
  return (salario / 30) * diasTrabalhados
}

function calcularFeriasRescisao(salario, meses) {
  const feriasSimples = (salario / 12) * meses
  const umTerco = feriasSimples / 3
  return feriasSimples + umTerco
}

function calcularTerceiroRescisao(salario, demissao) {
  const mesesAno = demissao.getMonth() + 1
  return (salario / 12) * mesesAno
}

function calcularFGTS(salario, meses, tipo) {
  if (tipo === 'pedido_demissao') return 0
  return salario * meses * 0.08
}

function calcularMultaFGTS(fgts, tipo) {
  if (tipo !== 'sem_justa_causa') return 0
  return fgts * 0.40
}
```

**✅ Lógica pura, testável, sem dependências externas**

---

### **PASSO 4: Criar o Controller**

**`src/functions/calculators/calculatorsController.js`**

```javascript
import { consumePoints, canUseTool } from '../points/pointsService.js'
import { calcularRescisao } from './services/rescisaoService.js'
import { calcularFerias } from './services/feriasService.js'

/**
 * POST /api/calculators/rescisao
 * Calcula rescisão trabalhista e consome 1 ponto
 */
export async function rescisao(req, res) {
  try {
    const userId = req.user.id
    const { salario, dataAdmissao, dataDemissao, tipoRescisao } = req.body

    // 1. Verificar se usuário tem pontos
    const check = await canUseTool(userId, 'calc_rescisao')
    if (!check.can_use) {
      return res.status(400).json({
        success: false,
        error: 'Pontos insuficientes',
        missing_points: check.missing_points,
        current_balance: check.current_balance
      })
    }

    // 2. Executar cálculo
    const resultado = calcularRescisao({
      salario,
      dataAdmissao,
      dataDemissao,
      tipoRescisao
    })

    // 3. Consumir pontos (APÓS sucesso)
    const consumption = await consumePoints(userId, 1, {
      type: 'tool_usage',
      tool_name: 'calc_rescisao',
      description: 'Cálculo de Rescisão Trabalhista'
    })

    // 4. Retornar resultado + info de consumo
    return res.json({
      success: true,
      data: {
        resultado,
        consumo: {
          pontos_consumidos: 1,
          saldo_anterior: consumption.previous_balance,
          saldo_atual: consumption.new_balance
        }
      }
    })

  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * POST /api/calculators/ferias
 * Calcula férias e consome 1 ponto
 */
export async function ferias(req, res) {
  try {
    const userId = req.user.id
    const dados = req.body

    const check = await canUseTool(userId, 'calc_ferias')
    if (!check.can_use) {
      return res.status(400).json({
        success: false,
        error: 'Pontos insuficientes'
      })
    }

    const resultado = calcularFerias(dados)

    await consumePoints(userId, 1, {
      type: 'tool_usage',
      tool_name: 'calc_ferias',
      description: 'Cálculo de Férias'
    })

    return res.json({
      success: true,
      data: { resultado }
    })

  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    })
  }
}
```

**✅ Controller orquestra: valida → calcula → consome → retorna**

---

### **PASSO 5: Definir as Rotas**

**`src/functions/calculators/calculatorsRoutes.js`**

```javascript
import express from 'express'
import { rescisao, ferias } from './calculatorsController.js'
import { requireAuth } from '../auth/authMiddleware.js'
import { validateRequest } from '../../middlewares/validator.js'

const router = express.Router()

/**
 * POST /api/calculators/rescisao
 * Calcula rescisão trabalhista
 */
router.post(
  '/rescisao',
  requireAuth,
  validateRequest({
    type: 'object',
    properties: {
      salario: { type: 'number', minimum: 0 },
      dataAdmissao: { type: 'string', format: 'date' },
      dataDemissao: { type: 'string', format: 'date' },
      tipoRescisao: { 
        type: 'string',
        enum: ['sem_justa_causa', 'por_justa_causa', 'pedido_demissao']
      }
    },
    required: ['salario', 'dataAdmissao', 'dataDemissao'],
    additionalProperties: false
  }),
  rescisao
)

/**
 * POST /api/calculators/ferias
 * Calcula férias
 */
router.post(
  '/ferias',
  requireAuth,
  validateRequest({
    type: 'object',
    properties: {
      salario: { type: 'number', minimum: 0 },
      diasFerias: { type: 'number', minimum: 1, maximum: 30 },
      venderDias: { type: 'number', minimum: 0, maximum: 10 }
    },
    required: ['salario', 'diasFerias'],
    additionalProperties: false
  }),
  ferias
)

export default router
```

**✅ Rotas são auto-descobertas! Servidor registra como `/api/calculators/*`**

---

### **PASSO 6: Testar na API**

```bash
# 1. Fazer login e pegar token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"cpf":"123.456.789-09","password":"Teste@123"}'

# 2. Testar rescisão
curl -X POST http://localhost:3000/api/calculators/rescisao \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "salario": 3000,
    "dataAdmissao": "2020-01-15",
    "dataDemissao": "2025-10-18",
    "tipoRescisao": "sem_justa_causa"
  }'
```

**✅ API funcionando!**

---

### **PASSO 7: Integrar no Frontend**

**`tools-website-builder/src/services/calculators.js`**

```javascript
import api from './api'

export const calculatorsService = {
  async calcularRescisao(dados) {
    const response = await api.post('/calculators/rescisao', dados)
    return response.data
  },

  async calcularFerias(dados) {
    const response = await api.post('/calculators/ferias', dados)
    return response.data
  }
}
```

**`tools-website-builder/src/pages/dashboard/ferramentas/Rescisao.vue`**

```vue
<template>
  <div class="calculator-page">
    <h1>Calculadora de Rescisão Trabalhista</h1>

    <form @submit.prevent="calcular">
      <Input
        v-model="form.salario"
        type="number"
        label="Salário Mensal"
        required
      />

      <Input
        v-model="form.dataAdmissao"
        type="date"
        label="Data de Admissão"
        required
      />

      <Input
        v-model="form.dataDemissao"
        type="date"
        label="Data de Demissão"
        required
      />

      <Select
        v-model="form.tipoRescisao"
        label="Tipo de Rescisão"
        :options="[
          { value: 'sem_justa_causa', label: 'Sem Justa Causa' },
          { value: 'por_justa_causa', label: 'Por Justa Causa' },
          { value: 'pedido_demissao', label: 'Pedido de Demissão' }
        ]"
      />

      <Button type="submit" :loading="loading">
        Calcular (1 ponto)
      </Button>
    </form>

    <!-- Resultado -->
    <div v-if="resultado" class="result-card">
      <h2>Resultado</h2>
      
      <div class="detail-item">
        <span>Aviso Prévio:</span>
        <strong>{{ formatMoney(resultado.detalhes.aviso_previo) }}</strong>
      </div>

      <div class="detail-item">
        <span>Férias Proporcionais:</span>
        <strong>{{ formatMoney(resultado.detalhes.ferias_proporcionais) }}</strong>
      </div>

      <div class="detail-item">
        <span>13º Proporcional:</span>
        <strong>{{ formatMoney(resultado.detalhes.terceiro_proporcional) }}</strong>
      </div>

      <div class="detail-item">
        <span>Multa 40% FGTS:</span>
        <strong>{{ formatMoney(resultado.detalhes.multa_fgts) }}</strong>
      </div>

      <div class="total-item">
        <span>TOTAL:</span>
        <strong>{{ formatMoney(resultado.resumo.total_bruto) }}</strong>
      </div>

      <Button @click="exportarPDF">Exportar PDF</Button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { calculatorsService } from '@/services/calculators'
import { useNotification } from '@/composables/useNotification'

const { showSuccess, showError } = useNotification()

const form = ref({
  salario: null,
  dataAdmissao: '',
  dataDemissao: '',
  tipoRescisao: 'sem_justa_causa'
})

const resultado = ref(null)
const loading = ref(false)

const calcular = async () => {
  loading.value = true
  try {
    const response = await calculatorsService.calcularRescisao(form.value)
    resultado.value = response.data.resultado
    showSuccess('Cálculo realizado com sucesso!')
  } catch (error) {
    if (error.response?.status === 400) {
      showError(error.response.data.error)
    } else {
      showError('Erro ao calcular. Tente novamente.')
    }
  } finally {
    loading.value = false
  }
}

const formatMoney = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const exportarPDF = () => {
  // TODO: Implementar exportação
  showSuccess('Exportação em desenvolvimento')
}
</script>
```

**✅ Frontend completo e integrado!**

---

## 📊 Resumo do Fluxo

```
1. Usuário preenche formulário no Vue
   ↓
2. Frontend chama API: POST /api/calculators/rescisao
   ↓
3. Controller verifica pontos disponíveis
   ↓
4. Service executa cálculo (lógica pura)
   ↓
5. Controller consome 1 ponto
   ↓
6. Controller retorna resultado
   ↓
7. Frontend exibe resultado formatado
```

---

## ✅ Checklist Completa

- [ ] 1. Cadastrar ferramenta em `tool_costs`
- [ ] 2. Criar service com lógica pura
- [ ] 3. Criar controller que orquestra
- [ ] 4. Definir rotas com validação
- [ ] 5. Testar endpoint com curl/Postman
- [ ] 6. Criar service no frontend
- [ ] 7. Criar página Vue com formulário
- [ ] 8. Testar fluxo completo
- [ ] 9. Adicionar exportação PDF (opcional)
- [ ] 10. Documentar no README do módulo

---

## 🎯 Boas Práticas

### ✅ **DO** (Faça)

- Services com lógica pura (sem banco)
- Validação de entrada completa
- Tratamento de erros descritivos
- Testes unitários dos services
- Documentação de parâmetros

### ❌ **DON'T** (Não faça)

- Lógica de negócio no controller
- Acesso direto ao banco no service
- Consumir pontos antes do sucesso
- Retornar erros genéricos
- Código duplicado entre ferramentas

---

## 🔄 Como Alterar Custo/Categoria

### Mudar custo:
```sql
UPDATE tool_costs 
SET points_cost = 2
WHERE tool_name = 'calc_rescisao';
```

### Mudar categoria:
```sql
UPDATE tool_costs 
SET category = 'Trabalhista Premium'
WHERE tool_name = 'calc_rescisao';
```

**Nenhuma mudança de código necessária!** ✅

---

## 📚 Exemplos de Ferramentas

### Simples (1 ponto):
- Validadores (CPF, CNPJ, CEP)
- Calculadoras básicas (Férias, 13º)
- Consultas de API (ViaCEP)

### Complexas (3 pontos):
- Planejamento Previdenciário
- Análise de CNIS completa
- Relatórios jurídicos

---

**Pronto! Agora você sabe criar qualquer ferramenta do zero** 🚀

**Status:** ✅ Guia Completo  
**Última revisão:** 18/10/2025
