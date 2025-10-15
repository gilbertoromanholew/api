# 📚 API - Organizada por Funcionalidades

## 🎯 Estrutura Atual (Limpa e Organizada)

```
api/
├── server.js                    # Arquivo principal
├── package.json                 # Dependências
├── .env                         # Configurações
├── README.md                    # Esta documentação
│
└── src/
    ├── config/                  # Configurações
    │   ├── index.js
    │   └── allowedIPs.js
    │
    ├── middlewares/             # Middlewares
    │   └── ipFilter.js
    │
    ├── routes/                  # Rota raiz
    │   └── index.js
    │
    ├── utils/                   # Utilitários
    │   └── pdfParseWrapper.cjs
    │
    └── funcionalidades/         # ⭐ FUNCIONALIDADES
        │
        ├── validacao/           # POST /validate-cpf
        │   ├── README.md
        │   ├── cpfValidator.js
        │   ├── cpfController.js
        │   └── cpfRoutes.js
        │
        ├── pdf/                 # POST /read-pdf
        │   ├── README.md
        │   ├── pdfController.js
        │   └── pdfRoutes.js
        │
        ├── calculo/             # POST /calcular
        │   ├── README.md
        │   ├── calculoUtils.js
        │   ├── calculoController.js
        │   └── calculoRoutes.js
        │
        └── extras/              # Futuras funcionalidades
            └── README.md
```

---

## 🚀 Funcionalidades Disponíveis

### 1. Validação de CPF
**POST /validate-cpf**
```bash
curl -X POST http://localhost:3000/validate-cpf \
  -H "Content-Type: application/json" \
  -d '{"cpf": "12345678901"}'
```

### 2. Leitura de PDF
**POST /read-pdf**
```bash
curl -X POST http://localhost:3000/read-pdf \
  -F "pdf=@arquivo.pdf"
```

### 3. Cálculo Matemático
**POST /calcular**
```bash
curl -X POST http://localhost:3000/calcular \
  -H "Content-Type: application/json" \
  -d '{"operacao": "somar", "a": 10, "b": 5"}'
```

Operações: somar, subtrair, multiplicar, dividir, porcentagem

---

## ➕ Adicionar Nova Funcionalidade

### 1. Criar pasta:
```bash
mkdir src/funcionalidades/nome-funcionalidade
```

### 2. Criar arquivos:
- `README.md` - Documentação
- `nomeController.js` - Lógica
- `nomeRoutes.js` - Rotas
- `nomeUtils.js` - Funções auxiliares (opcional)

### 3. Registrar em server.js:
```javascript
import nomeRoutes from './src/funcionalidades/nome-funcionalidade/nomeRoutes.js';
app.use(nomeRoutes);
```

### 4. Atualizar src/routes/index.js

---

## 🔧 Instalação

```bash
npm install
npm start
```

Acesse: http://localhost:3000

---

## 🛡️ Segurança

- Filtro de IP ativo
- Configure IPs autorizados no .env
- Código backend nunca exposto ao cliente

---

## 📝 Documentação

Cada funcionalidade tem seu próprio README.md:
- `src/funcionalidades/validacao/README.md`
- `src/funcionalidades/pdf/README.md`
- `src/funcionalidades/calculo/README.md`

---

**Versão**: 2.0  
**Status**: ✅ Funcionando
