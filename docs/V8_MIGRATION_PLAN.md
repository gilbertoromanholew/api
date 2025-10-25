# 🚀 PLANO DE MIGRAÇÃO V7 → V8

**Data:** 25/10/2025  
**Objetivo:** Atualização completa do sistema com limpeza de código legado, otimizações e correções

---

## 📊 ANÁLISE DO ESTADO ATUAL (V7)

### ✅ **O que está FUNCIONANDO**
- [x] Banco de dados: 22 tabelas com 100% RLS
- [x] Sistema de autenticação
- [x] Sistema de perfis com CPF
- [x] Sistema de créditos/pontos (carteira)
- [x] Sistema de referência (referral codes)
- [x] Catálogo de ferramentas (15 tools)
- [x] Audit logs (auth + operations)
- [x] Gamificação (conquistas, leaderboards, streaks)
- [x] Códigos promocionais (3 códigos seed)

### ⚠️ **O que está INCOMPLETO**
- [ ] **Stripe integration** - estrutura existe mas não implementada
- [ ] **economy_subscriptions** - tabela LEGADA (não usar!)
- [ ] **subscriptions** - tabela NOVA mas sem uso real
- [ ] **Webhooks Stripe** - TODOs pendentes
- [ ] **Weekly allowance cron job** - não configurado
- [ ] **Expire subscriptions cron job** - não configurado

### ❌ **O que está DUPLICADO/DESNECESSÁRIO**
- Arquivo `subscription.routes.js` (CommonJS)
- Arquivo `subscriptionRoutes.js` (ES6)  
  → **DOIS ARQUIVOS** fazendo a mesma coisa!

- `economy_subscriptions` (tabela legada)
- `subscriptions` (tabela nova)  
  → **DUAS TABELAS** de assinatura!

- `points_used` vs `cost_in_points` em `tools_executions`  
  → Podem estar duplicados!

---

## 🎯 OBJETIVOS DA V8

### 1️⃣ **LIMPEZA E CONSOLIDAÇÃO**
- ✅ Remover arquivos duplicados
- ✅ Remover código comentado desnecessário
- ✅ Padronizar ES6 em TODO o projeto
- ✅ Consolidar rotas subscription (deixar só 1 arquivo)
- ✅ Deprecar `economy_subscriptions` (usar só `subscriptions`)

### 2️⃣ **CORREÇÕES E OTIMIZAÇÕES**
- ✅ Corrigir TODOS os `table_name` (remover prefixos `economy.`, `gamification.`, etc.)
- ✅ Padronizar queries Supabase
- ✅ Adicionar validações faltantes
- ✅ Melhorar error handling
- ✅ Adicionar logs estruturados

### 3️⃣ **FEATURES COMPLETAS**
- ✅ Implementar Stripe 100% (checkout + webhooks)
- ✅ Configurar cron jobs (allowance + expire)
- ✅ Integração real frontend ↔ backend
- ✅ Testes de ponta a ponta

### 4️⃣ **DOCUMENTAÇÃO**
- ✅ Atualizar README
- ✅ Documentar API endpoints
- ✅ Guia de deploy
- ✅ Changelog V8

---

## 📝 CHECKLIST DETALHADO

### 🗂️ **FASE 1: LIMPEZA (1-2 dias)**

#### Backend - Arquivos Duplicados
- [ ] **DECISÃO:** Qual arquivo subscription manter?
  - `src/routes/subscription.routes.js` (CommonJS) → ❌ DELETAR
  - `dist-api/src/routes/subscriptionRoutes.js` (ES6) → ✅ MANTER
  
- [ ] **AÇÃO:** Deletar arquivos duplicados
  ```bash
  # Comandos a executar:
  rm src/routes/subscription.routes.js
  rm src/controllers/subscriptionController.js (CommonJS)
  # Manter apenas dist-api/src/*
  ```

#### Backend - Código Comentado
- [ ] Revisar TODOS os TODOs e decidir:
  - Implementar agora?
  - Mover para backlog?
  - Deletar se obsoleto?

- [ ] Remover comentários antigos/inúteis

#### Database - Tabelas Legadas
- [ ] **DEPRECAR:** `economy_subscriptions`
  - Adicionar comentário SQL: "DEPRECATED: Use 'subscriptions' instead"
  - NÃO deletar (pode ter dados históricos)
  - Criar migration para migrar dados se necessário

- [ ] **VERIFICAR:** `economy.` prefix nas queries
  ```sql
  -- ERRADO (V7):
  FROM 'economy.subscriptions'
  
  -- CERTO (V8):
  FROM 'subscriptions'
  ```

#### Frontend - Componentes Não Usados
- [ ] **AUDITORIA:** Buscar componentes sem import
  ```bash
  # Buscar arquivos .vue sem referência
  # Verificar se estão sendo usados no router
  ```

- [ ] **DECISION LIST:**
  - Dashboard vazio? → Criar ou deletar
  - Modais antigos? → Atualizar ou remover

---

### 🔧 **FASE 2: CORREÇÕES (2-3 dias)**

#### 2.1 - Correção de Queries do Banco

**Arquivo:** `dist-api/src/services/subscriptionService.js`

**ANTES (V7):**
```javascript
const { data, error } = await supabase
    .from('economy.subscriptions')  // ❌ ERRADO
    .select('*')
```

**DEPOIS (V8):**
```javascript
const { data, error } = await supabase
    .from('subscriptions')  // ✅ CORRETO
    .select('*')
```

**Arquivos a corrigir:**
- [ ] `dist-api/src/services/subscriptionService.js` (4 queries)
- [ ] `src/services/subscriptionService.js` (se mantido)
- [ ] `dist-api/src/services/pointsService.js` (verificar se usa `economy.*`)

---

#### 2.2 - Padronização de Erros

**Criar:** `dist-api/src/utils/errors.js`

```javascript
export class APIError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.timestamp = new Date().toISOString();
  }
}

export class ValidationError extends APIError {
  constructor(message, field = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
  }
}

export class NotFoundError extends APIError {
  constructor(resource) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.resource = resource;
  }
}

export class UnauthorizedError extends APIError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends APIError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}
```

**Uso:**
```javascript
// ANTES (V7)
if (!userId) {
  return res.status(401).json({
    success: false,
    error: 'Usuário não autenticado'
  });
}

// DEPOIS (V8)
import { UnauthorizedError } from '../utils/errors.js';

if (!userId) {
  throw new UnauthorizedError('Usuário não autenticado');
}
```

---

#### 2.3 - Logs Estruturados

**Criar:** `dist-api/src/utils/logger.js`

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'tools-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export default logger;
```

**Uso:**
```javascript
// ANTES (V7)
console.log('Usuário autenticado:', userId);
console.error('Erro ao buscar assinatura:', error);

// DEPOIS (V8)
import logger from '../utils/logger.js';

logger.info('Usuário autenticado', { userId });
logger.error('Erro ao buscar assinatura', { error, userId });
```

---

#### 2.4 - Validações com Joi

**Instalar:**
```bash
npm install joi
```

**Criar:** `dist-api/src/validators/subscription.validators.js`

```javascript
import Joi from 'joi';

export const createCheckoutSchema = Joi.object({
  planSlug: Joi.string().required().valid('pro'),
  returnUrl: Joi.string().uri().optional(),
});

export const webhookSchema = Joi.object({
  type: Joi.string().required(),
  data: Joi.object().required(),
});
```

**Usar nos routes:**
```javascript
import { validate } from '../middlewares/validator.js';
import { createCheckoutSchema } from '../validators/subscription.validators.js';

router.post(
  '/checkout',
  requireAuth,
  validate(createCheckoutSchema),
  async (req, res) => {
    // Request já validado!
  }
);
```

---

### 💳 **FASE 3: IMPLEMENTAR STRIPE (3-4 dias)**

#### 3.1 - Setup Inicial

**Instalar:**
```bash
npm install stripe
```

**Criar:** `dist-api/src/config/stripe.js`

```javascript
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY não configurada!');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export const STRIPE_CONFIG = {
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  proPriceId: process.env.STRIPE_PRO_PRICE_ID,  // price_xxx da conta Stripe
  successUrl: process.env.FRONTEND_URL + '/dashboard?checkout=success',
  cancelUrl: process.env.FRONTEND_URL + '/planos?checkout=canceled',
};
```

**Variáveis de ambiente (.env):**
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRO_PRICE_ID=price_xxxxx

# Frontend
FRONTEND_URL=http://localhost:5173
```

---

#### 3.2 - Implementar Checkout

**Atualizar:** `dist-api/src/services/subscriptionService.js`

```javascript
import { stripe, STRIPE_CONFIG } from '../config/stripe.js';

export async function createCheckoutSession(userId, planSlug) {
  try {
    // 1. Buscar plano
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('slug', planSlug)
      .eq('is_active', true)
      .single();

    if (!plan) {
      throw new NotFoundError('Plano');
    }

    // 2. Buscar dados do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    // 3. Criar sessão Stripe
    const session = await stripe.checkout.sessions.create({
      customer_email: profile.email,
      client_reference_id: userId,  // Para identificar no webhook
      line_items: [
        {
          price: STRIPE_CONFIG.proPriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: STRIPE_CONFIG.successUrl,
      cancel_url: STRIPE_CONFIG.cancelUrl,
      metadata: {
        user_id: userId,
        plan_slug: planSlug,
      },
    });

    return { data: session, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
```

---

#### 3.3 - Implementar Webhooks

**Atualizar:** `dist-api/src/services/subscriptionService.js`

```javascript
export async function handleStripeWebhook(event) {
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.user_id;
        const planSlug = session.metadata.plan_slug;

        // Criar assinatura no banco
        await createSubscription(userId, planSlug, {
          stripeSubscriptionId: session.subscription,
          stripeCustomerId: session.customer,
        });

        logger.info('Assinatura criada via Stripe', { userId, session: session.id });
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const userId = invoice.metadata?.user_id;

        if (userId) {
          // Renovar assinatura
          await renewSubscription(userId);
          logger.info('Assinatura renovada', { userId, invoice: invoice.id });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.user_id;

        if (userId) {
          // Marcar assinatura como expirada
          await expireUserSubscription(userId);
          logger.info('Assinatura expirada', { userId, subscription: subscription.id });
        }
        break;
      }

      default:
        logger.warn(`Unhandled Stripe event type: ${event.type}`);
    }

    return { success: true, error: null };
  } catch (error) {
    logger.error('Erro ao processar webhook Stripe', { error, event });
    return { success: false, error };
  }
}
```

**Atualizar:** `dist-api/src/routes/subscriptionRoutes.js`

```javascript
import express from 'express';
import { stripe, STRIPE_CONFIG } from '../config/stripe.js';

router.post(
  '/webhook/stripe',
  express.raw({ type: 'application/json' }),  // ⚠️ IMPORTANTE: raw body!
  async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
      // Validar assinatura Stripe
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        STRIPE_CONFIG.webhookSecret
      );

      await subscriptionService.handleStripeWebhook(event);

      res.json({ received: true });
    } catch (err) {
      logger.error('Webhook error', { error: err.message });
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);
```

---

#### 3.4 - Configurar Stripe CLI (para testes locais)

**Instalar Stripe CLI:**
```bash
# Windows (PowerShell)
winget install stripe/stripe-cli

# macOS
brew install stripe/stripe-cli/stripe

# Login
stripe login
```

**Escutar webhooks localmente:**
```bash
stripe listen --forward-to localhost:3000/api/subscription/webhook/stripe

# Copiar o webhook secret que aparece:
# whsec_xxxxx
# Adicionar no .env como STRIPE_WEBHOOK_SECRET
```

**Testar webhook:**
```bash
stripe trigger checkout.session.completed
stripe trigger invoice.paid
stripe trigger customer.subscription.deleted
```

---

### 🔄 **FASE 4: CRON JOBS (1 dia)**

#### 4.1 - Weekly Allowance

**Criar:** `dist-api/src/jobs/weeklyAllowance.js`

```javascript
import { supabase, supabaseAdmin } from '../config/supabase.js';
import logger from '../utils/logger.js';

export async function processWeeklyAllowance() {
  logger.info('Iniciando processamento de mesada semanal');

  try {
    // 1. Buscar usuários Pro ativos
    const { data: activeSubscriptions } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString());

    if (!activeSubscriptions || activeSubscriptions.length === 0) {
      logger.info('Nenhuma assinatura ativa encontrada');
      return;
    }

    logger.info(`Processando ${activeSubscriptions.length} assinaturas`);

    // 2. Para cada usuário Pro, adicionar 20 créditos bônus
    for (const sub of activeSubscriptions) {
      const userId = sub.user_id;

      // Buscar wallet
      const { data: wallet } = await supabase
        .from('economy_user_wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!wallet) continue;

      // Adicionar 20 pontos bônus
      await supabaseAdmin
        .from('economy_user_wallets')
        .update({
          bonus_credits: wallet.bonus_credits + 20,
          total_earned_bonus: wallet.total_earned_bonus + 20,
          pro_weekly_allowance: 20,
          last_allowance_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      // Registrar transação
      await supabaseAdmin
        .from('economy_transactions')
        .insert({
          user_id: userId,
          amount: 20,
          balance_before: wallet.bonus_credits,
          balance_after: wallet.bonus_credits + 20,
          description: 'Mesada semanal Pro',
          metadata: {
            type: 'weekly_allowance',
            date: new Date().toISOString(),
          },
        });

      logger.info(`Mesada concedida para usuário ${userId}`);
    }

    logger.info('Processamento de mesada semanal concluído');
  } catch (error) {
    logger.error('Erro ao processar mesada semanal', { error });
    throw error;
  }
}
```

**Configurar com node-cron:**

```bash
npm install node-cron
```

**Criar:** `dist-api/src/jobs/scheduler.js`

```javascript
import cron from 'node-cron';
import { processWeeklyAllowance } from './weeklyAllowance.js';
import { expireSubscriptions } from './expireSubscriptions.js';
import logger from '../utils/logger.js';

export function startScheduler() {
  // Toda segunda-feira às 00:00
  cron.schedule('0 0 * * 1', async () => {
    logger.info('Executando cron job: Weekly Allowance');
    try {
      await processWeeklyAllowance();
    } catch (error) {
      logger.error('Erro no cron job Weekly Allowance', { error });
    }
  });

  // Todo dia às 01:00
  cron.schedule('0 1 * * *', async () => {
    logger.info('Executando cron job: Expire Subscriptions');
    try {
      await expireSubscriptions();
    } catch (error) {
      logger.error('Erro no cron job Expire Subscriptions', { error });
    }
  });

  logger.info('Scheduler iniciado');
}
```

**Chamar no server.js:**

```javascript
import { startScheduler } from './jobs/scheduler.js';

// ...após iniciar servidor
startScheduler();
```

---

#### 4.2 - Expire Subscriptions

**Criar:** `dist-api/src/jobs/expireSubscriptions.js`

```javascript
import { supabase, supabaseAdmin } from '../config/supabase.js';
import logger from '../utils/logger.js';

export async function expireSubscriptions() {
  logger.info('Iniciando expiração de assinaturas');

  try {
    const now = new Date().toISOString();

    // Buscar assinaturas ativas mas expiradas
    const { data: expiredSubs } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'active')
      .lt('end_date', now);

    if (!expiredSubs || expiredSubs.length === 0) {
      logger.info('Nenhuma assinatura expirada encontrada');
      return;
    }

    logger.info(`Expirando ${expiredSubs.length} assinaturas`);

    // Marcar como expiradas
    for (const sub of expiredSubs) {
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'expired',
          updated_at: now,
        })
        .eq('id', sub.id);

      logger.info(`Assinatura expirada: ${sub.id} (usuário: ${sub.user_id})`);
    }

    logger.info('Expiração de assinaturas concluída');
  } catch (error) {
    logger.error('Erro ao expirar assinaturas', { error });
    throw error;
  }
}
```

---

### 🎨 **FASE 5: FRONTEND (2-3 dias)**

#### 5.1 - Service de Subscription

**Criar/Atualizar:** `tools-website-builder/src/services/subscription.js`

```javascript
import { supabaseClient } from './supabase';

export const subscriptionService = {
  /**
   * Listar planos disponíveis
   */
  async getPlans() {
    const response = await fetch('/api/subscription/plans');
    return response.json();
  },

  /**
   * Obter status da assinatura
   */
  async getStatus() {
    const response = await fetch('/api/subscription/status', {
      headers: {
        'Authorization': `Bearer ${supabaseClient.auth.session()?.access_token}`,
      },
    });
    return response.json();
  },

  /**
   * Criar checkout Stripe
   */
  async createCheckout(planSlug) {
    const response = await fetch('/api/subscription/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseClient.auth.session()?.access_token}`,
      },
      body: JSON.stringify({ planSlug }),
    });
    
    const data = await response.json();
    
    // Redirecionar para Stripe Checkout
    if (data.success && data.data?.url) {
      window.location.href = data.data.url;
    }
    
    return data;
  },

  /**
   * Cancelar assinatura
   */
  async cancel() {
    const response = await fetch('/api/subscription/cancel', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseClient.auth.session()?.access_token}`,
      },
    });
    return response.json();
  },
};
```

---

#### 5.2 - Componente de Planos

**Atualizar:** `tools-website-builder/src/pages/Planos.vue` (ou criar)

```vue
<template>
  <div class="planos-page">
    <h1>Planos e Preços</h1>
    
    <!-- Loading -->
    <div v-if="loading" class="loading">
      <Loader />
    </div>

    <!-- Planos -->
    <div v-else class="plans-grid">
      <div 
        v-for="plan in plans" 
        :key="plan.id"
        class="plan-card"
        :class="{ featured: plan.slug === 'pro' }"
      >
        <h3>{{ plan.name }}</h3>
        <div class="price">
          R$ {{ formatPrice(plan.price_brl) }}
          <span class="period">/{{ translatePeriod(plan.billing_period) }}</span>
        </div>
        
        <ul class="features">
          <li v-for="(feature, index) in plan.features.list" :key="index">
            {{ feature }}
          </li>
        </ul>

        <Button 
          @click="subscribe(plan.slug)"
          :loading="subscribing === plan.slug"
          :disabled="currentPlan === plan.slug"
        >
          {{ currentPlan === plan.slug ? 'Plano Atual' : 'Assinar Agora' }}
        </Button>
      </div>
    </div>

    <!-- Success/Cancel Messages -->
    <Notification 
      v-if="checkoutStatus"
      :type="checkoutStatus"
      :message="checkoutMessage"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { subscriptionService } from '@/services/subscription';
import { useNotification } from '@/composables/useNotification';

const loading = ref(true);
const plans = ref([]);
const subscribing = ref(null);
const currentPlan = ref(null);
const checkoutStatus = ref(null);
const checkoutMessage = ref('');

const { showSuccess, showError } = useNotification();

onMounted(async () => {
  // Verificar query params (retorno do Stripe)
  const urlParams = new URLSearchParams(window.location.search);
  const checkout = urlParams.get('checkout');
  
  if (checkout === 'success') {
    checkoutStatus.value = 'success';
    checkoutMessage.value = 'Pagamento confirmado! Bem-vindo ao Pro 🎉';
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 3000);
  } else if (checkout === 'canceled') {
    checkoutStatus.value = 'warning';
    checkoutMessage.value = 'Checkout cancelado. Tente novamente quando quiser!';
  }

  // Carregar planos
  await loadPlans();
  await loadCurrentStatus();
});

async function loadPlans() {
  try {
    const response = await subscriptionService.getPlans();
    if (response.success) {
      plans.value = response.data.plans;
    }
  } catch (error) {
    showError('Erro ao carregar planos');
  } finally {
    loading.value = false;
  }
}

async function loadCurrentStatus() {
  try {
    const response = await subscriptionService.getStatus();
    if (response.success && response.data.subscription) {
      currentPlan.value = response.data.subscription.subscription_plans?.slug;
    }
  } catch (error) {
    // User não autenticado ou sem assinatura
  }
}

async function subscribe(planSlug) {
  subscribing.value = planSlug;
  
  try {
    await subscriptionService.createCheckout(planSlug);
    // Redireciona automático no service
  } catch (error) {
    showError('Erro ao iniciar checkout. Tente novamente.');
  } finally {
    subscribing.value = null;
  }
}

function formatPrice(price) {
  return Number(price).toFixed(2).replace('.', ',');
}

function translatePeriod(period) {
  return period === 'monthly' ? 'mês' : 'ano';
}
</script>

<style scoped>
.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.plan-card {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.plan-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.plan-card.featured {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
}

.price {
  font-size: 3rem;
  font-weight: bold;
  margin: 1rem 0;
}

.period {
  font-size: 1rem;
  opacity: 0.8;
}

.features {
  list-style: none;
  padding: 0;
  margin: 2rem 0;
  text-align: left;
}

.features li {
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.features li::before {
  content: '✓ ';
  color: #10b981;
  font-weight: bold;
  margin-right: 0.5rem;
}
</style>
```

---

### 📦 **FASE 6: TESTES E DEPLOY (2 dias)**

#### 6.1 - Testes Manuais

**Checklist de Testes:**

- [ ] **Autenticação**
  - Login/Logout
  - Registro
  - Verificação de email

- [ ] **Perfil**
  - Visualizar perfil
  - Editar dados
  - Ver código de referência

- [ ] **Créditos**
  - Ver saldo
  - Usar ferramenta (consumir créditos)
  - Ver histórico

- [ ] **Assinatura Pro**
  - Ver planos
  - Iniciar checkout Stripe
  - Pagar com cartão de teste
  - Verificar status Pro ativado
  - Receber mesada semanal (testar cron)
  - Cancelar assinatura
  - Verificar expiração

- [ ] **Códigos Promocionais**
  - Validar código
  - Resgatar créditos
  - Verificar limite de uso

- [ ] **Gamificação**
  - Desbloquear conquista
  - Ver leaderboard
  - Manter streak

---

#### 6.2 - Deploy

**1. Atualizar variáveis de ambiente PRODUÇÃO:**

```env
# Supabase
SUPABASE_URL=https://mpanel.samm.host
SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Stripe (PRODUÇÃO)
STRIPE_SECRET_KEY=sk_live_xxxxx  # ⚠️ NÃO USAR sk_test_ em produção!
STRIPE_WEBHOOK_SECRET=whsec_live_xxxxx
STRIPE_PRO_PRICE_ID=price_xxxxx  # Price ID de produção

# Frontend
FRONTEND_URL=https://tools.samm.host
```

**2. Configurar webhook Stripe PRODUÇÃO:**

- Acessar https://dashboard.stripe.com/webhooks
- Adicionar endpoint: `https://api.tools.samm.host/api/subscription/webhook/stripe`
- Eventos:
  - `checkout.session.completed`
  - `invoice.paid`
  - `customer.subscription.deleted`
- Copiar webhook secret → `.env`

**3. Deploy Backend:**

```bash
cd api
npm install
npm run build  # Se tiver build step
pm2 restart tools-api  # Ou comando do seu servidor
```

**4. Deploy Frontend:**

```bash
cd tools-website-builder
npm install
npm run build
# Fazer deploy da pasta dist/ para servidor
```

---

## 🗂️ **ESTRUTURA FINAL V8**

```
api/
├── dist-api/
│   ├── src/
│   │   ├── config/
│   │   │   ├── supabase.js
│   │   │   └── stripe.js ✨ NOVO
│   │   ├── controllers/
│   │   │   └── (removidos, controllers agora estão nos routes)
│   │   ├── services/
│   │   │   ├── subscriptionService.js ✅ ATUALIZADO
│   │   │   ├── pointsService.js ✅ ATUALIZADO
│   │   │   └── referralService.js
│   │   ├── routes/
│   │   │   ├── subscriptionRoutes.js ✅ CONSOLIDADO
│   │   │   ├── pointsRoutes.js
│   │   │   └── referralRoutes.js
│   │   ├── middlewares/
│   │   │   ├── auth.js
│   │   │   └── validator.js ✨ NOVO
│   │   ├── jobs/ ✨ NOVO
│   │   │   ├── weeklyAllowance.js
│   │   │   ├── expireSubscriptions.js
│   │   │   └── scheduler.js
│   │   ├── utils/ ✨ NOVO
│   │   │   ├── errors.js
│   │   │   └── logger.js
│   │   └── validators/ ✨ NOVO
│   │       └── subscription.validators.js
│   └── server.js ✅ ATUALIZADO (inicia scheduler)
├── src/ ❌ DEPRECATED (deletar após migração)
└── docs/
    ├── V8_MIGRATION.md ✨ ESTE ARQUIVO
    └── V8_CHANGELOG.md ✨ NOVO

tools-website-builder/
├── src/
│   ├── services/
│   │   ├── subscription.js ✨ NOVO
│   │   └── supabase.js
│   ├── pages/
│   │   ├── Planos.vue ✅ ATUALIZADO
│   │   └── dashboard/
│   │       └── MinhaConta.vue ✅ ATUALIZADO
│   └── composables/
│       └── useSubscription.js ✨ NOVO
```

---

## 📋 **DEPENDÊNCIAS A INSTALAR**

```bash
# Backend
npm install stripe
npm install node-cron
npm install winston
npm install joi

# Frontend
# Nenhuma nova (usar as existentes)
```

---

## ⏱️ **TIMELINE ESTIMADO**

| Fase | Descrição | Duração |
|------|-----------|---------|
| **FASE 1** | Limpeza e consolidação | 1-2 dias |
| **FASE 2** | Correções e otimizações | 2-3 dias |
| **FASE 3** | Implementar Stripe | 3-4 dias |
| **FASE 4** | Cron Jobs | 1 dia |
| **FASE 5** | Frontend | 2-3 dias |
| **FASE 6** | Testes e Deploy | 2 dias |
| **TOTAL** | | **11-15 dias** |

---

## ✅ **CRITÉRIOS DE SUCESSO V8**

- [ ] **Zero** arquivos duplicados
- [ ] **100%** queries Supabase sem prefixos incorretos
- [ ] **Stripe** 100% funcional (checkout + webhooks)
- [ ] **Cron jobs** rodando (weekly allowance + expire)
- [ ] **Frontend** integrado com backend real
- [ ] **Testes** passando em todos os fluxos críticos
- [ ] **Documentação** atualizada
- [ ] **Deploy** em produção sem erros

---

## 🎯 **PRÓXIMOS PASSOS IMEDIATOS**

1. **APROVAR** este plano de migração
2. **CRIAR BRANCH** `feature/v8-migration`
3. **COMEÇAR FASE 1** - Limpeza de código
4. **PR INCREMENTAL** - Não fazer tudo de uma vez!

Quer que eu comece implementando alguma fase específica? 🚀
