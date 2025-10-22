# 🎯 TEMPLATE - Como Criar Nova Funcionalidade# 🎯 TEMPLATE - Como Criar Nova Funcionalidade# 🎯 TEMPLATE - Como Criar Nova Funcionalidade



> **⏱️ Tempo estimado:** 5-10 minutos  

> **Versão da API:** 2.13.0  

> **Última atualização:** Janeiro de 2025> **⏱️ Tempo estimado:** 5-10 minutos  > **⏱️ Tempo estimado: 5-10 minutos**  



---> **Versão da API:** 2.12.0  > **Versão da API:** 2.12.0  



## 🔒 Sistema de Permissões (LEIA PRIMEIRO!)> **Última atualização:** Janeiro de 2025> **Última atualização:** 17 de outubro de 2025



Antes de criar sua funcionalidade, entenda quem pode acessá-la:



| Nível | Acesso |Este template contém tudo que você precisa para criar uma nova funcionalidade na API com **controle de permissões**.Este template contém tudo que você precisa para criar uma nova funcionalidade na API com **controle de permissões**.

|-------|--------|

| **GUEST** 👁️ | Apenas `/docs` - **NÃO pode usar functions** |

| **TRUSTED** 📝 | **Acesso total a TODAS as functions** |

| **ADMIN** 🔓 | Acesso total (functions + rotas administrativas) |------



### 🎯 Regra Principal:



**Por padrão, sua function será acessível para TRUSTED e ADMIN automaticamente!**## 🔒 IMPORTANTE: Sistema de Permissões## 🔒 Sistema de Permissões (IMPORTANTE!)



Você **NÃO precisa** adicionar middleware nas rotas. O sistema já cuida disso.



---### Entenda os 4 níveis de acesso:Antes de criar sua funcionalidade, entenda os **4 níveis de acesso**:



## ❓ FAQ: "Para quem será minha function?"



| Eu quero que... | O que fazer? || Nível | Símbolo | Pode Acessar | O que NÃO pode || Nível | Símbolo | Pode Acessar | Restrições |

|-----------------|--------------|

| **TRUSTED e ADMIN** acessem | ✅ **Nada!** (é o padrão) ||-------|---------|--------------|----------------||-------|---------|--------------|------------|

| **Só ADMIN** acesse | Adicione `requireAdmin` na rota |

| **GUEST** acesse | ❌ **Impossível** (GUEST só vê `/docs`) || **UNAUTHORIZED** | ❌ | Nada (bloqueado) | Tudo || **UNAUTHORIZED** | ❌ | Nada | Bloqueado pelo sistema |



---| **GUEST** | 👁️ | Apenas `/docs` | Functions, rotas administrativas || **GUEST** | 👁️ | Apenas `/docs` (documentação) | Não pode usar functions |



## 🚀 Guia Rápido (4 Passos)| **TRUSTED** | 📝 | `/docs` + **TODAS as functions** | Rotas administrativas (`/logs`, `/zerotier`, `/security`) || **TRUSTED** | � | `/docs` + **TODAS as functions** | Não pode acessar rotas administrativas |



### 1️⃣ Copie a pasta template| **ADMIN** | 🔓 | **Tudo** (sem restrições) | Nada || **ADMIN** | 🔓 | Tudo (sem restrições) | Controle total da API |



```powershell

# Execute na raiz do projeto

Copy-Item -Path "src/functions/_TEMPLATE" -Destination "src/functions/NOME_DA_SUA_FUNCTION" -Recurse### 🎯 Regras Importantes:### 🎯 Regras para Functions:

```



**Exemplo:** Criar function para gerar QR Code

```powershell✅ **TODAS as functions são automaticamente acessíveis para TRUSTED e ADMIN**  ✅ **TODAS as rotas de functions são automaticamente acessíveis para TRUSTED e ADMIN**  

Copy-Item -Path "src/functions/_TEMPLATE" -Destination "src/functions/qrcode" -Recurse

```❌ **GUEST não pode usar functions** (apenas visualiza documentação em `/docs`)  ❌ **GUEST não pode acessar nenhuma function (apenas visualiza documentação)**  



---✅ **Você NÃO precisa adicionar middleware de permissão nas rotas** (comportamento padrão)  ✅ **Você NÃO precisa adicionar middleware de permissão nas rotas**



### 2️⃣ Renomeie os arquivos⚠️ **Se quiser restringir algo só para ADMIN**, adicione `requireAdmin` na rota específica



```powershell---

cd src/functions/qrcode

---

# Renomear arquivos obrigatórios

Rename-Item "templateController.js" "qrcodeController.js"## 🚀 Passo a Passo Rápido

Rename-Item "templateRoutes.js" "qrcodeRoutes.js"

## ❓ Pergunta Frequente: "Para quem será minha function?"

# Opcional (só se precisar)

Rename-Item "templateUtils.js" "qrcodeUtils.js"



# Deletar README### 🎯 Resposta Rápida:

Remove-Item "README.md"

```### 1️⃣ Copie esta pasta



**Arquivos necessários:**| Eu quero que... | O que fazer? | Código |

- ✅ **`*Controller.js`** - OBRIGATÓRIO (lógica da function)

- ✅ **`*Routes.js`** - OBRIGATÓRIO (definição das rotas)|-----------------|--------------|--------|

- ❓ **`*Utils.js`** - OPCIONAL (só se tiver lógica complexa)

| **TRUSTED e ADMIN** acessem | ✅ Nada! (padrão) | `router.get('/rota', controller.metodo)` |

---

| **Só ADMIN** acesse | Adicione `requireAdmin` | `router.delete('/rota', requireAdmin, controller.metodo)` |```powershell------

### 3️⃣ Edite o Controller

| **Todos (GUEST)** acessem | ❌ Não é possível | GUEST só tem acesso a `/docs` |

Abra `qrcodeController.js` e implemente sua lógica:

# Windows (PowerShell) - Na raiz do projeto

```javascript

import { BaseController } from '../../core/BaseController.js';### 📝 Exemplos Práticos:



class QrcodeController extends BaseController {Copy-Item -Path "src/functions/_TEMPLATE" -Destination "src/functions/NOME_DA_SUA_FUNCIONALIDADE" -Recurse

    

    // Método de exemplo#### ✅ Exemplo 1: Function padrão (TRUSTED + ADMIN podem usar)

    async gerar(req, res) {

        return this.execute(req, res, async (req, res) => {```

            const { texto } = req.body;

            ```javascript

            // Sua lógica aqui

            const qrcode = `QR Code gerado para: ${texto}`;// suasRoutes.js## 🚀 Passo a Passo Rápido## 🚀 Passo a Passo Rápido

            

            // Retorna sucessoimport { Router } from 'express';

            return this.success(res, { qrcode }, 'QR Code gerado com sucesso');

        });import controller from './seuController.js';**Exemplo real:** Criar funcionalidade para gerar QR Code

    }

}



export default new QrcodeController();const router = Router();```powershell

```



**💡 Dicas:**

- Use `this.success(res, dados, mensagem)` para sucesso// TRUSTED e ADMIN podem acessar (comportamento padrão)Copy-Item -Path "src/functions/_TEMPLATE" -Destination "src/functions/qrcode" -Recurse

- Use `this.error(res, mensagem, statusCode)` para erro

- Use `this.execute()` para tratamento automático de errosrouter.get('/usuarios', controller.listarUsuarios);



---router.post('/usuarios', controller.criarUsuario);```### 1️⃣ Copie esta pasta### 1️⃣ Copie esta pasta



### 4️⃣ Edite as Routesrouter.put('/usuarios/:id', controller.atualizarUsuario);



Abra `qrcodeRoutes.js` e defina as rotas:router.delete('/usuarios/:id', controller.deletarUsuario);



```javascript

import { Router } from 'express';

import { validate } from '../../middlewares/validator.js';export default router;---

import qrcodeController from './qrcodeController.js';

// import { requireAdmin } from '../../middlewares/accessLevel.js'; // Descomente se precisar```



const router = Router();



// Schema de validação**✅ Vantagens:**

const gerarSchema = {

    required: ['texto'],- Código limpo e simples### 2️⃣ Decida quais arquivos você precisa```powershell```powershell

    types: { texto: 'string' },

    length: { texto: { min: 1, max: 500 } }- TRUSTED tem acesso total às functions

};

- Não precisa adicionar middlewares extras

// ✅ TRUSTED e ADMIN podem acessar (comportamento padrão)

router.post('/gerar', validate(gerarSchema), qrcodeController.gerar);



// 🔒 Se quiser que só ADMIN acesse, descomente requireAdmin:---| Arquivo | Quando usar | Obrigatório? |# Windows (PowerShell) - Na raiz do projeto# Windows (PowerShell) - Na raiz do projeto

// router.post('/gerar', requireAdmin, validate(gerarSchema), qrcodeController.gerar);



export default router;

```#### 🔒 Exemplo 2: Proteger apenas uma rota específica (DELETE só para ADMIN)|---------|-------------|--------------|



---



## 🎉 Pronto! Teste sua function```javascript| **`*Controller.js`** | Sempre! Contém a lógica da sua funcionalidade | ✅ **SIM** |Copy-Item -Path "src/functions/_TEMPLATE" -Destination "src/functions/NOME_DA_SUA_FUNCIONALIDADE" -RecurseCopy-Item -Path "src/functions/_TEMPLATE" -Destination "src/functions/NOME_DA_SUA_FUNCIONALIDADE" -Recurse



```powershell// suasRoutes.js

# Reinicie o servidor

npm startimport { Router } from 'express';| **`*Routes.js`** | Sempre! Define as rotas HTTP (GET, POST, etc.) | ✅ **SIM** |



# Teste com curlimport { requireAdmin } from '../../middlewares/accessLevel.js';

curl -X POST http://localhost:3000/api/qrcode/gerar `

  -H "Content-Type: application/json" `import controller from './seuController.js';| **`*Utils.js`** | Só se tiver funções auxiliares reutilizáveis | ❌ Não |``````

  -d '{\"texto\":\"Olá Mundo\"}'

```



Sua function estará **automaticamente acessível** para TRUSTED e ADMIN! 🚀const router = Router();| **`README.md`** | Opcional - documenta sua funcionalidade | ❌ Não |



---



## 📝 Exemplos Práticos// TRUSTED pode ver, criar e editar



### ✅ Exemplo 1: Function padrão (TRUSTED + ADMIN)router.get('/dados', controller.listar);



```javascriptrouter.post('/dados', controller.criar);---

// Não precisa adicionar nada!

router.get('/usuarios', controller.listar);router.put('/dados/:id', controller.editar);

router.post('/usuarios', controller.criar);

router.delete('/usuarios/:id', controller.deletar);**Exemplo real:** Criar funcionalidade para gerar QR Code**Exemplo real:** Criar funcionalidade para gerar QR Code

```

// Apenas ADMIN pode deletar

**Resultado:** TRUSTED e ADMIN podem usar todas as rotas.

router.delete('/dados/:id', requireAdmin, controller.deletar);### 3️⃣ Renomeie e customize os arquivos

---



### 🔒 Exemplo 2: DELETE só para ADMIN

export default router;```powershell```powershell

```javascript

import { requireAdmin } from '../../middlewares/accessLevel.js';```



// TRUSTED pode ver e criar#### 📄 Arquivos OBRIGATÓRIOS (sempre copie):

router.get('/dados', controller.listar);

router.post('/dados', controller.criar);**🔐 Quando usar:**



// Só ADMIN pode deletar- Operações críticas (DELETE, operações financeiras, etc.)Copy-Item -Path "src/functions/_TEMPLATE" -Destination "src/functions/qrcode" -RecurseCopy-Item -Path "src/functions/_TEMPLATE" -Destination "src/functions/qrcode" -Recurse

router.delete('/dados/:id', requireAdmin, controller.deletar);

```- Rotas que modificam configurações do sistema



**Resultado:** TRUSTED acessa GET/POST, mas só ADMIN acessa DELETE.- Endpoints que expõem dados sensíveis1. **`templateController.js`** → **`suaController.js`**



---



### 🔐 Exemplo 3: Function inteira só para ADMIN---   - Contém a lógica de negócio``````



```javascript

import { requireAdmin } from '../../middlewares/accessLevel.js';

#### 🔐 Exemplo 3: Function inteira só para ADMIN   - Usa `BaseController` para respostas padronizadas

// Todas as rotas exigem ADMIN

router.get('/secrets', requireAdmin, controller.listar);

router.post('/secrets', requireAdmin, controller.criar);

router.delete('/secrets/:id', requireAdmin, controller.deletar);```javascript   

```

// suasRoutes.js

**Resultado:** Apenas ADMIN pode usar esta function.

import { Router } from 'express';2. **`templateRoutes.js`** → **`suaRoutes.js`**

---

import { requireAdmin } from '../../middlewares/accessLevel.js';

## 🤔 Quando usar Utils.js?

import controller from './seuController.js';   - Define as rotas (GET, POST, PUT, DELETE)------

### ✅ USE Utils quando tiver:



| Situação | Exemplo |

|----------|---------|const router = Router();   - Adiciona validação nos endpoints

| **Cálculos complexos** | Validação de CPF, juros compostos |

| **Formatações** | Máscara de telefone, formatação de moeda |

| **Validações customizadas** | Regex complexos, validação de CNPJ |

| **Conversões** | XML para JSON, Base64, criptografia |// Todas as rotas exigem ADMIN

| **Código reutilizável** | Função usada em 3+ lugares |

router.get('/secrets', requireAdmin, controller.listarSecretos);

### ❌ NÃO use Utils para:

router.post('/secrets', requireAdmin, controller.criarSecreto);#### 📄 Arquivos OPCIONAIS (copie só se precisar):

| Situação | Por quê |

|----------|---------|router.delete('/secrets/:id', requireAdmin, controller.deletarSecreto);

| **CRUD simples** | `.filter()`, `.find()` são claros no controller |

| **Operações inline** | `.toUpperCase()`, `Number()` são autoexplicativas |### 2️⃣ Decida quais arquivos você precisa### 2️⃣ Decida quais arquivos você precisa

| **Lógica única** | Se usa só 1 vez, deixe no controller |

export default router;

---

```3. **`templateUtils.js`** → **`suaUtils.js`** *(opcional)*

## 📋 Checklist Final



Antes de considerar pronto, verifique:

**🔐 Quando usar:**   - Funções auxiliares complexas

- [ ] Arquivos renomeados (sem "template" no nome)

- [ ] Controller estende `BaseController`- Functions administrativas (gerenciar usuários, logs, etc.)

- [ ] Routes exporta `export default router`

- [ ] Validação configurada com `validate()`- Configurações críticas do sistema   - Validações customizadas

- [ ] Testou com curl ou Postman

- [ ] README.md do template foi deletado- Dados confidenciais (chaves API, credenciais, etc.)

- [ ] Servidor reiniciado (`npm start`)

   - Formatações especiais| Arquivo | Quando usar | Obrigatório? || Arquivo | Quando usar | Obrigatório? |

---

---

## 🆘 Problemas Comuns

   

### ❌ "Rota não encontrada (404)"

## 🚀 Guia Passo a Passo

**Soluções:**

1. Verifique se o arquivo termina com `Routes.js`   **⚠️ Copie APENAS SE:**|---------|-------------|--------------||---------|-------------|--------------|

2. Confirme que tem `export default router` no final

3. Reinicie o servidor### 1️⃣ Copie esta pasta



### ❌ "Erro de validação"   - Tiver lógica complexa reutilizável



**Soluções:**```powershell

1. Verifique o schema no Routes

2. Confira se os campos obrigatórios estão no body# Windows (PowerShell) - Execute na raiz do projeto   - Tiver cálculos matemáticos| **`*Controller.js`** | Sempre! Contém a lógica da sua funcionalidade | ✅ **SIM** || **`*Controller.js`** | Sempre! Contém a lógica da sua funcionalidade | ✅ **SIM** |

3. Veja os tipos de dados (string, number, etc.)

Copy-Item -Path "src/functions/_TEMPLATE" -Destination "src/functions/NOME_DA_SUA_FUNCIONALIDADE" -Recurse

### ❌ "Erro interno (500)"

```   - Tiver formatações de dados

**Soluções:**

1. Veja o console do servidor para stack trace

2. Verifique imports dos módulos

3. Confirme que BaseController foi importado**Exemplo real:** Criar funcionalidade para gerar QR Code   | **`*Routes.js`** | Sempre! Define as rotas HTTP (GET, POST, etc.) | ✅ **SIM** || **`*Routes.js`** | Sempre! Define as rotas HTTP (GET, POST, etc.) | ✅ **SIM** |



---



## 📖 Recursos Úteis```powershell   **❌ NÃO copie se:** Sua funcionalidade é simples (CRUD básico)



- **Documentação da API:** http://localhost:3000/docsCopy-Item -Path "src/functions/_TEMPLATE" -Destination "src/functions/qrcode" -Recurse

- **Dashboard de Logs:** http://localhost:3000/logs

- **Exemplo completo:** `src/functions/exemplo/````| **`*Utils.js`** | Só se tiver funções auxiliares reutilizáveis | ❌ Não || **`*Utils.js`** | Só se tiver funções auxiliares reutilizáveis | ❌ Não |

- **BaseController:** `src/core/BaseController.js`



---

---#### 🗑️ Arquivo para DELETAR:

## 🎓 Padrões de Código



### ✅ BOM - Use BaseController

### 2️⃣ Decida quais arquivos você precisa| **`README.md`** | Opcional - documenta sua funcionalidade | ❌ Não || **`README.md`** | Opcional - documenta sua funcionalidade | ❌ Não |

```javascript

async criar(req, res) {

    return this.execute(req, res, async (req, res) => {

        const item = await database.create(req.body);| Arquivo | Para que serve | Obrigatório? | Quando usar |4. **`README.md`** - Delete após ler este guia!

        return this.success(res, item, 'Item criado', 201);

    });|---------|----------------|--------------|-------------|

}

```| **`*Controller.js`** | Lógica da funcionalidade | ✅ **SIM** | Sempre |



### ❌ RUIM - Não use res.json diretamente| **`*Routes.js`** | Definir rotas HTTP | ✅ **SIM** | Sempre |



```javascript| **`*Utils.js`** | Funções auxiliares | ❌ Não | Lógica complexa, validações customizadas |---

async criar(req, res) {

    try {| **`README.md`** | Documentação | ❌ Não | Functions complexas que precisam de docs |

        const item = await database.create(req.body);

        res.status(201).json({ success: true, data: item });------

    } catch (error) {

        res.status(500).json({ success: false, error: error.message });#### 📄 Arquivos OBRIGATÓRIOS (sempre renomeie):

    }

}### 4️⃣ Edite o Controller

```

1. **`templateController.js`** → **`seuController.js`**

---

   - Contém a lógica de negócio

## 🎉 Estrutura Final

   - Usa `BaseController` para respostas padronizadas

Após seguir os passos, sua pasta deve estar assim:

Abra `suaController.js` e implemente sua lógica:

```

src/functions/qrcode/2. **`templateRoutes.js`** → **`suasRoutes.js`**

├── qrcodeController.js    # ✅ Lógica de negócio

├── qrcodeRoutes.js        # ✅ Definição de rotas   - Define as rotas (GET, POST, PUT, DELETE)### 3️⃣ Renomeie e customize os arquivos### 3️⃣ Renomeie e customize os arquivos

└── qrcodeUtils.js         # ❓ Opcional - funções auxiliares

```   - Adiciona validação nos endpoints



---```javascript



**🚀 Boa sorte com sua nova funcionalidade!**#### 📄 Arquivo OPCIONAL (copie só se precisar):



*Dúvidas? Consulte os exemplos em `src/functions/exemplo/` ou abra uma issue no GitHub.*import { BaseController } from '../../core/BaseController.js';


3. **`templateUtils.js`** → **`seusUtils.js`** *(opcional)*

   

   **✅ Copie SE:**

   - Tiver lógica complexa reutilizávelclass SuaController extends BaseController {#### 📄 Arquivos OBRIGATÓRIOS (sempre copie):#### 📄 Arquivos OBRIGATÓRIOS (sempre copie):

   - Tiver cálculos matemáticos

   - Tiver formatações especiais de dados    async seuMetodo(req, res) {

   - Tiver validações customizadas

           return this.execute(req, res, async (req, res) => {

   **❌ NÃO copie se:**

   - Sua funcionalidade é simples (CRUD básico)            const { parametro } = req.body;

   - Não tem lógica auxiliar

            1. **`templateController.js`** → **`suaController.js`**1. **`templateController.js`** → **`suaController.js`**

#### 🗑️ Arquivo para DELETAR:

            // Sua lógica aqui

4. **`README.md`** - Delete após ler este guia!

            const resultado = `Processado: ${parametro}`;   - Contém a lógica de negócio   - Contém a lógica de negócio

---

            

### 3️⃣ Renomeie os arquivos

            // Retorna sucesso   - Usa `BaseController` para respostas padronizadas   - Usa `BaseController` para respostas padronizadas

```powershell

# Exemplo: Criar function "qrcode"            return this.success(res, { resultado }, 'Operação realizada');

cd src/functions/qrcode

        });      

# Renomear Controller

Rename-Item "templateController.js" "qrcodeController.js"    }



# Renomear Routes}2. **`templateRoutes.js`** → **`suaRoutes.js`**2. **`templateRoutes.js`** → **`suaRoutes.js`**

Rename-Item "templateRoutes.js" "qrcodeRoutes.js"



# Renomear Utils (se precisar)

Rename-Item "templateUtils.js" "qrcodeUtils.js"export default new SuaController();   - Define as rotas (GET, POST, PUT, DELETE)   - Define as rotas (GET, POST, PUT, DELETE)



# Deletar README.md do template```

Remove-Item "README.md"

```   - Adiciona validação nos endpoints   - Adiciona validação nos endpoints



------



### 4️⃣ Edite o Controller



Abra `seuController.js` e implemente sua lógica:### 5️⃣ Edite as Routes



```javascript#### 📄 Arquivo OPCIONAL (copie só se precisar):#### 📄 Arquivos OPCIONAIS (copie só se precisar):

import { BaseController } from '../../core/BaseController.js';

Abra `suaRoutes.js` e defina suas rotas:

class SeuController extends BaseController {

    

    /**

     * Lista todos os registros```javascript

     * Acessível para: TRUSTED, ADMIN

     */import { Router } from 'express';3. **`templateUtils.js`** → **`suaUtils.js`** *(opcional)*3. **`templateUtils.js`** → **`suaUtils.js`** *(opcional)*

    async listar(req, res) {

        return this.execute(req, res, async (req, res) => {import suaController from './suaController.js';

            const dados = [

                { id: 1, nome: 'Exemplo 1' },import { validate } from '../../middlewares/validator.js';   - Funções auxiliares complexas   - Funções auxiliares complexas

                { id: 2, nome: 'Exemplo 2' }

            ];

            

            return this.success(res, dados, 'Listagem realizada com sucesso');const router = Router();   - Validações customizadas   - Validações customizadas

        });

    }

    

    /**// Schema de validação   - Formatações especiais   - Formatações especiais

     * Cria novo registro

     * Acessível para: TRUSTED, ADMINconst schema = {

     */

    async criar(req, res) {    required: ['parametro'],      

        return this.execute(req, res, async (req, res) => {

            const { nome } = req.body;    types: { parametro: 'string' }

            

            // Validação básica};   **⚠️ Copie APENAS SE:**   **⚠️ Copie APENAS SE:**

            if (!nome) {

                return this.error(res, 'Nome é obrigatório', 400);

            }

            // Rota   - Tiver lógica complexa reutilizável (cálculos, validações)   - Tiver lógica complexa reutilizável

            const novoRegistro = { id: 3, nome };

            router.post('/sua-rota', validate(schema), (req, res) => 

            return this.success(res, novoRegistro, 'Registro criado com sucesso', 201);

        });    suaController.seuMetodo(req, res)   - Tiver formatações de dados (máscaras, conversões)   - Tiver cálculos matemáticos

    }

    );

    /**

     * Atualiza registro existente   - Tiver funções usadas em vários lugares   - Tiver formatações de dados

     * Acessível para: TRUSTED, ADMIN

     */export default router;

    async atualizar(req, res) {

        return this.execute(req, res, async (req, res) => {```      

            const { id } = req.params;

            const { nome } = req.body;

            

            const atualizado = { id: parseInt(id), nome };---   **❌ NÃO copie se:** Sua funcionalidade é simples (CRUD básico)   **❌ NÃO copie se:** Sua funcionalidade é simples (CRUD básico)

            

            return this.success(res, atualizado, 'Registro atualizado com sucesso');

        });

    }### 6️⃣ Reinicie o servidor

    

    /**

     * Deleta registro

     * Acessível para: TRUSTED, ADMIN (ou só ADMIN se usar requireAdmin nas routes)```powershell#### 🗑️ Arquivo para DELETAR:---

     */

    async deletar(req, res) {npm start

        return this.execute(req, res, async (req, res) => {

            const { id } = req.params;```

            

            return this.success(res, { id: parseInt(id) }, 'Registro deletado com sucesso');

        });

    }**✨ Pronto! Sua funcionalidade estará disponível automaticamente!**4. **`README.md`** - Delete após ler este guia!### 4️⃣ Edite o Controller

}



export default new SeuController();

```---



**💡 Dicas:**



- Use `this.success()` para respostas de sucesso## 📚 Exemplos Práticos---Abra `suaController.js` e implemente sua lógica:

- Use `this.error()` para respostas de erro

- Use `this.execute()` para tratamento automático de erros

- Sempre documente o método com comentários

- Valide os dados antes de processar### 🎯 Exemplo 1: Funcionalidade SIMPLES (não precisa de Utils)



---



### 5️⃣ Edite as Routes**Objetivo:** Criar endpoint que ecoa uma mensagem### 4️⃣ Edite o Controller```javascript



Abra `suasRoutes.js` e defina suas rotas:



```javascript**Arquivos necessários:**import { BaseController } from '../../core/BaseController.js';

import { Router } from 'express';

import { requireAdmin } from '../../middlewares/accessLevel.js';- ✅ `echoController.js`

import { validate } from '../../middlewares/validator.js';

import seuController from './seuController.js';- ✅ `echoRoutes.js`Abra `suaController.js` e implemente sua lógica:



const router = Router();- ❌ ~~echoUtils.js~~ (NÃO precisa - lógica é simples)



/**class SuaController extends BaseController {

 * 🌐 Rotas da funcionalidade

 * ```javascript

 * Por padrão, TODAS as rotas são acessíveis para TRUSTED e ADMIN.

 * Para restringir a ADMIN, adicione requireAdmin.// echoController.js```javascript    async seuMetodo(req, res) {

 */

import { BaseController } from '../../core/BaseController.js';

// ✅ TRUSTED e ADMIN podem acessar

router.get('/', seuController.listar);import { BaseController } from '../../core/BaseController.js';        return this.execute(req, res, async (req, res) => {

router.get('/:id', seuController.buscarPorId);

router.post('/', validate(criarSchema), seuController.criar);class EchoController extends BaseController {

router.put('/:id', validate(atualizarSchema), seuController.atualizar);

    async ecoar(req, res) {            const { parametro } = req.body;

// 🔒 Apenas ADMIN pode deletar

router.delete('/:id', requireAdmin, seuController.deletar);        return this.execute(req, res, async (req, res) => {



export default router;            const { mensagem } = req.body;class SuaController extends BaseController {            



/**            

 * 📝 Schemas de validação (exemplo)

 */            // Lógica simples - não precisa de Utils    async seuMetodo(req, res) {            // Sua lógica aqui

const criarSchema = {

    body: {            const resultado = {

        nome: {

            type: 'string',                original: mensagem,        return this.execute(req, res, async (req, res) => {            const resultado = `Processado: ${parametro}`;

            required: true,

            minLength: 3,                eco: mensagem.toUpperCase(),

            maxLength: 100

        }                tamanho: mensagem.length            const { parametro } = req.body;            

    }

};            };



const atualizarSchema = {                                    // Retorna sucesso

    body: {

        nome: {            return this.success(res, resultado, 'Eco processado');

            type: 'string',

            required: false,        });            // Sua lógica aqui            return this.success(res, { resultado }, 'Operação realizada');

            minLength: 3,

            maxLength: 100    }

        }

    }}            const resultado = `Processado: ${parametro}`;        });

};

```



**💡 Dicas:**export default new EchoController();                }



- Use `validate()` para validação automática```

- Adicione `requireAdmin` apenas quando necessário

- Documente as rotas com comentários            // Retorna sucesso}

- Agrupe rotas por nível de permissão

```javascript

---

// echoRoutes.js            return this.success(res, { resultado }, 'Operação realizada');

### 6️⃣ (Opcional) Edite os Utils

import { Router } from 'express';

Se você copiou o arquivo `seusUtils.js`, edite-o:

import echoController from './echoController.js';        });export default new SuaController();

```javascript

/**import { validate } from '../../middlewares/validator.js';

 * Funções auxiliares para sua funcionalidade

 */    }```



/**const router = Router();

 * Formata dados para exibição

 * @param {Object} dados - Dados brutos}

 * @returns {Object} - Dados formatados

 */const echoSchema = {

export function formatarDados(dados) {

    return {    required: ['mensagem'],---

        ...dados,

        criadoEm: new Date(dados.createdAt).toLocaleDateString('pt-BR'),    types: { mensagem: 'string' },

        status: dados.ativo ? 'Ativo' : 'Inativo'

    };    length: { mensagem: { min: 1, max: 500 } }export default new SuaController();

}

};

/**

 * Valida dados antes de salvar```### 5️⃣ Edite as Routes

 * @param {Object} dados - Dados a validar

 * @returns {Object} - { valido: boolean, erros: string[] }router.post('/echo', validate(echoSchema), (req, res) => 

 */

export function validarDados(dados) {    echoController.ecoar(req, res)

    const erros = [];

    );

    if (!dados.nome || dados.nome.length < 3) {

        erros.push('Nome deve ter pelo menos 3 caracteres');---Abra `suaRoutes.js` e defina suas rotas:

    }

    export default router;

    return {

        valido: erros.length === 0,```

        erros

    };

}

```**Teste:**### 5️⃣ Edite as Routes```javascript



---```powershell



### 7️⃣ Teste sua funcionalidadecurl -X POST http://localhost:3000/echo `import { Router } from 'express';



#### 🧪 Usando cURL:  -H "Content-Type: application/json" `



```bash  -d '{"mensagem":"Olá Mundo"}'Abra `suaRoutes.js` e defina suas rotas:import suaController from './suaController.js';

# GET - Listar (TRUSTED pode acessar)

curl http://localhost:3000/api/sua-function```



# POST - Criar (TRUSTED pode acessar)import { validate } from '../../middlewares/validator.js';

curl -X POST http://localhost:3000/api/sua-function \

  -H "Content-Type: application/json" \---

  -d '{"nome":"Teste"}'

```javascript

# DELETE - Deletar (só ADMIN se tiver requireAdmin)

curl -X DELETE http://localhost:3000/api/sua-function/1### 🎯 Exemplo 2: Funcionalidade COMPLEXA (precisa de Utils)

```

import { Router } from 'express';const router = Router();

#### 📬 Usando Postman/Insomnia:

**Objetivo:** Validar CPF com formatação e cálculo de dígitos

1. Crie nova requisição

2. URL: `http://localhost:3000/api/sua-function`import suaController from './suaController.js';

3. Método: GET, POST, PUT ou DELETE

4. Teste com diferentes níveis de acesso:**Arquivos necessários:**

   - IP de GUEST (não deve funcionar)

   - IP de TRUSTED (deve funcionar)- ✅ `cpfController.js`import { validate } from '../../middlewares/validator.js';// Schema de validação

   - IP de ADMIN (deve funcionar sempre)

- ✅ `cpfRoutes.js`

---

- ✅ `cpfUtils.js` (SIM precisa - lógica complexa de validação)const schema = {

## 📚 Estrutura Final



Após seguir todos os passos, sua pasta deve estar assim:

```javascriptconst router = Router();    required: ['parametro'],

```

src/functions/sua-function/// cpfUtils.js - Funções auxiliares complexas

├── seuController.js    # ✅ Lógica de negócio

├── suasRoutes.js       # ✅ Definição de rotasexport function removerFormatacao(cpf) {    types: { parametro: 'string' }

├── seusUtils.js        # ❓ Opcional - funções auxiliares

└── README.md           # ❓ Opcional - documentação    return cpf.replace(/[^\d]/g, '');

```

}// Schema de validação};

---



## ⚠️ Checklist de Validação

export function validarDigitos(cpf) {const schema = {

Antes de considerar sua function pronta, verifique:

    const numeros = cpf.slice(0, 9);

- [ ] Todos os arquivos foram renomeados corretamente

- [ ] Controller implementa todos os métodos necessários    const digitos = cpf.slice(9);    required: ['parametro'],// Rota

- [ ] Routes define todas as rotas (GET, POST, PUT, DELETE)

- [ ] Validações estão configuradas com `validate()`    

- [ ] Permissões estão corretas (requireAdmin onde necessário)

- [ ] Testou com IP GUEST (deve bloquear)    // Cálculo do primeiro dígito    types: { parametro: 'string' }router.post('/sua-rota', validate(schema), (req, res) => 

- [ ] Testou com IP TRUSTED (deve permitir)

- [ ] Testou com IP ADMIN (deve permitir tudo)    let soma = 0;

- [ ] Erros retornam mensagens claras

- [ ] Sucesso retorna dados esperados    for (let i = 0; i < 9; i++) {};    suaController.seuMetodo(req, res)

- [ ] Código está comentado e documentado

        soma += parseInt(numeros[i]) * (10 - i);

---

    });

## 🎓 Conceitos Importantes

    const primeiroDigito = (soma * 10) % 11 % 10;

### 🔹 BaseController

    // Rota

Toda function deve estender `BaseController` para ter:

    // Cálculo do segundo dígito

- `this.success()` - Resposta de sucesso padronizada

- `this.error()` - Resposta de erro padronizada    soma = 0;router.post('/sua-rota', validate(schema), (req, res) => export default router;

- `this.execute()` - Tratamento automático de erros

    for (let i = 0; i < 10; i++) {

### 🔹 Middleware validateRouteAccess

        soma += parseInt(cpf[i]) * (11 - i);    suaController.seuMetodo(req, res)```

Este middleware (ativado globalmente) valida TODAS as requisições:

    }

- Verifica o nível de acesso do IP (GUEST, TRUSTED, ADMIN)

- Bloqueia automaticamente GUEST de acessar functions    const segundoDigito = (soma * 10) % 11 % 10;);

- Permite TRUSTED acessar todas as functions

- Permite ADMIN acessar tudo    



**Você NÃO precisa adicionar este middleware nas suas rotas!**    return digitos === `${primeiroDigito}${segundoDigito}`;---



### 🔹 Middleware requireAdmin}



Use quando quiser restringir uma rota específica:export default router;



```javascriptexport function formatarCPF(cpf) {

router.delete('/rota', requireAdmin, controller.metodo);

```    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');```### 6️⃣ Reinicie o servidor



Isso garante que apenas ADMIN possa acessar aquela rota.}



### 🔹 Middleware validate```



Use para validação automática de dados:



```javascript```javascript---```powershell

import { validate } from '../../middlewares/validator.js';

// cpfController.js - Usa as funções do Utils

const schema = {

    body: {import { BaseController } from '../../core/BaseController.js';npm start

        nome: { type: 'string', required: true },

        idade: { type: 'number', required: false, min: 18 }import { removerFormatacao, validarDigitos, formatarCPF } from './cpfUtils.js';

    }

};### 6️⃣ Reinicie o servidor```



router.post('/', validate(schema), controller.criar);class CPFController extends BaseController {

```

    async validar(req, res) {

---

        return this.execute(req, res, async (req, res) => {

## 🆘 Problemas Comuns

            const { cpf } = req.body;```powershell**✨ Pronto! Sua funcionalidade estará disponível automaticamente!**

### ❌ GUEST consegue acessar minha function

            

**Causa:** Isso NÃO deve acontecer. GUEST está limitado a `/docs`.

            // Usa as funções do Utilsnpm start

**Solução:** 

1. Verifique se o middleware `validateRouteAccess` está ativado no `server.js`            const cpfLimpo = removerFormatacao(cpf);

2. Confirme que o IP do GUEST está corretamente identificado

3. Verifique os logs para ver qual nível foi detectado            const valido = validarDigitos(cpfLimpo);```---



### ❌ TRUSTED não consegue acessar            const formatado = formatarCPF(cpfLimpo);



**Causa:** Rota pode estar bloqueada por `requireAdmin`            



**Solução:**             return this.success(res, {

1. Remova `requireAdmin` da rota se TRUSTED deve acessar

2. Verifique se o IP foi corretamente identificado como TRUSTED                cpfOriginal: cpf,**✨ Pronto! Sua funcionalidade estará disponível automaticamente!**## 📚 Exemplos Práticos

3. Verifique os logs de acesso

                cpfFormatado: formatado,

### ❌ Function não aparece na documentação

                valido: valido

**Causa:** Rota não foi registrada em `/api/functions`

            }, valido ? 'CPF válido' : 'CPF inválido');

**Solução:**

1. Reinicie o servidor (auto-carregamento detecta novas pastas)        });---### 🎯 Exemplo 1: Funcionalidade SIMPLES (não precisa de Utils)

2. Verifique se a pasta está em `src/functions/`

3. Confirme que o arquivo `*Routes.js` existe e exporta corretamente    }



---}



## 📖 Recursos Adicionais



- **Documentação da API:** http://localhost:3000/docsexport default new CPFController();## 📚 Exemplos Práticos**Objetivo:** Criar endpoint que ecoa uma mensagem

- **Dashboard de Logs:** http://localhost:3000/logs

- **Exemplo completo:** `src/functions/exemplo/````

- **Middleware accessLevel:** `src/middlewares/accessLevel.js`

- **BaseController:** `src/core/BaseController.js`



------



## 🎉 Pronto!### 🎯 Exemplo 1: Funcionalidade SIMPLES (não precisa de Utils)**Arquivos necessários:**



Sua funcionalidade está criada! Agora ela:## 🤔 Quando Usar Utils?



✅ É automaticamente acessível para TRUSTED e ADMIN  - ✅ `echoController.js`

✅ Está bloqueada para GUEST  

✅ Aparece automaticamente na documentação `/api/functions`  ### ✅ **USE Utils quando tiver:**

✅ Usa respostas padronizadas do BaseController  

✅ Tem tratamento de erros automático  **Objetivo:** Criar endpoint que ecoa uma mensagem- ✅ `echoRoutes.js`

✅ Está pronta para produção  

| Tipo de Lógica | Exemplo |

**Bom desenvolvimento! 🚀**

|----------------|---------|- ❌ ~~echoUtils.js~~ (NÃO precisa - lógica é simples)

| **Cálculos complexos** | Validação de CPF, juros compostos, distância entre coordenadas |

| **Formatações** | Máscara de telefone, formatação de moeda, datas |**Arquivos necessários:**

| **Validações customizadas** | Regex complexos, validação de CNPJ, CEP |

| **Conversões** | XML para JSON, Base64, criptografia |- ✅ `echoController.js````javascript

| **Operações reutilizáveis** | Função usada em 3+ lugares |

- ✅ `echoRoutes.js`// echoController.js

### ❌ **NÃO use Utils para:**

- ❌ ~~echoUtils.js~~ (NÃO precisa - lógica é simples)import { BaseController } from '../../core/BaseController.js';

| Tipo de Lógica | Por quê |

|----------------|---------|

| **CRUD simples** | Array.filter(), .find(), .map() são claros no controller |

| **Operações inline** | `text.toUpperCase()`, `Number(value)` são autoexplicativas |```javascriptclass EchoController extends BaseController {

| **Lógica única** | Se usa só 1 vez, deixe no controller |

| **Queries básicas** | SELECT, INSERT simples não precisam de abstração |// echoController.js    async ecoar(req, res) {



---import { BaseController } from '../../core/BaseController.js';        return this.execute(req, res, async (req, res) => {



## 🎨 Padrões de Código            const { mensagem } = req.body;



### ✅ Bom (use this.success e this.error)class EchoController extends BaseController {            

```javascript

async criarItem(req, res) {    async ecoar(req, res) {            // Lógica simples - não precisa de Utils

    return this.execute(req, res, async (req, res) => {

        const item = await database.create(req.body);        return this.execute(req, res, async (req, res) => {            const resultado = {

        return this.success(res, item, 'Item criado', 201);

    });            const { mensagem } = req.body;                original: mensagem,

}

```                            eco: mensagem.toUpperCase(),



### ❌ Ruim (não use res.json diretamente)            // Lógica simples - não precisa de Utils                tamanho: mensagem.length

```javascript

async criarItem(req, res) {            const resultado = {            };

    try {

        const item = await database.create(req.body);                original: mensagem,            

        res.status(201).json({ success: true, data: item });

    } catch (error) {                eco: mensagem.toUpperCase(),            return this.success(res, resultado, 'Eco processado');

        res.status(500).json({ success: false, error: error.message });

    }                tamanho: mensagem.length        });

}

```            };    }



---            }



## 📋 Checklist Final            return this.success(res, resultado, 'Eco processado');



Antes de testar, verifique:        });export default new EchoController();



- [ ] Arquivos renomeados corretamente (sem "template" no nome)    }```

- [ ] Controller estende `BaseController`

- [ ] Routes exporta `export default router`}

- [ ] Validação adicionada nas rotas sensíveis

- [ ] Código documentado com comentários```javascript

- [ ] Testado com curl ou Postman

- [ ] README.md do template foi deletadoexport default new EchoController();// echoRoutes.js



---```import { Router } from 'express';



## 🆘 Troubleshootingimport echoController from './echoController.js';



**Problema:** Rota não encontrada (404)```javascriptimport { validate } from '../../middlewares/validator.js';

- ✅ Verifique se o arquivo termina com `Routes.js`

- ✅ Verifique se tem `export default router` no final// echoRoutes.js

- ✅ Reinicie o servidor

import { Router } from 'express';const router = Router();

**Problema:** Erro de validação

- ✅ Verifique o schema no Routesimport echoController from './echoController.js';

- ✅ Confira se os campos obrigatórios estão no body

- ✅ Veja os tipos de dados (string, number, etc.)import { validate } from '../../middlewares/validator.js';const echoSchema = {



**Problema:** Erro interno (500)    required: ['mensagem'],

- ✅ Veja o console do servidor para stack trace

- ✅ Verifique imports dos módulosconst router = Router();    types: { mensagem: 'string' },

- ✅ Confira se BaseController foi importado corretamente

    length: { mensagem: { min: 1, max: 500 } }

---

const echoSchema = {};

## 📖 Referências Úteis

    required: ['mensagem'],

- **Exemplos reais:** Veja `src/functions/exemplo/` e `src/functions/pdf/`

- **BaseController:** `src/core/BaseController.js`    types: { mensagem: 'string' },router.post('/echo', validate(echoSchema), (req, res) => 

- **Validator:** `src/middlewares/validator.js`

- **Documentação Express:** [expressjs.com](https://expressjs.com/)    length: { mensagem: { min: 1, max: 500 } }    echoController.ecoar(req, res)



---};);



**🎉 Boa sorte com sua nova funcionalidade!**



*Dúvidas? Abra uma issue no GitHub ou consulte os exemplos existentes.*router.post('/echo', validate(echoSchema), (req, res) => export default router;


    echoController.ecoar(req, res)```

);

**Teste:**

export default router;```powershell

```curl -X POST http://localhost:3000/echo `

  -H "Content-Type: application/json" `

**Teste:**  -d '{"mensagem":"Olá Mundo"}'

```powershell```

curl -X POST http://localhost:3000/echo `

  -H "Content-Type: application/json" `---

  -d '{"mensagem":"Olá Mundo"}'

```### 🎯 Exemplo 2: Funcionalidade COMPLEXA (precisa de Utils)



---**Objetivo:** Validar CPF com formatação e cálculo de dígitos



### 🎯 Exemplo 2: Funcionalidade COMPLEXA (precisa de Utils)**Arquivos necessários:**

- ✅ `cpfController.js`

**Objetivo:** Validar CPF com formatação e cálculo de dígitos- ✅ `cpfRoutes.js`

- ✅ `cpfUtils.js` (SIM precisa - lógica complexa de validação)

**Arquivos necessários:**

- ✅ `cpfController.js````javascript

- ✅ `cpfRoutes.js`// cpfUtils.js - Funções auxiliares complexas

- ✅ `cpfUtils.js` (SIM precisa - lógica complexa de validação)export function removerFormatacao(cpf) {

    return cpf.replace(/[^\d]/g, '');

```javascript}

// cpfUtils.js - Funções auxiliares complexas

export function removerFormatacao(cpf) {export function validarDigitos(cpf) {

    return cpf.replace(/[^\d]/g, '');    const numeros = cpf.slice(0, 9);

}    const digitos = cpf.slice(9);

    

export function validarDigitos(cpf) {    // Cálculo do primeiro dígito

    const numeros = cpf.slice(0, 9);    let soma = 0;

    const digitos = cpf.slice(9);    for (let i = 0; i < 9; i++) {

            soma += parseInt(numeros[i]) * (10 - i);

    // Cálculo do primeiro dígito    }

    let soma = 0;    const primeiroDigito = (soma * 10) % 11 % 10;

    for (let i = 0; i < 9; i++) {    

        soma += parseInt(numeros[i]) * (10 - i);    // Cálculo do segundo dígito

    }    soma = 0;

    const primeiroDigito = (soma * 10) % 11 % 10;    for (let i = 0; i < 10; i++) {

            soma += parseInt(cpf[i]) * (11 - i);

    // Cálculo do segundo dígito    }

    soma = 0;    const segundoDigito = (soma * 10) % 11 % 10;

    for (let i = 0; i < 10; i++) {    

        soma += parseInt(cpf[i]) * (11 - i);    return digitos === `${primeiroDigito}${segundoDigito}`;

    }}

    const segundoDigito = (soma * 10) % 11 % 10;

    export function formatarCPF(cpf) {

    return digitos === `${primeiroDigito}${segundoDigito}`;    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

}}

```

export function formatarCPF(cpf) {

    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');```javascript

}// cpfController.js - Usa as funções do Utils

```import { BaseController } from '../../core/BaseController.js';

import { removerFormatacao, validarDigitos, formatarCPF } from './cpfUtils.js';

```javascript

// cpfController.js - Usa as funções do Utilsclass CPFController extends BaseController {

import { BaseController } from '../../core/BaseController.js';    async validar(req, res) {

import { removerFormatacao, validarDigitos, formatarCPF } from './cpfUtils.js';        return this.execute(req, res, async (req, res) => {

            const { cpf } = req.body;

class CPFController extends BaseController {            

    async validar(req, res) {            // Usa as funções do Utils

        return this.execute(req, res, async (req, res) => {            const cpfLimpo = removerFormatacao(cpf);

            const { cpf } = req.body;            const valido = validarDigitos(cpfLimpo);

                        const formatado = formatarCPF(cpfLimpo);

            // Usa as funções do Utils            

            const cpfLimpo = removerFormatacao(cpf);            return this.success(res, {

            const valido = validarDigitos(cpfLimpo);                cpfOriginal: cpf,

            const formatado = formatarCPF(cpfLimpo);                cpfFormatado: formatado,

                            valido: valido

            return this.success(res, {            }, valido ? 'CPF válido' : 'CPF inválido');

                cpfOriginal: cpf,        });

                cpfFormatado: formatado,    }

                valido: valido}

            }, valido ? 'CPF válido' : 'CPF inválido');

        });export default new CPFController();

    }```

}

---

export default new CPFController();

```## 🤔 Quando Usar Utils?



---### ✅ **USE Utils quando tiver:**



## 🤔 Quando Usar Utils?| Tipo de Lógica | Exemplo |

|----------------|---------|

### ✅ **USE Utils quando tiver:**| **Cálculos complexos** | Validação de CPF, juros compostos, distância entre coordenadas |

| **Formatações** | Máscara de telefone, formatação de moeda, datas |

| Tipo de Lógica | Exemplo || **Validações customizadas** | Regex complexos, validação de CNPJ, CEP |

|----------------|---------|| **Conversões** | XML para JSON, Base64, criptografia |

| **Cálculos complexos** | Validação de CPF, juros compostos, distância entre coordenadas || **Operações reutilizáveis** | Função usada em 3+ lugares |

| **Formatações** | Máscara de telefone, formatação de moeda, datas |

| **Validações customizadas** | Regex complexos, validação de CNPJ, CEP |### ❌ **NÃO use Utils para:**

| **Conversões** | XML para JSON, Base64, criptografia |

| **Operações reutilizáveis** | Função usada em 3+ lugares || Tipo de Lógica | Por quê |

|----------------|---------|

### ❌ **NÃO use Utils para:**| **CRUD simples** | Array.filter(), .find(), .map() são claros no controller |

| **Operações inline** | `text.toUpperCase()`, `Number(value)` são autoexplicativas |

| Tipo de Lógica | Por quê || **Lógica única** | Se usa só 1 vez, deixe no controller |

|----------------|---------|| **Queries básicas** | SELECT, INSERT simples não precisam de abstração |

| **CRUD simples** | Array.filter(), .find(), .map() são claros no controller |

| **Operações inline** | `text.toUpperCase()`, `Number(value)` são autoexplicativas |---

| **Lógica única** | Se usa só 1 vez, deixe no controller |

| **Queries básicas** | SELECT, INSERT simples não precisam de abstração |## 🎨 Padrões de Código



---### ✅ Bom (use this.success e this.error)

```javascript

## 🎨 Padrões de Códigoasync criarItem(req, res) {

    return this.execute(req, res, async (req, res) => {

### ✅ Bom (use this.success e this.error)        const item = await database.create(req.body);

```javascript        return this.success(res, item, 'Item criado', 201);

async criarItem(req, res) {    });

    return this.execute(req, res, async (req, res) => {}

        const item = await database.create(req.body);```

        return this.success(res, item, 'Item criado', 201);

    });### ❌ Ruim (não use res.json diretamente)

}```javascript

```async criarItem(req, res) {

    try {

### ❌ Ruim (não use res.json diretamente)        const item = await database.create(req.body);

```javascript        res.status(201).json({ success: true, data: item });

async criarItem(req, res) {    } catch (error) {

    try {        res.status(500).json({ success: false, error: error.message });

        const item = await database.create(req.body);    }

        res.status(201).json({ success: true, data: item });}

    } catch (error) {```

        res.status(500).json({ success: false, error: error.message });

    }---

}

```## 📋 Checklist Final



---Antes de testar, verifique:



## 📋 Checklist Final- [ ] Arquivos renomeados corretamente (sem "template" no nome)

- [ ] Controller estende `BaseController`

Antes de testar, verifique:- [ ] Routes exporta `export default router`

- [ ] Validação adicionada nas rotas sensíveis

- [ ] Arquivos renomeados corretamente (sem "template" no nome)- [ ] Código documentado com comentários

- [ ] README.md do template foi deletado- [ ] Testado com curl ou Postman

- [ ] Controller estende `BaseController`

- [ ] Routes exporta `export default router`---

- [ ] Validação adicionada nas rotas sensíveis

- [ ] Código documentado com comentários## 🆘 Troubleshooting

- [ ] Testado com curl ou Postman

**Problema:** Rota não encontrada (404)

---- ✅ Verifique se o arquivo termina com `Routes.js`

- ✅ Verifique se tem `export default router` no final

## 🆘 Troubleshooting- ✅ Reinicie o servidor



**Problema:** Rota não encontrada (404)**Problema:** Erro de validação

- ✅ Verifique se o arquivo termina com `Routes.js`- ✅ Verifique o schema no Routes

- ✅ Verifique se tem `export default router` no final- ✅ Confira se os campos obrigatórios estão no body

- ✅ Reinicie o servidor- ✅ Veja os tipos de dados (string, number, etc.)



**Problema:** Erro de validação**Problema:** Erro interno (500)

- ✅ Verifique o schema no Routes- ✅ Veja o console do servidor para stack trace

- ✅ Confira se os campos obrigatórios estão no body- ✅ Verifique imports dos módulos

- ✅ Veja os tipos de dados (string, number, etc.)- ✅ Confira se BaseController foi importado corretamente



**Problema:** Erro interno (500)---

- ✅ Veja o console do servidor para stack trace

- ✅ Verifique imports dos módulos## 📖 Referências Úteis

- ✅ Confira se BaseController foi importado corretamente

- **Exemplos reais:** Veja `src/functions/exemplo/` e `src/functions/pdf/`

---- **BaseController:** `src/core/BaseController.js`

- **Validator:** `src/middlewares/validator.js`

## 📖 Referências Úteis- **Documentação Express:** [expressjs.com](https://expressjs.com/)



- **Exemplos reais:** Veja `src/functions/exemplo/` e `src/functions/pdf/`---

- **BaseController:** `src/core/BaseController.js`

- **Validator:** `src/middlewares/validator.js`**🎉 Boa sorte com sua nova funcionalidade!**

- **Documentação Express:** [expressjs.com](https://expressjs.com/)

*Dúvidas? Abra uma issue no GitHub ou consulte os exemplos existentes.*

---

---

**🎉 Boa sorte com sua nova funcionalidade!**

## 📝 Convenções e Boas Práticas

*Dúvidas? Abra uma issue no GitHub ou consulte os exemplos existentes.*

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
