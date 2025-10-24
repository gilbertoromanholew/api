-- ============================================
-- ✅ PASSO 4: CRIAR TABELAS (Gamification + Social + Audit)
-- ============================================
-- Execute no SQL Editor (https://mpanel.samm.host)
-- Tempo estimado: 3-4 minutos
-- ============================================

-- Criar ENUMs necessários
CREATE TYPE gamification.achievement_type AS ENUM (
  'milestone',        -- Marco único (ex: Perfil Completo)
  'progressive',      -- Progressivo em níveis (ex: Mestre das Ferramentas I-V)
  'recurring',        -- Recorrente, reseta (ex: Guerreiro Semanal)
  'secret'            -- Secreta, Easter egg (ex: O Coruja)
);

CREATE TYPE social.visibility_level AS ENUM (
  'public',           -- Público para todos
  'friends_only',     -- Apenas amigos
  'private'           -- Privado, só o próprio usuário
);

CREATE TYPE social.friendship_status AS ENUM (
  'pending',          -- Pendente
  'accepted',         -- Aceita
  'blocked'           -- Bloqueada
);

-- ============================================
-- TABELAS: GAMIFICATION
-- ============================================

-- 1. Catálogo de Conquistas
CREATE TABLE gamification.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  
  type gamification.achievement_type NOT NULL,
  category VARCHAR(50),
  
  -- Requisitos
  requirement_type VARCHAR(50),
  requirement_value INTEGER,
  max_level INTEGER DEFAULT 1,
  
  -- Recompensas
  reward_bonus_credits INTEGER DEFAULT 0,
  pro_multiplier DECIMAL(3,2) DEFAULT 1.0,
  
  -- Exibição
  icon_emoji VARCHAR(10),
  is_secret BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_achievements_type ON gamification.achievements(type);
CREATE INDEX idx_achievements_category ON gamification.achievements(category);
CREATE INDEX idx_achievements_active ON gamification.achievements(is_active, display_order);
COMMENT ON TABLE gamification.achievements IS '🏆 Catálogo de conquistas disponíveis';

-- 2. Conquistas dos Usuários (Progresso)
CREATE TABLE gamification.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES gamification.achievements(id),
  
  current_level INTEGER DEFAULT 1,
  current_progress INTEGER DEFAULT 0,
  
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON gamification.user_achievements(user_id);
CREATE INDEX idx_user_achievements_completed ON gamification.user_achievements(is_completed);
COMMENT ON TABLE gamification.user_achievements IS '📊 Progresso das conquistas dos usuários';

-- 3. Histórico de Desbloqueios
CREATE TABLE gamification.achievement_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES gamification.achievements(id),
  
  level_unlocked INTEGER DEFAULT 1,
  reward_granted INTEGER,
  
  unlocked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_unlocks_user ON gamification.achievement_unlocks(user_id);
CREATE INDEX idx_unlocks_date ON gamification.achievement_unlocks(unlocked_at DESC);
COMMENT ON TABLE gamification.achievement_unlocks IS '🎉 Histórico de conquistas desbloqueadas';

-- 4. Vitrine de Conquistas (Favoritas)
CREATE TABLE gamification.achievement_showcase (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES gamification.achievements(id),
  
  display_order INTEGER NOT NULL CHECK (display_order BETWEEN 1 AND 6),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (user_id, display_order),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_showcase_user ON gamification.achievement_showcase(user_id);
COMMENT ON TABLE gamification.achievement_showcase IS '⭐ Vitrine de conquistas favoritas (máx 6)';

-- 5. Rankings (Leaderboards)
CREATE TABLE gamification.leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Pontuações
  global_score INTEGER DEFAULT 0,
  weekly_score INTEGER DEFAULT 0,
  monthly_score INTEGER DEFAULT 0,
  
  -- Rankings
  global_rank INTEGER,
  weekly_rank INTEGER,
  monthly_rank INTEGER,
  
  -- Categorias
  category_scores JSONB DEFAULT '{}',
  
  -- Controle de reset
  last_weekly_reset DATE,
  last_monthly_reset DATE,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leaderboards_user ON gamification.leaderboards(user_id);
CREATE INDEX idx_leaderboards_global ON gamification.leaderboards(global_score DESC);
CREATE INDEX idx_leaderboards_weekly ON gamification.leaderboards(weekly_score DESC);
CREATE INDEX idx_leaderboards_monthly ON gamification.leaderboards(monthly_score DESC);
COMMENT ON TABLE gamification.leaderboards IS '🏅 Rankings e pontuações dos usuários';

-- 6. Sequências Diárias (Daily Streaks)
CREATE TABLE gamification.daily_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  
  last_activity_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_streaks_current ON gamification.daily_streaks(current_streak DESC);
COMMENT ON TABLE gamification.daily_streaks IS '🔥 Sequências de dias consecutivos de atividade';

-- ============================================
-- TABELAS: SOCIAL
-- ============================================

-- 1. Configurações de Privacidade
CREATE TABLE social.user_privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  profile_visibility social.visibility_level DEFAULT 'public',
  achievements_visibility social.visibility_level DEFAULT 'public',
  leaderboard_visibility social.visibility_level DEFAULT 'public',
  activity_visibility social.visibility_level DEFAULT 'friends_only',
  
  allow_friend_requests BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE social.user_privacy_settings IS '🔒 Configurações de privacidade dos usuários';

-- 2. Amizades
CREATE TABLE social.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  status social.friendship_status DEFAULT 'accepted',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (user_id != friend_id),
  UNIQUE(user_id, friend_id)
);

CREATE INDEX idx_friendships_user ON social.friendships(user_id);
CREATE INDEX idx_friendships_friend ON social.friendships(friend_id);
CREATE INDEX idx_friendships_status ON social.friendships(status);
COMMENT ON TABLE social.friendships IS '👥 Amizades entre usuários';

-- 3. Pedidos de Amizade
CREATE TABLE social.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  status social.friendship_status DEFAULT 'pending',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  
  CHECK (requester_id != requested_id),
  UNIQUE(requester_id, requested_id)
);

CREATE INDEX idx_friend_requests_requested ON social.friend_requests(requested_id, status);
COMMENT ON TABLE social.friend_requests IS '✉️ Pedidos de amizade pendentes';

-- 4. Referências de Usuários
CREATE TABLE social.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  referred_at TIMESTAMPTZ DEFAULT NOW(),
  reward_granted BOOLEAN DEFAULT false,
  
  CHECK (referrer_id != referred_id),
  UNIQUE(referred_id)
);

CREATE INDEX idx_referrals_referrer ON social.referrals(referrer_id);
COMMENT ON TABLE social.referrals IS '🎁 Sistema de referências entre usuários';

-- ============================================
-- TABELAS: AUDIT
-- ============================================

-- 1. Logs de Acesso
CREATE TABLE audit.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  
  success BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_access_logs_user ON audit.access_logs(user_id);
CREATE INDEX idx_access_logs_action ON audit.access_logs(action);
CREATE INDEX idx_access_logs_created ON audit.access_logs(created_at DESC);
COMMENT ON TABLE audit.access_logs IS '📝 Logs de acesso e ações dos usuários';

-- 2. Eventos de Segurança
CREATE TABLE audit.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) DEFAULT 'info',
  
  description TEXT,
  ip_address INET,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_events_user ON audit.security_events(user_id);
CREATE INDEX idx_security_events_type ON audit.security_events(event_type);
CREATE INDEX idx_security_events_severity ON audit.security_events(severity);
CREATE INDEX idx_security_events_created ON audit.security_events(created_at DESC);
COMMENT ON TABLE audit.security_events IS '🚨 Eventos de segurança e anomalias';

-- 3. Ações Administrativas
CREATE TABLE audit.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  action VARCHAR(100) NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  description TEXT,
  changes JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_actions_admin ON audit.admin_actions(admin_id);
CREATE INDEX idx_admin_actions_target ON audit.admin_actions(target_user_id);
CREATE INDEX idx_admin_actions_created ON audit.admin_actions(created_at DESC);
COMMENT ON TABLE audit.admin_actions IS '👮 Ações administrativas realizadas';

-- ============================================
-- ✅ VERIFICAÇÃO
-- ============================================

SELECT 
  schemaname as schema,
  COUNT(*) as total_tabelas
FROM pg_tables 
WHERE schemaname IN ('economy', 'gamification', 'tools', 'social', 'audit')
GROUP BY schemaname
ORDER BY schemaname;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- schema         | total_tabelas
-- ---------------|-------------
-- audit          | 3
-- economy        | 7
-- gamification   | 6
-- social         | 4
-- tools          | 3
--
-- Total: 23 tabelas criadas! ✅
-- ============================================

-- ✅ Se mostrar total de 23 tabelas, prossiga para PASSO 5 (MIGRAR DADOS)!
