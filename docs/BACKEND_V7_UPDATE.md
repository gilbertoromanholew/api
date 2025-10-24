# 🔄 Atualização do Backend - Nova Economia V7

> **Data:** 23 de outubro de 2025  
> **Status:** ✅ Concluído  
> **Versão:** 7.0.0

## 📋 Resumo das Mudanças

### ✅ Arquivos Criados (4 novos)

1. **`api/src/services/pointsService.js`** (NOVO)
   - Substitui `api/dist-api/src/functions/points/pointsService.js`
   - Atualizado para usar `economy.user_wallets` e `economy.transactions`
   - Suporte a multiplicador Pro
   - Função para calcular custo real de ferramentas

2. **`api/src/controllers/toolsController.js`** (NOVO)
   - Substitui `api/dist-api/src/functions/tools/toolsController.js`
   - Atualizado para usar `tools.catalog` e `tools.executions`
   - Endpoints de favoritos adicionados
   - Registro de execuções separado

3. **`api/src/services/achievementsService.js`** (NOVO)
   - Sistema completo de conquistas
   - Verificação automática de progresso
   - Desbloqueio e recompensas
   - Vitrine de conquistas

4. **`api/src/services/subscriptionService.js`** (NOVO)
   - Gerenciamento de assinaturas Pro
   - Mesada semanal (20 pontos)
   - Preparado para integração com Stripe (futuro)
   - Cron jobs para expiração e mesadas

### ✅ Arquivo SQL Criado

5. **`api/sql-config/seeds/SEED_PRO_PLAN_AND_ACHIEVEMENTS.sql`**
   - Popula Plano Pro (R$ 89,10/mês)
   - Popula 15 conquistas iniciais (4 milestone, 5 progressive, 3 recurring, 3 secret)

---

## 🔄 Mudanças Detalhadas

### 1️⃣ `pointsService.js` - ATUALIZADO

#### Mudanças de Schema

| Antigo | Novo |
|--------|------|
| `user_points` | `economy.user_wallets` |
| `point_transactions` | `economy.transactions` |
| `free_points` | `bonus_credits` |
| `paid_points` | `purchased_points` |
| `public.point_transaction_type` | `economy.transaction_type` |

#### Novas Funções

```javascript
// ✅ NOVO: Calcular custo com desconto Pro
calculateToolCost(toolIdentifier, userId)
// Retorna: { tool, base_cost, final_cost, is_pro, discount }

// ✅ NOVO: Obter saldo
getUserBalance(userId)
// Retorna: { bonus_credits, purchased_points, total }

// ✅ NOVO: Histórico de transações
getTransactionHistory(userId, limit = 20)
// Retorna: Array de transações
```

#### Funções Atualizadas

```javascript
// ✅ ATUALIZADO: Consome bônus primeiro (FIFO)
consumePoints(userId, amount, metadata)
// Agora retorna: { consumed, bonus_consumed, purchased_consumed, ... }

// ✅ RENOMEADO: addFreePoints → addBonusPoints
addBonusPoints(userId, amount, metadata)

// ✅ RENOMEADO: addPaidPoints → addPurchasedPoints
addPurchasedPoints(userId, amount, metadata)

// ✅ ATUALIZADO: Busca por slug ou nome
getToolCost(toolIdentifier)
// Aceita: 'calculadora-de-ferias' ou 'Calculadora de Férias'

// ✅ MELHORADO: Considera desconto Pro
canUseTool(userId, toolIdentifier)
// Retorna: { can_use, tool_cost, base_cost, is_pro, discount, ... }
```

#### Retrocompatibilidade

```javascript
// Aliases deprecated (para não quebrar código antigo)
export const addFreePoints = addBonusPoints;
export const addPaidPoints = addPurchasedPoints;
```

---

### 2️⃣ `toolsController.js` - ATUALIZADO

#### Mudanças de Schema

| Antigo | Novo |
|--------|------|
| `tool_costs` | `tools.catalog` |
| `point_transactions` (tool_usage) | `tools.executions` |
| `tool_name` (parâmetro) | `slug` (parâmetro) |

#### Endpoints Atualizados

```javascript
// ✅ ATUALIZADO
GET /api/tools/list
// Agora retorna custos finais (com desconto Pro se logado)

// ✅ ATUALIZADO (parâmetro mudou)
GET /api/tools/:slug (antes era :tool_name)
// Retorna: { ...tool, can_use_info: { can_use, final_cost, discount, ... } }

// ✅ ATUALIZADO
POST /api/tools/execute/:slug
// Registra em tools.executions + economy.transactions
// Considera desconto Pro
```

#### Novos Endpoints

```javascript
// ✅ NOVO
POST /api/tools/favorite/:slug
// Adiciona/remove ferramenta dos favoritos

// ✅ NOVO
GET /api/tools/favorites
// Lista ferramentas favoritas do usuário

// ✅ ATUALIZADO
GET /api/tools/history
// Agora busca de tools.executions (com JOIN para tool info)
```

---

### 3️⃣ `achievementsService.js` - NOVO

#### Funções Principais

```javascript
// Verificar progresso após eventos
checkAchievementProgress(userId, eventType, eventData)
// Eventos: 'tool_execution', 'first_login', 'daily_login', 'purchase', 'diverse_tools'

// Listar conquistas do usuário
getUserAchievements(userId, options)
// options: { includeCompleted, includePending }

// Listar todas as conquistas
getAllAchievements()

// Atualizar vitrine (máx 3 conquistas)
updateShowcase(userId, achievementIds)

// Obter vitrine de um usuário
getShowcase(userId)

// Eventos específicos
onToolExecuted(userId, toolSlug)
onDailyLogin(userId)
```

#### Como Integrar

```javascript
// Após usar ferramenta
import { onToolExecuted } from './services/achievementsService.js';
await onToolExecuted(userId, toolSlug);

// No middleware de autenticação (login)
import { onDailyLogin } from './services/achievementsService.js';
await onDailyLogin(userId);
```

---

### 4️⃣ `subscriptionService.js` - NOVO

#### Funções Principais

```javascript
// Verificar se é Pro
isPro(userId)
// Retorna: boolean

// Obter assinatura ativa
getActiveSubscription(userId)
// Retorna: { ...subscription, plan: {...} } ou null

// Listar planos disponíveis
getAvailablePlans()

// Criar assinatura (após pagamento Stripe)
createSubscription(userId, planSlug, paymentData)

// Cancelar assinatura (fica ativa até expirar)
cancelSubscription(userId, reason)

// Renovar assinatura (webhook Stripe)
renewSubscription(userId, paymentData)

// Obter estatísticas
getSubscriptionStats(userId)
// Retorna: { is_pro, subscription: { days_remaining, features, ... } }
```

#### Cron Jobs (Implementar depois)

```javascript
// Rodar toda segunda-feira às 00:00
import { processWeeklyAllowance } from './services/subscriptionService.js';
cron.schedule('0 0 * * 1', async () => {
  await processWeeklyAllowance();
});

// Rodar todo dia às 01:00
import { expireSubscriptions } from './services/subscriptionService.js';
cron.schedule('0 1 * * *', async () => {
  await expireSubscriptions();
});
```

---

## 🗄️ SQL: Popular Plano Pro e Conquistas

### Execute no Supabase

```bash
# Arquivo criado em:
api/sql-config/seeds/SEED_PRO_PLAN_AND_ACHIEVEMENTS.sql
```

**Conteúdo:**
- ✅ 1 Plano Pro (R$ 89,10/mês)
- ✅ 15 Conquistas:
  - 4 Milestone (Bem-vindo, Primeira Ferramenta, Primeira Compra, Explorador)
  - 5 Progressive (Mestre das Ferramentas I-V)
  - 3 Recurring (Guerreiro Semanal, Campeão Mensal, Maratonista Anual)
  - 3 Secret (O Coruja, Rei do Feriado, Caçador de Easter Eggs)

**Resultado Esperado:**
```
item        | total
------------|------
Plano Pro   | 1
Conquistas  | 15
```

---

## 📝 Checklist de Integração

### Backend (API)

- [ ] **Copiar arquivos novos para a pasta correta**
  - `src/services/pointsService.js`
  - `src/controllers/toolsController.js`
  - `src/services/achievementsService.js`
  - `src/services/subscriptionService.js`

- [ ] **Atualizar rotas**
  - Mudar `:tool_name` para `:slug` nas rotas de ferramentas
  - Adicionar rotas de favoritos
  - Adicionar rotas de conquistas (criar depois)
  - Adicionar rotas de assinatura (criar depois)

- [ ] **Atualizar imports**
  - Trocar imports de `dist-api/` para `src/`
  - Verificar dependências entre services

- [ ] **Executar SQL de seed**
  - Rodar `SEED_PRO_PLAN_AND_ACHIEVEMENTS.sql` no Supabase
  - Verificar que 1 plano e 15 conquistas foram criados

- [ ] **Integrar eventos de conquistas**
  - Adicionar `onToolExecuted()` após executar ferramenta
  - Adicionar `onDailyLogin()` no middleware de autenticação
  - Adicionar `checkAchievementProgress('purchase')` após compra

- [ ] **Testar endpoints atualizados**
  - `GET /api/tools/list` (deve mostrar custos com desconto Pro)
  - `GET /api/tools/:slug` (não mais :tool_name)
  - `POST /api/tools/execute/:slug`
  - `POST /api/tools/favorite/:slug`
  - `GET /api/tools/favorites`

### Frontend (Vue.js) - FUTURO

- [ ] Atualizar chamadas de API para usar `/tools/:slug` ao invés de `:tool_name`
- [ ] Mostrar desconto Pro nos cards de ferramentas
- [ ] Criar tela de Conquistas
- [ ] Criar tela de Assinatura Pro
- [ ] Adicionar ícone de favorito nas ferramentas

---

## 🎯 Próximos Passos

### Imediato (Hoje)
1. ✅ Executar `SEED_PRO_PLAN_AND_ACHIEVEMENTS.sql` no Supabase
2. ⏳ Copiar arquivos novos para `api/src/`
3. ⏳ Atualizar rotas (mudar `:tool_name` → `:slug`)
4. ⏳ Testar endpoints com Postman/Thunder Client

### Curto Prazo (Esta Semana)
5. ⏳ Criar controladores de conquistas e assinatura
6. ⏳ Adicionar rotas REST para conquistas
7. ⏳ Integrar eventos de conquistas nos controllers existentes
8. ⏳ Testar sistema de conquistas end-to-end

### Médio Prazo (Próxima Semana)
9. ⏳ Atualizar frontend para novos endpoints
10. ⏳ Criar tela de Conquistas no Vue.js
11. ⏳ Criar tela de Assinatura Pro
12. ⏳ Adicionar sistema de favoritos no frontend

### Longo Prazo (Depois)
13. ⏳ Integrar Stripe (pagamentos e webhooks)
14. ⏳ Configurar cron jobs (mesada semanal, expiração)
15. ⏳ Popular as 40+ conquistas restantes
16. ⏳ Adicionar notificações de conquistas desbloqueadas

---

## 📖 Documentação

- **Estrutura do Banco:** [docs/database/STRUCTURE.md](../docs/database/STRUCTURE.md)
- **Segurança (RLS):** [docs/database/SECURITY.md](../docs/database/SECURITY.md)
- **Migração OLD→NEW:** [docs/database/OLD_VS_NEW.md](../docs/database/OLD_VS_NEW.md)
- **Histórico de Migração:** [docs/database/MIGRATION_HISTORY.md](../docs/database/MIGRATION_HISTORY.md)

---

**🎉 Backend V7 pronto para integração!**
