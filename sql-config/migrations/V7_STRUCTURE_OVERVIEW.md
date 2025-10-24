# 📊 ESTRUTURA V7 - Visão Geral do Banco de Dados

**Data**: 23/10/2025  
**Status**: Migração Completa

---

## 🗂️ SCHEMAS ORGANIZADOS

```
supabase_db/
├── auth.*              (Supabase nativo - não mexer)
├── public.*            (Mantém apenas profiles e configurações gerais)
├── economy.*           (💰 Sistema de Economia)
├── gamification.*      (🎮 Sistema de Conquistas)
├── tools.*             (🔧 Catálogo de Ferramentas)
├── social.*            (👥 Sistema Social)
└── audit.*             (🔍 Auditoria e Logs)
```

---

## 💰 SCHEMA: ECONOMY (Economia)

### Tabelas (7):

| Tabela | Registros | Descrição |
|--------|-----------|-----------|
| `user_wallets` | = usuários | Saldo de bônus + pontos comprados |
| `transactions` | muitos | Histórico completo de movimentações |
| `subscription_plans` | 2-3 | Planos Pro (mensal, anual) |
| `subscriptions` | poucos | Assinaturas ativas dos usuários |
| `point_packages` | 4 | Pacotes de compra (Básico, Médio, Premium, Empresarial) |
| `purchases` | poucos | Histórico de compras de pontos |
| `referral_rewards` | poucos | Bônus ganhos por indicações |

### Mapeamento (OLD → NEW):

```
public.user_points           → economy.user_wallets
  ├─ free_points             → bonus_credits
  └─ paid_points             → purchased_points

public.point_transactions    → economy.transactions
  ├─ point_type 'free'       → 'bonus'
  └─ point_type 'paid'       → 'purchased'

public.point_packages        → economy.point_packages
  └─ price_cents             → price_brl (dividido por 100)

public.purchases             → economy.purchases
  └─ (mantém estrutura)
```

---

## 🎮 SCHEMA: GAMIFICATION (Conquistas)

### Tabelas (6):

| Tabela | Registros | Descrição |
|--------|-----------|-----------|
| `achievements` | 40+ | Catálogo de conquistas (marco, maestria, consistência, secretas) |
| `user_achievements` | muitos | Conquistas desbloqueadas por usuário |
| `achievement_unlocks` | muitos | Histórico de desbloqueios (feed/notificações) |
| `achievement_showcase` | poucos | 6 conquistas favoritas no perfil |
| `leaderboards` | poucos | Rankings pré-calculados (global, semanal, mensal) |
| `daily_streaks` | = usuários | Controle de sequências diárias |

### Tipos de Conquista:

```javascript
'milestone'    // Marco (únicas): Perfil Completo, Primeira Ferramenta
'progressive'  // Maestria (níveis 1-5): Mestre das Ferramentas
'recurring'    // Consistência (resetam): Guerreiro Semanal, Campeão Mensal
'secret'       // Secretas: O Coruja, Rei do Feriado
```

---

## 🔧 SCHEMA: TOOLS (Ferramentas)

### Tabelas (3):

| Tabela | Registros | Descrição |
|--------|-----------|-----------|
| `catalog` | 15+ | Catálogo completo de ferramentas |
| `executions` | muitos | Log de todas as execuções |
| `user_favorites` | poucos | Ferramentas favoritadas por usuário |

### Mapeamento (OLD → NEW):

```
public.tool_costs            → tools.catalog
  ├─ tool_name               → tool_key
  ├─ points_cost             → points_cost
  └─ (novos campos):
      ├─ is_free_for_pro     (Planejamento = true)
      ├─ subcategory
      ├─ tags[]
      └─ estimated_time_minutes
```

### Ferramentas Grátis para Pro:

```sql
SELECT tool_key, display_name 
FROM tools.catalog 
WHERE is_free_for_pro = true;

-- Resultado:
planejamento_previdenciario
planejamento_trabalhista
planejamento_assistencial
```

---

## 👥 SCHEMA: SOCIAL (Sistema Social)

### Tabelas (4):

| Tabela | Registros | Descrição |
|--------|-----------|-----------|
| `user_privacy_settings` | = usuários | Configurações de privacidade (público/amigos/privado) |
| `friendships` | poucos | Relações de amizade entre usuários |
| `friend_requests` | poucos | Pedidos de amizade pendentes |
| `referrals` | poucos | Sistema de indicações (tracked) |

### Níveis de Privacidade:

```javascript
'public'        // 🌍 Todos podem ver
'friends_only'  // 👥 Apenas amigos
'private'       // 🔒 Apenas o próprio usuário
```

### Configurações Disponíveis:

```sql
achievements_visibility   -- Conquistas
profile_visibility        -- Perfil completo
stats_visibility          -- Estatísticas
friends_visibility        -- Lista de amigos
show_in_leaderboard       -- Aparecer no Hall da Fama
allow_friend_requests     -- Aceitar pedidos de amizade
```

---

## 🔍 SCHEMA: AUDIT (Auditoria)

### Tabelas (3):

| Tabela | Registros | Descrição |
|--------|-----------|-----------|
| `access_logs` | muitos | Logs de login, logout, etc |
| `security_events` | poucos | Eventos de segurança (rate limit, IPs bloqueados) |
| `admin_actions` | poucos | Ações administrativas (add pontos, ban, etc) |

### Severidades:

```javascript
'low'       // 🟢 Informativo
'medium'    // 🟡 Atenção
'high'      // 🟠 Importante
'critical'  // 🔴 Urgente
```

---

## 🔐 ROW LEVEL SECURITY (RLS)

### Regras Gerais:

1. **Usuários** veem apenas seus próprios dados
2. **Service Role** tem acesso total (backend)
3. **Públicas**: Catálogos (tools, achievements, pacotes)
4. **Privacidade**: Respeita configurações de `user_privacy_settings`

### Exemplos:

```sql
-- ✅ Permitido: Ver própria carteira
SELECT * FROM economy.user_wallets WHERE user_id = auth.uid();

-- ✅ Permitido: Ver conquistas públicas de outros
SELECT * FROM gamification.user_achievements 
WHERE user_id = 'outro-user-id'
  AND EXISTS (
    SELECT 1 FROM social.user_privacy_settings
    WHERE user_id = 'outro-user-id'
      AND achievements_visibility = 'public'
  );

-- ❌ Negado: Ver carteira de outro usuário
SELECT * FROM economy.user_wallets WHERE user_id = 'outro-user-id';
```

---

## 📊 COMPARAÇÃO: ANTES vs DEPOIS

### ANTES (Schema Único - public)

```
❌ Tudo misturado em public.*
❌ Difícil de manter
❌ Permissões genéricas
❌ Backup tudo ou nada
❌ 10 tabelas desorganizadas
```

### DEPOIS (5 Schemas Organizados)

```
✅ 5 schemas temáticos
✅ 23 tabelas bem organizadas
✅ Permissões granulares
✅ Backup por módulo
✅ Escalável (novos módulos fáceis)
✅ Manutenção facilitada
```

---

## 🎯 MÉTRICAS PÓS-MIGRAÇÃO

### Tamanho do Banco:

```sql
SELECT 
  schemaname,
  COUNT(*) as tables,
  pg_size_pretty(SUM(pg_total_relation_size(schemaname||'.'||tablename))) as size
FROM pg_tables
WHERE schemaname IN ('economy', 'gamification', 'tools', 'social', 'audit')
GROUP BY schemaname
ORDER BY schemaname;
```

### Contagem de Registros:

```sql
SELECT 
  'economy.user_wallets' as table, COUNT(*) as records FROM economy.user_wallets
UNION ALL
SELECT 'economy.transactions', COUNT(*) FROM economy.transactions
UNION ALL
SELECT 'tools.catalog', COUNT(*) FROM tools.catalog
UNION ALL
SELECT 'tools.executions', COUNT(*) FROM tools.executions
UNION ALL
SELECT 'gamification.achievements', COUNT(*) FROM gamification.achievements
UNION ALL
SELECT 'gamification.user_achievements', COUNT(*) FROM gamification.user_achievements
UNION ALL
SELECT 'social.user_privacy_settings', COUNT(*) FROM social.user_privacy_settings
UNION ALL
SELECT 'social.friendships', COUNT(*) FROM social.friendships
ORDER BY table;
```

---

## 🚀 BENEFÍCIOS DA NOVA ESTRUTURA

### 1. **Organização**
- Schemas temáticos facilitam navegação
- Fácil identificar onde está cada dado
- Documentação mais clara

### 2. **Segurança**
- RLS por schema
- Permissões granulares
- Auditoria centralizada

### 3. **Performance**
- Índices otimizados
- Queries mais eficientes
- Leaderboards pré-calculados

### 4. **Escalabilidade**
- Novos módulos isolados
- Sem poluição de schemas existentes
- Backup e restore seletivos

### 5. **Manutenção**
- Migrar schema específico
- Testar módulos isoladamente
- Rollback por schema

---

## 📖 REFERÊNCIA RÁPIDA

### Conexão Backend:

```javascript
// Antes
supabase.from('user_points')
supabase.from('point_transactions')
supabase.from('tool_costs')

// Depois
supabase.from('economy.user_wallets')
supabase.from('economy.transactions')
supabase.from('tools.catalog')
```

### Queries Comuns:

```sql
-- Saldo do usuário
SELECT bonus_credits, purchased_points, 
       (bonus_credits + purchased_points) as total
FROM economy.user_wallets
WHERE user_id = $1;

-- Histórico de transações
SELECT * FROM economy.transactions
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 20;

-- Conquistas desbloqueadas
SELECT a.title, a.icon, ua.unlocked_at, ua.bonus_earned
FROM gamification.user_achievements ua
JOIN gamification.achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = $1
ORDER BY ua.unlocked_at DESC;

-- Ferramentas favoritas
SELECT c.tool_key, c.display_name, c.points_cost
FROM tools.user_favorites uf
JOIN tools.catalog c ON uf.tool_id = c.id
WHERE uf.user_id = $1
ORDER BY uf.display_order;
```

---

## 🎉 CONCLUSÃO

A estrutura V7 transforma um banco de dados **monolítico e desorganizado** em um sistema **modular, escalável e profissional**.

**Total de schemas**: 5  
**Total de tabelas**: 23  
**Total de policies**: 40+  
**Compatibilidade**: 100% retrocompatível (após atualizar backend)

**Status**: ✅ Pronto para Produção
