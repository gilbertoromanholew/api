# 🔒 Migration 004: Device Lock para OTP Multi-Dispositivo

## ⚠️ PROBLEMA RESOLVIDO

**Cenário**: Usuário com 2 dispositivos (A e B) tentando verificar código OTP para mesmo CPF simultaneamente.

**Risco**: Ambos dispositivos podem apertar "reenviar código", gerando confusão sobre qual código é válido.

**Solução**: Sistema de lock por dispositivo - primeiro dispositivo que solicitar OTP ganha lock exclusivo por 3 minutos.

---

## 📋 MUDANÇAS IMPLEMENTADAS

### 1. **Backend** (API)

#### ✅ Migration 004 - SQL
- **Arquivo**: `migrations/004_otp_device_lock.sql`
- **Alterações**:
  - Adiciona coluna `device_token TEXT` na tabela `otp_codes`
  - Cria função `generate_device_token()` - gera token único `DEV_timestamp_hash`
  - Cria função `check_otp_device_lock()` - verifica se outro dispositivo tem lock ativo
  - Adiciona índice para performance: `idx_otp_codes_device_token`

#### ✅ Endpoint `/auth/resend-otp`
- **Arquivo**: `src/routes/authRoutes.js`
- **Mudanças**:
  1. Aceita novo parâmetro: `deviceToken` no body
  2. Chama `check_otp_device_lock(user_id, device_token)` ANTES de gerar novo OTP
  3. Se outro dispositivo tem lock ativo → Retorna **409 Conflict** com mensagem:
     ```json
     {
       "success": false,
       "error": "Verificação em andamento",
       "message": "Outro dispositivo está verificando este código...",
       "waitMinutes": 2,
       "code": "DEVICE_LOCK_ACTIVE"
     }
     ```
  4. Se pode prosseguir → Insere OTP com `device_token`
  5. Retorna `deviceToken` na resposta para frontend armazenar

---

### 2. **Frontend** (Vue.js)

#### ✅ OTPVerificationModal.vue
- **Mudanças**:
  - Gera `deviceToken` no `onMounted()` (formato: `DEV_timestamp_random`)
  - Armazena em `sessionStorage.getItem('otp_device_token')` (persiste só enquanto aba aberta)
  - Envia `deviceToken` em todas chamadas `/auth/resend-otp`
  - Trata status **409 Conflict**:
    - Exibe toast com mensagem de espera
    - Duração do toast = tempo de espera (waitMinutes)
  - Atualiza `deviceToken` se backend retornar novo token

#### ✅ RecuperarSenhaModal.vue
- **Mudanças**: Mesma lógica acima
- **Token Storage**: `sessionStorage.getItem('otp_device_token_recovery')` (chave diferente para não conflitar)

---

## 🚀 COMO EXECUTAR

### Passo 1: Executar Migration no Supabase

1. Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
2. Copie TUDO do arquivo `migrations/004_otp_device_lock.sql`
3. Cole no SQL Editor
4. Clique em **"Run"**
5. Verifique sucesso: deve aparecer `"MIGRATION 004 CONCLUÍDA COM SUCESSO"`

### Passo 2: Verificar Migration

```sql
-- Verificar coluna adicionada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'otp_codes' AND column_name = 'device_token';

-- Verificar funções criadas
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('generate_device_token', 'check_otp_device_lock');

-- Verificar índice
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'otp_codes' AND indexname = 'idx_otp_codes_device_token';
```

### Passo 3: Testar (após deploy do código)

**Cenário de Teste Multi-Dispositivo:**

1. **Dispositivo A** (Chrome normal):
   - Abra `localhost:5173`
   - Registre conta com CPF `111.111.111-11`
   - Modal de OTP abre
   - Clique "Reenviar Código" → ✅ **Deve funcionar**

2. **Dispositivo B** (Chrome Incognito):
   - Abra `localhost:5173`
   - Faça login (email não confirmado cai no OTP)
   - Ou tente recuperar senha com mesmo CPF
   - Clique "Reenviar Código" → ⚠️ **Deve bloquear com mensagem:**
     > "Verificação em andamento em outro dispositivo. Aguarde a expiração ou use o dispositivo original."

3. **Aguarde 3 minutos**:
   - **Dispositivo B** clica "Reenviar Código" novamente → ✅ **Agora deve funcionar**

4. **Verifique no Banco**:
   ```sql
   SELECT user_id, email, code, device_token, expires_at 
   FROM otp_codes 
   WHERE email = 'email@teste.com' 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```
   - Deve ver `device_token` preenchido (ex: `DEV_1738373929_a1b2c3d4`)

---

## 🔍 FLUXO DETALHADO

### Quando Funciona Normal (1 Dispositivo)

```
1. User abre modal OTP
   └─> Frontend gera deviceToken: "DEV_1738373929_abc123"
   └─> Armazena em sessionStorage

2. User clica "Reenviar Código"
   └─> POST /auth/resend-otp { cpf, deviceToken }
   
3. Backend checa lock:
   └─> check_otp_device_lock(user_id, deviceToken)
   └─> Resultado: can_proceed = true (sem lock ativo)
   
4. Backend gera novo OTP:
   └─> INSERT INTO otp_codes (code, device_token, expires_at)
   
5. Frontend recebe success:
   └─> Toast: "Código enviado para seu email"
```

### Quando Bloqueia (2 Dispositivos)

```
1. Dispositivo A já tem lock ativo:
   └─> OTP inserido às 14:30 com device_token = "DEV_A"
   └─> expires_at = 14:33 (3 minutos)

2. Dispositivo B tenta reenviar (14:31):
   └─> POST /auth/resend-otp { cpf, deviceToken: "DEV_B" }
   
3. Backend checa lock:
   └─> check_otp_device_lock(user_id, "DEV_B")
   └─> Resultado:
       is_locked = true
       locked_by_device = "DEV_A"
       can_proceed = false
       expires_at = 14:33
   
4. Backend retorna 409 Conflict:
   └─> { error: "Verificação em andamento", waitMinutes: 2 }
   
5. Frontend trata erro:
   └─> Toast de 2 minutos: "Outro dispositivo está verificando..."
   └─> Botão "Reenviar" continua disponível após cooldown

6. Após 14:33 (expiração):
   └─> Dispositivo B tenta novamente → can_proceed = true ✅
```

---

## 📊 IMPACTO

### Segurança
- ✅ Previne confusão com múltiplos códigos
- ✅ Reduz surface de ataque (limita 1 device por vez)
- ✅ Lock automático expira com OTP (3 min)

### UX
- ✅ Mensagem clara quando bloqueado
- ✅ Indica tempo de espera (waitMinutes)
- ✅ Toast com duração = tempo de espera
- ⚠️ Possível frustração se user não entender (mitigado com mensagens claras)

### Performance
- ✅ Índice otimiza query de lock check
- ✅ RPC functions executam no Postgres (rápido)
- ⚠️ 1 query adicional por reenvio (aceitável)

---

## 🔧 TROUBLESHOOTING

### Erro: "function check_otp_device_lock does not exist"
- **Causa**: Migration não executada
- **Solução**: Execute migration no Supabase SQL Editor

### Toast não aparece ao tentar em 2 dispositivos
- **Causa**: Frontend não tratando status 409
- **Solução**: Verifique console browser → deve logar erro 409

### Lock nunca expira
- **Causa**: Timezone incorreto no Postgres
- **Solução**: Migration usa `CURRENT_TIMESTAMP` (UTC) → Ajustar lógica se necessário

### Device token não está sendo salvo
- **Causa**: sessionStorage pode ser bloqueado (privacy mode)
- **Solução**: Código tem fallback → gera novo token a cada request (menos eficiente mas funciona)

---

## 📝 NOTAS TÉCNICAS

### Por que `sessionStorage` e não `localStorage`?
- `sessionStorage`: Persiste só enquanto aba aberta (mais seguro)
- `localStorage`: Persistiria entre sessões (poderia causar lock "fantasma")

### Por que 409 Conflict e não 423 Locked?
- 409: "Resource conflict" → Mais semântico para multi-device
- 423: "Resource locked" → Geralmente para locks de edição

### Por que não usar mutex/redis?
- Postgres RPC já fornece serialização adequada
- Índice otimiza performance
- Sem dependência externa (simplicidade)

---

## ✅ CHECKLIST DE CONCLUSÃO

- [x] Migration 004 criada
- [x] Backend `/auth/resend-otp` modificado
- [x] Frontend `OTPVerificationModal.vue` atualizado
- [x] Frontend `RecuperarSenhaModal.vue` atualizado
- [ ] **Migration 004 EXECUTADA no Supabase** ⬅️ **VOCÊ PRECISA FAZER ISSO**
- [ ] Testado cenário multi-dispositivo
- [ ] Verificado logs do banco (device_token preenchido)

---

**Próximo Passo**: Execute a migration no Supabase Dashboard! 🚀
