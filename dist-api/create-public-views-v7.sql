-- ================================================
-- SOLUÇÃO: CRIAR VIEWS EM PUBLIC PARA SCHEMAS V7
-- ================================================
-- O Supabase JS sempre adiciona 'public.' antes das tabelas.
-- Como não podemos mudar o search_path facilmente, vamos
-- criar views em public que apontam para os schemas reais.

-- ========================================
-- SCHEMA: tools
-- ========================================

-- View para tools.catalog
CREATE OR REPLACE VIEW public.tools_catalog AS
SELECT * FROM tools.catalog;

-- View para tools.executions  
CREATE OR REPLACE VIEW public.tools_executions AS
SELECT * FROM tools.executions;

-- ========================================
-- SCHEMA: economy
-- ========================================

-- View para economy.user_wallets
CREATE OR REPLACE VIEW public.economy_user_wallets AS
SELECT * FROM economy.user_wallets;

-- View para economy.transactions
CREATE OR REPLACE VIEW public.economy_transactions AS
SELECT * FROM economy.transactions;

-- View para economy.purchases
CREATE OR REPLACE VIEW public.economy_purchases AS
SELECT * FROM economy.purchases;

-- View para economy.subscriptions
CREATE OR REPLACE VIEW public.economy_subscriptions AS
SELECT * FROM economy.subscriptions;

-- View para economy.subscription_plans
CREATE OR REPLACE VIEW public.economy_subscription_plans AS
SELECT * FROM economy.subscription_plans;

-- View para economy.referral_rewards
CREATE OR REPLACE VIEW public.economy_referral_rewards AS
SELECT * FROM economy.referral_rewards;

-- ========================================
-- SCHEMA: social
-- ========================================

-- View para social.referrals
CREATE OR REPLACE VIEW public.social_referrals AS
SELECT * FROM social.referrals;

-- View para social.friendships
CREATE OR REPLACE VIEW public.social_friendships AS
SELECT * FROM social.friendships;

-- View para social.friend_requests
CREATE OR REPLACE VIEW public.social_friend_requests AS
SELECT * FROM social.friend_requests;

-- View para social.user_privacy_settings
CREATE OR REPLACE VIEW public.social_user_privacy_settings AS
SELECT * FROM social.user_privacy_settings;

-- ========================================
-- GRANTS: Dar permissões nas views
-- ========================================

-- Permissões para authenticated users
GRANT SELECT, INSERT, UPDATE ON public.tools_catalog TO authenticated;
GRANT SELECT, INSERT ON public.tools_executions TO authenticated;
GRANT SELECT, UPDATE ON public.economy_user_wallets TO authenticated;
GRANT SELECT, INSERT ON public.economy_transactions TO authenticated;
GRANT SELECT, INSERT ON public.economy_purchases TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.economy_subscriptions TO authenticated;
GRANT SELECT ON public.economy_subscription_plans TO authenticated;
GRANT SELECT, INSERT ON public.economy_referral_rewards TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.social_referrals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_friendships TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_friend_requests TO authenticated;
GRANT SELECT, UPDATE ON public.social_user_privacy_settings TO authenticated;

-- Permissões para anon (se necessário)
GRANT SELECT ON public.tools_catalog TO anon;

-- ========================================
-- INSTEAD OF TRIGGERS: Permitir INS/UPD/DEL
-- ========================================
-- Views por padrão são read-only. Precisamos de triggers
-- para permitir INSERT/UPDATE/DELETE

-- tools.catalog
CREATE OR REPLACE FUNCTION public.tools_catalog_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tools.catalog VALUES (NEW.*);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tools_catalog_insert_trigger
INSTEAD OF INSERT ON public.tools_catalog
FOR EACH ROW EXECUTE FUNCTION public.tools_catalog_insert();

CREATE OR REPLACE FUNCTION public.tools_catalog_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tools.catalog 
  SET name = NEW.name,
      slug = NEW.slug,
      category = NEW.category,
      description = NEW.description,
      cost_in_points = NEW.cost_in_points,
      is_active = NEW.is_active,
      icon_url = NEW.icon_url,
      metadata = NEW.metadata,
      created_at = NEW.created_at,
      updated_at = NEW.updated_at
  WHERE id = OLD.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tools_catalog_update_trigger
INSTEAD OF UPDATE ON public.tools_catalog
FOR EACH ROW EXECUTE FUNCTION public.tools_catalog_update();

-- tools.executions
CREATE OR REPLACE FUNCTION public.tools_executions_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tools.executions VALUES (NEW.*);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tools_executions_insert_trigger
INSTEAD OF INSERT ON public.tools_executions
FOR EACH ROW EXECUTE FUNCTION public.tools_executions_insert();

-- economy.user_wallets  
CREATE OR REPLACE FUNCTION public.economy_user_wallets_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE economy.user_wallets 
  SET bonus_credits = NEW.bonus_credits,
      purchased_points = NEW.purchased_points,
      total_earned_bonus = NEW.total_earned_bonus,
      total_purchased = NEW.total_purchased,
      total_spent = NEW.total_spent,
      pro_weekly_allowance = NEW.pro_weekly_allowance,
      last_allowance_date = NEW.last_allowance_date,
      updated_at = NEW.updated_at
  WHERE user_id = OLD.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER economy_user_wallets_update_trigger
INSTEAD OF UPDATE ON public.economy_user_wallets
FOR EACH ROW EXECUTE FUNCTION public.economy_user_wallets_update();

CREATE OR REPLACE FUNCTION public.economy_user_wallets_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO economy.user_wallets VALUES (NEW.*);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER economy_user_wallets_insert_trigger
INSTEAD OF INSERT ON public.economy_user_wallets
FOR EACH ROW EXECUTE FUNCTION public.economy_user_wallets_insert();

-- economy.transactions
CREATE OR REPLACE FUNCTION public.economy_transactions_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO economy.transactions VALUES (NEW.*);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER economy_transactions_insert_trigger
INSTEAD OF INSERT ON public.economy_transactions
FOR EACH ROW EXECUTE FUNCTION public.economy_transactions_insert();

-- social.referrals
CREATE OR REPLACE FUNCTION public.social_referrals_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO social.referrals VALUES (NEW.*);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER social_referrals_insert_trigger
INSTEAD OF INSERT ON public.social_referrals
FOR EACH ROW EXECUTE FUNCTION public.social_referrals_insert();

CREATE OR REPLACE FUNCTION public.social_referrals_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE social.referrals 
  SET referrer_id = NEW.referrer_id,
      referred_id = NEW.referred_id,
      referred_at = NEW.referred_at,
      reward_granted = NEW.reward_granted
  WHERE id = OLD.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER social_referrals_update_trigger
INSTEAD OF UPDATE ON public.social_referrals
FOR EACH ROW EXECUTE FUNCTION public.social_referrals_update();

-- ========================================
-- VERIFICAÇÃO
-- ========================================
SELECT 'Views criadas com sucesso!' AS status;
SELECT viewname FROM pg_views WHERE schemaname = 'public' AND viewname LIKE '%\__%' ORDER BY viewname;
