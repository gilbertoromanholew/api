# 🎯 ESTRUTURA REAL DE FERRAMENTAS

## 📊 Categorias e Custos

### 🌟 Categoria 1: PLANEJAMENTO JURÍDICO
**Custo: 3 pontos cada**

Ferramentas principais do sistema - análise jurídica completa e integrada:

| Ferramenta | Nome Técnico | Descrição |
|------------|--------------|-----------|
| 🏛️ **Planejamento Previdenciário** | `planejamento_previdenciario` | Análise completa para aposentadoria: tempo de contribuição, simulação de cenários, melhor momento e valor do benefício |
| ⚖️ **Planejamento Trabalhista** | `planejamento_trabalhista` | Análise de contratos, cálculos de rescisão, direitos trabalhistas e compliance profissional |
| 🤝 **Planejamento Assistencial** | `planejamento_assistencial` | Análise de benefícios assistenciais (BPC/LOAS), requisitos e documentação necessária |

**Total: 3 ferramentas | 9 pontos (se usar todas)**

---

### 🛠️ Categoria 2: FERRAMENTAS TRABALHISTAS
**Custo: 1 ponto cada**

Calculadoras e utilitários para cálculos trabalhistas:

| Ferramenta | Nome Técnico | Descrição |
|------------|--------------|-----------|
| 💼 **Calculadora de Rescisão** | `calc_rescisao` | Cálculo completo: aviso prévio, férias, 13º, FGTS e multa de 40% |
| 🏖️ **Calculadora de Férias** | `calc_ferias` | Férias simples, proporcionais, em dobro e abono pecuniário |
| 💰 **Calculadora de 13º** | `calc_13_salario` | 13º salário proporcional e integral com descontos |

**Total: 3 ferramentas | 3 pontos (se usar todas)**

---

### 📋 Categoria 3: FERRAMENTAS PREVIDENCIÁRIAS
**Custo: 1 ponto cada**

Utilitários para análise previdenciária:

| Ferramenta | Nome Técnico | Descrição |
|------------|--------------|-----------|
| 📄 **Extrator de CNIS** | `extrator_cnis` | Extração e análise automatizada de vínculos do CNIS em PDF |
| ⏱️ **Tempo de Contribuição** | `calc_tempo_contribuicao` | Cálculo com conversão de tempo especial e regras de transição |
| 📋 **Análise de Acumulação** | `calc_acumulacao` | Verificação de acumulação de benefícios previdenciários |

**Total: 3 ferramentas | 3 pontos (se usar todas)**

---

### 🧮 Categoria 4: CÁLCULOS E CORREÇÕES
**Custo: 1 ponto cada**

Ferramentas para cálculos financeiros e correções:

| Ferramenta | Nome Técnico | Descrição |
|------------|--------------|-----------|
| 📈 **Atualização Monetária** | `atualizacao_monetaria` | Correção com IPCA, INPC, IGP-M, Selic, TR (desde 1994) |
| 🧮 **Calculadora de Juros** | `calc_juros` | Juros simples e compostos com múltiplos índices |
| 📊 **Comparador de Índices** | `comparador_indices` | Compare rendimentos entre índices no mesmo período |

**Total: 3 ferramentas | 3 pontos (se usar todas)**

---

### ✅ Categoria 5: VALIDAÇÕES E CONSULTAS
**Custo: 1 ponto cada**

Validadores e consultas rápidas:

| Ferramenta | Nome Técnico | Descrição |
|------------|--------------|-----------|
| 🆔 **Validador de CPF** | `validador_cpf` | Validação e formatação de CPF |
| 🏢 **Validador de CNPJ** | `validador_cnpj` | Validação e formatação de CNPJ |
| 📍 **Consulta CEP** | `consulta_cep` | Busca endereço via API dos Correios |

**Total: 3 ferramentas | 3 pontos (se usar todas)**

---

## 📊 Resumo Geral

| Categoria | Quantidade | Custo Individual | Custo Total |
|-----------|------------|------------------|-------------|
| **Planejamento** | 3 | 3 pontos | 9 pontos |
| **Trabalhista** | 3 | 1 ponto | 3 pontos |
| **Previdenciário** | 3 | 1 ponto | 3 pontos |
| **Cálculos** | 3 | 1 ponto | 3 pontos |
| **Validações** | 3 | 1 ponto | 3 pontos |
| **TOTAL** | **15 ferramentas** | - | **21 pontos** |

---

## 💡 Lógica de Pontos

### Usuário Novo (Gratuito):
- **Recebe:** 10 pontos grátis no cadastro
- **Pode fazer:**
  - 3 planejamentos completos (3 × 3 = 9 pontos)
  - ou 10 ferramentas simples (10 × 1 = 10 pontos)
  - ou 2 planejamentos + 4 ferramentas simples (6 + 4 = 10 pontos)

### Com Indicação:
- **Indica alguém:** +5 pontos grátis (até 100 grátis no total)
- **É indicado:** +5 pontos extras para o indicador

### Sistema de Prioridade:
1. **Consome pontos gratuitos primeiro** (até 100 limite)
2. **Depois consome pontos pagos** (ilimitado)
3. **Registra tudo no histórico** (`point_transactions`)

---

## 🎯 Casos de Uso

### Advogado Trabalhista:
```
Cadastro: 10 pontos
↓
1× Planejamento Trabalhista: -3 pontos → Saldo: 7
3× Calc. Rescisão: -3 pontos → Saldo: 4
2× Calc. Férias: -2 pontos → Saldo: 2
2× Validador CPF: -2 pontos → Saldo: 0
↓
Precisa comprar mais pontos para continuar
```

### Advogado Previdenciário:
```
Cadastro: 10 pontos
↓
2× Planejamento Previdenciário: -6 pontos → Saldo: 4
1× Extrator CNIS: -1 ponto → Saldo: 3
3× Tempo de Contribuição: -3 pontos → Saldo: 0
↓
Precisa comprar mais pontos
```

### Advogado Full (Indicou 5 amigos):
```
Cadastro: 10 pontos
5× Indicações: +25 pontos
Total: 35 pontos grátis
↓
Pode usar bastante antes de precisar comprar!
```

---

## 🔄 Próximos Passos

1. **Executar o SQL atualizado** no Supabase
2. **Testar endpoints** com as ferramentas reais
3. **Integrar com o frontend** (Fase 3)
4. **Implementar lógica real** de cada ferramenta
5. **Adicionar Stripe** para venda de pontos (Fase 4)

---

## 📝 Notas Importantes

- ✅ **Ferramentas alinhadas** com o frontend existente
- ✅ **Custos balanceados**: planejamento vale 3× mais
- ✅ **Sistema escalável**: fácil adicionar novas ferramentas
- ✅ **Prioridade clara**: gratuitos → pagos
- ✅ **Limite de 100 pontos grátis** respeitado
- ✅ **Histórico completo** de uso registrado

---

## 🚀 Comando para Popular Banco

```sql
-- Execute no Supabase SQL Editor:
-- Copie e cole o conteúdo de: database/seed_tools.sql
```

Após executar, você terá:
- ✅ 15 ferramentas cadastradas
- ✅ 5 categorias organizadas
- ✅ Custos configurados (3 ou 1 ponto)
- ✅ Pronto para integração com frontend
