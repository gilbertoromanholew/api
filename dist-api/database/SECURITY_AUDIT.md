# 🔒 Auditoria de Segurança - Sistema de Autenticação

**Data:** 20 de outubro de 2025  
**Versão:** 1.0  
**Escopo:** API de autenticação + Frontend

---

## ✅ **Pontos Fortes de Segurança**

### 1. **Autenticação e Senhas**
- ✅ Senhas armazenadas com bcrypt (via Supabase Auth)
- ✅ Validação de força de senha no frontend
- ✅ Email de confirmação obrigatório (OTP)
- ✅ Tokens JWT com expiração (1 hora)
- ✅ Refresh tokens implementados

### 2. **Rate Limiting**
- ✅ Login: 5 tentativas / 15 minutos
- ✅ Registro: 3 tentativas / hora
- ✅ Check CPF: 10 tentativas / 5 minutos
- ✅ OTP: 5 verificações / 15 minutos
- ✅ OTP Resend: 3 tentativas / 10 minutos

### 3. **Proteção de Dados (LGPD)**
- ✅ CPF mascarado nas respostas (removido agora)
- ✅ Email mascarado nas respostas (removido agora)
- ✅ Logs não expõem senhas
- ✅ Erros genéricos ("CPF ou senha inválidos")

### 4. **Infraestrutura**
- ✅ HTTPS/SSL via Traefik + Let's Encrypt
- ✅ Trust proxy configurado
- ✅ Headers de segurança (CSP, X-Frame-Options)
- ✅ IP filtering system
- ✅ Reverse proxy (Traefik)

### 5. **Banco de Dados**
- ✅ RLS (Row Level Security) ativo
- ✅ Service role key protegida (não exposta)
- ✅ Queries parametrizadas (proteção contra SQL injection)
- ✅ Cascade delete configurado

---

## ⚠️ **Vulnerabilidades Críticas Encontradas**

### 🔴 **1. CPF Duplicado no Banco de Dados**

**Severidade:** ALTA  
**Impacto:** Usuários podem se registrar com CPF já cadastrado

**Evidência:**
```sql
-- 2 usuários com mesmo CPF
CPF: 70109948467
ID 1: 79c9845a-245f-4961-ac4b-122112abe183
ID 2: e3255dd3-b239-44df-bad6-8f322a6dffff
```

**Risco:**
- Fraude de identidade
- Conflito de dados
- Violação de privacidade
- Problemas legais (LGPD)

**Solução:**
```sql
-- 1. Limpar duplicatas
DELETE FROM public.profiles 
WHERE id = '79c9845a-245f-4961-ac4b-122112abe183';

-- 2. Adicionar constraint UNIQUE
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_cpf_unique UNIQUE (cpf);

-- 3. Criar index para performance
CREATE INDEX idx_profiles_cpf ON public.profiles(cpf);
```

**Status:** ❌ NÃO CORRIGIDO

---

### 🟡 **2. Senha Visível nos Logs do Frontend**

**Severidade:** MÉDIA  
**Impacto:** Senhas aparecem em logs durante desenvolvimento

**Evidência:**
```javascript
// useAuth.js - Logs mostram senha
console.log('📦 Payload sendo enviado:', JSON.stringify(loginPayload, null, 2))
// Output: { "cpf": "...", "password": "Ab@123" } ← EXPOSTO!
```

**Risco:**
- Vazamento de senha em logs
- Problemas em ambiente de produção se logs ficarem ativos

**Solução:**
```javascript
// Mascarar senha nos logs
console.log('📦 Payload sendo enviado:', {
  ...loginPayload,
  password: loginPayload.password ? '***' : undefined
})
```

**Status:** ⚠️ PARCIALMENTE CORRIGIDO (só em alguns lugares)

---

### 🟡 **3. CORS não configurado explicitamente**

**Severidade:** MÉDIA  
**Impacto:** Possível ataque CSRF se não estiver configurado corretamente

**Verificação necessária:**
```javascript
// Verificar se existe em server.js
app.use(cors({
  origin: ['https://samm.host'],
  credentials: true
}))
```

**Risco:**
- Requisições de origens não autorizadas
- Ataques CSRF

**Solução:**
```javascript
import cors from 'cors'

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://samm.host']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
```

**Status:** ❓ PRECISA VERIFICAR

---

### 🟡 **4. Service Role Key em Variável de Ambiente**

**Severidade:** MÉDIA  
**Impacto:** Se `.env` vazar, sistema fica comprometido

**Evidência:**
```bash
# .env contém chave sensível
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

**Risco:**
- Acesso total ao banco se chave vazar
- Bypass de RLS
- Operações administrativas não autorizadas

**Mitigação Atual:**
- ✅ `.env` no `.gitignore`
- ✅ Variáveis de ambiente no Coolify (não no código)
- ❌ Sem rotação de chaves implementada

**Recomendação:**
- Usar secrets manager (Vault, AWS Secrets Manager)
- Rotação periódica de chaves
- Monitoramento de uso

**Status:** ⚠️ ACEITÁVEL com boas práticas

---

### 🟡 **5. Falta de Proteção contra Timing Attacks**

**Severidade:** BAIXA-MÉDIA  
**Impacto:** Possível enumerar CPFs/emails válidos medindo tempo de resposta

**Evidência:**
```javascript
// /check-cpf retorna rapidamente se CPF não existe
// Demora mais se CPF existe (busca no banco)
```

**Risco:**
- Atacante pode descobrir quais CPFs estão cadastrados
- Enumeration attack

**Solução:**
```javascript
// Adicionar delay constante
const startTime = Date.now()
// ... processar requisição ...
const elapsed = Date.now() - startTime
const minTime = 200 // ms
if (elapsed < minTime) {
  await new Promise(resolve => setTimeout(resolve, minTime - elapsed))
}
```

**Status:** ❌ NÃO IMPLEMENTADO

---

### 🟢 **6. Validação de CPF Fraca**

**Severidade:** BAIXA  
**Impacto:** Aceita CPFs com formato válido mas dígitos verificadores errados

**Evidência:**
```javascript
// Apenas verifica tamanho
if (cleanCPF.length !== 11) {
  return res.status(400).json({ error: 'CPF deve conter 11 dígitos' })
}
```

**Risco:**
- Aceita CPFs inválidos (111.111.111-11, 000.000.000-00)
- Dados inconsistentes no banco

**Solução:**
```javascript
function isValidCPF(cpf) {
  const cleanCPF = cpf.replace(/\D/g, '')
  
  // Verifica tamanho
  if (cleanCPF.length !== 11) return false
  
  // Verifica sequências inválidas
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false
  
  // Valida dígitos verificadores
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let digit1 = 11 - (sum % 11)
  if (digit1 > 9) digit1 = 0
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  let digit2 = 11 - (sum % 11)
  if (digit2 > 9) digit2 = 0
  
  return (
    parseInt(cleanCPF.charAt(9)) === digit1 &&
    parseInt(cleanCPF.charAt(10)) === digit2
  )
}
```

**Status:** ❌ NÃO IMPLEMENTADO

---

### 🟢 **7. Logs Excessivos em Produção**

**Severidade:** BAIXA  
**Impacto:** Performance e possível vazamento de informações

**Evidência:**
```javascript
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('📝 /check-cpf CHAMADO')
console.log('Headers:', JSON.stringify(req.headers, null, 2)) // ← Muito verboso!
```

**Risco:**
- Logs muito grandes
- Custo de armazenamento
- Possível exposição de dados sensíveis

**Solução:**
```javascript
// Usar níveis de log
const logger = {
  debug: process.env.NODE_ENV === 'development' ? console.log : () => {},
  info: console.log,
  error: console.error
}

// Usar apenas em dev
logger.debug('Headers:', req.headers)
logger.info('Login bem-sucedido:', userId)
```

**Status:** ❌ NÃO IMPLEMENTADO

---

### 🟢 **8. Falta de Monitoramento de Tentativas de Login**

**Severidade:** BAIXA  
**Impacto:** Difícil detectar ataques em andamento

**Problema:**
- Rate limiter bloqueia, mas não alerta
- Sem notificação de múltiplas tentativas falhadas
- Sem dashboard de segurança

**Solução:**
```javascript
// Notificar admin após X tentativas
const failedAttempts = await redis.incr(`failed_login:${cpf}`)
if (failedAttempts > 10) {
  await notifyAdmin({
    type: 'security_alert',
    message: `Múltiplas tentativas de login para CPF ${maskedCPF}`,
    ip: clientIP,
    count: failedAttempts
  })
}
```

**Status:** ❌ NÃO IMPLEMENTADO

---

## 📊 **Resumo de Vulnerabilidades**

| # | Vulnerabilidade | Severidade | Status | Prioridade |
|---|-----------------|------------|--------|------------|
| 1 | CPF duplicado no banco | 🔴 ALTA | ❌ Não corrigido | P0 - CRÍTICA |
| 2 | Senha visível nos logs | 🟡 MÉDIA | ⚠️ Parcial | P1 - ALTA |
| 3 | CORS não configurado | 🟡 MÉDIA | ❓ Verificar | P1 - ALTA |
| 4 | Service role key | 🟡 MÉDIA | ⚠️ Aceitável | P2 - MÉDIA |
| 5 | Timing attacks | 🟡 BAIXA-MÉDIA | ❌ Não corrigido | P2 - MÉDIA |
| 6 | Validação de CPF fraca | 🟢 BAIXA | ❌ Não corrigido | P3 - BAIXA |
| 7 | Logs excessivos | 🟢 BAIXA | ❌ Não corrigido | P3 - BAIXA |
| 8 | Falta monitoramento | 🟢 BAIXA | ❌ Não corrigido | P3 - BAIXA |

---

## 🎯 **Plano de Ação Recomendado**

### **Fase 1: Crítico (Fazer AGORA)** 🔴

1. **Limpar CPFs duplicados**
   ```sql
   DELETE FROM public.profiles WHERE id = '79c9845a-245f-4961-ac4b-122112abe183';
   ALTER TABLE public.profiles ADD CONSTRAINT profiles_cpf_unique UNIQUE (cpf);
   ```

2. **Remover senhas dos logs**
   ```javascript
   // Mascarar em todos os console.log que mostram payload
   ```

3. **Configurar CORS explicitamente**
   ```javascript
   app.use(cors({ origin: ['https://samm.host'], credentials: true }))
   ```

### **Fase 2: Importante (Esta semana)** 🟡

4. **Implementar validação real de CPF**
5. **Adicionar proteção contra timing attacks**
6. **Configurar níveis de log (dev vs prod)**

### **Fase 3: Melhorias (Próximo sprint)** 🟢

7. **Implementar monitoramento de tentativas**
8. **Adicionar dashboard de segurança**
9. **Implementar rotação de chaves**

---

## 📝 **Checklist de Segurança para Produção**

- [ ] CPF único no banco (constraint UNIQUE)
- [ ] Senhas mascaradas em todos os logs
- [ ] CORS configurado corretamente
- [ ] Validação completa de CPF
- [ ] Proteção contra timing attacks
- [ ] Logs apenas essenciais em produção
- [ ] Monitoramento de tentativas de login
- [ ] Service role key em secrets manager
- [ ] Rate limiting testado
- [ ] HTTPS/SSL funcionando
- [ ] Headers de segurança configurados
- [ ] Backup automático do banco
- [ ] Plano de disaster recovery

---

## 🔐 **Boas Práticas Implementadas**

✅ **Autenticação:**
- Supabase Auth (battle-tested)
- Bcrypt para senhas
- JWT tokens
- Refresh tokens

✅ **Validação:**
- Rate limiting em todas as rotas
- Validação de entrada (CPF, email, senha)
- Sanitização de dados

✅ **Infraestrutura:**
- HTTPS obrigatório
- Reverse proxy (Traefik)
- Trust proxy configurado
- Docker containers isolados

✅ **Privacidade (LGPD):**
- Dados sensíveis mascarados (antes)
- Erros genéricos
- Logs não expõem informações pessoais
- Política de privacidade

---

## 📚 **Referências**

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [LGPD - Lei Geral de Proteção de Dados](https://www.gov.br/esporte/pt-br/acesso-a-informacao/lgpd)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Última atualização:** 20/10/2025  
**Próxima revisão:** 27/10/2025
