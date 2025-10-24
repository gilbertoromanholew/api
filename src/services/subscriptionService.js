import { supabase, supabaseAdmin } from '../config/supabase.js';
import { addBonusPoints } from './pointsService.js';

/**
 * Service de Assinaturas
 * Lógica de negócio para planos Pro
 * 
 * NOTA: Integração com Stripe será feita posteriormente
 * Este service prepara a estrutura para quando o Stripe for configurado
 */

/**
 * Verificar se usuário tem assinatura Pro ativa
 */
export async function isPro(userId) {
    const { data, error } = await supabase
        .from('economy.subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .single();
    
    return !!data;
}

/**
 * Obter assinatura ativa do usuário
 */
export async function getActiveSubscription(userId) {
    const { data, error } = await supabase
        .from('economy.subscriptions')
        .select(`
            *,
            plan:plan_id (
                name,
                slug,
                description,
                price_brl,
                billing_period,
                features
            )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .single();
    
    if (error || !data) {
        return null;
    }
    
    return data;
}

/**
 * Listar planos disponíveis
 */
export async function getAvailablePlans() {
    const { data, error } = await supabase
        .from('economy.subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
    
    if (error) {
        throw new Error('Erro ao buscar planos');
    }
    
    return data;
}

/**
 * Criar assinatura (chamado após confirmação de pagamento do Stripe)
 * 
 * @param {string} userId - ID do usuário
 * @param {string} planSlug - Slug do plano ('pro')
 * @param {object} paymentData - Dados do pagamento do Stripe
 * @returns {object} Assinatura criada
 */
export async function createSubscription(userId, planSlug, paymentData = {}) {
    // Buscar plano
    const { data: plan, error: planError } = await supabase
        .from('economy.subscription_plans')
        .select('*')
        .eq('slug', planSlug)
        .eq('is_active', true)
        .single();
    
    if (planError || !plan) {
        throw new Error('Plano não encontrado');
    }
    
    // Verificar se já tem assinatura ativa
    const existingSubscription = await getActiveSubscription(userId);
    if (existingSubscription) {
        throw new Error('Usuário já possui assinatura ativa');
    }
    
    // Calcular data de expiração (1 mês)
    const expiresAt = new Date();
    if (plan.billing_period === 'monthly') {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else if (plan.billing_period === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }
    
    // Criar assinatura
    const { data: subscription, error } = await supabaseAdmin
        .from('economy.subscriptions')
        .insert({
            user_id: userId,
            plan_id: plan.id,
            status: 'active',
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            stripe_subscription_id: paymentData.stripe_subscription_id || null,
            stripe_customer_id: paymentData.stripe_customer_id || null
        })
        .select()
        .single();
    
    if (error) {
        throw new Error('Erro ao criar assinatura');
    }
    
    // Dar bônus de boas-vindas (opcional)
    // await addBonusPoints(userId, 50, {
    //     type: 'bonus',
    //     description: 'Bônus de boas-vindas Pro',
    //     source: 'subscription_welcome'
    // });
    
    return subscription;
}

/**
 * Cancelar assinatura (mantém ativa até o fim do período pago)
 */
export async function cancelSubscription(userId, reason = null) {
    const subscription = await getActiveSubscription(userId);
    
    if (!subscription) {
        throw new Error('Usuário não possui assinatura ativa');
    }
    
    // Atualizar status para 'canceled'
    // Assinatura continua ativa até expires_at
    const { data, error } = await supabaseAdmin
        .from('economy.subscriptions')
        .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            cancellation_reason: reason
        })
        .eq('id', subscription.id)
        .select()
        .single();
    
    if (error) {
        throw new Error('Erro ao cancelar assinatura');
    }
    
    // TODO: Cancelar no Stripe também (quando integrado)
    // await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
    
    return data;
}

/**
 * Renovar assinatura (chamado por webhook do Stripe)
 */
export async function renewSubscription(userId, paymentData = {}) {
    const subscription = await getActiveSubscription(userId);
    
    if (!subscription) {
        throw new Error('Assinatura não encontrada');
    }
    
    // Estender expiração por mais 1 mês
    const newExpiresAt = new Date(subscription.expires_at);
    newExpiresAt.setMonth(newExpiresAt.getMonth() + 1);
    
    const { data, error } = await supabaseAdmin
        .from('economy.subscriptions')
        .update({
            expires_at: newExpiresAt.toISOString(),
            status: 'active', // Reativar se estava cancelada
            last_payment_at: new Date().toISOString()
        })
        .eq('id', subscription.id)
        .select()
        .single();
    
    if (error) {
        throw new Error('Erro ao renovar assinatura');
    }
    
    return data;
}

/**
 * Processar mesada semanal (20 pontos bônus para usuários Pro)
 * Deve ser executado por um cron job semanal
 */
export async function processWeeklyAllowance() {
    // Buscar todas as assinaturas ativas
    const { data: subscriptions, error } = await supabase
        .from('economy.subscriptions')
        .select('user_id')
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString());
    
    if (error || !subscriptions) {
        console.error('[Subscriptions] Error fetching active subscriptions:', error);
        return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const sub of subscriptions) {
        try {
            await addBonusPoints(sub.user_id, 20, {
                type: 'subscription',
                description: 'Mesada semanal Pro',
                source: 'weekly_allowance'
            });
            successCount++;
        } catch (err) {
            console.error(`[Subscriptions] Error processing allowance for user ${sub.user_id}:`, err);
            errorCount++;
        }
    }
    
    console.log(`[Subscriptions] Weekly allowance processed: ${successCount} success, ${errorCount} errors`);
    
    return { successCount, errorCount, total: subscriptions.length };
}

/**
 * Expirar assinaturas vencidas
 * Deve ser executado por um cron job diário
 */
export async function expireSubscriptions() {
    const { data, error } = await supabaseAdmin
        .from('economy.subscriptions')
        .update({
            status: 'expired'
        })
        .eq('status', 'active')
        .lt('expires_at', new Date().toISOString())
        .select();
    
    if (error) {
        console.error('[Subscriptions] Error expiring subscriptions:', error);
        return { expired: 0 };
    }
    
    console.log(`[Subscriptions] Expired ${data.length} subscriptions`);
    
    return { expired: data.length };
}

/**
 * Obter estatísticas de assinatura do usuário
 */
export async function getSubscriptionStats(userId) {
    const subscription = await getActiveSubscription(userId);
    
    if (!subscription) {
        return {
            is_pro: false,
            subscription: null
        };
    }
    
    const now = new Date();
    const expiresAt = new Date(subscription.expires_at);
    const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
    
    return {
        is_pro: true,
        subscription: {
            plan_name: subscription.plan.name,
            status: subscription.status,
            started_at: subscription.started_at,
            expires_at: subscription.expires_at,
            days_remaining: daysRemaining,
            is_canceled: subscription.status === 'canceled',
            features: subscription.plan.features,
            price: subscription.plan.price_brl
        }
    };
}

/**
 * WEBHOOK: Processar evento do Stripe
 * (A ser implementado quando Stripe for configurado)
 */
export async function handleStripeWebhook(event) {
    // TODO: Implementar quando Stripe for configurado
    
    switch (event.type) {
        case 'customer.subscription.created':
            // Criar assinatura no banco
            break;
            
        case 'customer.subscription.updated':
            // Atualizar assinatura
            break;
            
        case 'customer.subscription.deleted':
            // Expirar assinatura
            break;
            
        case 'invoice.payment_succeeded':
            // Renovar assinatura
            break;
            
        case 'invoice.payment_failed':
            // Suspender assinatura
            break;
            
        default:
            console.log(`[Stripe] Unhandled event type: ${event.type}`);
    }
    
    return { received: true };
}
