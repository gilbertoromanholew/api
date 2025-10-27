/**
 * Referrals Service
 * Gerencia sistema de indicação (referral program)
 */

import { supabase, supabaseAdmin } from '../config/supabase.js';
import { addBonusPoints } from './pointsService.js';
import logger from '../config/logger.js';

/**
 * Gerar código de referral único para um usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<{data, error}>}
 */
export async function generateReferralCode(userId) {
  try {
    // Verificar se usuário já tem código
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('referral_code')
      .eq('id', userId)
      .single();

    if (userError) {
      return { data: null, error: userError.message };
    }

    if (existingUser.referral_code) {
      return { data: { code: existingUser.referral_code }, error: null };
    }

    // Gerar código único usando função SQL
    const { data, error } = await supabaseAdmin
      .rpc('generate_referral_code');

    if (error) {
      logger.error('Erro ao gerar código de referral', { userId, error });
      return { data: null, error: error.message };
    }

    // Atualizar usuário com o código
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ referral_code: data })
      .eq('id', userId);

    if (updateError) {
      return { data: null, error: updateError.message };
    }

    return { data: { code: data }, error: null };
  } catch (error) {
    logger.error('Erro inesperado ao gerar código de referral', { userId, error });
    return { data: null, error: error.message };
  }
}

/**
 * Obter código de referral do usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<{data, error}>}
 */
export async function getReferralCode(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('referral_code')
      .eq('id', userId)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    // Se não tem código, gerar um
    if (!data.referral_code) {
      return await generateReferralCode(userId);
    }

    return { data: { code: data.referral_code }, error: null };
  } catch (error) {
    logger.error('Erro ao obter código de referral', { userId, error });
    return { data: null, error: error.message };
  }
}

/**
 * Aplicar código de referral (quando novo usuário usa código de um amigo)
 * @param {string} newUserId - ID do novo usuário
 * @param {string} referralCode - Código de referral do amigo
 * @returns {Promise<{data, error}>}
 */
export async function applyReferralCode(newUserId, referralCode) {
  try {
    // Verificar se usuário já foi indicado
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('referred_by')
      .eq('id', newUserId)
      .single();

    if (userError) {
      return { data: null, error: 'Usuário não encontrado' };
    }

    if (currentUser.referred_by) {
      return { data: null, error: 'Você já foi indicado por outro usuário' };
    }

    // Buscar usuário que possui este código de referral
    const { data: referrer, error: referrerError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name')
      .eq('referral_code', referralCode.toUpperCase())
      .single();

    if (referrerError || !referrer) {
      return { data: null, error: 'Código de indicação inválido' };
    }

    // Não pode indicar a si mesmo
    if (referrer.id === newUserId) {
      return { data: null, error: 'Você não pode usar seu próprio código' };
    }

    // Atualizar usuário novo com a indicação
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        referred_by: referrer.id
      })
      .eq('id', newUserId);

    if (updateError) {
      return { data: null, error: 'Erro ao aplicar código' };
    }

    // V7: Criar registro no histórico de referrals
    const { error: historyError } = await supabaseAdmin
      .from('social_referrals')
      .insert({
        referrer_id: referrer.id,
        referred_id: newUserId,
        referred_at: new Date().toISOString(),
        reward_granted: false // Mudará para true quando dar recompensa
      });

    if (historyError) {
      logger.error('Erro ao criar histórico de referral', { referrerId: referrer.id, referredId: newUserId, historyError });
    }

    // V7: Dar bônus de boas-vindas para o novo usuário
    const welcomeBonus = 25; // 25 créditos de bônus
    
    // ✅ Usar serviço centralizado
    await addBonusPoints(newUserId, welcomeBonus, {
      type: 'referral_bonus',
      description: `Bônus por ser indicado por ${referrer.full_name || referrer.email}`,
      referred_user_id: referrer.id
    });

    return {
      data: {
        success: true,
        referrer: {
          name: referrer.full_name || referrer.email,
          email: referrer.email
        },
        bonusReceived: welcomeBonus
      },
      error: null
    };
  } catch (error) {
    logger.error('Erro ao aplicar código de referral', { newUserId, referralCode, error });
    return { data: null, error: error.message };
  }
}

/**
 * Completar referral (quando usuário indicado faz primeira ação significativa)
 * @param {string} referredUserId - ID do usuário que foi indicado
 * @returns {Promise<{data, error}>}
 */
export async function completeReferral(referredUserId) {
  try {
    // V7: Buscar referral não recompensado
    const { data: referral, error: referralError } = await supabaseAdmin
      .from('social_referrals')
      .select('*')
      .eq('referred_id', referredUserId)
      .eq('reward_granted', false)
      .single();

    if (referralError || !referral) {
      return { data: null, error: 'Referral não encontrado' };
    }

    // V7: Marcar como recompensado (não há campo status, só reward_granted)
    const { error: updateError } = await supabaseAdmin
      .from('social_referrals')
      .update({
        reward_granted: true
      })
      .eq('id', referral.id);

    if (updateError) {
      return { data: null, error: updateError.message };
    }

    return { data: { success: true }, error: null };
  } catch (error) {
    logger.error('Erro ao completar referral', { referredUserId, error });
    return { data: null, error: error.message };
  }
}

/**
 * Recompensar referrer (dar bônus para quem indicou)
 * @param {string} referredUserId - ID do usuário que foi indicado
 * @param {number} bonusAmount - Quantidade de bônus a dar
 * @returns {Promise<{data, error}>}
 */
export async function rewardReferrer(referredUserId, bonusAmount = 50) {
  try {
    // V7: Buscar referral não recompensado
    const { data: referral, error: referralError } = await supabaseAdmin
      .from('social_referrals')
      .select('*')
      .eq('referred_id', referredUserId)
      .eq('reward_granted', false)
      .single();

    if (referralError || !referral) {
      return { data: null, error: 'Referral não encontrado ou não elegível' };
    }

    // ✅ Usar serviço centralizado para recompensar referrer
    await addBonusPoints(referral.referrer_id, bonusAmount, {
      type: 'referral_reward',
      description: `Bônus por indicar amigo que completou primeira ação`,
      referred_user_id: referredUserId
    });

    // V7: Marcar referral como recompensado (já feito no início, mas garantir)
    await supabaseAdmin
      .from('social_referrals')
      .update({
        reward_granted: true
      })
      .eq('id', referral.id);

    return { data: { success: true, bonusAwarded: bonusAmount }, error: null };
  } catch (error) {
    logger.error('Erro ao recompensar referrer', { referredUserId, bonusAmount, error });
    return { data: null, error: error.message };
  }
}

/**
 * Obter estatísticas de referral do usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<{data, error}>}
 */
export async function getReferralStats(userId) {
  try {
    // V7: Buscar referrals diretamente da tabela social.referrals
    const { data: referrals, error: referralsError } = await supabaseAdmin
      .from('social_referrals')
      .select(`
        *,
        referred_user:profiles!referred_id (
          email,
          full_name,
          created_at
        )
      `)
      .eq('referrer_id', userId)
      .order('referred_at', { ascending: false });

    if (referralsError) {
      logger.error('Erro ao buscar referrals do usuário', { userId, referralsError });
      return { data: null, error: referralsError.message };
    }

    // V7: Calcular estatísticas dinamicamente
    const totalReferrals = referrals?.length || 0;
    const rewardedReferrals = referrals?.filter(r => r.reward_granted).length || 0;
    const pendingReferrals = totalReferrals - rewardedReferrals;

    return {
      data: {
        user_id: userId,
        total_referrals: totalReferrals,
        rewarded_referrals: rewardedReferrals,
        pending_referrals: pendingReferrals,
        referrals: referrals || []
      },
      error: null
    };
  } catch (error) {
    logger.error('Erro ao obter estatísticas de referral', { userId, error });
    return { data: null, error: error.message };
  }
}
