# 💰 economy.user_wallets

**Schema:** `economy`  
**Descrição:** Carteira dual de pontos dos usuários (bônus + comprados)

## 📋 Estrutura

```sql
CREATE TABLE economy.user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Saldos
  bonus_credits INTEGER NOT NULL DEFAULT 0,      -- Pontos bônus (ganhos)
  purchased_points INTEGER NOT NULL DEFAULT 0,   -- Pontos comprados
  
  -- Metadados
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_user_wallets_user_id ON economy.user_wallets(user_id);
```

## 🎯 Conceito: Economia Dual

### Dois Tipos de Pontos

| Tipo | Coluna | Origem | Prioridade de Uso | Validade |
|------|--------|--------|-------------------|----------|
| **Créditos Bônus** 🎁 | `bonus_credits` | Gratuitos (cadastro, conquistas, indicações) | 1º (FIFO) | Indefinida |
| **Pontos Comprados** 💸 | `purchased_points` | Pagos (pacotes) | 2º (após bônus) | Indefinida |

### Regra de Consumo (FIFO)
```
Usuário usa ferramenta (custo: 30 pontos)
├── Saldo atual: bonus_credits=20, purchased_points=50
├── Deduz bonus_credits primeiro: 20-20=0 (resta 10 pontos)
└── Deduz purchased_points: 50-10=40
    Novo saldo: bonus_credits=0, purchased_points=40
```

## 📊 Dados Atuais

**Registros:** 1 usuário migrado

```sql
SELECT 
  user_id,
  bonus_credits,
  purchased_points,
  (bonus_credits + purchased_points) as total
FROM economy.user_wallets;
```

**Resultado:**
```
user_id                              | bonus_credits | purchased_points | total
-------------------------------------|---------------|------------------|------
<UUID do usuário>                    | 100           | 0                | 100
```

## 🔐 Row Level Security (RLS)

**Status:** ✅ Habilitado

### Políticas Ativas

```sql
-- 1. Usuários veem apenas própria carteira
CREATE POLICY "users_view_own_wallet"
ON economy.user_wallets FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 2. Service_role tem acesso total
CREATE POLICY "service_manage_wallets"
ON economy.user_wallets FOR ALL TO service_role
USING (true) WITH CHECK (true);
```

## 🔄 Operações Comuns

### 1. Consultar Saldo
```sql
-- Frontend (JavaScript)
const { data, error } = await supabase
  .from('economy.user_wallets')
  .select('bonus_credits, purchased_points')
  .eq('user_id', user.id)
  .single();

const total = data.bonus_credits + data.purchased_points;
```

### 2. Adicionar Pontos Bônus
```sql
-- Backend (service_role)
UPDATE economy.user_wallets
SET bonus_credits = bonus_credits + 50
WHERE user_id = $1
RETURNING *;
```

### 3. Adicionar Pontos Comprados
```sql
-- Backend (após compra confirmada)
UPDATE economy.user_wallets
SET purchased_points = purchased_points + 500
WHERE user_id = $1
RETURNING *;
```

### 4. Deduzir Pontos (FIFO)
```sql
-- Backend (ao usar ferramenta)
WITH wallet AS (
  SELECT id, bonus_credits, purchased_points
  FROM economy.user_wallets
  WHERE user_id = $1
  FOR UPDATE
),
deduction AS (
  SELECT
    CASE 
      WHEN bonus_credits >= $2 THEN 0
      ELSE bonus_credits
    END as new_bonus,
    CASE
      WHEN bonus_credits >= $2 THEN purchased_points
      ELSE purchased_points - ($2 - bonus_credits)
    END as new_purchased
  FROM wallet
)
UPDATE economy.user_wallets w
SET 
  bonus_credits = d.new_bonus,
  purchased_points = d.new_purchased,
  updated_at = NOW()
FROM deduction d
WHERE w.user_id = $1
RETURNING w.*;
```

## 📈 Queries Úteis

### Saldo Total por Tipo
```sql
SELECT 
  SUM(bonus_credits) as total_bonus,
  SUM(purchased_points) as total_purchased,
  SUM(bonus_credits + purchased_points) as grand_total
FROM economy.user_wallets;
```

### Usuários com Saldo Baixo
```sql
SELECT 
  u.email,
  w.bonus_credits,
  w.purchased_points,
  (w.bonus_credits + w.purchased_points) as total
FROM economy.user_wallets w
JOIN auth.users u ON u.id = w.user_id
WHERE (w.bonus_credits + w.purchased_points) < 50
ORDER BY total ASC;
```

### Distribuição de Pontos
```sql
SELECT 
  CASE
    WHEN (bonus_credits + purchased_points) = 0 THEN 'Zerado'
    WHEN (bonus_credits + purchased_points) < 100 THEN '1-99'
    WHEN (bonus_credits + purchased_points) < 500 THEN '100-499'
    WHEN (bonus_credits + purchased_points) < 1000 THEN '500-999'
    ELSE '1000+'
  END as range,
  COUNT(*) as users
FROM economy.user_wallets
GROUP BY range
ORDER BY range;
```

## 🔗 Relacionamentos

### Tabelas Relacionadas

```
economy.user_wallets (1)
    ↓ (1:N)
economy.transactions (histórico de movimentações)

economy.user_wallets (1)
    ↓ (1:N)
economy.purchases (compras de pontos)

economy.user_wallets (1)
    ↓ (1:N)
tools.executions (gastos com ferramentas)
```

## 🚨 Validações e Regras

### Constraints
```sql
-- Saldos não podem ser negativos
ALTER TABLE economy.user_wallets
ADD CONSTRAINT check_bonus_credits_positive
CHECK (bonus_credits >= 0);

ALTER TABLE economy.user_wallets
ADD CONSTRAINT check_purchased_points_positive
CHECK (purchased_points >= 0);

-- User_id único (1 carteira por usuário)
ALTER TABLE economy.user_wallets
ADD CONSTRAINT unique_user_wallet
UNIQUE (user_id);
```

### Triggers (Recomendados)
```sql
-- Atualizar updated_at automaticamente
CREATE TRIGGER update_user_wallets_updated_at
BEFORE UPDATE ON economy.user_wallets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Registrar transação ao modificar saldo
CREATE TRIGGER log_wallet_changes
AFTER UPDATE ON economy.user_wallets
FOR EACH ROW
WHEN (OLD.bonus_credits != NEW.bonus_credits 
   OR OLD.purchased_points != NEW.purchased_points)
EXECUTE FUNCTION log_wallet_transaction();
```

## 📝 Migração (OLD → NEW)

**Tabela Antiga:** `public.user_points`

```sql
-- Migração executada em STEP_5
INSERT INTO economy.user_wallets (user_id, bonus_credits, purchased_points, created_at)
SELECT 
  user_id,
  free_points as bonus_credits,    -- free → bonus
  paid_points as purchased_points, -- paid → purchased
  COALESCE(updated_at, NOW()) as created_at
FROM public.user_points;
```

**Mapeamento de Colunas:**
| Antigo | Novo | Observação |
|--------|------|------------|
| `user_id` | `user_id` | Sem alteração |
| `free_points` | `bonus_credits` | Renomeado |
| `paid_points` | `purchased_points` | Renomeado |
| `total_points` | *removido* | Calculado dinamicamente |
| `updated_at` | `created_at` | Reaproveitado |

## 💡 Boas Práticas

### Backend
```javascript
// ✅ BOM: Usar service_role para operações financeiras
const { data, error } = await supabaseAdmin
  .from('economy.user_wallets')
  .update({ bonus_credits: wallet.bonus_credits + 100 })
  .eq('user_id', userId)
  .single();

// ❌ RUIM: Permitir usuário modificar próprio saldo
// RLS bloqueia, mas nunca confie no cliente
```

### Frontend
```javascript
// ✅ BOM: Apenas consultar saldo
const { data } = await supabase
  .from('economy.user_wallets')
  .select('bonus_credits, purchased_points')
  .eq('user_id', user.id)
  .single();

// Calcular total no frontend
const total = data.bonus_credits + data.purchased_points;
```

---

**📖 Documentos Relacionados:**
- [economy/TRANSACTIONS.md](./TRANSACTIONS.md) - Histórico de movimentações
- [economy/PURCHASES.md](./PURCHASES.md) - Compras de pontos
- [ENUMS.md](../ENUMS.md#economy.point_type) - Tipos de pontos
