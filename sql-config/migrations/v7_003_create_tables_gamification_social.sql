-- ============================================
-- MIGRAÇÃO V7 - PARTE 3: GAMIFICAÇÃO E SOCIAL
-- ============================================
-- Data: 23/10/2025
-- Pré-requisito: v7_002 executado
-- ============================================

-- ============================================
-- SCHEMA: GAMIFICATION (Gamificação)
-- ============================================

-- 1. Catálogo de Conquistas
CREATE TABLE IF NOT EXISTS gamification.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  achievement_key TEXT UNIQUE NOT NULL, -- 'profile_complete', 'night_owl', etc
  type gamification.achievement_type NOT NULL,
  category gamification.achievement_category NOT NULL,
  
  -- Exibição
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  
  -- Recompensa
  bonus_reward INTEGER DEFAULT 0,
  
  -- Configuração
  is_secret BOOLEAN DEFAULT false,
  max_level INTEGER DEFAULT 1,
  level_multiplier NUMERIC(3,1) DEFAULT 1.0,
  
  -- Recorrência
  recurrence gamification.recurrence_type DEFAULT 'none',
  reset_day INTEGER, -- 0-6 para semanal (domingo=0), 1-31 para mensal
  
  -- Condições (JSON)
  conditions JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_achievements_key ON gamification.achievements(achievement_key);
CREATE INDEX idx_achievements_type ON gamification.achievements(type);
CREATE INDEX idx_achievements_category ON gamification.achievements(category);
CREATE INDEX idx_achievements_secret ON gamification.achievements(is_secret);
CREATE INDEX idx_achievements_active ON gamification.achievements(is_active);
COMMENT ON TABLE gamification.achievements IS 'Catálogo completo de conquistas';

-- 2. Conquistas dos Usuários
CREATE TABLE IF NOT EXISTS gamification.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES gamification.achievements(id) ON DELETE CASCADE,
  
  -- Progressão
  current_level INTEGER DEFAULT 1,
  progress INTEGER DEFAULT 0,
  max_progress INTEGER,
  
  -- Streaks (para recorrentes)
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_completed_at TIMESTAMPTZ,
  
  -- Recompensa
  bonus_earned INTEGER DEFAULT 0, -- Total ganho COM multiplicador
  
  -- Timestamps
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON gamification.user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement ON gamification.user_achievements(achievement_id);
CREATE INDEX idx_user_achievements_unlocked ON gamification.user_achievements(unlocked_at DESC);
COMMENT ON TABLE gamification.user_achievements IS 'Conquistas desbloqueadas pelos usuários';

-- 3. Histórico de Desbloqueio (para notificações)
CREATE TABLE IF NOT EXISTS gamification.achievement_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES gamification.achievements(id),
  
  -- Detalhes
  achievement_key TEXT NOT NULL,
  title TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  bonus_earned INTEGER NOT NULL,
  multiplier_applied NUMERIC(3,1) DEFAULT 1.0,
  
  -- Status de notificação
  was_notified BOOLEAN DEFAULT false,
  notified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_unlocks_user ON gamification.achievement_unlocks(user_id);
CREATE INDEX idx_unlocks_notified ON gamification.achievement_unlocks(was_notified);
CREATE INDEX idx_unlocks_created ON gamification.achievement_unlocks(created_at DESC);
COMMENT ON TABLE gamification.achievement_unlocks IS 'Histórico de desbloqueios para feed/notificações';

-- 4. Showcase de Conquistas (favoritas do usuário)
CREATE TABLE IF NOT EXISTS gamification.achievement_showcase (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES gamification.achievements(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL CHECK (display_order BETWEEN 1 AND 6),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (user_id, achievement_id),
  UNIQUE(user_id, display_order)
);

CREATE INDEX idx_showcase_user ON gamification.achievement_showcase(user_id, display_order);
COMMENT ON TABLE gamification.achievement_showcase IS 'Até 6 conquistas em destaque no perfil';

-- 5. Leaderboards (Rankings)
CREATE TABLE IF NOT EXISTS gamification.leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tipo de ranking
  leaderboard_type TEXT NOT NULL CHECK (leaderboard_type IN ('global', 'weekly', 'monthly', 'category')),
  category TEXT, -- Para rankings por categoria
  
  -- Período
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Dados (snapshot)
  rankings JSONB NOT NULL, -- Array de { user_id, rank, score, full_name, avatar }
  
  -- Atualização
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(leaderboard_type, category, period_start, period_end)
);

CREATE INDEX idx_leaderboards_type ON gamification.leaderboards(leaderboard_type);
CREATE INDEX idx_leaderboards_period ON gamification.leaderboards(period_end DESC);
COMMENT ON TABLE gamification.leaderboards IS 'Rankings pré-calculados para performance';

-- 6. Sequências Diárias (Daily Streaks)
CREATE TABLE IF NOT EXISTS gamification.daily_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Streak atual
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  
  -- Controle
  last_activity_date DATE,
  last_tool_used_at TIMESTAMPTZ,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_streaks_current ON gamification.daily_streaks(current_streak DESC);
COMMENT ON TABLE gamification.daily_streaks IS 'Controle de sequências diárias de uso';

-- ============================================
-- SCHEMA: SOCIAL (Sistema Social)
-- ============================================

-- 1. Configurações de Privacidade
CREATE TABLE IF NOT EXISTS social.user_privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Visibilidades
  achievements_visibility social.visibility_level DEFAULT 'public',
  profile_visibility social.visibility_level DEFAULT 'public',
  stats_visibility social.visibility_level DEFAULT 'public',
  friends_visibility social.visibility_level DEFAULT 'public',
  
  -- Leaderboard
  show_in_leaderboard BOOLEAN DEFAULT true,
  show_in_search BOOLEAN DEFAULT true,
  
  -- Interações
  allow_friend_requests BOOLEAN DEFAULT true,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE social.user_privacy_settings IS 'Configurações de privacidade e visibilidade';

-- 2. Amizades
CREATE TABLE IF NOT EXISTS social.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  status social.friendship_status DEFAULT 'pending',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

CREATE INDEX idx_friendships_user ON social.friendships(user_id);
CREATE INDEX idx_friendships_friend ON social.friendships(friend_id);
CREATE INDEX idx_friendships_status ON social.friendships(status);
COMMENT ON TABLE social.friendships IS 'Relações de amizade entre usuários';

-- 3. Pedidos de Amizade
CREATE TABLE IF NOT EXISTS social.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  message TEXT,
  status social.friendship_status DEFAULT 'pending',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  
  UNIQUE(from_user_id, to_user_id),
  CHECK (from_user_id != to_user_id)
);

CREATE INDEX idx_friend_requests_from ON social.friend_requests(from_user_id);
CREATE INDEX idx_friend_requests_to ON social.friend_requests(to_user_id);
CREATE INDEX idx_friend_requests_status ON social.friend_requests(status);
COMMENT ON TABLE social.friend_requests IS 'Pedidos de amizade pendentes';

-- 4. Sistema de Referências
CREATE TABLE IF NOT EXISTS social.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  referral_code TEXT NOT NULL,
  status social.referral_status DEFAULT 'pending',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ, -- Quando referred completou perfil
  rewarded_at TIMESTAMPTZ, -- Quando bônus foi concedido
  
  UNIQUE(referrer_id, referred_id)
);

CREATE INDEX idx_referrals_referrer ON social.referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON social.referrals(referred_id);
CREATE INDEX idx_referrals_code ON social.referrals(referral_code);
CREATE INDEX idx_referrals_status ON social.referrals(status);
COMMENT ON TABLE social.referrals IS 'Sistema de indicações/referências';

-- ============================================
-- SCHEMA: AUDIT (Auditoria)
-- ============================================

-- 1. Logs de Acesso
CREATE TABLE IF NOT EXISTS audit.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Evento
  event_type TEXT NOT NULL, -- 'login', 'logout', 'password_reset', etc
  
  -- Contexto
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,
  
  -- Localização (opcional)
  country TEXT,
  city TEXT,
  
  -- Status
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_access_logs_user ON audit.access_logs(user_id);
CREATE INDEX idx_access_logs_event ON audit.access_logs(event_type);
CREATE INDEX idx_access_logs_created ON audit.access_logs(created_at DESC);
CREATE INDEX idx_access_logs_ip ON audit.access_logs(ip_address);
COMMENT ON TABLE audit.access_logs IS 'Logs de acesso e autenticação';

-- 2. Eventos de Segurança
CREATE TABLE IF NOT EXISTS audit.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Tipo de evento
  event_type TEXT NOT NULL, -- 'suspicious_login', 'rate_limit', 'blocked_ip', etc
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Detalhes
  description TEXT NOT NULL,
  metadata JSONB,
  
  -- Contexto
  ip_address INET,
  
  -- Ação tomada
  action_taken TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_events_user ON audit.security_events(user_id);
CREATE INDEX idx_security_events_severity ON audit.security_events(severity);
CREATE INDEX idx_security_events_created ON audit.security_events(created_at DESC);
COMMENT ON TABLE audit.security_events IS 'Eventos de segurança e detecção de ameaças';

-- 3. Ações de Admin
CREATE TABLE IF NOT EXISTS audit.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Ação
  action_type TEXT NOT NULL, -- 'add_points', 'ban_user', 'create_achievement', etc
  target_user_id UUID REFERENCES auth.users(id),
  
  -- Detalhes
  description TEXT NOT NULL,
  changes JSONB, -- Before/after
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_actions_admin ON audit.admin_actions(admin_id);
CREATE INDEX idx_admin_actions_target ON audit.admin_actions(target_user_id);
CREATE INDEX idx_admin_actions_created ON audit.admin_actions(created_at DESC);
COMMENT ON TABLE audit.admin_actions IS 'Auditoria de ações administrativas';

-- ============================================
-- PRÓXIMA PARTE: v7_004_migrate_data.sql
-- ============================================
