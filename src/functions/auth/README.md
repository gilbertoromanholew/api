# 🔐 Módulo de Autenticação

Sistema completo de autenticação integrado com Supabase.

## Endpoints

### POST /api/auth/check-cpf
Verifica se um CPF já está cadastrado no sistema.

**Request:**
```json
{
  "cpf": "123.456.789-00"
}
```

**Response:**
```json
{
  "success": true,
  "exists": false
}
```

### POST /api/auth/register
Cadastra um novo usuário no sistema.

**Request:**
```json
{
  "cpf": "123.456.789-00",
  "email": "usuario@email.com",
  "password": "Senha@123",
  "full_name": "João Silva",
  "referral_code": "ABC12345" // Opcional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Usuário criado com sucesso",
  "data": {
    "user": { ... },
    "points_earned": 10,
    "referral_bonus": 5
  }
}
```

### POST /api/auth/login
Autentica um usuário.

**Request:**
```json
{
  "email": "usuario@email.com",
  "password": "Senha@123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": { ... },
    "profile": { ... },
    "points": { ... }
  }
}
```

### POST /api/auth/logout
Finaliza a sessão do usuário.

**Response:**
```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

### GET /api/auth/session
Verifica se o usuário está autenticado.

**Response:**
```json
{
  "success": true,
  "data": {
    "authenticated": true,
    "user": { ... }
  }
}
```

## Validações

- CPF: Algoritmo oficial brasileiro
- Email: Formato válido + verificação de duplicidade
- Senha: 6-12 caracteres, maiúscula, minúscula, número, símbolo
- Código de referência: 8 caracteres alfanuméricos

## Sistema de Pontos

- **Cadastro:** 10 pontos gratuitos
- **Indicação:** 5 pontos para quem indicou + 5 para o novo usuário
