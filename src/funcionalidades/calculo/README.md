# 🧮 Funcionalidade: Cálculo

## Descrição
Realiza operações matemáticas básicas.

## Endpoint
**POST /calcular**

## Como usar
Envie um JSON com a operação e os valores.

### Operações disponíveis:
- `somar` - Soma dois números
- `subtrair` - Subtrai dois números
- `multiplicar` - Multiplica dois números
- `dividir` - Divide dois números
- `porcentagem` - Calcula percentual de um valor

### Exemplo (soma):
```bash
curl -X POST http://localhost:3000/calcular \
  -H "Content-Type: application/json" \
  -d '{"operacao": "somar", "a": 10, "b": 5}'
```

### Resposta:
```json
{
  "success": true,
  "operacao": "somar",
  "a": 10,
  "b": 5,
  "resultado": 15
}
```

### Exemplo (porcentagem):
```bash
curl -X POST http://localhost:3000/calcular \
  -H "Content-Type: application/json" \
  -d '{"operacao": "porcentagem", "a": 200, "b": 15}'
```

### Resposta:
```json
{
  "success": true,
  "operacao": "porcentagem",
  "a": 200,
  "b": 15,
  "resultado": 30
}
```
(15% de 200 = 30)

### Resposta de erro:
```json
{
  "error": "Parâmetros necessários: operacao, a, b"
}
```

```json
{
  "error": "Operação inválida. Use: somar, subtrair, multiplicar, dividir, porcentagem"
}
```

## Arquivos:
- `calculoUtils.js` - Funções matemáticas
- `calculoController.js` - Lógica do endpoint
- `calculoRoutes.js` - Rota do endpoint

## Futuras operações:
- Potência
- Raiz quadrada
- Juros simples/compostos
- Conversão de moedas
