/**
 * Promo Codes Service
 * Gerencia códigos promocionais (bônus, PRO trial, descontos)
 */

import { supabase, supabaseAdmin } from '../config/supabase.js';
import { addBonusPoints } from './pointsService.js';

/**
 * Validar código promocional
 * @param {string} code - Código a validar
 * @returns {Promise<{data, error}>}
 */
export async function validatePromoCode(code) {
  try {
    const { data, error } = await supabaseAdmin
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: 'Código inválido ou expirado' };
      }
      return { data: null, error: error.message };
    }

    // Verificar expiração
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      // Marcar como expirado
      await supabaseAdmin
        .from('promo_codes')
        .update({ status: 'expired' })
        .eq('id', data.id);

      return { data: null, error: 'Código expirado' };
    }

    // Verificar limite de usos
    if (data.max_uses && data.used_count >= data.max_uses) {
      return { data: null, error: 'Código esgotado (máximo de usos atingido)' };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Erro ao validar código:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Resgatar código promocional
 * @param {string} userId - ID do usuário
 * @param {string} code - Código a resgatar
 * @returns {Promise<{data, error}>}
 */
export async function redeemPromoCode(userId, code) {
  try {
    // Validar código
    const { data: promoCode, error: validateError } = await validatePromoCode(code);
    if (validateError) {
      return { data: null, error: validateError };
    }

    // Verificar se usuário já usou este código
    const { data: existingRedemption } = await supabaseAdmin
      .from('promo_code_redemptions')
      .select('*')
      .eq('user_id', userId)
      .eq('promo_code_id', promoCode.id)
      .single();

    if (existingRedemption) {
      return { data: null, error: 'Você já utilizou este código' };
    }

    // Processar redenção baseado no tipo
    let creditsAwarded = 0;
    let proDaysAwarded = 0;
    let result = null;

    switch (promoCode.type) {
      case 'BONUS_CREDITS':
        creditsAwarded = promoCode.value;
        
        // ✅ Usar serviço centralizado de pontos
        const bonusResult = await addBonusPoints(userId, creditsAwarded, {
          type: 'promo_code',
          description: `Código promocional: ${code}`,
          promo_code: code
        });

        result = { type: 'credits', amount: creditsAwarded };
        break;

      case 'PRO_TRIAL':
        proDaysAwarded = promoCode.value;
        
        // Calcular data de expiração
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + proDaysAwarded);

        // Verificar se usuário já tem PRO ativo
        const { data: activeSub } = await supabaseAdmin
          .from('economy_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .gte('end_date', new Date().toISOString())
          .single();

        if (activeSub) {
          // Estender assinatura existente
          const currentEndDate = new Date(activeSub.end_date);
          currentEndDate.setDate(currentEndDate.getDate() + proDaysAwarded);
          
          await supabaseAdmin
            .from('economy_subscriptions')
            .update({ end_date: currentEndDate.toISOString() })
            .eq('id', activeSub.id);
        } else {
          // Criar nova assinatura trial
          await supabaseAdmin
            .from('economy_subscriptions')
            .insert({
              user_id: userId,
              plan_slug: 'pro',
              status: 'active',
              start_date: new Date().toISOString(),
              end_date: endDate.toISOString(),
              is_trial: true
            });
        }

        result = { type: 'pro_trial', days: proDaysAwarded };
        break;

      case 'DISCOUNT':
        // TODO: Implementar lógica de desconto
        return { data: null, error: 'Tipo de código não implementado ainda' };

      case 'REFERRAL':
        // Códigos de referral são processados diferentemente
        return { data: null, error: 'Use o sistema de indicação para códigos de referência' };

      default:
        return { data: null, error: 'Tipo de código desconhecido' };
    }

    // Registrar redenção
    const { error: redemptionError } = await supabaseAdmin
      .from('promo_code_redemptions')
      .insert({
        promo_code_id: promoCode.id,
        user_id: userId,
        credits_awarded: creditsAwarded,
        pro_days_awarded: proDaysAwarded,
        metadata: result
      });

    if (redemptionError) {
      console.error('Erro ao registrar redenção:', redemptionError);
      // Não falhar se apenas o registro falhar
    }

    return {
      data: {
        success: true,
        code: promoCode.code,
        description: promoCode.description,
        ...result
      },
      error: null
    };
  } catch (error) {
    console.error('Erro ao resgatar código:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Obter códigos resgatados por um usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<{data, error}>}
 */
export async function getUserRedeemedCodes(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('promo_code_redemptions')
      .select(`
        *,
        promo_codes (
          code,
          type,
          description
        )
      `)
      .eq('user_id', userId)
      .order('redeemed_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Erro ao buscar códigos resgatados:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Criar novo código promocional (admin apenas)
 * @param {object} codeData - Dados do código
 * @returns {Promise<{data, error}>}
 */
export async function createPromoCode(codeData) {
  try {
    const {
      code,
      type,
      value,
      description,
      expiresAt,
      maxUses,
      metadata
    } = codeData;

    const { data, error } = await supabaseAdmin
      .from('promo_codes')
      .insert({
        code: code.toUpperCase(),
        type,
        value,
        description,
        expires_at: expiresAt,
        max_uses: maxUses,
        metadata
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { data: null, error: 'Código já existe' };
      }
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Erro ao criar código:', error);
    return { data: null, error: error.message };
  }
}
