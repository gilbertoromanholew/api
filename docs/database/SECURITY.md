# 🔐 Segurança do Banco de Dados (RLS)

> **Row Level Security:** ✅ Habilitado em todas as 23 tabelas  
> **Total de Políticas:** 40  
> **Versão:** 7.0.0

## 📊 Resumo de Políticas

| Schema | Tabela | Policies | Descrição |
|--------|--------|----------|-----------|
| **economy** | user_wallets | 2 | Usuário vê própria carteira |
| | transactions | 2 | Usuário vê próprias transações |
| | subscription_plans | 2 | Todos veem planos ativos |
| | subscriptions | 2 | Usuário vê própria assinatura |
| | point_packages | 2 | Todos veem pacotes ativos |
| | purchases | 2 | Usuário vê próprias compras |
| | referral_rewards | 2 | Usuário vê próprias recompensas |
| **gamification** | achievements | 2 | Todos veem conquistas ativas |
| | user_achievements | 2 | Usuário vê próprio progresso |
| | achievement_unlocks | 2 | Usuário vê próprios desbloqueios |
| | achievement_showcase | 1 | Usuário gerencia própria vitrine |
| | leaderboards | 2 | Usuário vê própria posição |
| | daily_streaks | 2 | Usuário vê própria sequência |
| **tools** | catalog | 2 | Todos veem ferramentas ativas |
| | executions | 2 | Usuário vê próprias execuções |
| | user_favorites | 1 | Usuário gerencia próprios favoritos |
| **social** | user_privacy_settings | 1 | Usuário gerencia próprias configs |
| | friendships | 2 | Usuário vê próprias amizades |
| | friend_requests | 2 | Usuário vê próprios pedidos |
| | referrals | 2 | Usuário vê próprias indicações |
| **audit** | access_logs | 2 | Usuário vê próprios logs |
| | security_events | 2 | Usuário vê próprios eventos |
| | admin_actions | 1 | Service_role apenas |

## 🎯 Princípios de Segurança

### 1. **Isolamento de Dados**
Usuários veem **APENAS** seus próprios dados sensíveis:
```sql
-- ✅ Permitido: Ver própria carteira
SELECT * FROM economy.user_wallets 
WHERE user_id = auth.uid(); -- Retorna dados

-- ❌ Bloqueado: Ver carteira de outros
SELECT * FROM economy.user_wallets 
WHERE user_id = 'outro-usuario-id'; -- Retorna vazio
```

### 2. **Catálogos Públicos**
Catálogos são visíveis para todos usuários autenticados:
```sql
-- ✅ Todos veem ferramentas ativas
SELECT * FROM tools.catalog 
WHERE is_active = true;

-- ✅ Todos veem conquistas ativas
SELECT * FROM gamification.achievements 
WHERE is_active = true;

-- ✅ Todos veem pacotes de pontos
SELECT * FROM economy.point_packages 
WHERE is_active = true;
```

### 3. **Backend Total Access**
Service_role (backend) tem acesso total:
```javascript
// Backend usando service_role key
const { data } = await supabaseAdmin
  .from('economy.user_wallets')
  .update({ bonus_credits: 100 })
  .eq('user_id', 'any-user-id'); // ✅ Funciona
```

### 4. **Zero Trust para Anônimos**
Usuários não autenticados não acessam nada:
```sql
-- ❌ Sem autenticação = sem acesso
SELECT * FROM economy.user_wallets; -- Retorna vazio
```

## 🛡️ Políticas por Tipo

### Tipo 1: "Ver Apenas Próprios Dados"
**Aplicado em:** Dados sensíveis (carteiras, transações, compras)

```sql
CREATE POLICY "users_view_own_wallet"
ON economy.user_wallets FOR SELECT TO authenticated
USING (auth.uid() = user_id);
```

**Tabelas com esta política:**
- `economy.user_wallets`
- `economy.transactions`
- `economy.subscriptions`
- `economy.purchases`
- `economy.referral_rewards`
- `gamification.user_achievements`
- `gamification.achievement_unlocks`
- `gamification.leaderboards`
- `gamification.daily_streaks`
- `tools.executions`
- `audit.access_logs`
- `audit.security_events`

### Tipo 2: "Catálogo Público"
**Aplicado em:** Catálogos e listagens públicas

```sql
CREATE POLICY "anyone_view_active_tools"
ON tools.catalog FOR SELECT TO authenticated
USING (is_active = true);
```

**Tabelas com esta política:**
- `economy.subscription_plans`
- `economy.point_packages`
- `tools.catalog`
- `gamification.achievements`

### Tipo 3: "Gerenciar Próprios Dados"
**Aplicado em:** Configurações e favoritos

```sql
CREATE POLICY "users_manage_own_favorites"
ON tools.user_favorites FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

**Tabelas com esta política:**
- `tools.user_favorites`
- `social.user_privacy_settings`
- `gamification.achievement_showcase`

### Tipo 4: "Relações Bilaterais"
**Aplicado em:** Amizades e pedidos

```sql
CREATE POLICY "users_view_own_friendships"
ON social.friendships FOR SELECT TO authenticated
USING (auth.uid() = user_id OR auth.uid() = friend_id);
```

**Tabelas com esta política:**
- `social.friendships` (ambos os lados veem)
- `social.friend_requests` (remetente e destinatário)
- `social.referrals` (referenciador e referenciado)

### Tipo 5: "Service Role Total"
**Aplicado em:** TODAS as 23 tabelas

```sql
CREATE POLICY "service_manage_wallets"
ON economy.user_wallets FOR ALL TO service_role
USING (true) WITH CHECK (true);
```

## 🔒 Cenários de Ataque Bloqueados

### ❌ Ataque 1: Modificar Saldo de Outros
```javascript
// Frontend malicioso tentando dar pontos para si mesmo
const { data, error } = await supabase
  .from('economy.user_wallets')
  .update({ bonus_credits: 999999 })
  .eq('user_id', 'vitima-id');

// ❌ BLOQUEADO: RLS impede UPDATE em carteiras de outros
// error.message: "new row violates row-level security policy"
```

### ❌ Ataque 2: Ver Transações de Outros
```javascript
// Tentando espionar transações de outro usuário
const { data } = await supabase
  .from('economy.transactions')
  .select('*')
  .eq('user_id', 'vitima-id');

// ❌ BLOQUEADO: Retorna array vazio []
// RLS filtra resultados automaticamente
```

### ❌ Ataque 3: Criar Conquista Falsa
```javascript
// Tentando desbloquear conquista sem completar
const { data, error } = await supabase
  .from('gamification.achievement_unlocks')
  .insert({
    user_id: auth.user.id,
    achievement_id: 'conquista-dificil-id'
  });

// ❌ BLOQUEADO: Apenas service_role pode INSERT
// error.message: "new row violates row-level security policy"
```

### ❌ Ataque 4: Deletar Compras
```javascript
// Tentando apagar registro de compra
const { error } = await supabase
  .from('economy.purchases')
  .delete()
  .eq('id', 'minha-compra-id');

// ❌ BLOQUEADO: Policies não permitem DELETE
// error.message: "permission denied for table purchases"
```

## ✅ Operações Permitidas

### ✅ Frontend: Ler Próprios Dados
```javascript
// Ver própria carteira
const { data } = await supabase
  .from('economy.user_wallets')
  .select('bonus_credits, purchased_points')
  .eq('user_id', user.id)
  .single(); // ✅ PERMITIDO
```

### ✅ Frontend: Ler Catálogos Públicos
```javascript
// Listar ferramentas ativas
const { data } = await supabase
  .from('tools.catalog')
  .select('*')
  .eq('is_active', true); // ✅ PERMITIDO
```

### ✅ Frontend: Gerenciar Favoritos
```javascript
// Adicionar favorito
const { data } = await supabase
  .from('tools.user_favorites')
  .insert({
    user_id: user.id,
    tool_id: 'ferramenta-id'
  }); // ✅ PERMITIDO (próprio user_id)

// Remover favorito
const { data } = await supabase
  .from('tools.user_favorites')
  .delete()
  .eq('user_id', user.id)
  .eq('tool_id', 'ferramenta-id'); // ✅ PERMITIDO
```

### ✅ Backend: Modificar Qualquer Dado
```javascript
// Backend com service_role key
const { data } = await supabaseAdmin
  .from('economy.user_wallets')
  .update({ bonus_credits: 100 })
  .eq('user_id', 'any-user-id'); // ✅ PERMITIDO
```

## 🚨 Limitações do RLS

### O Que RLS **NÃO** Protege:

#### 1. SQL Injection
```javascript
// ❌ VULNERÁVEL se não usar parâmetros
const userId = req.query.userId; // "123; DROP TABLE users--"
await supabase.rpc('custom_function', { user_id: userId });

// ✅ SEGURO: Usar parameterized queries
await supabase
  .from('users')
  .select()
  .eq('id', userId); // Supabase escapa automaticamente
```

#### 2. Vazamento de API Keys
```javascript
// ❌ VULNERÁVEL: anon key no código exposto
const supabase = createClient(url, 'ANON_KEY_PUBLICA');

// ⚠️ CUIDADO: service_role key nunca deve ir pro frontend!
// NUNCA: const supabase = createClient(url, 'SERVICE_ROLE_KEY');
```

#### 3. Lógica de Negócio
```javascript
// ❌ VULNERÁVEL: Validação apenas no frontend
if (user.credits >= toolCost) {
  await useTool(); // Usuário pode burlar com DevTools
}

// ✅ SEGURO: Validação no backend
// Backend valida saldo antes de deduzir
```

#### 4. Rate Limiting
```javascript
// ❌ SEM PROTEÇÃO: Spam de requisições
for (let i = 0; i < 10000; i++) {
  await supabase.from('tools.catalog').select();
}

// ✅ PRECISA: Rate limiting no backend/Cloudflare
```

## 🔧 Comandos de Manutenção

### Verificar Políticas Ativas
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname IN ('economy', 'gamification', 'tools', 'social', 'audit')
ORDER BY schemaname, tablename;
```

### Contar Políticas por Tabela
```sql
SELECT 
  schemaname as schema,
  tablename as tabela,
  COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname IN ('economy', 'gamification', 'tools', 'social', 'audit')
GROUP BY schemaname, tablename
ORDER BY schemaname, tablename;
```

### Testar Política como Usuário
```sql
-- Simular como usuário específico
SET ROLE authenticated;
SET request.jwt.claims.sub = 'user-uuid-here';

-- Testar query
SELECT * FROM economy.user_wallets; -- Deve retornar apenas 1 linha

-- Voltar para superusuário
RESET ROLE;
```

### Desabilitar RLS (NÃO RECOMENDADO)
```sql
-- ⚠️ APENAS PARA DEBUG LOCAL
ALTER TABLE economy.user_wallets DISABLE ROW LEVEL SECURITY;

-- Reabilitar
ALTER TABLE economy.user_wallets ENABLE ROW LEVEL SECURITY;
```

## 📖 Referências

- **Políticas Criadas:** [STEP_6_create_rls_policies.sql](../../sql-config/migrations/STEP_6_create_rls_policies.sql)
- **Documentação Supabase RLS:** https://supabase.com/docs/guides/auth/row-level-security
- **Postgres RLS Docs:** https://www.postgresql.org/docs/current/ddl-rowsecurity.html

---

**💡 Resumo:**
- ✅ 40 políticas protegendo 23 tabelas
- ✅ Usuários isolados (zero access aos dados de outros)
- ✅ Catálogos públicos para todos
- ✅ Backend tem controle total
- ⚠️ RLS não substitui validações de lógica de negócio
