# 🔒 Auditoria de Segurança - Sistema de Precificação

**Data:** 26/10/2025  
**Auditor:** GitHub Copilot  
**Escopo:** Sistema de Precificação Diferenciada + Endpoints Públicos

---

## ⚠️ VULNERABILIDADES CRÍTICAS ENCONTRADAS

### 🚨 **CRÍTICO 1: Endpoint `/tools/list` sem autenticação**

**Arquivo:** `src/routes/toolsRoutes.js` (linha 17)

**Problema:**
```javascript
router.get('/list', async (req, res) => {  // ❌ SEM requireAuth
  // Qualquer pessoa pode acessar
```

**Risco:**
- ✅ **BAIXO/MÉDIO** - Os dados retornados são catálogo público de ferramentas (nome, descrição, categoria)
- ❌ Mas poderia expor metadados sensíveis se não for controlado

**Seu Questionamento:**
> "não tem necessidade de funcionar sem estar logado, ao meu ver"

**Análise:**
- **CONTRA deixar público:** 
  - Scrapers podem coletar catálogo
  - Pode revelar roadmap de ferramentas
  - Concorrentes podem ver suas features
  
- **A FAVOR deixar público:**
  - Marketing: Mostrar ferramentas em landing page
  - SEO: Google indexa ferramentas
  - UX: Usuário vê ferramentas antes de se cadastrar

**RECOMENDAÇÃO:** 
✅ **ADICIONAR `requireAuth`** - É mais seguro e você já tem usuário logado no frontend

---

### 🚨 **CRÍTICO 2: Endpoint `/tools/most-used` sem autenticação**

**Arquivo:** `src/routes/toolsRoutes.js` (linha 81)

**Problema:**
```javascript
router.get('/most-used', async (req, res) => {  // ❌ SEM requireAuth
```

**Risco:**
- **MÉDIO** - Revela quais ferramentas são mais populares
- Concorrentes podem saber onde focar

**RECOMENDAÇÃO:** 
✅ **ADICIONAR `requireAuth`**

---

### 🚨 **CRÍTICO 3: RLS Policy INSEGURA em `tools_usage_monthly`**

**Arquivo:** `sql-config/IMPLEMENT_PRICING_SYSTEM.sql` (linha 269)

**Problema:**
```sql
-- Policy: Sistema pode inserir/atualizar
CREATE POLICY "Sistema pode gerenciar usos"
ON tools_usage_monthly
FOR ALL
USING (true)   -- ❌❌❌ QUALQUER UM PODE FAZER TUDO!!!
WITH CHECK (true);
```

**Risco:**
- 🔥 **CRÍTICO** - Usuário malicioso pode:
  - Inserir usos falsos para outros usuários
  - Deletar registros de uso de terceiros
  - Manipular contador mensal (zerar usos grátis de outros)
  - **ROUBAR usos grátis de profissionais**

**Exemplo de Exploração:**
```sql
-- Hacker pode executar no console do Supabase:
INSERT INTO tools_usage_monthly (user_id, tool_id, month, uses_count)
VALUES (
  '<uuid_de_outro_usuario>',  -- Vítima
  '<uuid_ferramenta>',
  '2025-10-01',
  999  -- Bloquear usos grátis da vítima
);
```

**RECOMENDAÇÃO:** 
🔥 **URGENTE - CORRIGIR POLICY AGORA!**

---

### 🚨 **CRÍTICO 4: `supabaseAdmin` usado em endpoint de usuário**

**Arquivo:** `src/routes/pricingRoutes.js` (linha 43)

**Problema:**
```javascript
const { data: tool, error } = await supabaseAdmin  // ❌ Admin bypassa RLS
  .from('tools_catalog')
  .select('id')
  .eq('slug', toolSlug)
  .single();
```

**Risco:**
- **BAIXO** (neste caso) - Apenas leitura de catálogo público
- Mas é má prática usar `supabaseAdmin` quando não necessário

**RECOMENDAÇÃO:** 
✅ Trocar por `supabase` (com RLS)

---

### ⚠️ **MÉDIO 5: Functions SQL sem validação de permissões**

**Arquivo:** `sql-config/IMPLEMENT_PRICING_SYSTEM.sql` (linhas 170, 198)

**Problema:**
```sql
CREATE OR REPLACE FUNCTION increment_tool_usage(
  p_user_id UUID,
  p_tool_id UUID
) RETURNS INTEGER AS $$
-- ❌ Qualquer um pode chamar passando UUID de outro usuário!
```

**Risco:**
- **ALTO** - Combinado com a policy insegura, permite manipulação total

**RECOMENDAÇÃO:** 
✅ Adicionar validação `auth.uid() = p_user_id`

---

## ✅ PONTOS POSITIVOS (O que está CORRETO)

1. ✅ **Autenticação em endpoints sensíveis:**
   - `/pricing/*` - Todos com `requireAuth` ✅
   - `/credits/*` - Todos com `requireAuth` ✅
   - `/tools/track` - Com `requireAuth` ✅

2. ✅ **RLS habilitado:**
   - `tools_usage_monthly` tem RLS ativo ✅
   - Policy de SELECT correta: `auth.uid() = user_id` ✅

3. ✅ **Uso de transactions implícitas:**
   - Functions SQL são atômicas ✅

4. ✅ **Validação de tipos:**
   - Todos os UUIDs tipados corretamente ✅
   - Constraints CHECK em `uses_count` ✅

5. ✅ **Rate limiting:**
   - Todos endpoints com `apiLimiter` ✅

---

## 🔧 CORREÇÕES OBRIGATÓRIAS

### **CORREÇÃO 1: Proteger `/tools/list` e `/tools/most-used`**

```javascript
// Em src/routes/toolsRoutes.js
router.get('/list', requireAuth, async (req, res) => {  // ✅ Adicionar
  // ...
});

router.get('/most-used', requireAuth, async (req, res) => {  // ✅ Adicionar
  // ...
});
```

---

### **CORREÇÃO 2: 🔥 URGENTE - Corrigir RLS Policy**

```sql
-- EXECUTAR NO SUPABASE AGORA:

-- 1. Dropar policy insegura
DROP POLICY IF EXISTS "Sistema pode gerenciar usos" ON tools_usage_monthly;

-- 2. Criar policies seguras separadas

-- INSERT: Apenas para próprio usuário
CREATE POLICY "Usuários podem inserir próprios usos"
ON tools_usage_monthly
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Apenas próprios registros
CREATE POLICY "Usuários podem atualizar próprios usos"
ON tools_usage_monthly
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Apenas próprios registros (ou bloquear DELETE totalmente)
CREATE POLICY "Usuários podem deletar próprios usos"
ON tools_usage_monthly
FOR DELETE
USING (auth.uid() = user_id);

-- Ou bloqueie DELETE completamente:
-- (Comentar a policy acima e não criar nenhuma para DELETE)
```

---

### **CORREÇÃO 3: Validar permissões nas Functions SQL**

```sql
-- EXECUTAR NO SUPABASE:

DROP FUNCTION IF EXISTS increment_tool_usage(UUID, UUID);

CREATE OR REPLACE FUNCTION increment_tool_usage(
  p_user_id UUID,
  p_tool_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_current_month DATE;
  v_uses_count INTEGER;
BEGIN
  -- ✅ VALIDAR: Só pode incrementar próprio contador
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Você não pode incrementar usos de outro usuário';
  END IF;

  v_current_month := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  
  INSERT INTO tools_usage_monthly (user_id, tool_id, month, uses_count)
  VALUES (p_user_id, p_tool_id, v_current_month, 1)
  ON CONFLICT (user_id, tool_id, month)
  DO UPDATE SET 
    uses_count = tools_usage_monthly.uses_count + 1,
    updated_at = NOW()
  RETURNING uses_count INTO v_uses_count;
  
  RETURN v_uses_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;  -- ✅ Adicionar SECURITY DEFINER
```

**Mesma correção para `get_monthly_usage`:**

```sql
DROP FUNCTION IF EXISTS get_monthly_usage(UUID, UUID);

CREATE OR REPLACE FUNCTION get_monthly_usage(
  p_user_id UUID,
  p_tool_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_current_month DATE;
  v_uses_count INTEGER;
BEGIN
  -- ✅ VALIDAR: Só pode consultar próprio contador
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Você não pode consultar usos de outro usuário';
  END IF;

  v_current_month := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  
  SELECT uses_count INTO v_uses_count
  FROM tools_usage_monthly
  WHERE user_id = p_user_id
    AND tool_id = p_tool_id
    AND month = v_current_month;
  
  RETURN COALESCE(v_uses_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### **CORREÇÃO 4: Trocar `supabaseAdmin` por `supabase`**

```javascript
// Em src/routes/pricingRoutes.js
import { supabase } from '../config/supabase.js';  // ✅ Adicionar

// Linha 43:
const { data: tool, error } = await supabase  // ✅ Trocar
  .from('tools_catalog')
  .select('id')
  .eq('slug', toolSlug)
  .single();
```

---

## 🛡️ PROTEÇÕES ADICIONAIS RECOMENDADAS

### **1. Adicionar Rate Limiting Específico**

```javascript
// Em server.js
import rateLimit from 'express-rate-limit';

const pricingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // 30 requisições/minuto
  message: 'Muitas consultas de preço. Tente novamente em 1 minuto.'
});

app.use('/pricing', pricingLimiter, pricingRoutes);
```

---

### **2. Adicionar logs de auditoria**

```javascript
// Em toolsPricingService.js
export async function incrementMonthlyUsage(userId, toolId) {
  // Log ANTES de incrementar
  console.log(`📊 [AUDIT] Incrementando uso: userId=${userId}, toolId=${toolId}`);
  
  const { data, error } = await supabaseAdmin
    .rpc('increment_tool_usage', {
      p_user_id: userId,
      p_tool_id: toolId
    });

  if (error) {
    console.error(`❌ [AUDIT] FALHA ao incrementar: ${error.message}`);
    throw new Error('Erro ao registrar uso da ferramenta');
  }

  console.log(`✅ [AUDIT] Uso incrementado com sucesso: ${data}`);
  return data;
}
```

---

### **3. Validar UUIDs nos endpoints**

```javascript
// Em pricingRoutes.js
import { validate as isValidUUID } from 'uuid';

router.get('/:toolSlug/usage', requireAuth, async (req, res) => {
  try {
    const { toolSlug } = req.params;
    const userId = req.user.id;

    // ✅ Validar UUID
    if (!isValidUUID(userId)) {
      return res.status(400).json({
        success: false,
        error: 'UUID de usuário inválido'
      });
    }

    // ...
  }
});
```

---

## 📊 RESUMO DA AUDITORIA

| Item | Severidade | Status | Ação |
|------|-----------|--------|------|
| `/tools/list` sem auth | 🟡 MÉDIO | ❌ Vulnerável | Adicionar `requireAuth` |
| `/tools/most-used` sem auth | 🟡 MÉDIO | ❌ Vulnerável | Adicionar `requireAuth` |
| RLS Policy `USING (true)` | 🔴 CRÍTICO | ❌ INSEGURO | **CORRIGIR URGENTE** |
| Functions sem validação | 🟠 ALTO | ❌ Vulnerável | Adicionar `auth.uid()` check |
| `supabaseAdmin` desnecessário | 🟡 MÉDIO | ⚠️ Má prática | Trocar por `supabase` |
| Endpoints autenticados | ✅ OK | ✅ Seguro | Nenhuma |
| RLS habilitado | ✅ OK | ✅ Seguro | Nenhuma |
| Rate limiting | ✅ OK | ✅ Seguro | Nenhuma |

---

## 🎯 PLANO DE AÇÃO (Execute nesta ordem)

### **FASE 1: CORREÇÕES CRÍTICAS (AGORA!)**
1. ✅ Corrigir RLS Policy em `tools_usage_monthly`
2. ✅ Adicionar validação nas Functions SQL
3. ✅ Proteger `/tools/list` com `requireAuth`
4. ✅ Proteger `/tools/most-used` com `requireAuth`

### **FASE 2: MELHORIAS (Logo após)**
5. ✅ Trocar `supabaseAdmin` por `supabase` no pricingRoutes
6. ✅ Adicionar logs de auditoria
7. ✅ Testar tentativas de exploração

### **FASE 3: HARDENING (Opcional)**
8. ⚪ Rate limiting específico para `/pricing/*`
9. ⚪ Validação adicional de UUIDs
10. ⚪ Monitoramento de uso suspeito

---

## 🔍 TESTES DE SEGURANÇA SUGERIDOS

### **Teste 1: Tentar manipular contador de outro usuário**
```sql
-- No console do Supabase (logado como usuário A):
SELECT increment_tool_usage(
  '<uuid_do_usuario_B>',  -- Tentar incrementar contador de B
  '<uuid_ferramenta>'
);
-- ✅ Deve falhar com: "Você não pode incrementar usos de outro usuário"
```

### **Teste 2: Tentar inserir registro diretamente**
```sql
-- No console do Supabase (logado como usuário A):
INSERT INTO tools_usage_monthly (user_id, tool_id, month, uses_count)
VALUES (
  '<uuid_do_usuario_B>',  -- Tentar inserir para B
  '<uuid_ferramenta>',
  '2025-10-01',
  100
);
-- ✅ Deve falhar: "new row violates row-level security policy"
```

### **Teste 3: Acessar `/tools/list` sem login**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/tools/list"
# ✅ Deve retornar 401 Unauthorized
```

---

## 📝 NOTAS FINAIS

### **Sua Análise Estava CORRETA:**
> "eu acredito que tem alguns endpoints que deveria so funcionar se o usuario estiver logado"

✅ **SIM, você estava certo!** `/tools/list` e `/tools/most-used` devem exigir autenticação por:
- Segurança: Evita scraping
- Controle: Sabe quem acessa
- Analytics: Rastreia uso por usuário

### **Vulnerabilidade CRÍTICA Encontrada:**
🔥 A policy RLS `USING (true)` é **extremamente perigosa** e deve ser corrigida **IMEDIATAMENTE**.

### **Impacto se não corrigir:**
- Hackers podem zerar usos grátis de profissionais
- Podem criar registros falsos
- Podem deletar dados de uso de terceiros
- **Perda de receita** (pessoas usando sem pagar)

---

**Status:** 🔴 **AÇÃO URGENTE NECESSÁRIA**  
**Próximo passo:** Executar correções SQL no Supabase AGORA

