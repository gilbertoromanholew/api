# 💰 Módulo de Pontos

Sistema completo de gerenciamento de pontos (gratuitos e pagos).

## Endpoints

### GET /api/points/balance
Retorna o saldo atual de pontos do usuário.

**Autenticação:** Obrigatória

**Response:**
```json
{
  "success": true,
  "data": {
    "free_points": 10,
    "paid_points": 0,
    "total_points": 10,
    "free_points_limit": 100,
    "total_earned": 10,
    "total_purchased": 0,
    "total_spent": 0
  }
}
```

### GET /api/points/history
Retorna o histórico de transações de pontos.

**Autenticação:** Obrigatória

**Query Params:**
- `type` (opcional): Filtrar por tipo (signup_bonus, referral_bonus, purchase, tool_usage, etc)
- `limit` (opcional): Quantidade de registros (padrão: 50, máximo: 100)
- `offset` (opcional): Paginação (padrão: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "type": "signup_bonus",
        "point_type": "free",
        "amount": 10,
        "balance_before": 0,
        "balance_after": 10,
        "description": "Bônus de boas-vindas",
        "created_at": "2025-01-18T10:00:00Z"
      }
    ],
    "total": 1,
    "limit": 50,
    "offset": 0
  }
}
```

### POST /api/points/consume
Consome pontos para usar uma ferramenta.

**Autenticação:** Obrigatória

**Body:**
```json
{
  "tool_name": "calculo_rescisao",
  "description": "Cálculo de rescisão trabalhista"
}
```

**Response:**
```json
{
  "success": true,
  "message": "5 pontos consumidos com sucesso",
  "data": {
    "points_used": 5,
    "previous_balance": 10,
    "new_balance": 5,
    "transaction_id": "uuid"
  }
}
```

### GET /api/points/can-use/:tool_name
Verifica se o usuário tem pontos suficientes para usar uma ferramenta.

**Autenticação:** Obrigatória

**Response:**
```json
{
  "success": true,
  "data": {
    "can_use": true,
    "tool_cost": 5,
    "current_balance": 10,
    "missing_points": 0
  }
}
```

## Regras de Negócio

### Consumo de Pontos (Ordem)
1. **Prioridade:** Consome pontos gratuitos primeiro
2. **Se gratuitos acabarem:** Consome pontos pagos
3. **Se ambos acabarem:** Retorna erro

### Limite de Pontos Gratuitos
- Pontos gratuitos têm limite máximo (padrão: 100)
- Ao atingir o limite, não é possível ganhar mais pontos gratuitos
- Pontos pagos não têm limite

### Tipos de Transação
- `signup_bonus` - Bônus de cadastro
- `referral_bonus` - Bônus por indicação
- `purchase` - Compra de pontos (Stripe)
- `tool_usage` - Uso de ferramenta
- `admin_adjustment` - Ajuste manual (admin)
- `refund` - Reembolso
