/**
 * ============================================
 * 💎 SUBSCRIPTION SERVICE - V7
 * ============================================
 * Lógica de negócio para sistema de assinaturas Pro
 * ============================================
 */

import { supabase, supabaseAdmin } from '../config/supabase.js';
import logger from '../config/logger.js';

/**
 * Listar todos os planos disponíveis
 */
export async function getPlans() {
    try {
        const { data, error } = await supabase
            .from('economy_subscription_plans')
            .select('*')
            .eq('is_active', true)
            .order('price_brl', { ascending: true });

        if (error) {
            return { data: null, error };
        }

        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
}

/**
 * Verificar se usuário é PRO (tem assinatura ativa)
 */
export async function isPro(userId) {
    try {
        const { data } = await supabase
            .from('economy_subscriptions')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'active')
            .gte('end_date', new Date().toISOString())
            .single();

        return !!data;
    } catch (error) {
        return false;
    }
}

/**
 * Obter assinatura ativa do usuário
 */
export async function getActiveSubscription(userId) {
    try {
        const { data, error } = await supabase
            .from('economy_subscriptions')
            .select(`
                *,
                economy_subscription_plans (
                    name,
                    slug,
                    price_brl,
                    billing_period,
                    features
                )
            `)
            .eq('user_id', userId)
            .eq('status', 'active')
            .gte('end_date', new Date().toISOString())
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No rows returned
                return { data: null, error: new Error('No active subscription') };
            }
            return { data: null, error };
        }

        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
}

/**
 * Criar nova assinatura
 * (Chamado após pagamento confirmado pelo Stripe)
 */
export async function createSubscription(userId, planSlug, paymentData = {}) {
    try {
        // Buscar plano
        const { data: plan } = await supabase
            .from('economy_subscription_plans')
            .select('*')
            .eq('slug', planSlug)
            .eq('is_active', true)
            .single();

        if (!plan) {
            return { data: null, error: new Error('Plano não encontrado') };
        }

        // Calcular datas
        const startDate = new Date();
        const endDate = new Date();
        
        if (plan.billing_period === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
        } else if (plan.billing_period === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }

        // Criar assinatura
        const { data, error } = await supabaseAdmin
            .from('economy_subscriptions')
            .insert({
                user_id: userId,
                plan_id: plan.id,
                status: 'active',
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                stripe_subscription_id: paymentData.stripeSubscriptionId,
                stripe_customer_id: paymentData.stripeCustomerId
            })
            .select()
            .single();

        if (error) {
            return { data: null, error };
        }

        // TODO: Dar pontos bônus de boas-vindas (se configurado)

        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
}

/**
 * Cancelar assinatura
 * (Mantém ativa até data de expiração)
 */
export async function cancelSubscription(userId) {
    try {
        const { data, error } = await supabaseAdmin
            .from('economy_subscriptions')
            .update({
                status: 'canceled',
                canceled_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('status', 'active')
            .select()
            .single();

        if (error) {
            return { data: null, error };
        }

        // TODO: Cancelar no Stripe também

        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
}

/**
 * Processar mesada semanal para usuários PRO
 * (Executar via cron toda segunda-feira 00:00)
 */
export async function processWeeklyAllowance() {
    try {
        // Buscar todas assinaturas ativas
        const { data: activeSubscriptions } = await supabase
            .from('economy_subscriptions')
            .select('user_id, plan_id')
            .eq('status', 'active')
            .gte('end_date', new Date().toISOString());

        if (!activeSubscriptions || activeSubscriptions.length === 0) {
            return { processed: 0, error: null };
        }

        let processed = 0;

        for (const subscription of activeSubscriptions) {
            // TODO: Chamar pointsService.addBonusPoints() com 20 pontos
            // await addBonusPoints(subscription.user_id, 20, {
            //     type: 'bonus',
            //     description: 'Mesada semanal PRO',
            //     source: 'weekly_allowance'
            // });
            
            logger.info('Mesada semanal PRO processada', { userId: subscription.user_id, bonusPoints: 20 });
            processed++;
        }

        return { processed, error: null };
    } catch (error) {
        return { processed: 0, error };
    }
}

/**
 * Expirar assinaturas vencidas
 * (Executar via cron diariamente às 03:00)
 */
export async function expireSubscriptions() {
    try {
        const { data, error } = await supabaseAdmin
            .from('economy_subscriptions')
            .update({ status: 'expired' })
            .eq('status', 'active')
            .lt('end_date', new Date().toISOString())
            .select();

        if (error) {
            return { expired: 0, error };
        }

        return { expired: data?.length || 0, error: null };
    } catch (error) {
        return { expired: 0, error };
    }
}

/**
 * Obter histórico de assinaturas do usuário
 */
export async function getSubscriptionHistory(userId) {
    try {
        const { data, error } = await supabase
            .from('economy_subscriptions')
            .select(`
                *,
                economy_subscription_plans (
                    name,
                    price_brl,
                    billing_period
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            return { data: null, error };
        }

        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
}

/**
 * Processar webhook do Stripe
 * (Chamado quando Stripe envia eventos)
 */
export async function handleStripeWebhook(event) {
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                // Pagamento inicial confirmado
                const session = event.data.object;
                // TODO: Criar assinatura no banco
                break;

            case 'invoice.paid':
                // Renovação paga
                const invoice = event.data.object;
                // TODO: Renovar assinatura
                break;

            case 'customer.subscription.deleted':
                // Assinatura cancelada
                const subscription = event.data.object;
                // TODO: Marcar como cancelada
                break;

            default:
                logger.info('Evento Stripe não tratado', { eventType: event.type });
        }

        return { success: true, error: null };
    } catch (error) {
        return { success: false, error };
    }
}
