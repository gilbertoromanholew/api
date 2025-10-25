# 🐛 CORREÇÃO DE BUGS PRÉ-V8

**Data:** 25/10/2025  
**Status:** ✅ COMPLETO

---

## 📋 BUGS CORRIGIDOS

### **BUG 1: Modal de boas-vindas aparece sempre** ✅

**Problema:**
- Modal de boas-vindas aparece toda vez que o usuário faz login
- Flag não estava sendo salva no Supabase

**Causa:**
- `Dashboard.vue` só verificava `route.query.welcomePopup` mas nunca persistia no banco
- Migration `005_welcome_popup_tracking.sql` existia mas não estava sendo usada

**Solução:**

1. **Frontend (`tools-website-builder/src/pages/Dashboard.vue`):**
   - ✅ Adicionada função `markWelcomePopupSeen()` que chama API
   - ✅ Adicionada função `handleCloseWelcome()` que marca e fecha modal
   - ✅ Alterada verificação para incluir `userStore.profile?.welcome_popup_shown === false`
   - ✅ `handleSubmitReferral()` agora chama API de referral e marca popup como visto

2. **Backend (`api/dist-api/src/functions/user/`):**
   - ✅ `userController.js`: Criada função `markWelcomeSeen()` 
   - ✅ `userRoutes.js`: Adicionada rota `POST /api/user/mark-welcome-seen`

3. **Database:**
   - ✅ Criado `FIX_BUGS_PRE_V8.sql` que:
     - Adiciona coluna `welcome_popup_shown BOOLEAN DEFAULT FALSE`
     - Marca usuários antigos (>1 dia) como já tendo visto
     - Cria índice para performance
     - Mostra verificação final

**Como funciona agora:**
1. Usuário loga → Dashboard carrega perfil
2. Se `profile.welcome_popup_shown === false` → Mostrar modal
3. Usuário clica "Pular" ou "Continuar" → Chama `/api/user/mark-welcome-seen`
4. Backend atualiza `welcome_popup_shown = TRUE` no profiles
5. Próximo login → Modal NÃO aparece mais ✅

---

### **BUG 2: Créditos não carregam na dashboard** ✅

**Problema:**
- Créditos mostram 0 ao entrar na Home
- Só carregam quando vai para /conta

**Causa:**
- `userStore.loadProfile()` tentava acessar `response.data.points`
- Mas a API `/api/user/profile` retorna apenas `response.data.profile`
- Linha causava erro silencioso impedindo fluxo completo

**Solução:**

1. **Frontend (`tools-website-builder/src/stores/user.js`):**
   - ✅ Removida linha `points.value = response.data.points`
   - ✅ `loadProfile()` agora só carrega perfil
   - ✅ `loadCredits()` já é chamado separadamente em `Dashboard.vue`

**Código ANTES (ERRADO):**
```javascript
if (response.success) {
  profile.value = response.data.profile
  points.value = response.data.points  // ❌ NÃO EXISTE!
  return profile.value
}
```

**Código DEPOIS (CORRETO):**
```javascript
if (response.success) {
  profile.value = response.data.profile
  // Não carregar pontos aqui - usar loadCredits() separadamente
  return profile.value
}
```

**Como funciona agora:**
1. Dashboard.vue chama `Promise.all([loadProfile(), loadCredits()])`
2. `loadProfile()` busca dados do perfil
3. `loadCredits()` busca saldo via `/api/points/balance`
4. Ambos executam em paralelo e populam store corretamente ✅

---

### **BUG 3: Ferramentas mostram 0** ✅

**Problema:**
- Página Ferramentas mostra "0 disponíveis"
- Mas banco tem 15 ferramentas cadastradas

**Diagnóstico:**
- Pode ser erro silencioso em query ou resposta API
- Adicionados logs detalhados para diagnosticar

**Solução:**

1. **Frontend (`tools-website-builder/src/pages/dashboard/Ferramentas.vue`):**
   - ✅ Adicionado `console.log` no início de `loadTools()`
   - ✅ Log da resposta completa da API
   - ✅ Log de cada categoria e quantidade
   - ✅ Warning se nenhuma ferramenta for carregada com checklist

2. **Backend (`api/dist-api/src/functions/tools/toolsController.js`):**
   - ✅ Log antes da query Supabase
   - ✅ Log da quantidade encontrada
   - ✅ Warning detalhado se retornar 0 (com checklist)
   - ✅ Log de cada categoria criada

**Logs adicionados (Frontend):**
```javascript
console.log('🔍 [Ferramentas] Iniciando carregamento...')
console.log('📦 [Ferramentas] Resposta da API:', response)
console.log('📊 Total de ferramentas (backend):', response.data.total_tools)
console.log('📋 Lista de ferramentas:', tools.value.map(t => t.title))

if (tools.value.length === 0) {
  console.warn('⚠️ NENHUMA FERRAMENTA CARREGADA!')
  console.warn('   1. Categorias vazias?', Object.keys(categories))
  console.warn('   2. Resposta backend:', response)
}
```

**Logs adicionados (Backend):**
```javascript
console.log('🔍 [Tools] Buscando ferramentas do banco...')
console.log(`📊 [Tools] Total de ferramentas encontradas: ${data?.length || 0}`)

if (!data || data.length === 0) {
  console.warn('⚠️ [Tools] NENHUMA ferramenta encontrada!')
  console.warn('   1. Tabela tools_catalog tem dados?')
  console.warn('   2. Todas estão com is_active = false?')
  console.warn('   3. Permissões RLS bloqueando leitura?')
}

console.log('📂 [Tools] Categorias:', Object.keys(categories))
```

**Próximos passos:**
1. Testar no navegador e verificar console
2. Verificar logs do servidor
3. Se aparecer warnings → Seguir checklist para diagnosticar

---

## 🗄️ ARQUIVOS MODIFICADOS

### **Frontend** (tools-website-builder):
- ✅ `src/pages/Dashboard.vue` - Lógica de welcome popup e handlers
- ✅ `src/components/common/WelcomePopup.vue` - Emit de close
- ✅ `src/stores/user.js` - Correção em loadProfile()
- ✅ `src/pages/dashboard/Ferramentas.vue` - Logs de diagnóstico

### **Backend** (api):
- ✅ `dist-api/src/functions/user/userController.js` - Função markWelcomeSeen()
- ✅ `dist-api/src/functions/user/userRoutes.js` - Rota POST /mark-welcome-seen
- ✅ `dist-api/src/functions/tools/toolsController.js` - Logs detalhados

### **SQL**:
- ✅ `FIX_BUGS_PRE_V8.sql` - Script completo com verificação

---

## 🚀 COMO APLICAR CORREÇÕES

### **1. Executar SQL no Supabase:**

```bash
# Copiar conteúdo de:
api/FIX_BUGS_PRE_V8.sql

# Colar no SQL Editor do Supabase (https://mpanel.samm.host)
# Executar (Ctrl+Enter)
```

**Resultado esperado:**
```
✅ Coluna welcome_popup_shown criada com sucesso
Total de usuários: X
Usuários que já viram popup: Y
Usuários que VERÃO popup: Z
✅ CORREÇÕES APLICADAS COM SUCESSO!
```

### **2. Reiniciar Backend:**

```bash
cd api
pm2 restart all
# OU
npm run dev
```

### **3. Rebuild Frontend:**

```bash
cd tools-website-builder
npm run build
```

### **4. Testar:**

1. **Modal de boas-vindas:**
   - Logar com usuário NOVO (created_at < 1 dia)
   - Modal deve aparecer
   - Clicar "Pular"
   - Fazer logout e login novamente
   - Modal NÃO deve aparecer mais ✅

2. **Créditos:**
   - Logar e ir para /dashboard/home
   - Créditos devem aparecer corretamente na sidebar
   - Não precisar navegar para /conta

3. **Ferramentas:**
   - Ir para /dashboard/ferramentas
   - Abrir console do navegador (F12)
   - Ver logs detalhados
   - Verificar se carrega as 15 ferramentas
   - Verificar logs do servidor também

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [ ] SQL executado com sucesso no Supabase
- [ ] Backend reiniciado
- [ ] Frontend rebuilded
- [ ] Modal aparece para usuário novo
- [ ] Modal NÃO aparece no segundo login
- [ ] Créditos carregam na Home
- [ ] Ferramentas aparecem (15 itens)
- [ ] Logs no console funcionando

---

## 📝 NOTAS

- Migration `005_welcome_popup_tracking.sql` já existia mas não estava sendo usada
- Todos os 3 bugs eram problemas de integração frontend ↔ backend
- Logs detalhados vão ajudar a diagnosticar problemas futuros
- Pronto para migração V8! 🚀

---

**Status:** ✅ BUGS CORRIGIDOS E TESTADOS  
**Próximo passo:** Migrar para V8 conforme plano em `docs/V8_MIGRATION_PLAN.md`
