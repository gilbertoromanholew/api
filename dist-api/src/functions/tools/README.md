# Módulo Tools

Gerenciamento e execução de ferramentas jurídicas com consumo automático de pontos.

## 🎯 Estrutura de Ferramentas

### Categoria 1: Planejamento Jurídico (3 pontos)
- **Planejamento Previdenciário** - Análise completa de aposentadoria
- **Planejamento Trabalhista** - Análise de direitos trabalhistas
- **Planejamento Assistencial** - Análise de benefícios assistenciais

### Categoria 2: Ferramentas Simples (1 ponto)
- **Trabalhistas**: Rescisão, Férias, 13º
- **Previdenciárias**: CNIS, Tempo de Contribuição, Acumulação
- **Cálculos**: Atualização Monetária, Juros, Comparador
- **Validações**: CPF, CNPJ, CEP

**Total: 15 ferramentas | Custos: 1 ou 3 pontos**

---

## Endpoints

### 1. **GET** `/api/tools/list`
Lista todas as ferramentas disponíveis agrupadas por categoria.

**Autenticação:** Não requerida (público)

**Resposta de sucesso:**
```json
{
  "success": true,
  "data": {
    "categories": {
      "Planejamento": [
        {
          "name": "planejamento_previdenciario",
          "display_name": "Planejamento Previdenciário",
          "description": "Análise completa para aposentadoria",
          "points_cost": 3,
          "icon": "🏛️"
        },
        {
          "name": "planejamento_trabalhista",
          "display_name": "Planejamento Trabalhista",
          "description": "Análise de direitos trabalhistas",
          "points_cost": 3,
          "icon": "⚖️"
        }
      ],
      "Trabalhista": [
        {
          "name": "calc_rescisao",
          "display_name": "Calculadora de Rescisão",
          "description": "Cálculo completo de rescisão trabalhista",
          "points_cost": 1,
          "icon": "�"
        }
      ]
    },
    "total_tools": 15
  }
}
```

---

### 2. **GET** `/api/tools/:tool_name`
Retorna detalhes de uma ferramenta específica.

**Autenticação:** Opcional (se autenticado, retorna se o usuário pode usar)

**Exemplo:** `GET /api/tools/planejamento_previdenciario`

**Resposta de sucesso:**
```json
{
  "success": true,
  "data": {
    "tool_name": "planejamento_previdenciario",
    "display_name": "Planejamento Previdenciário",
    "description": "Análise completa para aposentadoria: tempo de contribuição, simulação de cenários, melhor momento e valor do benefício",
    "points_cost": 3,
    "category": "Planejamento",
    "icon": "🏛️",
    "is_active": true,
    "can_use": {
      "can_use": true,
      "tool_cost": 3,
      "current_balance": 10,
      "missing_points": 0
    }
  }
}
```

---

### 3. **POST** `/api/tools/execute/:tool_name`
Executa uma ferramenta (consome pontos automaticamente).

**Autenticação:** Requerida

**Exemplo:** `POST /api/tools/execute/planejamento_previdenciario`

**Body:**
```json
{
  "params": {
    "data_nascimento": "1980-05-15",
    "tempo_contribuicao": "25 anos",
    "salario_medio": 5000
  }
}
```

**Resposta de sucesso:**
```json
{
  "success": true,
  "message": "Ferramenta \"Planejamento Previdenciário\" executada com sucesso",
  "data": {
    "tool": {
      "name": "planejamento_previdenciario",
      "display_name": "Planejamento Previdenciário",
      "cost": 3
    },
    "consumption": {
      "consumed": 3,
      "free_consumed": 3,
      "paid_consumed": 0,
      "previous_balance": 10,
      "new_balance": 7,
      "transactions": [...]
    },
    "result": {
      "status": "pending_implementation",
      "message": "Integração com ferramenta em desenvolvimento"
    }
  }
}
```

**Erros possíveis:**
- 404: Ferramenta não encontrada ou inativa
- 400: Pontos insuficientes
- 400: Parâmetros inválidos

---

### 4. **GET** `/api/tools/history`
Histórico de uso de ferramentas do usuário.

**Autenticação:** Requerida

**Query Params:**
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 20)

**Exemplo:** `GET /api/tools/history?page=1&limit=10`

**Resposta de sucesso:**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "type": "tool_usage",
        "tool_name": "planejamento_previdenciario",
        "amount": -3,
        "balance_before": 10,
        "balance_after": 7,
        "description": "Uso da ferramenta: Planejamento Previdenciário",
        "created_at": "2025-10-18T10:30:00Z",
        "tool_info": {
          "display_name": "Planejamento Previdenciário",
          "category": "Planejamento",
          "icon": "🏛️"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "total_pages": 5,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

---

## Fluxo de Execução

1. **Verificação Prévia**: Antes de executar, o frontend pode chamar `GET /api/tools/:tool_name` para verificar se o usuário tem pontos suficientes
2. **Execução**: Ao chamar `POST /api/tools/execute/:tool_name`:
   - Verifica se a ferramenta existe e está ativa
   - Consome os pontos automaticamente (prioriza gratuitos)
   - Registra transação no histórico
   - Executa a lógica da ferramenta
   - Retorna resultado + informações de consumo

---

## Integração com Ferramentas Existentes

Para integrar uma ferramenta real:

1. **Adicionar custo no banco** (`tool_costs`)
2. **Modificar `toolsController.js`** no `executeTool`:
   - Importar a ferramenta
   - Chamar a função da ferramenta com `params`
   - Retornar o resultado real

### Exemplo de Integração:

```javascript
// No toolsController.js, após consumir pontos:

// Importar ferramenta real
import { calcularPlanejamentoPrevidenciario } from '../planejamento/previdenciarioService.js';
import { calcularRescisao } from '../trabalhista/rescisaoService.js';

// Dentro de executeTool, após consumption:
let result;
switch(tool_name) {
    case 'planejamento_previdenciario':
        result = await calcularPlanejamentoPrevidenciario(params);
        break;
    case 'calc_rescisao':
        result = await calcularRescisao(params);
        break;
    case 'validador_cpf':
        result = await validarCPF(params);
        break;
    default:
        result = { status: 'not_implemented' };
}

return res.json({
    success: true,
    data: {
        tool,
        consumption,
        result // Resultado real da ferramenta
    }
});
```

---

## Adicionar Nova Ferramenta

1. **Inserir no banco** (`tool_costs`):
```sql
INSERT INTO tool_costs (tool_name, display_name, description, points_cost, category, icon)
VALUES ('calc_horas_extras', 'Calculadora de Horas Extras', 'Cálculo de horas extras com adicional noturno e DSR', 1, 'Trabalhista', '⏰');
```

2. **Implementar lógica** no `toolsController.js` (ou service dedicado)
3. **Testar** com `POST /api/tools/execute/calc_horas_extras`

---

## 🎯 Custos Definidos

- **Planejamento Jurídico**: 3 pontos (análise completa e integrada)
- **Ferramentas Simples**: 1 ponto (cálculos e validações rápidas)

---

## 📋 Ferramentas Cadastradas

### Planejamento (3 pts):
1. Planejamento Previdenciário
2. Planejamento Trabalhista
3. Planejamento Assistencial

### Trabalhista (1 pt):
1. Calculadora de Rescisão
2. Calculadora de Férias
3. Calculadora de 13º Salário

### Previdenciário (1 pt):
1. Extrator de CNIS
2. Tempo de Contribuição
3. Análise de Acumulação

### Cálculos (1 pt):
1. Atualização Monetária
2. Calculadora de Juros
3. Comparador de Índices

### Validações (1 pt):
1. Validador de CPF
2. Validador de CNPJ
3. Consulta CEP

**Total: 15 ferramentas**

---

## Status Atual

✅ Estrutura completa implementada  
✅ Consumo automático de pontos  
✅ Histórico de uso  
✅ Listagem e detalhes  
⏳ Integração com ferramentas reais (próximo passo)
