# 🔧 CORREÇÕES FINAIS - BUGS PRÉ-V8

**Data:** 25/10/2025  
**Status:** ✅ TODAS CORREÇÕES APLICADAS

---

## 📝 RESUMO DAS CORREÇÕES

### ✅ **BUG 1: Modal de boas-vindas** - CORRIGIDO

**Arquivo:** `api/dist-api/src/functions/user/userController.js`

**Erro:** Usava `.eq('user_id', userId)` mas a coluna é `id`

**Correção:**
```javascript
// ❌ ANTES (ERRADO):
.eq('user_id', userId)

// ✅ DEPOIS (CORRETO):
.eq('id', userId)
```

**SQL necessário:** `FIX_BUGS_PRE_V8.sql` (adiciona coluna `welcome_popup_shown`)

---

### ✅ **BUG 2: Ferramentas retornam 0** - CORRIGIDO

**Arquivo:** `api/dist-api/src/functions/tools/toolsController.js`

**Erro:** Usava `supabase` (cliente normal) que pode ser bloqueado por RLS

**Correção:**
```javascript
// ❌ ANTES (ERRADO):
const { data, error } = await supabase
    .from('tools_catalog')

// ✅ DEPOIS (CORRETO):
const { data, error } = await supabaseAdmin
    .from('tools_catalog')
```

**Resultado esperado:** Retornar 15 ferramentas cadastradas

---

### ✅ **BUG 3: Créditos não carregam** - JÁ ESTAVA CORRETO

**Arquivo:** `api/dist-api/src/functions/points/pointsController.js`

**Status:** Já usa `supabaseAdmin` corretamente ✅

**Frontend:** `tools-website-builder/src/stores/user.js`
- Removida linha `points.value = response.data.points` (não existe)
- `loadCredits()` é chamado separadamente no `Dashboard.vue`

---

## 📦 ARQUIVOS MODIFICADOS

### Backend (api):
1. ✅ `dist-api/src/functions/user/userController.js` - `.eq('id', userId)`
2. ✅ `dist-api/src/functions/tools/toolsController.js` - `supabaseAdmin`

### Frontend (tools-website-builder):
1. ✅ `src/stores/user.js` - Removida linha bugada
2. ✅ `src/pages/Dashboard.vue` - Lógica de welcome popup
3. ✅ `src/pages/dashboard/Ferramentas.vue` - Logs de diagnóstico

---

## 🚀 COMO TESTAR

### 1. Reiniciar Backend:
```powershell
cd api
pm2 restart all
# OU
npm run dev
```

### 2. Executar SQL no Supabase:
```sql
-- Copiar e executar: api/FIX_BUGS_PRE_V8.sql
```

### 3. Rebuild Frontend:
```powershell
cd tools-website-builder
npm run dev
```

### 4. Testar no navegador:

**A) Ferramentas:**
- Ir para `/dashboard/ferramentas`
- Deve mostrar **15 ferramentas** ✅
- Console do navegador deve mostrar:
  ```
  📦 Categorias recebidas: (5) ['Trabalhista', 'Previdenciário', ...]
  📊 Total de ferramentas (backend): 15
  ✅ 15 ferramentas carregadas do Supabase
  ```
- Console do servidor deve mostrar:
  ```
  🔍 [Tools] Buscando ferramentas do banco...
  📊 [Tools] Total de ferramentas encontradas: 15
  📂 [Tools] Categorias: [ 'Trabalhista', 'Previdenciário', ... ]
  ```

**B) Créditos:**
- Fazer login
- Dashboard deve mostrar créditos na sidebar imediatamente
- Console do servidor:
  ```
  💰 [Points] Buscando saldo para: <uuid>
  ✅ [Points] Carteira encontrada: { bonus: 100, purchased: 0, total: 100 }
  ```

**C) Modal de boas-vindas:**
- Fazer login com usuário NOVO (criado hoje)
- Modal aparece ✅
- Clicar "Pular"
- Console do servidor:
  ```
  🎉 [User] Marcando welcome popup como visto para: <uuid>
  ✅ [User] Welcome popup marcado com sucesso
  ```
- Fazer logout e login novamente
- Modal NÃO aparece mais ✅

---

## 🔍 DIAGNÓSTICO DETALHADO

### Ferramentas no Banco:
```
Total: 15 ferramentas
Categorias:
- Trabalhista (3): calc_rescisao, calc_ferias, calc_13_salario
- Previdenciário (3): calc_tempo_contribuicao, extrator_cnis, calc_acumulacao
- Planejamento (3): planejamento_trabalhista, planejamento_previdenciario, planejamento_assistencial
- Validações (3): validador_cpf, validador_cnpj, consulta_cep
- Cálculos (3): atualizacao_monetaria, calc_juros, comparador_indices
```

### Permissões da Tabela:
```json
{
  "anon": ["SELECT"],
  "authenticated": ["SELECT", "INSERT", "UPDATE", "DELETE"],
  "service_role": ["ALL"]
}
```

✅ Permissões corretas!

---

## ✅ CHECKLIST FINAL

- [x] `markWelcomeSeen()` usa `.eq('id', userId)` ✅
- [x] `listTools()` usa `supabaseAdmin` ✅
- [x] `getBalance()` já usa `supabaseAdmin` ✅
- [x] `user.js` store sem linha bugada ✅
- [x] Logs detalhados em ferramentas ✅
- [x] SQL para adicionar `welcome_popup_shown` ✅
- [ ] Testar no navegador
- [ ] Verificar logs do servidor

---

**Próximos passos:**
1. Reiniciar backend
2. Executar SQL
3. Testar tudo
4. Se funcionar → Migrar para V8! 🚀
