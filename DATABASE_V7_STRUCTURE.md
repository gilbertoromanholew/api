# 📊 MAPEAMENTO COMPLETO DO BANCO DE DADOS V7

## 🎯 Estrutura Geral

O banco de dados está organizado em **4 schemas principais**:

### 1. `public` - Core do Sistema
Tabelas principais de autenticação, perfis e configurações.

**Tabelas:**
- `profiles` - Perfis de usuários
- `promo_codes` - Códigos promocionais
- `promo_code_redemptions` - Histórico de resgates
- `otp_codes` - Códigos OTP para verificação
- `auth_audit_log` - Log de autenticações
- `operations_audit_log` - Log de operações
- `rate_limit_violations` - Violações de rate limit
- `failed_login_attempts_24h` - Tentativas de login falhadas
- `suspicious_activities` - Atividades suspeitas
- `top_rate_limit_violators` - Maiores violadores de rate limit

---

### 2. `tools` - Sistema de Ferramentas
Gerencia o catálogo e execuções de ferramentas.

**Tabelas:**
- ✅ `catalog` - Catálogo de ferramentas disponíveis
  - `id` (uuid, PK)
  - `name` - Nome da ferramenta
  - `description` - Descrição
  - `cost` - Custo em créditos
  - `category` - Categoria
  - `status` - Status (active/inactive)
  - `metadata` - Dados adicionais (JSON)
  - `created_at`, `updated_at`

- ✅ `executions` - Histórico de execuções
  - `id` (uuid, PK)
  - `user_id` (uuid, FK → profiles)
  - `tool_id` (uuid, FK → tools.catalog)
  - `cost` - Custo cobrado
  - `status` - Status da execução
  - `input_data` - Dados de entrada (JSON)
  - `output_data` - Dados de saída (JSON)
  - `error_message` - Mensagem de erro (se houver)
  - `executed_at`, `completed_at`

---

### 3. `economy` - Sistema Econômico
Gerencia créditos, transações, compras e assinaturas.

**Tabelas:**
- ✅ `user_wallets` - Carteiras de usuários
  - `id` (uuid, PK)
  - `user_id` (uuid, FK → profiles, UNIQUE)
  - `bonus_credits` - Créditos bônus (grátis)
  - `purchased_credits` - Créditos comprados
  - `total_credits` - Total de créditos
  - `created_at`, `updated_at`

- ✅ `transactions` - Histórico de transações
  - `id` (uuid, PK)
  - `user_id` (uuid, FK → profiles)
  - `type` - Tipo (purchase, bonus, usage, refund, etc)
  - `amount` - Valor (positivo = crédito, negativo = débito)
  - `balance_before` - Saldo antes
  - `balance_after` - Saldo depois
  - `description` - Descrição
  - `metadata` - Dados adicionais (JSON)
  - `created_at`

- ✅ `purchases` - Histórico de compras
  - `id` (uuid, PK)
  - `user_id` (uuid, FK → profiles)
  - `package_id` - ID do pacote comprado
  - `amount` - Valor pago
  - `credits` - Créditos recebidos
  - `payment_method` - Método de pagamento
  - `status` - Status (pending, completed, failed, refunded)
  - `payment_data` - Dados do pagamento (JSON)
  - `created_at`, `updated_at`

- ✅ `subscriptions` - Assinaturas ativas
  - `id` (uuid, PK)
  - `user_id` (uuid, FK → profiles)
  - `plan_id` (uuid, FK → subscription_plans)
  - `status` - Status (active, cancelled, expired)
  - `current_period_start` - Início do período atual
  - `current_period_end` - Fim do período atual
  - `cancel_at_period_end` - Cancelar no fim do período?
  - `created_at`, `updated_at`

- ✅ `subscription_plans` - Planos de assinatura
  - `id` (uuid, PK)
  - `name` - Nome do plano
  - `description` - Descrição
  - `price` - Preço mensal
  - `credits_per_month` - Créditos mensais
  - `features` - Features incluídas (JSON)
  - `status` - Status (active/inactive)
  - `created_at`, `updated_at`

- ✅ `referral_rewards` - Recompensas de indicação
  - `id` (uuid, PK)
  - `referrer_id` (uuid, FK → profiles) - Quem indicou
  - `referred_id` (uuid, FK → profiles) - Quem foi indicado
  - `reward_type` - Tipo de recompensa
  - `reward_amount` - Valor da recompensa
  - `status` - Status (pending, paid)
  - `paid_at` - Quando foi paga
  - `created_at`

---

### 4. `social` - Sistema Social
Gerencia relacionamentos entre usuários.

**Tabelas:**
- ✅ `friend_requests` - Solicitações de amizade
  - `id` (uuid, PK)
  - `sender_id` (uuid, FK → profiles)
  - `receiver_id` (uuid, FK → profiles)
  - `status` - Status (pending, accepted, rejected)
  - `created_at`, `updated_at`

- ✅ `friendships` - Amizades estabelecidas
  - `id` (uuid, PK)
  - `user1_id` (uuid, FK → profiles)
  - `user2_id` (uuid, FK → profiles)
  - `created_at`

- ✅ `referrals` - Sistema de indicações
  - `id` (uuid, PK)
  - `referrer_id` (uuid, FK → profiles) - Quem indicou
  - `referred_id` (uuid, FK → profiles) - Quem foi indicado
  - `status` - Status da indicação
  - `created_at`

- ✅ `user_privacy_settings` - Configurações de privacidade
  - `id` (uuid, PK)
  - `user_id` (uuid, FK → profiles, UNIQUE)
  - `profile_visibility` - Visibilidade do perfil
  - `show_online_status` - Mostrar status online?
  - `allow_friend_requests` - Aceitar solicitações?
  - `settings` - Outras configurações (JSON)
  - `created_at`, `updated_at`

---

## 🔗 Relacionamentos Principais

```
profiles (public)
    ├── economy.user_wallets (1:1)
    ├── economy.transactions (1:N)
    ├── economy.purchases (1:N)
    ├── economy.subscriptions (1:N)
    ├── tools.executions (1:N)
    ├── social.friend_requests (1:N como sender/receiver)
    ├── social.friendships (1:N como user1/user2)
    ├── social.referrals (1:N como referrer/referred)
    └── social.user_privacy_settings (1:1)

tools.catalog
    └── tools.executions (1:N)

economy.subscription_plans
    └── economy.subscriptions (1:N)
```

---

## ⚠️ TABELAS V6 OBSOLETAS (DELETADAS)

As seguintes tabelas foram **deletadas** pois faziam parte da V6:
- ❌ `public.tool_costs` → Migrado para `tools.catalog`
- ❌ `public.tool_usage_stats` → Migrado para `tools.executions`
- ❌ `public.user_points` → Migrado para `economy.user_wallets`
- ❌ `public.point_transactions` → Migrado para `economy.transactions`

Também foram deletadas duplicatas:
- ❌ `public.purchases` → Migrado para `economy.purchases`
- ❌ `public.referral_history` → Migrado para `social.referrals`
- ❌ `public.referral_stats` → Dados migrados para `economy.referral_rewards`

---

## 📝 Convenções de Nomenclatura

### Campos Comuns
- `id` - UUID (PK)
- `created_at` - Timestamp de criação
- `updated_at` - Timestamp de atualização
- `user_id` - Referência ao usuário (FK → profiles)

### Tipos de Status
- `active` / `inactive` - Para recursos ativados/desativados
- `pending` / `completed` / `failed` - Para processos
- `accepted` / `rejected` - Para solicitações

### Campos JSON
- `metadata` - Dados adicionos flexíveis
- `features` - Lista de features
- `settings` - Configurações
- `*_data` - Dados estruturados (input_data, output_data, payment_data)

---

## 🚀 Próximos Passos

1. ✅ Schemas V7 estão criados e funcionais
2. ⚠️ **Verificar se usuário tem wallet criada**
3. ⚠️ **Popular tools.catalog com ferramentas**
4. ⚠️ **Testar endpoints migrados**
5. ⚠️ **Criar dados de exemplo para subscription_plans**

---

## 📊 SQL para Verificação

Execute `complete-database-map.sql` para obter:
- ✅ Estrutura completa de todas as tabelas
- ✅ Contagem de registros
- ✅ Verificação de dados do usuário
- ✅ Estatísticas gerais do banco
