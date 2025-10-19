# 🧪 GUIA DE TESTE - FASE 1: AUTENTICAÇÃO

## 📋 PRÉ-REQUISITOS

### 1. Executar SQL no Supabase
1. Acesse: https://mpanel.samm.host/project/_/sql/new
2. Copie todo o conteúdo de `database/schema.sql`
3. Execute no SQL Editor
4. Verifique se as tabelas foram criadas na aba "Table Editor"

### 2. Instalar Dependências
```bash
cd api
npm install @supabase/supabase-js cookie-parser
```

### 3. Configurar .env
Verifique se o arquivo `api/.env` tem todas as variáveis:
- ✅ SUPABASE_URL
- ✅ SUPABASE_ANON_KEY
- ⚠️ SUPABASE_SERVICE_ROLE_KEY (obter no Supabase)
- ✅ JWT_SECRET (gerar novo)
- ✅ SESSION_SECRET (gerar novo)

**Obter SERVICE_ROLE_KEY:**
1. Acesse: https://mpanel.samm.host/project/_/settings/api
2. Copie "service_role" (secret)
3. Cole no .env

**Gerar secrets:**
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 4. Iniciar Servidor
```bash
cd api
npm start
```

Deve aparecer:
```
🚀 Servidor rodando na porta 3000
📍 Acesse: http://localhost:3000
```

---

## 🧪 TESTES COM POSTMAN/INSOMNIA

### Criar Nova Collection
Nome: **AJI - Autenticação**

---

### 1️⃣ CHECK CPF (Verificar se CPF existe)

**Método:** POST  
**URL:** `http://localhost:3000/api/auth/check-cpf`  
**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "cpf": "123.456.789-09"
}
```

**Resposta Esperada (CPF não existe):**
```json
{
  "success": true,
  "message": "Operação realizada com sucesso",
  "data": {
    "exists": false,
    "cpf": "12345678909"
  }
}
```

---

### 2️⃣ REGISTER (Cadastrar novo usuário)

**Método:** POST  
**URL:** `http://localhost:3000/api/auth/register`  
**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "cpf": "123.456.789-09",
  "email": "teste@example.com",
  "password": "Senha@123",
  "full_name": "João da Silva Teste"
}
```

**Resposta Esperada:**
```json
{
  "success": true,
  "message": "Usuário criado com sucesso! Bem-vindo à AJI.",
  "data": {
    "user": {
      "id": "uuid-aqui",
      "email": "teste@example.com",
      "full_name": "João da Silva Teste",
      "referral_code": "A1B2C3D4"
    },
    "points_earned": 10,
    "referral_bonus_given": false
  }
}
```

---

### 3️⃣ LOGIN (Fazer login)

**Método:** POST  
**URL:** `http://localhost:3000/api/auth/login`  
**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "teste@example.com",
  "password": "Senha@123"
}
```

**Resposta Esperada:**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": {
      "id": "uuid-aqui",
      "email": "teste@example.com"
    },
    "profile": {
      "id": "uuid-aqui",
      "cpf": "12345678909",
      "full_name": "João da Silva Teste",
      "referral_code": "A1B2C3D4",
      "referred_by": null
    },
    "points": {
      "user_id": "uuid-aqui",
      "free_points": 10,
      "paid_points": 0,
      "free_points_limit": 100,
      "total_earned": 10,
      "total_purchased": 0,
      "total_spent": 0
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**⚠️ IMPORTANTE:** Copie o `token` para usar nos próximos testes!

---

### 4️⃣ GET SESSION (Verificar sessão)

**Método:** GET  
**URL:** `http://localhost:3000/api/auth/session`  
**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Resposta Esperada:**
```json
{
  "success": true,
  "message": "Operação realizada com sucesso",
  "data": {
    "authenticated": true,
    "user": {
      "id": "uuid-aqui",
      "email": "teste@example.com"
    },
    "profile": { ... },
    "points": { ... }
  }
}
```

---

### 5️⃣ LOGOUT (Fazer logout)

**Método:** POST  
**URL:** `http://localhost:3000/api/auth/logout`  
**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Resposta Esperada:**
```json
{
  "success": true,
  "message": "Logout realizado com sucesso",
  "data": null
}
```

---

### 6️⃣ REGISTER COM CÓDIGO DE REFERÊNCIA

**Método:** POST  
**URL:** `http://localhost:3000/api/auth/register`  
**Body (JSON):**
```json
{
  "cpf": "987.654.321-00",
  "email": "teste2@example.com",
  "password": "Senha@456",
  "full_name": "Maria dos Santos",
  "referral_code": "A1B2C3D4"
}
```

**Resposta Esperada:**
```json
{
  "success": true,
  "message": "Usuário criado com sucesso! Bem-vindo à AJI.",
  "data": {
    "user": { ... },
    "points_earned": 10,
    "referral_bonus_given": true
  }
}
```

**Verificar:**
- Novo usuário ganha 10 pontos
- Usuário que indicou ganha 5 pontos (verificar no banco)

---

## ✅ CHECKLIST DE TESTES

- [ ] ✅ CHECK CPF - CPF não existe
- [ ] ✅ CHECK CPF - CPF inválido (deve dar erro)
- [ ] ✅ REGISTER - Cadastro com sucesso
- [ ] ❌ REGISTER - CPF duplicado (deve dar erro)
- [ ] ❌ REGISTER - Email duplicado (deve dar erro Supabase)
- [ ] ❌ REGISTER - Senha fraca (deve dar erro)
- [ ] ✅ REGISTER - Com código de referência válido
- [ ] ❌ REGISTER - Com código de referência inválido
- [ ] ✅ LOGIN - Com credenciais corretas
- [ ] ❌ LOGIN - Com senha errada (deve dar erro 401)
- [ ] ✅ GET SESSION - Com token válido
- [ ] ❌ GET SESSION - Sem token (authenticated: false)
- [ ] ✅ LOGOUT - Com sucesso

---

## 🔍 VERIFICAÇÕES NO SUPABASE

### Tabela: profiles
1. Acesse: https://mpanel.samm.host/project/_/editor
2. Abra tabela `profiles`
3. Verifique:
   - CPF está salvo sem formatação
   - `referral_code` é único
   - `referred_by` aponta para quem indicou

### Tabela: user_points
1. Abra tabela `user_points`
2. Verifique:
   - `free_points` = 10 (cadastro novo)
   - `free_points` = 15 (se indicou alguém: 10 + 5)
   - `free_points_limit` = 100
   - `total_earned` bate com pontos gratuitos

### Tabela: point_transactions
1. Abra tabela `point_transactions`
2. Verifique:
   - Registro com `type` = 'signup_bonus'
   - Registro com `type` = 'referral_bonus' (se indicou)
   - `amount` positivo
   - `balance_before` e `balance_after` corretos

---

## 🐛 TROUBLESHOOTING

### Erro: "SUPABASE_SERVICE_ROLE_KEY não configurada"
- Configure a variável no `.env`
- Obtenha em: https://mpanel.samm.host/project/_/settings/api

### Erro: "Token inválido ou expirado"
- Faça login novamente
- Copie o novo token
- Use `Authorization: Bearer TOKEN`

### Erro: "CPF já cadastrado"
- Use outro CPF
- Ou delete o registro no Supabase (Table Editor)

### Erro: "relation 'profiles' does not exist"
- Execute o SQL completo no Supabase
- Verifique se as tabelas foram criadas

### Erro: "CORS"
- Verifique se o frontend está na lista de origens permitidas
- Adicione em `server.js` se necessário

---

## 📊 PRÓXIMOS PASSOS

Após todos os testes passarem:
1. ✅ Módulo Auth funcionando
2. 🔄 Partir para Fase 2: Módulo de Pontos
3. 🔄 Fase 3: Módulo de Indicações (Referral)
4. 🔄 Fase 4: Integração com Frontend

---

**Testou tudo e funcionou? Avise para prosseguirmos! 🚀**
