# 📦 Schemas do Banco de Dados

> **Total de Schemas:** 5  
> **Versão:** 7.0.0

## 1️⃣ Schema `economy` 💰

**Responsabilidade:** Sistema financeiro completo (pontos, assinaturas, compras)

**Tabelas (7):**
- `user_wallets` - Carteiras dos usuários
- `transactions` - Histórico de transações
- `subscription_plans` - Planos de assinatura
- `subscriptions` - Assinaturas ativas
- `point_packages` - Pacotes de pontos
- `purchases` - Histórico de compras
- `referral_rewards` - Recompensas de indicação

**ENUMs (4):**
- `transaction_type` - Tipos de transação
- `point_type` - Tipos de ponto
- `subscription_status` - Status de assinatura
- `purchase_status` - Status de compra

**Conceitos-Chave:**

### Economia Dual de Pontos
```
Carteira do Usuário
├── Créditos Bônus (🎁)
│   ├── Ganhos em ações gratuitas
│   ├── Consumidos primeiro (FIFO)
│   └── Exemplos: cadastro, conquistas, indicações
│
└── Pontos Comprados (💸)
    ├── Adquiridos via pagamento
    ├── Validade indefinida
    └── Consumidos após bônus acabar
```

### Fluxo de Transações
```
Ação do Usuário
    ↓
economy.transactions (registro)
    ↓
economy.user_wallets (atualização de saldo)
```

**Queries Comuns:**
```sql
-- Saldo total do usuário
SELECT 
  bonus_credits,
  purchased_points,
  (bonus_credits + purchased_points) as total_points
FROM economy.user_wallets
WHERE user_id = auth.uid();

-- Histórico de transações (últimas 10)
SELECT 
  type,
  amount,
  description,
  created_at
FROM economy.transactions t
JOIN economy.user_wallets w ON w.id = t.wallet_id
WHERE w.user_id = auth.uid()
ORDER BY t.created_at DESC
LIMIT 10;

-- Verificar se é assinante Pro
SELECT EXISTS(
  SELECT 1 FROM economy.subscriptions
  WHERE user_id = auth.uid()
  AND status = 'active'
  AND expires_at > NOW()
) as is_pro_member;
```

---

## 2️⃣ Schema `gamification` 🎮

**Responsabilidade:** Sistema de conquistas, rankings e engajamento

**Tabelas (6):**
- `achievements` - Catálogo de conquistas
- `user_achievements` - Progresso dos usuários
- `achievement_unlocks` - Histórico de desbloqueios
- `achievement_showcase` - Vitrine pública
- `leaderboards` - Rankings
- `daily_streaks` - Sequências diárias

**ENUMs (1):**
- `achievement_type` - Tipos de conquista

**Conceitos-Chave:**

### Tipos de Conquistas
```
Conquistas
├── Milestone (marcos únicos)
│   └── Ex: "Primeira Ferramenta" (+10 pts)
│
├── Progressive (níveis I-V)
│   └── Ex: "Mestre das Ferramentas" (10→1000 usos)
│
├── Recurring (recorrentes)
│   └── Ex: "Guerreiro Semanal" (7 dias seguidos)
│
└── Secret (ocultas)
    └── Ex: "O Coruja" (usar 2-4h da manhã)
```

### Fluxo de Desbloqueio
```
Ação do Usuário
    ↓
gamification.user_achievements (progresso atualizado)
    ↓
Progresso = 100%?
    ↓ SIM
gamification.achievement_unlocks (registro)
    ↓
economy.transactions (recompensa em pontos)
    ↓
gamification.leaderboards (atualização de ranking)
```

**Queries Comuns:**
```sql
-- Conquistas do usuário (desbloqueadas)
SELECT 
  a.name,
  a.description,
  a.reward_points,
  au.unlocked_at
FROM gamification.achievement_unlocks au
JOIN gamification.achievements a ON a.id = au.achievement_id
WHERE au.user_id = auth.uid()
ORDER BY au.unlocked_at DESC;

-- Progresso de conquistas ativas
SELECT 
  a.name,
  ua.current_progress,
  a.target_value,
  ROUND((ua.current_progress::DECIMAL / a.target_value) * 100, 2) as percentage
FROM gamification.user_achievements ua
JOIN gamification.achievements a ON a.id = ua.achievement_id
WHERE ua.user_id = auth.uid()
AND ua.is_completed = false
ORDER BY percentage DESC;

-- Ranking global (Top 10)
SELECT 
  u.email,
  l.total_points,
  l.total_achievements,
  l.rank_position
FROM gamification.leaderboards l
JOIN auth.users u ON u.id = l.user_id
WHERE l.period_type = 'global'
ORDER BY l.rank_position ASC
LIMIT 10;
```

---

## 3️⃣ Schema `tools` 🔧

**Responsabilidade:** Catálogo de ferramentas e execuções

**Tabelas (3):**
- `catalog` - Ferramentas disponíveis
- `executions` - Histórico de uso
- `user_favorites` - Favoritos

**Conceitos-Chave:**

### Catálogo de Ferramentas
```
Ferramenta
├── Metadados
│   ├── name, slug, description
│   ├── icon_url, category
│   └── is_active
│
├── Custo
│   ├── base_cost (pontos base)
│   └── pro_multiplier (desconto Pro)
│
└── Limites
    ├── max_executions_free (limite gratuito)
    └── max_executions_pro (limite Pro)
```

### Cálculo de Custo
```javascript
// Usuário comum
const cost = tool.base_cost;

// Usuário Pro
const cost = Math.round(tool.base_cost * tool.pro_multiplier);
// Exemplo: 50 pontos × 0.5 = 25 pontos (50% desconto)
```

**Queries Comuns:**
```sql
-- Ferramentas mais usadas (Top 5)
SELECT 
  t.name,
  t.base_cost,
  COUNT(e.id) as total_executions
FROM tools.catalog t
LEFT JOIN tools.executions e ON e.tool_id = t.id
WHERE t.is_active = true
GROUP BY t.id, t.name, t.base_cost
ORDER BY total_executions DESC
LIMIT 5;

-- Favoritos do usuário
SELECT 
  t.name,
  t.slug,
  t.base_cost,
  f.created_at as favorited_at
FROM tools.user_favorites f
JOIN tools.catalog t ON t.id = f.tool_id
WHERE f.user_id = auth.uid()
ORDER BY f.created_at DESC;

-- Histórico de execuções do usuário
SELECT 
  t.name,
  e.points_spent,
  e.created_at
FROM tools.executions e
JOIN tools.catalog t ON t.id = e.tool_id
WHERE e.user_id = auth.uid()
ORDER BY e.created_at DESC
LIMIT 20;
```

---

## 4️⃣ Schema `social` 👥

**Responsabilidade:** Sistema social (privacidade, amigos, indicações)

**Tabelas (4):**
- `user_privacy_settings` - Configurações de privacidade
- `friendships` - Amizades
- `friend_requests` - Pedidos de amizade
- `referrals` - Indicações

**ENUMs (2):**
- `visibility_level` - Níveis de privacidade
- `friendship_status` - Status de amizade

**Conceitos-Chave:**

### Sistema de Privacidade
```
Configurações de Privacidade
├── profile_visibility (public/friends/private)
├── achievements_visibility (public/friends/private)
├── leaderboard_visibility (public/friends/private)
└── tools_history_visibility (public/friends/private)
```

### Fluxo de Amizade
```
[Usuário A] envia pedido → friend_requests (pending)
                            ↓
[Usuário B] aceita → friendships (status: active)
                     DELETE friend_requests
                     ↓
Ambos podem ver dados com visibilidade 'friends'
```

### Sistema de Indicações
```
[Usuário A] indica [Usuário B]
    ↓
social.referrals (registro)
    ↓
[Usuário B] completa cadastro
    ↓
economy.referral_rewards (recompensa para A)
    ↓
economy.transactions (crédito de pontos)
```

**Queries Comuns:**
```sql
-- Amigos ativos
SELECT 
  u.email,
  f.created_at as friends_since
FROM social.friendships f
JOIN auth.users u ON u.id = CASE 
  WHEN f.user_id = auth.uid() THEN f.friend_id
  ELSE f.user_id
END
WHERE (f.user_id = auth.uid() OR f.friend_id = auth.uid())
AND f.status = 'active'
ORDER BY f.created_at DESC;

-- Pedidos de amizade pendentes
SELECT 
  u.email as requester_email,
  fr.created_at
FROM social.friend_requests fr
JOIN auth.users u ON u.id = fr.requester_id
WHERE fr.requested_id = auth.uid()
ORDER BY fr.created_at DESC;

-- Minhas indicações e recompensas
SELECT 
  referred_user.email as referred_email,
  r.created_at as referred_at,
  rr.reward_points,
  rr.awarded_at
FROM social.referrals r
JOIN auth.users referred_user ON referred_user.id = r.referred_id
LEFT JOIN economy.referral_rewards rr ON rr.referral_id = r.id
WHERE r.referrer_id = auth.uid()
ORDER BY r.created_at DESC;
```

---

## 5️⃣ Schema `audit` 🔒

**Responsabilidade:** Auditoria, logs e segurança

**Tabelas (3):**
- `access_logs` - Logs de acesso
- `security_events` - Eventos de segurança
- `admin_actions` - Ações administrativas

**Conceitos-Chave:**

### Logs de Acesso
```
Access Log
├── user_id (quem acessou)
├── ip_address (de onde)
├── user_agent (qual navegador)
├── action (o que fez)
└── created_at (quando)
```

### Eventos de Segurança
```
Security Event
├── event_type (login_failed, suspicious_activity, etc)
├── severity (low, medium, high, critical)
├── metadata (detalhes JSON)
└── is_resolved (se foi tratado)
```

**Queries Comuns:**
```sql
-- Últimos acessos do usuário
SELECT 
  action,
  ip_address,
  user_agent,
  created_at
FROM audit.access_logs
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;

-- Eventos de segurança não resolvidos
SELECT 
  event_type,
  severity,
  metadata,
  created_at
FROM audit.security_events
WHERE user_id = auth.uid()
AND is_resolved = false
ORDER BY severity DESC, created_at DESC;

-- Ações administrativas (apenas admins)
SELECT 
  admin_user.email as admin_email,
  aa.action_type,
  aa.description,
  aa.created_at
FROM audit.admin_actions aa
JOIN auth.users admin_user ON admin_user.id = aa.admin_id
ORDER BY aa.created_at DESC
LIMIT 20;
```

---

## 🔗 Relacionamentos Entre Schemas

### Economy ↔ Gamification
```sql
-- Conquista desbloqueada → Recompensa em pontos
INSERT INTO economy.transactions (wallet_id, type, amount, description)
SELECT 
  w.id,
  'bonus'::economy.transaction_type,
  a.reward_points,
  'Conquista: ' || a.name
FROM gamification.achievement_unlocks au
JOIN gamification.achievements a ON a.id = au.achievement_id
JOIN economy.user_wallets w ON w.user_id = au.user_id
WHERE au.id = NEW.id;
```

### Tools ↔ Economy
```sql
-- Uso de ferramenta → Débito de pontos
INSERT INTO economy.transactions (wallet_id, type, amount, description)
SELECT 
  w.id,
  'debit'::economy.transaction_type,
  -t.base_cost,
  'Ferramenta: ' || t.name
FROM tools.executions e
JOIN tools.catalog t ON t.id = e.tool_id
JOIN economy.user_wallets w ON w.user_id = e.user_id
WHERE e.id = NEW.id;
```

### Social ↔ Economy
```sql
-- Indicação completada → Recompensa
INSERT INTO economy.referral_rewards (referrer_id, referred_id, referral_id, reward_points)
VALUES (referrer_id, referred_id, referral_id, 50)
RETURNING id;
```

---

**💡 Próximos Documentos:**
- [STRUCTURE.md](./STRUCTURE.md) - Visão geral
- [SECURITY.md](./SECURITY.md) - Políticas RLS
- [Tabelas individuais](./economy/) - Detalhes de cada tabela
