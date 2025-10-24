/**
 * Referrals Service
 * Gerencia sistema de indicação (referral program)
 */

import { supabase, supabaseAdmin } from '../config/supabase.js';

/**
 * Gerar código de referral único para um usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<{data, error}>}
 */
export async function generateReferralCode(userId) {
  try {
    // Verificar se usuário já tem código
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
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
      console.error('Erro ao gerar código:', error);
      return { data: null, error: error.message };
    }

    // Atualizar usuário com o código
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ referral_code: data })
      .eq('id', userId);

    if (updateError) {
      return { data: null, error: updateError.message };
    }

    return { data: { code: data }, error: null };
  } catch (error) {
    console.error('Erro inesperado ao gerar código:', error);
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
      .from('users')
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
    console.error('Erro ao obter código:', error);
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
      .from('users')
      .select('referred_by_user_id')
      .eq('id', newUserId)
      .single();

    if (userError) {
      return { data: null, error: 'Usuário não encontrado' };
    }

    if (currentUser.referred_by_user_id) {
      return { data: null, error: 'Você já foi indicado por outro usuário' };
    }

    // Buscar usuário que possui este código de referral
    const { data: referrer, error: referrerError } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
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
      .from('users')
      .update({
        referred_by_user_id: referrer.id,
        referral_completed_at: new Date().toISOString()
      })
      .eq('id', newUserId);

    if (updateError) {
      return { data: null, error: 'Erro ao aplicar código' };
    }

    // Criar registro no histórico de referrals
    const { error: historyError } = await supabaseAdmin
      .from('referral_history')
      .insert({
        referrer_user_id: referrer.id,
        referred_user_id: newUserId,
        status: 'pending' // Mudará para 'completed' quando usuário fizer primeira ação
      });

    if (historyError) {
      console.error('Erro ao criar histórico:', historyError);
    }

    // Dar bônus de boas-vindas para o novo usuário
    const welcomeBonus = 25; // 25 créditos de bônus
    await supabaseAdmin
      .from('users')
      .update({
        bonus_credits: (currentUser.bonus_credits || 0) + welcomeBonus
      })
      .eq('id', newUserId);

    await supabaseAdmin
      .from('point_transactions')
      .insert({
        user_id: newUserId,
        amount: welcomeBonus,
        type: 'bonus',
        source: 'referral_welcome',
        description: `Bônus por ser indicado por ${referrer.name || referrer.email}`
      });

    return {
      data: {
        success: true,
        referrer: {
          name: referrer.name || referrer.email,
          email: referrer.email
        },
        bonusReceived: welcomeBonus
      },
      error: null
    };
  } catch (error) {
    console.error('Erro ao aplicar código de referral:', error);
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
    // Buscar referral pendente
    const { data: referral, error: referralError } = await supabaseAdmin
      .from('referral_history')
      .select('*')
      .eq('referred_user_id', referredUserId)
      .eq('status', 'pending')
      .single();

    if (referralError || !referral) {
      return { data: null, error: 'Referral não encontrado' };
    }

    // Marcar como completo
    const { error: updateError } = await supabaseAdmin
      .from('referral_history')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', referral.id);

    if (updateError) {
      return { data: null, error: updateError.message };
    }

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Erro ao completar referral:', error);
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
    // Buscar referral completo mas não recompensado
    const { data: referral, error: referralError } = await supabaseAdmin
      .from('referral_history')
      .select('*')
      .eq('referred_user_id', referredUserId)
      .eq('status', 'completed')
      .single();

    if (referralError || !referral) {
      return { data: null, error: 'Referral não encontrado ou não elegível' };
    }

    // Buscar dados do referrer
    const { data: referrer, error: referrerError } = await supabaseAdmin
      .from('users')
      .select('bonus_credits')
      .eq('id', referral.referrer_user_id)
      .single();

    if (referrerError) {
      return { data: null, error: 'Referrer não encontrado' };
    }

    // Adicionar bônus ao referrer
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        bonus_credits: (referrer.bonus_credits || 0) + bonusAmount
      })
      .eq('id', referral.referrer_user_id);

    if (updateError) {
      return { data: null, error: 'Erro ao adicionar bônus' };
    }

    // Registrar transação
    await supabaseAdmin
      .from('point_transactions')
      .insert({
        user_id: referral.referrer_user_id,
        amount: bonusAmount,
        type: 'bonus',
        source: 'referral_reward',
        description: `Bônus por indicar amigo que completou primeira ação`
      });

    // Atualizar referral para 'rewarded'
    await supabaseAdmin
      .from('referral_history')
      .update({
        status: 'rewarded',
        rewarded_at: new Date().toISOString(),
        bonus_credits_awarded: bonusAmount
      })
      .eq('id', referral.id);

    return { data: { success: true, bonusAwarded: bonusAmount }, error: null };
  } catch (error) {
    console.error('Erro ao recompensar referrer:', error);
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
    // Buscar stats agregadas
    const { data: stats, error: statsError } = await supabaseAdmin
      .from('referral_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Se não existir, criar
    if (statsError && statsError.code === 'PGRST116') {
      const { data: newStats, error: createError } = await supabaseAdmin
        .from('referral_stats')
        .insert({ user_id: userId })
        .select()
        .single();

      if (createError) {
        return { data: null, error: createError.message };
      }

      return { data: newStats, error: null };
    }

    if (statsError) {
      return { data: null, error: statsError.message };
    }

    // Buscar lista de pessoas indicadas
    const { data: referrals, error: referralsError } = await supabaseAdmin
      .from('referral_history')
      .select(`
        *,
        referred_user:users!referred_user_id (
          email,
          name,
          created_at
        )
      `)
      .eq('referrer_user_id', userId)
      .order('created_at', { ascending: false });

    if (referralsError) {
      console.error('Erro ao buscar referrals:', referralsError);
    }

    return {
      data: {
        ...stats,
        referrals: referrals || []
      },
      error: null
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return { data: null, error: error.message };
  }
}
