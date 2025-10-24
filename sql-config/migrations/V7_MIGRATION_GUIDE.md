# 🚀 GUIA DE MIGRAÇÃO V7 - Passo a Passo

**Data**: 23/10/2025  
**Objetivo**: Migrar estrutura do Supabase para schemas organizados  
**Tempo Estimado**: 15-30 minutos

---

## ⚠️ PRÉ-REQUISITOS

### 1. Fazer Backup Completo
```bash
# No Supabase Dashboard → Database → Backups
# OU via CLI:
supabase db dump > backup_pre_v7_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Verificar Estado Atual
Execute no SQL Editor do Supabase:
```sql
-- Contar registros atuais
SELECT 'user_points' as tabela, COUNT(*) as total FROM public.user_points
UNION ALL
SELECT 'point_transactions', COUNT(*) FROM public.point_transactions
UNION ALL
SELECT 'point_packages', COUNT(*) FROM public.point_packages
UNION ALL
SELECT 'tool_costs', COUNT(*) FROM public.tool_costs
UNION ALL
SELECT 'purchases', COUNT(*) FROM public.purchases
UNION ALL
SELECT 'profiles', COUNT(*) FROM public.profiles;
```

**Anote os números!** Vamos validar depois da migração.

---

## 📋 ORDEM DE EXECUÇÃO

### ✅ ETAPA 1: Criar Schemas (2 minutos)

**Arquivo**: `v7_001_create_schemas.sql`

1. Abrir Supabase Dashboard → SQL Editor
2. Copiar TODO o conteúdo de `v7_001_create_schemas.sql`
3. Colar no editor
4. Clicar em **RUN**
5. Aguardar mensagem: `✅ SCHEMAS CRIADOS`

**Verificação**:
```sql
-- Deve retornar 5 schemas
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name IN ('economy', 'gamification', 'tools', 'social', 'audit');
```

---

### ✅ ETAPA 2: Criar Tabelas - Economy e Tools (3 minutos)

**Arquivo**: `v7_002_create_tables_economy_tools.sql`

1. SQL Editor → Nova Query
2. Copiar TODO o conteúdo de `v7_002_create_tables_economy_tools.sql`
3. Colar e **RUN**
4. Aguardar conclusão

**Verificação**:
```sql
-- Deve retornar 10 tabelas
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_schema IN ('economy', 'tools')
ORDER BY table_schema, table_name;
```

---

### ✅ ETAPA 3: Criar Tabelas - Gamification e Social (3 minutos)

**Arquivo**: `v7_003_create_tables_gamification_social.sql`

1. SQL Editor → Nova Query
2. Copiar TODO o conteúdo de `v7_003_create_tables_gamification_social.sql`
3. Colar e **RUN**
4. Aguardar conclusão

**Verificação**:
```sql
-- Deve retornar 13 tabelas
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_schema IN ('gamification', 'social', 'audit')
ORDER BY table_schema, table_name;
```

---

### ✅ ETAPA 4: Migrar Dados (5 minutos) ⚠️ CRÍTICO

**Arquivo**: `v7_004_migrate_data.sql`

⚠️ **ATENÇÃO**: Este script MOVE os dados das tabelas antigas para as novas!

1. SQL Editor → Nova Query
2. Copiar TODO o conteúdo de `v7_004_migrate_data.sql`
3. Colar e **RUN**
4. Aguardar mensagens de verificação

**Mensagens Esperadas**:
```
✅ user_points migrado: X registros
✅ point_transactions migrado: X registros
✅ point_packages migrado: X registros
✅ tool_costs migrado: X registros
✅ Privacidade criada para X usuários
✅ Daily streaks criados para X usuários
✅ MIGRAÇÃO V7 CONCLUÍDA COM SUCESSO!
```

**Verificação**:
```sql
-- Comparar totais (devem ser iguais)
SELECT 
  (SELECT COUNT(*) FROM public.user_points) as old_points,
  (SELECT COUNT(*) FROM economy.user_wallets) as new_wallets,
  (SELECT COUNT(*) FROM public.point_transactions) as old_transactions,
  (SELECT COUNT(*) FROM economy.transactions) as new_transactions,
  (SELECT COUNT(*) FROM public.tool_costs) as old_tools,
  (SELECT COUNT(*) FROM tools.catalog) as new_catalog;
```

---

### ✅ ETAPA 5: Configurar RLS Policies (2 minutos)

**Arquivo**: `v7_005_create_rls_policies.sql`

1. SQL Editor → Nova Query
2. Copiar TODO o conteúdo de `v7_005_create_rls_policies.sql`
3. Colar e **RUN**
4. Aguardar mensagem: `✅ RLS POLICIES CRIADAS COM SUCESSO!`

**Verificação**:
```sql
-- Deve retornar várias policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname IN ('economy', 'gamification', 'tools', 'social', 'audit')
ORDER BY schemaname, tablename;
```

---

## ✅ VERIFICAÇÃO FINAL

Execute este script para validar TUDO:

```sql
DO $$
DECLARE
  count_schemas INTEGER;
  count_tables INTEGER;
  count_policies INTEGER;
  count_users INTEGER;
  count_wallets INTEGER;
BEGIN
  -- Contar schemas
  SELECT COUNT(*) INTO count_schemas
  FROM information_schema.schemata 
  WHERE schema_name IN ('economy', 'gamification', 'tools', 'social', 'audit');
  
  -- Contar tabelas
  SELECT COUNT(*) INTO count_tables
  FROM information_schema.tables 
  WHERE table_schema IN ('economy', 'gamification', 'tools', 'social', 'audit');
  
  -- Contar policies
  SELECT COUNT(*) INTO count_policies
  FROM pg_policies 
  WHERE schemaname IN ('economy', 'gamification', 'tools', 'social', 'audit');
  
  -- Contar usuários e wallets
  SELECT COUNT(*) INTO count_users FROM auth.users;
  SELECT COUNT(*) INTO count_wallets FROM economy.user_wallets;
  
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '✅ VERIFICAÇÃO FINAL DA MIGRAÇÃO V7';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Schemas criados: % (esperado: 5)', count_schemas;
  RAISE NOTICE 'Tabelas criadas: % (esperado: 23)', count_tables;
  RAISE NOTICE 'Policies criadas: % (esperado: >40)', count_policies;
  RAISE NOTICE '';
  RAISE NOTICE 'Usuários: %', count_users;
  RAISE NOTICE 'Wallets: %', count_wallets;
  RAISE NOTICE '';
  
  IF count_schemas = 5 AND count_tables = 23 AND count_users = count_wallets THEN
    RAISE NOTICE '✅ MIGRAÇÃO 100%% CONCLUÍDA E VALIDADA!';
  ELSE
    RAISE WARNING '⚠️ Verificar discrepâncias acima';
  END IF;
  
  RAISE NOTICE '════════════════════════════════════════';
END $$;
```

---

## 🎯 PRÓXIMOS PASSOS

Após migração bem-sucedida:

### 1. Atualizar Backend (API)
- [ ] Atualizar `pointsService.js` para usar `economy.user_wallets`
- [ ] Atualizar `toolsController.js` para usar `tools.catalog`
- [ ] Criar novos services: `subscriptionService.js`, `achievementsService.js`

### 2. Testar Endpoints
```bash
# Testar se API ainda funciona
curl http://localhost:3000/api/user/profile
curl http://localhost:3000/api/points/balance
curl http://localhost:3000/api/tools/list
```

### 3. (Opcional) Remover Tabelas Antigas
⚠️ **SÓ DEPOIS DE TESTAR TUDO EM PRODUÇÃO!**

```sql
-- BACKUP ANTES!
DROP TABLE IF EXISTS public.user_points CASCADE;
DROP TABLE IF EXISTS public.point_transactions CASCADE;
DROP TABLE IF EXISTS public.tool_costs CASCADE;
DROP TABLE IF EXISTS public.purchases CASCADE;
DROP TABLE IF EXISTS public.point_packages CASCADE;
```

---

## 🆘 ROLLBACK (Em Caso de Emergência)

Se algo der errado:

### Opção 1: Restaurar Backup
```bash
psql -h db.xxx.supabase.co -U postgres -d postgres < backup_pre_v7.sql
```

### Opção 2: Dropar Schemas Novos
```sql
-- ⚠️ Isso apaga TUDO dos novos schemas!
DROP SCHEMA IF EXISTS economy CASCADE;
DROP SCHEMA IF EXISTS gamification CASCADE;
DROP SCHEMA IF EXISTS tools CASCADE;
DROP SCHEMA IF EXISTS social CASCADE;
DROP SCHEMA IF EXISTS audit CASCADE;
```

---

## 📊 Checklist de Execução

```
┌─────────────────────────────────────────┐
│ MIGRAÇÃO V7 - CHECKLIST                 │
└─────────────────────────────────────────┘

Preparação:
☐ Backup completo realizado
☐ Números atuais anotados

Execução:
☐ ETAPA 1: Schemas criados (5 schemas)
☐ ETAPA 2: Tabelas economy/tools criadas (10 tabelas)
☐ ETAPA 3: Tabelas gamification/social criadas (13 tabelas)
☐ ETAPA 4: Dados migrados (verificações ✅)
☐ ETAPA 5: RLS policies criadas (>40 policies)

Validação:
☐ Verificação final executada
☐ Totais conferem (old = new)
☐ API testada e funcionando

Finalização:
☐ Backend atualizado
☐ Testes de integração passando
☐ (Opcional) Tabelas antigas removidas
```

---

## 💡 Dicas

1. **Execute SEQUENCIALMENTE**: Não pule etapas!
2. **Leia os NOTICES**: Eles mostram o progresso
3. **Compare SEMPRE**: Verifique totais antes e depois
4. **Teste em DEV primeiro**: Se tiver ambiente de teste
5. **Documente problemas**: Anote erros para debug

---

## 📞 Suporte

Se encontrar erros:
1. Anote a mensagem de erro completa
2. Verifique qual etapa falhou
3. Restaure o backup
4. Compartilhe o erro para análise

**Boa migração! 🚀**
