-- ============================================
-- ✅ PASSO 2: CRIAR SCHEMAS
-- ============================================
-- Execute no SQL Editor (https://mpanel.samm.host)
-- Tempo estimado: 30 segundos
-- ============================================

-- Criar schemas organizados
CREATE SCHEMA IF NOT EXISTS economy;
CREATE SCHEMA IF NOT EXISTS gamification;
CREATE SCHEMA IF NOT EXISTS tools;
CREATE SCHEMA IF NOT EXISTS social;
CREATE SCHEMA IF NOT EXISTS audit;

-- Comentários (documentação)
COMMENT ON SCHEMA economy IS '💰 Sistema de economia: pontos, créditos, assinaturas Pro e pagamentos';
COMMENT ON SCHEMA gamification IS '🎮 Sistema de gamificação: conquistas, progressão e rankings';
COMMENT ON SCHEMA tools IS '🔧 Catálogo e gestão de ferramentas da plataforma';
COMMENT ON SCHEMA social IS '👥 Sistema social: amizades, referências e configurações de privacidade';
COMMENT ON SCHEMA audit IS '🔍 Auditoria e logs de segurança do sistema';

-- Permissões básicas
GRANT USAGE ON SCHEMA economy TO authenticated;
GRANT USAGE ON SCHEMA gamification TO authenticated;
GRANT USAGE ON SCHEMA tools TO authenticated;
GRANT USAGE ON SCHEMA social TO authenticated;
GRANT USAGE ON SCHEMA audit TO authenticated;

GRANT ALL ON SCHEMA economy TO service_role;
GRANT ALL ON SCHEMA gamification TO service_role;
GRANT ALL ON SCHEMA tools TO service_role;
GRANT ALL ON SCHEMA social TO service_role;
GRANT ALL ON SCHEMA audit TO service_role;

-- ============================================
-- ✅ VERIFICAÇÃO
-- ============================================

SELECT 
  schema_name,
  CASE 
    WHEN schema_name = 'economy' THEN '💰 Economia'
    WHEN schema_name = 'gamification' THEN '🎮 Gamificação'
    WHEN schema_name = 'tools' THEN '🔧 Ferramentas'
    WHEN schema_name = 'social' THEN '👥 Social'
    WHEN schema_name = 'audit' THEN '🔍 Auditoria'
  END as descricao
FROM information_schema.schemata 
WHERE schema_name IN ('economy', 'gamification', 'tools', 'social', 'audit')
ORDER BY schema_name;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- schema_name    | descricao
-- ---------------|-------------
-- audit          | 🔍 Auditoria
-- economy        | 💰 Economia
-- gamification   | 🎮 Gamificação
-- social         | 👥 Social
-- tools          | 🔧 Ferramentas
--
-- Total: 5 schemas
-- ============================================

-- ✅ Se aparecerem os 5 schemas, prossiga para PASSO 3!
