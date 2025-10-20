# 🔒 Auditoria de Rate Limiting - UX vs Segurança

**Data:** 20 de outubro de 2025  
**Severidade:** 🔴 ALTA  
**Categoria:** UX + Segurança

---

## ⚠️ **PROBLEMA IDENTIFICADO**

### **Cenário de Vulnerabilidade:**

```
📧 Atacante tenta invadir conta de vítima:
├─ Tentativa 1: senha errada ❌
├─ Tentativa 2: senha errada ❌
├─ Tentativa 3: senha errada ❌
├─ Tentativa 4: senha errada ❌
└─ Tentativa 5: senha errada ❌
    └─ 🔒 RATE LIMIT: Bloqueado por 15 minutos

⏰ 15 minutos depois...

👤 VÍTIMA (dono real da conta) tenta fazer login:
├─ CPF correto ✅
├─ Senha correta ✅
└─ ❌ BLOQUEADO! "Aguarde 15 minutos"
    └─ 😡 Vítima frustrada, não consegue acessar própria conta!
```

### **Impacto:**
- ❌ **DoS (Denial of Service)** contra usuário legítimo
- ❌ Atacante pode **impedir acesso** do dono da conta
- ❌ Experiência ruim para usuário leigo
- ❌ Pode gerar tickets de suporte desnecessários
- ❌ Usuário pode achar que sistema está quebrado

---

## 📊 **Análise dos Limites Atuais**

| Endpoint | Limite Atual | Janela Atual | Problema |
|----------|--------------|--------------|----------|
| **Login** | 5 tentativas | 15 minutos | 🔴 Muito restritivo, DoS fácil |
| **CPF check** | 10 tentativas | 5 minutos | 🟡 Razoável, mas janela curta |
| **Registro** | 3 tentativas | 1 hora | 🔴 MUITO restritivo |
| **OTP verify** | 5 tentativas | 15 minutos | 🔴 Muito restritivo |
| **OTP resend** | 3 tentativas | 10 minutos | 🟡 Razoável |

---

## 🎯 **Recomendações de Limites Balanceados**

### **Princípios:**
1. ✅ **Usuário legítimo deve ter múltiplas chances**
2. ✅ **Janela de tempo progressiva** (não linear)
3. ✅ **Rate limit por IP + por CPF** (duplo controle)
4. ✅ **Mensagens vagas** (não revelar tempo exato)
5. ✅ **Escape hatch** (recuperação de senha)

### **Novos Limites Propostos:**

| Endpoint | Limite Novo | Janela | Progressão | Justificativa |
|----------|-------------|--------|------------|---------------|
| **Login** | 10 tentativas | 10 minutos | 1º bloqueio: 5min<br>2º bloqueio: 15min<br>3º bloqueio: 1h | Usuário legítimo pode errar senha algumas vezes |
| **CPF check** | 20 tentativas | 10 minutos | Única janela | Apenas consulta, baixo risco |
| **Registro** | 5 tentativas | 30 minutos | 1º bloqueio: 30min<br>2º bloqueio: 2h | Evita spam mas permite tentativas legítimas |
| **OTP verify** | 10 tentativas | 20 minutos | Única janela | OTP tem 6 dígitos, pode errar digitação |
| **OTP resend** | 5 tentativas | 15 minutos | Única janela | Evita spam de emails |

---

## 🔐 **Estratégia de Segurança em Camadas**

### **Camada 1: Rate Limit por IP (Global)**
```javascript
// Bloqueia IP suspeito independente de CPF
const globalIPLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // 50 requisições totais
  message: 'Muitas requisições deste IP. Tente novamente mais tarde.'
})
```

### **Camada 2: Rate Limit por CPF (Específico)**
```javascript
// Bloqueia tentativas em CPF específico
const loginLimiterByCPF = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 10, // 10 tentativas por CPF
  keyGenerator: (req) => req.body.cpf, // Chave por CPF
  message: 'Muitas tentativas de login para este CPF.'
})
```

### **Camada 3: Rate Limit Progressivo**
```javascript
// Aumenta tempo de bloqueio a cada infração
const progressiveRateLimit = {
  1: { max: 10, windowMs: 5 * 60 * 1000 },   // 1ª: 10 tentativas em 5min
  2: { max: 5, windowMs: 15 * 60 * 1000 },   // 2ª: 5 tentativas em 15min
  3: { max: 3, windowMs: 60 * 60 * 1000 }    // 3ª: 3 tentativas em 1h
}
```

### **Camada 4: CAPTCHA Adaptativo**
```javascript
// Após X tentativas, exige CAPTCHA (não bloqueia)
if (failedAttempts >= 5) {
  requireCaptcha = true // Google reCAPTCHA v3
}
```

### **Camada 5: Notificação ao Usuário**
```javascript
// Após tentativas suspeitas, avisa dono da conta
if (failedAttempts >= 10) {
  await sendEmail({
    to: user.email,
    subject: '⚠️ Tentativas de login suspeitas',
    body: `Detectamos ${failedAttempts} tentativas de login na sua conta.`
  })
}
```

---

## 📝 **Novas Mensagens de Erro (Vagas)**

### **❌ ANTES (Ruim - Revela informação):**
```javascript
"Limite de tentativas excedido. Aguarde 15 minutos."
// ❌ Revela tempo exato
// ❌ Atacante sabe quando pode tentar novamente
// ❌ Usuário legítimo fica frustrado
```

### **✅ DEPOIS (Bom - Vago mas útil):**
```javascript
"Por segurança, bloqueamos temporariamente o acesso. Tente novamente mais tarde ou recupere sua senha."
// ✅ Não revela tempo exato
// ✅ Oferece alternativa (recuperar senha)
// ✅ Explica motivo (segurança)
// ✅ Tom profissional
```

---

## 🎨 **Mensagens Recomendadas por Situação**

### **1. Login - Senha Incorreta (< 5 tentativas)**
```
❌ Senha incorreta. Verifique e tente novamente.
```

### **2. Login - Senha Incorreta (5-10 tentativas)**
```
⚠️ Senha incorreta. Restam X tentativas antes do bloqueio temporário.
[Link: Esqueci minha senha]
```

### **3. Login - Rate Limit Atingido**
```
🔒 Por segurança, bloqueamos temporariamente o acesso a esta conta.
Você pode:
• Aguardar alguns minutos e tentar novamente
• Recuperar sua senha através do email cadastrado
• Entrar em contato com o suporte se precisar de ajuda

Se você não tentou acessar esta conta, ela pode estar sob ataque.
Recomendamos trocar sua senha imediatamente.
```

### **4. CPF Check - Rate Limit**
```
⏳ Você está consultando CPFs com muita frequência.
Aguarde alguns instantes e tente novamente.
```

### **5. Registro - Rate Limit**
```
⏳ Muitas tentativas de cadastro.
Aguarde alguns minutos ou entre em contato com o suporte se estiver enfrentando dificuldades.
```

### **6. OTP - Rate Limit (Verificação)**
```
⏳ Código incorreto ou expirado.
Solicite um novo código ou entre em contato com o suporte.
[Botão: Reenviar Código]
```

### **7. OTP - Rate Limit (Reenvio)**
```
📧 Já enviamos vários códigos recentemente.
Verifique sua caixa de entrada e spam antes de solicitar outro.
```

---

## 🛡️ **Mitigação de DoS contra Usuário Legítimo**

### **Problema:**
Atacante pode bloquear conta de vítima propositalmente.

### **Soluções:**

#### **Solução 1: Rate Limit Combinado (IP + CPF)**
```javascript
// Bloqueia só se AMBOS excederem limite
if (ipExceeded && cpfExceeded) {
  return block()
}

// Se só IP excedeu, exige CAPTCHA
if (ipExceeded && !cpfExceeded) {
  return requireCaptcha()
}

// Se só CPF excedeu, permite com senha correta
if (!ipExceeded && cpfExceeded) {
  const passwordCorrect = await verifyPassword(cpf, password)
  if (passwordCorrect) {
    return allow() // ✅ Dono da conta consegue entrar!
  }
}
```

#### **Solução 2: Whitelist de IPs Confiáveis**
```javascript
// IPs que já fizeram login com sucesso recentemente
const trustedIPs = await redis.get(`trusted:${cpf}`)

if (trustedIPs.includes(clientIP)) {
  return bypassRateLimit() // ✅ IP conhecido, menos restritivo
}
```

#### **Solução 3: Recuperação de Senha Priority**
```javascript
// Rate limit NÃO se aplica a endpoint de recuperação
router.post('/forgot-password', async (req, res) => {
  // Sem rate limit agressivo, só anti-spam básico
  // Usuário sempre consegue recuperar acesso
})
```

#### **Solução 4: Notificação Proativa**
```javascript
// Avisar usuário sobre bloqueio + como resolver
if (rateLimitHit && attempts > 5) {
  await sendEmail({
    to: user.email,
    subject: '⚠️ Sua conta foi temporariamente bloqueada',
    body: `
      Detectamos múltiplas tentativas de login incorretas.
      
      Se foi você:
      - Aguarde alguns minutos e tente novamente
      - Ou clique aqui para redefinir sua senha: [LINK]
      
      Se NÃO foi você:
      - Sua conta pode estar sob ataque
      - Recomendamos trocar sua senha imediatamente: [LINK]
    `
  })
}
```

---

## 📊 **Comparação: Antes vs Depois**

### **Cenário: Usuário Legítimo Errando Senha**

| Tentativa | ANTES (Atual) | DEPOIS (Proposto) |
|-----------|---------------|-------------------|
| 1-3 | ❌ Senha incorreta | ❌ Senha incorreta |
| 4-5 | ❌ Senha incorreta | ⚠️ Senha incorreta. Restam X tentativas |
| 6 | 🔒 Bloqueado 15min | ❌ Senha incorreta |
| 7-10 | 🔒 Bloqueado 15min | ❌ Senha incorreta |
| 11 | 🔒 Bloqueado 15min | 🔒 Bloqueado + Link recuperação |

**Resultado ANTES:** Frustração, sem saída clara  
**Resultado DEPOIS:** Mais chances + alternativa (recuperar senha)

---

### **Cenário: Atacante Tentando Bloquear Vítima**

| Ação | ANTES (Atual) | DEPOIS (Proposto) |
|------|---------------|-------------------|
| Atacante tenta 5x | ✅ Consegue bloquear | ✅ Consegue bloquear |
| Vítima tenta entrar | ❌ Bloqueada 15min | ⚠️ Exige CAPTCHA |
| Vítima digita senha correta | ❌ Ainda bloqueada | ✅ Entra com CAPTCHA! |
| Vítima clica "Esqueci senha" | ✅ Funciona | ✅ Funciona (sem rate limit) |
| Vítima recebe email | ❌ Não recebe aviso | ✅ Recebe aviso de ataque |

**Resultado ANTES:** DoS efetivo contra vítima  
**Resultado DEPOIS:** Vítima consegue acessar conta

---

## 🔧 **Implementação Recomendada**

### **Passo 1: Rate Limit Duplo (IP + CPF)**

```javascript
// api/dist-api/src/routes/authRoutes.js

const createDualRateLimit = (options) => {
  const ipLimiter = rateLimit({
    windowMs: options.windowMs,
    max: options.maxPerIP,
    keyGenerator: (req) => req.ip,
    skip: (req) => isWhitelistedIP(req.ip)
  })
  
  const cpfLimiter = rateLimit({
    windowMs: options.windowMs,
    max: options.maxPerCPF,
    keyGenerator: (req) => req.body.cpf || req.body.email,
    skip: (req) => !req.body.cpf && !req.body.email
  })
  
  return [ipLimiter, cpfLimiter]
}

// Uso:
const loginLimiters = createDualRateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  maxPerIP: 50,  // 50 tentativas por IP
  maxPerCPF: 10  // 10 tentativas por CPF
})

router.post('/auth/login-cpf', ...loginLimiters, loginHandler)
```

### **Passo 2: Mensagens Vagas**

```javascript
// Substituir mensagens específicas por vagas
const rateLimitMessages = {
  login: 'Por segurança, bloqueamos temporariamente o acesso. Tente novamente mais tarde ou recupere sua senha.',
  register: 'Muitas tentativas de cadastro. Aguarde alguns minutos ou entre em contato com o suporte.',
  cpfCheck: 'Você está consultando com muita frequência. Aguarde alguns instantes.',
  otp: 'Muitas tentativas de verificação. Solicite um novo código.'
}
```

### **Passo 3: Contador com Avisos**

```javascript
// Frontend: tools-website-builder/src/composables/useAuth.js

const MAX_ATTEMPTS_WARNING = 5
let attemptCount = ref(0)

async function signIn(identifier, password) {
  attemptCount.value++
  
  try {
    const response = await api.auth.login({ identifier, password })
    
    if (!response.success) {
      const remaining = MAX_ATTEMPTS_WARNING - attemptCount.value
      
      if (remaining > 0 && remaining <= 3) {
        return {
          success: false,
          message: `Senha incorreta. Restam ${remaining} tentativas.`,
          showRecovery: true // ✅ Mostrar link "Esqueci senha"
        }
      }
    }
  } catch (error) {
    // ...
  }
}
```

### **Passo 4: Link de Recuperação Sempre Visível**

```vue
<!-- AuthNew.vue -->
<div v-if="mode === 'login'">
  <input v-model="loginPassword" type="password" />
  
  <!-- ✅ SEMPRE mostrar opção de recuperação -->
  <div class="mt-2 text-right">
    <router-link 
      to="/recuperar-senha" 
      class="text-sm text-indigo-400 hover:underline"
    >
      Esqueci minha senha
    </router-link>
  </div>
  
  <!-- ⚠️ Aviso se muitas tentativas -->
  <div v-if="attemptCount >= 5" class="mt-3 p-3 bg-yellow-900/30 rounded-lg border border-yellow-700/50">
    <p class="text-sm text-yellow-200">
      ⚠️ Muitas tentativas incorretas. 
      <a href="/recuperar-senha" class="underline font-semibold">
        Clique aqui para recuperar sua senha
      </a>
    </p>
  </div>
  
  <button type="submit">Entrar</button>
</div>
```

---

## 📈 **Métricas para Monitorar**

```javascript
// Tracking para ajustar limites dinamicamente

const metrics = {
  // Taxa de bloqueio de usuários legítimos
  falsePositiveRate: {
    current: 0.15, // 15% dos bloqueios são usuários legítimos
    target: 0.05,  // Meta: reduzir para 5%
  },
  
  // Taxa de bloqueio de atacantes
  truePositiveRate: {
    current: 0.85, // 85% dos bloqueios são atacantes
    target: 0.95,  // Meta: aumentar para 95%
  },
  
  // Tempo médio até recuperação
  avgRecoveryTime: {
    current: '8 minutos',
    target: '2 minutos' // Com melhor UX
  },
  
  // Taxa de uso de "Esqueci senha"
  passwordResetRate: {
    current: 0.02, // 2% usam após bloqueio
    target: 0.10   // Meta: 10% sabem usar recurso
  }
}
```

---

## ✅ **Checklist de Implementação**

### **Fase 1: Melhorias Imediatas** (1-2 horas)
- [ ] Aumentar limites de tentativas (5→10 para login)
- [ ] Reduzir janela de tempo (15min→10min)
- [ ] Mudar mensagens para vagas
- [ ] Adicionar link "Esqueci senha" sempre visível
- [ ] Mostrar contador de tentativas restantes

### **Fase 2: Melhorias Médias** (1 dia)
- [ ] Implementar rate limit duplo (IP + CPF)
- [ ] Adicionar whitelist de IPs confiáveis
- [ ] Criar endpoint de recuperação sem rate limit
- [ ] Implementar notificação por email de tentativas suspeitas

### **Fase 3: Melhorias Avançadas** (1 semana)
- [ ] Implementar CAPTCHA adaptativo
- [ ] Rate limit progressivo
- [ ] Dashboard de segurança para usuário
- [ ] Sistema de reputação de IPs
- [ ] Machine learning para detectar padrões

---

## 🎯 **Recomendação Final**

### **Configuração Balanceada Proposta:**

```javascript
const RATE_LIMITS = {
  login: {
    maxPerIP: 50,      // 50 tentativas por IP em 10min
    maxPerCPF: 10,     // 10 tentativas por CPF em 10min
    windowMs: 10 * 60 * 1000,
    message: 'Por segurança, bloqueamos temporariamente o acesso. Recupere sua senha ou aguarde alguns minutos.',
    skipSuccessfulRequests: true, // ✅ Zera contador em sucesso
  },
  
  cpfCheck: {
    max: 20,
    windowMs: 10 * 60 * 1000,
    message: 'Muitas consultas. Aguarde alguns instantes.'
  },
  
  register: {
    maxPerIP: 10,
    maxPerCPF: 5,
    windowMs: 30 * 60 * 1000, // 30 minutos
    message: 'Muitas tentativas de cadastro. Aguarde ou entre em contato com suporte.'
  },
  
  otpVerify: {
    max: 10,
    windowMs: 20 * 60 * 1000,
    message: 'Muitas tentativas. Solicite um novo código.'
  },
  
  otpResend: {
    max: 5,
    windowMs: 15 * 60 * 1000,
    message: 'Já enviamos vários códigos. Verifique sua caixa de entrada.'
  }
}
```

---

**Próxima ação:** Implementar Fase 1 (melhorias imediatas)?

