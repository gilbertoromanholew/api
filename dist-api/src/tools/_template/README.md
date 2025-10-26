# 📂 Template de Ferramenta - BACKEND

## 🎯 O Que É Esta Pasta?

Esta é a pasta **_template** do **BACKEND** (Node.js/Express).

Contém arquivos modelo para criar novas ferramentas manualmente.

---

## 📋 Arquivos Nesta Pasta

| Arquivo | Função |
|---------|--------|
| `NOME_FERRAMENTARoutes.js` | Define rotas + configuração (auto-discovery) |
| `NOME_FERRAMENTAController.js` | Busca custo, debita pontos, registra execução |
| `NOME_FERRAMENTAService.js` | **Lógica de negócio** (você implementa aqui) |
| `README.md` | Este arquivo (instruções) |

---

## 🚀 Como Criar Ferramenta Manualmente

### **Opção 1: Usar Script Automático** (RECOMENDADO)

```powershell
cd "c:\Users\Gilberto Silva\Documents\GitHub"
.\create-tool.ps1
```

O script cria **TUDO AUTOMATICAMENTE** (backend + frontend + SQL).

---

### **Opção 2: Criar Manualmente** (Se não quiser usar script)

#### **Passo 1: Copiar Template**

```powershell
# Substituir 'minha_ferramenta' pelo slug desejado
cd "c:\Users\Gilberto Silva\Documents\GitHub\api\dist-api\src\tools"
Copy-Item -Recurse _template minha_ferramenta
```

#### **Passo 2: Renomear Arquivos**

```powershell
cd minha_ferramenta

# Renomear (substituir NOME_FERRAMENTA pelo nome em camelCase)
Rename-Item "NOME_FERRAMENTARoutes.js" "minhaFerramentaRoutes.js"
Rename-Item "NOME_FERRAMENTAController.js" "minhaFerramentaController.js"
Rename-Item "NOME_FERRAMENTAService.js" "minhaFerramentaService.js"
```

#### **Passo 3: Editar Routes.js**

Abrir `minhaFerramentaRoutes.js` e alterar:

```javascript
// ANTES
export const config = {
    slug: 'SLUG_FERRAMENTA',
    name: 'Nome da Ferramenta',
    // ...
};

// DEPOIS
export const config = {
    slug: 'minha_ferramenta',           // ⚠️ DEVE SER IGUAL ao Supabase
    name: 'Minha Ferramenta',
    description: 'Faz algo incrível',
    category: 'Utilitários',
    // ...
};
```

Alterar imports:
```javascript
// ANTES
import * as controller from './NOME_FERRAMENTAController.js';

// DEPOIS
import * as controller from './minhaFerramentaController.js';
```

#### **Passo 4: Editar Controller.js**

Abrir `minhaFerramentaController.js` e alterar imports:

```javascript
// ANTES
import * as service from './NOME_FERRAMENTAService.js';
import { config } from './NOME_FERRAMENTARoutes.js';

// DEPOIS
import * as service from './minhaFerramentaService.js';
import { config } from './minhaFerramentaRoutes.js';
```

Adicionar validações específicas:
```javascript
// Na função execute(), substituir:
if (!inputData) {
    return res.status(400).json({
        error: 'Dados de entrada são obrigatórios'
    });
}

// Por validações específicas:
if (!inputData.campo1 || !inputData.campo2) {
    return res.status(400).json({
        error: 'Campos campo1 e campo2 são obrigatórios'
    });
}
```

#### **Passo 5: Implementar Service.js** (PRINCIPAL)

Abrir `minhaFerramentaService.js` e implementar lógica:

```javascript
export async function processar(dados) {
    // 1. Validar
    const { campo1, campo2 } = dados;
    if (!campo1 || !campo2) {
        throw new Error('Campos obrigatórios');
    }

    // 2. Processar
    const resultado = campo1 + campo2; // Exemplo

    // 3. Retornar
    return {
        entrada: { campo1, campo2 },
        resultado: { valor: resultado },
        observacoes: ['Cálculo realizado com sucesso']
    };
}
```

#### **Passo 6: Cadastrar no Supabase**

```sql
INSERT INTO tools_catalog (
  slug,
  name,
  description,
  category,
  icon,
  cost_in_points,
  is_active
) VALUES (
  'minha_ferramenta',          -- ⚠️ MESMO SLUG do Routes.js
  'Minha Ferramenta',
  'Descrição detalhada',
  'Utilitários',
  '🛠️',
  30,
  true
);
```

**⚠️ CRÍTICO**: O campo `slug` no Supabase **DEVE SER IGUAL** ao `config.slug` no Routes.js.

#### **Passo 7: Testar**

```powershell
cd "c:\Users\Gilberto Silva\Documents\GitHub\api\dist-api"
node server.js
```

Deve aparecer:
```
✅ minha_ferramenta ← minha_ferramenta\minhaFerramentaRoutes.js
```

Testar endpoint:
```powershell
curl http://localhost:3000/api/tools/minha_ferramenta/info
```

---

## 🔗 Ligação Backend ↔ Supabase

### **Coluna que Liga Tudo: `slug`**

```
BACKEND (Routes.js)                 SUPABASE (tools_catalog)
===================                 ========================

export const config = {             slug: 'calc_juros'
  slug: 'calc_juros',       ←────→  name: 'Cálculo de Juros'
  name: 'Cálculo de Juros'          cost_in_points: 30
}                                   is_active: true
```

**Fluxo**:
1. Backend usa `config.slug` para buscar ferramenta no Supabase
2. Controller faz: `SELECT * FROM tools_catalog WHERE slug = 'calc_juros'`
3. Retorna `id`, `cost_in_points`, etc.
4. Usa `cost_in_points` para debitar do usuário
5. Usa `id` para registrar em `tools_executions`

---

## ✅ Checklist de Criação

- [ ] Copiar pasta `_template` para `nome_ferramenta/`
- [ ] Renomear arquivos (Routes, Controller, Service)
- [ ] Editar `Routes.js`: alterar `config.slug` e `config.name`
- [ ] Editar `Controller.js`: atualizar imports
- [ ] Implementar `Service.js`: lógica de negócio
- [ ] Cadastrar no Supabase (`slug` IGUAL ao Routes)
- [ ] Reiniciar servidor (auto-discovery carrega)
- [ ] Testar endpoint `/info`
- [ ] Criar frontend (ver `tools-website-builder/src/tools/_template/`)

---

## 📊 Estrutura de Pasta

```
minha_ferramenta/
├── minhaFerramentaRoutes.js       ← Config + Rotas (auto-discovery)
├── minhaFerramentaController.js   ← Dedução + Auditoria
└── minhaFerramentaService.js      ← ⚠️ LÓGICA (você implementa)
```

---

## 🆘 Problemas Comuns

### "Ferramenta não encontrada no catálogo"
✅ **Solução**: Verificar se `config.slug` (Routes.js) = `slug` (Supabase)

### "Auto-discovery não carrega"
✅ **Solução**: Verificar se existe `export const config` no Routes.js

### "Saldo insuficiente"
✅ **Solução**: Adicionar créditos ao usuário no Supabase

---

## 🔗 Próximo Passo

Após criar backend, **criar frontend**:
- Pasta: `tools-website-builder/src/tools/_template/`
- README: `tools-website-builder/src/tools/_template/README.md`
