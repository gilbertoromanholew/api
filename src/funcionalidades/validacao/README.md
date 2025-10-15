# ✅ Funcionalidade: Validação

## Descrição
Valida documentos brasileiros (atualmente apenas CPF).

## Endpoint
**POST /validate-cpf**

## Como usar
Envie um JSON com o CPF a ser validado.

### Exemplo:
```bash
curl -X POST http://localhost:3000/validate-cpf \
  -H "Content-Type: application/json" \
  -d '{"cpf": "12345678901"}'
```

### Resposta (CPF válido):
```json
{
  "valid": true,
  "message": "CPF válido."
}
```

### Resposta (CPF inválido):
```json
{
  "valid": false,
  "message": "CPF inválido."
}
```

### Resposta (CPF não fornecido):
```json
{
  "valid": false,
  "message": "CPF não fornecido."
}
```

## Arquivos:
- `cpfValidator.js` - Função de validação
- `cpfController.js` - Lógica do endpoint
- `cpfRoutes.js` - Rota do endpoint

## Futuras validações:
- CNPJ
- Email
- Telefone
- CEP
