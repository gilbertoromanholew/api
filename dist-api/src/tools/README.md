# 🔧 Ferramentas Auto-Discovered (V9)

Esta pasta contém **todas as ferramentas da plataforma**.

## 🎯 Como funciona?

O sistema de **Auto-Discovery** escaneia esta pasta automaticamente e registra todas as ferramentas no Express.

**ZERO** necessidade de editar `server.js` manualmente! ✨

---

## 📁 Estrutura de uma Ferramenta

```
tools/
└── {slug}/                          ← Nome da ferramenta (kebab-case)
    ├── {slug}Routes.js              ← Rotas (OBRIGATÓRIO)
    ├── {slug}Controller.js          ← Controlador (OBRIGATÓRIO)
    ├── {slug}Service.js             ← Lógica de negócio (OBRIGATÓRIO)
    ├── README.md                    ← Documentação (opcional)
    └── tests/                       ← Testes (opcional)
        └── {slug}.test.js
```

### Exemplo: `consulta-cnpj/`

```
tools/
└── consulta-cnpj/
    ├── consultaCnpjRoutes.js        ← Exporta { router, config }
    ├── consultaCnpjController.js    ← Funções do controller
    ├── consultaCnpjService.js       ← Lógica da API ReceitaWS
    └── README.md
```

---

## ✅ Checklist: Criar Nova Ferramenta

### 1. Criar pasta
```bash
mkdir tools/{slug}
```

### 2. Criar arquivos obrigatórios

**{slug}Routes.js**:
```javascript
import express from 'express';
import { requireAuth } from '../../middlewares/adminAuth.js';
import * as controller from './{slug}Controller.js';

const router = express.Router();

export const config = {
    slug: '{slug}',
    name: '{Nome da Ferramenta}',
    version: '1.0.0'
};

router.post('/execute', requireAuth, controller.execute);

export { router };
```

**{slug}Controller.js**:
```javascript
import * as service from './{slug}Service.js';
import { supabaseAdmin } from '../../config/supabase.js';

export async function execute(req, res) {
    try {
        const userId = req.user.id;
        
        // 1. Buscar custo da ferramenta
        const { data: tool } = await supabaseAdmin
            .from('tools_catalog')
            .select('cost_in_points, id')
            .eq('slug', '{slug}')
            .single();
        
        // 2. Deduzir pontos
        const { error: debitError } = await supabaseAdmin.rpc('debit_credits', {
            p_user_id: userId,
            p_amount: tool.cost_in_points,
            p_reason: 'Uso da ferramenta: {Nome}'
        });
        
        if (debitError) {
            return res.status(400).json({ error: 'Saldo insuficiente' });
        }
        
        // 3. Executar lógica
        const resultado = await service.processar(req.body);
        
        // 4. Registrar execução
        await supabaseAdmin.from('tools_executions').insert({
            user_id: userId,
            tool_id: tool.id,
            points_used: tool.cost_in_points,
            input_data: req.body,
            output_data: resultado,
            success: true
        });
        
        return res.json({ success: true, resultado });
        
    } catch (error) {
        console.error('[{slug}] Erro:', error);
        return res.status(500).json({ error: error.message });
    }
}
```

**{slug}Service.js**:
```javascript
export async function processar(dados) {
    // Sua lógica aqui
    const resultado = {
        // Processar dados de entrada
    };
    
    return resultado;
}
```

### 3. Reiniciar servidor

```bash
# A ferramenta será detectada automaticamente! ✨
npm run dev
```

---

## 🔍 Validação de Estrutura

Use o helper de validação:

```javascript
import { validateToolStructure } from './utils/autoLoadTools.js';

const validation = await validateToolStructure('consulta-cnpj');
console.log(validation);
```

Resultado:
```json
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "files": {
    "consultaCnpjRoutes.js": "✅ Existe",
    "consultaCnpjController.js": "✅ Existe",
    "consultaCnpjService.js": "✅ Existe"
  }
}
```

---

## 📊 Listar Ferramentas Carregadas

```javascript
import { listAvailableTools } from './utils/autoLoadTools.js';

const tools = await listAvailableTools();
console.table(tools);
```

---

## 🚨 Troubleshooting

### Ferramenta não aparece
- ✅ Verificar nome da pasta (kebab-case)
- ✅ Verificar nome dos arquivos ({slug}Routes.js)
- ✅ Verificar export { router } no Routes.js

### Erro "Cannot find module"
- ✅ Verificar imports relativos (../../middlewares/)
- ✅ Verificar extensão .js nos imports

### Rota não funciona
- ✅ Verificar se middleware requireAuth está aplicado
- ✅ Verificar logs do servidor (console.log)

---

## 📚 Ferramentas Existentes

| Slug | Nome | Status |
|------|------|--------|
| `exemplo-test` | Exemplo de Teste V9 | ✅ Operacional |

---

## 🎓 Boas Práticas

1. **Nomenclatura**: Use kebab-case para slugs (`calculo-fgts`, não `calculoFgts`)
2. **Validação**: Sempre valide entrada em Controller antes de Service
3. **Logs**: Use `console.log('[{slug}] ...')` para facilitar debug
4. **Erros**: Capture TODOS erros e retorne JSON padronizado
5. **Documentação**: Crie README.md explicando a ferramenta
6. **Testes**: Crie testes unitários em `tests/{slug}.test.js`

---

## 🔐 Segurança

- ✅ **SEMPRE** use `requireAuth` middleware
- ✅ **SEMPRE** use `supabaseAdmin.rpc('debit_credits')` para deduzir pontos
- ✅ **SEMPRE** registre execução em `tools_executions`
- ❌ **NUNCA** confie em dados do frontend sem validação
- ❌ **NUNCA** retorne dados sensíveis desnecessários

---

## 📖 Documentação Completa

- [Guia de Segurança JWT + RLS](../../docs/database/GUIA_SEGURANCA_JWT_RLS.md)
- [Arquitetura V9](../../docs/V9_AUTO_DISCOVERY_README.md)
- [Status da Implementação](../../docs/STATUS_IMPLEMENTACAO_V9.md)

---

**Última atualização**: 26/10/2025  
**Versão**: V9 Alpha
