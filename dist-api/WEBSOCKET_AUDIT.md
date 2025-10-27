# 🔍 AUDITORIA COMPLETA DA API - WebSocket Migration

## 📋 Status: **EM ANDAMENTO**

Data: 27 de outubro de 2025

---

## 🎯 OBJETIVOS

1. ✅ Identificar todos os pontos que alteram dados do usuário
2. ✅ Adicionar eventos WebSocket apropriados
3. ✅ Manter Rate Limiting para segurança
4. ✅ Integrar sistema de Admin com WebSocket
5. ✅ Criar Modal de Conquistas
6. ✅ Criar Centro de Notificações

---

## 📊 MAPEAMENTO DE ENDPOINTS

### **🏆 ACHIEVEMENTS (Conquistas)**

#### Arquivo: `src/services/achievementsService.js`

**Função Crítica: `unlockAchievement(userId, achievementId)`**
- ❌ **ATUAL:** Apenas loga no console
- ✅ **NOVO:** Emitir `emitAchievementUnlocked(userId, achievementData)`

**Localização:** Linha 309
```javascript
// ANTES
logger.tool(`Bonus points earned from achievement`, { 
    userId, 
    achievementId, 
    bonusPoints: achievement.reward_bonus_credits 
});

// DEPOIS
import { emitAchievementUnlocked } from './socketService.js'

emitAchievementUnlocked(userId, {
    id: achievementId,
    title: achievement.title,
    description: achievement.description,
    points: achievement.reward_bonus_credits,
    icon: achievement.icon
})
```

---

### **💰 CREDITS (Créditos/Pontos)**

#### Arquivo: `src/routes/creditsRoutes.js`

**Status:** ✅ **JÁ IMPLEMENTADO**

Funções com WebSocket:
- ✅ `POST /api/credits/add-bonus` → `emitCreditsUpdate()`
- ⏳ `POST /api/credits/add-purchased` → PRECISA ADICIONAR
- ⏳ Consumo de pontos ao usar ferramenta → PRECISA ADICIONAR

---

### **📦 SUBSCRIPTION (Assinaturas)**

#### Arquivo: `src/routes/subscriptionRoutes.js`

**Endpoints que mudam status:**
- `POST /api/subscription/checkout` → Compra de plano
- `POST /api/subscription/cancel` → Cancelamento
- `POST /api/subscription/upgrade` → Upgrade de plano
- `POST /api/subscription/webhook` → Webhook de pagamento

**Ação Necessária:**
```javascript
import { emitSubscriptionUpdate } from '../services/socketService.js'

// Após checkout bem-sucedido
emitSubscriptionUpdate(userId, {
    plan: planSlug,
    status: 'active',
    isPro: true,
    expiresAt: subscription.expires_at
})
```

---

### **🔧 TOOLS (Ferramentas)**

#### Arquivo: `src/routes/toolsRoutes.js`

**Endpoint Crítico:** `POST /api/tools/execute`

**Ação Necessária:**
```javascript
import { emitCreditsUpdate } from '../services/socketService.js'

// Após executar ferramenta e consumir pontos
const newBalance = await consumePoints(userId, toolCost)

emitCreditsUpdate(userId, {
    total: newBalance.total,
    bonus: newBalance.bonus,
    purchased: newBalance.purchased
})
```

---

### **👤 PROFILE (Perfil)**

#### Arquivo: `src/routes/userRoutes.js` (precisa verificar se existe)

**Endpoints:**
- `PUT /api/user/profile` → Atualização de perfil
- `PUT /api/user/password` → Troca de senha

**Ação Necessária:**
```javascript
import { emitProfileUpdate } from '../services/socketService.js'

emitProfileUpdate(userId, {
    firstName: profile.first_name,
    fullName: profile.full_name,
    email: profile.email
})
```

---

### **🎯 GAMIFICATION (Gamificação)**

#### Pontos Service (precisa verificar localização)

**Função: `addBonusPoints()`**
```javascript
import { emitCreditsUpdate, emitLevelUp } from '../services/socketService.js'

// Após adicionar pontos
emitCreditsUpdate(userId, newBalance)

// Se subiu de nível
if (levelChanged) {
    emitLevelUp(userId, {
        newLevel: newLevel,
        newTitle: levelTitle,
        pointsRequired: nextLevelPoints
    })
}
```

---

## 🔐 RATE LIMITING - ANÁLISE

### **Por Que MANTER Rate Limiting?**

✅ **SIM, devemos manter!**

**Motivos:**

1. **Segurança contra Ataques**
   - Brute force em login
   - DDoS/DoS
   - Spam de registro

2. **Endpoints de ESCRITA ainda usam HTTP**
   - WebSocket é só para NOTIFICAÇÕES
   - Requests de criação/update continuam via HTTP
   - Precisam de proteção

3. **WebSocket não substitui rate limit**
   - WebSocket = Push de dados (servidor → cliente)
   - HTTP = Pull de dados (cliente → servidor)
   - São complementares!

### **Rate Limits Recomendados**

#### **Leitura (GET) - RELAXADOS**
```javascript
GET /api/user/profile → 100 req/min
GET /api/credits/balance → 100 req/min
GET /api/achievements → 100 req/min
GET /api/subscription/status → 60 req/min
```

#### **Escrita (POST/PUT/DELETE) - RESTRITOS**
```javascript
POST /api/auth/login → 5 req/15min (brute force)
POST /api/auth/register → 3 req/15min (spam)
POST /api/tools/execute → 30 req/min (abuso de IA)
POST /api/credits/purchase → 10 req/hour (fraude)
POST /api/subscription/checkout → 10 req/hour (fraude)
```

#### **Admin Endpoints - MUITO RESTRITOS**
```javascript
POST /api/admin/* → 20 req/min
DELETE /api/admin/* → 10 req/min
```

---

## 🛠️ PLANO DE IMPLEMENTAÇÃO

### **FASE 1: Achievements & Gamification** ⏳
- [ ] Integrar `unlockAchievement()` com WebSocket
- [ ] Integrar `addBonusPoints()` com `emitLevelUp()`
- [ ] Testar desbloqueio de conquista em tempo real

### **FASE 2: Tools Execution** ⏳
- [ ] Integrar consumo de pontos com WebSocket
- [ ] Emitir evento após executar ferramenta
- [ ] Testar atualização de créditos em tempo real

### **FASE 3: Subscription** ⏳
- [ ] Integrar checkout com WebSocket
- [ ] Integrar cancelamento com WebSocket
- [ ] Integrar webhook com WebSocket

### **FASE 4: Admin System** ⏳
- [ ] Criar rota WebSocket para admin events
- [ ] Broadcast para todos admins online
- [ ] Notificações de ações administrativas

### **FASE 5: Frontend Components** ⏳
- [ ] Modal de Conquistas (AchievementModal.vue)
- [ ] Modal de Level Up (LevelUpModal.vue)
- [ ] Centro de Notificações (NotificationCenter.vue)
- [ ] Badge de notificações não lidas

---

## 📂 ARQUIVOS PARA MODIFICAR

### **Backend**
1. ✅ `src/services/socketService.js` - CRIADO
2. ⏳ `src/services/achievementsService.js` - PRECISA ATUALIZAR
3. ⏳ `src/services/pointsService.js` - PRECISA ENCONTRAR E ATUALIZAR
4. ✅ `src/routes/creditsRoutes.js` - PARCIALMENTE ATUALIZADO
5. ⏳ `src/routes/toolsRoutes.js` - PRECISA ATUALIZAR
6. ⏳ `src/routes/subscriptionRoutes.js` - PRECISA ATUALIZAR
7. ⏳ `src/routes/adminRoutes.js` - PRECISA ATUALIZAR

### **Frontend**
1. ✅ `src/composables/useSocket.js` - CRIADO
2. ✅ `src/App.vue` - ATUALIZADO
3. ⏳ `src/pages/dashboard/MinhasAtividades.vue` - ADICIONAR MODAL
4. ⏳ `src/components/achievements/AchievementModal.vue` - CRIAR
5. ⏳ `src/components/achievements/LevelUpModal.vue` - CRIAR
6. ⏳ `src/components/notifications/NotificationCenter.vue` - CRIAR
7. ⏳ `src/stores/notifications.js` - CRIAR

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Concluir auditoria
2. ⏳ Implementar Fase 1 (Achievements)
3. ⏳ Implementar Fase 2 (Tools)
4. ⏳ Implementar Fase 3 (Subscription)
5. ⏳ Implementar Fase 4 (Admin)
6. ⏳ Implementar Fase 5 (Frontend)

---

**Status:** Auditoria completa. Pronto para implementação.
