# 🏷️ ENUMs do Banco de Dados

> **Total de ENUMs:** 7  
> **Versão:** 7.0.0

## 📋 Lista Completa

### 1️⃣ `economy.transaction_type`
**Descrição:** Tipos de transações financeiras

| Valor | Descrição | Quando Usar |
|-------|-----------|-------------|
| `credit` | Crédito de pontos | Bônus de cadastro, indicação, conquistas |
| `debit` | Débito de pontos | Uso de ferramentas, consumo de recursos |
| `refund` | Reembolso | Cancelamento de compra, erro de cobrança |
| `adjustment` | Ajuste manual | Correções administrativas |
| `bonus` | Bônus especial | Promoções, eventos especiais |
| `purchase` | Compra de pontos | Aquisição de pacotes pagos |
| `subscription` | Crédito de assinatura | Mesada semanal do plano Pro |

**Exemplo de Uso:**
```sql
INSERT INTO economy.transactions (wallet_id, type, amount, description)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'credit'::economy.transaction_type,
  100,
  'Bônus de cadastro'
);
```

**Conversão OLD → NEW:**
```
signup_bonus → credit
referral_bonus → credit
tool_usage → debit
admin_adjustment → adjustment
```

---

### 2️⃣ `economy.point_type`
**Descrição:** Classificação dos pontos na carteira

| Valor | Descrição | Características |
|-------|-----------|-----------------|
| `bonus` | Pontos bônus gratuitos | Ganhos em ações (cadastro, conquistas, indicações) |
| `purchased` | Pontos comprados | Adquiridos via pagamento |
| `free` | Pontos gratuitos gerais | Categoria genérica para pontos não-pagos |

**Regras de Uso:**
- Pontos `bonus` são consumidos primeiro (FIFO)
- Pontos `purchased` têm validade indefinida
- Conversão: `free` (antigo) → `bonus` (novo)

**Exemplo:**
```sql
-- Carteira dual
SELECT 
  bonus_credits,    -- pontos tipo 'bonus'
  purchased_points, -- pontos tipo 'purchased'
  (bonus_credits + purchased_points) as total
FROM economy.user_wallets
WHERE user_id = auth.uid();
```

---

### 3️⃣ `economy.subscription_status`
**Descrição:** Status de assinaturas Pro

| Valor | Descrição | Ações Permitidas |
|-------|-----------|------------------|
| `active` | Assinatura ativa | Recebe benefícios (mesada, multiplicador) |
| `canceled` | Cancelada pelo usuário | Válida até final do período pago |
| `expired` | Período expirado | Sem benefícios, necessita renovação |
| `suspended` | Suspensa por pagamento | Bloqueado até regularização |

**Fluxo de Estados:**
```
[Criação] → active
            ↓
active → canceled (usuário cancela) → expired (fim do período)
            ↓
active → suspended (pagamento falhou) → active (pagamento OK)
                                      → expired (não pagou)
```

**Exemplo:**
```sql
-- Verificar se usuário tem assinatura ativa
SELECT EXISTS(
  SELECT 1 FROM economy.subscriptions
  WHERE user_id = auth.uid()
  AND status = 'active'::economy.subscription_status
  AND expires_at > NOW()
) as is_pro;
```

---

### 4️⃣ `economy.purchase_status`
**Descrição:** Status de compras de pontos

| Valor | Descrição | Próxima Ação |
|-------|-----------|--------------|
| `pending` | Aguardando pagamento | Esperar webhook do gateway |
| `completed` | Pagamento confirmado | Creditar pontos na carteira |
| `failed` | Pagamento falhou | Notificar usuário, permitir retry |
| `refunded` | Reembolsado | Debitar pontos (se não usados) |

**Fluxo de Compra:**
```
[Criação] → pending (usuário clica "Comprar")
            ↓
pending → completed (webhook confirma) → [Credita pontos]
        ↓
pending → failed (webhook erro) → [Notifica usuário]

completed → refunded (solicitação de reembolso) → [Debita pontos]
```

**Exemplo:**
```sql
-- Webhook de confirmação
UPDATE economy.purchases
SET 
  status = 'completed'::economy.purchase_status,
  payment_confirmed_at = NOW()
WHERE payment_id = 'pay_abc123'
RETURNING id, user_id, points_amount;
```

---

### 5️⃣ `gamification.achievement_type`
**Descrição:** Categorias de conquistas

| Valor | Descrição | Características | Recompensa Típica |
|-------|-----------|-----------------|-------------------|
| `milestone` | Marco único | Desbloqueio único (ex: "Primeiro Uso") | 5-20 pontos |
| `progressive` | Progresso em níveis | Múltiplos níveis (I, II, III, IV, V) | 10-100 pontos |
| `recurring` | Recorrente | Repete (diário, semanal, mensal) | 5-50 pontos |
| `secret` | Conquista secreta | Oculta até desbloquear | 20-100 pontos |

**Exemplos por Tipo:**

**Milestone:**
- "Bem-vindo!" (+5) - Completar cadastro
- "Primeira Ferramenta" (+10) - Usar qualquer ferramenta
- "Primeira Compra" (+15) - Comprar pacote de pontos

**Progressive:**
- "Mestre das Ferramentas" (I: 10 usos → V: 1000 usos)
- "Colecionador de Pontos" (I: 100 pts → V: 100k pts)
- "Explorador" (I: 5 ferramentas → V: 50 ferramentas)

**Recurring:**
- "Guerreiro Semanal" (+10) - Login 7 dias seguidos
- "Campeão Mensal" (+25) - Login 30 dias seguidos
- "Maratonista Anual" (+100) - Login 365 dias seguidos

**Secret:**
- "O Coruja" (+30) - Usar ferramenta entre 2h-4h da manhã
- "Rei do Feriado" (+50) - Usar em feriado nacional
- "Caçador de Easter Eggs" (+100) - Encontrar easter egg escondido

---

### 6️⃣ `social.visibility_level`
**Descrição:** Níveis de privacidade de dados

| Valor | Descrição | Quem Pode Ver |
|-------|-----------|---------------|
| `public` | Público | Qualquer usuário autenticado |
| `friends` | Apenas amigos | Apenas usuários na lista de amigos |
| `private` | Privado | Apenas o próprio usuário |

**Aplicações:**
```sql
-- Configurações de privacidade
CREATE TABLE social.user_privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Cada campo pode ter visibilidade diferente
  profile_visibility social.visibility_level DEFAULT 'public',
  achievements_visibility social.visibility_level DEFAULT 'public',
  leaderboard_visibility social.visibility_level DEFAULT 'public',
  tools_history_visibility social.visibility_level DEFAULT 'friends'
);
```

**Exemplo de Query Respeitando Privacidade:**
```sql
-- Ver conquistas de outro usuário
SELECT a.*
FROM gamification.user_achievements ua
JOIN gamification.achievements a ON a.id = ua.achievement_id
JOIN social.user_privacy_settings p ON p.user_id = ua.user_id
WHERE ua.user_id = 'target-user-id'
AND (
  -- Público para todos
  p.achievements_visibility = 'public'
  OR
  -- Amigos podem ver
  (p.achievements_visibility = 'friends' AND EXISTS(
    SELECT 1 FROM social.friendships
    WHERE (user_id = auth.uid() AND friend_id = ua.user_id)
       OR (user_id = ua.user_id AND friend_id = auth.uid())
    AND status = 'active'
  ))
  OR
  -- Próprio usuário sempre vê
  ua.user_id = auth.uid()
);
```

---

### 7️⃣ `social.friendship_status`
**Descrição:** Status de amizades

| Valor | Descrição | Ações Permitidas |
|-------|-----------|------------------|
| `active` | Amizade ativa | Ver dados com privacidade 'friends' |
| `blocked` | Bloqueado | Sem interação, invisível nos rankings |

**Fluxo de Amizade:**
```
[Pedido enviado] → friend_requests (pending)
                   ↓
[Aceito] → friendships (status: active)
         ↓
[Bloqueio] → friendships (status: blocked) + DELETE friend_requests
```

**Exemplo:**
```sql
-- Bloquear usuário
UPDATE social.friendships
SET status = 'blocked'::social.friendship_status
WHERE (user_id = auth.uid() AND friend_id = 'user-to-block')
   OR (user_id = 'user-to-block' AND friend_id = auth.uid());

-- Verificar se são amigos
SELECT status = 'active'::social.friendship_status as are_friends
FROM social.friendships
WHERE (user_id = auth.uid() AND friend_id = 'other-user')
   OR (user_id = 'other-user' AND friend_id = auth.uid())
LIMIT 1;
```

---

## 🔄 Conversões da Migração

### `public.point_transaction_type` → `economy.transaction_type`

| Antigo | Novo |
|--------|------|
| `signup_bonus` | `credit` |
| `referral_bonus` | `credit` |
| `purchase` | `purchase` |
| `tool_usage` | `debit` |
| `admin_adjustment` | `adjustment` |
| `refund` | `refund` |

### Tipo de Pontos (Lógica)

| Antigo | Novo | Campo |
|--------|------|-------|
| `free` | `bonus` | `bonus_credits` |
| `paid` | `purchased` | `purchased_points` |

---

## 📝 Comandos Úteis

### Listar todos os ENUMs
```sql
SELECT 
  n.nspname as schema,
  t.typname as enum_name,
  e.enumlabel as value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname IN ('economy', 'gamification', 'social')
ORDER BY schema, enum_name, e.enumsortorder;
```

### Adicionar novo valor a ENUM
```sql
-- Adicionar 'trial' ao subscription_status
ALTER TYPE economy.subscription_status ADD VALUE 'trial';

-- ⚠️ ATENÇÃO: Não é possível remover valores de ENUM!
-- Se precisar remover, deve-se recriar o ENUM
```

### Verificar uso de ENUM
```sql
SELECT 
  schemaname,
  tablename,
  attname as column_name
FROM pg_attribute a
JOIN pg_class c ON c.oid = a.attrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_type t ON t.oid = a.atttypid
WHERE t.typname = 'transaction_type'
AND n.nspname IN ('economy', 'gamification', 'tools', 'social', 'audit');
```

---

**💡 Boas Práticas:**
- Use CAST explícito: `'credit'::economy.transaction_type`
- Valide ENUMs no backend antes de INSERT
- Documente novos valores adicionados
- Nunca delete valores ainda em uso
