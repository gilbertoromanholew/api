# 🚀 Quick Reference - API Modular

> **Referência rápida para IAs**  
> **Leia `AI_INSTRUCTIONS.md` para detalhes completos**

---

## ⚡ TL;DR

- ✅ **Adicione functions** em `src/functions/` seguindo o template
- ❌ **NÃO toque** em `src/core/*`, `server.js`, `src/middlewares/*`
- ✅ **Use BaseController** sempre
- ❌ **NÃO use `res.json()`** diretamente

---

## 🎯 Como Adicionar Nova Feature (4 Passos)

### 1. Copie o template
```powershell
Copy-Item -Path "src/functions/_TEMPLATE" -Destination "src/functions/minhaFeature" -Recurse
cd src/functions/minhaFeature
Rename-Item "templateController.js" "minhaFeatureController.js"
Rename-Item "templateRoutes.js" "minhaFeatureRoutes.js"
Remove-Item "README.md"
```

### 2. Controller
```javascript
import { BaseController } from '../../core/BaseController.js';

class MinhaFeatureController extends BaseController {
    async metodo(req, res) {
        return this.execute(req, res, async (req, res) => {
            const resultado = { dados: '...' };
            return this.success(res, resultado, 'Sucesso');
        });
    }
}

export default new MinhaFeatureController();
```

### 3. Routes
```javascript
import { Router } from 'express';
import { validate } from '../../middlewares/validator.js';
import controller from './minhaFeatureController.js';

const router = Router();

const schema = {
    required: ['campo'],
    types: { campo: 'string' }
};

router.get('/', controller.listar);
router.post('/', validate(schema), controller.criar);

export default router;
```

### 4. Teste
```bash
npm start
curl http://localhost:3000/api/minhaFeature
```

---

## 🔒 Sistema de Permissões

| Nível | Acesso |
|-------|--------|
| **GUEST** 👁️ | Apenas `/docs` |
| **TRUSTED** 📝 | `/docs` + **TODAS as functions** |
| **ADMIN** 🔑 | **Tudo** |

**Por padrão:** Functions são acessíveis para TRUSTED e ADMIN.

**Para restringir só para ADMIN:**
```javascript
import { requireAdmin } from '../../middlewares/accessLevel.js';
router.delete('/rota', requireAdmin, controller.deletar);
```

---

## ❌ NÃO MODIFIQUE

```
❌ src/core/BaseController.js
❌ src/core/routeLoader.js
❌ server.js
❌ src/config/allowedIPs.js (estrutura)
❌ src/middlewares/ipFilter.js
❌ src/middlewares/accessLevel.js
❌ src/middlewares/errorHandler.js
❌ src/utils/accessLogger.js
```

---

## ✅ PODE MODIFICAR

```
✅ src/functions/* (adicionar novas pastas)
✅ package.json (adicionar dependências, atualizar versão)
✅ CHANGELOG.md (documentar mudanças)
✅ README.md (atualizar documentação)
```

---

## 📏 Padrões Obrigatórios

### ✅ BOM
```javascript
class MeuController extends BaseController {
    async metodo(req, res) {
        return this.execute(req, res, async (req, res) => {
            return this.success(res, dados, 'Mensagem');
        });
    }
}
```

### ❌ RUIM
```javascript
class MeuController {
    async metodo(req, res) {
        res.json({ data: {} });  // ❌ NÃO!
    }
}
```

---

## 🔧 Validação de Dados

```javascript
const schema = {
    required: ['nome', 'email'],
    types: {
        nome: 'string',
        email: 'string',
        idade: 'number'
    },
    length: {
        nome: { min: 3, max: 100 }
    },
    enum: {
        tipo: ['A', 'B', 'C']
    }
};

router.post('/', validate(schema), controller.criar);
```

---

## 🐛 Troubleshooting Rápido

### Rota não encontrada (404)
- Arquivo termina com `Routes.js`?
- Tem `export default router`?
- Reiniciou o servidor?

### Erro de validação
- Schema correto?
- Campos obrigatórios no body?
- Tipos corretos? (`'string'`, `'number'`)

### IP bloqueado
- IP está na whitelist?
- Muitas tentativas negadas?
- Verificar `/api/security/ip-status/:ip`

---

## 📚 Recursos

- **Instruções completas:** `AI_INSTRUCTIONS.md`
- **Template:** `src/functions/_TEMPLATE/README.md`
- **Exemplo:** `src/functions/exemplo/`
- **Docs:** http://localhost:3000/docs
- **Dashboard:** http://localhost:3000/logs

---

**🎯 Regra de Ouro:** Se não tem certeza, não modifique! Adicione em `src/functions/`.
