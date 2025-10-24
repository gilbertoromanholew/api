-- ============================================
-- 🎯 POPULAR PLANO PRO E CONQUISTAS INICIAIS
-- ============================================
-- Execute no SQL Editor (https://mpanel.samm.host)
-- Tempo estimado: 1 minuto
-- ============================================

-- ============================================
-- 1️⃣ CRIAR PLANO PRO
-- ============================================

INSERT INTO economy.subscription_plans (
  name,
  slug,
  description,
  price_brl,
  billing_period,
  features,
  is_active
) VALUES (
  'Pro',
  'pro',
  'Acesso completo com planejamentos ilimitados e benefícios exclusivos',
  89.10,
  'monthly',
  jsonb_build_array(
    'Planejamentos ilimitados',
    'Mesada semanal de 20 pontos bônus',
    'Multiplicador 2.1x em todas as ferramentas',
    'Acesso prioritário a novas funcionalidades',
    'Suporte prioritário',
    'Sem limite de execuções por ferramenta'
  ),
  true
);

-- ============================================
-- 2️⃣ POPULAR CONQUISTAS INICIAIS (15 básicas)
-- ============================================

-- MILESTONE: Conquistas únicas
INSERT INTO gamification.achievements (
  name, 
  slug, 
  description, 
  type, 
  category,
  requirement_type,
  requirement_value,
  max_level,
  reward_bonus_credits,
  icon_emoji,
  is_secret,
  display_order,
  is_active
) VALUES
('Bem-vindo!', 'bem-vindo', 'Complete seu cadastro e perfil', 'milestone', 'Início', 'signup', 1, 1, 5, '👋', false, 1, true),
('Primeira Ferramenta', 'primeira-ferramenta', 'Use qualquer ferramenta pela primeira vez', 'milestone', 'Ferramentas', 'tool_usage', 1, 1, 10, '🔧', false, 2, true),
('Primeira Compra', 'primeira-compra', 'Adquira seu primeiro pacote de pontos', 'milestone', 'Economia', 'purchase', 1, 1, 15, '💰', false, 3, true),
('Explorador', 'explorador', 'Use 5 ferramentas diferentes', 'milestone', 'Ferramentas', 'diverse_tools', 5, 1, 20, '🗺️', false, 4, true);

-- PROGRESSIVE: Conquistas em níveis (Mestre das Ferramentas)
INSERT INTO gamification.achievements (
  name, 
  slug, 
  description, 
  type, 
  category,
  requirement_type,
  requirement_value,
  max_level,
  reward_bonus_credits,
  icon_emoji,
  is_secret,
  display_order,
  is_active
) VALUES
('Mestre das Ferramentas I', 'mestre-ferramentas-i', 'Use ferramentas 10 vezes', 'progressive', 'Ferramentas', 'tool_executions', 10, 1, 10, '⭐', false, 10, true),
('Mestre das Ferramentas II', 'mestre-ferramentas-ii', 'Use ferramentas 50 vezes', 'progressive', 'Ferramentas', 'tool_executions', 50, 2, 25, '⭐⭐', false, 11, true),
('Mestre das Ferramentas III', 'mestre-ferramentas-iii', 'Use ferramentas 100 vezes', 'progressive', 'Ferramentas', 'tool_executions', 100, 3, 50, '⭐⭐⭐', false, 12, true),
('Mestre das Ferramentas IV', 'mestre-ferramentas-iv', 'Use ferramentas 500 vezes', 'progressive', 'Ferramentas', 'tool_executions', 500, 4, 100, '⭐⭐⭐⭐', false, 13, true),
('Mestre das Ferramentas V', 'mestre-ferramentas-v', 'Use ferramentas 1000 vezes', 'progressive', 'Ferramentas', 'tool_executions', 1000, 5, 250, '⭐⭐⭐⭐⭐', false, 14, true);

-- RECURRING: Conquistas recorrentes (Streaks)
INSERT INTO gamification.achievements (
  name, 
  slug, 
  description, 
  type, 
  category,
  requirement_type,
  requirement_value,
  max_level,
  reward_bonus_credits,
  icon_emoji,
  is_secret,
  display_order,
  is_active
) VALUES
('Guerreiro Semanal', 'guerreiro-semanal', 'Acesse a plataforma por 7 dias seguidos', 'recurring', 'Engajamento', 'daily_streak', 7, 1, 10, '🔥', false, 20, true),
('Campeão Mensal', 'campeao-mensal', 'Acesse a plataforma por 30 dias seguidos', 'recurring', 'Engajamento', 'daily_streak', 30, 1, 25, '🏆', false, 21, true),
('Maratonista Anual', 'maratonista-anual', 'Acesse a plataforma por 365 dias seguidos', 'recurring', 'Engajamento', 'daily_streak', 365, 1, 100, '👑', false, 22, true);

-- SECRET: Conquistas secretas
INSERT INTO gamification.achievements (
  name, 
  slug, 
  description, 
  type, 
  category,
  requirement_type,
  requirement_value,
  max_level,
  reward_bonus_credits,
  icon_emoji,
  is_secret,
  display_order,
  is_active
) VALUES
('O Coruja', 'o-coruja', 'Use uma ferramenta entre 2h e 4h da manhã', 'secret', 'Easter Egg', 'night_owl', 1, 1, 30, '🦉', true, 30, true),
('Rei do Feriado', 'rei-do-feriado', 'Use ferramentas em um feriado nacional', 'secret', 'Easter Egg', 'holiday_usage', 1, 1, 50, '🎉', true, 31, true),
('Caçador de Easter Eggs', 'cacador-easter-eggs', '???', 'secret', 'Easter Egg', 'easter_egg', 1, 1, 100, '🥚', true, 32, true);

-- ============================================
-- ✅ VERIFICAÇÃO
-- ============================================

SELECT 
  'Plano Pro' as item,
  COUNT(*) as total
FROM economy.subscription_plans
WHERE slug = 'pro'

UNION ALL

SELECT 
  'Conquistas',
  COUNT(*)
FROM gamification.achievements;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- item        | total
-- ------------|------
-- Plano Pro   | 1
-- Conquistas  | 15
-- ============================================

-- ✅ Se aparecer 1 plano e 15 conquistas, SUCESSO! 🎉
