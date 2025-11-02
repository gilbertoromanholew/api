# 🧪 Testes da API

Esta pasta contém scripts de teste e debug para o backend.

## 📁 Estrutura

```
tests/
├── test-admin-endpoints.js          - Testes de endpoints admin
├── test-backend-fase2.js            - Testes da fase 2 do backend
├── test-logs-docs-endpoints.js      - Testes de logs e documentação
├── test-rate-limiting.js            - Testes de rate limiting
├── test-rate-limiting.ps1           - Script PowerShell para rate limiting
├── test-refatoracao-backend.js      - Testes da refatoração
├── debug-logs-endpoint.js           - Debug de endpoint de logs
└── test-audit-log.js                - Testes de auditoria
```

## 🚀 Como Executar

### Testes Node.js

```bash
# Executar um teste específico
node tests/test-admin-endpoints.js

# Com nodemon (auto-reload)
npx nodemon tests/test-admin-endpoints.js
```

### Script PowerShell

```powershell
# Executar teste de rate limiting
.\tests\test-rate-limiting.ps1
```

## ⚙️ Configuração

Antes de executar os testes, certifique-se de:

1. ✅ Servidor backend rodando (`npm start`)
2. ✅ Variáveis de ambiente configuradas (`.env`)
3. ✅ Banco de dados acessível
4. ✅ Credenciais de teste válidas

## 📝 Convenções

- `test-*.js` - Testes funcionais
- `debug-*.js` - Scripts de debug
- `*.ps1` - Scripts PowerShell auxiliares

## ⚠️ Importante

- ❌ Não execute em produção
- ✅ Use apenas em desenvolvimento
- 🔒 Não commite credenciais reais

---
*Organizado em: 02/11/2025*
