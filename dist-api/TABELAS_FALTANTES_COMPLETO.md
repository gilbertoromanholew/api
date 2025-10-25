# 📋 ANÁLISE COMPLETA: TABELAS FALTANTES NO BANCO DE DADOS

**Data da Análise:** 25/10/2025  
**Método:** Leitura profunda de TODOS os arquivos de código (backend + frontend)

---

## ✅ TABELAS JÁ MIGRADAS E ACESSÍVEIS (13 tabelas)

Todas no schema `public` com prefixos:

1. **tools_catalog** - 15 ferramentas
2. **tools_executions** - Histórico de uso
3. **economy_user_wallets** - Carteiras (bonus + purchased credits)
4. **economy_transactions** - Histórico de transações
5. **economy_purchases** - Compras (Stripe)
6. **economy_subscriptions** - Assinaturas PRO (VAZIO - não usado, tabela subscriptions existe separada)
7. **social_referrals** - Sistema de indicação
8. **gamification_achievements** - 15 conquistas ativas
9. **gamification_achievement_unlocks** - Desbloqueios histórico
10. **gamification_achievement_showcase** - Vitrine de conquistas
11. **gamification_daily_streaks** - Sequências diárias
12. **gamification_leaderboards** - Ranking global
13. **gamification_user_achievements** - Progresso do usuário

---

## 🚨 TABELAS CRÍTICAS QUE FALTAM (Precisam ser criadas/configuradas)

### 1. **`subscription_plans`** ⚠️ EXISTE MAS SEM PERMISSÕES
**Status:** Tabela existe (erro de índice duplicado comprova), mas não está exposta via PostgREST  
**Localização:** `public.subscription_plans`  
**Usado em:**
- `subscriptionService.js` (linhas 17, 95) - `.from('subscription_plans')`
- Backend: `GET /api/subscription/plans`

**Estrutura esperada:**
```sql
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  price_brl DECIMAL(10,2) NOT NULL,
  billing_period VARCHAR(20) NOT NULL, -- 'monthly', 'yearly'
  features JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  stripe_price_id VARCHAR(255),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Ação necessária:**
✅ Configurar permissões: `GRANT ALL ON TABLE public.subscription_plans TO service_role;`  
✅ Seed do plano Pro (R$ 89.10/mês)  
✅ `NOTIFY pgrst, 'reload schema';`

---

### 2. **`subscriptions`** ⚠️ EXISTE MAS SEM PERMISSÕES
**Status:** Tabela existe (erro de índice duplicado comprova)  
**Localização:** `public.subscriptions`  
**Usado em:**
- `subscriptionService.js` (linhas 38, 57, 117, 149, 179, 215, 237)
- `promoCodesService.js` (linhas 137, 150, 156)
- Backend: `GET /api/subscription/status`, `POST /api/subscription/create`, `POST /api/subscription/cancel`

**Estrutura esperada:**
```sql
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(20) NOT NULL, -- 'active', 'canceled', 'expired'
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  is_trial BOOLEAN DEFAULT false,
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  canceled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

**Ação necessária:**
✅ Configurar permissões: `GRANT ALL ON TABLE public.subscriptions TO service_role;`  
✅ RLS policies (user vê próprias subscriptions)  
✅ `NOTIFY pgrst, 'reload schema';`

---

### 3. **`promo_codes`** ❌ PRECISA SER CRIADA
**Status:** Não encontrada no banco  
**Usado em:**
- `promoCodesService.js` (linha 16) - `.from('promo_codes')`
- Backend: `POST /api/promo-codes/validate`, `POST /api/promo-codes/redeem`

**Estrutura (da migração MIGRATION_V7_FEATURES.sql):**
```sql
CREATE TYPE promo_code_type AS ENUM ('BONUS_CREDITS', 'PRO_TRIAL', 'DISCOUNT', 'REFERRAL');
CREATE TYPE promo_code_status AS ENUM ('active', 'expired', 'disabled');

CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  type promo_code_type NOT NULL,
  value INTEGER NOT NULL,
  description TEXT,
  expires_at TIMESTAMP,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  status promo_code_status DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_status ON promo_codes(status);
```

**Seeds iniciais:**
```sql
INSERT INTO promo_codes (code, type, value, description) VALUES
  ('BEM-VINDO', 'BONUS_CREDITS', 50, 'Bônus de boas-vindas'),
  ('PROMO2025', 'BONUS_CREDITS', 100, 'Promoção 2025'),
  ('PRO30DIAS', 'PRO_TRIAL', 30, 'Teste PRO 30 dias');
```

---

### 4. **`promo_code_redemptions`** ❌ PRECISA SER CRIADA
**Status:** Não encontrada no banco  
**Usado em:**
- `promoCodesService.js` (linha 71) - `.from('promo_code_redemptions')`

**Estrutura:**
```sql
CREATE TABLE promo_code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMP DEFAULT NOW(),
  credits_awarded INTEGER DEFAULT 0,
  pro_days_awarded INTEGER DEFAULT 0,
  metadata JSONB
);

CREATE INDEX idx_promo_code_redemptions_user ON promo_code_redemptions(user_id);
CREATE INDEX idx_promo_code_redemptions_code ON promo_code_redemptions(promo_code_id);
```

**Trigger:**
```sql
CREATE FUNCTION increment_promo_code_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE promo_codes 
  SET used_count = used_count + 1, updated_at = NOW()
  WHERE id = NEW.promo_code_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_promo_code_usage
  AFTER INSERT ON promo_code_redemptions
  FOR EACH ROW EXECUTE FUNCTION increment_promo_code_usage();
```

---

### 5. **`auth_audit_log`** ❌ PRECISA SER CRIADA
**Status:** Não encontrada no banco  
**Usado em:**
- `auditService.js` (linha 35) - `.from('auth_audit_log')`
- Backend: Logs de login, logout, registro

**Estrutura (da migração 003_audit_tables.sql):**
```sql
CREATE TABLE auth_audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  country VARCHAR(100),
  city VARCHAR(100),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_auth_audit_user_id ON auth_audit_log(user_id);
CREATE INDEX idx_auth_audit_created_at ON auth_audit_log(created_at DESC);
CREATE INDEX idx_auth_audit_action ON auth_audit_log(action);
CREATE INDEX idx_auth_audit_ip ON auth_audit_log(ip_address);
```

---

### 6. **`operations_audit_log`** ❌ PRECISA SER CRIADA
**Status:** Não encontrada no banco  
**Usado em:**
- `auditService.js` (linha 155) - `.from('operations_audit_log')`
- Backend: Logs de execução de ferramentas, consumo de pontos

**Estrutura:**
```sql
CREATE TABLE operations_audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  operation VARCHAR(100) NOT NULL,
  resource VARCHAR(255),
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  execution_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ops_audit_user_id ON operations_audit_log(user_id);
CREATE INDEX idx_ops_audit_created_at ON operations_audit_log(created_at DESC);
CREATE INDEX idx_ops_audit_operation ON operations_audit_log(operation);
```

---

### 7. **`rate_limit_violations`** ❌ PRECISA SER CRIADA
**Status:** Não encontrada no banco  
**Usado em:**
- `auditService.js` (linha 234) - `.from('rate_limit_violations')`
- Backend: Logs de violações de rate limiting

**Estrutura:**
```sql
CREATE TABLE rate_limit_violations (
  id BIGSERIAL PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  endpoint VARCHAR(255) NOT NULL,
  limiter_type VARCHAR(50) NOT NULL,
  attempts INTEGER,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rate_limit_ip ON rate_limit_violations(ip_address);
CREATE INDEX idx_rate_limit_created_at ON rate_limit_violations(created_at DESC);
```

---

### 8. **`otp_codes`** ⚠️ PODE EXISTIR MAS NÃO VERIFICADA
**Status:** Referenciada no código de autenticação  
**Usado em:**
- `authRoutes.js` - Sistema de OTP para verificação de email

**Estrutura esperada:**
```sql
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'email_verification', 'password_reset'
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_otp_codes_user_id ON otp_codes(user_id);
CREATE INDEX idx_otp_codes_code ON otp_codes(code);
```

---

## 📊 RESUMO EXECUTIVO

### Tabelas que EXISTEM mas precisam de permissões:
1. ✅ `subscription_plans` - Configurar permissões + seed do plano Pro
2. ✅ `subscriptions` - Configurar permissões + RLS

### Tabelas que NÃO EXISTEM e precisam ser criadas:
3. ❌ `promo_codes` - Sistema de códigos promocionais
4. ❌ `promo_code_redemptions` - Histórico de resgates
5. ❌ `auth_audit_log` - Auditoria de autenticação
6. ❌ `operations_audit_log` - Auditoria de operações
7. ❌ `rate_limit_violations` - Auditoria de rate limiting
8. ❌ `otp_codes` - Códigos OTP para verificação

---

## 🎯 PLANO DE AÇÃO IMEDIATO

### PRIORIDADE 1 (CRÍTICA - Sistema não funciona sem):
1. **Configurar subscription_plans e subscriptions**
   - Executar `create-missing-tables.sql` (permissões + seed Pro)
   - Verificar exposição via PostgREST
   - Testar endpoints `/api/subscription/*`

### PRIORIDADE 2 (ALTA - Funcionalidades importantes):
2. **Criar tabelas de promo codes**
   - Executar DDL de `promo_codes` + `promo_code_redemptions`
   - Inserir seeds (BEM-VINDO, PROMO2025, PRO30DIAS)
   - Testar endpoint `/api/promo-codes/redeem`

### PRIORIDADE 3 (MÉDIA - Auditoria e segurança):
3. **Criar tabelas de auditoria**
   - Executar `003_audit_tables.sql`
   - Configurar RLS policies
   - Testar logging automático

### PRIORIDADE 4 (BAIXA - Sistema funciona sem):
4. **Verificar/Criar otp_codes**
   - Verificar se existe no banco
   - Se não, criar estrutura
   - Testar fluxo de OTP

---

## 📝 SCRIPTS SQL A EXECUTAR

### 1. Configurar Subscriptions (IMEDIATO):
```sql
-- Já criado em: create-missing-tables.sql
-- Apenas executar no Supabase SQL Editor
```

### 2. Criar Promo Codes:
```sql
-- Executar: MIGRATION_V7_FEATURES.sql (seções 2)
-- OU criar SQL específico abaixo
```

### 3. Criar Auditoria:
```sql
-- Executar: 003_audit_tables.sql completo
```

---

## ⚠️ OBSERVAÇÕES IMPORTANTES

1. **economy_subscriptions vs subscriptions:**
   - `economy_subscriptions` está VAZIA e não é usada
   - Sistema usa `subscriptions` (sem prefixo economy)
   - Considerar remover economy_subscriptions para evitar confusão

2. **Tabelas economy_referral_rewards:**
   - Existe no banco mas NÃO é usada no código
   - Sistema usa `social_referrals` diretamente
   - Considerar remover ou documentar como deprecated

3. **PostgREST Schema Cache:**
   - Após criar qualquer tabela, executar: `NOTIFY pgrst, 'reload schema';`
   - Aguardar 5-10 segundos para propagação

4. **RLS Policies:**
   - TODAS as novas tabelas DEVEM ter RLS habilitado
   - service_role DEVE ter ALL permissions
   - authenticated DEVE ter SELECT (mínimo) nas próprias linhas

---

## ✅ PRÓXIMOS PASSOS APÓS CRIAÇÃO

1. **Executar SQL de criação das tabelas**
2. **Verificar exposição via PostgREST:** `SELECT * FROM pg_tables WHERE schemaname = 'public';`
3. **Testar endpoints da API:** Usar Postman/Insomnia
4. **Executar audit completo:** `node audit-complete.js`
5. **Iniciar backend:** `node server.js` e verificar logs
6. **Testar frontend:** Login, dashboard, subscrição, promo codes

---

**FIM DO RELATÓRIO**
