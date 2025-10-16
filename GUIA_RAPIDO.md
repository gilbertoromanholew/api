# 🚀 Guia Rápido - Nova Funcionalidade em 5 Minutos

## 📋 Checklist Rápido

### 1️⃣ Copiar Template (30 segundos)
```powershell
# Windows PowerShell
Copy-Item -Path "src/funcionalidades/_TEMPLATE" -Destination "src/funcionalidades/NOME_DA_SUA_FUNCIONALIDADE" -Recurse

# Exemplo: Criar funcionalidade de QR Code
Copy-Item -Path "src/funcionalidades/_TEMPLATE" -Destination "src/funcionalidades/qrcode" -Recurse
```

### 2️⃣ Renomear Arquivos (30 segundos)
```
ANTES:                          DEPOIS:
templateController.js    →      qrcodeController.js
templateRoutes.js        →      qrcodeRoutes.js
templateUtils.js         →      qrcodeUtils.js (opcional)
```

### 3️⃣ Editar Controller (2-3 minutos)
```javascript
// qrcodeController.js
import { BaseController } from '../../core/BaseController.js';
import QRCode from 'qrcode';

class QRCodeController extends BaseController {
    async generate(req, res) {
        return this.execute(req, res, async (req, res) => {
            const { text } = req.body;
            
            // SUA LÓGICA AQUI
            const qrCode = await QRCode.toDataURL(text);
            
            // Retornar sucesso
            this.success(res, { qrCode }, 'QR Code gerado com sucesso');
        });
    }
}

export const qrcodeController = new QRCodeController();
export const generate = (req, res) => qrcodeController.generate(req, res);
```

### 4️⃣ Editar Routes (1 minuto)
```javascript
// qrcodeRoutes.js
import express from 'express';
import { generate } from './qrcodeController.js';
import { validate } from '../../middlewares/validator.js';

const router = express.Router();

// Schema de validação
const qrcodeSchema = {
    required: ['text'],
    types: { text: 'string' },
    length: { text: { min: 1, max: 1000 } }
};

// Rota
router.post('/qrcode/generate', validate(qrcodeSchema), generate);

export default router;
```

### 5️⃣ Reiniciar Servidor (10 segundos)
```bash
# Parar servidor (Ctrl+C)
# Iniciar novamente
npm start
```

**✅ PRONTO! Funcionalidade criada e funcionando!**

---

## 📚 Referência Rápida

### BaseController - Métodos Disponíveis

```javascript
// Sucesso (200)
this.success(res, dados, 'mensagem');

// Erro (personalizado)
this.error(res, 'mensagem de erro', 400);

// Try-catch automático
this.execute(req, res, async (req, res) => {
    // seu código aqui
});
```

### Validator - Schemas

```javascript
const schema = {
    // Campos obrigatórios
    required: ['campo1', 'campo2'],
    
    // Tipos
    types: {
        campo1: 'string',   // string, number, boolean, array
        campo2: 'number'
    },
    
    // Valores permitidos
    enum: {
        campo1: ['opcao1', 'opcao2']
    },
    
    // Tamanho
    length: {
        campo1: { min: 3, max: 100 }
    }
};
```

### Rotas HTTP

```javascript
// GET
router.get('/rota', controller);

// POST
router.post('/rota', validate(schema), controller);

// PUT (atualizar completo)
router.put('/rota/:id', validate(schema), controller);

// PATCH (atualizar parcial)
router.patch('/rota/:id', validate(schema), controller);

// DELETE
router.delete('/rota/:id', controller);
```

---

## 🎯 Exemplos Prontos

### Exemplo 1: Echo Simples
```javascript
// echoController.js
import { BaseController } from '../../core/BaseController.js';

class EchoController extends BaseController {
    async echo(req, res) {
        return this.execute(req, res, async (req, res) => {
            const { message } = req.body;
            this.success(res, { echo: message });
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

### Exemplo 2: Buscar por ID
```javascript
// itemController.js
import { BaseController } from '../../core/BaseController.js';

class ItemController extends BaseController {
    async buscarPorId(req, res) {
        return this.execute(req, res, async (req, res) => {
            const { id } = req.params;  // Pega ID da URL
            
            // Buscar no banco (exemplo)
            const item = { id, nome: `Item ${id}` };
            
            this.success(res, item, 'Item encontrado');
        });
    }
}

export const itemController = new ItemController();
export const buscarPorId = (req, res) => itemController.buscarPorId(req, res);
```

```javascript
// itemRoutes.js
import express from 'express';
import { buscarPorId } from './itemController.js';

const router = express.Router();

router.get('/item/:id', buscarPorId);

export default router;
```

### Exemplo 3: Upload de Arquivo
```javascript
// uploadController.js
import { BaseController } from '../../core/BaseController.js';

class UploadController extends BaseController {
    async upload(req, res) {
        return this.execute(req, res, async (req, res) => {
            if (!req.file) {
                return this.error(res, 'Nenhum arquivo enviado', 400);
            }
            
            this.success(res, {
                filename: req.file.originalname,
                size: req.file.size,
                type: req.file.mimetype
            }, 'Arquivo enviado com sucesso');
        });
    }
}

export const uploadController = new UploadController();
export const upload = (req, res) => uploadController.upload(req, res);
```

```javascript
// uploadRoutes.js
import express from 'express';
import multer from 'multer';
import { upload } from './uploadController.js';

const router = express.Router();
const uploader = multer({ storage: multer.memoryStorage() });

router.post('/upload', uploader.single('file'), upload);

export default router;
```

---

## 🔧 Comandos Úteis

```bash
# Iniciar servidor
npm start

# Verificar erros
npm run lint

# Instalar dependência
npm install nome-da-lib

# Testar endpoint
curl -X POST http://localhost:3000/rota \
  -H "Content-Type: application/json" \
  -d '{"campo": "valor"}'
```

---

## ⚠️ Erros Comuns e Soluções

### ❌ Erro: "Cannot find module"
**Solução:** Verifique se exportou corretamente:
```javascript
export default router;  // ← Não esqueça isso!
```

### ❌ Erro: "Validação falhou"
**Solução:** Verifique se os campos obrigatórios estão sendo enviados:
```bash
# Correto
curl -d '{"campo": "valor"}'

# Errado (campo faltando)
curl -d '{}'
```

### ❌ Erro: "Rota não encontrada"
**Solução:** Verifique se:
1. O arquivo termina com `Routes.js`
2. Tem `export default router;`
3. Reiniciou o servidor

---

## 📖 Links Úteis

- Template completo: `src/funcionalidades/_TEMPLATE/`
- Documentação detalhada: `IMPLEMENTACAO_CONCLUIDA.md`
- Exemplos funcionais:
  - `src/funcionalidades/validacao/` (CPF)
  - `src/funcionalidades/calculo/` (Calculadora)
  - `src/funcionalidades/pdf/` (PDF)

---

## ✅ Checklist Final

Antes de testar sua funcionalidade:

- [ ] Arquivo `*Routes.js` existe?
- [ ] Tem `export default router;`?
- [ ] Controller usa `BaseController`?
- [ ] Validação está configurada (se necessário)?
- [ ] Servidor foi reiniciado?

**Se respondeu SIM para tudo → Sua funcionalidade está pronta!** 🎉

---

**Tempo total: ~5 minutos ⏱️**

**Dificuldade: 🟢 Fácil**

**Resultado: ✅ Funcionalidade completa e funcionando!**
