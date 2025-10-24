# 🏗️ Estrutura Completa do Banco de Dados

> **Versão:** 7.0.0  
> **Data:** 23 de outubro de 2025

## 📊 Visão Geral

```
Supabase (Postgres 15.8.1)
│
├── 📦 economy (7 tabelas)
│   ├── user_wallets              → Carteiras dos usuários (bônus + comprados)
│   ├── transactions              → Histórico de transações
│   ├── subscription_plans        → Catálogo de planos (Pro)
│   ├── subscriptions             → Assinaturas ativas
│   ├── point_packages            → Pacotes de pontos à venda
│   ├── purchases                 → Histórico de compras
│   └── referral_rewards          → Recompensas por indicação
│
├── 🎮 gamification (6 tabelas)
│   ├── achievements              → Catálogo de conquistas
│   ├── user_achievements         → Progresso de conquistas
│   ├── achievement_unlocks       → Histórico de desbloqueios
│   ├── achievement_showcase      → Vitrine pública de conquistas
│   ├── leaderboards              → Rankings (global/semanal/mensal)
│   └── daily_streaks             → Sequências diárias de uso
│
├── 🔧 tools (3 tabelas)
│   ├── catalog                   → Catálogo de ferramentas
│   ├── executions                → Histórico de execuções
│   └── user_favorites            → Ferramentas favoritas
│
├── 👥 social (4 tabelas)
│   ├── user_privacy_settings     → Configurações de privacidade
│   ├── friendships               → Amizades estabelecidas
│   ├── friend_requests           → Pedidos de amizade pendentes
│   └── referrals                 → Sistema de indicações
│
└── 🔒 audit (3 tabelas)
    ├── access_logs               → Logs de acesso
    ├── security_events           → Eventos de segurança
    └── admin_actions             → Ações administrativas
```

## 🔗 Relacionamentos Principais

### Economy → Public (Users)
```
economy.user_wallets.user_id → auth.users.id
economy.transactions.user_id → auth.users.id
economy.subscriptions.user_id → auth.users.id
economy.purchases.user_id → auth.users.id
economy.referral_rewards.referrer_id → auth.users.id
```

### Economy → Economy (Interno)
```
economy.subscriptions.plan_id → economy.subscription_plans.id
economy.purchases.package_id → economy.point_packages.id
economy.transactions.wallet_id → economy.user_wallets.id
```

### Gamification → Public (Users)
```
gamification.user_achievements.user_id → auth.users.id
gamification.achievement_unlocks.user_id → auth.users.id
gamification.achievement_showcase.user_id → auth.users.id
gamification.leaderboards.user_id → auth.users.id
gamification.daily_streaks.user_id → auth.users.id
```

### Gamification → Gamification (Interno)
```
gamification.user_achievements.achievement_id → gamification.achievements.id
gamification.achievement_unlocks.achievement_id → gamification.achievements.id
```

### Tools → Public (Users)
```
tools.executions.user_id → auth.users.id
tools.user_favorites.user_id → auth.users.id
```

### Tools → Tools (Interno)
```
tools.executions.tool_id → tools.catalog.id
tools.user_favorites.tool_id → tools.catalog.id
```

### Social → Public (Users)
```
social.user_privacy_settings.user_id → auth.users.id
social.friendships.user_id → auth.users.id
social.friendships.friend_id → auth.users.id
social.friend_requests.requester_id → auth.users.id
social.friend_requests.requested_id → auth.users.id
social.referrals.referrer_id → auth.users.id
social.referrals.referred_id → auth.users.id
```

### Audit → Public (Users)
```
audit.access_logs.user_id → auth.users.id
audit.security_events.user_id → auth.users.id
audit.admin_actions.admin_id → auth.users.id
```

## 📋 Tabelas por Schema

### 💰 Economy (7 tabelas)

| Tabela | Descrição | Registros | RLS |
|--------|-----------|-----------|-----|
| `user_wallets` | Carteira dual (bônus + comprados) | 1 | ✅ |
| `transactions` | Histórico de transações | 1 | ✅ |
| `subscription_plans` | Planos de assinatura | 0 | ✅ |
| `subscriptions` | Assinaturas ativas | 0 | ✅ |
| `point_packages` | Pacotes à venda | 4 | ✅ |
| `purchases` | Compras realizadas | 0 | ✅ |
| `referral_rewards` | Recompensas por indicação | 0 | ✅ |

### 🎮 Gamification (6 tabelas)

| Tabela | Descrição | Registros | RLS |
|--------|-----------|-----------|-----|
| `achievements` | Conquistas disponíveis | 0 | ✅ |
| `user_achievements` | Progresso dos usuários | 0 | ✅ |
| `achievement_unlocks` | Histórico de desbloqueios | 0 | ✅ |
| `achievement_showcase` | Vitrine pública | 0 | ✅ |
| `leaderboards` | Rankings | 0 | ✅ |
| `daily_streaks` | Sequências diárias | 1 | ✅ |

### 🔧 Tools (3 tabelas)

| Tabela | Descrição | Registros | RLS |
|--------|-----------|-----------|-----|
| `catalog` | Ferramentas disponíveis | 15 | ✅ |
| `executions` | Histórico de uso | 0 | ✅ |
| `user_favorites` | Favoritos dos usuários | 0 | ✅ |

### 👥 Social (4 tabelas)

| Tabela | Descrição | Registros | RLS |
|--------|-----------|-----------|-----|
| `user_privacy_settings` | Configurações de privacidade | 1 | ✅ |
| `friendships` | Amizades ativas | 0 | ✅ |
| `friend_requests` | Pedidos pendentes | 0 | ✅ |
| `referrals` | Indicações realizadas | 1 | ✅ |

### 🔒 Audit (3 tabelas)

| Tabela | Descrição | Registros | RLS |
|--------|-----------|-----------|-----|
| `access_logs` | Logs de acesso ao sistema | 0 | ✅ |
| `security_events` | Eventos de segurança | 0 | ✅ |
| `admin_actions` | Ações administrativas | 0 | ✅ |

## 🔢 Estatísticas Totais

- **Total de Schemas:** 5
- **Total de Tabelas:** 23
- **Total de ENUMs:** 7
- **Total de Políticas RLS:** 40
- **Registros Migrados:** ~22

## 🎯 Convenções de Nomenclatura

### Tabelas
- Sempre no plural: `user_wallets`, `transactions`, `achievements`
- Snake_case: `user_privacy_settings`, `friend_requests`
- Nome descritivo: `achievement_unlocks` (não `unlocks`)

### Colunas
- IDs sempre `id` (UUID, primary key)
- Foreign keys: `{entidade}_id` (`user_id`, `tool_id`, `achievement_id`)
- Timestamps: `created_at`, `updated_at`, `expires_at`, `unlocked_at`
- Booleans: `is_active`, `is_public`, `is_completed`
- Valores monetários: `{nome}_brl` (`price_brl`, `amount_brl`)

### ENUMs
- Sempre no singular: `transaction_type`, `achievement_type`
- Valores em snake_case: `bonus_credits`, `purchased_points`
- Schema prefixado: `economy.transaction_type`, `social.visibility_level`

## 📦 Schemas e suas Responsabilidades

| Schema | Responsabilidade | Tabelas |
|--------|------------------|---------|
| `economy` | Sistema financeiro (pontos, assinaturas, compras) | 7 |
| `gamification` | Sistema de conquistas e engajamento | 6 |
| `tools` | Catálogo e execução de ferramentas | 3 |
| `social` | Sistema social (amigos, privacidade, referências) | 4 |
| `audit` | Auditoria e segurança | 3 |

## 🔐 Segurança (RLS)

Todas as 23 tabelas possuem **Row Level Security** habilitado com políticas específicas:

### Regras Gerais
- ✅ **Usuários autenticados** veem apenas próprios dados sensíveis
- ✅ **Catálogos públicos** são visíveis para todos usuários autenticados
- ✅ **Service Role** tem acesso total para operações do backend
- ✅ **Usuários anônimos** não têm acesso a nenhuma tabela

### Exemplos de Políticas
```sql
-- Usuário vê apenas própria carteira
CREATE POLICY "users_view_own_wallet" 
ON economy.user_wallets FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

-- Todos veem ferramentas ativas
CREATE POLICY "anyone_view_active_tools" 
ON tools.catalog FOR SELECT TO authenticated 
USING (is_active = true);

-- Backend tem acesso total
CREATE POLICY "service_manage_wallets" 
ON economy.user_wallets FOR ALL TO service_role 
USING (true) WITH CHECK (true);
```

## 🔄 Fluxo de Dados Típico

### 1. Cadastro de Usuário
```
auth.users (novo registro)
    ↓
economy.user_wallets (criada automaticamente, 100 pontos bônus)
    ↓
economy.transactions (registro de bônus de cadastro)
    ↓
social.user_privacy_settings (configurações padrão)
    ↓
gamification.daily_streaks (inicializado)
```

### 2. Uso de Ferramenta
```
tools.catalog (consulta custo)
    ↓
economy.user_wallets (deduz pontos)
    ↓
economy.transactions (registra débito)
    ↓
tools.executions (registra uso)
    ↓
gamification.user_achievements (atualiza progresso)
```

### 3. Compra de Pontos
```
economy.point_packages (seleção do pacote)
    ↓
payment_gateway (processamento externo)
    ↓
economy.purchases (registro da compra)
    ↓
economy.user_wallets (adiciona pontos comprados)
    ↓
economy.transactions (registra crédito)
```

### 4. Desbloqueio de Conquista
```
gamification.user_achievements (progresso 100%)
    ↓
gamification.achievement_unlocks (registro do desbloqueio)
    ↓
economy.user_wallets (adiciona pontos de recompensa)
    ↓
economy.transactions (registra bônus)
    ↓
gamification.leaderboards (atualiza ranking)
```

---

**💡 Próximos Documentos:**
- [SCHEMAS.md](./SCHEMAS.md) - Detalhes de cada schema
- [ENUMS.md](./ENUMS.md) - Lista completa de ENUMs
- [SECURITY.md](./SECURITY.md) - Políticas RLS detalhadas
