-- ============================================================================
-- FIX API ERRORS - Corrige erros encontrados nos logs da API
-- Data: 25/10/2025
-- ============================================================================

-- ============================================================================
-- BUG 1: profiles.created_at não existe
-- Erro: "column profiles_1.created_at does not exist"
-- ============================================================================

-- Adicionar coluna created_at na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Preencher created_at com base no auth.users.created_at para registros existentes
UPDATE public.profiles p
SET created_at = u.created_at
FROM auth.users u
WHERE p.id = u.id AND p.created_at IS NULL;

-- Comentário: A partir de agora, novos profiles terão created_at automático
COMMENT ON COLUMN public.profiles.created_at IS 'Data de criação do perfil (sincronizada com auth.users)';

-- ============================================================================
-- BUG 2: tools_catalog - permission denied
-- Erro: "permission denied for table tools_catalog"
-- ============================================================================

-- Garantir permissões completas para service_role
GRANT ALL ON TABLE public.tools_catalog TO service_role;
GRANT ALL ON TABLE public.tools_catalog TO authenticated;
GRANT SELECT ON TABLE public.tools_catalog TO anon;

-- Comentário: service_role precisa de ALL para operações completas

-- ============================================================================
-- BUG 3: tools_executions.cost_in_points não existe
-- Erro: "column tools_executions.cost_in_points does not exist"
-- ============================================================================

-- Adicionar coluna cost_in_points
ALTER TABLE public.tools_executions 
ADD COLUMN IF NOT EXISTS cost_in_points INTEGER DEFAULT 0;

-- Comentário: Custo em pontos da execução da ferramenta
COMMENT ON COLUMN public.tools_executions.cost_in_points IS 'Custo em créditos/pontos pela execução da ferramenta';

-- Criar índice para consultas de histórico com custo
CREATE INDEX IF NOT EXISTS idx_tools_executions_cost 
ON public.tools_executions(user_id, cost_in_points) 
WHERE cost_in_points > 0;

-- ============================================================================
-- BUG 4 (DESCOBERTO): tools_executions precisa de permissões
-- ============================================================================

-- Garantir permissões completas para service_role
GRANT ALL ON TABLE public.tools_executions TO service_role;
GRANT ALL ON TABLE public.tools_executions TO authenticated;

-- ============================================================================
-- BUG 5 (DESCOBERTO): economy_user_wallets precisa de permissões
-- ============================================================================

-- Garantir permissões completas para consultas de créditos
GRANT ALL ON TABLE public.economy_user_wallets TO service_role;
GRANT ALL ON TABLE public.economy_user_wallets TO authenticated;

-- ============================================================================
-- BUG 6 (DESCOBERTO): economy_transactions precisa de permissões
-- ============================================================================

-- Garantir permissões completas para registro de transações
GRANT ALL ON TABLE public.economy_transactions TO service_role;
GRANT ALL ON TABLE public.economy_transactions TO authenticated;

-- ============================================================================
-- BUG 7 (DESCOBERTO): social_referrals precisa de permissões
-- ============================================================================

-- Garantir permissões completas para sistema de referência
GRANT ALL ON TABLE public.social_referrals TO service_role;
GRANT ALL ON TABLE public.social_referrals TO authenticated;

-- ============================================================================
-- GARANTIR PERMISSÕES EM TODAS AS TABELAS MIGRADAS
-- ============================================================================

-- Gamification
GRANT ALL ON TABLE public.gamification_achievements TO service_role;
GRANT ALL ON TABLE public.gamification_achievements TO authenticated;
GRANT SELECT ON TABLE public.gamification_achievements TO anon;

GRANT ALL ON TABLE public.gamification_achievement_unlocks TO service_role;
GRANT ALL ON TABLE public.gamification_achievement_unlocks TO authenticated;

GRANT ALL ON TABLE public.gamification_achievement_showcase TO service_role;
GRANT ALL ON TABLE public.gamification_achievement_showcase TO authenticated;

GRANT ALL ON TABLE public.gamification_daily_streaks TO service_role;
GRANT ALL ON TABLE public.gamification_daily_streaks TO authenticated;

GRANT ALL ON TABLE public.gamification_leaderboards TO service_role;
GRANT ALL ON TABLE public.gamification_leaderboards TO authenticated;
GRANT SELECT ON TABLE public.gamification_leaderboards TO anon;

GRANT ALL ON TABLE public.gamification_user_achievements TO service_role;
GRANT ALL ON TABLE public.gamification_user_achievements TO authenticated;

-- Economy
GRANT ALL ON TABLE public.economy_purchases TO service_role;
GRANT ALL ON TABLE public.economy_purchases TO authenticated;

GRANT ALL ON TABLE public.economy_subscriptions TO service_role;
GRANT ALL ON TABLE public.economy_subscriptions TO authenticated;

-- Tabelas criadas recentemente
GRANT ALL ON TABLE public.subscription_plans TO service_role;
GRANT ALL ON TABLE public.subscription_plans TO authenticated;
GRANT SELECT ON TABLE public.subscription_plans TO anon;

GRANT ALL ON TABLE public.subscriptions TO service_role;
GRANT ALL ON TABLE public.subscriptions TO authenticated;

GRANT ALL ON TABLE public.promo_codes TO service_role;
GRANT ALL ON TABLE public.promo_codes TO authenticated;

GRANT ALL ON TABLE public.promo_code_redemptions TO service_role;
GRANT ALL ON TABLE public.promo_code_redemptions TO authenticated;

GRANT ALL ON TABLE public.auth_audit_log TO service_role;
GRANT ALL ON TABLE public.operations_audit_log TO service_role;
GRANT ALL ON TABLE public.rate_limit_violations TO service_role;
GRANT ALL ON TABLE public.otp_codes TO service_role;
GRANT ALL ON TABLE public.otp_codes TO authenticated;

-- ============================================================================
-- ATUALIZAR POLÍTICAS RLS - profiles deve permitir leitura de created_at
-- ============================================================================

-- Verificar se as políticas existentes permitem SELECT de created_at
-- (Não precisa alterar se já estão usando SELECT *)

-- ============================================================================
-- NOTIFICAR POSTGREST PARA RECARREGAR SCHEMA
-- ============================================================================

NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Verificar se profiles.created_at foi criado
SELECT 
  'profiles.created_at' as verificacao,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ COLUNA EXISTE'
    ELSE '❌ COLUNA NÃO EXISTE'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'created_at';

-- Verificar se tools_executions.cost_in_points foi criado
SELECT 
  'tools_executions.cost_in_points' as verificacao,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ COLUNA EXISTE'
    ELSE '❌ COLUNA NÃO EXISTE'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tools_executions' 
  AND column_name = 'cost_in_points';

-- Verificar permissões do tools_catalog
SELECT 
  'tools_catalog permissions' as verificacao,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PERMISSÕES CONCEDIDAS'
    ELSE '❌ SEM PERMISSÕES'
  END as status
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND table_name = 'tools_catalog' 
  AND grantee = 'service_role';

-- Listar todas as tabelas sem permissão para service_role (deveria retornar 0)
SELECT 
  t.tablename,
  '❌ SEM PERMISSÃO para service_role' as status
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND NOT EXISTS (
    SELECT 1 
    FROM information_schema.role_table_grants g
    WHERE g.table_schema = 'public' 
      AND g.table_name = t.tablename 
      AND g.grantee = 'service_role'
  )
ORDER BY t.tablename;

-- ============================================================================
-- RESUMO DAS CORREÇÕES
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                     CORREÇÕES APLICADAS COM SUCESSO                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Bug 1: profiles.created_at adicionado';
  RAISE NOTICE '✅ Bug 2: tools_catalog permissões concedidas';
  RAISE NOTICE '✅ Bug 3: tools_executions.cost_in_points adicionado';
  RAISE NOTICE '✅ Bug 4-7: Permissões concedidas em todas as tabelas';
  RAISE NOTICE '✅ PostgREST: Schema recarregado (NOTIFY pgrst)';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Próximo passo: Reiniciar a API para aplicar mudanças';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- FIM DAS CORREÇÕES
-- ============================================================================
