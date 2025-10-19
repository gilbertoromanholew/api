# 📚 GUIA COMPLETO: Estrutura da API

## 🎯 Visão Geral

Esta API usa uma **arquitetura modular** onde cada funcionalidade é um módulo independente que é **automaticamente descoberto e carregado**.

---

## 📁 Estrutura de Diretórios

```
api/
├── src/
│   ├── functions/           ← MÓDULOS DA API (auto-descoberta)
│   │   ├── auth/           ← Autenticação (login, registro)
│   │   ├── points/         ← Sistema de pontos
│   │   ├── user/           ← Perfil e estatísticas
│   │   ├── tools/          ← Gerenciador de ferramentas
│   │   ├── calculators/    ← SUAS FERRAMENTAS VÃO AQUI
│   │   └── _TEMPLATE/      ← Template para novos módulos
│   │
│   ├── config/             ← Configurações (Supabase, etc)
│   ├── core/               ← Sistema central (routeLoader)
│   ├── middlewares/        ← Middlewares globais
│   └── routes/             ← Rotas especiais (docs, logs)
│
├── database/               ← Scripts SQL
└── server.js              ← Ponto de entrada
```

---

## 🔄 Como Funciona a Auto-Descoberta

### 1. **routeLoader.js** escaneia `src/functions/`

```javascript
// Ele procura por diretórios com:
- nomeRoutes.js  ← Define as rotas
- nomeController.js ← Lógica dos endpoints
```

### 2. **Registra automaticamente** as rotas

```javascript
// Se você criar:
src/functions/calculators/calculatorsRoutes.js

// O sistema cria automaticamente:
GET  /api/calculators/*
POST /api/calculators/*
...
```

### 3. **Sem necessidade de editar `server.js`**

Você adiciona um novo módulo e ele já funciona!

---

## 📦 Tipos de Módulos

### 🔐 **Módulos de Sistema** (Não mexer)
```
auth/       ← Autenticação e registro
points/     ← Sistema de pontos
user/       ← Perfil do usuário
tools/      ← Gerenciador de ferramentas
```

### 🛠️ **Módulos de Ferramentas** (Você vai criar)
```
calculators/        ← Calculadoras (rescisão, férias, etc)
planning/           ← Planejamentos (previdenciário, trabalhista)
validators/         ← Validadores (CPF, CNPJ, CEP)
```

---

## 🎯 Onde Colocar Cada Coisa

### ✅ **Lógica das Ferramentas → API** (Backend)

**Criar em:** `src/functions/calculators/` ou `src/functions/planning/`

**Por quê:**
- 🔒 Segurança (código protegido)
- 🎯 Controle de pontos (consumo automático)
- ♻️ Reutilização (web, mobile, API externa)
- 📊 Auditoria (histórico completo)

### 📱 **Interface → Frontend** (Vue)

**Criar em:** `tools-website-builder/src/pages/dashboard/ferramentas/`

**Por quê:**
- 🎨 Design e UX
- ✅ Validação de formulários
- 📞 Chamadas à API
- 📊 Exibição de resultados

---

## 🏗️ Arquitetura Recomendada

### Para cada ferramenta, crie:

```
src/functions/calculators/
├── README.md              ← Documentação
├── calculatorsRoutes.js   ← Define as rotas
├── calculatorsController.js ← Orquestra as chamadas
└── services/              ← Lógica específica
    ├── rescisaoService.js    ← Cálculo de rescisão
    ├── feriasService.js      ← Cálculo de férias
    └── terceiroService.js    ← Cálculo de 13º
```

### Benefícios:
- ✅ **Modular**: Cada serviço é independente
- ✅ **Testável**: Testa cada cálculo separadamente
- ✅ **Reutilizável**: Um serviço pode chamar outro
- ✅ **Manutenível**: Fácil encontrar e editar

---

## 🔗 Fluxo Completo de uma Ferramenta

### 1. **Usuário no Frontend:**
```javascript
// tools-website-builder/src/pages/dashboard/ferramentas/Rescisao.vue
async calcularRescisao() {
  const response = await api.post('/calculators/rescisao', {
    salario: 3000,
    dataAdmissao: '2020-01-15',
    dataDemissao: '2025-10-18'
  })
  
  this.resultado = response.data.result
}
```

### 2. **API recebe e processa:**
```javascript
// src/functions/calculators/calculatorsController.js
export async function calcularRescisao(req, res) {
  const userId = req.user.id
  const { salario, dataAdmissao, dataDemissao } = req.body
  
  // 1. Verificar pontos
  const canUse = await canUseTool(userId, 'calc_rescisao')
  if (!canUse.can_use) {
    return res.status(400).json({ error: 'Pontos insuficientes' })
  }
  
  // 2. Executar cálculo
  const resultado = await rescisaoService.calcular({
    salario,
    dataAdmissao,
    dataDemissao
  })
  
  // 3. Consumir pontos
  await consumePoints(userId, 1, {
    type: 'tool_usage',
    tool_name: 'calc_rescisao',
    description: 'Cálculo de Rescisão'
  })
  
  // 4. Retornar resultado
  return res.json({
    success: true,
    result: resultado,
    points_consumed: 1
  })
}
```

### 3. **Service faz o cálculo:**
```javascript
// src/functions/calculators/services/rescisaoService.js
export function calcular({ salario, dataAdmissao, dataDemissao }) {
  const diasTrabalhados = calcularDias(dataAdmissao, dataDemissao)
  const avisoPrevio = calcularAvisoPrevio(diasTrabalhados)
  const ferias = calcularFerias(salario, diasTrabalhados)
  const terceiro = calcularTerceiro(salario, diasTrabalhados)
  
  return {
    avisoPrevio,
    ferias,
    terceiro,
    total: avisoPrevio + ferias + terceiro
  }
}
```

---

## 📊 Integração com Sistema de Pontos

### Automática:
```javascript
import { consumePoints, canUseTool } from '../points/pointsService.js'

// Antes de executar
const check = await canUseTool(userId, 'calc_rescisao')
if (!check.can_use) {
  return res.status(400).json({ 
    error: 'Pontos insuficientes',
    missing: check.missing_points
  })
}

// Após sucesso
await consumePoints(userId, 1, {
  type: 'tool_usage',
  tool_name: 'calc_rescisao'
})
```

---

## 🎨 Integração com Frontend

### 1. Criar service no Vue:
```javascript
// tools-website-builder/src/services/calculators.js
import api from './api'

export const calculatorsService = {
  async calcularRescisao(data) {
    const response = await api.post('/calculators/rescisao', data)
    return response.data
  },
  
  async calcularFerias(data) {
    const response = await api.post('/calculators/ferias', data)
    return response.data
  }
}
```

### 2. Usar no componente Vue:
```vue
<script setup>
import { calculatorsService } from '@/services/calculators'

const calcular = async () => {
  try {
    const result = await calculatorsService.calcularRescisao(formData)
    showResult(result)
  } catch (error) {
    if (error.response?.status === 400) {
      showError('Pontos insuficientes')
    }
  }
}
</script>
```

---

## 🔄 Como Mudar Categorias Facilmente

### 1. **No Banco de Dados** (`tool_costs`):
```sql
-- Mudar categoria de uma ferramenta:
UPDATE tool_costs 
SET category = 'Nova Categoria'
WHERE tool_name = 'calc_rescisao';

-- Renomear categoria inteira:
UPDATE tool_costs 
SET category = 'Trabalhista Pro'
WHERE category = 'Trabalhista';
```

### 2. **No Frontend** (constantes):
```javascript
// tools-website-builder/src/utils/constants.js
export const TOOL_CATEGORIES = {
  PLANEJAMENTO: {
    id: 'Planejamento',
    name: 'Planejamento Jurídico',
    icon: '🎯'
  },
  TRABALHISTA: {
    id: 'Trabalhista',
    name: 'Ferramentas Trabalhistas',
    icon: '⚖️'
  }
  // Adicione ou edite conforme necessário
}
```

### 3. **API adapta automaticamente:**
O endpoint `GET /api/tools/list` agrupa por categoria dinamicamente, então **qualquer mudança no banco reflete automaticamente**.

---

## 📝 Checklist para Nova Ferramenta

- [ ] 1. Inserir no banco (`tool_costs`)
- [ ] 2. Criar service com lógica (`services/nomeService.js`)
- [ ] 3. Adicionar endpoint no controller
- [ ] 4. Testar com Postman/curl
- [ ] 5. Criar página Vue no frontend
- [ ] 6. Conectar com API service
- [ ] 7. Testar fluxo completo
- [ ] 8. Documentar no README do módulo

---

## 🚀 Próximos Passos

1. **Leia os READMEs de cada módulo** (auth, points, user, tools)
2. **Use o _TEMPLATE** para criar novos módulos
3. **Siga a estrutura recomendada** (controller + services)
4. **Teste cada parte** antes de integrar

---

## 📞 Dúvidas Frequentes

### "Onde coloco a lógica de cálculo?"
→ `src/functions/calculators/services/`

### "Preciso editar server.js?"
→ Não! O routeLoader faz tudo automaticamente

### "Como mudo custos de ferramentas?"
→ `UPDATE tool_costs SET points_cost = X WHERE tool_name = 'Y'`

### "E se eu quiser validação customizada?"
→ Adicione em `nomeController.js` antes de chamar o service

### "Posso ter uma ferramenta sem consumir pontos?"
→ Sim, apenas não chame `consumePoints()` no controller

---

**Documentação completa de cada módulo:**
- [Auth Module](./auth/README.md)
- [Points Module](./points/README.md)
- [User Module](./user/README.md)
- [Tools Module](./tools/README.md)
- [Template](../_TEMPLATE/README.md)
