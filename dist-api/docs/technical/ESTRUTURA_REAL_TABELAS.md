# 🔍 Estrutura Real das Tabelas do Banco de Dados

## 📊 Tabelas Confirmadas

### 1. `economy_user_wallets` ✅
- ✅ **EXISTE** e está funcionando
- Colunas:
  - `user_id` (UUID, PK)
  - `bonus_credits` (INTEGER)
  - `purchased_credits` (INTEGER) ← **REFATORADO** (antes: purchased_points)
  - `total_spent` (INTEGER)
  - `total_earned_bonus` (INTEGER)
  - `pro_weekly_allowance` (INTEGER)
  - `last_allowance_date` (TIMESTAMP)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

---

### 2. `economy_transactions` ✅
- ✅ **EXISTE** (estrutura diferente do esperado)
- Colunas **CORRETAS**:
  - `id` (UUID, PK)
  - `user_id` (UUID)
  - `type` ← **NÃO** `transaction_type`
  - `amount` (INTEGER)
  - `description` (TEXT)
  - `related_entity_type` (TEXT)
  - `related_entity_id` (UUID)
  - `created_at` (TIMESTAMP)

- ❌ **NÃO TEM**:
  - `balance_before` (não existe)
  - `balance_after` (não existe)
  - `metadata` (não existe)

---

### 3. `tool_usage_tracking` ❓
- **STATUS**: Não confirmado se existe
- Esperado pelo código (se foi criado nos scripts iniciais):
  - `id` (UUID, PK)
  - `user_id` (UUID)
  - `tool_id` (UUID)
  - `month_year` (TEXT - formato "YYYY-MM")
  - `usage_count` (INTEGER)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

- **ALTERNATIVA** (se não existir):
  - Usar `tools_executions` para tracking de uso

---

### 4. `tools_executions` ✅
- ✅ **EXISTE** (confirmado pelo código)
- Colunas:
  - `id` (UUID, PK)
  - `user_id` (UUID)
  - `tool_id` (UUID)
  - `cost_in_points` (INTEGER)
  - `points_used` (INTEGER)
  - `success` (BOOLEAN)
  - `execution_time_ms` (INTEGER)
  - `input_data` (JSONB)
  - `output_data` (JSONB)
  - `error_message` (TEXT)
  - `created_at` (TIMESTAMP)

---

## 🔧 Correções Aplicadas

### Script: `TESTE_DEBITO_CREDITS.sql`

#### Query 2 - Transações:
**ANTES (ERRADO):**
```sql
SELECT transaction_type, balance_before, balance_after, metadata->>'tool_name'
FROM economy_transactions
```

**DEPOIS (CORRETO):**
```sql
SELECT type, description, related_entity_type
FROM economy_transactions
```

#### Query 3 - Tracking:
**ANTES (tabela incerta):**
```sql
SELECT tool_slug, usage_count
FROM tool_usage_tracking
```

**DEPOIS (tabela confirmada):**
```sql
SELECT tool_id, cost_in_points, success
FROM tools_executions
```

#### Query 4 - Resumo:
**ANTES (ERRADO):**
```sql
WHERE transaction_type = 'debit'
```

**DEPOIS (CORRETO):**
```sql
WHERE type = 'debit'
```

---

## 📝 Próximo Passo

Execute o script **`DESCOBRIR_ESTRUTURA_BANCO.sql`** para confirmar:
1. Se `tool_usage_tracking` existe
2. Se `economy_transactions` tem exatamente essas colunas
3. Listar todas as tabelas de economia/tracking

Depois disso, execute o **`TESTE_DEBITO_CREDITS.sql`** corrigido.
