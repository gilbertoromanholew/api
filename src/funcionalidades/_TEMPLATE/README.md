# 🎯 Template de Funcionalidade

## 📘 Como criar uma nova funcionalidade:

### 1️⃣ Copie esta pasta
```bash
# Windows (PowerShell)
Copy-Item -Path "src/funcionalidades/_TEMPLATE" -Destination "src/funcionalidades/minhaFuncionalidade" -Recurse

# Linux/Mac
cp -r src/funcionalidades/_TEMPLATE src/funcionalidades/minhaFuncionalidade
```

### 2️⃣ Estrutura de arquivos:
```
minhaFuncionalidade/
├── README.md           # Documentação da funcionalidade
├── nomeController.js   # Lógica de negócio (obrigatório)
├── nomeRoutes.js       # Definição de rotas (obrigatório)
├── nomeUtils.js        # Funções auxiliares (opcional)
└── nomeValidator.js    # Validações específicas (opcional)
```

### 3️⃣ Renomeie os arquivos:
- `templateController.js` → `suaFuncionalidadeController.js`
- `templateRoutes.js` → `suaFuncionalidadeRoutes.js`

### 4️⃣ Edite os arquivos:
- Implemente sua lógica no **Controller**
- Defina suas rotas no **Routes**
- Adicione validações personalizadas se necessário

### 5️⃣ Reinicie o servidor:
```bash
npm start
```

**✨ Pronto! O sistema carregará automaticamente sua funcionalidade!**

---

## 📝 Convenções e Boas Práticas

### ✅ DO (Faça):
- Use a classe `BaseController` para respostas padronizadas
- Adicione validação com `validate(schema)` nas rotas
- Use `async/await` para operações assíncronas
- Documente seu código com comentários JSDoc
- Mantenha controllers enxutos (lógica no Utils)
- Use nomes descritivos para funções e variáveis

### ❌ DON'T (Não faça):
- Não faça tratamento de erro manual (BaseController faz isso)
- Não valide parâmetros no controller (use validator middleware)
- Não acesse `req.body` sem validação
- Não retorne `res.status().json()` manualmente (use `this.success()` / `this.error()`)
- Não repita código (crie funções auxiliares no Utils)

---

## 🎓 Exemplos

### Exemplo 1: Funcionalidade Simples (Echo)
```javascript
// echoController.js
import { BaseController } from '../../core/BaseController.js';

class EchoController extends BaseController {
    async echo(req, res) {
        return this.execute(req, res, async (req, res) => {
            const { message } = req.body;
            this.success(res, { echo: message }, 'Mensagem ecoada');
        });
    }
}

export const echoController = new EchoController();
export const echo = (req, res) => echoController.echo(req, res);
```

```javascript
// echoRoutes.js
import express from 'express';
import { echo } from './echoController.js';
import { validate } from '../../middlewares/validator.js';

const router = express.Router();

const echoSchema = {
    required: ['message'],
    types: { message: 'string' }
};

router.post('/echo', validate(echoSchema), echo);

export default router;
```

### Exemplo 2: Funcionalidade com Dependência Externa
```javascript
// qrcodeController.js
import { BaseController } from '../../core/BaseController.js';
import QRCode from 'qrcode';

class QRCodeController extends BaseController {
    async generate(req, res) {
        return this.execute(req, res, async (req, res) => {
            const { text } = req.body;
            const qrCode = await QRCode.toDataURL(text);
            
            this.success(res, { qrCode }, 'QR Code gerado');
        });
    }
}

export const qrcodeController = new QRCodeController();
export const generate = (req, res) => qrcodeController.generate(req, res);
```

---

## 🔧 Schemas de Validação

### Estrutura do Schema:
```javascript
const schema = {
    // Campos obrigatórios
    required: ['campo1', 'campo2'],
    
    // Tipos de dados
    types: {
        campo1: 'string',  // 'string', 'number', 'boolean', 'array'
        campo2: 'number'
    },
    
    // Valores permitidos (enum)
    enum: {
        campo1: ['valor1', 'valor2', 'valor3']
    },
    
    // Tamanho min/max
    length: {
        campo1: { min: 3, max: 100 }
    }
};
```

---

## 🚀 Próximos Passos

1. **Instale dependências** (se necessário):
   ```bash
   npm install nome-da-lib
   ```

2. **Teste sua funcionalidade**:
   ```bash
   curl -X POST http://localhost:3000/sua-rota \
     -H "Content-Type: application/json" \
     -d '{"parametro": "valor"}'
   ```

3. **Documente no README principal** da API

4. **Adicione testes** (futuro)

---

## 📚 Referências

- [Express.js Docs](https://expressjs.com/)
- [JavaScript Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [REST API Best Practices](https://restfulapi.net/)

---

**Dúvidas? Consulte os controllers existentes em:**
- `src/funcionalidades/validacao/`
- `src/funcionalidades/pdf/`
- `src/funcionalidades/calculo/`
