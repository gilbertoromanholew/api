-- ========================================
-- MOVER TABELAS DO SCHEMA GAMIFICATION
-- ========================================

-- 1. MOVER gamification.achievements → public.gamification_achievements
ALTER TABLE gamification.achievements SET SCHEMA public;
ALTER TABLE public.achievements RENAME TO gamification_achievements;

-- 2. MOVER gamification.achievement_unlocks → public.gamification_achievement_unlocks
ALTER TABLE gamification.achievement_unlocks SET SCHEMA public;
ALTER TABLE public.achievement_unlocks RENAME TO gamification_achievement_unlocks;

-- 3. MOVER gamification.achievement_showcase → public.gamification_achievement_showcase
ALTER TABLE gamification.achievement_showcase SET SCHEMA public;
ALTER TABLE public.achievement_showcase RENAME TO gamification_achievement_showcase;

-- 4. MOVER gamification.daily_streaks → public.gamification_daily_streaks
ALTER TABLE gamification.daily_streaks SET SCHEMA public;
ALTER TABLE public.daily_streaks RENAME TO gamification_daily_streaks;

-- 5. MOVER gamification.leaderboards → public.gamification_leaderboards
ALTER TABLE gamification.leaderboards SET SCHEMA public;
ALTER TABLE public.leaderboards RENAME TO gamification_leaderboards;

-- 6. MOVER gamification.user_achievements → public.gamification_user_achievements
ALTER TABLE gamification.user_achievements SET SCHEMA public;
ALTER TABLE public.user_achievements RENAME TO gamification_user_achievements;

-- ========================================
-- VERIFICAÇÃO
-- ========================================
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'gamification%' 
ORDER BY tablename;

-- ========================================
-- DEPOIS: EXCLUIR SCHEMA GAMIFICATION
-- ========================================
-- Execute este SQL SEPARADO depois de confirmar que
-- as tabelas foram movidas corretamente

-- DROP TABLE IF EXISTS gamification.achievements CASCADE;
-- DROP TABLE IF EXISTS gamification.achievement_unlocks CASCADE;
-- DROP TABLE IF EXISTS gamification.achievement_showcase CASCADE;
-- DROP TABLE IF EXISTS gamification.daily_streaks CASCADE;
-- DROP TABLE IF EXISTS gamification.leaderboards CASCADE;
-- DROP TABLE IF EXISTS gamification.user_achievements CASCADE;
-- DROP SCHEMA IF EXISTS gamification CASCADE;
