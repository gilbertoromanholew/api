# 📚 Documentação do Banco de Dados - Nova Economia V7

> **Última atualização:** 23 de outubro de 2025  
> **Versão:** 7.0.0  
> **Status:** ✅ Migração Completa

## 📋 Índice da Documentação

### 🏗️ Estrutura Geral
- **[STRUCTURE.md](./STRUCTURE.md)** - Visão geral completa dos 5 schemas e 23 tabelas
- **[SCHEMAS.md](./SCHEMAS.md)** - Detalhamento de cada schema e sua responsabilidade
- **[ENUMS.md](./ENUMS.md)** - Lista completa de todos os 7 tipos ENUM criados

### 💰 Economy Schema
- **[economy/USER_WALLETS.md](./economy/USER_WALLETS.md)** - Carteiras dos usuários (bônus + comprados)
- **[economy/TRANSACTIONS.md](./economy/TRANSACTIONS.md)** - Histórico de transações de pontos
- **[economy/SUBSCRIPTION_PLANS.md](./economy/SUBSCRIPTION_PLANS.md)** - Planos de assinatura (Pro)
- **[economy/SUBSCRIPTIONS.md](./economy/SUBSCRIPTIONS.md)** - Assinaturas ativas dos usuários
- **[economy/POINT_PACKAGES.md](./economy/POINT_PACKAGES.md)** - Pacotes de pontos à venda
- **[economy/PURCHASES.md](./economy/PURCHASES.md)** - Histórico de compras
- **[economy/REFERRAL_REWARDS.md](./economy/REFERRAL_REWARDS.md)** - Recompensas por indicação

### 🎮 Gamification Schema
- **[gamification/ACHIEVEMENTS.md](./gamification/ACHIEVEMENTS.md)** - Catálogo de conquistas
- **[gamification/USER_ACHIEVEMENTS.md](./gamification/USER_ACHIEVEMENTS.md)** - Progresso de conquistas
- **[gamification/ACHIEVEMENT_UNLOCKS.md](./gamification/ACHIEVEMENT_UNLOCKS.md)** - Histórico de desbloqueios
- **[gamification/ACHIEVEMENT_SHOWCASE.md](./gamification/ACHIEVEMENT_SHOWCASE.md)** - Vitrine de conquistas
- **[gamification/LEADERBOARDS.md](./gamification/LEADERBOARDS.md)** - Rankings (global/semanal/mensal)
- **[gamification/DAILY_STREAKS.md](./gamification/DAILY_STREAKS.md)** - Sequências diárias

### 🔧 Tools Schema
- **[tools/CATALOG.md](./tools/CATALOG.md)** - Catálogo de ferramentas
- **[tools/EXECUTIONS.md](./tools/EXECUTIONS.md)** - Histórico de uso de ferramentas
- **[tools/USER_FAVORITES.md](./tools/USER_FAVORITES.md)** - Ferramentas favoritas

### 👥 Social Schema
- **[social/USER_PRIVACY_SETTINGS.md](./social/USER_PRIVACY_SETTINGS.md)** - Configurações de privacidade
- **[social/FRIENDSHIPS.md](./social/FRIENDSHIPS.md)** - Amizades estabelecidas
- **[social/FRIEND_REQUESTS.md](./social/FRIEND_REQUESTS.md)** - Pedidos de amizade
- **[social/REFERRALS.md](./social/REFERRALS.md)** - Sistema de indicações

### 🔒 Audit Schema
- **[audit/ACCESS_LOGS.md](./audit/ACCESS_LOGS.md)** - Logs de acesso
- **[audit/SECURITY_EVENTS.md](./audit/SECURITY_EVENTS.md)** - Eventos de segurança
- **[audit/ADMIN_ACTIONS.md](./audit/ADMIN_ACTIONS.md)** - Ações administrativas

### 🔐 Segurança
- **[SECURITY.md](./SECURITY.md)** - Row Level Security (RLS) e políticas
- **[ROLES.md](./ROLES.md)** - Roles e permissões (authenticated, service_role)

### 🔄 Migração
- **[MIGRATION_HISTORY.md](./MIGRATION_HISTORY.md)** - Histórico completo da migração V7
- **[OLD_VS_NEW.md](./OLD_VS_NEW.md)** - Mapeamento tabelas antigas → novas

## 🎯 Resumo da Arquitetura

### 5 Schemas Organizados
```
├── economy       → 7 tabelas (💰 Sistema financeiro)
├── gamification  → 6 tabelas (🎮 Conquistas e rankings)
├── tools         → 3 tabelas (🔧 Ferramentas e execuções)
├── social        → 4 tabelas (👥 Sistema social)
└── audit         → 3 tabelas (🔒 Auditoria e segurança)
```

### 23 Tabelas Total
- **Economy:** user_wallets, transactions, subscription_plans, subscriptions, point_packages, purchases, referral_rewards
- **Gamification:** achievements, user_achievements, achievement_unlocks, achievement_showcase, leaderboards, daily_streaks
- **Tools:** catalog, executions, user_favorites
- **Social:** user_privacy_settings, friendships, friend_requests, referrals
- **Audit:** access_logs, security_events, admin_actions

### 7 ENUMs Criados
- `economy.transaction_type` - Tipos de transação (credit, debit, refund, adjustment, bonus, purchase, subscription)
- `economy.point_type` - Tipos de ponto (bonus, purchased, free)
- `economy.subscription_status` - Status de assinatura (active, canceled, expired, suspended)
- `economy.purchase_status` - Status de compra (pending, completed, failed, refunded)
- `gamification.achievement_type` - Tipos de conquista (milestone, progressive, recurring, secret)
- `social.visibility_level` - Níveis de privacidade (public, friends, private)
- `social.friendship_status` - Status de amizade (active, blocked)

### 40 Políticas RLS
Segurança habilitada em todas as 23 tabelas com políticas granulares:
- ✅ Usuários veem apenas próprios dados sensíveis
- ✅ Catálogos públicos (ferramentas, conquistas, pacotes)
- ✅ Service_role tem acesso total para backend

## 🚀 Status da Implementação

| Componente | Status | Data |
|------------|--------|------|
| Schemas criados | ✅ Completo | 23/10/2025 |
| Tabelas criadas | ✅ Completo | 23/10/2025 |
| Dados migrados | ✅ Completo | 23/10/2025 |
| RLS configurado | ✅ Completo | 23/10/2025 |
| Backend atualizado | ⏳ Pendente | - |
| Frontend atualizado | ⏳ Pendente | - |
| Conquistas populadas | ⏳ Pendente | - |
| Plano Pro criado | ⏳ Pendente | - |

## 📊 Estatísticas da Migração

- **Usuários migrados:** 1
- **Pontos migrados:** 100 (bônus)
- **Ferramentas migradas:** 15
- **Pacotes migrados:** 4
- **Transações migradas:** 1
- **Compras migradas:** 0

## 🔗 Links Úteis

- **Supabase Dashboard:** https://mpanel.samm.host
- **SQL Editor:** https://mpanel.samm.host/project/default/sql
- **Table Editor:** https://mpanel.samm.host/project/default/editor

## 📖 Como Usar Esta Documentação

1. **Para consultar estrutura de tabela:** Abra o arquivo .md específico da tabela
2. **Para entender relacionamentos:** Veja STRUCTURE.md
3. **Para mapear código antigo → novo:** Consulte OLD_VS_NEW.md
4. **Para verificar segurança:** Consulte SECURITY.md
5. **Para revisar migração:** Veja MIGRATION_HISTORY.md

---

**💡 Dica:** Mantenha esta documentação atualizada sempre que modificar a estrutura do banco!
